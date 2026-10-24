import { icons } from "./icons.js";
import { messagesData, posts, currentUser } from "./data.js";

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
                <div class="thread-item ${i === 0 ? "active" : ""}" data-thread-id="${thread.id}">
                  <div class="thread-avatar-wrap">
                    <img src="${thread.avatar}" alt="${thread.title}" class="thread-avatar" />
                    ${thread.isGroup ? `<span class="group-badge">Group</span>` : `<span class="online-indicator"></span>`}
                  </div>
                  <div class="thread-info">
                    <div class="thread-info-top">
                      <strong>${thread.title}</strong>
                      <small>${thread.time}</small>
                    </div>
                    <p class="thread-preview">${thread.lastMessage}</p>
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
            <div class="chat-header-info">
              <img src="${activeThread.avatar}" alt="${activeThread.title}" class="chat-avatar-lg" id="chat-header-avatar" />
              <div>
                <h3 id="chat-header-title">${activeThread.title}</h3>
                <p id="chat-header-subtitle">
                  ${activeThread.isGroup ? `${activeThread.members.join(", ")} · Active now` : `${activeThread.handle || "@active"} · In conversation`}
                </p>
              </div>
            </div>
            <div class="chat-header-actions">
              <button class="button button-outline" id="btn-share-fit-to-chat">
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

          <form class="chat-footer-composer" id="chat-composer-form">
            <input type="text" id="chat-text-input" placeholder="Drop styling advice, share opinions, or ask about pieces..." required autocomplete="off" />
            <button type="submit" class="button button-dark" aria-label="Send">${icons.send}</button>
          </form>
        </main>
      </div>
    </div>
  `;
}

export function connectMessages() {
  const container = document.querySelector("#messages-page");
  if (!container) return;

  let currentThreadId = messagesData[0].id;
  const messagesBox = container.querySelector("#chat-messages-container");
  const composerForm = container.querySelector("#chat-composer-form");
  const textInput = container.querySelector("#chat-text-input");
  const headerTitle = container.querySelector("#chat-header-title");
  const headerSubtitle = container.querySelector("#chat-header-subtitle");
  const headerAvatar = container.querySelector("#chat-header-avatar");

  function renderMessagesForThread(threadId) {
    const thread = messagesData.find((t) => t.id === threadId);
    if (!thread) return;

    headerTitle.textContent = thread.title;
    headerSubtitle.textContent = thread.isGroup
      ? `${thread.members.join(", ")} · Active now`
      : `${thread.handle || "@friend"} · Active in conversation`;
    headerAvatar.src = thread.avatar;

    // Render list
    messagesBox.innerHTML = `
      <div class="chat-intro-banner">
        <p><strong>${thread.title}</strong></p>
        <small>Real opinions worth hearing. No judgment, just good taste.</small>
      </div>

      ${thread.messages
        .map((msg) => {
          const isMe = msg.sender === currentUser.name;
          return `
            <div class="chat-msg-row ${isMe ? "me" : "them"}">
              ${!isMe ? `<span class="avatar-chip micro">${msg.initial}</span>` : ""}
              <div class="chat-msg-bubble">
                ${!isMe ? `<span class="sender-label">${msg.sender}</span>` : ""}
                <p class="msg-text">${msg.text}</p>
                ${msg.fitCard ? renderEmbeddedFitCard(msg.fitCard) : ""}
                <span class="msg-time">${msg.time}</span>
              </div>
            </div>
          `;
        })
        .join("")}
    `;

    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function renderEmbeddedFitCard(fit) {
    return `
      <div class="inchat-fit-card">
        <img src="${fit.image}" alt="${fit.title}" />
        <div class="inchat-fit-meta">
          <strong>${fit.title}</strong>
          <p>${fit.question}</p>
          <div class="inchat-vote-row">
            <button class="button button-outline inchat-vote" data-vote="yes">Wear it 🔥</button>
            <button class="button button-outline inchat-vote" data-vote="no">Rethink 🤔</button>
          </div>
        </div>
      </div>
    `;
  }

  renderMessagesForThread(currentThreadId);

  // Thread switching
  container.querySelectorAll(".thread-item").forEach((item) => {
    item.onclick = () => {
      container.querySelectorAll(".thread-item").forEach((t) => t.classList.remove("active"));
      item.classList.add("active");
      currentThreadId = item.dataset.threadId;
      renderMessagesForThread(currentThreadId);
    };
  });

  // Sending a message
  if (composerForm) {
    composerForm.onsubmit = (e) => {
      e.preventDefault();
      const val = textInput.value.trim();
      if (!val) return;

      const thread = messagesData.find((t) => t.id === currentThreadId);
      if (thread) {
        const newMsg = {
          id: `m_${Date.now()}`,
          sender: currentUser.name,
          initial: currentUser.initial,
          time: "Just now",
          text: val,
        };
        thread.messages.push(newMsg);
        thread.lastMessage = `You: ${val}`;
        thread.time = "Just now";
        renderMessagesForThread(currentThreadId);
        textInput.value = "";

        // Friend response simulation
        if (thread.isGroup) {
          setTimeout(() => {
            const replies = [
              "Totally agree with that cut!",
              "Go for it, looks immaculate in person.",
              "I say wear it, proportions are on point.",
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            thread.messages.push({
              id: `m_rep_${Date.now()}`,
              sender: "Maya Chen",
              initial: "MC",
              time: "Just now",
              text: randomReply,
            });
            renderMessagesForThread(currentThreadId);
          }, 1200);
        }
      }
    };
  }

  // Super reaction strip click
  container.querySelectorAll(".chat-react-btn").forEach((btn) => {
    btn.onclick = () => {
      const emoji = btn.dataset.emoji;
      const thread = messagesData.find((t) => t.id === currentThreadId);
      if (thread) {
        thread.messages.push({
          id: `m_rx_${Date.now()}`,
          sender: currentUser.name,
          initial: currentUser.initial,
          time: "Just now",
          text: `Reacted with ${emoji}`,
        });
        renderMessagesForThread(currentThreadId);
      }
    };
  });

  // Attach fit to chat button
  const btnAttachFit = container.querySelector("#btn-share-fit-to-chat");
  if (btnAttachFit) {
    btnAttachFit.onclick = () => {
      const samplePost = posts[0];
      const thread = messagesData.find((t) => t.id === currentThreadId);
      if (thread && samplePost) {
        thread.messages.push({
          id: `m_fit_${Date.now()}`,
          sender: currentUser.name,
          initial: currentUser.initial,
          time: "Just now",
          text: `Shared a fit check for review:`,
          fitCard: {
            title: samplePost.title,
            question: samplePost.question,
            image: samplePost.image,
          },
        });
        renderMessagesForThread(currentThreadId);
      }
    };
  }
}
