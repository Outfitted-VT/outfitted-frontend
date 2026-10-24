// Dorm Closet & Group Lookbooks: Event Outfit Coordination
// Collaborative shared boards for roommates, friend circles, and clubs to coordinate looks,
// avoid accidental clashes, harmonize color palettes, and request to borrow/swap items.

import { currentUser } from "./data.js";
import { escapeHtml } from "./format.js";
import { renderDormClosetModal } from "./views/dorm-closet-modal.js";

export const initialBoards = [
  {
    id: "formal-2026",
    title: "Alpha Phi Formal 🍸",
    theme: "Black Tie Optional · Emerald, Champagne & Velvet",
    date: "Sat, Oct 28 · 8:00 PM",
    location: "The Inn at Virginia Tech",
    harmonyScore: 96,
    clashWarning: null,
    members: [
      { name: "Maya Patel", username: "maya.p", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHvgi6MHLnu0SW2ydau8iVxdjhzG2RLC0YMZV7aIxmLQCdEPxo4K8PFBR19KCc099OsUaovPAhKMkq_3gK-7_E3wTQW80tsPn0rS0WF1hVGIluXqbTQ5vyDSdKJdhbkPKSEXSRMMy9L429gizhE2lB7cbTVtulNBsDClS1HMNpCOvzHY9IdMKNHDhDFsUYzltirZIb2UwbgvPehdWjVZvO4rFfRVSrVS0DLlQ4Rhc0y_Lv3LCIOYFK" },
      { name: "Camille Dupont", username: "camille.paris", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQoBB-RfZtEW8iXc9uacvJEdj6fI2Oa2jG2Ym8XPpHIOSVXOCNR_DysIiUIABvzIoXS8lcSDLVZ9kfEzfh5z3Eqnv_XuAVg6zK8Bd7SzKqF0jKXVds8MOKElPpKLKGlmjMjZDrPcK2enaV7WBhA75_S7OIB4D5pHurP4a6FC9WzMYVBkBo0h2EfDtDciqsoZDOJsSmzCzR0TtdbKEkQ6dizTIF5vdr3zBxRien_0nGRddSM5ppy7hj" },
      { name: "Elena V.", username: "elena.v", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBX0eROr5zPLPM_q-4-rfMs31l73q5Aj5YxXl49sgT8Au6hH17sdo6Z3Aw2BwC_ZYu8rezDXeqYIjAu5QWt_JfZEpWt7mRvHD6PNVVe8Ui8t5UsOMQJUtQ5VAZPl9xJyjPMVsIx7qFvgnW9avi3ClB0Mam9YqjFRliKtuae8AODQNrwNf_RjJ93sci2a2EByAq1WHNtJ4oojrjzeZtwwZ3GtpY42xqBoNQFZRvnRwJoJv9ZDKUP5v9_" },
      { name: "Jordan Lee", username: "jordan.l", avatar: null },
      { name: "You", username: "sofoniyas", avatar: null }
    ],
    palette: [
      { color: "#064e3b", label: "Emerald Silk", claimedBy: "Maya" },
      { color: "#fef08a", label: "Champagne Satin", claimedBy: "Camille" },
      { color: "#eab308", label: "Burnished Gold", claimedBy: "Elena" },
      { color: "#0f172a", label: "Midnight Velvet", claimedBy: "Jordan" },
      { color: "#831843", label: "Plum Wine", claimedBy: "You" }
    ],
    fits: [
      {
        id: "fit-maya-formal",
        author: {
          name: "Maya Patel",
          username: "maya.p",
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHvgi6MHLnu0SW2ydau8iVxdjhzG2RLC0YMZV7aIxmLQCdEPxo4K8PFBR19KCc099OsUaovPAhKMkq_3gK-7_E3wTQW80tsPn0rS0WF1hVGIluXqbTQ5vyDSdKJdhbkPKSEXSRMMy9L429gizhE2lB7cbTVtulNBsDClS1HMNpCOvzHY9IdMKNHDhDFsUYzltirZIb2UwbgvPehdWjVZvO4rFfRVSrVS0DLlQ4Rhc0y_Lv3LCIOYFK"
        },
        title: "Emerald Cowl Slip Dress",
        status: "locked", // "locked" | "debating" | "needs-shoes"
        statusText: "Locked In 🔒",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvitqbYhC06rwROt68aWVSkxshRsI_XZMYku2E4UmlX47SZItmqMOO94sP2n8m6eqeefZRDi0_ZOAFDUhConWt8cr6MPFh7ugcv8X0kd-7htxkU0ZSr-5h0P-Kd3vdxVMAqPs8mTdod8BXI64k-M-9Z2cEEilQlXab8X22Ky4j3z0vheDo_2bQ0YEBIRRY_2k63dndHnXJ-v1u9lFEc2IkdQYs1GMa468aoTCG5zm_URYRRTaPzYc3",
        pieces: [
          { name: "Silk Cowl Gown", brand: "Reformation", color: "#064e3b", borrowable: false },
          { name: "Crystal Drop Chandelier Earrings", brand: "Mejuri", color: "#eab308", borrowable: true }
        ],
        notes: "Pairing with strappy gold heels. Someone please stop me if anyone else wears emerald!"
      },
      {
        id: "fit-camille-formal",
        author: {
          name: "Camille Dupont",
          username: "camille.paris",
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQoBB-RfZtEW8iXc9uacvJEdj6fI2Oa2jG2Ym8XPpHIOSVXOCNR_DysIiUIABvzIoXS8lcSDLVZ9kfEzfh5z3Eqnv_XuAVg6zK8Bd7SzKqF0jKXVds8MOKElPpKLKGlmjMjZDrPcK2enaV7WBhA75_S7OIB4D5pHurP4a6FC9WzMYVBkBo0h2EfDtDciqsoZDOJsSmzCzR0TtdbKEkQ6dizTIF5vdr3zBxRien_0nGRddSM5ppy7hj"
        },
        title: "Champagne Silk + Cropped Tux Jacket",
        status: "locked",
        statusText: "Locked In 🔒",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCP8hU_ohU31fXg2UxqBIHgH2lSe9NBusuySLMrC4y0glAPeWQdqoQYo77ssbt-y8jxWFY-MVqcczESrfJz1_GqoZALwCIQYQgLM0dOzXEchywjPizZhW_fHG2IkUNrAVVo1-O1iy7XxiG-0V-8YLYzPJprjVIOz7azKpty9z3RQNyvfGc4LIP-kNk9vVwLB9dlP5SnIUl6kD_tOG7d2c7xdp3TTRS3G9IW2B2r8LmtEdtFYWJ20bp",
        pieces: [
          { name: "Satin Halter Maxi", brand: "Bec & Bridge", color: "#fef08a", borrowable: false },
          { name: "Velvet Cropped Dinner Jacket", brand: "Sandro", color: "#1e1b4b", borrowable: true }
        ],
        notes: "Velvet jacket is available to borrow if someone gets cold after midnight!"
      },
      {
        id: "fit-elena-formal",
        author: {
          name: "Elena V.",
          username: "elena.v",
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBX0eROr5zPLPM_q-4-rfMs31l73q5Aj5YxXl49sgT8Au6hH17sdo6Z3Aw2BwC_ZYu8rezDXeqYIjAu5QWt_JfZEpWt7mRvHD6PNVVe8Ui8t5UsOMQJUtQ5VAZPl9xJyjPMVsIx7qFvgnW9avi3ClB0Mam9YqjFRliKtuae8AODQNrwNf_RjJ93sci2a2EByAq1WHNtJ4oojrjzeZtwwZ3GtpY42xqBoNQFZRvnRwJoJv9ZDKUP5v9_"
        },
        title: "Liquid Gold Plissé Slip",
        status: "needs-shoes",
        statusText: "Need Shoes Advice 👠",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5vGBduRjWuklHysHB7sezJFdT6dtSfjdsy91puvPrYpvFAZEMe4Qy4v8k6Y0hov9Iqg0-LfVFtrV6r05Krpg30ClxW-imXwt19OSpkdQdyQy17kuTikpLUoq7CXvAy4dQbTzBTILvEhI9IwLUyPKKyL1atf1ZILnAa0U-57RxsY7FX3i3j4iBSA0RNUKKLFWFgcHpfo_GyZJw0thy5-o_JQX-2pC8c-u__bvO7smNNlmhJqtskXY5",
        pieces: [
          { name: "Gold Plissé Column Dress", brand: "Zara Studio", color: "#eab308", borrowable: false },
          { name: "Black Satin Pointed Mules", brand: "Mango", color: "#111111", borrowable: true }
        ],
        notes: "Debating between black pointed mules or nude strappy sandals. Vote in chat!"
      }
    ]
  },

  {
    id: "gameday-vt",
    title: "VT Game Day Tailgate 🏈",
    theme: "Lane Stadium Spirit · Maroon & Burnt Orange Layering",
    date: "This Saturday · 11:30 AM",
    location: "Lane Stadium Lot 4",
    harmonyScore: 98,
    clashWarning: null,
    members: [
      { name: "Jordan Lee", username: "jordan.l", avatar: null },
      { name: "Maya Patel", username: "maya.p", avatar: null },
      { name: "Sofoniyas", username: "sofoniyas", avatar: null }
    ],
    palette: [
      { color: "#800000", label: "Chicago Maroon", claimedBy: "Jordan" },
      { color: "#cf4520", label: "Burnt Orange", claimedBy: "Maya" },
      { color: "#e5e7eb", label: "Vintage White", claimedBy: "You" }
    ],
    fits: [
      {
        id: "fit-jordan-gameday",
        author: { name: "Jordan Lee", username: "jordan.l", avatar: null },
        title: "Vintage VT 90s Windbreaker + Baggy Denim",
        status: "locked",
        statusText: "Locked In 🔒",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjLunSpQZPGXeUoTqv40uyJmd3q6vF8O9VLPX8Tkgjq5-jba10Kb9YmHDLkIihmOxKubBs3yX8S6Za7J9qpuJr3T_WJWXTegh-oKa63BqdEpOtR9WGs-lzykheoU5xmXsGs1qYmOhOdat59CBqk_IMqECOOj5eBvPA801BZnbd6WQi2BuvzmwPC8OYUEYkfjpu9bS5aJwibvD6q8VwdpI_Jv-_NFpoD5LXnogAH82dRw35VEqfqFGG",
        pieces: [
          { name: "Vintage Starter Windbreaker", brand: "Vintage VT", color: "#800000", borrowable: false },
          { name: "Maroon Beanie", brand: "Carhartt", color: "#800000", borrowable: true }
        ],
        notes: "Heavy thermal layer underneath, ready for 45 degree kickoff!"
      }
    ]
  }
];

let activeBoardId = "formal-2026";
let boards = [...initialBoards];

export function openDormCloset(boardId = "formal-2026", toast = () => {}) {
  activeBoardId = boardId;
  const container = document.querySelector("#dorm-closet-modal-root");
  if (!container) return;

  const board = boards.find((b) => b.id === activeBoardId) || boards[0];
  container.innerHTML = renderDormClosetModal(board, boards);
  container.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  attachDormClosetEvents(toast);
}

export function closeDormCloset() {
  const container = document.querySelector("#dorm-closet-modal-root");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
  document.body.style.overflow = "";
}

function attachDormClosetEvents(toast) {
  const container = document.querySelector("#dorm-closet-modal-root");
  if (!container) return;

  // Close button
  container.querySelectorAll("[data-close-dorm-closet]").forEach((btn) => {
    btn.onclick = closeDormCloset;
  });

  // Switch Active Board
  container.querySelectorAll("[data-board-tab]").forEach((btn) => {
    btn.onclick = () => {
      openDormCloset(btn.dataset.boardTab, toast);
    };
  });

  // Borrow item request
  container.querySelectorAll("[data-borrow-item]").forEach((btn) => {
    btn.onclick = () => {
      const item = btn.dataset.borrowItem;
      const owner = btn.dataset.borrowOwner;
      btn.innerHTML = `<span class="material-symbols-outlined text-[14px] text-tertiary-fixed">check</span> Requested`;
      btn.classList.add("bg-secondary", "text-on-secondary");
      toast(`Sent borrow request to @${owner} for "${item}"!`);
    };
  });

  // Drop Fit Drawer Open
  const btnOpenDropFit = container.querySelector("#btn-open-drop-fit");
  const dropFitDrawer = container.querySelector("#drop-fit-drawer");
  const closeDropFit = container.querySelector("#btn-close-drop-fit");

  if (btnOpenDropFit && dropFitDrawer) {
    btnOpenDropFit.onclick = () => dropFitDrawer.classList.remove("hidden");
  }
  if (closeDropFit && dropFitDrawer) {
    closeDropFit.onclick = () => dropFitDrawer.classList.add("hidden");
  }

  // Handle Form Submit for Dropping Fit
  const dropFitForm = container.querySelector("#drop-fit-form");
  if (dropFitForm) {
    dropFitForm.onsubmit = (e) => {
      e.preventDefault();
      const title = container.querySelector("#drop-fit-title")?.value.trim() || "My Formal Fit";
      const notes = container.querySelector("#drop-fit-notes")?.value.trim() || "Ready for Saturday!";
      const statusSelect = container.querySelector("#drop-fit-status")?.value || "locked";
      const colorVal = container.querySelector("#drop-fit-color")?.value || "#831843";

      const currentBoard = boards.find((b) => b.id === activeBoardId);
      if (currentBoard) {
        const newFit = {
          id: `fit-${Date.now()}`,
          author: {
            name: currentUser.name || "You",
            username: currentUser.username || "sofoniyas",
            avatar: currentUser.avatarUrl || null
          },
          title,
          status: statusSelect,
          statusText: statusSelect === "locked" ? "Locked In 🔒" : statusSelect === "debating" ? "Debating 🤔" : "Need Shoe Advice 👠",
          image: "./assets/tryon-2d/after.jpg",
          pieces: [
            { name: "Burgundy Velvet Evening Blazer", brand: "Custom", color: colorVal, borrowable: true },
            { name: "Black Silk Trousers", brand: "Zara Man", color: "#111111", borrowable: false }
          ],
          notes
        };

        currentBoard.fits.unshift(newFit);
        currentBoard.palette.push({ color: colorVal, label: title, claimedBy: "You" });
        currentBoard.harmonyScore = Math.min(100, currentBoard.harmonyScore + 1);

        toast("Your fit has been dropped onto the board!");
        openDormCloset(activeBoardId, toast);
      }
    };
  }

  // Create New Board Modal Trigger
  const btnOpenCreateBoard = container.querySelector("#btn-open-create-board");
  const createBoardDrawer = container.querySelector("#create-board-drawer");
  const closeCreateBoard = container.querySelector("#btn-close-create-board");

  if (btnOpenCreateBoard && createBoardDrawer) {
    btnOpenCreateBoard.onclick = () => createBoardDrawer.classList.remove("hidden");
  }
  if (closeCreateBoard && createBoardDrawer) {
    closeCreateBoard.onclick = () => createBoardDrawer.classList.add("hidden");
  }

  // Submit New Board
  const createBoardForm = container.querySelector("#create-board-form");
  if (createBoardForm) {
    createBoardForm.onsubmit = (e) => {
      e.preventDefault();
      const title = container.querySelector("#new-board-title")?.value.trim() || "Friday Night Dinner 🍸";
      const theme = container.querySelector("#new-board-theme")?.value.trim() || "Smart Casual · Earth Tones";
      const date = container.querySelector("#new-board-date")?.value.trim() || "This Friday · 7:00 PM";
      const location = container.querySelector("#new-board-location")?.value.trim() || "Downtown";

      const newId = `board-${Date.now()}`;
      const newBoard = {
        id: newId,
        title,
        theme,
        date,
        location,
        harmonyScore: 92,
        clashWarning: null,
        members: [{ name: "You", username: currentUser.username || "sofoniyas", avatar: null }],
        palette: [{ color: "#475569", label: "Slate", claimedBy: "You" }],
        fits: []
      };

      boards.unshift(newBoard);
      toast(`Created Lookbook Board "${title}"!`);
      openDormCloset(newId, toast);
    };
  }
}
