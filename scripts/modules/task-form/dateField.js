import { getEmptyValue, formatDate } from './formatters.js';
import { getLocale, onI18nChange, t } from '../../i18n/index.js';
import { closeExpandable, openExpandable } from './expandable.js';

const YEAR_RANGE = 30;
const COLLAPSE_MS = 280;

const getYearBounds = (instance, currentYear) => {
  const minDateYear = instance.config.minDate instanceof Date ? instance.config.minDate.getFullYear() : currentYear - YEAR_RANGE;
  const maxDateYear = instance.config.maxDate instanceof Date ? instance.config.maxDate.getFullYear() : currentYear + YEAR_RANGE;

  return {
    minYear: minDateYear,
    maxYear: maxDateYear,
  };
};

const closeCustomDropdowns = (root) => {
  if (!(root instanceof HTMLElement)) return;

  root.querySelectorAll('.fp-custom-dropdown.is-open').forEach((dropdown) => {
    dropdown.classList.remove('is-open');
    const trigger = dropdown.querySelector('.fp-custom-dropdown__trigger');
    if (trigger instanceof HTMLElement) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
};

const scrollDropdownToSelected = (panel) => {
  const selected = panel.querySelector('.fp-custom-dropdown__option.is-selected');
  if (!(selected instanceof HTMLElement)) return;

  panel.scrollTop = selected.offsetTop;
};

const createCustomDropdown = ({ root, id, valueText, options, onSelect }) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'fp-custom-dropdown';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'fp-custom-dropdown__trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.id = `${id}-trigger`;
  trigger.textContent = valueText;

  const panel = document.createElement('div');
  panel.className = 'fp-custom-dropdown__panel';
  panel.id = `${id}-panel`;
  panel.setAttribute('role', 'listbox');
  panel.setAttribute('aria-labelledby', trigger.id);
  trigger.setAttribute('aria-controls', panel.id);

  options.forEach(({ label, value, selected }) => {
    const optionButton = document.createElement('button');
    optionButton.type = 'button';
    optionButton.className = 'fp-custom-dropdown__option';
    optionButton.setAttribute('role', 'option');
    optionButton.setAttribute('aria-selected', String(selected));
    optionButton.dataset.value = String(value);
    optionButton.textContent = label;

    if (selected) {
      optionButton.classList.add('is-selected');
    }

    optionButton.addEventListener('click', () => {
      onSelect(value);
      closeCustomDropdowns(root);
    });

    panel.append(optionButton);
  });

  trigger.addEventListener('click', () => {
    const isOpen = wrapper.classList.contains('is-open');
    closeCustomDropdowns(root);
    wrapper.classList.toggle('is-open', !isOpen);
    trigger.setAttribute('aria-expanded', String(!isOpen));

    if (!isOpen) {
      scrollDropdownToSelected(panel);
    }
  });

  const focusSelected = () => {
    const selected = panel.querySelector('.fp-custom-dropdown__option.is-selected');
    if (selected instanceof HTMLButtonElement) {
      selected.focus();
    } else {
      panel.querySelector('.fp-custom-dropdown__option')?.focus();
    }
  };

  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const isOpen = wrapper.classList.contains('is-open');
      if (!isOpen) {
        closeCustomDropdowns(root);
        wrapper.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      scrollDropdownToSelected(panel);
      focusSelected();
    }
  });

  panel.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (!target.classList.contains('fp-custom-dropdown__option')) return;

    const optionsNodes = Array.from(panel.querySelectorAll('.fp-custom-dropdown__option'));
    const currentIndex = optionsNodes.indexOf(target);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % optionsNodes.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + optionsNodes.length) % optionsNodes.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = optionsNodes.length - 1;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      target.click();
      return;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeCustomDropdowns(root);
      trigger.focus();
      return;
    } else {
      return;
    }

    event.preventDefault();
    optionsNodes[nextIndex]?.focus();
  });

  wrapper.append(trigger, panel);

  return wrapper;
};

