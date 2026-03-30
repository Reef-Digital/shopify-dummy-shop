#!/usr/bin/env node
/**
 * Generate 200 realistic surf shop products in Shopify CSV format.
 * Run: node scripts/generate-products.js > products.csv
 */

const HEADER = [
  "Title","URL handle","Description","Vendor","Product category","Type","Tags",
  "Published on online store","Status","SKU","Barcode","Option1 name","Option1 value",
  "Option1 Linked To","Option2 name","Option2 value","Option2 Linked To","Option3 name",
  "Option3 value","Option3 Linked To","Price","Compare-at price","Cost per item",
  "Charge tax","Tax code","Inventory tracker","Inventory quantity",
  "Continue selling when out of stock","Weight value (grams)","Weight unit for display",
  "Requires shipping","Fulfillment service","Product image URL","Image position",
  "Image alt text","Variant image URL","Gift card","SEO title","SEO description",
  "Color (product.metafields.shopify.color-pattern)",
  "Google Shopping / Google product category","Google Shopping / Gender",
  "Google Shopping / Age group","Google Shopping / Manufacturer part number (MPN)",
  "Google Shopping / Ad group name","Google Shopping / Ads labels",
  "Google Shopping / Condition","Google Shopping / Custom product",
  "Google Shopping / Custom label 0","Google Shopping / Custom label 1",
  "Google Shopping / Custom label 2","Google Shopping / Custom label 3",
  "Google Shopping / Custom label 4"
].join(",");

// Unsplash source URLs — category-specific product photos (free commercial use)
// Using source.unsplash.com which redirects to actual photos matching the search term
const IMAGES = {
  Surfboards: [
    "https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=600&h=600&fit=crop", // surfboards lined up
    "https://images.unsplash.com/photo-1502933691298-84fc14542831?w=600&h=600&fit=crop", // surfboard on beach
    "https://images.unsplash.com/photo-1509914398892-963f53e6e2f1?w=600&h=600&fit=crop", // surfboard close-up
  ],
  Wetsuits: [
    "https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=600&h=600&fit=crop", // surfer in wetsuit
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=600&fit=crop", // person in water wetsuit
  ],
  Fins: [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=600&fit=crop", // surf equipment close-up
    "https://images.unsplash.com/photo-1564415315949-7a0c4c73aab4?w=600&h=600&fit=crop", // surf equipment
  ],
  Leashes: [
    "https://images.unsplash.com/photo-1502933691298-84fc14542831?w=600&h=600&fit=crop", // surfer with board + leash
    "https://images.unsplash.com/photo-1509914398892-963f53e6e2f1?w=600&h=600&fit=crop", // surf accessories
  ],
  "Board Bags": [
    "https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=600&h=600&fit=crop", // travel with surfboard
    "https://images.unsplash.com/photo-1523359346063-d879354c0ea5?w=600&h=600&fit=crop", // surfboard transport
  ],
  "Rash Guards": [
    "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600&h=600&fit=crop", // swimmer/surfer
    "https://images.unsplash.com/photo-1564415315949-7a0c4c73aab4?w=600&h=600&fit=crop", // person in water sports gear
  ],
  Accessories: [
    "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&h=600&fit=crop", // surf accessories/gear
    "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=600&h=600&fit=crop", // beach accessories
    "https://images.unsplash.com/photo-1505459668311-8dfac7952bf0?w=600&h=600&fit=crop", // surf gear
  ],
  Apparel: [
    "https://images.unsplash.com/photo-1523359346063-d879354c0ea5?w=600&h=600&fit=crop", // beach clothing
    "https://images.unsplash.com/photo-1498551172505-8ee7ad69f235?w=600&h=600&fit=crop", // casual beach wear
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop", // outdoor apparel
  ],
};

const COLORS = ["Black","White","Blue","Red","Green","Yellow","Orange","Teal","Navy","Charcoal","Coral","Sunset","Ice Blue","Slate","Forest Green"];

const BRANDS = {
  Surfboards: ["SurfX","WavePro","BoardMaster","RetroWave","AquaCraft","CoastalRide","OceanPulse"],
  Wetsuits: ["WavePro","ThermoGear","DeepBlue","ArcticSurf","FlexNeo","NeptuneFit"],
  Fins: ["FinCraft","TrueWave","FlowFins","AquaEdge"],
  Leashes: ["WavePro","GripMaster","TidalLink","SurfSafe"],
  "Board Bags": ["SurfSafe","CoastalGear","BoardShield","TravelWave"],
  "Rash Guards": ["WaveWear","SunBlock","ReefGuard","CoastalFit"],
  Accessories: ["GripMaster","SurfSafe","FixIt","ReefTech","WaxMaster"],
  Apparel: ["WaveWear","CoastalCo","BeachThreads","SaltLife","ReefStyle"],
};

