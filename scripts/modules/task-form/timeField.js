import { getEmptyValue } from './formatters.js';
import { closeExpandable, openExpandable } from './expandable.js';
import { onI18nChange, t } from '../../i18n/index.js';

const COLLAPSE_MS = 280;

const markSelectedOption = (list, value) => {
  if (!(list instanceof HTMLElement)) return;

  list.querySelectorAll('.task-form__time-option').forEach((option) => {
    const isSelected = option instanceof HTMLButtonElement && option.dataset.value === value;
    option.classList.toggle('is-selected', isSelected);
    if (option instanceof HTMLButtonElement) {
      option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    }
  });
};

export const createTimeField = (dom) => {
  const {
    timeInlineWrap,
    timeGroup,
    timeTrigger,
    timeInput,
    timeText,
    timeConfirmButton,
    hourList,
    minuteList,
  } = dom;

  let selectedHour = null;
  let selectedMinute = null;
  let collapseTimerId = null;

  const getOptions = (list) => (
    list ? Array.from(list.querySelectorAll('.task-form__time-option')) : []
  );

  const focusOption = (list, value) => {
    const options = getOptions(list);
    const target = options.find((option) => option.dataset.value === value) ?? options[0];
    if (target instanceof HTMLButtonElement) {
      target.focus();
    }
  };

  const isOpen = () => Boolean(timeInlineWrap && !timeInlineWrap.hidden);

  const syncTimeView = () => {
    if (!timeText || !timeInput) return;

    if (selectedHour === null || selectedMinute === null) {
      timeText.textContent = getEmptyValue();
      timeInput.value = '';
      return;
    }

    const value = `${selectedHour}:${selectedMinute}`;
    timeText.textContent = value;
    timeInput.value = value;
  };

  const syncSelectionFromInput = () => {
    if (!timeInput?.value) {
      selectedHour = null;
      selectedMinute = null;
      markSelectedOption(hourList, null);
      markSelectedOption(minuteList, null);
      syncTimeView();
      return;
    }

    const [hours, minutes] = timeInput.value.split(':');
    selectedHour = hours ?? null;
    selectedMinute = minutes ?? null;
    markSelectedOption(hourList, selectedHour);
    markSelectedOption(minuteList, selectedMinute);
    syncTimeView();
  };

  const open = () => {
    if (!timeInlineWrap || !timeGroup || !timeTrigger) return;

    if (collapseTimerId) {
      window.clearTimeout(collapseTimerId);
      collapseTimerId = null;
    }

    syncSelectionFromInput();
    openExpandable(timeInlineWrap);
    timeGroup.classList.add('is-expanded');
    timeTrigger.setAttribute('aria-expanded', 'true');
    focusOption(hourList, selectedHour);
  };

  const close = () => {
    closeExpandable(timeInlineWrap);
    if (timeTrigger) timeTrigger.setAttribute('aria-expanded', 'false');

    if (collapseTimerId) {
      window.clearTimeout(collapseTimerId);
    }

    collapseTimerId = window.setTimeout(() => {
      if (timeGroup && (!timeInlineWrap || timeInlineWrap.hidden)) {
        timeGroup.classList.remove('is-expanded');
      }
      collapseTimerId = null;
    }, COLLAPSE_MS);
  };

  const toggle = () => {
    if (isOpen()) {
      close();
      return false;
    }

    open();
    return true;
  };

  const reset = () => {
    close();
    selectedHour = null;
    selectedMinute = null;
    markSelectedOption(hourList, null);
    markSelectedOption(minuteList, null);

    if (timeText) {
      timeText.textContent = getEmptyValue();
    }
    if (timeInput) {
      timeInput.value = '';
    }
  };

  const confirm = () => {
    if (selectedHour === null || selectedMinute === null) return;

    syncTimeView();
    close();
  };

  const buildTimeOptions = () => {
    if (!(hourList instanceof HTMLElement) || !(minuteList instanceof HTMLElement)) return;

    hourList.innerHTML = '';
    minuteList.innerHTML = '';
    hourList.setAttribute('role', 'listbox');
    hourList.setAttribute('aria-label', t('task.hours'));
    minuteList.setAttribute('role', 'listbox');
    minuteList.setAttribute('aria-label', t('task.minutes'));

    for (let hour = 0; hour < 24; hour += 1) {
      const value = String(hour).padStart(2, '0');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'task-form__time-option';
      button.dataset.value = value;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.textContent = value;

      button.addEventListener('click', () => {
        selectedHour = value;
        markSelectedOption(hourList, value);
        syncTimeView();
      });

      hourList.append(button);
    }

    for (let minute = 0; minute < 60; minute += 1) {
      const value = String(minute).padStart(2, '0');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'task-form__time-option';
      button.dataset.value = value;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.textContent = value;

      button.addEventListener('click', () => {
        selectedMinute = value;
        markSelectedOption(minuteList, value);
        syncTimeView();
      });

      minuteList.append(button);
    }

    const bindListKeyboard = (list, onSelect) => {
      if (!list || list._a11yBound) return;

      list.addEventListener('keydown', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;
        if (!target.classList.contains('task-form__time-option')) return;

        const options = getOptions(list);
        const currentIndex = options.indexOf(target);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % options.length;
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + options.length) % options.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = options.length - 1;
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(target.dataset.value ?? '');
          return;
        } else if (event.key === 'Escape') {
          event.preventDefault();
          close();
          timeTrigger?.focus();
          return;
        } else {
          return;
        }

        event.preventDefault();
        options[nextIndex]?.focus();
      });

      list._a11yBound = true;
    };

    bindListKeyboard(hourList, (value) => {
      if (!value) return;
      selectedHour = value;
      markSelectedOption(hourList, value);
      syncTimeView();
    });

    bindListKeyboard(minuteList, (value) => {
      if (!value) return;
      selectedMinute = value;
      markSelectedOption(minuteList, value);
      syncTimeView();
    });
  };

  const init = () => {
    buildTimeOptions();
    syncSelectionFromInput();

    const hourTitle = document.querySelector('.task-form__time-column:first-child .task-form__time-column-title');
    const minuteTitle = document.querySelector('.task-form__time-column:last-child .task-form__time-column-title');

    const updateTexts = () => {
      if (hourTitle) hourTitle.textContent = t('task.hours');
      if (minuteTitle) minuteTitle.textContent = t('task.minutes');
      if (timeConfirmButton) timeConfirmButton.textContent = t('task.choose_time');
      if (hourList) hourList.setAttribute('aria-label', t('task.hours'));
      if (minuteList) minuteList.setAttribute('aria-label', t('task.minutes'));
      if (timeInlineWrap) {
        timeInlineWrap.setAttribute('role', 'region');
        timeInlineWrap.setAttribute('aria-label', t('task.time'));
      }
    };

    updateTexts();

    timeConfirmButton?.addEventListener('click', confirm);
    timeInput?.addEventListener('change', syncSelectionFromInput);

    onI18nChange(updateTexts);
  };

  return {
    init,
    open,
    close,
    toggle,
    reset,
    isOpen,
    confirm,
  };
};
