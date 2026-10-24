// Style My Friend: Peer Styling Studio
// Grants a real friend temporary stylist permission to dress your avatar,
// mix and match layers, and attach personal styling advice.

import { currentUser } from "./data.js";
import { escapeHtml } from "./format.js";
import { renderStyleFriendModal } from "./views/style-friend-modal.js";

export const sampleWardrobe = {
  tops: [
    { id: "top-1", name: "Champagne Silk Cami", brand: "Reformation", price: "$128", color: "#fef08a", icon: "apparel" },
    { id: "top-2", name: "Cream Cashmere Knit", brand: "Everlane", price: "$145", color: "#ede4d3", icon: "apparel" },
    { id: "top-3", name: "Ribbed High-Neck Bodysuit", brand: "Aritzia", price: "$58", color: "#111111", icon: "apparel" },
    { id: "top-4", name: "Teal Raglan Tee", brand: "Northline Athletics", price: "$38", color: "#2bb3c7", icon: "apparel" }
  ],
  bottoms: [
    { id: "bot-1", name: "Pleated Charcoal Trousers", brand: "The Frankie Shop", price: "$185", color: "#374151", icon: "styler" },
    { id: "bot-2", name: "Indigo Straight-Leg Denim", brand: "Levi's", price: "$89", color: "#1e3a8a", icon: "styler" },
    { id: "bot-3", name: "Champagne Satin Midi Skirt", brand: "Mango", price: "$79", color: "#fef9c3", icon: "styler" },
    { id: "bot-4", name: "Burgundy Sport Leggings", brand: "Lululemon", price: "$98", color: "#7e1f2b", icon: "styler" }
  ],
  outerwear: [
    { id: "out-1", name: "Oversized Wool Blazer", brand: "The Frankie Shop", price: "$295", color: "#1f2937", icon: "dry_cleaning" },
    { id: "out-2", name: "Cropped Leather Bomber", brand: "Acne Studios", price: "$520", color: "#000000", icon: "dry_cleaning" },
    { id: "out-3", name: "Relaxed Drape Trench", brand: "COS", price: "$240", color: "#d1d5db", icon: "dry_cleaning" }
  ],
  shoes: [
    { id: "shoe-1", name: "Black Chunky Loafers", brand: "Prada", price: "$380", color: "#111111", icon: "steps" },
    { id: "shoe-2", name: "Kitten Heel Mules", brand: "Totême", price: "$320", color: "#fef08a", icon: "steps" },
    { id: "shoe-3", name: "White Retro Runners", brand: "New Balance", price: "$110", color: "#f3f4f6", icon: "steps" }
  ],
  accessories: [
    { id: "acc-1", name: "Chunky Gold Herringbone Chain", brand: "Mejuri", price: "$148", color: "#eab308", icon: "diamond" },
    { id: "acc-2", name: "Mini Leather Structured Tote", brand: "Polène", price: "$420", color: "#111111", icon: "shopping_bag" },
    { id: "acc-3", name: "Tortoise Oval Sunglasses", brand: "Celine", price: "$360", color: "#78350f", icon: "eyeglasses" }
  ]
};

export const defaultStylingSession = {
  friend: {
    name: "Camille Dupont",
    username: "camille.paris",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQoBB-RfZtEW8iXc9uacvJEdj6fI2Oa2jG2Ym8XPpHIOSVXOCNR_DysIiUIABvzIoXS8lcSDLVZ9kfEzfh5z3Eqnv_XuAVg6zK8Bd7SzKqF0jKXVds8MOKElPpKLKGlmjMjZDrPcK2enaV7WBhA75_S7OIB4D5pHurP4a6FC9WzMYVBkBo0h2EfDtDciqsoZDOJsSmzCzR0TtdbKEkQ6dizTIF5vdr3zBxRien_0nGRddSM5ppy7hj",
    brief: "“Dress me for my gallery opening date tonight! Need something effortlessly chic with comfortable yet sharp proportions.”",
    height: "5'7\"",
    size: "S / Euro 36"
  },
  currentLook: {
    top: sampleWardrobe.tops[0],
    bottom: sampleWardrobe.bottoms[0],
    outerwear: sampleWardrobe.outerwear[0],
    shoes: sampleWardrobe.shoes[0],
    accessory: sampleWardrobe.accessories[0]
  },
  stylistNote: "Tuck the champagne silk cami loosely into the pleated trousers, throw the oversized blazer over the shoulders, and the gold chain pulls the warmth together. Trust me, you'll stun!",
  activeCategory: "tops"
};

