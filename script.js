const supabaseConfig = window.PRECISION_SUPABASE || {};
const contactEmail = supabaseConfig.contactEmail || "brandon@precisionreels.com";

const fallbackProducts = [];

const inventoryGrid = document.querySelector(".inventory-grid");
const detailPanel = document.querySelector("#details");
const detailImage = document.querySelector("#detailImage");
const detailTitle = document.querySelector("#detailTitle");
const detailPrice = document.querySelector("#detailPrice");
const detailSpecs = document.querySelector("#detailSpecs");
const detailMessage = document.querySelector("#detailMessage");
const emailAction = document.querySelector("#emailAction");
const detailGallery = document.querySelector("#detailGallery");

let products = fallbackProducts;

initInventory();

async function initInventory() {
  if (supabaseConfig.url && supabaseConfig.anonKey) {
    const liveListings = await fetchLiveListings();
    products = liveListings;
  }

  renderInventory(products);
  injectInventoryStructuredData(products);
}

async function fetchLiveListings() {
  const endpoint = new URL(`${supabaseConfig.url}/rest/v1/listings`);
  endpoint.searchParams.set("select", "*,listing_images(*)");
  endpoint.searchParams.set("status", "in.(Available,Pending)");
  endpoint.searchParams.set("order", "sort_order.asc,created_at.desc");

  const response = await fetch(endpoint, {
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${supabaseConfig.anonKey}`
    }
  });

  if (!response.ok) {
    console.warn(`Inventory request failed: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return data.map((listing) => ({
    ...listing,
    images: (listing.listing_images || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => imageUrls(image.path))
  }));
}

function imageUrls(path) {
  return {
    card: publicImageUrl(path, { width: 560, height: 560, quality: 72 }),
    thumb: publicImageUrl(path, { width: 180, height: 180, quality: 68 }),
    detail: publicImageUrl(path, { width: 1200, height: 1200, quality: 82 }),
    full: publicImageUrl(path)
  };
}

function publicImageUrl(path, transform) {
  if (!path) return "";
  if (path.startsWith("./") || path.startsWith("assets/") || path.startsWith("http")) return path;
  const safePath = String(path).split("/").map(encodeURIComponent).join("/");
  const bucket = encodeURIComponent(supabaseConfig.imageBucket);
  if (!transform) return `${supabaseConfig.url}/storage/v1/object/public/${bucket}/${safePath}`;

  const params = new URLSearchParams({
    width: String(transform.width),
    height: String(transform.height),
    quality: String(transform.quality),
    resize: "contain"
  });
  return `${supabaseConfig.url}/storage/v1/render/image/public/${bucket}/${safePath}?${params}`;
}

function renderInventory(items) {
  if (!inventoryGrid) return;

  inventoryGrid.classList.remove("is-loading");
  if (!items.length) {
    inventoryGrid.innerHTML = `<p class="inventory-status">No inventory is listed right now.</p>`;
    return;
  }

  inventoryGrid.innerHTML = items
    .map((item, index) => {
      const image = item.images?.[0]?.card;
      const title = listingTitle(item);
      return `
        <article class="inventory-card" tabindex="0" data-index="${index}">
          <div class="photo-box">
            ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="${index < 2 ? "eager" : "lazy"}" decoding="async" fetchpriority="${index === 0 ? "high" : "auto"}" />` : `<span class="no-photo">No photos yet</span>`}
          </div>
          <h2>${escapeHtml(item.make || "Jacobsen")}</h2>
          <dl class="card-fields">
            <div><dt>Model</dt><dd>${escapeHtml(item.model)}</dd></div>
            <div><dt>Year</dt><dd>${escapeHtml(item.year)}</dd></div>
            <div><dt>Price</dt><dd>${escapeHtml(formatPrice(item.price))}</dd></div>
            <div><dt>Specs</dt><dd>${escapeHtml(item.specs || item.note)}</dd></div>
            <div><dt>Stock #</dt><dd>${escapeHtml(item.stock_number || "Contact")}</dd></div>
          </dl>
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

  const images = product.images?.filter((image) => image?.detail) || [];
  const title = listingTitle(product);
  if (images[0]) {
    detailImage.src = images[0].detail;
    detailImage.hidden = false;
    detailImage.parentElement.classList.remove("has-no-image");
  } else {
    detailImage.removeAttribute("src");
    detailImage.hidden = true;
    detailImage.parentElement.classList.add("has-no-image");
  }
  detailImage.alt = title;
  detailTitle.textContent = title;
  detailPrice.textContent = formatPrice(product.price);
  detailMessage.value = `I am interested in ${title}${product.stock_number ? `, stock ${product.stock_number}` : ""}.`;
  emailAction.href = inquiryHref(product);
  detailSpecs.innerHTML = [
    ["Make", product.make || "Jacobsen"],
    ["Model", product.model],
    ["Year", product.year],
    ["Price", formatPrice(product.price)],
    ["Specs", product.specs || product.note],
    ["Stock #", product.stock_number || "Contact Precision Reels"]
  ]
    .map(([term, value]) => `<div><dt>${escapeHtml(term)}:</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");

  renderDetailGallery(images, title);

  detailPanel.classList.add("is-open");
  detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderDetailGallery(images, title) {
  if (!detailGallery) return;
  if (!images.length) {
    detailGallery.innerHTML = `<span class="no-photo detail-no-photo">No photos yet</span>`;
    return;
  }

  detailGallery.innerHTML = images
    .map(
      (image, index) => `
        <button class="detail-thumb${index === 0 ? " is-active" : ""}" type="button" data-image-index="${index}">
          <img src="${escapeHtml(image.thumb)}" alt="${escapeHtml(title)} photo ${index + 1}" loading="lazy" decoding="async" />
        </button>
      `
    )
    .join("");

  detailGallery.querySelectorAll(".detail-thumb").forEach((button) => {
    button.addEventListener("click", () => {
      const src = images[Number(button.dataset.imageIndex)] || images[0];
      detailImage.src = src.detail;
      detailGallery.querySelectorAll(".detail-thumb").forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });
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

function injectInventoryStructuredData(items) {
  const existing = document.querySelector("#inventoryStructuredData");
  existing?.remove();
  if (!items.length) return;

  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Used walk-behind greens mower inventory",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: listingTitle(item),
        brand: {
          "@type": "Brand",
          name: item.make || "Jacobsen"
        },
        category: "Used walk-behind greens mower",
        sku: item.stock_number || undefined,
        image: item.images?.[0]?.full || item.images?.[0]?.detail || undefined,
        description: item.specs || item.note || "Used walk-behind greens mower available from Precision Reels.",
        offers: {
          "@type": "Offer",
          price: numericPrice(item.price),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://precisionreels.com/"
        }
      }
    }))
  };

  const script = document.createElement("script");
  script.id = "inventoryStructuredData";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function numericPrice(value = "") {
  const number = String(value).replace(/[^\d.]/g, "");
  return number || undefined;
}

function listingTitle(product) {
  return `${product.make || "Jacobsen"} ${product.model} ${product.year}`.trim();
}

function formatPrice(value = "") {
  const clean = String(value).trim();
  if (!clean) return "Contact Precision Reels";
  return clean.startsWith("$") ? clean : `$${clean}`;
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
