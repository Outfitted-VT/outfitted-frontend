import { icons } from "./icons.js";
import { currentUser, messagesData } from "./data.js";
import { getConversation, listThreads, mediaUrl, sendMessage } from "./fits.js";
import { escapeHtml, timeAgo } from "./format.js";
import { openVirtualDressingRoom } from "./tryon-modal.js";

let activePartnerUsername = null;
let activePartnerInfo = null;
let liveConversation = [];
let attachedFitForChat = null;

export function renderMessagesView() {
  const activeThread = messagesData[0];

  return `
    <div class="messages-page" id="messages-page">
      <div class="messages-layout">
        <!-- Thread List Sidebar -->
        <aside class="threads-sidebar">
          <div class="threads-head">
            <h2>Messages & Fit Checks</h2>
            <button class="icon-button" id="btn-new-chat" aria-label="New message">${icons.plus}</button>
          </div>
          <div class="thread-search">
            <span class="search-icon">${icons.search}</span>
            <input type="text" id="thread-search-input" placeholder="Search friends or groups..." />
          </div>
          <div class="threads-list" id="threads-list-box">
            ${messagesData
              .map(
                (thread, i) => `
                <div class="thread-item ${i === 0 ? "active" : ""}" data-thread-id="${thread.id}" data-username="${thread.handle ? thread.handle.replace('@', '') : ''}">
                  <div class="thread-avatar-wrap">
                    <img src="${thread.avatar}" alt="${escapeHtml(thread.title)}" class="thread-avatar" />
                    ${thread.isGroup ? `<span class="group-badge">Group</span>` : `<span class="online-indicator"></span>`}
                  </div>
                  <div class="thread-info">
                    <div class="thread-info-top">
                      <strong>${escapeHtml(thread.title)}</strong>
                      <small>${thread.time}</small>
                    </div>
                    <p class="thread-preview">${escapeHtml(thread.lastMessage)}</p>
                  </div>
                  ${thread.unread > 0 ? `<span class="unread-count">${thread.unread}</span>` : ""}
                </div>
              `
              )
              .join("")}
          </div>
        </aside>

        <!-- Active Conversation Viewport -->
        <main class="chat-viewport" id="active-chat-viewport">
          <header class="chat-header">
            <button class="icon-button btn-chat-back" id="btn-chat-back" aria-label="Back to threads">
              ${icons.arrowLeft}
            </button>
            <div class="chat-header-info">
              <img src="${activeThread.avatar}" alt="${escapeHtml(activeThread.title)}" class="chat-avatar-lg" id="chat-header-avatar" />
              <div>
                <h3 id="chat-header-title">${escapeHtml(activeThread.title)}</h3>
                <p id="chat-header-subtitle">
                  ${activeThread.isGroup ? `${activeThread.members.join(", ")} · Active now` : `${activeThread.handle || "@active"} · Active in conversation`}
                </p>
              </div>
            </div>
            <div class="chat-header-actions">
              <button class="button button-outline" id="btn-share-fit-to-chat" title="Attach fit to message">
                ${icons.hanger}<span>Attach Fit</span>
              </button>
            </div>
          </header>

          <div class="chat-scroll" id="chat-messages-container">
            <!-- Messages inserted here -->
          </div>

          <!-- Quick Super Reactions Bar -->
          <div class="chat-reaction-strip">
            <span class="react-hint">Super React:</span>
            <button class="chat-react-btn" data-emoji="🎧">🎧</button>
            <button class="chat-react-btn" data-emoji="💍">💍</button>
            <button class="chat-react-btn" data-emoji="🍦">🍦</button>
            <button class="chat-react-btn" data-emoji="💖">💖</button>
            <button class="chat-react-btn" data-emoji="🧁">🧁</button>
            <button class="chat-react-btn" data-emoji="🎀">🎀</button>
          </div>

          <!-- Optional Attached Fit Indicator -->
          <div id="chat-attached-fit-pill" class="hidden px-margin py-1.5 bg-secondary-fixed/50 border-t border-secondary/20 flex items-center justify-between text-secondary text-label-sm">
            <span class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">checkroom</span>
              <span id="chat-attached-fit-name">Attached: Weekend Denim Fit</span>
            </span>
            <button type="button" class="text-on-surface-variant hover:text-error" id="btn-cancel-fit-attachment">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <form class="chat-footer-composer" id="chat-composer-form">
            <input type="text" id="chat-text-input" placeholder="Drop styling advice, share opinions, or ask about pieces..." required autocomplete="off" />
            <button type="submit" class="button button-dark" aria-label="Send">${icons.send}</button>
          </form>
        </main>
      </div>
    </div>
  `;
}

