document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector("#project-grid");
  const filters = [...document.querySelectorAll(".filter-button")];
  const countLabel = document.querySelector("#work-count");

  if (grid && Array.isArray(PORTFOLIO_DATA)) {
    renderProjects(grid, PORTFOLIO_DATA);
    setupFilters(filters, grid, countLabel);
  }

  setupMenu();
  setupDiscordCopy();
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
});

function renderProjects(grid, projects) {
  const fragment = document.createDocumentFragment();

  projects.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = `project-card${index === 0 ? " is-featured" : ""}`;
    card.dataset.category = project.category;

    const media = document.createElement("div");
    media.className = "project-media";
    media.dataset.tone = String(index % 5);

    const posterPath = project.poster || project.image;
    let poster = null;
    if (posterPath) {
      poster = document.createElement("img");
      poster.className = "project-poster";
      poster.src = posterPath;
      poster.alt = `${project.title} preview`;
      poster.loading = "lazy";
      poster.decoding = "async";
      poster.addEventListener("error", () => { poster.hidden = true; });
      media.append(poster);
    }

    const video = document.createElement("video");
    video.className = "project-video";
    video.preload = "none";
    video.playsInline = true;
    video.setAttribute("aria-label", `${project.title} project video`);
    if (posterPath) video.poster = posterPath;

    const playButton = document.createElement("button");
    playButton.className = "media-play";
    playButton.type = "button";
    playButton.setAttribute("aria-label", `Play video: ${project.title}`);
    playButton.innerHTML = '<span class="play-icon" aria-hidden="true"></span><span>Play project</span>';

    const fallback = document.createElement("p");
    fallback.className = "media-error";
    fallback.append(document.createTextNode("This video could not be played here. "));
    const directLink = document.createElement("a");
    directLink.href = project.video;
    directLink.target = "_blank";
    directLink.rel = "noopener noreferrer";
    directLink.textContent = "Open the file directly ↗";
    fallback.append(directLink);

    const caption = document.createElement("span");
    caption.className = "media-caption";
    caption.textContent = "ROBLOX STUDIO";

    media.append(video, playButton, fallback, caption);

    const details = document.createElement("div");
    details.className = "project-details";

    const meta = document.createElement("div");
    meta.className = "project-meta";
    const category = document.createElement("span");
    category.className = "project-label";
    category.textContent = project.label;
    const number = document.createElement("span");
    number.className = "project-number";
    number.textContent = String(index + 1).padStart(2, "0");
    meta.append(category, number);

    const title = document.createElement("h3");
    title.textContent = project.title;
    details.append(meta, title);
    if (project.description) {
      const description = document.createElement("p");
      description.textContent = project.description;
      details.append(description);
    }

    if (project.alternateVideo) {
      const alternate = document.createElement("button");
      alternate.className = "alternate-video";
      alternate.type = "button";
      alternate.textContent = "Play alternate clip ↗";
      alternate.addEventListener("click", () => {
        directLink.href = project.alternateVideo;
        const altPoster = project.alternatePoster || posterPath;
        if (altPoster) {
          video.poster = altPoster;
          if (poster) poster.src = altPoster;
        }
        loadAndPlay(project.alternateVideo, video, media, playButton);
      });
      details.append(alternate);
    }

    card.append(media, details);
    fragment.append(card);

    playButton.addEventListener("click", () => {
      directLink.href = project.video;
      if (posterPath) {
        video.poster = posterPath;
        if (poster) poster.src = posterPath;
      }
      loadAndPlay(project.video, video, media, playButton);
    });

    video.addEventListener("play", () => {
      playButton.hidden = true;
      media.classList.add("is-playing");
      document.querySelectorAll(".project-video").forEach((otherVideo) => {
        if (otherVideo !== video) otherVideo.pause();
      });
    });

    video.addEventListener("pause", () => {
      if (!video.ended) playButton.hidden = false;
      media.classList.remove("is-playing");
    });

    video.addEventListener("ended", () => {
      playButton.hidden = false;
      media.classList.remove("is-playing");
    });

    video.addEventListener("error", () => {
      media.classList.add("has-error");
      playButton.hidden = true;
    });
  });

  grid.replaceChildren(fragment);
}

function loadAndPlay(path, video, media, playButton) {
  media.classList.remove("has-error");
  video.pause();
  video.src = path;
  video.load();
  video.controls = true;
  playButton.hidden = true;
  video.play().catch(() => {
    playButton.hidden = false;
    media.classList.add("has-error");
  });
}

function setupFilters(filters, grid, countLabel) {
  const cards = [...grid.querySelectorAll(".project-card")];
  const countByCategory = {
    all: cards.length,
    gameplay: cards.filter((card) => card.dataset.category === "gameplay").length,
    systems: cards.filter((card) => card.dataset.category === "systems").length,
    interface: cards.filter((card) => card.dataset.category === "interface").length
  };

  Object.entries(countByCategory).forEach(([category, count]) => {
    const element = document.querySelector(`[data-count="${category}"]`);
    if (element) element.textContent = String(count).padStart(2, "0");
  });

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const selected = filter.dataset.filter;
      filters.forEach((button) => {
        const active = button === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      let visible = 0;
      cards.forEach((card) => {
        const show = selected === "all" || card.dataset.category === selected;
        card.hidden = !show;
        if (show) visible += 1;
        if (!show) card.querySelector("video").pause();
      });

      if (countLabel) countLabel.textContent = `${String(visible).padStart(2, "0")} projects`;
    });
  });

  if (countLabel) countLabel.textContent = `${String(cards.length).padStart(2, "0")} projects`;
}

function setupMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#primary-nav");
  if (!toggle || !nav) return;

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeMenu();
      toggle.focus();
    }
  });
}

function setupDiscordCopy() {
  const button = document.querySelector(".copy-id");
  const status = document.querySelector("#copy-status");
  if (!button || !status) return;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("1277963474731012096");
      button.textContent = "Copied";
      status.textContent = "Discord user ID copied.";
    } catch {
      status.textContent = "Select and copy the ID shown above.";
    }
    window.setTimeout(() => {
      button.textContent = "Copy";
      status.textContent = "";
    }, 2200);
  });
}
