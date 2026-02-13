const TRANSITION_FALLBACK_MS = 280;

export const openExpandable = (element) => {
  if (!(element instanceof HTMLElement)) return;

  if (element._closeTimerId) {
    window.clearTimeout(element._closeTimerId);
    element._closeTimerId = null;
  }

  element.hidden = false;
  requestAnimationFrame(() => {
    element.classList.add('is-open');
  });
};

export const closeExpandable = (element) => {
  if (!(element instanceof HTMLElement)) return;

  element.classList.remove('is-open');

  const complete = () => {
    if (element.classList.contains('is-open')) {
      element.removeEventListener('transitionend', onTransitionEnd);
      return;
    }

    element.hidden = true;
    element.removeEventListener('transitionend', onTransitionEnd);
    if (element._closeTimerId) {
      window.clearTimeout(element._closeTimerId);
      element._closeTimerId = null;
    }
  };

  const onTransitionEnd = (event) => {
    if (event.target !== element) return;
    complete();
  };

  element.addEventListener('transitionend', onTransitionEnd);
  element._closeTimerId = window.setTimeout(complete, TRANSITION_FALLBACK_MS);
};
