/** create new date with fallback */
export const date = (date: ConstructorParameters<typeof Date>[0]) => {
  date = new Date(date || Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
};
