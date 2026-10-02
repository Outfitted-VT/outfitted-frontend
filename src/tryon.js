import { fitPassport, partnerStores, partnerProduct as product } from "./data.js";
import { icons } from "./icons.js";
import { PHOTO_STEPS, TRYON_STEPS, generatePhotoTryOn, tryOnProduct } from "./pipeline.js";

const VIEWS = { front: 0, side: 90, back: 180 };

const teeSilhouette = `
  <svg viewBox="0 0 200 200" class="product-silhouette" aria-hidden="true">
    <path d="M70 30 L40 42 L18 78 L44 92 L54 76 L54 172 L146 172 L146 76 L156 92 L182 78 L160 42 L130 30 C124 44 112 50 100 50 C88 50 76 44 70 30 Z"
      fill="var(--swatch)" stroke="rgb(0 0 0 / 0.12)" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M70 30 L54 76 M130 30 L146 76" stroke="rgb(0 0 0 / 0.14)" stroke-width="1.5" fill="none"/>
  </svg>`;

function steps() {
  return [
    { title: "Shop a partner store", text: "Browse like normal. Look for Try on with Outfitted." },
    { title: "We build it in 3D", text: "The product photos become a 3D garment in seconds." },
    { title: "Your avatar tries it on", text: "Your fit passport picks the size that fits you." },
  ]
    .map(
      (step, i) => `
        <li>
          <span class="how-number">${i + 1}</span>
          <div><strong>${step.title}</strong><p>${step.text}</p></div>
        </li>`
    )
    .join("");
}

function merchantMock() {
  return `
    <div class="merchant">
      <div class="merchant-bar">
        <span class="merchant-dots"><i></i><i></i><i></i></span>
        <span class="merchant-url">northline-athletics.example/raglan-run-tee</span>
      </div>
      <div class="merchant-body">
        <div class="product-photo" style="--swatch:${product.swatch}">${teeSilhouette}</div>
        <div class="product-info">
          <p class="merchant-name">${product.store}</p>
          <h3>${product.name}</h3>
          <p class="product-price">${product.price}</p>
          <p class="product-color">Color · ${product.color}</p>
          <div class="size-row">
            ${product.sizes.map((size) => `<span class="size-chip">${size}</span>`).join("")}
          </div>
          <button class="tryon-button" id="start-tryon">
            <span class="tryon-logo">OUTFITTED<span>.</span></span>
            <span>Try on with your avatar</span>
          </button>
          <p class="merchant-note">Partner widget, embedded on the store's product page</p>
        </div>
      </div>
    </div>`;
}

function tryOnPanel() {
  return `
    <div class="tryon-panel">
      <div class="tryon-state" data-tryon="idle">
        <div class="tryon-empty">
          <span class="rebuild-icon">${icons.sparkle}</span>
          <strong>Your avatar is ready</strong>
          <p>Tap <b>Try on with your avatar</b> on the product page to see how it fits you.</p>
        </div>
      </div>

      <div class="tryon-state" data-tryon="run" hidden>
        <p class="eyebrow">Building your try-on</p>
        <ol class="pipeline">
          ${TRYON_STEPS.map(
            (step) => `
              <li data-tryon-step="${step.id}">
                <span class="step-dot"></span>
                <span>${step.label}${step.detail ? `<small>${step.detail}</small>` : ""}</span>
              </li>`
          ).join("")}
        </ol>
      </div>

      <div class="tryon-state" data-tryon="done" hidden>
        <div class="segmented look-switch" role="tablist" aria-label="Try-on view">
          <button type="button" role="tab" class="active" data-look-tab="3d" aria-selected="true">3D fit</button>
          <button type="button" role="tab" data-look-tab="photo" aria-selected="false">Photo look <span class="beta-tag">AI</span></button>
        </div>

        <div data-look="3d">
          <div class="tryon-stage" id="fit-stage" aria-label="Your avatar wearing the ${product.name}">
            <span class="piece-badge">On your avatar</span>
            <div class="stage-controls" role="group" aria-label="Camera view">
              ${Object.keys(VIEWS)
                .map((view) => `<button class="view-button" data-fit-view="${view}">${view}</button>`)
                .join("")}
              <button class="icon-button spin-button active" id="fit-spin" aria-label="Auto-rotate" aria-pressed="true">${icons.rotate}</button>
            </div>
          </div>
          <p class="preview-note">Preview · rigid fit. Realistic draping is in progress.</p>
        </div>

        <div data-look="photo" hidden>
          ${photoLook()}
          <p class="preview-note">AI-generated image. Great for the look; use 3D fit for sizing.</p>
        </div>
        <div class="fit-readout">
          <div class="fit-head">
            <div>
              <p class="eyebrow">Your size</p>
              <h3 id="fit-verdict"></h3>
            </div>
            <div class="size-picker" role="group" aria-label="Size">
              ${product.sizes.map((size) => `<button class="size-chip" data-size="${size}">${size}</button>`).join("")}
            </div>
          </div>
          <dl class="fit-lines" id="fit-lines"></dl>
          <div class="fit-actions">
            <button class="button button-dark" id="ask-circle">Ask my circle</button>
            <button class="button button-ghost" id="reset-tryon">Try again</button>
          </div>
        </div>
      </div>
    </div>`;
}

