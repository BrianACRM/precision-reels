const contactEmail = window.PRECISION_CONFIG?.contactEmail || "brandon@precisionreels.com";
const supabaseClient = window.precisionSupabase;
const supabaseConfig = window.PRECISION_CONFIG || {};

const fallbackProducts = [
  {
    id: "demo-pgm-2017",
    images: ["./assets/pgm22-field-1.jpg", "./assets/pgm22.png", "./assets/pgm22-field-2.jpg"],
    year: "2017",
    model: "Jacobsen PGM22 Walk Reel",
    price: "$4,850.00",
    note: "22 inch walk-behind reel mower example. Pickup or freight quote confirmed with seller.",
    stock_number: "JM-017",
    status: "Available"
  },
  {
    id: "demo-eclipse-2020",
    images: ["./assets/eclipse-2-field.jpg", "./assets/eclipse-2.png"],
    year: "2020",
    model: "Jacobsen Eclipse 2",
    price: "$3,950.00",
    note: "Battery walk mower example with room for condition notes and accessories.",
    stock_number: "JM-020",
    status: "Available"
  },
  {
    id: "demo-pgm-2019",
    images: ["./assets/pgm22-field-2.jpg", "./assets/pgm22-field-1.jpg"],
    year: "2019",
    model: "Jacobsen PGM 22 Walk Reel",
    price: "$3,650.00",
    note: "Walk-behind reel mower example with room for blade count and accessories.",
    stock_number: "JM-019",
    status: "Available"
  },
  {
    id: "demo-pgm-2018",
    images: ["./assets/pgm22.png", "./assets/pgm22-field-1.jpg"],
    year: "2018",
    model: "Jacobsen PGM22 Walk Reel",
    price: "$5,250.00",
    note: "Placeholder listing for seller-uploaded photos and condition notes.",
    stock_number: "JM-018",
    status: "Pending"
  }
];

const inventoryGrid = document.querySelector(".inventory-grid");
const detailPanel = document.querySelector("#details");
const detailImage = document.querySelector("#detailImage");
const detailTitle = document.querySelector("#detailTitle");
const detailPrice = document.querySelector("#detailPrice");
const detailSpecs = document.querySelector("#detailSpecs");
const detailMessage = document.querySelector("#detailMessage");
const emailAction = document.querySelector("#emailAction");
const detailThumbs = Array.from(document.querySelectorAll(".detail-thumb"));

let products = fallbackProducts;

initInventory();

async function initInventory() {
  if (window.PRECISION_SUPABASE_READY) {
    const liveListings = await fetchLiveListings();
    if (liveListings.length) products = liveListings;
  }

  renderInventory(products);
}

async function fetchLiveListings() {
  const { data, error } = await supabaseClient
    .from("listings")
    .select("*, listing_images(*)")
    .in("status", ["Available", "Pending"])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.warn(error.message);
    return [];
  }

  return data.map((listing) => ({
    ...listing,
    images: (listing.listing_images || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => publicImageUrl(image.path))
  }));
}

function publicImageUrl(path) {
  if (!path) return "./assets/pgm22.png";
  if (path.startsWith("./") || path.startsWith("assets/") || path.startsWith("http")) return path;
  return supabaseClient.storage.from(supabaseConfig.imageBucket).getPublicUrl(path).data.publicUrl;
}

function renderInventory(items) {
  if (!inventoryGrid) return;

  inventoryGrid.innerHTML = items
    .map((item, index) => {
      const image = item.images?.[0] || "./assets/pgm22.png";
      const title = listingTitle(item);
      const stock = item.stock_number ? `<span class="card-stock">${escapeHtml(item.stock_number)}</span>` : "";
      return `
        <article class="inventory-card" tabindex="0" data-index="${index}">
          <div class="photo-box">
            <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="${index < 2 ? "eager" : "lazy"}" />
          </div>
          ${stock}
          <h2>${escapeHtml(title)}</h2>
          <p class="price">${escapeHtml(item.price)}</p>
          <p class="card-note">${escapeHtml(item.note)}</p>
          <button type="button">Inquire to buy</button>
        </article>
      `;
    })
    .join("");

  inventoryGrid.querySelectorAll(".inventory-card").forEach((card) => {
    card.addEventListener("click", () => openProduct(products[Number(card.dataset.index)]));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProduct(products[Number(card.dataset.index)]);
      }
    });
  });
}

function openProduct(product) {
  if (!product || !detailPanel) return;

  const images = product.images?.length ? product.images : ["./assets/pgm22.png"];
  const title = listingTitle(product);
  detailImage.src = images[0];
  detailImage.alt = title;
  detailTitle.textContent = title;
  detailPrice.textContent = product.price;
  detailMessage.value = `I am interested in ${title}${product.stock_number ? `, stock ${product.stock_number}` : ""}.`;
  emailAction.href = inquiryHref(product);
  detailSpecs.innerHTML = [
    ["Stock #", product.stock_number || "Contact Precision Reels"],
    ["Status", product.status || "Available"],
    ["Year", product.year],
    ["Model", product.model],
    ["Notes", product.note]
  ]
    .map(([term, value]) => `<div><dt>${escapeHtml(term)}:</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");

  detailThumbs.forEach((button, index) => {
    const image = button.querySelector("img");
    const src = images[index] || images[0];
    image.src = src;
    image.alt = title;
    button.classList.toggle("is-active", index === 0);
    button.onclick = () => {
      detailImage.src = src;
      detailThumbs.forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
    };
  });

  detailPanel.classList.add("is-open");
  detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function inquiryHref(product) {
  const title = listingTitle(product);
  const subject = `Mower inquiry: ${title}${product.stock_number ? ` (${product.stock_number})` : ""}`;
  const body = [
    `I am interested in ${title}.`,
    product.stock_number ? `Stock #: ${product.stock_number}` : "",
    "",
    "Name:",
    "Phone or email:"
  ]
    .filter(Boolean)
    .join("\n");
  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function listingTitle(product) {
  return `${product.year} ${product.model}`.trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector(".close-detail")?.addEventListener("click", () => {
  detailPanel.classList.remove("is-open");
});
