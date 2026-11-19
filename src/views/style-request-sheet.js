// Style a Friend, the asking side: "Style me" goes into a chat as a style_request message, with
// what it's for and, optionally, a photo of you so a friend can try their look on you.
// The friend answers from the chat (src/views/stylist.js).

import { escapeHtml } from "../format.js";
import * as messages from "../messages-store.js";
import { ofIcons, pillCta } from "./components.js";
import { conversationAvatar, conversationTitle } from "./messages-inbox.js";
import { openNewChatSheet } from "./new-chat-sheet.js";
import { openSheet } from "./sheet.js";

const NOTE_MAX = 280;

function pickerRow(conversation, selected) {
  const detail =
    conversation.type === "circle"
      ? `${conversation.members.length} members`
      : `@${messages.otherMembers(conversation)[0]?.user.username || ""}`;
  return `<label class="of-pick-row">
    ${conversationAvatar(conversation, 44)}
    <span class="of-person-text"><b>${escapeHtml(conversationTitle(conversation))}</b><small>${escapeHtml(detail)}</small></span>
    <input type="radio" name="style-target" value="${conversation.id}" class="of-check" ${selected ? "checked" : ""} />
  </label>`;
}

function pickerHtml(selectedId) {
  const list = messages.conversations();
  const rows = list.map((c) => pickerRow(c, c.id === selectedId)).join("");
  const empty = list.length ? "" : `<p class="of-muted">No chats yet. Start one with a friend.</p>`;
  return `<p class="of-inbox-label">Ask</p>${rows}${empty}
    <button type="button" class="of-menu-row" data-picker-new><span class="of-menu-icon">${ofIcons.compose()}</span>New chat</button>`;
}

function formHtml({ askingOne, name }) {
  return `<div class="of-sheet-body of-form">
    <p class="of-style-ask-intro">${ofIcons.sparkle(18)}<span>${
      name ? `${escapeHtml(name)} puts a look together for you` : "A friend puts a look together for you"
    } from their saved pieces and fits, with links to shop it.</span></p>
    <label class="of-field-label">What's it for?
      <input class="of-field" maxlength="${NOTE_MAX}" data-style-note placeholder="Date night, under $100" />
    </label>
    <div class="of-field-label">Your photo (optional)
      <div class="of-style-ask-photo" data-photo-slot>
        <button type="button" class="of-photo-pick" data-pick-photo>${ofIcons.image(24)}<span>Add a photo of you</span></button>
      </div>
      <small class="of-style-ask-hint">A clear, full-length photo lets them try the look on you.</small>
      <input type="file" accept="image/*" hidden data-photo-input />
    </div>
    ${askingOne ? "" : `<div data-picker>${pickerHtml(messages.openConversationId())}</div>`}
  </div>
  <p class="of-toast-error" data-error hidden></p>
  ${pillCta({ label: "Send Style me", data: { "data-send-style": true } })}`;
}

// Where it goes: `conversationId` (from a chat), `userId` (from their profile: the direct chat
// with them, started if needed), or neither (pick a chat). onSent(conversationId) after sending.
export function openStyleRequestSheet({ conversationId = null, userId = null, name = "", onSent = () => {}, toast = () => {} } = {}) {
  const state = { file: null, previewUrl: null, sending: false };
  const askingOne = Boolean(conversationId || userId);
  const { root, close } = openSheet({ title: "Style me", body: formHtml({ askingOne, name }) });
  const error = root.querySelector("[data-error]");

  const repaintPicker = (selectedId) => {
    const picker = root.querySelector("[data-picker]");
    if (picker) picker.innerHTML = pickerHtml(selectedId);
  };
  if (!askingOne && !messages.isLoaded()) messages.loadConversations().then(() => repaintPicker(null));

  const showError = (problem) => {
    error.hidden = !problem;
    error.textContent = problem;
  };

  async function send() {
    if (state.sending) return;
    let target = conversationId || root.querySelector("input[name=style-target]:checked")?.value;
    if (!target && !userId) return showError("Pick who to ask.");
    state.sending = true;
    try {
      if (!target) target = await messages.startConversation({ memberIds: [userId] });
    } catch (err) {
      state.sending = false;
      return showError(err.message || "Couldn't open the chat.");
    }
    messages.sendDraft(target, {
      kind: "style_request",
      body: root.querySelector("[data-style-note]").value.trim() || null,
      file: state.file,
      previewUrl: state.previewUrl,
    });
    close();
    toast("Style me sent");
    onSent(target);
  }

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-pick-photo]")) return root.querySelector("[data-photo-input]").click();
    if (event.target.closest("[data-photo-remove]")) {
      state.file = state.previewUrl = null;
      root.querySelector("[data-photo-slot]").innerHTML =
        `<button type="button" class="of-photo-pick" data-pick-photo>${ofIcons.image(24)}<span>Add a photo of you</span></button>`;
      return;
    }
    if (event.target.closest("[data-picker-new]")) return openNewChatSheet({ onStarted: (id) => repaintPicker(id) });
    if (event.target.closest("[data-send-style]")) send();
  });
  root.addEventListener("change", (event) => {
    if (!event.target.matches("[data-photo-input]")) return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    state.file = file;
    state.previewUrl = URL.createObjectURL(file);
    root.querySelector("[data-photo-slot]").innerHTML = `<img class="of-style-ask-preview" src="${state.previewUrl}" alt="Your photo" />
      <button type="button" class="of-style-ask-remove" data-photo-remove aria-label="Remove photo">${ofIcons.close()}</button>`;
  });
  root.querySelector("[data-style-note]").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      send();
    }
  });
}
