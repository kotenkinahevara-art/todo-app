import { getLocale, t } from '../../i18n/index.js';
import { PRIORITY_RANKS, PRIORITY_VALUES } from './constants.js';

export const isKnownPriority = (value) => PRIORITY_VALUES.includes(value);

export const getPriorityLabel = (value) => t(`priority.${isKnownPriority(value) ? value : 'medium'}`);

export const getPriorityRank = (taskData) => {
  const level = isKnownPriority(taskData?.priority) ? taskData.priority : 'medium';
  return PRIORITY_RANKS[level];
};

export const formatTaskDate = (dateString) => {
  if (!dateString) return t('common.not_specified');

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const locale = getLocale() === 'en' ? 'en-US' : 'ru-RU';
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  }).replace('.', '');
};
