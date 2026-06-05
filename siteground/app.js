const listings = window.PRECISION_LISTINGS || [];
const detailPanel = document.querySelector("#details");
const detailGallery = document.querySelector("#detailGallery");
const detailImage = document.querySelector("#detailImage");
const detailTitle = document.querySelector("#detailTitle");
const detailPrice = document.querySelector("#detailPrice");
const detailSpecs = document.querySelector("#detailSpecs");
const detailMessage = document.querySelector("#detailMessage");
const listingIdInput = document.querySelector("#listingId");

function openListing(id) {
  const listing = listings.find((item) => String(item.id) === String(id));
  if (!listing || !detailPanel) return;

  const images = listing.images.length ? listing.images : ["/assets/pgm22.png"];
  detailGallery.innerHTML = images
    .map((src, index) => `<button class="detail-thumb ${index === 0 ? "is-active" : ""}" type="button"><img src="${src}" alt="${listing.title}"></button>`)
    .join("");
  detailImage.src = images[0];
  detailImage.alt = listing.title;
  detailTitle.textContent = listing.title;
  detailPrice.textContent = listing.price;
  detailMessage.value = `I am interested in stock ${listing.stock}, ${listing.title}.`;
  listingIdInput.value = listing.id;
  detailSpecs.innerHTML = `
    <div><dt>Stock #:</dt><dd>${listing.stock}</dd></div>
    <div><dt>Status:</dt><dd>${listing.status}</dd></div>
    <div><dt>Notes:</dt><dd>${listing.note}</dd></div>
  `;

  detailGallery.querySelectorAll(".detail-thumb").forEach((button, index) => {
    button.addEventListener("click", () => {
      detailGallery.querySelectorAll(".detail-thumb").forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
      detailImage.src = images[index];
    });
  });

  detailPanel.classList.add("is-open");
  detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("[data-listing-id]").forEach((card) => {
  card.addEventListener("click", () => openListing(card.dataset.listingId));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openListing(card.dataset.listingId);
    }
  });
});

document.querySelector(".close-detail")?.addEventListener("click", () => {
  detailPanel.classList.remove("is-open");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}
