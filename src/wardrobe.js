import { icons } from "./icons.js";
import { history, outfitMemories, wardrobeCatalog, wardrobeOutfits } from "./data.js";
import { escapeHtml } from "./format.js";
import { openVirtualDressingRoom } from "./tryon-modal.js";

let activeView = "grid"; // 'grid' | 'carousel' | 'calendar'
let activeCarouselCategory = "clothing"; // 'clothing' | 'shoes' | 'accessories' | 'fits'
let carouselIndex = 0;
let selectedCalendarMemory = outfitMemories[0];

export function renderWardrobePage() {
  return `
    <div class="wardrobe-page" id="wardrobe-page">
      <div class="wardrobe-hero">
        <div>
          <p class="eyebrow" style="color:var(--brand-coral);"><span class="coral-bullet">•</span> DIGITAL WARDROBE & FIT ARCHIVE</p>
          <h1 class="wardrobe-title">Your Wardrobe Studio</h1>
          <p class="wardrobe-subtitle">Curate your closet, browse in 3D, calculate cost-per-wear, and log daily outfit memories.</p>
        </div>
        <div class="wardrobe-hero-actions">
          <!-- View Mode Switcher -->
          <div class="view-mode-toggle" id="wardrobe-view-toggle">
            <button class="view-toggle-btn ${activeView === "grid" ? "active" : ""}" data-view="grid" title="Standard Grid View">
              <span class="material-symbols-outlined text-[18px]">grid_view</span>
              <span>Grid</span>
            </button>
            <button class="view-toggle-btn ${activeView === "carousel" ? "active" : ""}" data-view="carousel" title="3D Carousel Experience">
              <span class="material-symbols-outlined text-[18px]">view_in_ar</span>
              <span>3D Carousel</span>
            </button>
            <button class="view-toggle-btn ${activeView === "calendar" ? "active" : ""}" data-view="calendar" title="Daily Outfit Calendar">
              <span class="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- VIEW 1: 3D CAROUSEL COVERFLOW -->
      <section class="wardrobe-view-container ${activeView === "carousel" ? "" : "hidden"}" id="view-carousel">
        <div class="carousel-category-nav">
          <button class="carousel-cat-pill ${activeCarouselCategory === "clothing" ? "active" : ""}" data-cat="clothing">
            👕 Clothing (${wardrobeCatalog.clothing.length})
          </button>
          <button class="carousel-cat-pill ${activeCarouselCategory === "shoes" ? "active" : ""}" data-cat="shoes">
            👟 Shoes (${wardrobeCatalog.shoes.length})
          </button>
          <button class="carousel-cat-pill ${activeCarouselCategory === "accessories" ? "active" : ""}" data-cat="accessories">
            🕶️ Accessories (${wardrobeCatalog.accessories.length})
          </button>
          <button class="carousel-cat-pill ${activeCarouselCategory === "fits" ? "active" : ""}" data-cat="fits">
            ✨ Full Outfits (${wardrobeOutfits.length})
          </button>
        </div>

        <div class="carousel-3d-stage-wrapper">
          <button class="carousel-nav-btn prev" id="btn-carousel-prev" aria-label="Previous item">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>

          <div class="carousel-3d-stage" id="carousel-stage">
            ${renderCarouselStageItems()}
          </div>

          <button class="carousel-nav-btn next" id="btn-carousel-next" aria-label="Next item">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div class="carousel-active-details" id="carousel-item-details">
          ${renderActiveCarouselDetails()}
        </div>
      </section>

      <!-- VIEW 2: OUTFIT CALENDAR & MEMORIES -->
      <section class="wardrobe-view-container ${activeView === "calendar" ? "" : "hidden"}" id="view-calendar">
        <div class="calendar-layout-grid">
          <!-- Calendar Card -->
          <div class="calendar-card-box bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high/60">
            <div class="calendar-header-strip flex items-center justify-between mb-space-sm">
              <div>
                <h3 class="font-headline-md text-headline-md font-semibold text-on-surface">November 2026</h3>
                <p class="font-label-sm text-on-surface-variant">${outfitMemories.length} outfits logged this month</p>
              </div>
              <div class="flex items-center gap-1">
                <button type="button" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high">
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button type="button" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high">
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            <!-- Days of Week Header -->
            <div class="grid grid-cols-7 gap-1 text-center font-micro-mono text-[11px] text-on-surface-variant uppercase pb-2 border-b border-surface-container-high">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            <!-- 7-Column Calendar Days Grid -->
            <div class="grid grid-cols-7 gap-1.5 pt-2" id="outfit-calendar-grid">
              ${renderCalendarDays()}
            </div>
          </div>

          <!-- Memory Detail / Logger Sidebar -->
          <div class="memory-sidebar-box bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-high/60 flex flex-col gap-space-sm">
            <div class="flex items-center justify-between">
              <span class="font-micro-mono text-micro-mono uppercase text-secondary font-bold tracking-wider">Outfit Memory</span>
              <button type="button" class="h-8 px-3 rounded-full bg-primary text-on-primary font-label-sm font-semibold flex items-center gap-1 active:scale-95 transition-all" id="btn-open-log-memory">
                <span class="material-symbols-outlined text-[15px]">add_a_photo</span>
                <span>Log Today</span>
              </button>
            </div>

            <div id="memory-detail-content">
              ${renderMemoryDetailCard(selectedCalendarMemory)}
            </div>

            <!-- Inline Log Memory Drawer -->
            <div class="hidden p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-2 mt-2" id="log-memory-drawer">
              <strong class="font-label-md text-on-surface">Log Today's Outfit Memory</strong>
              <input type="text" id="log-memory-title" placeholder="e.g. Tuesday Coffee & Studio" class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface" />
              <input type="text" id="log-memory-pieces" placeholder="Tagged pieces (e.g. Denim Jacket, AF1s)" class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface" />
              <input type="text" id="log-memory-notes" placeholder="Notes on fit & weather (e.g. 64°F · Crisp fall)" class="p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-body-md text-on-surface" />
              <div class="flex justify-end gap-2 pt-1">
                <button type="button" class="px-3 py-1.5 rounded-full text-label-sm font-semibold text-on-surface" id="btn-cancel-log-memory">Cancel</button>
                <button type="button" class="px-4 py-1.5 rounded-full bg-primary text-on-primary text-label-sm font-semibold" id="btn-save-outfit-memory">Save to Calendar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- VIEW 3: STANDARD WARDROBE GRID -->
      <section class="wardrobe-view-container ${activeView === "grid" ? "" : "hidden"}" id="view-grid">
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
                    <strong>${escapeHtml(item.name)}</strong>
                    <span class="tag ${item.status === "Live" ? "tag-live" : ""}">${escapeHtml(item.status)}</span>
                  </div>
                  <p class="history-item-pieces">${escapeHtml(item.pieces)}</p>
                  <small class="history-item-date">${escapeHtml(item.date)}</small>
                </div>
              `
              )
              .join("")}
          </div>
        </section>
      </section>
    </div>
  `;
}

function getActiveCarouselList() {
  if (activeCarouselCategory === "fits") {
    return wardrobeOutfits.map((o) => ({
      id: o.id,
      name: o.title,
      brand: "Outfitted Wardrobe",
      category: o.category,
      price: 180,
      timesWorn: 6,
      lastWorn: o.date,
      image: o.image,
      tag: o.vibe,
    }));
  }
  return wardrobeCatalog[activeCarouselCategory] || wardrobeCatalog.clothing;
}

function renderCarouselStageItems() {
  const items = getActiveCarouselList();
  if (!items.length) return "";

  const total = items.length;
  const current = ((carouselIndex % total) + total) % total;

  return items
    .map((item, idx) => {
      let offset = idx - current;
      if (offset < -Math.floor(total / 2)) offset += total;
      if (offset > Math.floor(total / 2)) offset -= total;

      const isCenter = offset === 0;
      const isVisible = Math.abs(offset) <= 2;

      let transformStyle = "";
      if (isCenter) {
        transformStyle = "transform: perspective(1000px) translate3d(0, 0, 80px) rotateY(0deg) scale(1); z-index: 10; opacity: 1;";
      } else if (offset === -1) {
        transformStyle = "transform: perspective(1000px) translate3d(-140px, 0, -40px) rotateY(28deg) scale(0.85); z-index: 5; opacity: 0.75;";
      } else if (offset === 1) {
        transformStyle = "transform: perspective(1000px) translate3d(140px, 0, -40px) rotateY(-28deg) scale(0.85); z-index: 5; opacity: 0.75;";
      } else if (offset === -2) {
        transformStyle = "transform: perspective(1000px) translate3d(-240px, 0, -100px) rotateY(42deg) scale(0.7); z-index: 2; opacity: 0.4;";
      } else if (offset === 2) {
        transformStyle = "transform: perspective(1000px) translate3d(240px, 0, -100px) rotateY(-42deg) scale(0.7); z-index: 2; opacity: 0.4;";
      } else {
        transformStyle = "display: none;";
      }

      const costPerWear = (item.price / Math.max(1, item.timesWorn)).toFixed(2);

      return `
        <div class="carousel-3d-card ${isCenter ? "active" : ""}" style="${transformStyle}" data-index="${idx}">
          <div class="carousel-card-img-wrap">
            <img src="${item.image}" alt="${escapeHtml(item.name)}" />
            <span class="carousel-badge-pill">${escapeHtml(item.brand)}</span>
            <span class="carousel-cpw-pill">$${costPerWear}/wear</span>
          </div>
          <div class="carousel-card-brief">
            <h4>${escapeHtml(item.name)}</h4>
            <p>${escapeHtml(item.category)} · Worn ${item.timesWorn} times</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderActiveCarouselDetails() {
  const items = getActiveCarouselList();
  if (!items.length) return "";
  const current = ((carouselIndex % items.length) + items.length) % items.length;
  const item = items[current];

  const cpw = (item.price / Math.max(1, item.timesWorn)).toFixed(2);
  const valueVerdict =
    item.price / item.timesWorn < 10
      ? "High ROI • Staple Wardrobe Piece"
      : item.price / item.timesWorn < 20
      ? "Solid Rotation Value"
      : "Underutilized • Wear this more!";

  return `
    <div class="active-item-analytics-card">
      <div class="analytics-head">
        <div>
          <span class="font-micro-mono text-[10px] uppercase text-secondary font-bold tracking-wider">${escapeHtml(item.brand)}</span>
          <h3 class="font-headline-md text-headline-md font-semibold text-on-surface">${escapeHtml(item.name)}</h3>
          <p class="font-label-sm text-on-surface-variant">${escapeHtml(item.tag || item.category)}</p>
        </div>
        <div class="text-right">
          <span class="font-headline-md text-headline-md font-bold text-secondary">$${cpw}</span>
          <small class="block font-micro-mono text-[9px] uppercase text-on-surface-variant">Cost Per Wear</small>
        </div>
      </div>

      <!-- Cost Per Wear Metrics Strip -->
      <div class="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-surface-container-low text-center">
        <div>
          <strong class="block font-title-ui text-label-md text-on-surface font-semibold">$${item.price}</strong>
          <span class="font-micro-mono text-[9px] uppercase text-on-surface-variant">Purchase Price</span>
        </div>
        <div>
          <strong class="block font-title-ui text-label-md text-on-surface font-semibold">${item.timesWorn}x</strong>
          <span class="font-micro-mono text-[9px] uppercase text-on-surface-variant">Times Worn</span>
        </div>
        <div>
          <strong class="block font-title-ui text-label-md text-on-surface font-semibold">${item.lastWorn || "Recent"}</strong>
          <span class="font-micro-mono text-[9px] uppercase text-on-surface-variant">Last Worn</span>
        </div>
      </div>

      <div class="flex items-center gap-1.5 px-1 font-micro-mono text-[11px] text-tertiary-fixed font-semibold">
        <span class="material-symbols-outlined text-[15px]">trending_up</span>
        <span>${valueVerdict}</span>
      </div>

      <!-- Quick Action Controls -->
      <div class="grid grid-cols-2 gap-space-xs pt-1">
        <button type="button" class="h-10 rounded-full bg-primary text-on-primary font-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all btn-carousel-tryon" data-img="${escapeHtml(item.image)}" data-name="${escapeHtml(item.name)}">
          <span class="material-symbols-outlined text-[17px] text-tertiary-fixed">auto_awesome</span>
          <span>Try on with Avatar</span>
        </button>
        <button type="button" class="h-10 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all btn-carousel-log-wear" data-id="${item.id}">
          <span class="material-symbols-outlined text-[17px] text-secondary">check</span>
          <span>Log Worn Today</span>
        </button>
      </div>
    </div>
  `;
}

