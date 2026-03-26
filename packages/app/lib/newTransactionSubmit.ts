/** Simple global callback for the FAB to trigger new-transaction submission */
let _onSubmit: (() => void) | null = null;
let _submitting = false;
let _listeners: Set<(v: boolean) => void> = new Set();

export function setOnSubmit(fn: (() => void) | null) {
  _onSubmit = fn;
}

export function triggerSubmit() {
  _onSubmit?.();
}

export function setSubmitting(value: boolean) {
  _submitting = value;
  _listeners.forEach((fn) => fn(value));
}

export function getSubmitting() {
  return _submitting;
}

export function subscribeSubmitting(fn: (v: boolean) => void) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
