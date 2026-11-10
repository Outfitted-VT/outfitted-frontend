// Fits, images, and try-ons (see outfitted-backend docs/API.md).

import { apiBase, apiFetch, parse } from "./auth.js";

export const CATEGORIES = [
  { id: "top", label: "Top", icon: "apparel" },
  { id: "bottom", label: "Bottom", icon: "styler" },
  { id: "dress", label: "Dress", icon: "checkroom" },
  { id: "outerwear", label: "Outerwear", icon: "dry_cleaning" },
  { id: "shoes", label: "Shoes", icon: "steps" },
  { id: "bag", label: "Bag", icon: "shopping_bag" },
  { id: "accessory", label: "Accessory", icon: "eyeglasses" },
  { id: "jewelry", label: "Jewelry", icon: "diamond" },
  { id: "headwear", label: "Headwear", icon: "face" },
  { id: "other", label: "Other", icon: "category" },
];
export const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES.at(-1);

const MAX_SIDE = 2048;

// The backend builds image URLs from its own host (http://localhost:8000/media/...). Inside the
// Android emulator "localhost" is the emulator itself, so point those at the host the API is on.
export function mediaUrl(url) {
  if (!url) return url;
  const base = apiBase();
  if (!/^https?:/.test(base)) return url;
  try {
    const image = new URL(url);
    if (!["localhost", "127.0.0.1"].includes(image.hostname)) return url;
    const api = new URL(base);
    image.protocol = api.protocol;
    image.host = api.host;
    return image.toString();
  } catch {
    return url;
  }
}

// Resize on the device before uploading: phone photos are often 10+ MB, and iPhones shoot HEIC,
// which the backend doesn't accept. Drawing to a canvas gives a JPEG of at most 2048px.
// If that stalls, upload the original instead; the backend resizes it too.
function prepareImage(file) {
  const fallback = new Promise((resolve) => setTimeout(() => resolve(file), 8000));
  return Promise.race([resizeToJpeg(file), fallback]);
}

async function resizeToJpeg(file) {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (blob) return blob;
  } catch {
    // Not decodable here; let the backend validate the original.
  }
  return file;
}

export async function uploadImage(file) {
  const body = new FormData();
  body.append("file", await prepareImage(file), "photo.jpg");
  return parse(await apiFetch("/images", { method: "POST", body }));
}

// A copy of one of your images with every face blurred; the original is kept. Fails with
// "No face found in this photo" when there's nothing to blur.
export async function blurFaces(imageId) {
  return parse(await apiFetch(`/images/${encodeURIComponent(imageId)}/blur-faces`, { method: "POST" }));
}

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function createFit({
  imageIds,
  caption,
  items,
  occasionTags = [],
  styleTags = [],
  privacyTier = "public",
  allowFriendTryOn = true,
  tryonId = null, // posting a try-on: the try-on it came from, so others can try the look
}) {
  return parse(
    await apiFetch(
      "/fits",
      json("POST", {
        image_ids: imageIds,
        caption: caption || null,
        items,
        occasion_tags: occasionTags,
        style_tags: styleTags,
        privacy_tier: privacyTier,
        allow_friend_try_on: allowFriendTryOn,
        tryon_id: tryonId,
      })
    )
  );
}

// Suggested pieces and tags for one of your images: { items, occasion_tags, style_tags }.
// Items are already in the shape createFit accepts (source "detected", maybe a pin).
export async function detectPieces(imageId) {
  return parse(await apiFetch("/detections", json("POST", { image_id: imageId })));
}

// Edit your fit. Only the fields passed change; items and tags replace the whole list.
// Photos can't be changed after posting.
export async function updateFit(fitId, { caption, items, occasionTags, styleTags, privacyTier, allowFriendTryOn }) {
  const body = {
    caption,
    items,
    occasion_tags: occasionTags,
    style_tags: styleTags,
    privacy_tier: privacyTier,
    allow_friend_try_on: allowFriendTryOn,
  };
  Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
  return parse(await apiFetch(`/fits/${fitId}`, json("PATCH", body)));
}

export async function getFit(fitId) {
  return parse(await apiFetch(`/fits/${encodeURIComponent(fitId)}`));
}

