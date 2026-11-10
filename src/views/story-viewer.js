import { confirmDialog } from "../confirm-dialog.js";
import { currentUser } from "../data.js";
import { mediaUrl } from "../fits.js";
import { escapeHtml, timeAgo } from "../format.js";
import * as stories from "../stories-store.js";
import { getStoryViewers, replyToStory } from "../stories-api.js";
import { avatar, displayName, ofIcons } from "./components.js";
import { openSheet } from "./sheet.js";

const STORY_MS = 5000;
const HOLD_MS = 200;
const SWIPE_CLOSE_PX = 90;
const SENT_MS = 1500;
const QUICK_REACTIONS = ["Wear it", "Rethink", "10/10"];

const firstName = (user) => displayName(user).split(/\s+/)[0];
const shortAgo = (iso) => timeAgo(iso).replace(" ago", "");
const clientId = () => `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function frameHtml() {
  return `<div class="of-sv" role="dialog" aria-modal="true" aria-label="Story">
    <div class="of-sv-frame">
      <img class="of-sv-img" alt="" />
      <div class="of-sv-shade" aria-hidden="true"></div>
      <div class="of-sv-tap" data-sv-tap aria-hidden="true"></div>
      <div class="of-sv-top">
        <div class="of-sv-bars" data-sv-bars></div>
        <div class="of-sv-head" data-sv-head></div>
      </div>
      <div class="of-sv-bottom" data-sv-bottom></div>
      <span class="of-sv-sent" data-sv-sent role="status" hidden>Sent</span>
    </div>
  </div>`;
}

function barsHtml(group, index) {
  return group.stories
    .map((_, i) => `<span class="of-sv-bar"><i style="width:${i < index ? 100 : 0}%"></i></span>`)
    .join("");
}

function headHtml(group, story, own) {
  const more = own ? `<button type="button" class="of-sv-icon" data-sv-more aria-label="Story options">${ofIcons.more(22)}</button>` : "";
  return `${avatar(group.user, { size: 32 })}
    <span class="of-sv-who"><b>${escapeHtml(own ? "Your story" : displayName(group.user))}</b><time>${escapeHtml(shortAgo(story.created_at))}</time></span>
    ${more}
    <button type="button" class="of-sv-icon" data-sv-close aria-label="Close">${ofIcons.close(22)}</button>`;
}

function captionHtml(story) {
  const caption = story.caption ? `<p class="of-sv-caption">${escapeHtml(story.caption)}</p>` : "";
  const fit = story.fit_id ? `<button type="button" class="of-sv-fit" data-sv-fit="${escapeHtml(story.fit_id)}">View fit${ofIcons.arrow(16)}</button>` : "";
  return caption || fit ? `<div class="of-sv-caption-wrap">${caption}${fit}</div>` : "";
}

function replyHtml(group) {
  const chips = QUICK_REACTIONS.map((label) => `<button type="button" class="of-sv-chip" data-sv-react="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join("");
  return `<div class="of-sv-chips">${chips}</div>
    <form class="of-sv-reply" data-sv-reply>
      <label class="of-sv-field"><span class="of-sr">Reply</span><input type="text" maxlength="2000" autocomplete="off" placeholder="Reply to ${escapeHtml(firstName(group.user))}" data-sv-input /></label>
      <button type="submit" class="of-sv-send" aria-label="Send reply">${ofIcons.arrowUp(18)}</button>
    </form>`;
}

function seenHtml(story, viewers) {
  const count = story.view_count || 0;
  const faces = viewers.slice(0, 3).map((v) => avatar(v.user, { size: 28 })).join("");
  return `<button type="button" class="of-sv-seen" data-sv-viewers>
    ${faces ? `<span class="of-sv-faces" aria-hidden="true">${faces}</span>` : ""}
    <span>Seen by ${count}</span>
  </button>`;
}

function viewerRow(viewer) {
  return `<div class="of-person-row">${avatar(viewer.user, { size: 44 })}
    <span class="of-person-text"><b>${escapeHtml(displayName(viewer.user))}</b><small>@${escapeHtml(viewer.user.username)} · ${escapeHtml(timeAgo(viewer.viewed_at))}</small></span></div>`;
}