function photoLook() {
  const { before, after, isPlaceholder } = product.photoTryOn;
  return `
    <div class="tryon-stage photo-stage">
      <div class="photo-state" data-photo="consent">
        <span class="rebuild-icon">${icons.camera}</span>
        <strong>See it on your photo</strong>
        <p>Photo look uses your original photo to generate a realistic image of you in this piece. Your fit passport keeps photos private by default.</p>
        <div class="photo-consent">
          <button class="button button-primary" id="allow-photo">Use my photo once</button>
          <button class="button button-ghost" data-look-tab="3d">Not now</button>
        </div>
      </div>

      <div class="photo-state photo-run" data-photo="run" hidden>
        <p class="eyebrow">Generating your photo look</p>
        <ol class="pipeline">
          ${PHOTO_STEPS.map(
            (step) => `
              <li data-photo-step="${step.id}">
                <span class="step-dot"></span>
                <span>${step.label}${step.detail ? `<small>${step.detail}</small>` : ""}</span>
              </li>`
          ).join("")}
        </ol>
      </div>

      <div class="compare" data-photo="done" hidden style="--pos: 50%">
        <img class="compare-after" alt="You wearing the ${product.name}, AI-generated" data-src="${after}" />
        <img class="compare-before" alt="Your original photo" data-src="${before}" />
        <span class="compare-line" aria-hidden="true"></span>
        <span class="compare-label compare-label-left">Your photo</span>
        <span class="compare-label compare-label-right">Outfitted</span>
        <span class="piece-badge">${isPlaceholder ? "Sample images" : "AI-generated"}</span>
        <input class="compare-range" type="range" min="0" max="100" value="50" aria-label="Compare your photo with the try-on" />
      </div>
    </div>`;
}

function passportCard() {
  return `
    <section class="passport" aria-labelledby="passport-title">
      <div class="room-head">
        <div>
          <p class="eyebrow">Fit passport</p>
          <h2 id="passport-title">Travels with you</h2>
        </div>
        <span class="status-pill">Verified</span>
      </div>
      <dl class="passport-grid">
        ${fitPassport.measurements.map((m) => `<div><dt>${m.label}</dt><dd>${m.value}</dd></div>`).join("")}
        ${fitPassport.sizes.map((m) => `<div><dt>${m.label}</dt><dd>${m.value}</dd></div>`).join("")}
      </dl>
      <p class="passport-sub">Stores can see</p>
      <ul class="sharing">
        ${fitPassport.sharing
          .map(
            (item) => `
              <li>
                <span>${item.label}</span>
                <button class="toggle${item.on ? " on" : ""}" role="switch" aria-checked="${item.on}" aria-label="${item.label}" data-share="${item.id}"><span></span></button>
              </li>`
          )
          .join("")}
      </ul>
    </section>

    <section class="partners" aria-labelledby="partners-title">
      <div class="room-head"><h2 id="partners-title">Partner stores</h2></div>
      <ul>
        ${partnerStores
          .map(
            (store) => `
              <li>
                <span class="avatar-chip">${store.initial}</span>
                <span>${store.name}</span>
                <b class="tag${store.status === "Partner" ? " tag-live" : ""}">${store.status}</b>
              </li>`
          )
          .join("")}
      </ul>
    </section>`;
}

export function tryOnPage() {
  return `
    <section class="tryon-intro">
      <p class="eyebrow">Beta · where we're heading</p>
      <h1>Try on anywhere you shop.</h1>
      <p class="intro-lede">Partner stores turn their products into 3D on the fly, and your avatar and fit passport come along.</p>
      <ol class="how">${steps()}</ol>
    </section>

    <div class="tryon-layout">
      <section class="tryon-demo" aria-label="Partner store try-on demo">
        ${merchantMock()}
        ${tryOnPanel()}
      </section>
      <aside class="rail">${passportCard()}</aside>
    </div>`;
}

