export const keyboardActivate = (event, callback) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); callback(); } };
export const focusFirstInvalidField = (root = document) => root.querySelector('[aria-invalid="true"], [data-invalid="true"]')?.focus();
