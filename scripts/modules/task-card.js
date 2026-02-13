// Task card creation and management module
import { toggleTaskCompletion, deleteTask, updateTask } from './task-manager.js';
import { openExpandable, closeExpandable } from './task-form/expandable.js';
import { getLocale, t } from '../i18n/index.js';
import { isIOS } from '../utils/platform.js';
import { COLLAPSE_MS, PRIORITY_RANKS } from './task-card/constants.js';
import { formatTaskDate, getPriorityLabel, getPriorityRank, isKnownPriority } from './task-card/utils.js';

const activeTasksList = document.getElementById('active-tasks-list');
const completedTasksList = document.getElementById('completed-tasks-list');
const activeEmptyMessage = document.querySelector('.active-tasks__empty');
const completedEmptyMessage = document.querySelector('.completed-tasks__empty');
const liveRegion = document.getElementById('tasks-live');

const announce = (key) => {
  if (!liveRegion) return;
  liveRegion.textContent = '';
  window.setTimeout(() => {
    liveRegion.textContent = t(key);
  }, 10);
};

const bindListboxKeyboard = (list, options = {}) => {
  if (!(list instanceof HTMLElement) || list._a11yBound) return;
  const { onSelect, onEscape } = options;

  list.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.getAttribute('role') !== 'option') return;

    const items = Array.from(list.querySelectorAll('[role="option"]'));
    const currentIndex = items.indexOf(target);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = items.length - 1;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (typeof onSelect === 'function') {
        onSelect(target);
      } else {
        target.click();
      }
      return;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (typeof onEscape === 'function') onEscape();
      return;
    } else {
      return;
    }

    event.preventDefault();
    items[nextIndex]?.focus();
  });

  list._a11yBound = true;
};

// Create a task card element
export const createTaskCard = (taskData) => {
  const {
    id,
    title,
    description = '',
    priority = 'medium',
    date,
    time,
    completed = false
  } = taskData;

  // Get template
  const template = document.getElementById('task-card-template');
  if (!template) return null;

  // Clone template content
  const card = template.content.cloneNode(true).querySelector('.task-card');
  card.classList.toggle('task-card_theme_completed', completed);
  card.dataset.taskId = id;

  // Format the date for display
  const formattedDate = formatTaskDate(date);

  // Fill in the data
  const titleElement = card.querySelector('.task-card__title');
  if (titleElement) titleElement.textContent = title;
  const descriptionElement = card.querySelector('.task-card__description');
  if (descriptionElement) {
    const hasDescription = description.trim().length > 0;
    descriptionElement.hidden = !hasDescription;
    descriptionElement.textContent = description;
  }

  const priorityElement = card.querySelector('.task-card__priority');
  if (priorityElement) {
    const priorityLevel = isKnownPriority(priority) ? priority : 'medium';
    card.dataset.priorityRank = String(PRIORITY_RANKS[priorityLevel]);
    priorityElement.textContent = getPriorityLabel(priorityLevel);
    priorityElement.className = `task-card__priority task-card__priority_level_${priorityLevel}`;
  }

  const dateElement = card.querySelector('.task-card__date');
  if (dateElement) dateElement.innerHTML = `<img class="icon" src="./icons/calendar-days.svg" alt="${t('task.date')}"> ${formattedDate}`;

  const timeElement = card.querySelector('.task-card__time');
  if (timeElement) timeElement.innerHTML = `<img class="icon" src="./icons/clock.svg" alt="${t('task.time')}"> ${time}`;

  const completeText = card.querySelector('.task-card__complete-text');
  if (completeText) completeText.textContent = completed ? t('task.return_to_active') : t('task.complete_action');
  const completeIcon = card.querySelector('.task-card__complete-button .task-card__icon');
  if (completeIcon) completeIcon.src = completed ? './icons/undo.svg' : './icons/check.svg';

  // Get buttons
  const editButton = card.querySelector('.task-card__edit-button');
  const completeButton = card.querySelector('.task-card__complete-button');
  const deleteButton = card.querySelector('.task-card__delete-button');

  // Add event listeners
  completeButton?.addEventListener('click', () => {
    const updatedTask = toggleTaskCompletion(id);
    if (!updatedTask) return;

    card.classList.add('task-card_state_leaving');
    let moved = false;

    const moveCard = () => {
      if (moved) return;
      moved = true;
      card.remove();
      addTaskToList(updatedTask, { animate: true });
      announce(updatedTask.completed ? 'task.announce_completed' : 'task.announce_restored');
    };

    card.addEventListener('animationend', moveCard, { once: true });
    setTimeout(moveCard, 500);
  });

  deleteButton?.addEventListener('click', () => {
    const deleted = deleteTask(id);
    if (deleted) {
      card.remove();
      toggleEmptyState();
      announce('task.announce_deleted');
    }
  });

  editButton?.addEventListener('click', () => {
    const editForm = createEditForm(taskData, card);
    card.innerHTML = '';
    card.appendChild(editForm);
  });

  return card;
};

