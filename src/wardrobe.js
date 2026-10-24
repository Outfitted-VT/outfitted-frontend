import { icons } from "./icons.js";
import { wardrobeOutfits, history } from "./data.js";

export function renderWardrobePage() {
  return `
    <div class="wardrobe-page" id="wardrobe-page">
      <div class="wardrobe-hero">
        <div>
          <p class="eyebrow" style="color:var(--brand-coral);"><span class="coral-bullet">•</span> DIGITAL WARDROBE & FIT ARCHIVE</p>
          <h1 class="wardrobe-title">Your Wardrobe</h1>
          <p class="wardrobe-subtitle">Curated flat-lays, saved aesthetics, and fits ready for feedback or wear.</p>
        </div>
        <div class="wardrobe-hero-actions">
          <button class="button button-outline" id="btn-import-piece">
            ${icons.plus}<span>Add Piece</span>
          </button>
        </div>
      </div>

      <!-- Filter and Search Bar -->
      <div class="wardrobe-controls-bar">
        <div class="category-filters" id="wardrobe-filters">
          <button class="category-pill active" data-filter="all">All Fits (${wardrobeOutfits.length})</button>
          <button class="category-pill" data-filter="Campus">Campus</button>
          <button class="category-pill" data-filter="Night Out">Night Out</button>
          <button class="category-pill" data-filter="Weekend">Weekend</button>
          <button class="category-pill" data-filter="Saved">Saved</button>
          <button class="category-pill" data-filter="Live">Live Fit</button>
        </div>
        <div class="wardrobe-search">
          <span class="search-icon">${icons.search}</span>
          <input type="text" id="wardrobe-search-input" placeholder="Search outfits, pieces, colors..." />
        </div>
      </div>

      <!-- Outfits Grid -->
      <div class="wardrobe-grid" id="wardrobe-grid-box">
        ${wardrobeOutfits.map((outfit) => renderWardrobeCard(outfit)).join("")}
      </div>

      <!-- Shared History Timeline -->
      <section class="wardrobe-history-section">
        <div class="history-head">
          <div>
            <h3>Shared Fit History</h3>
            <p>Chronological record of looks shared with your circle.</p>
          </div>
        </div>
        <div class="history-cards-row">
          ${history
            .map(
              (item) => `
              <div class="history-item-card">
                <div class="history-item-header">
                  <strong>${item.name}</strong>
                  <span class="tag ${item.status === "Live" ? "tag-live" : ""}">${item.status}</span>
                </div>
                <p class="history-item-pieces">${item.pieces}</p>
                <small class="history-item-date">${item.date}</small>
              </div>
            `
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function renderWardrobeCard(outfit) {
  return `
    <article class="wardrobe-card" data-category="${outfit.category}" data-status="${outfit.status}" data-id="${outfit.id}">
      <div class="wardrobe-card-media">
        <img src="${outfit.image}" alt="${outfit.title}" loading="lazy" />
        <span class="status-pill status-${outfit.status.toLowerCase().replace(" ", "-")}">${outfit.status}</span>
        <button class="card-expand-btn" title="Inspect pieces" data-outfit-id="${outfit.id}">${icons.sparkleIcon}</button>
      </div>
      <div class="wardrobe-card-meta">
        <div class="meta-top">
          <h4>${outfit.title}</h4>
          <span class="vibe-badge">${outfit.vibe}</span>
        </div>
        <p class="pieces-preview">${outfit.pieces.join(" · ")}</p>
        <div class="wardrobe-card-footer">
          <button class="button button-ghost button-sm btn-wardrobe-tryon" data-outfit-id="${outfit.id}">
            ${icons.wand}<span>Try on</span>
          </button>
          <button class="button button-dark button-sm btn-wardrobe-share" data-outfit-id="${outfit.id}">
            ${icons.share}<span>Share</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

export function connectWardrobe(onTryOnRequest, onShareRequest) {
  const container = document.querySelector("#wardrobe-page");
  if (!container) return;

  const cards = container.querySelectorAll(".wardrobe-card");
  const filterPills = container.querySelectorAll(".category-pill");
  const searchInput = container.querySelector("#wardrobe-search-input");

  function applyFilters() {
    const activeFilter = container.querySelector(".category-pill.active")?.dataset.filter || "all";
    const query = searchInput?.value.toLowerCase().trim() || "";

    cards.forEach((card) => {
      const cat = card.dataset.category;
      const status = card.dataset.status;
      const text = card.textContent.toLowerCase();

      const matchesFilter =
        activeFilter === "all" || cat === activeFilter || status === activeFilter;
      const matchesSearch = !query || text.includes(query);

      card.hidden = !(matchesFilter && matchesSearch);
    });
  }

  filterPills.forEach((pill) => {
    pill.onclick = () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      applyFilters();
    };
  });

  if (searchInput) {
    searchInput.oninput = applyFilters;
  }

  // Try on buttons
  container.querySelectorAll(".btn-wardrobe-tryon").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.outfitId;
      const outfit = wardrobeOutfits.find((o) => o.id === id);
      if (outfit && onTryOnRequest) onTryOnRequest(outfit);
    };
  });

  // Share buttons
  container.querySelectorAll(".btn-wardrobe-share").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.outfitId;
      const outfit = wardrobeOutfits.find((o) => o.id === id);
      if (outfit && onShareRequest) onShareRequest(outfit);
    };
  });
}
