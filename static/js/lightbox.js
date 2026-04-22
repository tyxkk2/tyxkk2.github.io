(function () {
  var overlay;
  var overlayImage;
  var overlayCaption;
  var overlayClose;
  var lastFocusedElement;

  function ensureLightbox() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Image preview">' +
      '  <button class="lightbox-close" type="button" aria-label="Close image preview">×</button>' +
      '  <figure class="lightbox-figure">' +
      '    <img class="lightbox-image" alt="">' +
      '    <figcaption class="lightbox-caption"></figcaption>' +
      "  </figure>" +
      "</div>";

    document.body.appendChild(overlay);

    overlayImage = overlay.querySelector(".lightbox-image");
    overlayCaption = overlay.querySelector(".lightbox-caption");
    overlayClose = overlay.querySelector(".lightbox-close");

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeLightbox();
      }
    });

    overlayClose.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

  function openLightbox(link) {
    ensureLightbox();

    var sourceImage = link.querySelector("img");
    if (!sourceImage) return;

    var caption = sourceImage.getAttribute("title") || sourceImage.getAttribute("alt") || "";

    lastFocusedElement = document.activeElement;
    overlayImage.src = link.href;
    overlayImage.alt = sourceImage.getAttribute("alt") || "";
    overlayCaption.textContent = caption;
    overlayCaption.hidden = !caption;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    overlayClose.focus();
  }

  function closeLightbox() {
    if (!overlay || !overlay.classList.contains("is-open")) return;

    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    overlayImage.removeAttribute("src");
    overlayImage.removeAttribute("alt");
    overlayCaption.textContent = "";

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest(".post-content .post-image-link");
    if (!link) return;

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    openLightbox(link);
  });
})();
