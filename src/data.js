export const currentUser = {
  name: "Sofoniyas",
  handle: "@sofoniyas",
  initial: "S",
  bio: "Curating textures, tailoring & everyday ease. Brooklyn, NY.",
  avatar: "./assets/feed/about_me_reactions.png",
  followers: 342,
  following: 189,
};

export const friendsList = [
  {
    id: "maya",
    name: "Maya Chen",
    handle: "@mayamakesfits",
    initial: "MC",
    color: "#275038",
    status: "Active 2h ago",
    following: true,
    bio: "Stylist & architecture student. Always oversized denim.",
    fitsCount: 28,
  },
];

export const posts = [
  {
    id: "denim-dilemma",
    fileTag: "THE FIT FILES / 01",
    author: "Maya Chen",
    handle: "@mayamakesfits",
    initial: "MC",
    initialBg: "#2d5a3f",
    audience: "Everyone on Outfitted",
    time: "2h ago",
    title: "the denim dilemma",
    question: "Is this giving effortless or did I just roll out of bed? Be honest 👀",
    image: "./assets/feed/maya_fit.png",
    piecesSummary: "Oversized denim jacket · Wide-leg red trousers · Silver sneakers",
    pieces: [
      { name: "Oversized denim jacket", color: "#546e82", link: "https://zara.com" },
      { name: "Wide-leg red trousers", color: "#a83232", link: "https://ssense.com" },
      { name: "Silver sneakers", color: "#c8cbcf", link: "https://asics.com" },
    ],
    votes: { yes: 24, no: 3 },
    likes: 24,
    hasLiked: false,
    userVote: null,
    superReactions: { "🎧": 5, "💍": 2, "🍦": 1, "💖": 12, "🧁": 3, "🎀": 8 },
    comments: 1,
    commentsList: [
      { id: "c3", author: "Sofoniyas", initial: "S", time: "20m ago", text: "Big fan of the color blocking. Red + faded denim is timeless." },
    ],
  },
];

export const wardrobeOutfits = [
  {
    id: "uni-1",
    title: "University Outfit 1",
    category: "Campus",
    image: "./assets/wardrobe/outfit_uni1.png",
    pieces: ["Cropped knit sweater", "Straight stone wash denim", "Nike Air Force 1", "Dsquared2 bag", "Y2K shades"],
    status: "Saved",
    date: "Sep 24",
    vibe: "Casual streetwear",
  },
  {
    id: "concert-1",
    title: "Concert Outfit 1",
    category: "Night Out",
    image: "./assets/wardrobe/outfit_concert1.png",
    pieces: ["Ribbed sage polo top", "Tartan wide flare trousers", "Platform leather boots", "Glossy patent shoulder bag"],
    status: "Worn",
    date: "Sep 18",
    vibe: "Indie sleek",
  },
  {
    id: "uni-2",
    title: "University Outfit 2",
    category: "Campus",
    image: "./assets/wardrobe/outfit_uni2.png",
    pieces: ["Oversized camel blazer", "Anine Bing collegiate hoodie", "Light wash denim", "CDG Play high Converse", "Mini structured duffel"],
    status: "Saved",
    date: "Sep 12",
    vibe: "High-low casual",
  },
  {
    id: "friends-1",
    title: "Friends Outing 1",
    category: "Weekend",
    image: "./assets/wardrobe/outfit_friends1.png",
    pieces: ["Vintage band graphic tee", "Ripped charcoal denim", "Old Skool low sneakers", "Kånken canvas backpack", "Grommet belt"],
    status: "Live",
    date: "Today",
    vibe: "Grunge revival",
  },
  {
    id: "chic-3",
    title: "Cottage Brunch Look",
    category: "Weekend",
    image: "./assets/wardrobe/outfit_chic3.png",
    pieces: ["Floral slip dress", "Chunky taupe cropped cardigan", "Delicate crescent bag", "Woven ballet flats"],
    status: "Saved",
    date: "Aug 29",
    vibe: "Soft feminine",
  },
  {
    id: "cozy-4",
    title: "Oversized Loungewear",
    category: "Everyday",
    image: "./assets/wardrobe/outfit_cozy4.png",
    pieces: ["Slate blue boxy crewneck", "Contrast stitch carpenter pants", "Padded slip-on mules"],
    status: "In cart",
    date: "Aug 22",
    vibe: "Relaxed minimal",
  },
];

export const history = [
  { name: "Friends Outing 1", status: "Live", date: "Today", pieces: "Band tee · Charcoal denim" },
  { name: "University Outfit 1", status: "Saved", date: "Sep 24", pieces: "Cropped knit · Stone wash" },
  { name: "Concert Outfit 1", status: "Worn", date: "Sep 18", pieces: "Sage polo · Tartan flare" },
  { name: "University Outfit 2", status: "Saved", date: "Sep 12", pieces: "Camel blazer · Anine Bing" },
  { name: "Black overshirt edit", status: "Saved", date: "Sep 04", pieces: "Structured wool · Pleated navy" },
];

