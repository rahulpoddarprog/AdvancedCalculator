// Theme Toggle
function setupThemeToggle() {
  const html = document.documentElement;
  const toggleBtn = document.getElementById('theme-toggle');

  if (localStorage.theme === 'dark') {
    html.classList.add('dark-theme');
  }
  toggleBtn?.addEventListener('click', () => {
    const isDark = html.classList.toggle('dark-theme');
    localStorage.theme = isDark ? 'dark' : 'light';
  });
}
setupThemeToggle();

// History Toggle
function setupHistoryToggle() {
  const toggleBtn = document.getElementById('history-toggle');
  const storageKey = 'historyOpen';
  let isOpen = localStorage.getItem(storageKey) === 'true';

  const updateUI = () => {
    const activePanel = document.querySelector('.tab-panel.active');
    const historyBox = activePanel?.querySelector('.history-box');
    if (!historyBox) return;
    historyBox.classList.toggle('open', isOpen);
    toggleBtn?.classList.toggle('active', isOpen);
  };

  toggleBtn?.addEventListener('click', () => {
    isOpen = !isOpen;
    localStorage.setItem(storageKey, isOpen);
    updateUI();
  });
  document.addEventListener('tabChange', updateUI);
  updateUI();
}
setupHistoryToggle();

// Tab Navigation
function setupTabNavigation() {
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const tabPanels = document.querySelectorAll('.tab-panel');
  const storageKey = 'activeTabIndex';

  let currentTabIndex = parseInt(localStorage.getItem(storageKey), 10);
  if (isNaN(currentTabIndex) || currentTabIndex >= tabButtons.length) {
    currentTabIndex = 0;
  }

  function activateTab(index, setFocus = false) {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    const btn = tabButtons[index];
    const panel = document.getElementById(btn.getAttribute('data-tab'));

    btn.classList.add('active');
    panel?.classList.add('active');
    document.dispatchEvent(new Event('tabChange'));

    if (setFocus) btn.focus();
    else btn.blur();
    currentTabIndex = index;
    localStorage.setItem(storageKey, index);
  }

  tabButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => activateTab(idx));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      activateTab((currentTabIndex + 1) % tabButtons.length, true);
    }
  });
  activateTab(currentTabIndex);
}
setupTabNavigation();

// History Management
function setupHistory() {
  // Load existing history for all tab panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const ul = panel.querySelector('.history-box ul');
    if (!ul) return;

    const savedHistory = JSON.parse(localStorage.getItem(`${panel.id}-history`) || '[]');
    savedHistory.forEach(entry => {
      const li = document.createElement('li');
      li.textContent = entry;
      ul.appendChild(li);
    });
  });

  document.querySelectorAll('.clear-history').forEach(btn => {
    btn.addEventListener('click', () => {
      const historyBox = btn.closest('.history-box');
      const parentPanel = btn.closest('.tab-panel');
      if (!historyBox || !parentPanel) return;

      const ul = historyBox.querySelector('ul');
      if (ul) ul.innerHTML = '';

      localStorage.removeItem(`${parentPanel.id}-history`);
    });
  });
}
setupHistory();

function saveHistory(panelId, entry) {
  const key = `${panelId}-history`;
  const history = JSON.parse(localStorage.getItem(key) || '[]');

  history.push(entry);
  localStorage.setItem(key, JSON.stringify(history));

  const panel = document.getElementById(panelId);
  const ul = panel?.querySelector('.history-box ul');
  if (ul) {
    const li = document.createElement('li');
    li.textContent = entry;
    ul.appendChild(li);
  }
}
