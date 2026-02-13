const tabSelector = '.tasks-view__tab';
const panelSelector = '.tasks-view__panel';
const TAB_ACTIVE = 'tasks-view__tab_state_active';
const PANEL_ACTIVE = 'tasks-view__panel_state_active';

const updateView = (view, tabs, panels) => {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.view === view;
    tab.classList.toggle(TAB_ACTIVE, isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.tabIndex = isActive ? 0 : -1;
  });

  panels.forEach((panel) => {
    const isTarget = panel.dataset.viewPanel === view;
    panel.classList.toggle(PANEL_ACTIVE, isTarget);
    panel.hidden = !isTarget;
  });
};

const getActiveIndex = (tabs) => {
  const explicit = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
  if (explicit !== -1) return explicit;
  const byClass = tabs.findIndex((tab) => tab.classList.contains(TAB_ACTIVE));
  return byClass !== -1 ? byClass : 0;
};

export const initTaskViewSwitcher = () => {
  const tabs = Array.from(document.querySelectorAll(`${tabSelector}[data-view]`));
  const panels = Array.from(document.querySelectorAll(`${panelSelector}[data-view-panel]`));

  if (!tabs.length || !panels.length) {
    return;
  }

  const handleClick = (tab) => updateView(tab.dataset.view, tabs, panels);

  const handleKeydown = (event, index) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    let nextIndex = index;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    const nextTab = tabs[nextIndex];
    nextTab.focus();
    updateView(nextTab.dataset.view, tabs, panels);
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => handleClick(tab));
    tab.addEventListener('keydown', (event) => handleKeydown(event, tabs.indexOf(tab)));
  });

  const initialIndex = getActiveIndex(tabs);
  updateView(tabs[initialIndex]?.dataset.view ?? 'active', tabs, panels);
};