// Create an edit form for a task
const createEditForm = (taskData, card) => {
  const { id, title, description = '', priority = 'medium', date, time } = taskData;
  const { flatpickr } = window;
  const ios = isIOS();
  let dateCollapseTimerId = null;
  let timeCollapseTimerId = null;
  let priorityCollapseTimerId = null;
  
  // Create form container
  const formContainer = document.createElement('div');
  formContainer.className = 'task-card__edit-form';
  
  // Title field (same as add form)
  const titleField = document.createElement('label');
  titleField.className = 'task-form__field';
  titleField.classList.add('is-filled');
  
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'task-form__text-input';
  titleInput.value = title;
  titleInput.setAttribute('aria-label', t('task.title'));
  
  const titleIcon = document.createElement('img');
  titleIcon.className = 'task-form__field-icon icon';
  titleIcon.src = './icons/edit-pencil.svg';
  titleIcon.alt = '';
  
  titleField.appendChild(titleInput);
  titleField.appendChild(titleIcon);

  const descriptionField = document.createElement('label');
  descriptionField.className = 'task-form__field task-form__field_type_description';
  if (description.trim().length > 0) {
    descriptionField.classList.add('is-filled');
  }

  const descriptionLabel = document.createElement('span');
  descriptionLabel.className = 'task-form__field-label';
  descriptionLabel.textContent = t('task.description');

  const descriptionInput = document.createElement('textarea');
  descriptionInput.className = 'task-form__textarea';
  descriptionInput.rows = 3;
  descriptionInput.value = description;
  descriptionInput.setAttribute('aria-label', t('task.description'));

  const descriptionIcon = document.createElement('img');
  descriptionIcon.className = 'task-form__field-icon icon';
  descriptionIcon.src = './icons/edit-pencil.svg';
  descriptionIcon.alt = '';

  descriptionField.appendChild(descriptionLabel);
  descriptionField.appendChild(descriptionInput);
  descriptionField.appendChild(descriptionIcon);

  const priorityGroup = document.createElement('div');
  priorityGroup.className = 'task-form__priority-group';

  const priorityField = document.createElement('div');
  priorityField.className = 'task-form__field task-form__field_type_priority';

  const priorityLabel = document.createElement('span');
  priorityLabel.className = 'task-form__field-label';
  priorityLabel.textContent = t('task.priority');

  const priorityTrigger = document.createElement('button');
  priorityTrigger.className = 'task-form__picker';
  priorityTrigger.type = 'button';

  const priorityText = document.createElement('span');
  priorityTrigger.appendChild(priorityText);

  const priorityIcon = document.createElement('img');
  priorityIcon.className = 'task-form__field-icon icon';
  priorityIcon.src = './icons/chevron-left-right.svg';
  priorityIcon.alt = '';

  const priorityInput = document.createElement('input');
  priorityInput.type = 'hidden';
  priorityInput.className = 'task-form__native-picker';
  priorityInput.value = isKnownPriority(priority) ? priority : 'medium';

  const priorityInlineWrap = document.createElement('div');
  priorityInlineWrap.className = 'task-form__priority-inline';
  priorityInlineWrap.hidden = true;
  const priorityInlineId = `task-${id}-priority-inline`;
  priorityInlineWrap.id = priorityInlineId;

  const priorityList = document.createElement('div');
  priorityList.className = 'task-form__priority-list';
  priorityList.setAttribute('role', 'listbox');
  priorityList.setAttribute('aria-label', t('task.priority'));

  priorityField.appendChild(priorityLabel);
  priorityField.appendChild(priorityTrigger);
  priorityField.appendChild(priorityIcon);
  priorityField.appendChild(priorityInput);
  priorityInlineWrap.appendChild(priorityList);
  priorityGroup.appendChild(priorityField);
  priorityGroup.appendChild(priorityInlineWrap);

  priorityTrigger.setAttribute('aria-haspopup', 'listbox');
  priorityTrigger.setAttribute('aria-expanded', 'false');
  priorityTrigger.setAttribute('aria-controls', priorityInlineId);

  // Date group (same structure as add form)
  const dateGroup = document.createElement('div');
  dateGroup.className = 'task-form__date-group';
  
  const dateFieldWrap = document.createElement('div');
  dateFieldWrap.className = 'task-form__field';
  
  const dateLabel = document.createElement('span');
  dateLabel.className = 'task-form__field-label';
  dateLabel.textContent = t('task.date');
  
  const dateTrigger = document.createElement('button');
  dateTrigger.className = 'task-form__picker';
  dateTrigger.type = 'button';
  
  const dateText = document.createElement('span');
  dateText.textContent = date ? formatTaskDate(date) : t('common.not_selected');
  
  dateTrigger.appendChild(dateText);
  
  const dateIcon = document.createElement('img');
  dateIcon.className = 'task-form__field-icon icon';
  dateIcon.src = './icons/calendar-days.svg';
  dateIcon.alt = '';
  
  dateFieldWrap.appendChild(dateLabel);
  dateFieldWrap.appendChild(dateTrigger);
  dateFieldWrap.appendChild(dateIcon);
  
  const dateInlineWrap = document.createElement('div');
  dateInlineWrap.className = 'task-form__inline';
  dateInlineWrap.hidden = true;
  const dateInlineId = `task-${id}-date-inline`;
  dateInlineWrap.id = dateInlineId;
  dateInlineWrap.setAttribute('role', 'region');
  dateInlineWrap.setAttribute('aria-label', t('task.date'));
  
  const dateInput = document.createElement('input');
  dateInput.type = ios ? 'date' : 'text';
  dateInput.className = 'task-form__native-picker';
  dateInput.value = date || '';
  
  const dateInlineHost = document.createElement('div');
  dateInlineHost.className = 'task-form__calendar-host';
  
  const dateConfirmButton = document.createElement('button');
  dateConfirmButton.className = 'task-form__date-confirm';
  dateConfirmButton.type = 'button';
  dateConfirmButton.textContent = t('task.choose_date');
  
  dateInlineWrap.appendChild(dateInput);
  dateInlineWrap.appendChild(dateInlineHost);
  dateInlineWrap.appendChild(dateConfirmButton);
  
  dateGroup.appendChild(dateFieldWrap);
  dateGroup.appendChild(dateInlineWrap);

  dateTrigger.setAttribute('aria-haspopup', 'dialog');
  dateTrigger.setAttribute('aria-expanded', 'false');
  dateTrigger.setAttribute('aria-controls', dateInlineId);

  if (ios) {
    dateInlineWrap.hidden = false;
    dateInlineWrap.classList.add('is-open');
    dateGroup.classList.add('is-expanded');
    dateTrigger.setAttribute('aria-expanded', 'true');
  }
  
  // Time group (same structure as add form)
  const timeGroup = document.createElement('div');
  timeGroup.className = 'task-form__time-group';
  
  const timeFieldWrap = document.createElement('div');
  timeFieldWrap.className = 'task-form__field';
  
  const timeLabel = document.createElement('span');
  timeLabel.className = 'task-form__field-label';
  timeLabel.textContent = t('task.time');
  
  const timeTrigger = document.createElement('button');
  timeTrigger.className = 'task-form__picker';
  timeTrigger.type = 'button';
  
  const timeText = document.createElement('span');
  timeText.textContent = time || t('common.not_selected');
  
  timeTrigger.appendChild(timeText);
  
  const timeIcon = document.createElement('img');
  timeIcon.className = 'task-form__field-icon icon';
  timeIcon.src = './icons/clock.svg';
  timeIcon.alt = '';
  
  const timeInput = document.createElement('input');
  timeInput.type = 'time';
  timeInput.className = 'task-form__native-picker';
  timeInput.value = time || '';
  
  timeFieldWrap.appendChild(timeLabel);
  timeFieldWrap.appendChild(timeTrigger);
  timeFieldWrap.appendChild(timeIcon);
  timeFieldWrap.appendChild(timeInput);
  
  const timeInlineWrap = document.createElement('div');
  timeInlineWrap.className = 'task-form__time-inline';
  timeInlineWrap.hidden = true;
  const timeInlineId = `task-${id}-time-inline`;
  timeInlineWrap.id = timeInlineId;
  timeInlineWrap.setAttribute('role', 'region');
  timeInlineWrap.setAttribute('aria-label', t('task.time'));
  
  const timeColumns = document.createElement('div');
  timeColumns.className = 'task-form__time-columns';
  
  // Hour column
  const hourColumn = document.createElement('div');
  hourColumn.className = 'task-form__time-column';
  
  const hourTitle = document.createElement('div');
  hourTitle.className = 'task-form__time-column-title';
  hourTitle.textContent = t('task.hours');
  
  const hourList = document.createElement('div');
  hourList.className = 'task-form__time-list';
  hourList.setAttribute('role', 'listbox');
  hourList.setAttribute('aria-label', t('task.hours'));
  
  if (!ios) {
    for (let h = 0; h < 24; h++) {
      const hourOption = document.createElement('button');
      hourOption.className = 'task-form__time-option';
      hourOption.type = 'button';
      hourOption.setAttribute('role', 'option');
      hourOption.textContent = String(h).padStart(2, '0');
      hourOption.dataset.value = String(h).padStart(2, '0');
      hourList.appendChild(hourOption);
    }
  }
  
  hourColumn.appendChild(hourTitle);
  hourColumn.appendChild(hourList);
  
  // Minute column
  const minuteColumn = document.createElement('div');
  minuteColumn.className = 'task-form__time-column';
  
  const minuteTitle = document.createElement('div');
  minuteTitle.className = 'task-form__time-column-title';
  minuteTitle.textContent = t('task.minutes');
  
  const minuteList = document.createElement('div');
  minuteList.className = 'task-form__time-list';
  minuteList.setAttribute('role', 'listbox');
  minuteList.setAttribute('aria-label', t('task.minutes'));
  
  if (!ios) {
    for (let m = 0; m < 60; m += 5) {
      const minuteOption = document.createElement('button');
      minuteOption.className = 'task-form__time-option';
      minuteOption.type = 'button';
      minuteOption.setAttribute('role', 'option');
      minuteOption.textContent = String(m).padStart(2, '0');
      minuteOption.dataset.value = String(m).padStart(2, '0');
      minuteList.appendChild(minuteOption);
    }
  }
  
  minuteColumn.appendChild(minuteTitle);
  minuteColumn.appendChild(minuteList);
  
  timeColumns.appendChild(hourColumn);
  timeColumns.appendChild(minuteColumn);
  
  const timeConfirmButton = document.createElement('button');
  timeConfirmButton.className = 'task-form__time-confirm';
  timeConfirmButton.type = 'button';
  timeConfirmButton.textContent = t('task.choose_time');
  
  timeInlineWrap.appendChild(timeColumns);
  timeInlineWrap.appendChild(timeConfirmButton);
  
  timeGroup.appendChild(timeFieldWrap);
  timeGroup.appendChild(timeInlineWrap);

  timeTrigger.setAttribute('aria-haspopup', 'listbox');
  timeTrigger.setAttribute('aria-expanded', 'false');
  timeTrigger.setAttribute('aria-controls', timeInlineId);
  
  // Action buttons (same as add form)
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'task-form__actions';
  
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'task-form__action-button task-form__action-button_theme_cancel';
  cancelButton.textContent = t('task.cancel');
  
  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.className = 'task-form__action-button task-form__action-button_theme_add';
  saveButton.textContent = t('task.save');
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(saveButton);
  
  // Assemble the form
  formContainer.appendChild(titleField);
  formContainer.appendChild(descriptionField);
  formContainer.appendChild(priorityGroup);
  formContainer.appendChild(dateGroup);
  formContainer.appendChild(timeGroup);
  formContainer.appendChild(buttonContainer);
  
  // Initialize flatpickr for date
  setTimeout(() => {
    if (ios) return;
    if (flatpickr && dateInput && dateInlineHost) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      flatpickr(dateInput, {
        locale: getLocale() === 'ru' ? 'ru' : undefined,
        disableMobile: true,
        appendTo: dateInlineHost,
        inline: true,
        clickOpens: false,
        minDate: today,
        dateFormat: 'Y-m-d',
        onChange: (_, dateStr) => {
          if (dateText) {
            dateText.textContent = formatTaskDate(dateStr);
          }
        },
      });
    }
  }, 0);

  descriptionInput.addEventListener('focus', () => {
    descriptionField.classList.add('is-focused');
    closeExpandable(dateInlineWrap);
    closeExpandable(timeInlineWrap);
    closeExpandable(priorityInlineWrap);
    collapseDateGroup();
    collapseTimeGroup();
    collapsePriorityGroup();
  });

  descriptionInput.addEventListener('input', () => {
    descriptionField.classList.toggle('is-filled', descriptionInput.value.trim().length > 0);
  });

  descriptionInput.addEventListener('blur', () => {
    if (descriptionInput.value.trim().length === 0) {
      descriptionField.classList.remove('is-focused');
    }
  });

  const collapsePriorityGroup = () => {
    if (priorityCollapseTimerId) {
      window.clearTimeout(priorityCollapseTimerId);
    }

    priorityCollapseTimerId = window.setTimeout(() => {
      if (priorityInlineWrap.hidden) {
        priorityGroup.classList.remove('is-expanded');
      }
      priorityCollapseTimerId = null;
    }, COLLAPSE_MS);
  };

  const syncPriorityView = () => {
    const currentPriority = isKnownPriority(priorityInput.value) ? priorityInput.value : 'medium';
    priorityInput.value = currentPriority;
    priorityText.textContent = getPriorityLabel(currentPriority);

    priorityList.querySelectorAll('.task-form__priority-option').forEach((option) => {
      option.classList.toggle('is-selected', option.dataset.value === currentPriority);
      option.setAttribute('aria-selected', option.dataset.value === currentPriority ? 'true' : 'false');
    });
  };

  [
    { value: 'high', label: getPriorityLabel('high') },
    { value: 'medium', label: getPriorityLabel('medium') },
    { value: 'low', label: getPriorityLabel('low') },
  ].forEach(({ value, label }) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'task-form__priority-option';
    option.dataset.value = value;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.textContent = label;

    option.addEventListener('click', () => {
      priorityInput.value = value;
      syncPriorityView();
      closeExpandable(priorityInlineWrap);
      collapsePriorityGroup();
    });

    priorityList.appendChild(option);
  });

  syncPriorityView();

  bindListboxKeyboard(priorityList, {
    onSelect: (button) => {
      const value = button.dataset.value;
      if (!value) return;
      priorityInput.value = value;
      syncPriorityView();
      closeExpandable(priorityInlineWrap);
      collapsePriorityGroup();
    },
    onEscape: () => {
      closeExpandable(priorityInlineWrap);
      collapsePriorityGroup();
      priorityTrigger.focus();
    },
  });

  priorityTrigger.addEventListener('click', () => {
    const isOpen = priorityInlineWrap.classList.contains('is-open');
    if (isOpen) {
      closeExpandable(priorityInlineWrap);
      collapsePriorityGroup();
      priorityTrigger.setAttribute('aria-expanded', 'false');
      return;
    }

    closeExpandable(dateInlineWrap);
    closeExpandable(timeInlineWrap);
    collapseDateGroup();
    collapseTimeGroup();
    openExpandable(priorityInlineWrap);
    priorityGroup.classList.add('is-expanded');
    priorityTrigger.setAttribute('aria-expanded', 'true');
    const selectedPriority = priorityInput.value;
    const selectedOption = priorityList.querySelector(`.task-form__priority-option[data-value="${selectedPriority}"]`);
    if (selectedOption instanceof HTMLButtonElement) {
      selectedOption.focus();
    }
  });

  // Date picker toggle
  const collapseDateGroup = () => {
    if (dateCollapseTimerId) {
      window.clearTimeout(dateCollapseTimerId);
    }

    dateCollapseTimerId = window.setTimeout(() => {
      if (dateInlineWrap.hidden) {
        dateGroup.classList.remove('is-expanded');
      }
      dateCollapseTimerId = null;
    }, COLLAPSE_MS);
  };

  const collapseTimeGroup = () => {
    if (timeCollapseTimerId) {
      window.clearTimeout(timeCollapseTimerId);
    }

    timeCollapseTimerId = window.setTimeout(() => {
      if (timeInlineWrap.hidden) {
        timeGroup.classList.remove('is-expanded');
      }
      timeCollapseTimerId = null;
    }, COLLAPSE_MS);
  };

  dateTrigger.addEventListener('click', () => {
    if (ios) {
      dateInput?.showPicker?.();
      dateInput?.focus?.();
      return;
    }
    const isOpen = dateInlineWrap.classList.contains('is-open');
    if (isOpen) {
      closeExpandable(dateInlineWrap);
      collapseDateGroup();
      dateTrigger.setAttribute('aria-expanded', 'false');
    } else {
      closeExpandable(priorityInlineWrap);
      collapsePriorityGroup();
      closeExpandable(timeInlineWrap);
      collapseTimeGroup();
      openExpandable(dateInlineWrap);
      dateGroup.classList.add('is-expanded');
      dateTrigger.setAttribute('aria-expanded', 'true');
    }
  });

  dateConfirmButton.addEventListener('click', () => {
    closeExpandable(dateInlineWrap);
    collapseDateGroup();
    dateTrigger.setAttribute('aria-expanded', 'false');
  });
  
  // Time picker toggle
  let selectedHour = time ? time.split(':')[0] : '';
  let selectedMinute = time ? time.split(':')[1] : '';
  
  timeTrigger.addEventListener('click', () => {
    if (ios) {
      timeInput?.showPicker?.();
      timeInput?.focus?.();
      return;
    }
    const isOpen = timeInlineWrap.classList.contains('is-open');
    if (isOpen) {
      closeExpandable(timeInlineWrap);
      collapseTimeGroup();
      timeTrigger.setAttribute('aria-expanded', 'false');
    } else {
      closeExpandable(priorityInlineWrap);
      collapsePriorityGroup();
      closeExpandable(dateInlineWrap);
      collapseDateGroup();
      openExpandable(timeInlineWrap);
      timeGroup.classList.add('is-expanded');
      timeTrigger.setAttribute('aria-expanded', 'true');
      const focused = hourList.querySelector('.task-form__time-option.is-selected') ?? hourList.querySelector('.task-form__time-option');
      if (focused instanceof HTMLButtonElement) focused.focus();
    }
  });
  
  hourList.querySelectorAll('.task-form__time-option').forEach(option => {
    if (option.dataset.value === selectedHour) {
      option.classList.add('is-selected');
      option.setAttribute('aria-selected', 'true');
    }
    option.addEventListener('click', () => {
      hourList.querySelectorAll('.task-form__time-option').forEach(o => o.classList.remove('is-selected'));
      hourList.querySelectorAll('.task-form__time-option').forEach(o => o.setAttribute('aria-selected', 'false'));
      option.classList.add('is-selected');
      option.setAttribute('aria-selected', 'true');
      selectedHour = option.dataset.value;
    });
  });
  
  minuteList.querySelectorAll('.task-form__time-option').forEach(option => {
    if (option.dataset.value === selectedMinute) {
      option.classList.add('is-selected');
      option.setAttribute('aria-selected', 'true');
    }
    option.addEventListener('click', () => {
      minuteList.querySelectorAll('.task-form__time-option').forEach(o => o.classList.remove('is-selected'));
      minuteList.querySelectorAll('.task-form__time-option').forEach(o => o.setAttribute('aria-selected', 'false'));
      option.classList.add('is-selected');
      option.setAttribute('aria-selected', 'true');
      selectedMinute = option.dataset.value;
    });
  });

  bindListboxKeyboard(hourList, {
    onSelect: (button) => {
      const value = button.dataset.value;
      if (!value) return;
      hourList.querySelectorAll('.task-form__time-option').forEach(o => o.setAttribute('aria-selected', 'false'));
      button.setAttribute('aria-selected', 'true');
      button.classList.add('is-selected');
      selectedHour = value;
    },
    onEscape: () => {
      closeExpandable(timeInlineWrap);
      collapseTimeGroup();
      timeTrigger.focus();
    },
  });

  bindListboxKeyboard(minuteList, {
    onSelect: (button) => {
      const value = button.dataset.value;
      if (!value) return;
      minuteList.querySelectorAll('.task-form__time-option').forEach(o => o.setAttribute('aria-selected', 'false'));
      button.setAttribute('aria-selected', 'true');
      button.classList.add('is-selected');
      selectedMinute = value;
    },
    onEscape: () => {
      closeExpandable(timeInlineWrap);
      collapseTimeGroup();
      timeTrigger.focus();
    },
  });
  
  timeConfirmButton.addEventListener('click', () => {
    if (selectedHour && selectedMinute) {
      const timeValue = `${selectedHour}:${selectedMinute}`;
      timeText.textContent = timeValue;
      timeInput.value = timeValue;
    }
    closeExpandable(timeInlineWrap);
    collapseTimeGroup();
    timeTrigger.setAttribute('aria-expanded', 'false');
  });
  
  // Add event listeners
  saveButton.addEventListener('click', () => {
    const updates = {
      id,
      title: titleInput.value,
      description: descriptionInput.value.trim(),
      priority: priorityInput.value,
      date: dateInput.value,
      time: timeInput.value
    };
    
    const savedTask = updateTask(id, updates);
    if (!savedTask) return;

    card.remove();
    addTaskToList(savedTask);
    announce('task.announce_updated');
  });

  cancelButton.addEventListener('click', () => {
    card.remove();
    addTaskToList(taskData);
  });
  
  return formContainer;
};

