/**
 * IdeaMeow 灵感喵 - Popup Script
 * --------------------------------------
 * Extension popup UI for managing custom URL patterns.
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const addBtn = document.getElementById('addBtn');
  const customList = document.getElementById('customList');
  const statusMsg = document.getElementById('statusMsg');

  // Show status message
  function showStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.className = 'status-msg ' + (type || 'success');
    setTimeout(() => {
      statusMsg.className = 'status-msg';
    }, 2500);
  }

  // Render custom URL list
  function renderList(urls) {
    customList.innerHTML = '';
    if (!urls || urls.length === 0) {
      customList.innerHTML = '<li class="empty-hint">暂无自定义网址，在上方添加</li>';
      return;
    }
    urls.forEach(url => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = url;
      const delBtn = document.createElement('button');
      delBtn.textContent = '删除';
      delBtn.className = 'btn btn-danger btn-sm';
      delBtn.addEventListener('click', () => removeUrl(url));
      li.appendChild(span);
      li.appendChild(delBtn);
      customList.appendChild(li);
    });
  }

  // Load custom URLs from storage
  function loadUrls() {
    chrome.runtime.sendMessage({ type: 'GET_CUSTOM_URLS' }, (response) => {
      if (response && response.urls) {
        renderList(response.urls);
      }
    });
  }

  // Add a custom URL
  function addUrl() {
    const url = urlInput.value.trim();
    if (!url) {
      showStatus('请输入要添加的网址', 'error');
      return;
    }

    chrome.runtime.sendMessage({ type: 'ADD_CUSTOM_URL', url }, (response) => {
      if (response.success) {
        urlInput.value = '';
        renderList(response.urls);
        showStatus('已添加！刷新目标网页即可生效', 'success');
      } else {
        showStatus(response.error || '添加失败', 'error');
      }
    });
  }

  // Remove a custom URL
  function removeUrl(url) {
    chrome.runtime.sendMessage({ type: 'REMOVE_CUSTOM_URL', url }, (response) => {
      if (response.success) {
        renderList(response.urls);
        showStatus('已移除', 'success');
      } else {
        showStatus('移除失败', 'error');
      }
    });
  }

  // Event listeners
  addBtn.addEventListener('click', addUrl);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addUrl();
  });

  // Initial load
  loadUrls();
});
