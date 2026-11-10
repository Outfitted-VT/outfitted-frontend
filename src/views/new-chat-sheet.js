import { escapeHtml } from "../format.js";
import { searchCircle } from "../messages-api.js";
import * as messages from "../messages-store.js";
import { avatar, displayName, ofIcons, pillCta, stateBlock } from "./components.js";
import { openSheet } from "./sheet.js";

const SEARCH_DEBOUNCE_MS = 250;

function personRow(user, selected) {
  return `<label class="of-pick-row">
    ${avatar(user, { size: 44 })}
    <span class="of-person-text"><b>${escapeHtml(displayName(user))}</b><small>@${escapeHtml(user.username)}</small></span>
    <input type="checkbox" class="of-check square" value="${user.id}" data-person ${selected ? "checked" : ""} />
  </label>`;
}

function bodyHtml() {
  return `<label class="of-search">
      ${ofIcons.search()}
      <input type="search" placeholder="Search your circle" aria-label="Search your circle" data-chat-search autocomplete="off" />
    </label>
    <div class="of-sheet-body" data-people><p class="of-muted">Loading your circle…</p></div>
    <label class="of-field-label" data-circle-name hidden>Circle name (optional)
      <input class="of-field" maxlength="80" placeholder="Gallery night" data-title />
    </label>
    <p class="of-toast-error" data-error hidden></p>
    ${pillCta({ label: "Start chat", disabled: true, data: { "data-start": true } })}`;
}

function noResults(query) {
  const title = query ? `No one in your circle matches “${escapeHtml(query)}”` : "No one in your circle yet";
  return `<div class="of-no-results">
    <p class="of-muted">${title}</p>
    <button type="button" class="of-link" data-find-friends>Find friends</button>
  </div>`;
}

function loadError() {
  return stateBlock({
    icon: ofIcons.cloudOff(),
    title: "Couldn't load your circle",
    body: "Check your connection and try again.",
    cta: { label: "Try again", data: { "data-circle-retry": true } },
  });
}

export function openNewChatSheet({ onStarted }) {
  const selected = new Set();
  let timer = null;
  let request = 0;
  const { root, close } = openSheet({ title: "New chat", body: bodyHtml() });
  const people = root.querySelector("[data-people]");
  const start = root.querySelector("[data-start]");
  const error = root.querySelector("[data-error]");

  const paint = (users, query) => {
    people.innerHTML = users.length ? users.map((user) => personRow(user, selected.has(user.id))).join("") : noResults(query);
  };
  const refreshFooter = () => {
    start.disabled = selected.size === 0;
    root.querySelector("[data-circle-name]").hidden = selected.size < 2;
  };
  const search = async (query) => {
    const current = ++request;
    try {
      const users = await searchCircle(query);
      if (current === request) paint(users, query);
    } catch {
      if (current === request) people.innerHTML = loadError();
    }
  };

  root.querySelector("[data-chat-search]").addEventListener("input", (event) => {
    clearTimeout(timer);
    timer = setTimeout(() => search(event.target.value.trim()), SEARCH_DEBOUNCE_MS);
  });
  people.addEventListener("click", (event) => {
    if (event.target.closest("[data-circle-retry]")) search(root.querySelector("[data-chat-search]").value.trim());
    if (event.target.closest("[data-find-friends]")) {
      close();
      window.dispatchEvent(new CustomEvent("of:navigate", { detail: { tab: "friends" } }));
    }
  });
  people.addEventListener("change", (event) => {
    const box = event.target.closest("[data-person]");
    if (!box) return;
    if (box.checked) selected.add(box.value);
    else selected.delete(box.value);
    refreshFooter();
  });
  start.addEventListener("click", async () => {
    start.disabled = true;
    error.hidden = true;
    try {
      const id = await messages.startConversation({
        memberIds: [...selected],
        title: root.querySelector("[data-title]").value.trim() || null,
      });
      close();
      onStarted(id);
    } catch (err) {
      error.hidden = false;
      error.textContent = err.message || "Couldn't start the chat.";
      start.disabled = false;
    }
  });
  search("");
  return { close };
}
