// Text typed in a chat but not sent, per conversation, so it's still there when you come back.
// Kept in this browser only. A direct chat with nothing sent shows in the inbox only while it
// has one (src/views/messages-inbox.js).

const PREFIX = "chat-draft:";
const memory = new Map(); // used when localStorage isn't available

export function getDraft(conversationId) {
  try {
    return localStorage.getItem(PREFIX + conversationId) || "";
  } catch {
    return memory.get(conversationId) || "";
  }
}

export function setDraft(conversationId, text) {
  const value = text.trim() ? text : "";
  try {
    if (value) localStorage.setItem(PREFIX + conversationId, value);
    else localStorage.removeItem(PREFIX + conversationId);
  } catch {
    if (value) memory.set(conversationId, value);
    else memory.delete(conversationId);
  }
}
