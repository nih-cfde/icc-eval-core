/** get defined css variable value */
export const getCssVar = (
  name: `--${string}`,
  element = document.documentElement,
) => getComputedStyle(element).getPropertyValue(name);