export function connectMessages(options = {}) {
  const container = document.querySelector("#messages-page");
  if (!container) return;

  const messagesBox = container.querySelector("#chat-messages-container");
  const composerForm = container.querySelector("#chat-composer-form");
  const textInput = container.querySelector("#chat-text-input");
  const headerTitle = container.querySelector("#chat-header-title");
  const headerSubtitle = container.querySelector("#chat-header-subtitle");
  const headerAvatar = container.querySelector("#chat-header-avatar");
  const threadsListBox = container.querySelector("#threads-list-box");
  const layout = container.querySelector(".messages-layout");
  const btnBack = container.querySelector("#btn-chat-back");
  const attachedPill = container.querySelector("#chat-attached-fit-pill");
  const attachedName = container.querySelector("#chat-attached-fit-name");
  const btnCancelAttached = container.querySelector("#btn-cancel-fit-attachment");
  const btnAttachFit = container.querySelector("#btn-share-fit-to-chat");

  if (btnBack && layout) {
    btnBack.onclick = () => layout.classList.remove("chat-active");
  }

  if (btnCancelAttached) {
    btnCancelAttached.onclick = () => {
      attachedFitForChat = null;
      attachedPill?.classList.add("hidden");
    };
  }

  if (btnAttachFit) {
    btnAttachFit.onclick = () => {
      attachedFitForChat = {
        title: "Weekend Denim & Knit",
        image: "./assets/feed/maya_fit.png",
      };
      if (attachedName) attachedName.textContent = `Attached: ${attachedFitForChat.title}`;
      attachedPill?.classList.remove("hidden");
      options.toast?.("Attached outfit to chat composer");
    };
  }

  function renderMessageItem(msg) {
    const isMe = msg.sender.username === currentUser.username;
    const name = msg.sender.full_name || msg.sender.username;
    const initial = (name || "U").charAt(0).toUpperCase();

    return `
      <div class="chat-msg-row ${isMe ? "me" : "them"}">
        ${!isMe ? `<span class="avatar-chip micro">${escapeHtml(initial)}</span>` : ""}
        <div class="chat-msg-bubble">
          ${!isMe ? `<span class="sender-label">${escapeHtml(name)}</span>` : ""}
          <p class="msg-text">${escapeHtml(msg.content)}</p>
          ${
            msg.fit
              ? `
              <div class="inchat-fit-card mt-2">
                <img src="${escapeHtml(mediaUrl(msg.fit.images?.[0]?.url || './assets/feed/maya_fit.png'))}" alt="Attached fit" class="rounded-lg object-cover w-full aspect-[4/5]" />
                <div class="inchat-fit-meta p-2">
                  <strong>${escapeHtml(msg.fit.caption || "Attached Look")}</strong>
                  <div class="inchat-vote-row mt-2 flex gap-2">
                    <button type="button" class="button button-primary button-sm btn-inchat-tryon" data-fit-img="${escapeHtml(mediaUrl(msg.fit.images?.[0]?.url || './assets/feed/maya_fit.png'))}">
                      Try this fit on
                    </button>
                  </div>
                </div>
              </div>`
              : ""
          }
          <span class="msg-time">${timeAgo(msg.created_at)}</span>
        </div>
      </div>
    `;
  }

  async function openConversationWith(username, partnerData = null) {
    activePartnerUsername = username;
    activePartnerInfo = partnerData;

    headerTitle.textContent = partnerData?.full_name || partnerData?.username || username;
    headerSubtitle.textContent = `@${username} · Direct Conversation`;
    if (headerAvatar && partnerData?.avatar?.url) {
      headerAvatar.src = mediaUrl(partnerData.avatar.url);
    }

    if (layout) layout.classList.add("chat-active");

    messagesBox.innerHTML = `
      <div class="py-8 text-center text-on-surface-variant font-label-md flex items-center justify-center gap-2">
        <span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
        <span>Loading messages with @${escapeHtml(username)}…</span>
      </div>
    `;

    try {
      liveConversation = await getConversation(username);
      renderLiveConversation();
    } catch {
      // Fallback local mock messages for demo
      const fallbackThread = messagesData.find((t) => t.handle?.includes(username)) || messagesData[0];
      messagesBox.innerHTML = `
        <div class="chat-intro-banner">
          <p><strong>${escapeHtml(fallbackThread.title)}</strong></p>
          <small>Direct fashion opinions & styling coordination.</small>
        </div>
        ${fallbackThread.messages
          .map((m) => {
            const isMe = m.sender === currentUser.name;
            return `
              <div class="chat-msg-row ${isMe ? "me" : "them"}">
                ${!isMe ? `<span class="avatar-chip micro">${m.initial}</span>` : ""}
                <div class="chat-msg-bubble">
                  ${!isMe ? `<span class="sender-label">${escapeHtml(m.sender)}</span>` : ""}
                  <p class="msg-text">${escapeHtml(m.text)}</p>
                  <span class="msg-time">${m.time}</span>
                </div>
              </div>
            `;
          })
          .join("")}
      `;
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }
  }

  function renderLiveConversation() {
    if (!liveConversation.length) {
      messagesBox.innerHTML = `
        <div class="chat-intro-banner text-center py-12">
          <p class="font-headline-md font-semibold text-on-surface">Start styling with @${escapeHtml(activePartnerUsername)}</p>
          <small class="text-on-surface-variant">Send outfit checks, ask for sizing opinions, or swap pieces.</small>
        </div>
      `;
      return;
    }

    messagesBox.innerHTML = liveConversation.map(renderMessageItem).join("");
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // In-chat try-on buttons
    messagesBox.querySelectorAll(".btn-inchat-tryon").forEach((btn) => {
      btn.onclick = () => {
        const img = btn.dataset.fitImg;
        openVirtualDressingRoom({ image: img, name: "Friend's Shared Fit" });
      };
    });
  }

  // Load threads
  async function loadThreads() {
    try {
      const threads = await listThreads();
      if (threads && threads.length > 0) {
        threadsListBox.innerHTML = threads
          .map(
            (t, i) => `
            <div class="thread-item ${i === 0 ? "active" : ""}" data-username="${escapeHtml(t.partner.username)}">
              <div class="thread-avatar-wrap">
                <span class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold overflow-hidden">
                  ${
                    t.partner.avatar?.url
                      ? `<img src="${escapeHtml(mediaUrl(t.partner.avatar.url))}" alt="${escapeHtml(t.partner.username)}" class="w-full h-full object-cover" />`
                      : escapeHtml((t.partner.full_name || t.partner.username || "U").charAt(0).toUpperCase())
                  }
                </span>
                <span class="online-indicator"></span>
              </div>
              <div class="thread-info">
                <div class="thread-info-top">
                  <strong>${escapeHtml(t.partner.full_name || t.partner.username)}</strong>
                  <small>${timeAgo(t.last_message.created_at)}</small>
                </div>
                <p class="thread-preview">${escapeHtml(t.last_message.content)}</p>
              </div>
              ${t.unread_count > 0 ? `<span class="unread-count">${t.unread_count}</span>` : ""}
            </div>
          `
          )
          .join("");

        threadsListBox.querySelectorAll(".thread-item").forEach((item) => {
          item.onclick = () => {
            threadsListBox.querySelectorAll(".thread-item").forEach((t) => t.classList.remove("active"));
            item.classList.add("active");
            openConversationWith(item.dataset.username);
          };
        });

        // Open first thread by default
        openConversationWith(threads[0].partner.username, threads[0].partner);
        return;
      }
    } catch {
      // Backend not reached, keep fallback
    }

    // Default to fallback threads
    threadsListBox.querySelectorAll(".thread-item").forEach((item) => {
      item.onclick = () => {
        threadsListBox.querySelectorAll(".thread-item").forEach((t) => t.classList.remove("active"));
        item.classList.add("active");
        const u = item.dataset.username || "maya.p";
        openConversationWith(u);
      };
    });
    openConversationWith("maya.p");
  }

  loadThreads();

  // Sending message
  if (composerForm) {
    composerForm.onsubmit = async (e) => {
      e.preventDefault();
      const text = textInput.value.trim();
      if (!text) return;
      textInput.value = "";

      const partner = activePartnerUsername || "maya.p";
      try {
        const sent = await sendMessage(partner, { content: text });
        liveConversation.push(sent);
        renderLiveConversation();
      } catch {
        // Fallback local UI push
        const fallbackMsg = {
          sender: { username: currentUser.username, full_name: currentUser.name },
          content: text,
          created_at: new Date().toISOString(),
        };
        liveConversation.push(fallbackMsg);
        renderLiveConversation();
      }

      attachedFitForChat = null;
      attachedPill?.classList.add("hidden");
    };
  }

  // Super reactions
  container.querySelectorAll(".chat-react-btn").forEach((btn) => {
    btn.onclick = () => {
      const emoji = btn.dataset.emoji;
      if (textInput) {
        textInput.value += ` ${emoji}`;
        textInput.focus();
      }
    };
  });
}
