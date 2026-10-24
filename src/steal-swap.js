// Steal & Swap: Side-by-Side Body vs. Body Comparison
// Compares proportions, hemline, drape, and sizing between a friend's fit and your avatar.

import { currentUser } from "./data.js";
import { escapeHtml } from "./format.js";
import { renderStealSwapModal } from "./views/steal-swap-modal.js";

// Sample comparison dataset with realistic fit profiles and comparative metrics
export const sampleComparisons = {
  "weekend-denim": {
    fitId: "weekend-denim",
    title: "Weekend Denim & Knit",
    friend: {
      name: "Maya Patel",
      username: "maya.p",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHvgi6MHLnu0SW2ydau8iVxdjhzG2RLC0YMZV7aIxmLQCdEPxo4K8PFBR19KCc099OsUaovPAhKMkq_3gK-7_E3wTQW80tsPn0rS0WF1hVGIluXqbTQ5vyDSdKJdhbkPKSEXSRMMy9L429gizhE2lB7cbTVtulNBsDClS1HMNpCOvzHY9IdMKNHDhDFsUYzltirZIb2UwbgvPehdWjVZvO4rFfRVSrVS0DLlQ4Rhc0y_Lv3LCIOYFK",
      height: "5'4\" (163 cm)",
      frame: "Petite · Standard",
      sizeWorn: "Small (S)",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvitqbYhC06rwROt68aWVSkxshRsI_XZMYku2E4UmlX47SZItmqMOO94sP2n8m6eqeefZRDi0_ZOAFDUhConWt8cr6MPFh7ugcv8X0kd-7htxkU0ZSr-5h0P-Kd3vdxVMAqPs8mTdod8BXI64k-M-9Z2cEEilQlXab8X22Ky4j3z0vheDo_2bQ0YEBIRRY_2k63dndHnXJ-v1u9lFEc2IkdQYs1GMa468aoTCG5zm_URYRRTaPzYc3",
      fitVerdict: "Relaxed slouchy drape on torso, breaks fully over sneaker."
    },
    you: {
      name: "You",
      username: "sofoniyas",
      avatar: null,
      height: "5'10\" (178 cm)",
      frame: "Athletic · Broader shoulders",
      sizeRecommended: "Medium (M)",
      image: "./assets/tryon-2d/after.jpg",
      fitVerdict: "Clean tailored lines across shoulders, slight cropped taper at ankle."
    },
    pieces: [
      {
        id: "p1",
        name: "Cream Chunky Crew Knit",
        brand: "Everlane",
        price: "$118",
        color: "#ede4d3",
        category: "Top",
        icon: "apparel",
        fitDelta: "Friend gets a 2\" dropped-shoulder drape. On your frame, shoulder seams sit square.",
        recSize: "Size up to L for Maya's oversized look"
      },
      {
        id: "p2",
        name: "Indigo Straight-Leg Denim",
        brand: "Levi's",
        price: "$89",
        color: "#34466b",
        category: "Bottom",
        icon: "styler",
        fitDelta: "Inseam reaches 32\" on you (grazes sneaker tongue). Maya cuffed hem 1.5\".",
        recSize: "32W x 32L fits true"
      },
      {
        id: "p3",
        name: "Retro White Leather Lows",
        brand: "Veja",
        price: "$165",
        color: "#f7f5f0",
        category: "Shoes",
        icon: "steps",
        fitDelta: "Universal unisex low profile. Matches both hem lengths seamlessly.",
        recSize: "True to size (EU 43)"
      }
    ],
    deltas: [
      {
        metric: "Hemline & Inseam",
        badge: "Higher crop (+3.2\")",
        icon: "straighten",
        description: "Because of your 76cm inseam and taller frame, the straight-leg denim lands right above the ankle without pooling, giving a cleaner, sportier break."
      },
      {
        metric: "Shoulder & Chest Drape",
        badge: "Square athletic fit",
        icon: "checkroom",
        description: "The crew knit drops 2 inches past the shoulder line on Maya; on your broader shoulders, it fits closer to a tailored relaxed cut."
      },
      {
        metric: "Volume & Proportions",
        badge: "Streamlined silhouette",
        icon: "view_in_ar",
        description: "Maya’s silhouette leans into the trending 2026 slouchy streetwear aesthetic. On you, the proportions look balanced, elongated, and intentional."
      }
    ]
  },

  "office-evening": {
    fitId: "office-evening",
    title: "Oversized Blazer & Silk Camisole",
    friend: {
      name: "Camille Dupont",
      username: "camille.paris",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQoBB-RfZtEW8iXc9uacvJEdj6fI2Oa2jG2Ym8XPpHIOSVXOCNR_DysIiUIABvzIoXS8lcSDLVZ9kfEzfh5z3Eqnv_XuAVg6zK8Bd7SzKqF0jKXVds8MOKElPpKLKGlmjMjZDrPcK2enaV7WBhA75_S7OIB4D5pHurP4a6FC9WzMYVBkBo0h2EfDtDciqsoZDOJsSmzCzR0TtdbKEkQ6dizTIF5vdr3zBxRien_0nGRddSM5ppy7hj",
      height: "5'7\" (170 cm)",
      frame: "Slender · High-waisted",
      sizeWorn: "Euro 36 (S)",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvitqbYhC06rwROt68aWVSkxshRsI_XZMYku2E4UmlX47SZItmqMOO94sP2n8m6eqeefZRDi0_ZOAFDUhConWt8cr6MPFh7ugcv8X0kd-7htxkU0ZSr-5h0P-Kd3vdxVMAqPs8mTdod8BXI64k-M-9Z2cEEilQlXab8X22Ky4j3z0vheDo_2bQ0YEBIRRY_2k63dndHnXJ-v1u9lFEc2IkdQYs1GMa468aoTCG5zm_URYRRTaPzYc3",
      fitVerdict: "Dramatic oversized structure covering mid-thigh."
    },
    you: {
      name: "You",
      username: "sofoniyas",
      avatar: null,
      height: "5'10\" (178 cm)",
      frame: "Athletic · Relaxed fit",
      sizeRecommended: "Size L (for boxy drape)",
      image: "./assets/tryon-2d/before.jpg",
      fitVerdict: "Hits mid-hip, structured collar, pairs cleanly with wide leg bottoms."
    },
    pieces: [
      {
        id: "p4",
        name: "Double-Breasted Wool Blazer",
        brand: "The Frankie Shop",
        price: "$295",
        color: "#2b2926",
        category: "Outerwear",
        icon: "dry_cleaning",
        fitDelta: "Substantial shoulder pad construction. On your frame it provides razor-sharp tailoring.",
        recSize: "Order Size Large"
      },
      {
        id: "p5",
        name: "Champagne Silk Camisole",
        brand: "Reformation",
        price: "$128",
        color: "#c9a88a",
        category: "Top",
        icon: "apparel",
        fitDelta: "Bias-cut silk clings naturally to chest and torso contours.",
        recSize: "Order Size Medium"
      }
    ],
    deltas: [
      {
        metric: "Blazer Hem Length",
        badge: "Higher hem (+4.5\")",
        icon: "straighten",
        description: "On Camille, the blazer almost functions as a mini coat. On your taller torso, it lands neatly below the beltline."
      },
      {
        metric: "Layer Balance",
        badge: "Balanced contrast",
        icon: "layers",
        description: "The contrast between the rigid tailored blazer and soft inner layer remains striking across both builds."
      }
    ]
  }
};

