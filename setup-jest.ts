// @ts-nocheck
const noop = () => {};
Object.defineProperty(window, 'scroll', { value: noop, writable: true });
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: prop => {
      return '';
    }
  })
});
