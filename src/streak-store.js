import { currentUser } from "./data.js";
import * as api from "./notifications-api.js";

export const MILESTONES = [3, 7, 14, 30, 50, 100, 365];
const DAY_MS = 86400000;

const store = { streak: null };
const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const currentStreak = () => store.streak;

export async function loadStreak() {
  try {
    store.streak = await api.getStreak();
    currentUser.currentStreak = store.streak.current;
  } catch {
    return store.streak;
  }
  listeners.forEach((listener) => listener(store.streak));
  return store.streak;
}

export function clearStreak() {
  store.streak = null;
  listeners.forEach((listener) => listener(null));
}

export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export async function syncTimezone() {
  const timezone = deviceTimezone();
  if (!timezone) return;
  await api.updateTimezone(timezone).catch(() => {});
}

const dayKey = (date) => date.toLocaleDateString("en-CA");

export function streakStartDay(streak) {
  const offset = streak.active_today ? streak.current - 1 : streak.current;
  return dayKey(new Date(Date.now() - offset * DAY_MS));
}

const shownKey = () => `of.streak.milestones.${currentUser.id || "me"}`;

function shownMilestones() {
  try {
    return JSON.parse(localStorage.getItem(shownKey()) || "[]");
  } catch {
    return [];
  }
}

export function claimMilestone(count, startDay) {
  const key = `${count}@${startDay}`;
  const shown = shownMilestones();
  if (shown.includes(key)) return false;
  try {
    localStorage.setItem(shownKey(), JSON.stringify([...shown, key].slice(-30)));
  } catch {}
  return true;
}

export function lastWeek(streak) {
  const today = new Date();
  const activeFrom = streak.active_today ? streak.current - 1 : streak.current;
  const activeTo = streak.active_today ? 0 : 1;
  return Array.from({ length: 7 }, (_, i) => {
    const back = 6 - i;
    const date = new Date(today.getTime() - back * DAY_MS);
    const active = streak.current > 0 && back >= activeTo && back <= activeFrom;
    return { date, today: back === 0, active };
  });
}