const setupCustomMonthYearDropdowns = (instance) => {
  const currentMonth = instance.calendarContainer?.querySelector('.flatpickr-current-month');
  if (!(currentMonth instanceof HTMLElement)) return;

  currentMonth.innerHTML = '';

  const { minYear, maxYear } = getYearBounds(instance, instance.currentYear);
  const monthNames = instance.l10n.months.longhand;

  const monthOptions = monthNames.map((name, index) => ({
    label: name,
    value: index,
    selected: index === instance.currentMonth,
  }));

  const yearOptions = [];
  for (let year = minYear; year <= maxYear; year += 1) {
    yearOptions.push({
      label: String(year),
      value: year,
      selected: year === instance.currentYear,
    });
  }

  const monthDropdown = createCustomDropdown({
    root: currentMonth,
    id: 'fp-month',
    valueText: monthNames[instance.currentMonth],
    options: monthOptions,
    onSelect: (value) => {
      instance.changeMonth(Number(value), false);
      setupCustomMonthYearDropdowns(instance);
    },
  });

  const yearDropdown = createCustomDropdown({
    root: currentMonth,
    id: 'fp-year',
    valueText: String(instance.currentYear),
    options: yearOptions,
    onSelect: (value) => {
      instance.changeYear(Number(value));
      setupCustomMonthYearDropdowns(instance);
    },
  });

  currentMonth.append(monthDropdown, yearDropdown);

  if (!instance._customDropdownOutsideClickBound) {
    instance.calendarContainer?.addEventListener('click', (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (!event.target.closest('.fp-custom-dropdown')) {
        closeCustomDropdowns(currentMonth);
      }
    });

    instance._customDropdownOutsideClickBound = true;
  }
};

export const createDateField = (dom) => {
  const {
    dateInlineWrap,
    dateGroup,
    dateTrigger,
    dateInput,
    dateInlineHost,
    dateText,
    dateConfirmButton,
    flatpickrApi,
  } = dom;

  let datePickerInstance = null;
  let collapseTimerId = null;

  const closeInnerDropdowns = () => {
    const currentMonth = dateInlineHost?.querySelector('.flatpickr-current-month');
    if (currentMonth instanceof HTMLElement) {
      closeCustomDropdowns(currentMonth);
    }
  };

  const isOpen = () => Boolean(dateInlineWrap && !dateInlineWrap.hidden);

  const open = () => {
    if (!dateInlineWrap || !dateGroup || !dateTrigger) return;

    if (collapseTimerId) {
      window.clearTimeout(collapseTimerId);
      collapseTimerId = null;
    }

    openExpandable(dateInlineWrap);
    dateGroup.classList.add('is-expanded');
    dateTrigger.setAttribute('aria-expanded', 'true');
  };

  const close = () => {
    closeInnerDropdowns();
    closeExpandable(dateInlineWrap);
    if (dateTrigger) dateTrigger.setAttribute('aria-expanded', 'false');

    if (collapseTimerId) {
      window.clearTimeout(collapseTimerId);
    }

    collapseTimerId = window.setTimeout(() => {
      if (dateGroup && (!dateInlineWrap || dateInlineWrap.hidden)) {
        dateGroup.classList.remove('is-expanded');
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
    if (dateText) dateText.textContent = getEmptyValue();
  };

  const confirm = () => {
    if (datePickerInstance && dateText) {
      dateText.textContent = formatDate(datePickerInstance.input.value);
    }

    close();
  };

  const init = () => {
    if (!flatpickrApi || !dateInput) return;

    if (dateInlineWrap) {
      dateInlineWrap.setAttribute('role', 'region');
      dateInlineWrap.setAttribute('aria-label', t('task.date'));
    }

    const localeCode = getLocale();
    const locale = localeCode === 'ru' ? flatpickrApi.l10ns?.ru ?? 'ru' : undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    datePickerInstance = flatpickrApi(dateInput, {
      locale,
      disableMobile: true,
      appendTo: dateInlineHost ?? undefined,
      inline: true,
      clickOpens: false,
      minDate: today,
      dateFormat: 'Y-m-d',
      onReady: (_, __, instance) => {
        setupCustomMonthYearDropdowns(instance);
      },
      onMonthChange: (_, __, instance) => {
        setupCustomMonthYearDropdowns(instance);
      },
      onYearChange: (_, __, instance) => {
        setupCustomMonthYearDropdowns(instance);
      },
      onChange: (_, dateStr) => {
        if (dateText) {
          dateText.textContent = formatDate(dateStr);
        }
      },
    });

    const applyLocale = () => {
      if (!datePickerInstance) return;
      const nextLocaleCode = getLocale();
      const nextLocale = nextLocaleCode === 'ru' ? flatpickrApi.l10ns?.ru ?? 'ru' : undefined;
      datePickerInstance.set('locale', nextLocale);
      setupCustomMonthYearDropdowns(datePickerInstance);
    };

    dateConfirmButton?.addEventListener('click', confirm);
    if (dateConfirmButton) {
      dateConfirmButton.textContent = t('task.choose_date');
    }
    dateInput.addEventListener('change', () => {
      if (dateText) {
        dateText.textContent = formatDate(dateInput.value);
      }
    });

    onI18nChange(() => {
      applyLocale();
      if (dateConfirmButton) {
        dateConfirmButton.textContent = t('task.choose_date');
      }
      if (!dateInput.value && dateText) {
        dateText.textContent = getEmptyValue();
      }
      if (dateInlineWrap) {
        dateInlineWrap.setAttribute('aria-label', t('task.date'));
      }
    });
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
