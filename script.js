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
    const panelId = btn.getAttribute('data-tab');
    const panel = document.getElementById(panelId);

    btn.classList.add('active');
    panel?.classList.add('active');

    if (setFocus) {
      btn.focus();
    } else {
      btn.blur();
    }

    currentTabIndex = index;
    localStorage.setItem(storageKey, index);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = (currentTabIndex + 1) % tabButtons.length;
      activateTab(nextIndex, true);
    }
  });

  tabButtons.forEach((btn, idx) =>
    btn.addEventListener('click', () => activateTab(idx))
  );

  activateTab(currentTabIndex);
}
setupTabNavigation();
