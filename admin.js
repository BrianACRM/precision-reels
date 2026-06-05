const sampleListings = [];

const client = window.precisionSupabase;
const config = window.PRECISION_CONFIG || {};
const loginShell = document.querySelector("#loginShell");
const adminShell = document.querySelector("#adminShell");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const form = document.querySelector("#listingForm");
const grid = document.querySelector("#adminGrid");
const template = document.querySelector("#listingTemplate");
const count = document.querySelector("#listingCount");
const imageInput = document.querySelector("#imageInput");
const imagePreview = document.querySelector("#imagePreview");
const imagePrompt = document.querySelector("#imagePrompt");
const imageStrip = document.querySelector("#imageStrip");
const dialog = document.querySelector("#listingDialog");
const dialogGallery = document.querySelector("#dialogGallery");
const dialogMainImage = document.querySelector("#dialogMainImage");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogFields = document.querySelector("#dialogFields");
const editListingButton = document.querySelector("#editListingButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const submitListingButton = document.querySelector("#submitListingButton");
const formModeLabel = document.querySelector("#formModeLabel");

let listings = [];
let uploadedFiles = [];
let activeListing = null;
let editingId = null;

init();

async function init() {
  if (!window.PRECISION_SUPABASE_READY) {
    loginShell.hidden = true;
    adminShell.hidden = false;
    listings = sampleListings;
    renderListings();
    showConfigWarning();
    return;
  }

  const { data } = await client.auth.getSession();
  setAuthState(Boolean(data.session));
  if (data.session) await loadListings();
}

function setAuthState(isLoggedIn) {
  loginShell.hidden = isLoggedIn;
  adminShell.hidden = !isLoggedIn;
}

function showConfigWarning() {
  const warning = document.createElement("div");
  warning.className = "flash error";
  warning.textContent = "Supabase is not configured yet. Add the project URL and anon key to supabase-config.js to enable login and saving.";
  adminShell.prepend(warning);
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!window.PRECISION_SUPABASE_READY) return;

  const data = new FormData(loginForm);
  loginMessage.textContent = "Signing in...";
  const { error } = await client.auth.signInWithPassword({
    email: data.get("email"),
    password: data.get("password")
  });

  if (error) {
    loginMessage.textContent = error.message;
    return;
  }

  loginMessage.textContent = "";
  setAuthState(true);
  await loadListings();
});

logoutButton?.addEventListener("click", async () => {
  await client?.auth.signOut();
  resetEditMode();
  setAuthState(false);
});

async function loadListings() {
  const { data, error } = await client
    .from("listings")
    .select("*, listing_images(*)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  listings = data.map((listing) => ({
    ...listing,
    images: (listing.listing_images || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => publicImageUrl(image.path))
  }));
  renderListings();
}

function publicImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("./") || path.startsWith("assets/") || path.startsWith("http")) return path;
  return client.storage.from(config.imageBucket).getPublicUrl(path).data.publicUrl;
}

function renderListings() {
  grid.innerHTML = "";
  count.textContent = `${listings.length} listings`;

  listings.forEach((listing) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".admin-card");
    const image = node.querySelector(".card-image");
    const title = node.querySelector("h2");
    const fields = node.querySelector(".card-fields");
    const remove = node.querySelector(".remove-button");
    const primaryImage = listing.images?.[0];

    image.alt = listingTitle(listing);
    if (primaryImage) {
      image.src = primaryImage;
      image.hidden = false;
      card.classList.remove("has-no-image");
    } else {
      image.removeAttribute("src");
      image.hidden = true;
      card.classList.add("has-no-image");
    }
    title.textContent = listing.make || "Jacobsen";
    fields.innerHTML = fieldRows([
      ["Model", listing.model],
      ["Year", listing.year],
      ["Price", normalizePrice(listing.price)],
      ["Specs", listing.specs || listing.note],
      ["Stock #", listing.stock_number || "No stock #"]
    ]);

    card.addEventListener("click", () => openListing(listing));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openListing(listing);
      }
    });

    remove.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (!window.PRECISION_SUPABASE_READY) return alert("Supabase is not configured yet.");
      if (!confirm(`Delete ${listing.stock_number || listingTitle(listing)}?`)) return;
      const { error } = await client.from("listings").delete().eq("id", listing.id);
      if (error) {
        alert(error.message);
        return;
      }
      await loadListings();
    });

    grid.appendChild(card);
  });
}

imageInput.addEventListener("change", () => {
  uploadedFiles = Array.from(imageInput.files || []).slice(0, 8);
  renderSelectedImages();
});

function renderSelectedImages() {
  imageStrip.innerHTML = "";
  imagePreview.removeAttribute("src");
  imagePreview.parentElement.classList.remove("has-image");
  imagePrompt.textContent = editingId ? "Add more photos" : "Add photos";
  if (!uploadedFiles.length) return;

  uploadedFiles.forEach((file, index) => {
    const src = URL.createObjectURL(file);
    if (index === 0) {
      imagePreview.src = src;
      imagePreview.parentElement.classList.add("has-image");
      imagePrompt.textContent = `${uploadedFiles.length} selected`;
    }
    const item = document.createElement("div");
    item.className = "image-strip-item";
    item.innerHTML = `
      <img src="${src}" alt="Selected mower preview ${index + 1}" />
      <div class="image-strip-actions">
        <button type="button" data-action="left" data-index="${index}" ${index === 0 ? "disabled" : ""}>Left</button>
        <button type="button" data-action="right" data-index="${index}" ${index === uploadedFiles.length - 1 ? "disabled" : ""}>Right</button>
        <button type="button" data-action="remove" data-index="${index}">Remove</button>
      </div>
    `;
    imageStrip.appendChild(item);
  });
}

