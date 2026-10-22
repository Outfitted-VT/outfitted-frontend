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

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function createFit({ imageIds, caption, items }) {
  return parse(
    await apiFetch("/fits", json("POST", { image_ids: imageIds, caption: caption || null, items }))
  );
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

export async function getProfile(username) {
  return parse(await apiFetch(`/users/${encodeURIComponent(username)}`));
}

export async function createTryOn(personImageId, outfitImageId) {
  return parse(
    await apiFetch(
      "/tryons",
      json("POST", { person_image_id: personImageId, outfit_image_id: outfitImageId })
    )
  );
}
