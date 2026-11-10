import { escapeHtml } from "../format.js";
import { claimMilestone, currentStreak, lastWeek, loadStreak, MILESTONES, streakStartDay } from "../streak-store.js";
import { ofIcons, pillCta } from "./components.js";
import { openSheet } from "./sheet.js";

const dayLetter = (date) => date.toLocaleDateString("en-US", { weekday: "narrow" });

function weekHtml(streak) {
  return lastWeek(streak)
    .map((day) => {
      const cls = [day.active ? "on" : "", day.today ? "today" : ""].join(" ");
      const label = `${day.date.toLocaleDateString("en-US", { weekday: "long" })}${day.active ? ", posted" : ""}`;
      return `<span class="of-week-day"><span class="of-week-dot ${cls}" role="img" aria-label="${escapeHtml(label)}">${day.active ? ofIcons.check(14) : ""}</span><small>${dayLetter(day.date)}</small></span>`;
    })
    .join("");
}

function freezesHtml(streak) {
  const count = streak.freezes_available;
  if (!count) return `<p class="of-streak-freeze">${ofIcons.snowflake(16)}<span>Every 7 days in a row saves a freeze</span></p>`;
  const icons = Array.from({ length: count }, () => ofIcons.snowflake(16)).join("");
  return `<p class="of-streak-freeze on"><span class="of-freeze-icons">${icons}</span><span>${count} freeze${count === 1 ? "" : "s"} saved</span></p>`;
}

function milestoneHtml(streak) {
  const target = streak.next_milestone;
  if (!target) return "";
  const previous = [0, ...MILESTONES].filter((m) => m < target).pop();
  const pct = Math.round(((streak.current - previous) / (target - previous)) * 100);
  return `<div class="of-streak-next">
    <div class="of-streak-next-row"><span>Next milestone</span><b>${target} days</b></div>
    <div class="of-fit-track"><div class="of-fit-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>
  </div>`;
}

function hoursLeft(streak) {
  return `${Math.max(1, Math.floor(streak.hours_left_today))}h left to keep it`;
}

function sheetHtml(streak) {
  const pending = !streak.active_today;
  const status = pending
    ? `<p class="of-streak-left">${ofIcons.clock(14)}${escapeHtml(hoursLeft(streak))}</p>`
    : `<p class="of-streak-left done">${ofIcons.check(14)}You're in for today</p>`;
  return `<div class="of-sheet-body of-streak-body">
    <div class="of-streak-hero">
      <span class="of-streak-flame" aria-hidden="true">${ofIcons.flame(26)}</span>
      <span class="of-streak-count">${streak.current}</span>
      <span class="of-streak-label">day streak</span>
      ${streak.current ? status : ""}
    </div>
    <div class="of-week">${weekHtml(streak)}</div>
    ${freezesHtml(streak)}
    ${milestoneHtml(streak)}
    <p class="of-streak-help">Post a fit, share a story, or send a fit check each day to keep it going.</p>
  </div>
  ${pending ? pillCta({ label: "Post today's fit", data: { "data-streak-post": true } }) : ""}`;
}

export async function openStreakSheet({ onPost }) {
  const streak = currentStreak() || (await loadStreak());
  if (!streak) return;
  const { root, close } = openSheet({ title: "Your streak", body: sheetHtml(streak) });
  root.querySelector("[data-streak-post]")?.addEventListener("click", () => {
    close();
    onPost();
  });
}

export function showMilestone(count) {
  const overlay = document.createElement("div");
  overlay.className = "of-milestone-backdrop";
  overlay.innerHTML = `<div class="of-milestone" role="dialog" aria-modal="true" aria-labelledby="of-milestone-title">
    <span class="of-milestone-flame" aria-hidden="true">${ofIcons.flame(28)}</span>
    <span class="of-milestone-count" id="of-milestone-title">${count}</span>
    <span class="of-milestone-label">day streak!</span>
    <p class="of-milestone-body">Your circle can count on you. Keep showing up.</p>
    ${pillCta({ label: "Keep going", data: { "data-milestone-close": true } })}
  </div>`;
  const close = () => overlay.remove();
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-milestone-close]")) close();
  });
  document.body.append(overlay);
  overlay.querySelector("[data-milestone-close]").focus({ preventScroll: true });
}

export function celebrateIfMilestone(streak, count = streak?.current) {
  if (!streak || !MILESTONES.includes(count) || streak.current !== count) return;
  if (claimMilestone(count, streakStartDay(streak))) showMilestone(count);
}
