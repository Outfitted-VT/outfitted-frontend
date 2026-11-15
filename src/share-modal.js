// "Share this look": send a fit to people in your circle (as a chat message), or copy its link.
// Direct Send lists your circle and searches it; sending opens or reuses a chat with that person
// and posts the fit there (message kind "fit", see src/views/messages-thread.js).

import { icons } from "./icons.js";
import { escapeHtml } from "./format.js";
import * as api from "./messages-api.js";
import * as messages from "./messages-store.js";
import { avatar, displayName } from "./views/components.js";

const share = { fitId: null, query: "", people: [], sent: new Set(), request: 0 };

export function renderShareModal() {
  return `
    <dialog class="of-share" id="share-fit-dialog" aria-labelledby="share-fit-heading">
      <div class="of-share-card">
        <div class="of-share-head">
          <h2 id="share-fit-heading">Share this look</h2>
          <button type="button" class="of-share-close" id="close-share-dialog" aria-label="Close">${icons.close}</button>
        </div>

        <div class="of-share-preview">
          <img src="" alt="" id="share-modal-img" />
          <div class="of-share-preview-text">
            <span class="of-share-tag" id="share-modal-tag"></span>
            <b id="share-modal-title"></b>
            <p id="share-modal-question"></p>
          </div>
        </div>

        <section class="of-share-section" id="share-direct">
          <p class="of-share-label">Send to</p>
          <label class="of-search share-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input type="search" id="share-search" placeholder="Search your circle" aria-label="Search your circle" autocomplete="off" />
          </label>
          <ul class="share-people" id="share-people"></ul>
        </section>

        <section class="of-share-section">
          <p class="of-share-label">Copy link</p>
          <div class="of-share-link">
            <input type="text" id="share-link-url" readonly value="" aria-label="Link to this fit" />
            <button type="button" class="of-share-copy" id="btn-copy-share-link">${icons.link}<span>Copy link</span></button>
          </div>
        </section>
      </div>
    </dialog>
  `;
}

function personRow(user) {
  const sent = share.sent.has(user.id);
  return `<li class="share-person" data-share-user="${escapeHtml(user.id)}">
    ${avatar(user, { size: 40 })}
    <span class="share-person-text"><b>${escapeHtml(displayName(user))}</b><small>@${escapeHtml(user.username)}</small></span>
    <button type="button" class="share-send ${sent ? "sent" : ""}" data-share-send ${sent ? "disabled" : ""}>${sent ? "Sent" : "Send"}</button>
  </li>`;
}

function paintPeople(dialog, note = "") {
  const list = dialog.querySelector("#share-people");
  if (note) {
    list.innerHTML = `<li class="share-note">${escapeHtml(note)}</li>`;
    return;
  }
  list.innerHTML = share.people.length
    ? share.people.map(personRow).join("")
    : `<li class="share-note">${share.query ? `No one in your circle matches "${escapeHtml(share.query)}".` : "Your circle is empty. Follow people to send them fits."}</li>`;
}

// Your circle (people you follow or who follow you); with a query, a search of it.
async function loadPeople(dialog) {
  const run = ++share.request;
  paintPeople(dialog, "Loading…");
  try {
    let people;
    if (share.query) {
      people = await api.searchCircle(share.query, 20);
    } else {
      if (!messages.circlePeople()?.length) await messages.loadCircle();
      people = (messages.circlePeople() || []).map((person) => person.user);
    }
    if (run !== share.request) return;
    share.people = people;
    paintPeople(dialog);
  } catch {
    if (run !== share.request) return;
    paintPeople(dialog, "Couldn't load your circle. Try again.");
  }
}

async function sendTo(dialog, row, toast) {
  const userId = row.dataset.shareUser;
  const button = row.querySelector("[data-share-send]");
  const user = share.people.find((p) => p.id === userId);
  button.disabled = true;
  button.textContent = "Sending…";
  try {
    const conversationId = await messages.startConversation({ memberIds: [userId] });
    await api.sendMessage(conversationId, { kind: "fit", fit_id: share.fitId, client_id: `share-${Date.now().toString(36)}-${userId.slice(0, 8)}` });
    share.sent.add(userId);
    button.classList.add("sent");
    button.textContent = "Sent";
    toast?.(`Sent to ${user ? displayName(user) : "them"}`);
  } catch (err) {
    button.disabled = false;
    button.textContent = "Send";
    toast?.(err.message || "Couldn't send the fit. Try again.");
  }
}

export function connectShareModal({ toast } = {}) {
  const dialog = document.querySelector("#share-fit-dialog");
  if (!dialog) return;

  const closeBtn = dialog.querySelector("#close-share-dialog");
  const copyBtn = dialog.querySelector("#btn-copy-share-link");
  const urlInput = dialog.querySelector("#share-link-url");
  const search = dialog.querySelector("#share-search");

  if (closeBtn) closeBtn.onclick = () => dialog.close();
  dialog.onclick = (e) => {
    if (e.target === dialog) return dialog.close();
    const row = e.target.closest("[data-share-send]")?.closest("[data-share-user]");
    if (row) sendTo(dialog, row, toast);
  };

  if (copyBtn && urlInput) {
    copyBtn.onclick = () => {
      navigator.clipboard?.writeText(urlInput.value).catch(() => {});
      copyBtn.innerHTML = `${icons.check}<span>Copied!</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = `${icons.link}<span>Copy link</span>`;
      }, 2000);
    };
  }

  let timer = null;
  if (search) {
    search.oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        share.query = search.value.trim();
        loadPeople(dialog);
      }, 200);
    };
  }
}

// post: { image, title, question, fileTag, fitId }. Direct Send shows only for a real fit (fitId).
export function openShareModalForPost(post) {
  const dialog = document.querySelector("#share-fit-dialog");
  if (!dialog || !post) return;

  dialog.querySelector("#share-modal-img").src = post.image || "";
  dialog.querySelector("#share-modal-tag").textContent = post.fileTag || "";
  dialog.querySelector("#share-modal-title").textContent = post.title || "";
  dialog.querySelector("#share-modal-question").textContent = post.question || "";
  dialog.querySelector("#share-link-url").value = `https://outfitted.app/fit/${post.fitId || post.id || "look"}`;

  share.fitId = post.fitId || null;
  share.query = "";
  share.sent = new Set();
  const search = dialog.querySelector("#share-search");
  if (search) search.value = "";
  dialog.querySelector("#share-direct").hidden = !share.fitId;
  if (share.fitId) loadPeople(dialog);

  dialog.showModal();
}
