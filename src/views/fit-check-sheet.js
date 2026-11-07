import { mediaUrl } from "../fits.js";
import { escapeHtml } from "../format.js";
import * as messages from "../messages-store.js";
import { ofIcons, pillCta } from "./components.js";
import { conversationAvatar, conversationTitle } from "./messages-inbox.js";
import { openNewChatSheet } from "./new-chat-sheet.js";
import { openSheet } from "./sheet.js";

function pickerDetail(conversation) {
  if (conversation.type === "circle") return `${conversation.members.length} members`;
  return `@${messages.otherMembers(conversation)[0]?.user.username || ""}`;
}

function pickerRow(conversation, selected) {
  return `<label class="of-pick-row">
    ${conversationAvatar(conversation, 44)}
    <span class="of-person-text"><b>${escapeHtml(conversationTitle(conversation))}</b><small>${escapeHtml(pickerDetail(conversation))}</small></span>
    <input type="radio" name="fit-check-target" value="${conversation.id}" class="of-check" ${selected ? "checked" : ""} />
  </label>`;
}

function pickerHtml(selectedId) {
  const list = messages.conversations();
  const rows = list.map((c) => pickerRow(c, c.id === selectedId)).join("");
  const empty = list.length ? "" : `<p class="of-muted">No conversations yet. Start one to ask your circle.</p>`;
  return `<p class="of-inbox-label">Send to</p>${rows}${empty}
    <button type="button" class="of-menu-row" data-picker-new><span class="of-menu-icon">${ofIcons.compose()}</span>New chat</button>`;
}

function photoHtml(look) {
  if (look?.imageUrl) return `<img class="of-check-preview" src="${escapeHtml(mediaUrl(look.imageUrl))}" alt="Your look" />`;
  return `<button type="button" class="of-photo-pick" data-pick-photo>${ofIcons.image(24)}<span>Add a photo</span></button>
    <input type="file" accept="image/*" hidden data-photo-input />`;
}

function formHtml(look, conversationId) {
  return `<div class="of-sheet-body of-form">
    <div class="of-check-compose" data-photo-slot>${photoHtml(look)}</div>
    <label class="of-field-label">Your question
      <input class="of-field" maxlength="280" data-question placeholder="Too dressed up for drinks?" value="${escapeHtml(look?.question || "")}" />
    </label>
    <label class="of-field-label">Where to (optional)
      <input class="of-field" maxlength="60" data-context placeholder="Vernissage · 18°C" value="${escapeHtml(look?.context || "")}" />
    </label>
    ${conversationId ? "" : `<div data-picker>${pickerHtml(messages.openConversationId())}</div>`}
  </div>
  <p class="of-toast-error" data-error hidden></p>
  ${pillCta({ label: "Send fit check", data: { "data-send-check": true } })}`;
}

function showPhoto(root, file) {
  const url = URL.createObjectURL(file);
  root.querySelector("[data-photo-slot]").innerHTML = `<img class="of-check-preview" src="${url}" alt="Your photo" />`;
  return url;
}

function readForm(root, state) {
  return {
    question: root.querySelector("[data-question]").value.trim(),
    context: root.querySelector("[data-context]").value.trim() || null,
    target: state.conversationId || root.querySelector("input[name=fit-check-target]:checked")?.value,
  };
}

function validate(form, state, look) {
  if (!state.file && !look?.imageId) return "Add a photo of the look.";
  if (!form.question) return "Ask your circle a question.";
  if (!form.target) return "Pick who to send it to.";
  return "";
}

export function openFitCheckSheet({ conversationId = null, look = null, onSent = () => {} } = {}) {
  const state = { conversationId, file: null, previewUrl: null };
  const { root, close } = openSheet({ title: conversationId ? "Fit check" : "Ask my circle", body: formHtml(look, conversationId) });
  const error = root.querySelector("[data-error]");

  const repaintPicker = (selectedId) => {
    const picker = root.querySelector("[data-picker]");
    if (picker) picker.innerHTML = pickerHtml(selectedId);
  };
  if (!conversationId && !messages.isLoaded()) messages.loadConversations().then(() => repaintPicker(null));

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-pick-photo]")) return root.querySelector("[data-photo-input]").click();
    if (event.target.closest("[data-picker-new]")) {
      return openNewChatSheet({ onStarted: (id) => repaintPicker(id) });
    }
    if (!event.target.closest("[data-send-check]")) return;
    const form = readForm(root, state);
    const problem = validate(form, state, look);
    error.hidden = !problem;
    error.textContent = problem;
    if (problem) return;
    messages.sendDraft(form.target, {
      kind: "fit_check",
      file: state.file,
      imageId: look?.imageId,
      previewUrl: state.previewUrl || (look?.imageUrl ? mediaUrl(look.imageUrl) : null),
      question: form.question,
      context: form.context,
      fitId: look?.fitId,
    });
    close();
    onSent(form.target);
  });
  root.addEventListener("change", (event) => {
    if (!event.target.matches("[data-photo-input]")) return;
    const file = event.target.files?.[0];
    if (!file) return;
    state.file = file;
    state.previewUrl = showPhoto(root, file);
  });
}

export function openProductSheet({ conversationId }) {
  const { root, close } = openSheet({
    title: "Suggest a piece",
    body: `<div class="of-sheet-body of-form">
      <label class="of-field-label">Piece<input class="of-field" maxlength="120" data-name placeholder="Chunky Loafers" /></label>
      <label class="of-field-label">Color<input class="of-field" maxlength="40" data-color placeholder="Black" /></label>
      <label class="of-field-label">Price<input class="of-field" maxlength="20" data-price placeholder="$320" /></label>
      <label class="of-field-label">Link<input class="of-field" type="url" maxlength="500" data-url placeholder="https://" /></label>
      <label class="of-field-label">Note (optional)<input class="of-field" maxlength="2000" data-note placeholder="Or try these instead?" /></label>
    </div>
    <p class="of-toast-error" data-error hidden></p>
    ${pillCta({ label: "Send suggestion", data: { "data-send-product": true } })}`,
  });
  const value = (key) => root.querySelector(`[data-${key}]`).value.trim();
  root.querySelector("[data-send-product]").addEventListener("click", () => {
    const url = value("url");
    const error = root.querySelector("[data-error]");
    const problem = !value("name") ? "Name the piece." : url && !/^https?:\/\//.test(url) ? "Links start with http:// or https://" : "";
    error.hidden = !problem;
    error.textContent = problem;
    if (problem) return;
    messages.sendDraft(conversationId, {
      kind: "product",
      body: value("note") || null,
      product: { name: value("name"), color: value("color") || null, price: value("price") || null, url: url || null },
    });
    close();
  });
}
