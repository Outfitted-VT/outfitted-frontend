export function renderFittingRoomView() {
  return `
    <div class="flex flex-col w-full px-margin space-y-space-md">
      <!-- Fitting Room Stage Top Controls -->
      <section class="flex flex-col space-y-space-xs pt-space-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-space-2xs">
            <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span class="font-micro-mono text-micro-mono uppercase text-on-surface-variant tracking-wider">Digital Closet · Studio View</span>
          </div>
          <div class="flex items-center space-x-1.5 px-2.5 py-1 bg-surface-container-high rounded-full">
            <span class="material-symbols-outlined text-secondary text-[14px]">view_in_ar</span>
            <span class="font-micro-mono text-micro-mono text-on-surface">Avatar v2.4 (Active)</span>
          </div>
        </div>

        <!-- Mode Selector Pills -->
        <div class="flex items-center space-x-space-xs overflow-x-auto pb-1 no-scrollbar">
          <button class="stage-tab active-pill px-space-md py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm transition-all duration-200" data-stage-tab="current">
            Current Fit
          </button>
          <button class="stage-tab px-space-md py-2 bg-surface-container-lowest text-on-surface rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm transition-all duration-200 hover:bg-surface-container" data-stage-tab="saved">
            Saved Looks <span class="ml-1 text-on-surface-variant opacity-75 font-micro-mono text-micro-mono">(12)</span>
          </button>
          <button class="stage-tab px-space-md py-2 bg-surface-container-lowest text-on-surface rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm transition-all duration-200 hover:bg-surface-container" data-stage-tab="wardrobe">
            Wardrobe Staging
          </button>
        </div>
      </section>

      <!-- Central 3D Interactive Viewport -->
      <section class="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-surface-container-low shadow-sm flex flex-col justify-between p-space-sm group select-none">
        <!-- Visual Avatar Scene Layer (3D Model or Editorial Render) -->
        <div class="absolute inset-0 w-full h-full" id="stage-viewport-container">
          <!-- Live 3D Model Viewer (hidden by default, toggled via 3D mode) -->
          <model-viewer
            id="fitting-stage-model"
            class="w-full h-full absolute inset-0 hidden"
            src="./assets/avatar.glb"
            alt="Your 3D Avatar"
            camera-controls
            touch-action="pan-y"
            disable-zoom
            interaction-prompt="none"
            camera-orbit="0deg 82deg auto"
            field-of-view="26deg"
            environment-image="neutral"
            tone-mapping="neutral"
            exposure="0.95"
            shadow-intensity="1.1"
            rotation-per-second="18deg"
          ></model-viewer>

          <!-- Editorial Studio Render -->
          <img
            class="w-full h-full object-cover object-center transition-transform duration-700 ease-out"
            id="avatarStageImage"
            alt="3D Avatar in Studio View"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcInMn1FXU7WdTKA_p2w2yPjJ01hwsRzS2FUnul9K0ZxEkGqWDdLI2VmmLmrVahK8nVxre6PasjAcH2_5DJq_iLLqctLECwE9pnCyGywzM8oy9PdLJkfaJ5WINN07nKWoIEuRW9z_5tgW0m7VbWhxE-8GFPvWo0N1zDRYKEEYmCKRSnqpUQuQJ_q-dHWr9iLb6O08Q4rIBCO-80xAnX4Balz8yKD_5GSykdGJW1pvs2W7rRp3o9fk3"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15 pointer-events-none"></div>
          <div class="absolute inset-0 bg-gradient-to-b from-surface/20 via-transparent to-transparent pointer-events-none"></div>
        </div>

        <!-- Viewport Top Status HUD -->
        <div class="relative z-10 flex items-center justify-between w-full">
          <div class="flex items-center space-x-space-2xs bg-surface-container-lowest/85 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-on-surface">
            <span class="w-1.5 h-1.5 rounded-full bg-tertiary-fixed shadow-[0_0_8px_rgba(208,240,67,1)]"></span>
            <span class="font-micro-mono text-micro-mono tracking-widest uppercase">Physical Fit Sim: 98% Match</span>
          </div>
          <div class="flex items-center space-x-1.5">
            <button class="w-9 h-9 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-on-surface flex items-center justify-center shadow-sm active:scale-95 transition-transform" id="lightingBtn" title="Toggle Lighting & 3D">
              <span class="material-symbols-outlined text-[18px]">view_in_ar</span>
            </button>
            <button class="w-9 h-9 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-on-surface flex items-center justify-center shadow-sm active:scale-95 transition-transform" id="zoomBtn" title="Zoom Stage">
              <span class="material-symbols-outlined text-[18px]">zoom_in</span>
            </button>
          </div>
        </div>

        <!-- Garment Hotspot Pins (Interactive Overlays) -->
        <div class="relative z-10 w-full h-full pointer-events-auto" id="stage-hotspots">
          <!-- Hotspot 1: Blazer -->
          <div class="absolute top-[28%] left-[22%] -translate-y-1/2 group/pin cursor-pointer">
            <div class="flex items-center space-x-1.5 bg-primary/90 hover:bg-primary text-on-primary backdrop-blur-md px-3 py-1.5 rounded-full shadow-md active:scale-95 transition-all">
              <span class="w-2 h-2 rounded-full bg-secondary"></span>
              <span class="font-label-sm text-label-sm font-semibold tracking-tight">$540 · Acne Studios Wool Blazer</span>
              <span class="material-symbols-outlined text-[14px] text-tertiary-fixed ml-0.5">arrow_forward</span>
            </div>
            <div class="w-2.5 h-2.5 bg-secondary rounded-full absolute -bottom-3 left-6 animate-ping opacity-75"></div>
          </div>

          <!-- Hotspot 2: Trousers -->
          <div class="absolute top-[62%] right-[16%] -translate-y-1/2 group/pin cursor-pointer">
            <div class="flex items-center space-x-1.5 bg-primary/90 hover:bg-primary text-on-primary backdrop-blur-md px-3 py-1.5 rounded-full shadow-md active:scale-95 transition-all">
              <span class="w-2 h-2 rounded-full bg-secondary"></span>
              <span class="font-label-sm text-label-sm font-semibold tracking-tight">Khaite Pleated Olive</span>
              <span class="material-symbols-outlined text-[14px] text-tertiary-fixed ml-0.5">info</span>
            </div>
          </div>

          <!-- Hotspot 3: Footwear Micro Tag -->
          <div class="absolute bottom-[16%] left-[34%] cursor-pointer">
            <div class="flex items-center space-x-1 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface px-2.5 py-1 rounded-full shadow-sm hover:bg-surface-container-lowest active:scale-95 transition-transform">
              <span class="font-micro-mono text-micro-mono uppercase">Loafers · Prada</span>
              <span class="material-symbols-outlined text-[12px] text-secondary">check</span>
            </div>
          </div>
        </div>

        <!-- Floating HUD Viewport Camera Controls -->
        <div class="relative z-10 w-full flex flex-col items-center space-y-2">
          <!-- 360 Spin Active Callout -->
          <div class="hidden items-center space-x-1.5 px-3 py-1 bg-secondary text-on-secondary rounded-full shadow-lg" id="spinBadge">
            <span class="material-symbols-outlined text-[14px] animate-spin">refresh</span>
            <span class="font-micro-mono text-micro-mono uppercase tracking-widest">360° Real-time Orbit</span>
          </div>

          <!-- Orbit Dock -->
          <div class="w-full bg-surface-container-lowest/90 backdrop-blur-xl rounded-full p-1.5 shadow-lg flex items-center justify-between">
            <div class="flex items-center space-x-1 pl-1">
              <button class="cam-angle active-cam px-3.5 py-1.5 bg-primary text-on-primary rounded-full font-label-sm text-label-sm transition-all duration-200" data-angle="front">
                Front
              </button>
              <button class="cam-angle px-3.5 py-1.5 text-on-surface rounded-full font-label-sm text-label-sm hover:bg-surface-container transition-all duration-200" data-angle="side">
                Side
              </button>
              <button class="cam-angle px-3.5 py-1.5 text-on-surface rounded-full font-label-sm text-label-sm hover:bg-surface-container transition-all duration-200" data-angle="back">
                Back
              </button>
            </div>
            <button class="flex items-center space-x-1.5 bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary hover:text-on-secondary px-3.5 py-1.5 rounded-full transition-colors duration-200 active:scale-95" id="spinBtn">
              <span class="material-symbols-outlined text-[16px]">360</span>
              <span class="font-label-sm text-label-sm font-semibold tracking-wide">Spin</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Rebuild Avatar Camera Scan Action Card -->
      <section class="w-full bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex items-center justify-between space-x-space-sm relative overflow-hidden">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-secondary-fixed-dim/30 pointer-events-none"></div>
        <div class="flex items-center space-x-space-sm min-w-0">
          <div class="relative w-12 h-12 flex-shrink-0 bg-primary rounded-full flex items-center justify-center text-on-primary shadow-sm">
            <span class="material-symbols-outlined text-[24px]">view_in_ar</span>
            <span class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-tertiary-fixed rounded-full flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[10px] text-on-tertiary-fixed">add</span>
            </span>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center space-x-1.5">
              <h2 class="font-title-ui text-title-ui text-on-surface font-semibold truncate">Rebuild Avatar with 3D Scan</h2>
            </div>
            <p class="font-body-md text-body-md text-on-surface-variant truncate">5-sec video scan calibrates posture & drape</p>
          </div>
        </div>
        <button class="flex-shrink-0 bg-secondary text-on-secondary px-4 py-2.5 rounded-full font-label-md text-label-md font-semibold flex items-center space-x-1 shadow-sm active:scale-95 hover:bg-secondary-container transition-all" id="btn-open-rebuild-scan">
          <span>Scan</span>
          <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </section>

      <!-- Avatar Biometrics & Calibration Section -->
      <section class="flex flex-col space-y-space-xs">
        <div class="flex items-center justify-between px-1">
          <span class="font-micro-mono text-micro-mono uppercase text-on-surface-variant tracking-wider">Calibration Profile</span>
          <span class="font-micro-mono text-micro-mono text-secondary font-semibold cursor-pointer hover:underline">Edit Dimensions</span>
        </div>

        <!-- 3-Column Metric Bento Tiles -->
        <div class="grid grid-cols-3 gap-space-xs w-full">
          <!-- Metric Tile 1: Height -->
          <div class="bg-surface-container-lowest rounded-DEFAULT p-3 flex flex-col justify-between shadow-sm">
            <div class="flex items-center justify-between text-on-surface-variant mb-2">
              <span class="font-micro-mono text-micro-mono uppercase">Height</span>
              <span class="material-symbols-outlined text-[18px] text-secondary">straighten</span>
            </div>
            <div>
              <div class="font-title-ui text-title-ui font-semibold text-on-surface">5'8"</div>
              <div class="font-micro-mono text-micro-mono text-on-surface-variant">173.0 cm</div>
            </div>
          </div>

          <!-- Metric Tile 2: Build -->
          <div class="bg-surface-container-lowest rounded-DEFAULT p-3 flex flex-col justify-between shadow-sm">
            <div class="flex items-center justify-between text-on-surface-variant mb-2">
              <span class="font-micro-mono text-micro-mono uppercase">Build</span>
              <span class="material-symbols-outlined text-[18px] text-on-surface">accessibility_new</span>
            </div>
            <div>
              <div class="font-title-ui text-title-ui font-semibold text-on-surface truncate">Athletic</div>
              <div class="font-micro-mono text-micro-mono text-on-surface-variant">Slim Drop-8</div>
            </div>
          </div>

          <!-- Metric Tile 3: Fit Preference -->
          <div class="bg-surface-container-lowest rounded-DEFAULT p-3 flex flex-col justify-between shadow-sm">
            <div class="flex items-center justify-between text-on-surface-variant mb-2">
              <span class="font-micro-mono text-micro-mono uppercase">Drape</span>
              <span class="material-symbols-outlined text-[18px] text-tertiary-container">dry_cleaning</span>
            </div>
            <div>
              <div class="font-title-ui text-title-ui font-semibold text-on-surface truncate">Relaxed</div>
              <div class="font-micro-mono text-micro-mono text-on-surface-variant">Oversized</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Luxury Fit Passport & Verification Badge -->
      <section class="w-full bg-surface-container-lowest rounded-lg p-space-md shadow-sm relative overflow-hidden flex flex-col space-y-space-sm mb-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-space-xs">
            <div class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
              <span class="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <h3 class="font-title-editorial text-title-editorial text-on-surface tracking-tight">Outfitted Fit Passport™</h3>
              <p class="font-micro-mono text-micro-mono text-on-surface-variant uppercase tracking-widest">ID: #OF-9281-V4 · Encrypted Sizing</p>
            </div>
          </div>
          <span class="px-2.5 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full font-micro-mono text-micro-mono uppercase tracking-wider font-semibold">
            Verified
          </span>
        </div>

        <!-- Passport Spec Row with simulated QR Code -->
        <div class="p-space-sm bg-surface-container-low rounded-DEFAULT flex items-center justify-between">
          <div class="flex items-center space-x-space-sm">
            <div class="w-12 h-12 bg-surface-container-lowest rounded-md p-1.5 shadow-sm flex items-center justify-center flex-shrink-0">
              <svg class="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h10v4h-4v2h4v2h-4v2h4v-2h-2v-4h2V2h-8v4h2V2h-2zm-8 8H2v10h8v-8H4v-2h2zm2 4v4H4v-4h4zm8-2h2v4h-2v-4zm4 4h2v4h-4v-2h2v-2zm-6 2h4v2h-4v-2zm8 0h2v2h-2v-2z"></path>
              </svg>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-body-md text-body-md font-medium text-on-surface">Universal Tailor Format</span>
              <span class="font-micro-mono text-micro-mono text-on-surface-variant">Compatible with Acne, Khaite, SSENSE, Zara</span>
            </div>
          </div>
          <button class="w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-sm hover:bg-surface transition-colors active:scale-95 flex-shrink-0" id="btn-share-passport">
            <span class="material-symbols-outlined text-[20px]">ios_share</span>
          </button>
        </div>

        <!-- Quick Tailoring Specs Micro List -->
        <div class="grid grid-cols-4 gap-2 pt-1 border-none text-center">
          <div class="flex flex-col">
            <span class="font-micro-mono text-micro-mono text-on-surface-variant uppercase">Chest</span>
            <span class="font-label-md text-label-md font-semibold text-on-surface">38.5 in</span>
          </div>
          <div class="flex flex-col">
            <span class="font-micro-mono text-micro-mono text-on-surface-variant uppercase">Waist</span>
            <span class="font-label-md text-label-md font-semibold text-on-surface">30.0 in</span>
          </div>
          <div class="flex flex-col">
            <span class="font-micro-mono text-micro-mono text-on-surface-variant uppercase">Shoulder</span>
            <span class="font-label-md text-label-md font-semibold text-on-surface">17.8 in</span>
          </div>
          <div class="flex flex-col">
            <span class="font-micro-mono text-micro-mono text-on-surface-variant uppercase">Inseam</span>
            <span class="font-label-md text-label-md font-semibold text-on-surface">31.2 in</span>
          </div>
        </div>
      </section>
    </div>
  `;
}