export const messagesData = [
  {
    id: "dm-maya",
    isGroup: false,
    title: "Maya Chen",
    handle: "@mayamakesfits",
    initial: "MC",
    avatar: "./assets/feed/maya_fit.png",
    unread: 0,
    lastMessage: "Thanks for the feedback on the denim fit!",
    time: "1h ago",
    messages: [
      {
        id: "dm1",
        sender: "Sofoniyas",
        initial: "S",
        time: "10:15 AM",
        text: "Hey Maya! That wide-leg red trouser pairing is insane. Where did you find them?",
      },
      {
        id: "dm2",
        sender: "Maya Chen",
        initial: "MC",
        time: "10:30 AM",
        text: "Hey!! Got them from SSENSE during the seasonal private sale. Linking you now!",
      },
      {
        id: "dm3",
        sender: "Maya Chen",
        initial: "MC",
        time: "10:31 AM",
        text: "Thanks for the feedback on the denim fit!",
      },
    ],
  },
];

export const sampleVisualSearchItems = [
  {
    title: "Oversized Vintage Washed Denim Jacket",
    brand: "Acne Studios / Zara Alternative",
    price: "$89.90",
    originalPrice: "$129.00",
    matchConfidence: "98% Visual Match",
    retailer: "Nordstrom / Zara",
    status: "On Sale (-30%)",
    url: "https://zara.com",
    image: "./assets/feed/maya_fit.png",
  },
  {
    title: "Pleated Wide-Leg Fluid Trousers in Carmine Red",
    brand: "COS / Reformation",
    price: "$135.00",
    originalPrice: "$150.00",
    matchConfidence: "95% Visual Match",
    retailer: "SSENSE",
    status: "Few pieces left",
    url: "https://ssense.com",
    image: "./assets/wardrobe/outfit_concert1.png",
  },
  {
    title: "Retro Low-Top Metallic Silver Runners",
    brand: "Onitsuka Tiger / ASICS",
    price: "$110.00",
    originalPrice: "$110.00",
    matchConfidence: "94% Visual Match",
    retailer: "ASICS Official",
    status: "In Stock",
    url: "https://asics.com",
    image: "./assets/wardrobe/outfit_uni1.png",
  },
];

export const brandIcons = [
  { id: "logo-star", label: "Outfitted Wordmark with Star", path: "./assets/branding/logo_star.png" },
  { id: "icon-circle", label: "Monogram Badge OF", path: "./assets/branding/icon_circle_of.png" },
  { id: "icon-hanger", label: "Cobalt Blue Coat Hanger", path: "./assets/branding/icon_hanger.png" },
  { id: "icon-ligature", label: "Editorial OF Ligature", path: "./assets/branding/icon_of_ligature.png" },
  { id: "icon-arch", label: "Archway Blazer Icon", path: "./assets/branding/icon_blazer_arch.png" },
  { id: "icon-cube", label: "3D Wireframe Cube Hanger", path: "./assets/branding/icon_cube_hanger.png" },
  { id: "icon-chat", label: "Chat Bubbles Social Hanger", path: "./assets/branding/icon_chat_hanger.png" },
];

export const fitPassport = {
  measurements: [
    { label: "Height", value: "172 cm" },
    { label: "Chest", value: "92 cm" },
    { label: "Waist", value: "76 cm" },
    { label: "Hips", value: "98 cm" },
    { label: "Inseam", value: "80 cm" },
  ],
  sizes: [
    { label: "Tops", value: "M / L" },
    { label: "Bottoms", value: "30 / 32" },
    { label: "Fit pref.", value: "Relaxed Boxy" },
  ],
  sharing: [
    { id: "measurements", label: "Measurements", on: true },
    { id: "avatar", label: "3D avatar", on: true },
    { id: "photos", label: "Original photos", on: false },
  ],
};

export const partnerProduct = {
  store: "Northline Athletics",
  name: "Raglan Run Tee",
  price: "$38",
  color: "Lagoon teal",
  swatch: "#2bb3c7",
  sizes: ["XS", "S", "M", "L", "XL"],
  model: "./assets/raglan-tee.glb",
  fit: {
    XS: { verdict: "Too tight", chest: "Tight", length: "Short", shoulders: "Tight" },
    S: { verdict: "Snug fit", chest: "Fitted", length: "Regular", shoulders: "Snug" },
    M: { verdict: "Best fit", chest: "Relaxed", length: "Regular", shoulders: "True to size" },
    L: { verdict: "Roomy", chest: "Loose", length: "Long", shoulders: "Dropped" },
    XL: { verdict: "Oversized", chest: "Very loose", length: "Long", shoulders: "Dropped" },
  },
  recommended: "M",
  photoTryOn: {
    before: "./assets/tryon-2d/before.jpg",
    after: "./assets/tryon-2d/after.jpg",
    isPlaceholder: false,
  },
  drape: {
    anchor: [0, 63, 0.05],
    target: [0, 1.365, -0.07],
    scale: 0.023,
    stretch: [1, 0.9, 1.15],
    sizeScale: { XS: 0.86, S: 0.93, M: 1, L: 1.08, XL: 1.17 },
  },
};
