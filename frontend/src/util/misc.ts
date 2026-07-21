/** wait */
export const sleep = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** get defined css variable value */
export const getCssVar = (
  name: `--${string}`,
  element = document.documentElement,
) => getComputedStyle(element).getPropertyValue(name);