function renderCalendarDays() {
  const daysInMonth = 30; // November
  // Nov 1, 2026 starts on Sunday (day 0)
  const cells = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const memory = outfitMemories.find((m) => m.day === day);
    const isSelected = selectedCalendarMemory?.day === day;

    if (memory) {
      cells.push(`
        <button type="button" class="calendar-day-btn relative aspect-square rounded-lg overflow-hidden border ${isSelected ? "ring-2 ring-secondary border-secondary" : "border-surface-container-high"} group" data-day="${day}">
          <img src="${memory.photo}" alt="${escapeHtml(memory.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          <span class="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white font-micro-mono text-[9px] px-1 rounded font-bold">${day}</span>
        </button>
      `);
    } else {
      cells.push(`
        <button type="button" class="calendar-day-btn aspect-square rounded-lg bg-surface-container-low/60 hover:bg-surface-container text-on-surface-variant flex items-center justify-center font-micro-mono text-[11px] font-medium" data-day="${day}">
          ${day}
        </button>
      `);
    }
  }

  return cells.join("");
}

function renderMemoryDetailCard(memory) {
  if (!memory) {
    return `
      <div class="py-12 text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-[32px] text-secondary">calendar_today</span>
        <p class="font-label-md font-semibold text-on-surface mt-1">Select an Outfit Day</p>
        <p class="font-label-sm text-[12px]">Tap any calendar photo to inspect daily look breakdown.</p>
      </div>
    `;
  }

  return `
    <div class="memory-card-view flex flex-col gap-2">
      <div class="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-surface-container shadow-inner">
        <img src="${memory.photo}" alt="${escapeHtml(memory.title)}" class="w-full h-full object-cover" />
        <span class="absolute top-3 left-3 bg-primary/80 backdrop-blur-md text-on-primary font-micro-mono text-[10px] px-2.5 py-1 rounded-full font-bold">
          ${escapeHtml(memory.date)}
        </span>
        <span class="absolute bottom-3 inset-x-3 bg-black/60 backdrop-blur-md text-white font-label-sm p-2 rounded-lg flex items-center justify-between">
          <span>${escapeHtml(memory.weather || "Crisp fall")}</span>
          <span>${"★".repeat(memory.rating || 5)}</span>
        </span>
      </div>

      <div class="flex flex-col gap-1 pt-1">
        <h4 class="font-headline-md text-label-md font-semibold text-on-surface">${escapeHtml(memory.title)}</h4>
        <p class="font-body-md text-[12px] text-on-surface leading-relaxed">${escapeHtml(memory.notes)}</p>
      </div>

      <div class="flex flex-col gap-1 pt-1">
        <span class="font-micro-mono text-[10px] uppercase text-on-surface-variant font-bold">Tagged Pieces Worn</span>
        <div class="flex flex-wrap gap-1">
          ${(memory.taggedPieces || [])
            .map((p) => `<span class="px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-[11px]">${escapeHtml(p)}</span>`)
            .join("")}
        </div>
      </div>
    </div>
  `;
}