export function connectTryOn() {
  const show = (state) =>
    document.querySelectorAll("[data-tryon]").forEach((el) => (el.hidden = el.dataset.tryon !== state));
  const start = document.querySelector("#start-tryon");
  let stage = null;
  const ask = document.querySelector("#ask-circle");

  const selectSize = (size) => {
    const fit = product.fit[size];
    document.querySelector("#fit-verdict").textContent = `${size} · ${fit.verdict}`;
    document.querySelector("#fit-lines").innerHTML = ["chest", "length", "shoulders"]
      .map((key) => `<div><dt>${key}</dt><dd>${fit[key]}</dd></div>`)
      .join("");
    document.querySelectorAll("[data-size]").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.size === size);
      chip.classList.toggle("recommended", chip.dataset.size === product.recommended);
    });
    stage?.setSizeScale(product.drape.sizeScale[size]);
  };

  start.onclick = async () => {
    start.disabled = true;
    show("run");
    const items = [...document.querySelectorAll("[data-tryon-step]")];
    items.forEach((item) => (item.className = ""));

    const result = await tryOnProduct(product, (stepId) => {
      const index = items.findIndex((item) => item.dataset.tryonStep === stepId);
      items.forEach((item, i) => (item.className = i < index ? "done" : i === index ? "active" : ""));
    });

    if (!stage) {
      // three.js loads only when someone actually tries something on.
      const { createFittingStage } = await import("./fitting-stage.js");
      stage = await createFittingStage(document.querySelector("#fit-stage"), {
        avatarUrl: "./assets/avatar.glb",
        garmentUrl: result.modelUrl,
        fit: product.drape,
      });
    }
    selectSize(result.recommended);
    ask.textContent = "Ask my circle";
    ask.disabled = false;
    showLook("3d");
    photoState = "consent";
    showPhoto("consent");
    show("done");
    start.disabled = false;
  };

  // --- Photo look (2D diffusion try-on) ---
  const showLook = (look) => {
    document.querySelectorAll("[data-look]").forEach((el) => (el.hidden = el.dataset.look !== look));
    document.querySelectorAll(".look-switch [data-look-tab]").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.lookTab === look);
      tab.setAttribute("aria-selected", tab.dataset.lookTab === look);
    });
  };
  const showPhoto = (state) =>
    document.querySelectorAll("[data-photo]").forEach((el) => (el.hidden = el.dataset.photo !== state));
  const photosShared = () => document.querySelector('[data-share="photos"]').classList.contains("on");
  let photoState = "consent";

  const runPhotoTryOn = async () => {
    photoState = "run";
    showPhoto("run");
    const items = [...document.querySelectorAll("[data-photo-step]")];
    items.forEach((item) => (item.className = ""));

    const { beforeUrl, afterUrl } = await generatePhotoTryOn(null, product, (stepId) => {
      const index = items.findIndex((item) => item.dataset.photoStep === stepId);
      items.forEach((item, i) => (item.className = i < index ? "done" : i === index ? "active" : ""));
    });

    document.querySelector(".compare-before").src = beforeUrl;
    document.querySelector(".compare-after").src = afterUrl;
    photoState = "done";
    showPhoto("done");
  };

  document.querySelectorAll("[data-look-tab]").forEach((tab) => {
    tab.onclick = () => {
      const look = tab.dataset.lookTab;
      showLook(look);
      if (look === "photo" && photoState === "consent" && photosShared()) runPhotoTryOn();
    };
  });
  document.querySelector("#allow-photo").onclick = runPhotoTryOn;

  const compare = document.querySelector(".compare");
  document.querySelector(".compare-range").oninput = (event) => compare.style.setProperty("--pos", `${event.target.value}%`);

  document.querySelectorAll("[data-size]").forEach((chip) => (chip.onclick = () => selectSize(chip.dataset.size)));

  const spin = document.querySelector("#fit-spin");
  const setSpin = (on) => {
    stage?.setAutoRotate(on);
    spin.classList.toggle("active", on);
    spin.setAttribute("aria-pressed", on);
  };
  spin.onclick = () => setSpin(!spin.classList.contains("active"));
  document.querySelectorAll("[data-fit-view]").forEach((button) => {
    button.onclick = () => {
      stage?.setView(VIEWS[button.dataset.fitView]);
      setSpin(false);
      document.querySelectorAll("[data-fit-view]").forEach((item) => item.classList.toggle("active", item === button));
    };
  });
  document.querySelector("#reset-tryon").onclick = () => {
    photoState = "consent";
    show("idle");
  };
  ask.onclick = () => {
    ask.textContent = "Sent to your circle";
    ask.disabled = true;
  };

  document.querySelectorAll("[data-share]").forEach((toggle) => {
    toggle.onclick = () => {
      const on = toggle.classList.toggle("on");
      toggle.setAttribute("aria-checked", on);
    };
  });
}
