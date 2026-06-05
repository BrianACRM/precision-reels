const CONTACT_EMAIL = "brandon@precisionreels.com";

document.querySelector("#contactForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = data.get("subject") || "Mower inquiry";
  const body = [
    `Name: ${data.get("name")}`,
    `Contact: ${data.get("contact")}`,
    "",
    data.get("message")
  ].join("\n");

  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
