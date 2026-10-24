import { icons } from "./icons.js";
import { fitPassport, partnerProduct } from "./data.js";

const RESEARCH_STAGES = [
  {
    step: "01",
    name: "Human Detection & Preprocessing",
    tool: "YOLOv8-Pose / ViT",
    desc: "Identifies the human subject in frame, normalizes lighting, crops to 4:5 aspect ratio, and calibrates camera intrinsics.",
  },
  {
    step: "02",
    name: "Human Segmentation",
    tool: "SAM 2 (Segment Anything)",
    desc: "Generates high-precision alpha mattes separating the body, hair, and clothing from the room background.",
  },
  {
    step: "03",
    name: "2D/3D Pose & Keypoint Estimation",
    tool: "SMPL-X / OpenPose",
    desc: "Predicts 33 dense anatomical joints, skeletal orientation, and ground contact planes in metric space.",
  },
  {
    step: "04",
    name: "3D Body Reconstruction",
    tool: "SAM 3D Body",
    desc: "Recovers initial 3D volumetric surface mesh directly from single or multi-view photo observations.",
  },
  {
    step: "05",
    name: "Parametric Fitting Conversion",
    tool: "Anny Parametric Engine",
    desc: "Differentiable optimization fitting the raw point cloud into Anny's adjustable parametric topology with clean UV unwrap.",
  },
  {
    step: "06",
    name: "Persistent Avatar Generation",
    tool: "Outfitted Mesh Optimizer",
    desc: "Normalizes mesh normals to Y-up orientation, bakes ambient occlusion, and exports lightweight GLB for mobile.",
  },
  {
    step: "07",
    name: "WebGL 3D Rendering",
    tool: "Three.js / <model-viewer>",
    desc: "Physically based neutral lighting (IBL), smooth orbit camera controls, and dynamic dimension overlays in real time.",
  },
  {
    step: "08",
    name: "Garment Fitting & Drape Simulation",
    tool: "Position-Based Dynamics (PBD)",
    desc: "Aligns collar/shoulder anchor points to the avatar torso and computes collision detection and stretch tension.",
  },
];

export function renderLab3D() {
  return `
    <div class="lab3d-page" id="lab3d-page">
      <div class="lab3d-hero">
        <div>
          <p class="eyebrow" style="color:var(--brand-coral);"><span class="coral-bullet">•</span> 3D FIT PROFILE & RESEARCH LAB</p>
          <h1 class="lab3d-title">Adjustable 3D Parametric Avatar</h1>
          <p class="lab3d-subtitle">Independent research pipeline: SAM 3D Body reconstruction paired with Anny differentiable parametric fitting.</p>
        </div>
        <div class="lab3d-hero-actions">
          <span class="status-pill status-live">Live WebGL Viewport</span>
          <button class="button button-outline" id="btn-rebuild-lab-avatar">
            ${icons.camera}<span>Upload Scan Photo</span>
          </button>
        </div>
      </div>

      <div class="lab3d-grid">
        <!-- 3D Viewport Column -->
        <div class="lab3d-viewport-column">
          <div class="viewport-card">
            <div class="viewport-header">
              <span class="avatar-tag">Parametric Body: Anny v1.4</span>
              <div class="garment-toggles">
                <button class="garment-btn active" data-model="./assets/avatar.glb">Base Body</button>
                <button class="garment-btn" data-model="./assets/raglan-tee.glb">Raglan Tee</button>
                <button class="garment-btn" data-model="./assets/leggings.glb">Leggings</button>
              </div>
            </div>

            <div class="viewport-canvas-box">
              <model-viewer
                id="lab-model-viewer"
                src="./assets/avatar.glb"
                alt="3D Parametric Avatar"
                camera-controls
                touch-action="pan-y"
                interaction-prompt="none"
                camera-orbit="0deg 82deg auto"
                min-camera-orbit="auto 40deg auto"
                max-camera-orbit="auto 100deg auto"
                field-of-view="26deg"
                environment-image="neutral"
                tone-mapping="neutral"
                exposure="0.95"
                shadow-intensity="1.1"
                shadow-softness="0.9"
                rotation-per-second="18deg"
              ></model-viewer>

              <div class="viewport-stage-controls">
                <button class="view-btn active" data-orbit="0deg 82deg auto">Front</button>
                <button class="view-btn" data-orbit="90deg 82deg auto">Side</button>
                <button class="view-btn" data-orbit="180deg 82deg auto">Back</button>
                <button class="view-btn icon-spin" id="lab-spin-btn" title="Toggle 360 rotation">${icons.rotate}</button>
              </div>
            </div>

            <div class="viewport-footer">
              <div class="mesh-metric">
                <small>Mesh Topology</small>
                <strong>Watertight Y-up</strong>
              </div>
              <div class="mesh-metric">
                <small>Vertex Count</small>
                <strong>14,820 Vertices</strong>
              </div>
              <div class="mesh-metric">
                <small>Drape Alignment</small>
                <strong>Shoulder Anchor</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Parametric Controls Column -->
        <div class="lab3d-controls-column">
          <div class="controls-card">
            <h3>Parametric Dimensions</h3>
            <p class="controls-desc">Adjust sliders to shape the avatar geometry and preview fit variations.</p>

            <div class="slider-group">
              <div class="slider-head">
                <label for="slide-height">Height</label>
                <span id="val-height">172 cm</span>
              </div>
              <input type="range" id="slide-height" min="150" max="195" value="172" />
            </div>

            <div class="slider-group">
              <div class="slider-head">
                <label for="slide-build">Build Proportions</label>
                <span id="val-build">Medium Athletic</span>
              </div>
              <input type="range" id="slide-build" min="1" max="5" value="3" />
            </div>

            <div class="slider-group">
              <div class="slider-head">
                <label for="slide-chest">Chest Circumference</label>
                <span id="val-chest">92 cm</span>
              </div>
              <input type="range" id="slide-chest" min="75" max="120" value="92" />
            </div>

            <div class="slider-group">
              <div class="slider-head">
                <label for="slide-waist">Waist</label>
                <span id="val-waist">76 cm</span>
              </div>
              <input type="range" id="slide-waist" min="60" max="105" value="76" />
            </div>

            <div class="slider-group">
              <div class="slider-head">
                <label for="slide-hips">Hips</label>
                <span id="val-hips">98 cm</span>
              </div>
              <input type="range" id="slide-hips" min="80" max="125" value="98" />
            </div>

            <div class="passport-summary-box">
              <h4>Fit Passport Permissions</h4>
              <div class="passport-switches">
                ${fitPassport.sharing
                  .map(
                    (item) => `
                    <label class="switch-row">
                      <span>${item.label}</span>
                      <input type="checkbox" ${item.on ? "checked" : ""} />
                    </label>
                  `
                  )
                  .join("")}
              </div>
              <small>Partner stores only receive parametric vector dimensions with explicit consent.</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Research Pipeline Architecture Overview -->
      <section class="research-pipeline-section">
        <div class="pipeline-section-head">
          <p class="eyebrow" style="color:var(--brand-green);">METHODOLOGY</p>
          <h2>The 8-Stage 3D Body Reconstruction Pipeline</h2>
          <p>Decoupled from the 2D Diffusion MVP so research progresses seamlessly without blocking social fit sharing.</p>
        </div>

        <div class="pipeline-steps-grid">
          ${RESEARCH_STAGES.map(
            (stage) => `
            <div class="stage-card">
              <span class="stage-num">${stage.step}</span>
              <div class="stage-content">
                <h4>${stage.name}</h4>
                <span class="tool-tag">${stage.tool}</span>
                <p>${stage.desc}</p>
              </div>
            </div>
          `
          ).join("")}
        </div>
      </section>
    </div>
  `;
}