export async function deleteFit(fitId) {
  return parse(await apiFetch(`/fits/${fitId}`, { method: "DELETE" }));
}

// path: "/fits" (explore), "/fits/following", or "/users/<name>/fits".
export async function listFits(path, cursor = null, limit = 10) {
  const params = new URLSearchParams({ limit: String(limit), ...(cursor && { cursor }) });
  return parse(await apiFetch(`${path}?${params}`));
}

export async function setLiked(fitId, liked) {
  return parse(await apiFetch(`/fits/${fitId}/like`, { method: liked ? "PUT" : "DELETE" }));
}

export async function setSaved(fitId, saved) {
  return parse(await apiFetch(`/fits/${fitId}/save`, { method: saved ? "PUT" : "DELETE" }));
}

// Votes: "wear" or "rethink", or null to retract. One vote per person per fit, so voting
// again replaces the previous choice. Unlike likes and saves these return the whole fit,
// with everyone's tallies, so the result bar can be redrawn without a second request.
export async function setVote(fitId, choice) {
  const path = `/fits/${fitId}/vote`;
  return parse(
    await apiFetch(path, choice ? json("PUT", { choice }) : { method: "DELETE" })
  );
}

export async function searchUsers(query = "", limit = 20) {
  return parse(await apiFetch(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`));
}

export async function followUser(username) {
  return parse(await apiFetch(`/users/${encodeURIComponent(username)}/follow`, { method: "PUT" }));
}

export async function unfollowUser(username) {
  return parse(await apiFetch(`/users/${encodeURIComponent(username)}/follow`, { method: "DELETE" }));
}

export async function getFollowers(username, { cursor, limit = 20 } = {}) {
  const params = new URLSearchParams({ limit });
  if (cursor) params.set("cursor", cursor);
  return parse(await apiFetch(`/users/${encodeURIComponent(username)}/followers?${params}`));
}

export async function getFollowing(username, { cursor, limit = 20 } = {}) {
  const params = new URLSearchParams({ limit });
  if (cursor) params.set("cursor", cursor);
  return parse(await apiFetch(`/users/${encodeURIComponent(username)}/following?${params}`));
}

export async function updateProfile({ fullName, bio, avatarImageId } = {}) {
  const body = {};
  if (fullName !== undefined) body.full_name = fullName;
  if (bio !== undefined) body.bio = bio;
  if (avatarImageId !== undefined) body.avatar_image_id = avatarImageId;
  return parse(await apiFetch("/users/me", json("PATCH", body)));
}

export async function updateStyleProfile({ styles, fit, top, bottom, tone }) {
  const body = {
    style_tags: styles,
    fit_preference: fit,
    top_size: top,
    bottom_size: bottom,
    feedback_tone: tone,
  };
  return parse(await apiFetch("/users/me", json("PATCH", body)));
}

export async function getSuggestions(limit = 6) {
  return parse(await apiFetch(`/users/suggestions?limit=${limit}`));
}

export async function getProfile(username) {
  return parse(await apiFetch(`/users/${encodeURIComponent(username)}`));
}

// Pass either `outfitImageId` (one photo of a whole outfit) or `pieces`
// ([{ slot, imageId }], slot being "head", "top", "outerwear", "one_piece", "bottom", "feet", or "accessory").
// fitId: "Try this look" on that fit, which allows its clothing photos (uploaded by its author).
export async function createTryOn(personImageId, { outfitImageId, pieces, fitId = null }) {
  const body = { person_image_id: personImageId, fit_id: fitId };
  if (pieces) body.pieces = pieces.map(({ slot, imageId }) => ({ slot, image_id: imageId }));
  else body.outfit_image_id = outfitImageId;
  return parse(await apiFetch("/tryons", json("POST", body)));
}


// --- Privacy, Sizing & Impact Intelligence Endpoints ---

export async function updateFitPrivacy(fitId, { privacyTier, allowFriendTryOn } = {}) {
  const body = {};
  if (privacyTier !== undefined) body.privacy_tier = privacyTier;
  if (allowFriendTryOn !== undefined) body.allow_friend_try_on = allowFriendTryOn;
  return parse(await apiFetch(`/fits/${fitId}/privacy`, json("PATCH", body)));
}

export async function getPrivacySettings() {
  return parse(await apiFetch("/users/me/privacy"));
}

export async function updatePrivacySettings({
  defaultClosetPrivacy,
} = {}) {
  const body = {};
  if (defaultClosetPrivacy !== undefined) body.default_closet_privacy = defaultClosetPrivacy;
  return parse(await apiFetch("/users/me/privacy", json("PATCH", body)));
}

export async function getTrueSizePassport() {
  return parse(await apiFetch("/sizing/passport"));
}

export async function addReferenceGarment({
  brand,
  category,
  itemName,
  size,
  fitFeeling = "perfect",
  isFavorite = true,
}) {
  return parse(
    await apiFetch(
      "/sizing/passport",
      json("POST", {
        brand,
        category,
        item_name: itemName,
        size,
        fit_feeling: fitFeeling,
        is_favorite: isFavorite,
      })
    )
  );
}

export async function removeReferenceGarment(garmentId) {
  return parse(await apiFetch(`/sizing/passport/${garmentId}`, { method: "DELETE" }));
}

export async function translateSize({
  targetBrand,
  category,
  targetItemFitPref = "standard",
  targetItemName = null,
  productUrl = null,
}) {
  return parse(
    await apiFetch(
      "/sizing/translate",
      json("POST", {
        target_brand: targetBrand,
        category,
        target_item_fit_pref: targetItemFitPref,
        target_item_name: targetItemName,
        product_url: productUrl,
      })
    )
  );
}

export async function getImpactSummary() {
  return parse(await apiFetch("/impact"));
}

export async function recordImpactEvent({
  itemName,
  brand = null,
  category = null,
  estimatedPrice = 65.0,
  actionType = "size_corrected",
  fitId = null,
  notes = null,
}) {
  return parse(
    await apiFetch(
      "/impact/record",
      json("POST", {
        item_name: itemName,
        brand,
        category,
        estimated_price: estimatedPrice,
        action_type: actionType,
        fit_id: fitId,
        notes,
      })
    )
  );
}

// --- Fit Comments ---

export async function listComments(fitId) {
  return parse(await apiFetch(`/fits/${fitId}/comments`));
}

export async function addComment(fitId, content) {
  return parse(await apiFetch(`/fits/${fitId}/comments`, json("POST", { content })));
}

export async function deleteComment(fitId, commentId) {
  return parse(await apiFetch(`/fits/${fitId}/comments/${commentId}`, { method: "DELETE" }));
}

// --- Digital Wardrobe Catalog & CPW Analytics ---

export async function listWardrobeItems(category = null) {
  const url = category ? `/wardrobe?category=${encodeURIComponent(category)}` : "/wardrobe";
  return parse(await apiFetch(url));
}

export async function getWardrobeSummary() {
  return parse(await apiFetch("/wardrobe/summary"));
}

export async function addWardrobeItem(item) {
  return parse(await apiFetch("/wardrobe", json("POST", item)));
}

export async function updateWardrobeItem(itemId, patch) {
  return parse(await apiFetch(`/wardrobe/${itemId}`, json("PATCH", patch)));
}

export async function logWardrobeWear(itemId) {
  return parse(await apiFetch(`/wardrobe/${itemId}/wear`, json("POST", {})));
}

export async function deleteWardrobeItem(itemId) {
  return parse(await apiFetch(`/wardrobe/${itemId}`, { method: "DELETE" }));
}

// --- Daily Outfit Memories & Fashion Calendar ---

export async function listOutfitMemories(year = null, month = null) {
  const params = new URLSearchParams();
  if (year != null) params.set("year", year);
  if (month != null) params.set("month", month);
  const qs = params.toString();
  return parse(await apiFetch(qs ? `/memories?${qs}` : "/memories"));
}

export async function createOutfitMemory(memory) {
  return parse(await apiFetch("/memories", json("POST", memory)));
}

export async function deleteOutfitMemory(memoryId) {
  return parse(await apiFetch(`/memories/${memoryId}`, { method: "DELETE" }));
}

