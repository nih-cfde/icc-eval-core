import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

/** get relative time format */
export const ago = (date: Date) => timeAgo.format(date);

export const span = (seconds: number) =>
  timeAgo
    .format(Date.now() - seconds * 1000)
    .replace("ago", "")
    .trim();
