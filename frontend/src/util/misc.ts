import { orderBy } from "lodash";

/** wait */
export const sleep = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** get defined css variable value */
export const getCssVar = (
  name: `--${string}`,
  element = document.documentElement,
) => getComputedStyle(element).getPropertyValue(name);

/** sort and limit object entries */
export const getTop = (object: Record<string, number>, limit = 5) =>
  orderBy(Object.entries(object), ([, value]) => value, "desc").slice(0, limit);
