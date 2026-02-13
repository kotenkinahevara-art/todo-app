import { getLocale, t } from '../../i18n/index.js';

export const getEmptyValue = () => t('common.not_selected');

export const formatDate = (value) => {
  if (!value) return getEmptyValue();

  const date = new Date(`${value}T00:00:00`);
  const locale = getLocale() === 'en' ? 'en-US' : 'ru-RU';
  return new Intl.DateTimeFormat(locale).format(date);
};