let currentComparison = null;
let currentMode = "split"; // "split" | "side-by-side"

export function openStealSwap(fitId = "weekend-denim", toast = () => {}) {
  currentComparison = sampleComparisons[fitId] || sampleComparisons["weekend-denim"];
  currentMode = "split";

  const container = document.querySelector("#steal-swap-modal-root");
  if (!container) return;

  container.innerHTML = renderStealSwapModal(currentComparison, currentMode);
  container.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  attachStealSwapEvents(toast);
}

export function closeStealSwap() {
  const container = document.querySelector("#steal-swap-modal-root");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
  document.body.style.overflow = "";
}

function attachStealSwapEvents(toast) {
  const container = document.querySelector("#steal-swap-modal-root");
  if (!container) return;

  // Close buttons
  container.querySelectorAll("[data-close-steal-swap]").forEach((btn) => {
    btn.onclick = closeStealSwap;
  });

  // Mode switcher (Split slider vs Side-by-Side)
  container.querySelectorAll("[data-swap-mode]").forEach((btn) => {
    btn.onclick = () => {
      currentMode = btn.dataset.swapMode;
      container.innerHTML = renderStealSwapModal(currentComparison, currentMode);
      attachStealSwapEvents(toast);
    };
  });

  // Range Slider for Split View
  const slider = container.querySelector("#steal-swap-range");
  const stage = container.querySelector("#steal-swap-stage");
  const line = container.querySelector("#steal-swap-divider");
  const percentLabel = container.querySelector("#steal-swap-percent");

  if (slider && stage) {
    slider.oninput = (e) => {
      const val = e.target.value;
      stage.style.setProperty("--swap-pos", `${val}%`);
      if (line) line.style.left = `${val}%`;
      if (percentLabel) {
        percentLabel.textContent = `${val}% / ${100 - val}%`;
      }
    };
  }

  // Steal individual piece button
  container.querySelectorAll("[data-steal-piece]").forEach((btn) => {
    btn.onclick = () => {
      const pieceName = btn.dataset.stealPiece;
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px] text-tertiary-fixed">check</span> Stolen!`;
      btn.classList.add("bg-secondary", "text-on-secondary");
      toast(`Stole "${pieceName}" to your closet!`);
    };
  });

  // Save entire look to closet
  const btnSaveLook = container.querySelector("#btn-steal-entire-look");
  if (btnSaveLook) {
    btnSaveLook.onclick = () => {
      btnSaveLook.innerHTML = `<span class="material-symbols-outlined text-[18px] text-tertiary-fixed">bookmark_added</span> Saved to My Fits!`;
      toast(`Full outfit stolen and added to your wardrobe!`);
    };
  }

  // Send "Who wore it better" poll to friend
  const btnSendPoll = container.querySelector("#btn-send-comparison-poll");
  if (btnSendPoll) {
    btnSendPoll.onclick = () => {
      btnSendPoll.disabled = true;
      btnSendPoll.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Sending poll…`;
      setTimeout(() => {
        btnSendPoll.innerHTML = `<span class="material-symbols-outlined text-[18px] text-tertiary-fixed">check_circle</span> Poll Sent to @${currentComparison.friend.username}!`;
        toast(`"Who wore it better?" poll sent to ${currentComparison.friend.name}!`);
      }, 700);
    };
  }
}
