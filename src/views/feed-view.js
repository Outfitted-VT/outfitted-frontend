import { currentUser } from "../data.js";
import { mountFitList } from "../feed.js";
import { escapeHtml, timeAgo } from "../format.js";
import { currentWeather, todayLabel, weatherText } from "../weather.js";
import { avatar } from "./components.js";
import { isLiveFit } from "./fit-card.js";

const EYE_PREVIEW = 2;

export const isLive = isLiveFit;
const is3dReady = (fit) => Boolean(fit.try_on_source) || fit.images.some((image) => image.generated);

const FILTERS = [
  { id: "foryou", label: "For you", path: "/fits", match: () => true, wide: true },
  { id: "circle", label: "Circle", path: "/fits/following", match: () => true, wide: true },
  { id: "live", label: "Live", path: "/fits", match: isLive, dot: true },
  { id: "3d", label: "3D ready", path: "/fits", match: is3dReady },
];

const feed = { filter: "foryou", eye: [], showAllEye: false };

export function fitTally(fit) {
  const votes = fit.votes || { wear: 0, rethink: 0 };
  const total = votes.wear + votes.rethink;
  return { total, pct: total ? Math.round((votes.wear * 100) / total) : 0 };
}

function eyeCard(fit) {
  return `<button type="button" class="of-eyecard" data-feed-open="${fit.id}">
    ${avatar(fit.author, { size: 44 })}
    <div class="of-eyecard-text">
      <span class="of-eyecard-who">${escapeHtml(fit.author.username)} <span>· ${timeAgo(fit.created_at)}</span></span>
      <span class="of-eyecard-q">${escapeHtml(fit.caption || "Wear it or rethink?")}</span>
    </div>
  </button>`;
}

function eyeSection() {
  if (!feed.eye.length) return "";
  const shown = feed.showAllEye ? feed.eye : feed.eye.slice(0, EYE_PREVIEW);
  const seeAll = `<button type="button" class="of-eye-all" data-feed-see-all>${feed.showAllEye ? "Show less" : "See all"}</button>`;
  return `<div class="of-eye-head"><span>NEEDS YOUR EYE · ${feed.eye.length}</span>${seeAll}</div>
    <div class="of-eyelist">${shown.map(eyeCard).join("")}</div>`;
}

function contextLine(weather) {
  return [todayLabel(), weatherText(weather).toUpperCase()].filter(Boolean).join(" · ");
}

function filterChip(f) {
  const on = feed.filter === f.id;
  const dot = f.dot ? '<span class="of-chip-dot"></span>' : "";
  return `<button type="button" class="of-chip ${f.wide ? "wide" : ""} ${on ? "on" : ""}" data-feed-filter="${f.id}" aria-pressed="${on}">${dot}${f.label}</button>`;
}

export function renderFeedScreen() {
  const chips = FILTERS.map(filterChip).join("");
  return `<section class="of-screen of-feed" id="of-feed">
    <div class="of-feed-intro">
      <div class="of-feed-context" id="feed-context">${contextLine(null)}</div>
      <h1 class="of-feed-title">What to wear <span>today?</span></h1>
    </div>
    <div class="of-feed-chips" role="group" aria-label="Filter fits">${chips}</div>
    <div class="of-feed-list" id="feed-fits"></div>
    <div class="of-feed-status" id="feed-status"></div>
    <div id="feed-sentinel" aria-hidden="true"></div>
  </section>`;
}

const activeFilter = () => FILTERS.find((f) => f.id === feed.filter);
const isMine = (fit) => fit.author.username === currentUser.username;

function paintEye(root) {
  root.querySelector("#feed-eye")?.remove();
  const firstCard = root.querySelector("#feed-fits > article");
  if (!firstCard || !feed.eye.length) return;
  const section = document.createElement("div");
  section.id = "feed-eye";
  section.className = "of-feed-eye";
  section.innerHTML = eyeSection();
  firstCard.after(section);
}

function collectEye(root, fits) {
  feed.eye = fits.slice(1).filter((fit) => !fit.my_vote && !isMine(fit));
  paintEye(root);
}

function setFilter(root, id, mountList) {
  if (feed.filter === id) return;
  feed.filter = id;
  feed.showAllEye = false;
  root.querySelectorAll("[data-feed-filter]").forEach((button) => {
    const on = button.dataset.feedFilter === id;
    button.classList.toggle("on", on);
    button.setAttribute("aria-pressed", String(on));
  });
  mountList();
}

async function paintWeather(root) {
  try {
    const weather = await currentWeather();
    const line = root.querySelector("#feed-context");
    if (line) line.textContent = contextLine(weather);
  } catch {}
}

function scrollToFit(root, id) {
  root.querySelector(`#feed-fits [data-fit-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function freshNode(root, selector) {
  const node = root.querySelector(selector);
  const fresh = node.cloneNode(false);
  node.replaceWith(fresh);
  return fresh;
}

export function mountFeed({ listOptions }) {
  const root = document.querySelector("#of-feed");
  if (!root) return;
  const mountList = () => {
    const filter = activeFilter();
    feed.eye = [];
    mountFitList({
      ...listOptions,
      list: freshNode(root, "#feed-fits"),
      status: freshNode(root, "#feed-status"),
      sentinel: freshNode(root, "#feed-sentinel"),
      path: filter.path,
      filter: filter.match,
      onFirstPage: (fits) => collectEye(root, fits),
    });
  };
  root.addEventListener("click", (event) => {
    const filterButton = event.target.closest("[data-feed-filter]");
    if (filterButton) return setFilter(root, filterButton.dataset.feedFilter, mountList);
    if (event.target.closest("[data-feed-see-all]")) {
      feed.showAllEye = !feed.showAllEye;
      return paintEye(root);
    }
    const open = event.target.closest("[data-feed-open]");
    if (open) scrollToFit(root, open.dataset.feedOpen);
  });
  paintWeather(root);
  mountList();
}