const PRODUCTS = [
  // SURFBOARDS (40 products)
  ...generate("Surfboards", [
    { name: "Classic Longboard", desc: "Traditional 9'0 single-fin longboard for smooth, graceful rides. Perfect for small to medium waves.", level: "beginner", weight: 8500, priceRange: [399, 699] },
    { name: "Performance Shortboard", desc: "High-performance shortboard with a narrow tail and aggressive rocker for advanced wave riding.", level: "advanced", weight: 3200, priceRange: [449, 799] },
    { name: "Mini Malibu", desc: "Versatile mid-length board combining longboard stability with shortboard maneuverability.", level: "intermediate", weight: 5500, priceRange: [349, 549] },
    { name: "Fish Surfboard", desc: "Wide, flat fish shape for maximum speed in small to medium waves. Great for fun sessions.", level: "intermediate", weight: 3800, priceRange: [299, 499] },
    { name: "Soft-Top Foamie", desc: "Soft foam construction for safe learning. Ideal for beginners and surf schools.", level: "beginner", weight: 4200, priceRange: [149, 299] },
    { name: "Gun Surfboard", desc: "Narrow, pointed board designed for big wave surfing. Built for speed and control in overhead conditions.", level: "expert", weight: 4500, priceRange: [599, 899] },
    { name: "Hybrid Surfboard", desc: "Blends shortboard and fish design for versatile performance across all conditions.", level: "intermediate", weight: 3600, priceRange: [379, 599] },
    { name: "Retro Twin Fin", desc: "Classic twin-fin design for loose, skatey surfing with modern construction.", level: "intermediate", weight: 3400, priceRange: [349, 549] },
    { name: "Step-Up Board", desc: "Extra volume shortboard for bigger days when your regular board feels too small.", level: "advanced", weight: 3900, priceRange: [449, 699] },
    { name: "Grom Board", desc: "Scaled-down performance board for young surfers aged 8-14. Lightweight and responsive.", level: "beginner", weight: 2200, priceRange: [199, 349] },
  ], 40),

  // WETSUITS (35 products)
  ...generate("Wetsuits", [
    { name: "3/2mm Full Wetsuit", desc: "Versatile full-body wetsuit for spring and autumn sessions. Flexible neoprene with sealed seams.", level: "all", weight: 1800, priceRange: [149, 329] },
    { name: "4/3mm Winter Wetsuit", desc: "Heavyweight winter wetsuit with thermal lining for cold water surfing down to 8°C.", level: "all", weight: 2200, priceRange: [229, 449] },
    { name: "2mm Shorty Wetsuit", desc: "Short-sleeve, short-leg wetsuit for warm summer sessions. Maximum flexibility.", level: "all", weight: 900, priceRange: [79, 179] },
    { name: "5/4mm Hooded Wetsuit", desc: "Maximum warmth with integrated hood for extreme cold. Triple-glued blind-stitched seams.", level: "all", weight: 2800, priceRange: [349, 549] },
    { name: "Kids Full Wetsuit", desc: "Durable and easy-to-wear wetsuit designed specifically for young surfers. Back zip entry.", level: "beginner", weight: 1200, priceRange: [69, 149] },
    { name: "Spring Suit", desc: "Long-sleeve short-leg suit for transitional water temperatures. Great for 16-20°C.", level: "all", weight: 1100, priceRange: [99, 199] },
    { name: "Wetsuit Vest", desc: "Neoprene vest for core warmth without restricting arm movement. Layer under or wear solo.", level: "all", weight: 400, priceRange: [39, 89] },
  ], 35),

  // FINS (20 products)
  ...generate("Fins", [
    { name: "Thruster Fin Set", desc: "Three-fin setup for maximum control and drive. FCS II compatible. Medium flex.", level: "all", weight: 350, priceRange: [49, 119] },
    { name: "Single Fin", desc: "Classic single fin for longboards. Provides smooth, flowing turns and noseride stability.", level: "all", weight: 200, priceRange: [29, 79] },
    { name: "Quad Fin Set", desc: "Four-fin setup for speed and hold in hollow waves. FCS or Futures compatible.", level: "intermediate", weight: 400, priceRange: [59, 139] },
    { name: "Twin Fin Set", desc: "Retro twin fins for a loose, skatey feel. Ideal for fish and retro boards.", level: "intermediate", weight: 280, priceRange: [39, 99] },
    { name: "Performance Fin Set", desc: "Competition-grade carbon fiber fins for maximum responsiveness and speed.", level: "advanced", weight: 300, priceRange: [89, 189] },
  ], 20),

  // LEASHES (15 products)
  ...generate("Leashes", [
    { name: "6ft Comp Leash", desc: "Lightweight competition leash for shortboards. Minimal drag, maximum strength.", level: "all", weight: 120, priceRange: [24, 44] },
    { name: "8ft Regular Leash", desc: "Standard leash for funboards and mini malibus. Double swivel to prevent tangling.", level: "all", weight: 150, priceRange: [19, 39] },
    { name: "9ft Longboard Leash", desc: "Extra-long leash for longboards with calf attachment option. Heavy-duty urethane cord.", level: "all", weight: 180, priceRange: [24, 49] },
    { name: "10ft Big Wave Leash", desc: "Heavy-duty leash for big wave surfing. Extra thick cord rated to 250lbs.", level: "expert", weight: 250, priceRange: [39, 69] },
    { name: "Coiled SUP Leash", desc: "Coiled leash for stand-up paddleboards. Stays out of the water when paddling.", level: "all", weight: 200, priceRange: [29, 54] },
  ], 15),

  // BOARD BAGS (15 products)
  ...generate("Board Bags", [
    { name: "Day Use Board Bag", desc: "Lightweight padded bag for daily transport. Protects against UV and minor impacts.", level: "all", weight: 800, priceRange: [39, 79] },
    { name: "Travel Board Bag", desc: "Heavy-duty padded bag for air travel. Fits 2-3 boards with internal dividers.", level: "all", weight: 2500, priceRange: [129, 249] },
    { name: "Longboard Sock", desc: "Stretchy knit cover for longboards. Basic protection against scratches and dust.", level: "all", weight: 400, priceRange: [29, 54] },
    { name: "Coffin Board Bag", desc: "Multi-board travel bag fits up to 4 boards. Wheeled for easy airport transport.", level: "all", weight: 3500, priceRange: [199, 349] },
    { name: "Shortboard Day Bag", desc: "Compact padded bag for shortboards with wax pocket and shoulder strap.", level: "all", weight: 600, priceRange: [34, 69] },
  ], 15),

  // RASH GUARDS (20 products)
  ...generate("Rash Guards", [
    { name: "Short Sleeve Rash Guard", desc: "UPF 50+ sun protection with quick-dry fabric. Flatlock seams prevent chafing.", level: "all", weight: 180, priceRange: [29, 59] },
    { name: "Long Sleeve Rash Guard", desc: "Full arm coverage with UPF 50+ protection. Ideal for tropical surf and sun exposure.", level: "all", weight: 220, priceRange: [34, 69] },
    { name: "Kids Rash Guard", desc: "Colorful sun protection for young surfers. Stretchy, comfortable fit for all-day wear.", level: "beginner", weight: 120, priceRange: [19, 39] },
    { name: "Hooded Rash Guard", desc: "Rash guard with integrated hood for extra sun and wind protection.", level: "all", weight: 250, priceRange: [44, 79] },
  ], 20),

  // ACCESSORIES (25 products)
  ...generate("Accessories", [
    { name: "Surfboard Wax", desc: "Temperature-specific surf wax for optimal grip. Available in tropical, warm, cool, and cold formulas.", level: "all", weight: 85, priceRange: [4, 9] },
    { name: "Wax Comb", desc: "Dual-sided wax comb for texturing and removing old wax. Built-in fin key.", level: "all", weight: 30, priceRange: [3, 8] },
    { name: "Surfboard Repair Kit", desc: "Complete ding repair kit with resin, hardener, cloth, and sandpaper. Fixes cracks and holes.", level: "all", weight: 350, priceRange: [14, 34] },
    { name: "Roof Rack Pads", desc: "Soft foam pads for transporting boards on your car roof. Universal fit with tie-down straps.", level: "all", weight: 600, priceRange: [24, 54] },
    { name: "Changing Mat", desc: "Waterproof mat for changing at the beach. Doubles as a wetsuit bag to keep your car dry.", level: "all", weight: 300, priceRange: [19, 39] },
    { name: "Surf Ear Plugs", desc: "Medical-grade silicone ear plugs that block water but let sound through. Prevents surfer's ear.", level: "all", weight: 15, priceRange: [24, 44] },
    { name: "Waterproof Phone Pouch", desc: "IPX8-rated waterproof case for phones. Clear touchscreen compatible. Lanyard included.", level: "all", weight: 45, priceRange: [14, 29] },
    { name: "Surf Watch", desc: "Tide and swell tracking watch with GPS. Water resistant to 100m. Sunrise/sunset alerts.", level: "all", weight: 55, priceRange: [149, 349] },
  ], 25),

  // APPAREL (30 products)
  ...generate("Apparel", [
    { name: "Board Shorts", desc: "Quick-dry stretch board shorts with secure pocket. 4-way stretch for unrestricted movement.", level: "all", weight: 200, priceRange: [34, 69] },
    { name: "Surf T-Shirt", desc: "Organic cotton tee with surf-inspired graphic print. Relaxed fit for casual comfort.", level: "all", weight: 180, priceRange: [24, 44] },
    { name: "Beach Hoodie", desc: "Lightweight hoodie for post-surf warmth. Kangaroo pocket and drawstring hood.", level: "all", weight: 400, priceRange: [49, 89] },
    { name: "Surf Cap", desc: "Performance surf cap with chin strap. UPF 50+ protection and quick-dry fabric.", level: "all", weight: 80, priceRange: [19, 39] },
    { name: "Bikini Top", desc: "Sporty bikini top designed for active water sports. Secure fit with adjustable straps.", level: "all", weight: 100, priceRange: [29, 54] },
    { name: "Surf Poncho", desc: "Oversized towel poncho for easy beach changing. Terry cotton with hood.", level: "all", weight: 600, priceRange: [39, 79] },
    { name: "Flip Flops", desc: "Comfortable reef-safe sandals with arch support. Non-slip sole for wet surfaces.", level: "all", weight: 250, priceRange: [19, 44] },
    { name: "Waterproof Jacket", desc: "Lightweight windbreaker for coastal conditions. Packable with waterproof zippers.", level: "all", weight: 350, priceRange: [69, 149] },
    { name: "Surf Beanie", desc: "Warm merino wool beanie for cold morning sessions. Quick-dry and odor resistant.", level: "all", weight: 60, priceRange: [19, 34] },
    { name: "Reef Booties", desc: "Neoprene booties for reef protection and cold water. Split-toe design for board feel.", level: "all", weight: 300, priceRange: [29, 64] },
  ], 30),
];

