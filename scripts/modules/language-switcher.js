import { getLocale, onI18nChange, setLocale } from '../i18n/index.js';

const ACTIVE_CLASS = 'language-switcher__button_state_active';

const syncButtonsState = (root) => {
  const current = getLocale();
  root.querySelectorAll('.language-switcher__button[data-locale]').forEach((button) => {
    const isActive = button.dataset.locale === current;
    button.classList.toggle(ACTIVE_CLASS, isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
};

export const initLanguageSwitcher = () => {
  const root = document.querySelector('.language-switcher');
  if (!(root instanceof HTMLElement)) return;

  root.querySelectorAll('.language-switcher__button[data-locale]').forEach((button) => {
    button.addEventListener('click', () => {
      setLocale(button.dataset.locale);
    });
  });

  onI18nChange(() => syncButtonsState(root));
  syncButtonsState(root);
};
