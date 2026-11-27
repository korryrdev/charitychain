import type { KeyboardEvent } from 'react';

export const keyboardActivate = (event: KeyboardEvent<HTMLElement>, callback: () => void): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

export const focusFirstInvalidField = (root: Document | HTMLElement = document): void => {
  const el = root.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
  el?.focus();
};
