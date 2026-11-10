import { notificationFaces, notificationText, resolveThumb, thumbFor } from "./activity.js";

const SHOW_MS = 4000;

let current = null;

function dismiss(card) {
  if (!card.isConnected) return;
  card.classList.add("out");
  setTimeout(() => card.remove(), 250);
  if (current === card) current = null;
}

export async function showNotificationToast(item, onOpen) {
  current?.remove();
  await resolveThumb(item).catch(() => null);
  const card = document.createElement("button");
  card.type = "button";
  card.className = "of-note-toast";
  card.setAttribute("role", "status");
  card.innerHTML = `${notificationFaces(item, 40)}<span class="of-note-toast-text">${notificationText(item)}</span>${thumbFor(item)}`;
  card.addEventListener("click", () => {
    dismiss(card);
    onOpen(item);
  });
  current = card;
  document.body.append(card);
  setTimeout(() => dismiss(card), SHOW_MS);
}