export function connectLab3D() {
  const container = document.querySelector("#lab3d-page");
  if (!container) return;

  const viewer = container.querySelector("#lab-model-viewer");
  const spinBtn = container.querySelector("#lab-spin-btn");

  // Camera views
  container.querySelectorAll(".view-btn[data-orbit]").forEach((btn) => {
    btn.onclick = () => {
      container.querySelectorAll(".view-btn[data-orbit]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (viewer) {
        viewer.cameraOrbit = btn.dataset.orbit;
      }
    };
  });

  // Spin toggle
  let isSpinning = false;
  if (spinBtn) {
    spinBtn.onclick = () => {
      isSpinning = !isSpinning;
      viewer.autoRotate = isSpinning;
      spinBtn.classList.toggle("active", isSpinning);
    };
  }

  // Garment model switcher
  container.querySelectorAll(".garment-btn").forEach((btn) => {
    btn.onclick = () => {
      container.querySelectorAll(".garment-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (viewer) {
        viewer.src = btn.dataset.model;
      }
    };
  });

  // Slider adjustments
  const heightSlider = container.querySelector("#slide-height");
  const buildSlider = container.querySelector("#slide-build");
  const chestSlider = container.querySelector("#slide-chest");
  const waistSlider = container.querySelector("#slide-waist");
  const hipsSlider = container.querySelector("#slide-hips");

  const buildNames = ["Petite", "Slender", "Medium Athletic", "Broad", "Muscular Robust"];

  if (heightSlider) {
    heightSlider.oninput = () => {
      container.querySelector("#val-height").textContent = `${heightSlider.value} cm`;
      if (viewer) {
        const scale = heightSlider.value / 172;
        viewer.style.transform = `scaleY(${scale})`;
      }
    };
  }

  if (buildSlider) {
    buildSlider.oninput = () => {
      container.querySelector("#val-build").textContent = buildNames[buildSlider.value - 1];
    };
  }

  if (chestSlider) {
    chestSlider.oninput = () => {
      container.querySelector("#val-chest").textContent = `${chestSlider.value} cm`;
    };
  }

  if (waistSlider) {
    waistSlider.oninput = () => {
      container.querySelector("#val-waist").textContent = `${waistSlider.value} cm`;
    };
  }

  if (hipsSlider) {
    hipsSlider.oninput = () => {
      container.querySelector("#val-hips").textContent = `${hipsSlider.value} cm`;
    };
  }
}
