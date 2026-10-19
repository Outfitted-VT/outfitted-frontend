import { PIPELINE_STEPS } from "../pipeline.js";

export function renderRebuildModal() {
  return `
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-opacity duration-300 hidden flex items-center justify-center p-margin" id="rebuild-modal-backdrop">
      <div class="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-2xl p-space-md flex flex-col space-y-space-md relative max-h-[90vh] overflow-y-auto" id="rebuild-modal-card">
        <!-- Close Button -->
        <button class="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors" id="btn-close-rebuild-modal" aria-label="Close">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div class="pt-1">
          <span class="font-micro-mono text-micro-mono uppercase text-secondary font-bold tracking-widest block">3D Fit Profile Pipeline</span>
          <h2 class="font-headline-md text-headline-md text-on-surface font-semibold mt-0.5">Rebuild Your Avatar</h2>
        </div>

        <!-- Stage 1: Upload / Photo selection -->
        <div class="flex flex-col space-y-space-sm" id="rebuild-stage-pick">
          <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Upload or capture one full-body photo. The AI pipeline estimates 3D joints and parametric mesh shape.
          </p>

          <label class="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-outline-variant hover:border-secondary bg-surface-container-low flex flex-col items-center justify-center cursor-pointer p-space-md text-center transition-colors relative overflow-hidden group" id="rebuild-dropzone">
            <input type="file" id="rebuild-file-input" accept="image/*" class="hidden" />
            <img id="rebuild-photo-preview" class="w-full h-full object-cover absolute inset-0 hidden" alt="Selected photo" />
            <div class="flex flex-col items-center space-y-2 z-10" id="rebuild-dropzone-prompt">
              <div class="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-[24px]">add_a_photo</span>
              </div>
              <strong class="font-title-ui text-body-md text-on-surface">Choose a full-body photo</strong>
              <small class="font-micro-mono text-micro-mono text-on-surface-variant uppercase">JPG or PNG · Under 20 MB</small>
            </div>
          </label>

          <ul class="text-label-sm text-on-surface-variant space-y-1 bg-surface-container-low p-3 rounded-DEFAULT list-disc list-inside">
            <li>Stand straight with full body head-to-toe in frame</li>
            <li>Wear form-fitting clothes, arms slightly off hips</li>
            <li>Good ambient lighting, neutral plain wall</li>
          </ul>

          <button class="w-full h-12 bg-primary text-on-primary rounded-full font-title-ui text-label-md font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none" id="btn-start-rebuild-pipeline" disabled>
            <span class="material-symbols-outlined text-[20px] text-tertiary-fixed">auto_fix_high</span>
            <span>Run 3D Mesh Calibration</span>
          </button>
        </div>

        <!-- Stage 2: Running Pipeline -->
        <div class="flex flex-col space-y-space-md hidden" id="rebuild-stage-run">
          <div class="flex items-center space-x-2">
            <span class="w-3 h-3 rounded-full bg-secondary animate-ping"></span>
            <span class="font-micro-mono text-micro-mono uppercase text-secondary font-bold tracking-wider">Generating Parametric Mesh</span>
          </div>

          <ol class="space-y-2.5 bg-surface-container-low p-space-md rounded-DEFAULT" id="rebuild-pipeline-steps-list">
            ${PIPELINE_STEPS.map((step) => `
              <li class="flex items-center space-x-3 text-on-surface-variant py-1 text-label-sm" data-rebuild-step="${step.id}">
                <span class="w-5 h-5 rounded-full border border-outline-variant flex items-center justify-center step-icon text-[12px]">
                  <span class="material-symbols-outlined text-[13px]">radio_button_unchecked</span>
                </span>
                <div class="flex flex-col min-w-0">
                  <span class="font-semibold text-on-surface step-label">${step.label}</span>
                  ${step.detail ? `<small class="font-micro-mono text-[10px] text-on-surface-variant">${step.detail}</small>` : ""}
                </div>
              </li>
            `).join("")}
          </ol>
        </div>

        <!-- Stage 3: Completed Done -->
        <div class="flex flex-col items-center space-y-space-md py-space-sm text-center hidden" id="rebuild-stage-done">
          <div class="w-16 h-16 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-lg">
            <span class="material-symbols-outlined text-[32px]">check</span>
          </div>
          <div>
            <h3 class="font-title-ui text-headline-md font-semibold text-on-surface">Avatar Calibrated</h3>
            <p class="font-body-md text-body-md text-on-surface-variant mt-1">
              Your personalized 3D avatar has been updated in the Fitting Room.
            </p>
          </div>
          <button class="w-full h-12 bg-primary text-on-primary rounded-full font-title-ui text-label-md font-semibold flex items-center justify-center shadow-md active:scale-95 transition-all" id="btn-rebuild-see-avatar">
            <span>Open Fitting Room</span>
            <span class="material-symbols-outlined text-[18px] ml-1">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  `;
}
