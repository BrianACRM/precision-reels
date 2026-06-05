const imageInput = document.querySelector("#imageInput");
const imagePreview = document.querySelector("#imagePreview");
const imagePrompt = document.querySelector("#imagePrompt");
const imageStrip = document.querySelector("#imageStrip");

imageInput?.addEventListener("change", () => {
  const files = Array.from(imageInput.files || []);
  if (!files.length) return;

  imageStrip.innerHTML = "";
  files.slice(0, 8).forEach((file, index) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (index === 0 && imagePreview) {
        imagePreview.src = reader.result;
        imagePreview.parentElement.classList.add("has-image");
      }
      const img = document.createElement("img");
      img.src = reader.result;
      img.alt = "Selected mower preview";
      imageStrip.appendChild(img);
      imagePrompt.textContent = `${Math.min(files.length, 8)} selected`;
    });
    reader.readAsDataURL(file);
  });
});
