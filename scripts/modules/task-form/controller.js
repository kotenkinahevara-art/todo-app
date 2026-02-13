import { getEmptyValue } from './formatters.js';
import { getTaskFormDom } from './dom.js';
import { createDateField } from './dateField.js';
import { createTimeField } from './timeField.js';
import { createPriorityField } from './priorityField.js';
import { closeExpandable, openExpandable } from './expandable.js';
import { addTaskToList, announceTaskAdded } from '../task-card.js';
import { addTask } from '../task-manager.js';
import { onI18nChange, t } from '../../i18n/index.js';

export const initTaskForm = () => {
  const dom = getTaskFormDom();

  const {
    openButton,
    cancelButton,
    formWrap,
    form,
    titleInput,
    descriptionInput,
    priorityInput,
    priorityTrigger,
    dateInput,
    timeInput,
    dateText,
    timeText,
    dateTrigger,
    timeTrigger,
  } = dom;

  if (!openButton || !formWrap || !form || !dateText || !timeText) {
    return;
  }

  const dateField = createDateField(dom);
  const timeField = createTimeField(dom);
  const priorityField = createPriorityField(dom);
  const titleField = titleInput?.closest('.task-form__field') ?? null;
  const descriptionField = descriptionInput?.closest('.task-form__field') ?? null;

  const syncTitleFieldState = () => {
    if (!titleInput || !titleField) return;

    titleField.classList.toggle('is-filled', titleInput.value.trim().length > 0);
  };

  const syncDescriptionFieldState = () => {
    if (!descriptionInput || !descriptionField) return;

    descriptionField.classList.toggle('is-filled', descriptionInput.value.trim().length > 0);
  };

  const closeExpandableFields = (except = null) => {
    if (except !== 'date') {
      dateField.close();
    }
    if (except !== 'time') {
      timeField.close();
    }
    if (except !== 'priority') {
      priorityField.close();
    }
  };

  const showForm = () => {
    openExpandable(formWrap);
    openButton.setAttribute('aria-expanded', 'true');
  };

  const hideForm = () => {
    closeExpandable(formWrap);
    openButton.setAttribute('aria-expanded', 'false');
    closeExpandableFields();
    form.reset();
    dateField.reset();
    timeField.reset();
    priorityField.reset();
    titleField?.classList.remove('is-focused');
    descriptionField?.classList.remove('is-focused');
    syncTitleFieldState();
    syncDescriptionFieldState();
    dateText.textContent = getEmptyValue();
    timeText.textContent = getEmptyValue();
  };

  const toggleForm = () => {
    if (formWrap.hidden) {
      showForm();
      return;
    }

    hideForm();
  };

  openButton.addEventListener('click', toggleForm);
  cancelButton?.addEventListener('click', hideForm);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !formWrap.hidden) {
      hideForm();
    }
  });

  dateTrigger?.addEventListener('click', () => {
    closeExpandableFields('date');
    dateField.toggle();
  });

  timeTrigger?.addEventListener('click', () => {
    closeExpandableFields('time');
    timeField.toggle();
  });

  priorityTrigger?.addEventListener('click', () => {
    closeExpandableFields('priority');
    priorityField.toggle();
  });

  titleInput?.addEventListener('focus', () => {
    closeExpandableFields();
    if (titleField) {
      titleField.classList.add('is-focused');
    }
  });

  titleInput?.addEventListener('click', () => {
    closeExpandableFields();
  });

  titleInput?.addEventListener('input', syncTitleFieldState);
  titleInput?.addEventListener('blur', () => {
    if (!titleField || !titleInput) return;

    if (titleInput.value.trim().length === 0) {
      titleField.classList.remove('is-focused');
    }
  });

  descriptionInput?.addEventListener('focus', () => {
    closeExpandableFields();
    descriptionField?.classList.add('is-focused');
  });

  descriptionInput?.addEventListener('click', () => {
    closeExpandableFields();
  });

  descriptionInput?.addEventListener('input', syncDescriptionFieldState);
  descriptionInput?.addEventListener('blur', () => {
    if (!descriptionField || !descriptionInput) return;

    if (descriptionInput.value.trim().length === 0) {
      descriptionField.classList.remove('is-focused');
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    
    // Get form values
    const title = titleInput.value.trim();
    const description = descriptionInput?.value.trim() ?? '';
    const priority = priorityInput?.value ?? 'medium';
    const date = dateInput.value;
    const time = timeInput.value;
    
    // Validate form
    if (!title) {
      alert(t('task.validation_title_required'));
      return;
    }
    
    // Create task object
    const taskData = {
      title,
      description,
      priority,
      date,
      time,
      completed: false
    };

    // Add task to storage and get the saved task
    const savedTask = addTask(taskData);

    // Add task to proper list
    addTaskToList(savedTask);
    announceTaskAdded();

    // Reset form and hide
    hideForm();
  });

  dateField.init();
  timeField.init();
  priorityField.init();
  syncTitleFieldState();
  syncDescriptionFieldState();

  onI18nChange(() => {
    priorityField.refreshTexts?.();
    if (!dateInput.value) {
      dateText.textContent = getEmptyValue();
    }
    if (!timeInput.value) {
      timeText.textContent = getEmptyValue();
    }
  });
};
