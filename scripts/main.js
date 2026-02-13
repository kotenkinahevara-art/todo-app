import { initTaskForm } from './modules/task-form/controller.js';
import { loadTasks } from './modules/task-manager.js';
import { addTaskToList, toggleEmptyState } from './modules/task-card.js';
import { initTaskViewSwitcher } from './modules/task-view-switcher.js';
import { initLanguageSwitcher } from './modules/language-switcher.js';
import { initI18n, onI18nChange } from './i18n/index.js';
import { isIOS } from './utils/platform.js';

const clearTaskLists = () => {
  const activeList = document.getElementById('active-tasks-list');
  const completedList = document.getElementById('completed-tasks-list');

  activeList?.replaceChildren();
  completedList?.replaceChildren();
};

const renderTasks = () => {
  clearTaskLists();

  const tasks = loadTasks();
  tasks.forEach((task) => {
    addTaskToList(task);
  });

  toggleEmptyState();
};

// Initialize the app
const initApp = () => {
  initI18n();
  initLanguageSwitcher();
  if (isIOS()) {
    document.documentElement.classList.add('is-ios');
  }

  // Initialize task form
  initTaskForm();
  initTaskViewSwitcher();
  renderTasks();

  onI18nChange(() => {
    renderTasks();
  });
};

initApp();