imageStrip.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const index = Number(button.dataset.index);
  if (button.dataset.action === "left" && index > 0) {
    [uploadedFiles[index - 1], uploadedFiles[index]] = [uploadedFiles[index], uploadedFiles[index - 1]];
  }
  if (button.dataset.action === "right" && index < uploadedFiles.length - 1) {
    [uploadedFiles[index + 1], uploadedFiles[index]] = [uploadedFiles[index], uploadedFiles[index + 1]];
  }
  if (button.dataset.action === "remove") {
    uploadedFiles.splice(index, 1);
  }
  renderSelectedImages();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!window.PRECISION_SUPABASE_READY) {
    alert("Supabase is not configured yet.");
    return;
  }

  submitListingButton.disabled = true;
  submitListingButton.textContent = editingId ? "Saving..." : "Adding...";

  const formData = new FormData(form);
  const listing = {
    make: formData.get("make").trim(),
    year: formData.get("year").trim(),
    model: formData.get("model").trim(),
    price: normalizePrice(formData.get("price")),
    specs: formData.get("specs").trim(),
    note: formData.get("specs").trim(),
    stock_number: formData.get("stock").trim() || `JM-${String(Date.now()).slice(-4)}`,
    status: "Available",
    sort_order: 0,
    updated_at: new Date().toISOString()
  };

  const existingImageCount = editingId ? listings.find((item) => item.id === editingId)?.images?.length || 0 : 0;
  const saved = editingId ? await updateListing(listing) : await createListing(listing);
  submitListingButton.disabled = false;

  if (!saved) {
    submitListingButton.textContent = editingId ? "Save listing" : "Add listing";
    return;
  }

  await uploadImages(saved.id, existingImageCount);
  resetForm();
  await loadListings();
});

async function createListing(listing) {
  const { data, error } = await client.from("listings").insert(listing).select().single();
  if (error) {
    alert(error.message);
    return null;
  }
  return data;
}

async function updateListing(listing) {
  const { data, error } = await client.from("listings").update(listing).eq("id", editingId).select().single();
  if (error) {
    alert(error.message);
    return null;
  }
  return data;
}

async function uploadImages(listingId, startOrder = 0) {
  for (let i = 0; i < uploadedFiles.length; i += 1) {
    const file = uploadedFiles[i];
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${listingId}/${crypto.randomUUID()}.${ext}`;
    const upload = await client.storage.from(config.imageBucket).upload(path, file, {
      cacheControl: "31536000",
      upsert: false
    });
    if (upload.error) {
      alert(upload.error.message);
      continue;
    }
    await client.from("listing_images").insert({
      listing_id: listingId,
      path,
      sort_order: startOrder + i
    });
  }
}

function openListing(listing) {
  activeListing = listing;
  const images = listing.images?.filter(Boolean) || [];
  renderDialogGallery(images, listingTitle(listing));
  dialogTitle.textContent = listing.make || "Jacobsen";
  dialogFields.innerHTML = fieldRows([
    ["Model", listing.model],
    ["Year", listing.year],
    ["Price", normalizePrice(listing.price)],
    ["Specs", listing.specs || listing.note],
    ["Stock #", listing.stock_number || "No stock #"]
  ]);
  dialog.showModal();
}

function renderDialogGallery(images, title) {
  dialogMainImage.alt = title;
  if (!images.length) {
    dialogMainImage.removeAttribute("src");
    dialogMainImage.hidden = true;
    dialogMainImage.parentElement.hidden = true;
    dialogGallery.innerHTML = `<span class="dialog-empty">No photos yet</span>`;
    return;
  }

  dialogMainImage.parentElement.hidden = false;
  dialogMainImage.src = images[0];
  dialogMainImage.hidden = false;
  dialogGallery.innerHTML = images
    .map(
      (src, index) => `
        <button class="dialog-thumb${index === 0 ? " is-active" : ""}" type="button" data-image-index="${index}">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(title)} photo ${index + 1}" />
        </button>
      `
    )
    .join("");

  dialogGallery.querySelectorAll(".dialog-thumb").forEach((button) => {
    button.addEventListener("click", () => {
      const src = images[Number(button.dataset.imageIndex)] || images[0];
      dialogMainImage.src = src;
      dialogGallery.querySelectorAll(".dialog-thumb").forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });
}

editListingButton.addEventListener("click", () => {
  if (!activeListing) return;
  dialog.close();
  startEdit(activeListing);
});

cancelEditButton.addEventListener("click", resetForm);

function startEdit(listing) {
  editingId = listing.id;
  form.make.value = listing.make || "Jacobsen";
  form.model.value = listing.model;
  form.year.value = listing.year;
  form.price.value = listing.price;
  form.specs.value = listing.specs || listing.note;
  form.stock.value = listing.stock_number || "";
  uploadedFiles = [];
  renderSelectedImages();
  formModeLabel.textContent = "Edit listing";
  submitListingButton.textContent = "Save listing";
  cancelEditButton.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  form.reset();
  resetEditMode();
  uploadedFiles = [];
  renderSelectedImages();
}

function resetEditMode() {
  editingId = null;
  formModeLabel.textContent = "New listing";
  submitListingButton.disabled = false;
  submitListingButton.textContent = "Add listing";
  cancelEditButton.hidden = true;
}

function listingTitle(listing) {
  return `${listing.make || "Jacobsen"} ${listing.model} ${listing.year}`.trim();
}

function normalizePrice(value = "") {
  const clean = String(value).trim();
  if (!clean) return "$0";
  return clean.startsWith("$") ? clean : `$${clean}`;
}

function fieldRows(rows) {
  return rows
    .map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