export async function openViewersSheet(storyId, { onClose = () => {} } = {}) {
  const { root } = openSheet({
    title: "Viewers",
    body: `<div class="of-sheet-body" data-viewers><p class="of-muted">Loading…</p></div>`,
    onClose,
  });
  const list = root.querySelector("[data-viewers]");
  try {
    const page = await getStoryViewers(storyId, { limit: 50 });
    list.innerHTML = page.items.length ? page.items.map(viewerRow).join("") : `<p class="of-muted">No one has seen this story yet.</p>`;
  } catch (err) {
    list.innerHTML = `<p class="of-muted">${escapeHtml(err.message || "Couldn't load viewers.")}</p>`;
  }
  return root;
}

export function openStoryViewer({ groups, groupIndex = 0, storyId = null, toast, onOpenFit }) {
  const live = groups.map(stories.liveGroup).filter((g) => g.stories.length);
  if (!live.length) return toast("Story expired");
  const state = { groups: live, gi: Math.min(groupIndex, live.length - 1), si: 0, elapsed: 0, paused: new Set(), raf: 0, last: 0, viewers: new Map() };
  const host = document.createElement("div");
  host.innerHTML = frameHtml();
  const root = host.firstElementChild;
  const $ = (selector) => root.querySelector(selector);
  const group = () => state.groups[state.gi];
  const story = () => group().stories[state.si];
  const isOwn = () => group().user.id === currentUser.id;

  const firstUnseen = (g) => Math.max(0, g.stories.findIndex((s) => !s.seen));
  const startAt = storyId ? group().stories.findIndex((s) => s.id === storyId) : firstUnseen(group());
  state.si = Math.max(0, startAt);

  function pause(reason) {
    state.paused.add(reason);
  }

  function resume(reason) {
    state.paused.delete(reason);
    state.last = performance.now();
  }

  function fill() {
    const bar = root.querySelectorAll(".of-sv-bar i")[state.si];
    if (bar) bar.style.width = `${Math.min(100, (state.elapsed / STORY_MS) * 100)}%`;
  }

  function tick(now) {
    if (!state.paused.size) state.elapsed += now - state.last;
    state.last = now;
    fill();
    if (state.elapsed >= STORY_MS) return next();
    state.raf = requestAnimationFrame(tick);
  }

  function restartTimer() {
    cancelAnimationFrame(state.raf);
    state.elapsed = 0;
    state.last = performance.now();
    state.raf = requestAnimationFrame(tick);
  }

  async function loadViewers(current) {
    if (state.viewers.has(current.id)) return;
    state.viewers.set(current.id, []);
    try {
      state.viewers.set(current.id, (await getStoryViewers(current.id, { limit: 3 })).items);
      if (story()?.id === current.id) paintBottom();
    } catch {}
  }

  function paintBottom() {
    const current = story();
    const bottom = isOwn() ? seenHtml(current, state.viewers.get(current.id) || []) : replyHtml(group());
    $("[data-sv-bottom]").innerHTML = captionHtml(current) + bottom;
  }

  function preloadNext() {
    const upcoming = group().stories[state.si + 1] || state.groups[state.gi + 1]?.stories[0];
    if (upcoming) new Image().src = mediaUrl(upcoming.image.url);
  }

  function show() {
    const current = story();
    if (!stories.isLive(current)) {
      group().stories.splice(state.si, 1);
      if (!group().stories.length) state.groups.splice(state.gi, 1);
      if (!state.groups[state.gi]) return close();
      state.si = Math.min(state.si, group().stories.length - 1);
      return show();
    }
    $("[data-sv-bars]").innerHTML = barsHtml(group(), state.si);
    $("[data-sv-head]").innerHTML = headHtml(group(), current, isOwn());
    paintBottom();
    const img = $(".of-sv-img");
    pause("loading");
    img.onload = img.onerror = () => resume("loading");
    img.src = mediaUrl(current.image.url);
    stories.markSeen(current);
    if (isOwn()) loadViewers(current);
    preloadNext();
    restartTimer();
  }

  function next() {
    if (state.si < group().stories.length - 1) state.si += 1;
    else if (state.gi < state.groups.length - 1) {
      state.gi += 1;
      state.si = firstUnseen(group());
    } else return close();
    show();
  }

  function prev() {
    if (state.si > 0) state.si -= 1;
    else if (state.gi > 0) {
      state.gi -= 1;
      state.si = 0;
    }
    show();
  }

  function flashSent() {
    const sent = $("[data-sv-sent]");
    sent.hidden = false;
    setTimeout(() => (sent.hidden = true), SENT_MS);
  }

  async function sendReply(body) {
    const text = body.trim();
    if (!text) return;
    const current = story();
    try {
      await replyToStory(current.id, text, clientId());
      flashSent();
    } catch (err) {
      toast(err.message || "Couldn't send your reply.");
    }
  }

  function openMore() {
    pause("sheet");
    const current = story();
    const { root: sheet, close: closeSheet } = openSheet({
      title: "Story",
      body: `<div class="of-sheet-body"><button type="button" class="of-menu-row danger" data-sv-delete>${ofIcons.trash()}Delete story</button></div>`,
      onClose: () => resume("sheet"),
    });
    sheet.querySelector("[data-sv-delete]").addEventListener("click", async () => {
      closeSheet();
      pause("sheet");
      const deleted = await confirmDialog({
        title: "Delete this story?",
        message: "It disappears for everyone right away.",
        confirmLabel: "Delete",
        busyLabel: "Deleting…",
        danger: true,
        onConfirm: () => stories.removeStory(current.id),
      }).catch(() => toast("Couldn't delete the story."));
      resume("sheet");
      if (!deleted) return;
      group().stories.splice(state.si, 1);
      if (!group().stories.length) return close();
      state.si = Math.min(state.si, group().stories.length - 1);
      show();
    });
  }

  function onClick(event) {
    if (event.target.closest("[data-sv-close]")) return close();
    if (event.target.closest("[data-sv-more]")) return openMore();
    if (event.target.closest("[data-sv-viewers]")) {
      pause("sheet");
      return openViewersSheet(story().id, { onClose: () => resume("sheet") });
    }
    const fit = event.target.closest("[data-sv-fit]");
    if (fit) {
      close();
      return onOpenFit(fit.dataset.svFit);
    }
    const reaction = event.target.closest("[data-sv-react]");
    if (reaction) sendReply(reaction.dataset.svReact);
  }

  function onSubmit(event) {
    if (!event.target.closest("[data-sv-reply]")) return;
    event.preventDefault();
    const input = $("[data-sv-input]");
    sendReply(input.value);
    input.value = "";
    input.blur();
  }

  function attachGestures() {
    const tap = $("[data-sv-tap]");
    let press = null;
    tap.addEventListener("pointerdown", (event) => {
      press = { x: event.clientX, y: event.clientY, dy: 0, held: false };
      press.timer = setTimeout(() => {
        press.held = true;
        pause("hold");
      }, HOLD_MS);
    });
    tap.addEventListener("pointermove", (event) => {
      if (!press) return;
      press.dy = Math.max(0, event.clientY - press.y);
      if (press.dy > 8) {
        clearTimeout(press.timer);
        pause("hold");
        root.style.transform = `translateY(${press.dy}px)`;
      }
    });
    const end = (event) => {
      if (!press) return;
      const { dy, held, x } = press;
      clearTimeout(press.timer);
      press = null;
      root.style.transform = "";
      resume("hold");
      if (dy > SWIPE_CLOSE_PX) return close();
      if (held || dy > 8 || event.type === "pointercancel") return;
      if (x < tap.getBoundingClientRect().width / 3) prev();
      else next();
    };
    tap.addEventListener("pointerup", end);
    tap.addEventListener("pointercancel", end);
  }

  const onKey = (event) => {
    if (document.activeElement?.matches?.("[data-sv-input]")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") prev();
  };

  const onVisibility = () => (document.visibilityState === "visible" ? resume("hidden") : pause("hidden"));

  const unsubscribe = stories.subscribe((change) => {
    if (change.type !== "viewed" || story()?.id !== change.storyId) return;
    story().view_count = change.count;
    const viewers = state.viewers.get(change.storyId) || [];
    if (change.viewer && !viewers.some((v) => v.user.id === change.viewer.id)) {
      state.viewers.set(change.storyId, [{ user: change.viewer, viewed_at: new Date().toISOString() }, ...viewers]);
    }
    paintBottom();
  });

  function close() {
    cancelAnimationFrame(state.raf);
    unsubscribe();
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("visibilitychange", onVisibility);
    root.remove();
  }

  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  root.addEventListener("focusin", (event) => event.target.matches("[data-sv-input]") && pause("input"));
  root.addEventListener("focusout", (event) => event.target.matches("[data-sv-input]") && resume("input"));
  document.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVisibility);
  attachGestures();
  document.body.append(root);
  show();
  return { close };
}
