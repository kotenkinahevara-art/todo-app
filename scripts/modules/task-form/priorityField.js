import { closeExpandable, openExpandable } from './expandable.js';
import { t } from '../../i18n/index.js';

const COLLAPSE_MS = 280;

const PRIORITY_OPTIONS = [
  { value: 'high', key: 'priority.high' },
  { value: 'medium', key: 'priority.medium' },
  { value: 'low', key: 'priority.low' },
];

const getPriorityLabel = (value) => {
  const match = PRIORITY_OPTIONS.find((option) => option.value === value);
  return t(match?.key ?? PRIORITY_OPTIONS[1].key);
};

const markSelectedOption = (list, value) => {
  if (!(list instanceof HTMLElement)) return;

  list.querySelectorAll('.task-form__priority-option').forEach((option) => {
    const isSelected = option instanceof HTMLButtonElement && option.dataset.value === value;
    option.classList.toggle('is-selected', isSelected);
    if (option instanceof HTMLButtonElement) {
      option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    }
  });
};

export const createPriorityField = (dom) => {
  const {
    priorityInlineWrap,
    priorityGroup,
    priorityTrigger,
    priorityInput,
    priorityText,
    priorityList,
  } = dom;

  let collapseTimerId = null;

  const getOptions = () => (
    priorityList ? Array.from(priorityList.querySelectorAll('.task-form__priority-option')) : []
  );

  const focusOption = (value) => {
    const options = getOptions();
    const target = options.find((option) => option.dataset.value === value) ?? options[0];
    if (target instanceof HTMLButtonElement) {
      target.focus();
    }
  };

  const getValue = () => {
    if (!priorityInput?.value || !PRIORITY_OPTIONS.some((option) => option.value === priorityInput.value)) {
      return 'medium';
    }
    return priorityInput.value;
  };

  const syncView = () => {
    const value = getValue();

    if (priorityInput) {
      priorityInput.value = value;
    }
    if (priorityText) {
      priorityText.textContent = getPriorityLabel(value);
    }

    markSelectedOption(priorityList, value);
  };

  const isOpen = () => Boolean(priorityInlineWrap && !priorityInlineWrap.hidden);

  const open = () => {
    if (!priorityInlineWrap || !priorityGroup || !priorityTrigger) return;

    if (collapseTimerId) {
      window.clearTimeout(collapseTimerId);
      collapseTimerId = null;
    }

    syncView();
    openExpandable(priorityInlineWrap);
    priorityGroup.classList.add('is-expanded');
    priorityTrigger.setAttribute('aria-expanded', 'true');
    focusOption(getValue());
  };

  const close = () => {
    closeExpandable(priorityInlineWrap);
    if (priorityTrigger) {
      priorityTrigger.setAttribute('aria-expanded', 'false');
    }

    if (collapseTimerId) {
      window.clearTimeout(collapseTimerId);
    }

    collapseTimerId = window.setTimeout(() => {
      if (priorityGroup && (!priorityInlineWrap || priorityInlineWrap.hidden)) {
        priorityGroup.classList.remove('is-expanded');
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

  const setValue = (value) => {
    if (!priorityInput) return;

    priorityInput.value = value;
    syncView();
  };

  const reset = () => {
    setValue('medium');
    close();
  };

  const buildOptions = () => {
    if (!(priorityList instanceof HTMLElement)) return;

    priorityList.innerHTML = '';
    priorityList.setAttribute('role', 'listbox');
    priorityList.setAttribute('aria-label', t('task.priority'));

    PRIORITY_OPTIONS.forEach(({ value, key }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'task-form__priority-option';
      button.dataset.value = value;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.textContent = t(key);

      button.addEventListener('click', () => {
        setValue(value);
        close();
      });

      priorityList.append(button);
    });

    if (!priorityList._a11yBound) {
      priorityList.addEventListener('keydown', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;
        if (!target.classList.contains('task-form__priority-option')) return;

        const options = getOptions();
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
          target.click();
          return;
        } else if (event.key === 'Escape') {
          event.preventDefault();
          close();
          priorityTrigger?.focus();
          return;
        } else {
          return;
        }

        event.preventDefault();
        options[nextIndex]?.focus();
      });

      priorityList._a11yBound = true;
    }
  };

  const refreshTexts = () => {
    if (!(priorityList instanceof HTMLElement)) return;

    if (priorityInlineWrap) {
      priorityInlineWrap.setAttribute('aria-label', t('task.priority'));
    }
    priorityList.setAttribute('aria-label', t('task.priority'));
    PRIORITY_OPTIONS.forEach(({ value, key }) => {
      const option = priorityList.querySelector(`.task-form__priority-option[data-value="${value}"]`);
      if (option) {
        option.textContent = t(key);
      }
    });

    syncView();
  };

  const init = () => {
    buildOptions();
    syncView();

    if (priorityInlineWrap) {
      priorityInlineWrap.setAttribute('role', 'region');
      priorityInlineWrap.setAttribute('aria-label', t('task.priority'));
    }
  };

  return {
    init,
    open,
    close,
    toggle,
    reset,
    isOpen,
    setValue,
    refreshTexts,
  };
};
