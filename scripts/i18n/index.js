import { DEFAULT_LOCALE, LOCALES, SUPPORTED_LOCALES } from './locales.js';

const LOCALE_STORAGE_KEY = 'todo-locale';
const I18N_CHANGE_EVENT = 'i18n:change';

let currentLocale = DEFAULT_LOCALE;

const getValueByPath = (source, path) => (
  path.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), source)
);

const safeLocale = (value) => (SUPPORTED_LOCALES.includes(value) ? value : DEFAULT_LOCALE);

const setText = (selector, key) => {
  const element = document.querySelector(selector);
  if (!element) return;
  element.textContent = t(key);
};

const setAttr = (selector, attr, key) => {
  const element = document.querySelector(selector);
  if (!element) return;
  element.setAttribute(attr, t(key));
};

const applyTemplateTranslations = () => {
  const template = document.getElementById('task-card-template');
  if (!(template instanceof HTMLTemplateElement)) return;

  const content = template.content;
  content.querySelector('.task-card__edit-button')?.setAttribute('aria-label', t('task.edit_aria'));
  content.querySelector('.task-card__delete-button')?.setAttribute('aria-label', t('task.delete_aria'));
  content.querySelector('.task-card__complete-button')?.setAttribute('aria-label', t('task.complete_aria'));

  const deleteText = content.querySelector('.task-card__delete-text');
  if (deleteText) {
    deleteText.textContent = t('task.delete');
  }

  const completeText = content.querySelector('.task-card__complete-text');
  if (completeText) {
    completeText.textContent = t('task.complete_action');
  }
};

const applyStaticTranslations = () => {
  document.documentElement.lang = currentLocale;
  document.title = t('app.title');

  setText('.header__title', 'app.title');
  setAttr('.tasks', 'aria-label', 'tasks.manage_aria');
  setText('.tasks .section-title', 'tasks.section_title');
  setText('.tasks__add-button-text', 'tasks.add_new');

  setText('#task-title-label', 'task.title');
  setAttr('#task-title', 'aria-label', 'task.title');
  setText('.task-form__field_type_description .task-form__field-label', 'task.description');
  setAttr('#task-description', 'aria-label', 'task.description');
  setText('.task-form__field_type_priority .task-form__field-label', 'task.priority');

  setText('.task-form__date-group .task-form__field-label', 'task.date');
  setText('.task-form__time-group .task-form__field-label', 'task.time');
  setText('#confirm-task-date', 'task.choose_date');
  setText('#confirm-task-time', 'task.choose_time');
  setText('#cancel-task-form', 'task.cancel');
  setText('.task-form__action-button_theme_add[type="submit"]', 'task.add');

  setAttr('.tasks-view__tabs', 'aria-label', 'tasks.view_aria');
  const tabs = document.querySelectorAll('.tasks-view__tab');
  if (tabs[0]) tabs[0].textContent = t('tasks.active_tab');
  if (tabs[1]) tabs[1].textContent = t('tasks.completed_tab');

  const panelTitles = document.querySelectorAll('.tasks-view__panel-title');
  if (panelTitles[0]) panelTitles[0].textContent = t('tasks.active_tab');
  if (panelTitles[1]) panelTitles[1].textContent = t('tasks.completed_tab');

  setText('.active-tasks__empty', 'tasks.active_empty');
  setText('.completed-tasks__empty', 'tasks.completed_empty');

  setText('[data-locale="ru"]', 'language.ru');
  setText('[data-locale="en"]', 'language.en');
  setAttr('.language-switcher', 'aria-label', 'language.switcher_aria');

  applyTemplateTranslations();
};

export const t = (key) => {
  const activeMessages = LOCALES[currentLocale] ?? LOCALES[DEFAULT_LOCALE];
  const fallbackMessages = LOCALES[DEFAULT_LOCALE];

  const direct = getValueByPath(activeMessages, key);
  if (typeof direct === 'string') {
    return direct;
  }

  const fallback = getValueByPath(fallbackMessages, key);
  return typeof fallback === 'string' ? fallback : key;
};

export const getLocale = () => currentLocale;

export const setLocale = (nextLocale, options = {}) => {
  const { persist = true } = options;
  const locale = safeLocale(nextLocale);

  currentLocale = locale;
  if (persist) {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }

  applyStaticTranslations();
  window.dispatchEvent(new CustomEvent(I18N_CHANGE_EVENT, { detail: { locale } }));
  return locale;
};

export const initI18n = () => {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  const browser = navigator.language?.slice(0, 2)?.toLowerCase();
  const initial = safeLocale(stored ?? browser ?? DEFAULT_LOCALE);
  setLocale(initial, { persist: false });
};

export const onI18nChange = (handler) => {
  window.addEventListener(I18N_CHANGE_EVENT, handler);
};
