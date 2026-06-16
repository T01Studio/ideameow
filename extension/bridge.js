/**
 * IdeaMeow Harvester Bridge Script
 * -----------------------------------
 * Injected on IdeaMeow WebApp pages (localhost, .run.app, .github.io)
 * to stream snippets from chrome.storage.local to the WebApp via postMessage.
 */

(function () {
  console.log('IdeaMeow Harvester Bridge active on domain:', window.location.origin);

  // Syncs and streams stored snippets to the WebApp
  function syncSnippetsToWebapp() {
    chrome.storage.local.get({ scriptforge_snippets: [] }, function (data) {
      const snippets = data.scriptforge_snippets || [];
      if (snippets.length === 0) return;

      console.log(`IdeaMeow Bridge found ${snippets.length} snippets to forward.`);

      // Stream each snippet using the requested window.postMessage protocol
      snippets.forEach((snippet) => {
        window.postMessage({
          type: 'SCRIPTFORGE_NEW_SNIPPET',
          payload: snippet
        }, '*');
      });

      // Clear the local queue in chrome.storage after processing to avoid duplicate transmissions
      chrome.storage.local.set({ scriptforge_snippets: [] }, function () {
        console.log('IdeaMeow Bridge successfully cleared local snippet queue.');
      });
    });
  }

  // 1. Check immediately on page load
  setTimeout(syncSnippetsToWebapp, 1500);

  // 2. React to dynamic storage changes (when harvester adds a snippet while workspace is open)
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local' && changes.scriptforge_snippets) {
      const newValue = changes.scriptforge_snippets.newValue || [];
      if (newValue.length > 0) {
        console.log('IdeaMeow Bridge received storage update. Streaming new content...');
        syncSnippetsToWebapp();
      }
    }
  });

  // 3. Keep a ping endpoint so the web app can easily query if extension is active
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'SCRIPTFORGE_PING_EXTENSION') {
      window.postMessage({
        type: 'SCRIPTFORGE_PONG_EXTENSION',
        payload: { active: true, version: '1.0.0' }
      }, '*');
    }
  });
})();
