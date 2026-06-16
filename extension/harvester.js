/**
 * IdeaMeow Harvester Content Script
 * ------------------------------------
 * Isolates its floating trigger button in a Shadow DOM to prevent host styles
 * from tampering with its exquisite visual appearance.
 */

(function () {
  let activeButtonContainer = null;

  // Determine which AI platform is being harvested from based on URL
  function getSource() {
    const hostname = window.location.hostname;
    if (hostname.includes('chatgpt') || hostname.includes('openai')) return 'chatgpt';
    if (hostname.includes('kimi')) return 'kimi';
    if (hostname.includes('doubao')) return 'doubao';
    if (hostname.includes('deepseek')) return 'deepseek';
    if (hostname.includes('gemini')) return 'gemini';
    if (hostname.includes('claude')) return 'claude';
    return 'other';
  }

  // Generate a random UUID
  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'sf-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Clear existing active button
  function removeActiveButton() {
    if (activeButtonContainer) {
      activeButtonContainer.remove();
      activeButtonContainer = null;
    }
  }

  // Handle mousup event
  document.addEventListener('mouseup', function (event) {
    // Small delay to let selection settle
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';

      if (!text) {
        // If clicking outside and not selecting anything, remove button
        if (activeButtonContainer && !activeButtonContainer.contains(event.target)) {
          removeActiveButton();
        }
        return;
      }

      // Check if mouseup was inside the active button container itself
      if (activeButtonContainer && activeButtonContainer.contains(event.target)) {
        return;
      }

      removeActiveButton();

      // Find selection position
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) return;

        createFloatingButton(rect, text);
      } catch (err) {
        console.error('IdeaMeow Harvester range error:', err);
      }
    }, 50);
  });

  // Handle mousedown to dismiss button on click elsewhere
  document.addEventListener('mousedown', function (event) {
    if (activeButtonContainer && !activeButtonContainer.contains(event.target)) {
      // Do not remove immediately, allow mouseup callback to handle it to avoid racing conditions
    }
  });

  function createFloatingButton(rect, text) {
    const container = document.createElement('div');
    container.id = 'scriptforge-harvester-host';
    container.style.position = 'fixed';
    
    // Position floating container slightly above the selection center
    const buttonHeight = 32;
    const top = rect.top + window.scrollY - buttonHeight - 8;
    const left = rect.left + window.scrollX + (rect.width / 2) - 50;

    container.style.top = `${Math.max(10, rect.top - buttonHeight - 8)}px`;
    container.style.left = `${Math.max(10, rect.left + (rect.width / 2) - 60)}px`;
    container.style.zIndex = '999999999';
    container.style.pointerEvents = 'auto';

    // Create shadow DOM for full style safety
    const shadow = container.attachShadow({ mode: 'open' });

    // Floating Button UI implementation with smooth motion and Tailwind-equivalent styling
    const style = document.createElement('style');
    style.textContent = `
      .button-wrapper {
        display: flex;
        align-items: center;
        background: #1e293b;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 9999px;
        padding: 4px 10px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        user-select: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        text-wrap: nowrap;
        animation: scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        transform-origin: bottom center;
      }
      .button-wrapper:hover {
        background: #0f172a;
        transform: translateY(-1px);
        border-color: #475569;
      }
      .button-wrapper:active {
        transform: translateY(1px);
      }
      .logo {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);
        color: white;
        font-size: 10px;
        font-weight: 900;
        border-radius: 50%;
        margin-right: 6px;
      }
      .status {
        color: #38bdf8;
        font-weight: 600;
        margin-left: 2px;
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8) translateY(6px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `;

    const button = document.createElement('div');
    button.className = 'button-wrapper';
    
    // Set internal button markup
    button.innerHTML = `
      <span class="logo">SF</span>
      <span>🐾 喵一下</span>
    `;

    button.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();

      const source = getSource();
      const snippet = {
        id: generateUUID(),
        source: source,
        content: text,
        timestamp: Date.now(),
        status: 'unread'
      };

      // Push snippet to storage
      chrome.storage.local.get({ scriptforge_snippets: [] }, function (data) {
        const snippets = data.scriptforge_snippets || [];
        snippets.push(snippet);
        
        chrome.storage.local.set({ scriptforge_snippets: snippets }, function () {
          // Success animation on floating button
          button.innerHTML = `<span class="logo" style="background: #22c55e;">✓</span><span class="status">🐾 喵！已叼走！</span>`;
          button.style.borderColor = '#22c55e';
          button.style.background = '#065f46';
          
          setTimeout(() => {
            removeActiveButton();
          }, 800);
        });
      });
    });

    shadow.appendChild(style);
    shadow.appendChild(button);
    document.body.appendChild(container);
    activeButtonContainer = container;
  }
})();