function renderWardrobeCard(outfit) {
  return `
    <article class="wardrobe-card" data-category="${outfit.category}" data-status="${outfit.status}" data-id="${outfit.id}">
      <div class="wardrobe-card-media">
        <img src="${outfit.image}" alt="${escapeHtml(outfit.title)}" loading="lazy" />
        <span class="status-pill status-${outfit.status.toLowerCase().replace(" ", "-")}">${escapeHtml(outfit.status)}</span>
        <button class="card-expand-btn" title="Inspect pieces" data-outfit-id="${outfit.id}">${icons.sparkleIcon}</button>
      </div>
      <div class="wardrobe-card-meta">
        <div class="meta-top">
          <h4>${escapeHtml(outfit.title)}</h4>
          <span class="vibe-badge">${escapeHtml(outfit.vibe)}</span>
        </div>
        <p class="pieces-preview">${escapeHtml(outfit.pieces.join(" · "))}</p>
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

export function connectWardrobe(onTryOnRequest, onShareRequest, toast = () => {}) {
  const container = document.querySelector("#wardrobe-page");
  if (!container) return;

  // View Mode Switcher
  container.querySelectorAll(".view-toggle-btn").forEach((btn) => {
    btn.onclick = () => {
      container.querySelectorAll(".view-toggle-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeView = btn.dataset.view;

      const vGrid = container.querySelector("#view-grid");
      const vCarousel = container.querySelector("#view-carousel");
      const vCal = container.querySelector("#view-calendar");

      if (vGrid) vGrid.classList.toggle("hidden", activeView !== "grid");
      if (vCarousel) vCarousel.classList.toggle("hidden", activeView !== "carousel");
      if (vCal) vCal.classList.toggle("hidden", activeView !== "calendar");

      if (activeView === "carousel") refreshCarouselStage();
    };
  });

  // Carousel Category Switching
  container.querySelectorAll(".carousel-cat-pill").forEach((pill) => {
    pill.onclick = () => {
      container.querySelectorAll(".carousel-cat-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeCarouselCategory = pill.dataset.cat;
      carouselIndex = 0;
      refreshCarouselStage();
    };
  });

  function refreshCarouselStage() {
    const stage = container.querySelector("#carousel-stage");
    const details = container.querySelector("#carousel-item-details");
    if (stage) stage.innerHTML = renderCarouselStageItems();
    if (details) details.innerHTML = renderActiveCarouselDetails();
    bindCarouselEvents();
  }

  function bindCarouselEvents() {
    const btnPrev = container.querySelector("#btn-carousel-prev");
    const btnNext = container.querySelector("#btn-carousel-next");

    if (btnPrev) {
      btnPrev.onclick = () => {
        carouselIndex--;
        refreshCarouselStage();
      };
    }
    if (btnNext) {
      btnNext.onclick = () => {
        carouselIndex++;
        refreshCarouselStage();
      };
    }

    // Try-on button from carousel
    container.querySelectorAll(".btn-carousel-tryon").forEach((btn) => {
      btn.onclick = () => {
        const img = btn.dataset.img;
        const name = btn.dataset.name;
        openVirtualDressingRoom({ image: img, name });
      };
    });

    // Log Worn Today button
    container.querySelectorAll(".btn-carousel-log-wear").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const items = getActiveCarouselList();
        const item = items.find((i) => i.id === id);
        if (item) {
          item.timesWorn = (item.timesWorn || 0) + 1;
          item.lastWorn = "Today";
          toast(`Logged "${item.name}" as worn! Cost-per-wear updated.`);
          refreshCarouselStage();
        }
      };
    });
  }

  bindCarouselEvents();

  // Calendar day clicks
  container.querySelectorAll(".calendar-day-btn").forEach((btn) => {
    btn.onclick = () => {
      const day = parseInt(btn.dataset.day, 10);
      const memory = outfitMemories.find((m) => m.day === day);
      if (memory) {
        selectedCalendarMemory = memory;
        const detailEl = container.querySelector("#memory-detail-content");
        if (detailEl) detailEl.innerHTML = renderMemoryDetailCard(selectedCalendarMemory);
        container.querySelectorAll(".calendar-day-btn").forEach((b) => b.classList.remove("ring-2", "ring-secondary"));
        btn.classList.add("ring-2", "ring-secondary");
      }
    };
  });

  // Calendar memory logger drawer
  const btnOpenLog = container.querySelector("#btn-open-log-memory");
  const drawer = container.querySelector("#log-memory-drawer");
  const btnCancelLog = container.querySelector("#btn-cancel-log-memory");
  const btnSaveMemory = container.querySelector("#btn-save-outfit-memory");

  if (btnOpenLog && drawer) {
    btnOpenLog.onclick = () => drawer.classList.toggle("hidden");
  }
  if (btnCancelLog && drawer) {
    btnCancelLog.onclick = () => drawer.classList.add("hidden");
  }
  if (btnSaveMemory) {
    btnSaveMemory.onclick = () => {
      const title = container.querySelector("#log-memory-title")?.value.trim();
      const piecesStr = container.querySelector("#log-memory-pieces")?.value.trim();
      const notes = container.querySelector("#log-memory-notes")?.value.trim();

      if (!title) {
        toast("Please provide an outfit title");
        return;
      }

      const newMem = {
        id: `mem-${Date.now()}`,
        date: "2026-11-02",
        day: 2,
        month: "Nov",
        year: 2026,
        title,
        photo: "./assets/feed/maya_fit.png",
        taggedPieces: piecesStr ? piecesStr.split(",").map((s) => s.trim()) : ["Oversized Denim Jacket"],
        notes: notes || "Logged today's everyday outfit.",
        weather: "62°F · Crisp Autumn",
        rating: 5,
      };

      outfitMemories.unshift(newMem);
      selectedCalendarMemory = newMem;
      drawer?.classList.add("hidden");
      toast("Today's outfit memory saved!");

      const gridEl = container.querySelector("#outfit-calendar-grid");
      const detailEl = container.querySelector("#memory-detail-content");
      if (gridEl) gridEl.innerHTML = renderCalendarDays();
      if (detailEl) detailEl.innerHTML = renderMemoryDetailCard(selectedCalendarMemory);
    };
  }

  // Grid view filters
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

  if (searchInput) searchInput.oninput = applyFilters;

  // Try on & Share in Grid view
  container.querySelectorAll(".btn-wardrobe-tryon").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.outfitId;
      const outfit = wardrobeOutfits.find((o) => o.id === id);
      if (outfit && onTryOnRequest) onTryOnRequest(outfit);
    };
  });

  container.querySelectorAll(".btn-wardrobe-share").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.outfitId;
      const outfit = wardrobeOutfits.find((o) => o.id === id);
      if (outfit && onShareRequest) onShareRequest(outfit);
    };
  });
}
