export const currentUser = { name: "Sofoniyas", initial: "S" };

export const posts = [
  {
    id: "weekend-denim",
    author: "Sofoniyas",
    initial: "S",
    audience: "Close friends",
    time: "now",
    title: "Weekend denim",
    caption: "Should I wear this for a casual dinner? Thinking white sneakers.",
    pieces: [
      { name: "Cream crew knit", color: "#ede4d3" },
      { name: "Indigo straight-leg", color: "#34466b" },
      { name: "White leather sneakers", color: "#f7f5f0" },
    ],
    votes: { yes: 9, no: 3 },
    likes: 12,
    comments: 4,
    commentsList: [
      { id: "c1", author: "Maya Patel", initial: "M", time: "15m ago", text: "100% yes on the white sneakers. Keeps the knit clean and casual." },
      { id: "c2", author: "Jordan Lee", initial: "J", time: "10m ago", text: "Straight leg wash is top tier. Wear it!" },
      { id: "c3", author: "Samira Chen", initial: "S", time: "6m ago", text: "Maybe cuff the hem slightly to highlight the sneakers?" }
    ]
  },
  {
    id: "office-evening",
    author: "Maya Patel",
    initial: "M",
    audience: "Followers",
    time: "2h",
    title: "Blazer & leggings",
    caption: "Oversized blazer over sporty leggings for errands then drinks. Honest opinions?",
    pieces: [
      { name: "Oversized blazer", color: "#2b2926" },
      { name: "Silk camisole", color: "#c9a88a" },
      { name: "Burgundy sport leggings", color: "#7e1f2b", model: "./assets/leggings.glb" },
    ],
    votes: { yes: 21, no: 7 },
    likes: 28,
    comments: 8,
    commentsList: [
      { id: "c4", author: "Sofoniyas", initial: "S", time: "1h ago", text: "The proportions balance really well with the wide trousers." },
      { id: "c5", author: "Marcus Vance", initial: "M", time: "45m ago", text: "Super clean transition look for after 5pm." }
    ]
  },
  {
    id: "sunday-run",
    author: "Jordan Lee",
    initial: "J",
    audience: "Close friends",
    time: "5h",
    title: "Sunday run club",
    caption: "Raglan tee for the morning run, coffee after. Too gym, or does it work?",
    pieces: [
      { name: "Teal raglan run tee", color: "#2bb3c7", model: "./assets/raglan-tee.glb" },
      { name: "Charcoal joggers", color: "#3a3b3f" },
      { name: "White runners", color: "#efefeb" },
    ],
    votes: { yes: 6, no: 5 },
    likes: 9,
    comments: 3,
    commentsList: [
      { id: "c6", author: "Maya Patel", initial: "M", time: "4h ago", text: "Color is vibrant! Joggers tone it down just right for coffee." },
      { id: "c7", author: "Sofoniyas", initial: "S", time: "3h ago", text: "3D model looks clean in the feed, fit works." }
    ]
  },
];

export const history = [
  { name: "Black overshirt", status: "Saved", date: "Sep 21" },
  { name: "Ribbed knit set", status: "Saved", date: "Sep 14" },
  { name: "Weekend denim", status: "Live", date: "Today" },
];

// Portable profile a partner store can read (with the user's permission).
export const fitPassport = {
  measurements: [
    { label: "Height", value: "163 cm" },
    { label: "Chest", value: "88 cm" },
    { label: "Waist", value: "72 cm" },
    { label: "Hips", value: "96 cm" },
    { label: "Inseam", value: "76 cm" },
  ],
  sizes: [
    { label: "Tops", value: "M" },
    { label: "Bottoms", value: "28" },
    { label: "Fit pref.", value: "Relaxed" },
  ],
  sharing: [
    { id: "measurements", label: "Measurements", on: true },
    { id: "avatar", label: "3D avatar", on: true },
    { id: "photos", label: "Original photos", on: false },
  ],
};

// Fictional partner stores for the try-on preview.
export const partnerStores = [
  { name: "Northline Athletics", initial: "N", status: "Partner" },
  { name: "Common Thread", initial: "C", status: "Partner" },
  { name: "Studio Ardent", initial: "A", status: "Coming soon" },
];

export const partnerProduct = {
  store: "Northline Athletics",
  name: "Raglan Run Tee",
  price: "$38",
  color: "Lagoon teal",
  swatch: "#2bb3c7",
  sizes: ["XS", "S", "M", "L", "XL"],
  model: "./assets/raglan-tee.glb",
  // Dummy per-size fit readout; the real one comes from the garment + avatar fit.
  fit: {
    XS: { verdict: "Too tight", chest: "Tight", length: "Short", shoulders: "Tight" },
    S: { verdict: "Snug fit", chest: "Fitted", length: "Regular", shoulders: "Snug" },
    M: { verdict: "Best fit", chest: "Relaxed", length: "Regular", shoulders: "True to size" },
    L: { verdict: "Roomy", chest: "Loose", length: "Long", shoulders: "Dropped" },
    XL: { verdict: "Oversized", chest: "Very loose", length: "Long", shoulders: "Dropped" },
  },
  recommended: "M",
  // 2D photo try-on sample: a starting photo and a diffusion result, cropped to the same aligned 4:5 frame.
  photoTryOn: {
    before: "./assets/tryon-2d/before.jpg",
    after: "./assets/tryon-2d/after.jpg",
    isPlaceholder: false,
  },
  // Rigid placement on the default avatar: the garment's shoulder-line point (anchor, model units)
  // lands on the avatar's shoulder line (target, metres). The real pipeline will return this per user.
  drape: {
    anchor: [0, 63, 0.05],
    target: [0, 1.365, -0.07],
    scale: 0.023,
    stretch: [1, 0.9, 1.15],
    sizeScale: { XS: 0.86, S: 0.93, M: 1, L: 1.08, XL: 1.17 },
  },
};
