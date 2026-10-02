// Avatar rebuild pipeline (SAM 3D Body → Anny parametric fitting → GLB export)

export const PIPELINE_STEPS = [
  { id: "preprocess", label: "Human detection & preprocessing", detail: "Bounding box & illumination normalization" },
  { id: "segment", label: "Human segmentation", detail: "SAM 3D Body high-precision mask" },
  { id: "keypoints", label: "2D/3D keypoint & pose estimation", detail: "SMPL/Anny joint alignment" },
  { id: "reconstruct", label: "3D body reconstruction", detail: "Implicit volumetric surface inference" },
  { id: "initial_mesh", label: "Initial body representation", detail: "Dense vertex point cloud to mesh" },
  { id: "parametric", label: "Parametric fitting", detail: "Anny differentiable body representation" },
  { id: "persistent", label: "Persistent 3D avatar generation", detail: "User identity anchor & measurements" },
  { id: "export", label: "Browser-based 3D export", detail: "Y-up PBR glTF / GLB export" },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 3D Research Pipeline: SAM 3D Body → Anny parametric fitting → GLB export
 * @param {File|string} photo
 * @param {(stepId: string) => void} onStep
 * @returns {Promise<{ modelUrl: string }>}
 */
export async function rebuildAvatar(photo, onStep) {
  for (const step of PIPELINE_STEPS) {
    if (onStep) onStep(step.id);
    await wait(450 + Math.random() * 300);
  }
  return { modelUrl: "./assets/avatar.glb" };
}

// Partner-store try-on — STUB.
// Real flow: merchant product photos → 3D garment asset → fit onto the user's avatar via the fit passport.
export const TRYON_STEPS = [
  { id: "read", label: "Reading product photos" },
  { id: "build", label: "Building 3D garment" },
  { id: "fit", label: "Fitting to your avatar", detail: "Fit passport" },
];

/**
 * @param {object} product - merchant product (images, size chart)
 * @param {(stepId: string) => void} onStep
 * @returns {Promise<{ modelUrl: string, recommended: string }>}
 */
export async function tryOnProduct(product, onStep) {
  for (const step of TRYON_STEPS) {
    onStep(step.id);
    await wait(800 + Math.random() * 600);
  }
  return { modelUrl: product.model, recommended: product.recommended };
}

// 2D photo try-on (diffusion) — STUB.
// Real flow: user's original photo + product image → diffusion VTON model (e.g. IDM-VTON, CatVTON) behind
// our backend → photorealistic image. Never call a hosted model with an API key from the browser.
export const PHOTO_STEPS = [
  { id: "mask", label: "Finding the garment area" },
  { id: "generate", label: "Generating your look", detail: "Diffusion" },
  { id: "refine", label: "Refining details" },
];

/**
 * @param {File|null} photo - the user's original full-body photo (only with their consent)
 * @param {object} product - merchant product (garment image)
 * @param {(stepId: string) => void} onStep
 * @returns {Promise<{ beforeUrl: string, afterUrl: string }>}
 */
export async function generatePhotoTryOn(photo, product, onStep) {
  for (const step of PHOTO_STEPS) {
    onStep(step.id);
    await wait(step.id === "generate" ? 2200 : 900);
  }
  return { beforeUrl: product.photoTryOn.before, afterUrl: product.photoTryOn.after };
}
