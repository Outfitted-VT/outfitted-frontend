import { icons } from "./icons.js";
import { sampleVisualSearchItems, wardrobeOutfits } from "./data.js";

export function renderStylistAssistant() {
  return `
    <div class="assistant-suite" id="assistant-suite">
      <div class="assistant-hero">
        <div class="assistant-hero-text">
          <p class="eyebrow" style="color:var(--brand-coral);"><span class="coral-bullet">•</span> AI PERSONAL STYLIST & ASSISTANT</p>
          <h1 class="assistant-title">Your wardrobe genius on call.</h1>
          <p class="assistant-subtitle">Chat about silhouettes, generate occasion outfits, clip pieces from anywhere on the web, or turn any screenshot into instant shoppable links.</p>
        </div>
        <div class="assistant-hero-badges">
          <span class="feature-pill active" data-subtab="chat">${icons.message} Stylist Chat</span>
          <span class="feature-pill" data-subtab="generator">${icons.wand} Outfit Generator</span>
          <span class="feature-pill" data-subtab="visual-search">${icons.camera} Screenshot to Shop</span>
          <span class="feature-pill" data-subtab="clipper">${icons.link} Web Clipper</span>
        </div>
      </div>

      <!-- SUBTAB 1: AI STYLIST CHAT -->
      <section class="assistant-panel" id="panel-chat">
        <div class="chat-container">
          <div class="chat-sidebar">
            <h3>Style Inquiries</h3>
            <p class="chat-sidebar-desc">Tap a question or ask anything about colors, pairings, or event styling.</p>
            <div class="prompt-chips">
              <button class="prompt-chip" data-query="What should I wear to a fall rooftop dinner in NYC?">🍂 Fall rooftop dinner in NYC</button>
              <button class="prompt-chip" data-query="How do I style wide-leg red trousers effortlessly?">👖 Styling wide-leg red trousers</button>
              <button class="prompt-chip" data-query="What color sneakers match a forest green knit cardigan?">👟 Sneakers for forest knit</button>
              <button class="prompt-chip" data-query="Give me 3 capsule wardrobe rules for minimalists.">🧥 Capsule wardrobe rules</button>
            </div>
            <div class="palette-helper">
              <h4>Today's Harmonious Palette</h4>
              <div class="palette-swatches">
                <span style="background:#244b3c" title="Forest (#244b3c)"></span>
                <span style="background:#a83232" title="Carmine (#a83232)"></span>
                <span style="background:#546e82" title="Washed Slate (#546e82)"></span>
                <span style="background:#ede4d3" title="Ecru Knit (#ede4d3)"></span>
                <span style="background:#d4a42b" title="Mustard Accent (#d4a42b)"></span>
              </div>
              <small>Earthy neutrals with intentional color pop</small>
            </div>
          </div>

          <div class="chat-main">
            <div class="chat-messages" id="stylist-messages-box">
              <div class="chat-bubble bot">
                <div class="bot-avatar">${icons.wand}</div>
                <div class="bubble-content">
                  <p><strong>Outfitted Stylist AI</strong></p>
                  <p>Hello Sofoniyas! I'm your dedicated personal stylist. Tell me what vibe you're going for, an upcoming occasion, or drop an item you want to coordinate.</p>
                </div>
              </div>
            </div>
            <form class="chat-input-bar" id="stylist-chat-form">
              <input type="text" id="stylist-chat-input" placeholder="Ask about colors, silhouettes, or what shoes go with your fit..." required autocomplete="off" />
              <button type="submit" class="button button-dark" aria-label="Send message">${icons.send}</button>
            </form>
          </div>
        </div>
      </section>

      <!-- SUBTAB 2: OUTFIT GENERATOR -->
      <section class="assistant-panel" id="panel-generator" hidden>
        <div class="generator-header">
          <div>
            <h2>Algorithmic Moodboard & Fit Generator</h2>
            <p>Select your aesthetic and let Outfitted assemble a coordinated look from top to toe.</p>
          </div>
          <button class="button button-primary" id="btn-randomize-outfit">
            ${icons.wand}<span>Randomize & Generate</span>
          </button>
        </div>

        <div class="vibe-selector-row">
          <label>Vibe:</label>
          <div class="vibe-pills" id="vibe-pills">
            <button class="vibe-pill active" data-vibe="Campus Casual">Campus Casual</button>
            <button class="vibe-pill" data-vibe="Concert Night">Concert Night</button>
            <button class="vibe-pill" data-vibe="Sunday Coffee">Sunday Coffee</button>
            <button class="vibe-pill" data-vibe="Quiet Luxury">Quiet Luxury</button>
            <button class="vibe-pill" data-vibe="Y2K Streetwear">Y2K Streetwear</button>
          </div>
        </div>

        <div class="generated-board" id="generated-board-container">
          <!-- Populated by JS -->
        </div>
      </section>

      <!-- SUBTAB 3: SCREENSHOT TO SHOP / VISUAL SEARCH -->
      <section class="assistant-panel" id="panel-visual-search" hidden>
        <div class="visual-search-header">
          <div>
            <h2>Screenshot to Shop</h2>
            <p>Upload a screenshot from Instagram, Pinterest, or your camera roll. The agent detects garments, checks sales across partner stores, and gives you direct links to buy.</p>
          </div>
        </div>

        <div class="visual-search-grid">
          <div class="upload-column">
            <label class="screenshot-dropzone" id="screenshot-dropzone">
              <input type="file" id="screenshot-file-input" accept="image/*" hidden />
              <div class="screenshot-preview-wrapper" id="screenshot-preview-wrap">
                <img id="screenshot-preview-img" src="./assets/feed/about_me_reactions.png" alt="Uploaded outfit screenshot" />
                <div class="scanner-laser" id="scanner-laser"></div>
                <div class="bounding-box-demo" style="top:25%; left:30%; width:45%; height:35%;" title="Oversized Fur Jacket">
                  <span class="tag-pin">Jacket</span>
                </div>
                <div class="bounding-box-demo" style="top:60%; left:35%; width:35%; height:35%;" title="Wide Off-White Trousers">
                  <span class="tag-pin">Trousers</span>
                </div>
              </div>
              <p class="dropzone-hint">${icons.camera} <span>Click to upload another screenshot or drop here</span></p>
            </label>
            <div class="sample-screenshots">
              <span>Try with samples:</span>
              <button class="sample-screen-btn active" data-src="./assets/feed/about_me_reactions.png">About Me Look</button>
              <button class="sample-screen-btn" data-src="./assets/feed/maya_fit.png">Maya Denim</button>
              <button class="sample-screen-btn" data-src="./assets/feed/jordan_fit.png">Jordan Cardigan</button>
            </div>
          </div>

          <div class="results-column">
            <div class="results-head">
              <h3>Identified Pieces & Best Deals (${sampleVisualSearchItems.length})</h3>
              <span class="confidence-badge">AI Vision Scan: 98% High Accuracy</span>
            </div>
            <div class="match-cards-list" id="match-cards-list">
              ${sampleVisualSearchItems.map((item) => `
                <div class="shop-match-card">
                  <img src="${item.image}" alt="${item.title}" class="match-thumb" />
                  <div class="match-info">
                    <span class="match-tag">${item.matchConfidence}</span>
                    <h4>${item.title}</h4>
                    <p class="match-brand">${item.brand} · <strong>${item.retailer}</strong></p>
                    <div class="match-pricing">
                      <span class="current-price">${item.price}</span>
                      <span class="orig-price">${item.originalPrice}</span>
                      <span class="discount-pill">${item.status}</span>
                    </div>
                  </div>
                  <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="button button-dark match-cta">
                    Buy ${icons.arrowRight}
                  </a>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </section>

      <!-- SUBTAB 4: WEB CLIPPER -->
      <section class="assistant-panel" id="panel-clipper" hidden>
        <div class="clipper-header">
          <div>
            <h2>Web Garment Clipper & Extension Simulator</h2>
            <p>Drag and drop images from any online store or paste a product link to clip it directly into your Outfitted digital closet.</p>
          </div>
        </div>

        <div class="clipper-workspace">
          <div class="clipper-input-card">
            <h3>Clip via URL</h3>
            <div class="url-input-row">
              <input type="url" id="clipper-url-input" placeholder="https://www.ssense.com/en-us/women/product/..." value="https://zara.com/us/en/oversized-vintage-denim-jacket-p05252.html" />
              <button class="button button-primary" id="btn-clip-url">Clip Item</button>
            </div>

            <div class="divider-text"><span>OR DRAG & DROP GARMENT IMAGE</span></div>

            <div class="clipper-dropzone" id="clipper-dropzone">
              <span class="clipper-drop-icon">${icons.bag}</span>
              <strong>Drag & drop any clothing image here</strong>
              <small>Simulates the Outfitted Chrome Extension web clipper</small>
            </div>
          </div>

          <div class="clipper-history-card">
            <h3>Recently Clipped into Closet</h3>
            <div class="clipped-items-grid" id="clipped-items-grid">
              <div class="clipped-item">
                <img src="./assets/feed/maya_fit.png" alt="Washed Denim" />
                <div>
                  <strong>Oversized Denim Shell</strong>
                  <p>Zara · $89.90</p>
                  <span class="chip-sm">Tops</span>
                </div>
              </div>
              <div class="clipped-item">
                <img src="./assets/feed/jordan_fit.png" alt="Cardigan" />
                <div>
                  <strong>Forest Cable Knit</strong>
                  <p>Aime Leon Dore · $295.00</p>
                  <span class="chip-sm">Knitwear</span>
                </div>
              </div>
              <div class="clipped-item">
                <img src="./assets/wardrobe/outfit_uni1.png" alt="Sneakers" />
                <div>
                  <strong>Air Force 1 '07</strong>
                  <p>Nike · $115.00</p>
                  <span class="chip-sm">Footwear</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

const GENERATOR_PRESETS = {
  "Campus Casual": {
    title: "University Streetwear Edit",
    description: "Relaxed proportions, collegiate knitwear, and durable leather sneakers for everyday campus comfort.",
    image: "./assets/wardrobe/outfit_uni1.png",
    palette: ["#1e293b", "#e2e8f0", "#94a3b8", "#b91c1c"],
    items: [
      { category: "Top", name: "High-neck striped wool pullover", swatch: "#1e293b" },
      { category: "Bottom", name: "Classic 90s stone-wash relaxed denim", swatch: "#64748b" },
      { category: "Footwear", name: "Triple white classic court sneakers", swatch: "#f8fafc" },
      { category: "Accessory", name: "Crossbody leather utility bag & retro sunnies", swatch: "#0f172a" },
    ],
  },
  "Concert Night": {
    title: "Indie Rock Club Look",
    description: "Moody tartan flares, fitted polo knit, and platform Chelsea boots built for dancing and night lights.",
    image: "./assets/wardrobe/outfit_concert1.png",
    palette: ["#3f6212", "#713f12", "#451a03", "#fef08a"],
    items: [
      { category: "Top", name: "Fitted sage polo knit with open collar", swatch: "#3f6212" },
      { category: "Bottom", name: "High-rise tartan plaid wide-leg flare", swatch: "#713f12" },
      { category: "Footwear", name: "Glossy platform block-heel leather boots", swatch: "#451a03" },
      { category: "Accessory", name: "Patent espresso baguette bag & signet ring", swatch: "#292524" },
    ],
  },
  "Sunday Coffee": {
    title: "Warm Roastery Sunday",
    description: "Cozy forest green cardigan layered over a crisp boxy tee with tailored dark trousers and vintage loafers.",
    image: "./assets/feed/jordan_fit.png",
    palette: ["#244b3c", "#fdfbf7", "#2b2e35", "#111111"],
    items: [
      { category: "Top", name: "Chunky forest rib-knit cardigan", swatch: "#244b3c" },
      { category: "Base", name: "Heavyweight 280gsm white tee", swatch: "#ffffff" },
      { category: "Bottom", name: "Pleated fluid charcoal wool trousers", swatch: "#2b2e35" },
      { category: "Footwear", name: "Polished black penny loafers", swatch: "#111111" },
    ],
  },
  "Quiet Luxury": {
    title: "Architectural Minimalist Tailoring",
    description: "Unstructured camel wool blazer over lightweight cashmere and straight raw indigo trousers.",
    image: "./assets/wardrobe/outfit_uni2.png",
    palette: ["#c5a059", "#ffffff", "#1e3a8a", "#0f172a"],
    items: [
      { category: "Top", name: "Structured double-breasted camel blazer", swatch: "#c5a059" },
      { category: "Layer", name: "Collegiate neutral hooded sweatshirt", swatch: "#f1f5f9" },
      { category: "Bottom", name: "Straight-cut raw selvedge denim", swatch: "#1e3a8a" },
      { category: "Footwear", name: "Chuck 70 high-tops & canvas tote", swatch: "#0f172a" },
    ],
  },
  "Y2K Streetwear": {
    title: "Cyber Grunge Flashback",
    description: "Graphic washed band tee, distressed charcoal denim, canvas backpack, and vintage skateboard kicks.",
    image: "./assets/wardrobe/outfit_friends1.png",
    palette: ["#18181b", "#52525b", "#ef4444", "#a1a1aa"],
    items: [
      { category: "Top", name: "Faded vintage graphic tour tee", swatch: "#18181b" },
      { category: "Bottom", name: "Distressed knee-slit dark wash denim", swatch: "#52525b" },
      { category: "Footwear", name: "Low-profile skate sneakers with contrast laces", swatch: "#09090b" },
      { category: "Accessory", name: "Canvas square backpack & chain belt", swatch: "#27272a" },
    ],
  },
};

export function connectStylistAssistant(onTryOnRequest, onPostFitRequest) {
  const container = document.querySelector("#assistant-suite");
  if (!container) return;

  // Subtab switching
  const pills = container.querySelectorAll(".feature-pill");
  const panels = container.querySelectorAll(".assistant-panel");
  pills.forEach((pill) => {
    pill.onclick = () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const subtab = pill.dataset.subtab;
      panels.forEach((panel) => {
        panel.hidden = panel.id !== `panel-${subtab}`;
      });
    };
  });

  // Chatbot logic
  const chatMessages = container.querySelector("#stylist-messages-box");
  const chatForm = container.querySelector("#stylist-chat-form");
  const chatInput = container.querySelector("#stylist-chat-input");

  function appendChatMessage(sender, text, isUser = false) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${isUser ? "user" : "bot"}`;
    bubble.innerHTML = `
      ${isUser ? "" : `<div class="bot-avatar">${icons.wand}</div>`}
      <div class="bubble-content">
        <p><strong>${sender}</strong></p>
        <p>${text}</p>
      </div>
      ${isUser ? `<div class="user-avatar">S</div>` : ""}
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function generateAIStylistResponse(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes("rooftop") || p.includes("dinner") || p.includes("fall") || p.includes("nyc")) {
      return `For a brisk NYC fall rooftop dinner, layering is essential. I recommend pairing an <strong>oversized camel wool coat</strong> over a fine-knit ribbed mockneck in cream. For bottoms, go with <strong>fluid dark chocolate or charcoal pleated trousers</strong> and structured leather Chelsea boots. Finish with subtle gold jewelry and a structured top-handle bag. It strikes that exact sweet spot between warm, sleek, and effortlessly chic.`;
    }
    if (p.includes("red") || p.includes("trousers") || p.includes("wide-leg")) {
      return `Wide-leg red trousers are a high-impact statement! To keep them effortless:
      <br/>1. <strong>Contrast with relaxed neutrals:</strong> A faded oversized denim jacket (just like Maya's Fit File 01) or a boxy marled-grey crewneck.
      <br/>2. <strong>Footwear:</strong> Low-profile silver metallic runners or crisp white leather sneakers keep the silhouette grounded.
      <br/>3. <strong>Proportion tip:</strong> If the pants are voluminous, keep the top either cropped at the waistline or structured at the shoulders to define your frame.`;
    }
    if (p.includes("green") || p.includes("cardigan") || p.includes("sneakers")) {
      return `Forest green pairs sensationally with <strong>off-white/cream retro runners</strong> (like New Balance 550 or Adidas Samba in chalk white). For a cleaner Scandinavian look, swap sneakers for black penny loafers or lug-sole derbies. The deep earthy green looks richest when balanced with bone, ecru, or dark indigo.`;
    }
    if (p.includes("capsule") || p.includes("minimalist")) {
      return `Here are the 3 golden capsule rules:
      <br/><strong>1. The 3-Color Anchor:</strong> Choose two foundational neutrals (e.g. cream & charcoal) and one signature accent (like forest green or cobalt blue).
      <br/><strong>2. Proportional Harmony:</strong> Pair voluminous bottoms with fitted or cropped tops, and boxy outerwear with tapered trousers.
      <br/><strong>3. Texture over Pattern:</strong> Create visual interest with ribbed knit, washed denim, brushed wool, and patent leather rather than busy prints.`;
    }
    return `That's a great styling question! For this combination, I recommend leaning into intentional contrast: balance the silhouette by keeping one half structured and the other relaxed. Try pairing it with earthy tones (forest, espresso, ecru) and clean minimalist footwear. Would you like me to generate a 4-piece moodboard for this look?`;
  }

  if (chatForm) {
    chatForm.onsubmit = (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      appendChatMessage("Sofoniyas", text, true);
      chatInput.value = "";

      // Typing indicator simulation
      setTimeout(() => {
        const reply = generateAIStylistResponse(text);
        appendChatMessage("Outfitted Stylist AI", reply, false);
      }, 550);
    };
  }

  // Prompt chips
  container.querySelectorAll(".prompt-chip").forEach((chip) => {
    chip.onclick = () => {
      const q = chip.dataset.query;
      chatInput.value = q;
      chatForm.dispatchEvent(new Event("submit"));
    };
  });

  // Outfit Generator Logic
  const generatedBoard = container.querySelector("#generated-board-container");
  let currentVibe = "Campus Casual";

  function renderGeneratedOutfit(vibe) {
    const data = GENERATOR_PRESETS[vibe] || GENERATOR_PRESETS["Campus Casual"];
    if (!generatedBoard) return;
    generatedBoard.innerHTML = `
      <div class="generated-card">
        <div class="generated-visual">
          <img src="${data.image}" alt="${data.title}" />
          <span class="vibe-tag">${vibe}</span>
        </div>
        <div class="generated-details">
          <div class="details-top">
            <span class="eyebrow" style="color:var(--brand-green);">Generated Moodboard</span>
            <h3>${data.title}</h3>
            <p>${data.description}</p>
          </div>

          <div class="generated-palette">
            <strong>Palette:</strong>
            <div class="swatch-strip">
              ${data.palette.map((hex) => `<span style="background:${hex};" title="${hex}"></span>`).join("")}
            </div>
          </div>

          <div class="generated-pieces-list">
            ${data.items.map((item) => `
              <div class="gen-piece-row">
                <span class="piece-dot" style="background:${item.swatch}"></span>
                <span class="piece-cat">${item.category}:</span>
                <span class="piece-title">${item.name}</span>
              </div>
            `).join("")}
          </div>

          <div class="gen-actions">
            <button class="button button-primary" id="btn-gen-tryon">
              ${icons.sparkleIcon}<span>Try this look on</span>
            </button>
            <button class="button button-outline" id="btn-gen-post">
              ${icons.plus}<span>Post fit to Circle</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const tryBtn = generatedBoard.querySelector("#btn-gen-tryon");
    if (tryBtn && onTryOnRequest) {
      tryBtn.onclick = () => onTryOnRequest(data);
    }
    const postBtn = generatedBoard.querySelector("#btn-gen-post");
    if (postBtn && onPostFitRequest) {
      postBtn.onclick = () => onPostFitRequest(data);
    }
  }

  renderGeneratedOutfit(currentVibe);

  container.querySelectorAll(".vibe-pill").forEach((pill) => {
    pill.onclick = () => {
      container.querySelectorAll(".vibe-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentVibe = pill.dataset.vibe;
      renderGeneratedOutfit(currentVibe);
    };
  });

  const btnRandomize = container.querySelector("#btn-randomize-outfit");
  if (btnRandomize) {
    btnRandomize.onclick = () => {
      const keys = Object.keys(GENERATOR_PRESETS);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      container.querySelectorAll(".vibe-pill").forEach((p) => {
        p.classList.toggle("active", p.dataset.vibe === randomKey);
      });
      renderGeneratedOutfit(randomKey);
    };
  }

  // Visual Search Sample Switching
  const previewImg = container.querySelector("#screenshot-preview-img");
  const laser = container.querySelector("#scanner-laser");
  container.querySelectorAll(".sample-screen-btn").forEach((btn) => {
    btn.onclick = () => {
      container.querySelectorAll(".sample-screen-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (previewImg) {
        previewImg.src = btn.dataset.src;
        if (laser) {
          laser.style.animation = "none";
          setTimeout(() => (laser.style.animation = ""), 50);
        }
      }
    };
  });

  // Web Clipper URL Button
  const btnClip = container.querySelector("#btn-clip-url");
  const clipperInput = container.querySelector("#clipper-url-input");
  const clippedGrid = container.querySelector("#clipped-items-grid");
  if (btnClip && clipperInput && clippedGrid) {
    btnClip.onclick = () => {
      const val = clipperInput.value.trim();
      if (!val) return;
      const newItem = document.createElement("div");
      newItem.className = "clipped-item new-clipped-anim";
      newItem.innerHTML = `
        <img src="./assets/feed/maya_fit.png" alt="Clipped Item" />
        <div>
          <strong>Clipped Web Garment</strong>
          <p>Imported from link · $79.00</p>
          <span class="chip-sm">Wardrobe</span>
        </div>
      `;
      clippedGrid.prepend(newItem);
      clipperInput.value = "";
    };
  }
}
