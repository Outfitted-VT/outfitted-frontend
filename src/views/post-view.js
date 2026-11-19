// One post on its own page, drawn and handled exactly like a feed card (likes, comments, Try this
// look, shop bubbles, Edit and Delete on your own). Opened from a fit shared in chat; Back returns
// to where you came from.

import { mountFitList } from "../feed.js";
import { getFit } from "../fits.js";
import { iconButton, ofIcons, stateBlock } from "./components.js";

export function renderPostScreen() {
  return `<section class="of-screen of-feed of-post-page" id="of-post">
    <header class="of-profile-head of-person-head">
      ${iconButton({ icon: ofIcons.back(20), label: "Back", data: { "data-post-back": true } })}
      <span class="of-handle">POST</span>
      <span class="of-person-head-gap" aria-hidden="true"></span>
    </header>
    <div class="of-feed-list" id="post-fits"></div>
    <div class="of-feed-status" id="post-status"></div>
    <div id="post-sentinel" aria-hidden="true"></div>
  </section>`;
}

const gone = stateBlock({
  icon: ofIcons.cloudOff(),
  title: "This post isn't available",
  body: "It may have been deleted, or it's only shared with some people.",
});

// options: { fitId, onBack, listOptions } (listOptions: the feed's toast, onOpenComments, ...)
export function mountPost({ fitId, onBack, listOptions }) {
  const root = document.querySelector("#of-post");
  if (!root) return;
  root.querySelector("[data-post-back]").addEventListener("click", onBack);
  mountFitList({
    ...listOptions,
    list: root.querySelector("#post-fits"),
    status: root.querySelector("#post-status"),
    sentinel: root.querySelector("#post-sentinel"),
    empty: gone,
    // Deleting it from here goes back.
    onChange: onBack,
    fetchPage: async () => {
      try {
        return { items: [await getFit(fitId)], next_cursor: null };
      } catch (err) {
        if (err.status === 404) return { items: [], next_cursor: null };
        throw err;
      }
    },
  });
}