let sessionState = JSON.parse(JSON.stringify(defaultStylingSession));

export function openStyleFriend(friendData = null, toast = () => {}) {
  if (friendData) {
    sessionState.friend = { ...sessionState.friend, ...friendData };
  }

  const container = document.querySelector("#style-friend-modal-root");
  if (!container) return;

  container.innerHTML = renderStyleFriendModal(sessionState, sampleWardrobe);
  container.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  attachStyleFriendEvents(toast);
}

export function closeStyleFriend() {
  const container = document.querySelector("#style-friend-modal-root");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
  document.body.style.overflow = "";
}

function attachStyleFriendEvents(toast) {
  const container = document.querySelector("#style-friend-modal-root");
  if (!container) return;

  // Close modal
  container.querySelectorAll("[data-close-style-friend]").forEach((btn) => {
    btn.onclick = closeStyleFriend;
  });

  // Switch Category Tab (Tops, Bottoms, Outerwear, Shoes, Accessories)
  container.querySelectorAll("[data-style-category]").forEach((btn) => {
    btn.onclick = () => {
      sessionState.activeCategory = btn.dataset.styleCategory;
      container.innerHTML = renderStyleFriendModal(sessionState, sampleWardrobe);
      attachStyleFriendEvents(toast);
    };
  });

  // Equip garment onto friend's avatar
  container.querySelectorAll("[data-equip-garment]").forEach((btn) => {
    btn.onclick = () => {
      const cat = btn.dataset.equipCategory;
      const id = btn.dataset.equipGarment;
      const item = sampleWardrobe[cat]?.find((i) => i.id === id);
      if (item) {
        // Toggle or set
        const singularCat = cat === "accessories" ? "accessory" : cat === "shoes" ? "shoes" : cat.replace(/s$/, "");
        sessionState.currentLook[singularCat] = item;
        container.innerHTML = renderStyleFriendModal(sessionState, sampleWardrobe);
        attachStyleFriendEvents(toast);
        toast(`Equipped "${item.name}" on ${sessionState.friend.name}!`);
      }
    };
  });

  // Remove layer
  container.querySelectorAll("[data-remove-layer]").forEach((btn) => {
    btn.onclick = () => {
      const layer = btn.dataset.removeLayer;
      sessionState.currentLook[layer] = null;
      container.innerHTML = renderStyleFriendModal(sessionState, sampleWardrobe);
      attachStyleFriendEvents(toast);
    };
  });

  // Stylist advice note change
  const noteInput = container.querySelector("#stylist-advice-note");
  if (noteInput) {
    noteInput.oninput = (e) => {
      sessionState.stylistNote = e.target.value;
    };
  }

  // Send Styled Fit to Friend
  const btnSendFit = container.querySelector("#btn-send-styled-fit");
  if (btnSendFit) {
    btnSendFit.onclick = () => {
      btnSendFit.disabled = true;
      btnSendFit.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Sending fit to @${sessionState.friend.username}…`;

      setTimeout(() => {
        btnSendFit.innerHTML = `<span class="material-symbols-outlined text-[18px] text-tertiary-fixed">check_circle</span> Fit Delivered!`;
        toast(`✨ Look sent to @${sessionState.friend.username}! They'll be notified to try it on.`);

        // Append in-chat stylist bubble into chat view if present
        const chatFeed = document.querySelector("#chat-messages-container");
        if (chatFeed) {
          const stylistCard = document.createElement("div");
          stylistCard.className = "self-end w-full max-w-sm mr-2 transition-all duration-300 animate-slide-up";
          stylistCard.innerHTML = `
            <div class="bg-primary text-on-primary rounded-2xl p-4 shadow-lg flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="font-micro-mono text-[9px] uppercase tracking-wider text-tertiary-fixed font-bold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">styler</span>
                  You Styled A Look for Camille!
                </span>
                <span class="font-micro-mono text-[9px] text-surface-container-highest">Just now</span>
              </div>
              <p class="font-body-md text-label-md italic text-surface-container-lowest">“${escapeHtml(sessionState.stylistNote)}”</p>
              <div class="bg-primary-container p-2 rounded-xl flex items-center justify-between text-label-sm">
                <span>5 pieces styled</span>
                <span class="text-tertiary-fixed font-bold">Waiting for Camille's try-on</span>
              </div>
            </div>
          `;
          chatFeed.appendChild(stylistCard);
        }

        setTimeout(() => {
          closeStyleFriend();
        }, 1200);
      }, 800);
    };
  }
}
