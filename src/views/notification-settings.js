import { escapeHtml } from "../format.js";
import { getNotificationSettings, updateNotificationSettings } from "../notifications-api.js";
import { iconButton, ofIcons, switchInput } from "./components.js";

const GROUPS = [
  ["social", "Social", "Follows, likes, comments and votes"],
  ["messages", "Messages", "New messages while you're away"],
  ["stories", "Stories", "Replies and viewer milestones"],
  ["streaks", "Streaks", "Reminders before your streak ends"],
];
const DEFAULT_QUIET = ["22:00", "07:00"];

const hhmm = (value) => (value ? value.slice(0, 5) : "");

function toggleRow([key, label, hint], settings) {
  return `<label class="of-toggle-row">
    <span class="of-toggle-text"><b>${label}</b><small>${hint}</small></span>
    ${switchInput({ on: settings[key], label, data: { "data-setting": key } })}
  </label>`;
}

function quietHtml(settings) {
  const on = Boolean(settings.quiet_hours_start && settings.quiet_hours_end);
  const [start, end] = on ? [hhmm(settings.quiet_hours_start), hhmm(settings.quiet_hours_end)] : DEFAULT_QUIET;
  return `<label class="of-toggle-row">
      <span class="of-toggle-text"><b>Quiet hours</b><small>No pushes during these hours</small></span>
      ${switchInput({ on, label: "Quiet hours", data: { "data-quiet-toggle": true } })}
    </label>
    <div class="of-quiet-times" ${on ? "" : "hidden"} data-quiet-times>
      <label class="of-time-field"><span>From</span><input type="time" value="${escapeHtml(start)}" data-quiet="start" /></label>
      <label class="of-time-field"><span>To</span><input type="time" value="${escapeHtml(end)}" data-quiet="end" /></label>
    </div>`;
}

function cardsHtml(settings) {
  return `<section class="of-settings-card of-toggle-card" aria-label="Push notifications">
      <p class="of-meta-label">Push notifications</p>
      ${GROUPS.map((group) => toggleRow(group, settings)).join("")}
    </section>
    <section class="of-settings-card of-toggle-card" aria-label="Quiet hours">
      <p class="of-meta-label">Quiet hours</p>
      ${quietHtml(settings)}
    </section>
    <p class="of-muted of-settings-note">Everything still shows up in Activity. Times follow your timezone (${escapeHtml(settings.timezone)}).</p>`;
}

export function renderNotificationSettings() {
  return `<section class="of-screen of-settings" id="of-profile">
    <header class="of-profile-head">
      ${iconButton({ icon: ofIcons.back(20), label: "Back to settings", data: { "data-profile-go": "settings" } })}
      <h1 class="of-display of-settings-title">Notifications</h1>
    </header>
    <div id="notification-settings"><p class="of-muted">Loading…</p></div>
  </section>`;
}

async function save(root, changes, toast) {
  try {
    const settings = await updateNotificationSettings(changes);
    root.dataset.saved = JSON.stringify(settings);
  } catch (err) {
    toast(err.message || "Couldn't save your settings.");
    paint(root, JSON.parse(root.dataset.saved));
  }
}

function paint(root, settings) {
  root.dataset.saved = JSON.stringify(settings);
  root.innerHTML = cardsHtml(settings);
}

function quietChanges(root) {
  if (!root.querySelector("[data-quiet-toggle]").checked) return { quiet_hours_start: null, quiet_hours_end: null };
  const value = (which) => root.querySelector(`[data-quiet="${which}"]`).value;
  return { quiet_hours_start: value("start"), quiet_hours_end: value("end") };
}

export async function mountNotificationSettings({ toast }) {
  const root = document.querySelector("#notification-settings");
  if (!root) return;
  root.addEventListener("change", (event) => {
    const key = event.target.dataset.setting;
    if (key) return save(root, { [key]: event.target.checked }, toast);
    if (event.target.matches("[data-quiet-toggle]")) root.querySelector("[data-quiet-times]").hidden = !event.target.checked;
    if (event.target.matches("[data-quiet-toggle], [data-quiet]")) {
      const changes = quietChanges(root);
      if (changes.quiet_hours_start !== "" && changes.quiet_hours_end !== "") save(root, changes, toast);
    }
  });
  try {
    const settings = await getNotificationSettings();
    if (root.isConnected) paint(root, settings);
  } catch (err) {
    root.innerHTML = `<p class="of-muted">${escapeHtml(err.message || "Couldn't load your settings.")}</p>`;
  }
}
