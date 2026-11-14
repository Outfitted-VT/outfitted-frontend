// A saved fit as a flat lay of its pieces, for fits posted as one photo per piece.
// Fits posted as a worn photo or a try-on show a placeholder instead.
// Styles: .fit-collage* in src/connected.css.

import { mediaUrl } from "../fits.js";
import { escapeHtml } from "../format.js";

const MAX_PIECES = 6;

// Top to bottom down the left column. Bottoms and dresses go in their own column on the right.
const ORDER = ["headwear", "outerwear", "top", "bag", "accessory", "jewelry", "other", "shoes"];
const TALL = new Set(["bottom", "dress"]);
const rank = (piece) => {
  const i = ORDER.indexOf(piece.category);
  return i === -1 ? ORDER.length : i;
};

// A try-on's body slots, as item categories.
const SLOT_CATEGORY = { head: "headwear", one_piece: "dress", feet: "shoes" };

// A try-on made piece by piece: the clothing photos it was made from (try_on_source, which the
// API leaves out when the poster turned off "Try this look").
function tryOnPieces(fit) {
  const source = fit.try_on_source;
  if (source?.mode !== "pieces") return [];
  return source.pieces
    .filter((piece) => piece.image)
    .slice(0, MAX_PIECES)
    .map((piece) => {
      const category = SLOT_CATEGORY[piece.slot] || piece.slot;
      // The "accessory" slot covers bags and jewelry too.
      const matches = piece.slot === "accessory" ? ["accessory", "bag", "jewelry"] : [category];
      const item = (fit.items || []).find((i) => matches.includes(i.category));
      return { url: mediaUrl(piece.image.url), name: item?.name || category, category };
    });
}

// The photo of each piece in the fit: the clothing photos a try-on was made from, or, for a
// fit posted one piece per photo, its own photos (two or more, none generated, none showing
// more than one piece, at least two with a piece tagged). [] when there are none, e.g. a photo
// of someone wearing it or a try-on from a whole-outfit photo.
export function piecePhotos(fit) {
  const fromTryOn = tryOnPieces(fit);
  if (fromTryOn.length) return fromTryOn;
  const images = fit.images || [];
  if (images.length < 2 || images.some((image) => image.generated)) return [];
  const itemsOn = new Map(images.map((image) => [image.id, []]));
  for (const item of fit.items || []) itemsOn.get(item.pin?.image_id)?.push(item);
  if ([...itemsOn.values()].some((items) => items.length > 1)) return [];
  const pieces = images.map((image) => {
    const [item] = itemsOn.get(image.id);
    return { url: mediaUrl(image.url), name: item?.name || "", category: item?.category || "other" };
  });
  return pieces.filter((piece) => piece.name).length >= 2 ? pieces.slice(0, MAX_PIECES) : [];
}

const img = (piece, style = "") =>
  `<img class="fit-collage-piece" src="${escapeHtml(piece.url)}" alt="${escapeHtml(piece.name)}" loading="lazy" ${style ? `style="${style}"` : ""} />`;

export function fitCollage(fit) {
  const pieces = piecePhotos(fit);
  if (!pieces.length) {
    return `<div class="fit-collage-empty">
      <span class="material-symbols-outlined" aria-hidden="true">checkroom</span>
      <span>No piece photos</span>
    </div>`;
  }
  const tall = pieces.find((piece) => TALL.has(piece.category));
  const rest = pieces.filter((piece) => piece !== tall).sort((a, b) => rank(a) - rank(b));
  // A bottom or dress with at least two other pieces: it takes the right column, the rest
  // stack on the left. Otherwise, a plain two-column grid.
  if (tall && rest.length >= 2) {
    const rows = rest.length;
    return `<div class="fit-collage" style="grid-template-rows:repeat(${rows},minmax(0,1fr))">
      ${rest.map((piece, i) => img(piece, `grid-column:1;grid-row:${i + 1}`)).join("")}
      ${img(tall, `grid-column:2;grid-row:1 / span ${rows}`)}
    </div>`;
  }
  const ordered = (tall ? [tall, ...rest] : rest).sort((a, b) => rank(a) - rank(b));
  const rows = Math.ceil(ordered.length / 2);
  return `<div class="fit-collage" style="grid-template-rows:repeat(${rows},minmax(0,1fr))">
    ${ordered.map((piece, i) => img(piece, ordered.length % 2 && i === ordered.length - 1 ? "grid-column:1 / span 2" : "")).join("")}
  </div>`;
}