const getListElement = (isCompleted) => (isCompleted ? completedTasksList : activeTasksList);

const insertActiveTaskByPriority = (targetList, taskCard, taskData) => {
  const newRank = getPriorityRank(taskData);
  const siblings = Array.from(targetList.children);

  const insertBeforeNode = siblings.find((child) => {
    const childRank = Number.parseInt(child.dataset.priorityRank ?? String(PRIORITY_RANKS.medium), 10);
    return Number.isFinite(childRank) && childRank > newRank;
  });

  if (insertBeforeNode) {
    targetList.insertBefore(taskCard, insertBeforeNode);
    return;
  }

  targetList.append(taskCard);
};

const removeExistingCard = (taskId) => {
  [activeTasksList, completedTasksList].forEach((list) => {
    if (!list) return;

    const existingCard = list.querySelector(`[data-task-id="${taskId}"]`);
    if (existingCard) {
      existingCard.remove();
    }
  });
};

export const addTaskToList = (taskData, options = {}) => {
  const targetList = getListElement(Boolean(taskData.completed));
  if (!targetList) return;

  removeExistingCard(taskData.id);

  const taskCard = createTaskCard(taskData);
  if (!taskCard) return;

  if (options.animate) {
    taskCard.classList.add('task-card_state_entering');
    taskCard.addEventListener('animationend', () => {
      taskCard.classList.remove('task-card_state_entering');
    }, { once: true });
  }

  if (taskData.completed) {
    targetList.prepend(taskCard);
  } else {
    insertActiveTaskByPriority(targetList, taskCard, taskData);
  }

  toggleEmptyState();
};

export const announceTaskAdded = () => {
  announce('task.announce_added');
};

export const toggleEmptyState = () => {
  const hasActiveTasks = (activeTasksList?.children.length ?? 0) > 0;
  const hasCompletedTasks = (completedTasksList?.children.length ?? 0) > 0;

  if (activeEmptyMessage) {
    activeEmptyMessage.hidden = hasActiveTasks;
  }

  if (completedEmptyMessage) {
    completedEmptyMessage.hidden = hasCompletedTasks;
  }
};