function generate(type, templates, count) {
  const products = [];
  const brands = BRANDS[type] || BRANDS.Accessories;
  const images = IMAGES[type] || IMAGES.Accessories;
  const genders = ["Unisex","Male","Female"];
  const ages = ["Adult","Adult","Adult","Kids"];
  const catPath = "Sporting Goods > Outdoor Recreation > Boating & Water Sports > Surfing";

  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    const brand = brands[i % brands.length];
    const color = COLORS[i % COLORS.length];
    const gender = type === "Wetsuits" || type === "Rash Guards" || type === "Apparel"
      ? genders[i % genders.length] : "";
    const age = ages[i % ages.length];
    const imgUrl = images[i % images.length];
    const price = (t.priceRange[0] + Math.random() * (t.priceRange[1] - t.priceRange[0])).toFixed(2);
    const comparePrice = Math.random() > 0.7 ? (parseFloat(price) * 1.2).toFixed(2) : "";
    const sku = `product_${products.length + 1}`;
    const num = products.length + 1;
    const title = `${t.name}${gender === "Male" ? " - Men's" : gender === "Female" ? " - Women's" : age === "Kids" ? " - Kids" : ""} ${color}`;
    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

    const levelTags = t.level === "all" ? "all-levels" : t.level;
    const genderTag = gender ? gender.toLowerCase() : "unisex";
    const tags = `${type.toLowerCase().replace(/ /g,"-")},surfing,ocean,${levelTags},${genderTag},${color.toLowerCase()},${age.toLowerCase()}`;

    products.push({
      title, handle, desc: t.desc, brand, catPath, type, tags,
      sku, price, comparePrice, weight: t.weight, imgUrl, color, gender, age, num,
    });
  }
  return products;
}

// Output CSV
console.log(HEADER);
for (const p of PRODUCTS) {
  const q = (s) => {
    const v = String(s ?? "");
    return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;
  };
  // Option1 = Color (Shopify-compliant product option)
  // Option2 = Gender (for wetsuits, rash guards, apparel)
  const opt1Name = "Color";
  const opt1Value = p.color;
  const opt2Name = p.gender ? "Gender" : "";
  const opt2Value = p.gender || "";
  const row = [
    q(p.title), q(p.handle), q(p.desc), q(p.brand), q(p.catPath), q(p.type), q(p.tags),
    "TRUE", "Active", p.sku, "", q(opt1Name), q(opt1Value), "", q(opt2Name), q(opt2Value), "", "", "", "",
    p.price, p.comparePrice, "", "TRUE", "", "shopify", Math.floor(Math.random() * 20 + 5), "DENY",
    p.weight, "g", "TRUE", "manual", p.imgUrl, "1", q(p.title), "", "FALSE",
    q(p.title), q(p.desc), "",
    q(p.catPath), q(p.gender), q(p.age), "", "", "", "new", "FALSE", "", "", "", "", "",
  ].join(",");
  console.log(row);
}

process.stderr.write(`Generated ${PRODUCTS.length} products\n`);
