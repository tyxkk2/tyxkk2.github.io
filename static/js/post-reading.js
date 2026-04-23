(() => {
  const toc = document.querySelector("[data-reading-toc]");
  const article = document.querySelector(".post-reading-article .post-content");

  if (!toc || !article) return;

  const tocLinks = Array.from(toc.querySelectorAll('a[href^="#"]'));
  if (!tocLinks.length) return;

  const linkById = new Map();
  tocLinks.forEach((link) => {
    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    if (id) linkById.set(id, link);
  });

  const headings = Array.from(
    article.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
  ).filter((heading) => linkById.has(heading.id));

  if (!headings.length) return;

  let activeId = "";

  const scrollPanelToLink = (link) => {
    const panelRect = toc.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const pad = 8;
    if (linkRect.top < panelRect.top + pad) {
      toc.scrollTop += linkRect.top - panelRect.top - pad;
    } else if (linkRect.bottom > panelRect.bottom - pad) {
      toc.scrollTop += linkRect.bottom - panelRect.bottom + pad;
    }
  };

  const setActive = (id) => {
    if (!id || id === activeId) return;
    activeId = id;

    tocLinks.forEach((link) => {
      const linkId = decodeURIComponent(link.getAttribute("href").slice(1));
      const isActive = linkId === id;

      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
        scrollPanelToLink(link);
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const refreshActive = () => {
    const visibleHeadings = headings
      .filter((heading) => heading.getBoundingClientRect().top <= 140)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

    if (visibleHeadings.length) {
      setActive(visibleHeadings[visibleHeadings.length - 1].id);
      return;
    }

    setActive(headings[0].id);
  };

  const observer = new IntersectionObserver(
    () => {
      refreshActive();
    },
    {
      rootMargin: "-18% 0px -65% 0px",
      threshold: [0, 1]
    }
  );

  headings.forEach((heading) => observer.observe(heading));

  const initialHash = decodeURIComponent(window.location.hash.slice(1));
  if (initialHash && linkById.has(initialHash)) {
    setActive(initialHash);
  } else {
    refreshActive();
  }

  window.addEventListener(
    "hashchange",
    () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash && linkById.has(hash)) setActive(hash);
    },
    { passive: true }
  );
})();
