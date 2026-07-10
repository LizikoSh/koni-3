(() => {
  const state = {
    favorites: new Set(JSON.parse(localStorage.getItem("horseFavorites") || "[]")),
    compare: new Set(),
    favoritesOnly: false,
    query: "",
    region: "all",
    type: "all",
    use: "all"
  };

  const els = {
    header: document.querySelector(".site-header"),
    menuButton: document.querySelector(".menu-button"),
    nav: document.querySelector(".site-nav"),
    themeToggle: document.querySelector(".theme-toggle"),
    search: document.querySelector("#breed-search"),
    region: document.querySelector("#region-filter"),
    type: document.querySelector("#type-filter"),
    use: document.querySelector("#use-filter"),
    reset: document.querySelector("#reset-filters"),
    grid: document.querySelector("#breed-grid"),
    resultsCount: document.querySelector("#results-count"),
    breedCount: document.querySelector("#breed-count"),
    empty: document.querySelector("#empty-state"),
    showFavorites: document.querySelector("#show-favorites"),
    breedModal: document.querySelector("#breed-modal"),
    breedModalContent: document.querySelector("#breed-modal-content"),
    storyModal: document.querySelector("#story-modal"),
    storyModalContent: document.querySelector("#story-modal-content"),
    compareModal: document.querySelector("#compare-modal"),
    compareWrap: document.querySelector("#compare-table-wrap"),
    compareDock: document.querySelector("#compare-dock"),
    compareSummary: document.querySelector("#compare-summary"),
    openCompare: document.querySelector("#open-compare"),
    clearCompare: document.querySelector("#clear-compare"),
    glossaryTerms: document.querySelector("#glossary-terms"),
    glossaryDefinition: document.querySelector("#glossary-definition"),
    storyTitle: document.querySelector("#story-title"),
    storyText: document.querySelector("#story-text"),
    storyStatus: document.querySelector("#story-status")
  };

  const normalize = value => value.toLocaleLowerCase("uk-UA").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const uniqueSorted = values => [...new Set(values)].sort((a, b) => a.localeCompare(b, "uk"));

  function populateSelect(select, values) {
    values.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  }

  function initializeFilters() {
    populateSelect(els.region, uniqueSorted(breeds.map(breed => breed.region)));
    populateSelect(els.type, uniqueSorted(breeds.map(breed => breed.type)));
    populateSelect(els.use, uniqueSorted(breeds.flatMap(breed => breed.uses)));
    els.breedCount.textContent = breeds.length;
  }

  function filteredBreeds() {
    const query = normalize(state.query.trim());
    return breeds.filter(breed => {
      const haystack = normalize([
        breed.name,
        breed.nativeName,
        breed.origin,
        breed.region,
        breed.type,
        breed.uses.join(" "),
        breed.summary,
        breed.temperament
      ].join(" "));

      return (!query || haystack.includes(query))
        && (state.region === "all" || breed.region === state.region)
        && (state.type === "all" || breed.type === state.type)
        && (state.use === "all" || breed.uses.includes(state.use))
        && (!state.favoritesOnly || state.favorites.has(breed.id));
    });
  }

  function renderBreeds() {
    const list = filteredBreeds();
    els.resultsCount.textContent = list.length;
    els.empty.hidden = list.length > 0;
    els.grid.innerHTML = list.map(breed => {
      const image = horseImages[breed.image];
      const favorite = state.favorites.has(breed.id);
      const compared = state.compare.has(breed.id);
      return `
        <article class="breed-card" data-id="${breed.id}">
          <img class="breed-card-image" src="${image.url}" alt="Ілюстративне фото: ${breed.name}" loading="lazy">
          <div class="breed-card-top">
            <span class="card-chip">${breed.region}</span>
            <button class="favorite-button ${favorite ? "active" : ""}" type="button" data-action="favorite" aria-pressed="${favorite}" aria-label="${favorite ? "Прибрати" : "Додати"} ${breed.name} ${favorite ? "із" : "до"} вибраного">${favorite ? "♥" : "♡"}</button>
          </div>
          <div class="breed-card-body">
            <h3>${breed.name}</h3>
            <p class="breed-card-subtitle">${breed.nativeName} · ${breed.origin}</p>
            <div class="breed-tags"><span>${breed.type}</span><span>${breed.uses[0]}</span></div>
            <div class="card-actions">
              <button class="button button-small button-primary" type="button" data-action="details">Докладніше</button>
              <button class="button button-small button-outline compare-toggle ${compared ? "active" : ""}" type="button" data-action="compare" aria-pressed="${compared}">${compared ? "✓ Обрано" : "+ Порівняти"}</button>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  function saveFavorites() {
    localStorage.setItem("horseFavorites", JSON.stringify([...state.favorites]));
  }

  function toggleFavorite(id) {
    state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
    saveFavorites();
    renderBreeds();
  }

  function toggleCompare(id) {
    if (state.compare.has(id)) {
      state.compare.delete(id);
    } else if (state.compare.size < 3) {
      state.compare.add(id);
    } else {
      alert("Для порівняння можна обрати не більше трьох порід.");
      return;
    }
    renderBreeds();
    updateCompareDock();
  }

  function updateCompareDock() {
    const selected = breeds.filter(breed => state.compare.has(breed.id));
    els.compareDock.hidden = selected.length === 0;
    els.compareSummary.textContent = selected.length
      ? selected.map(breed => breed.name).join(" · ")
      : "Оберіть 2–3 породи";
    els.openCompare.disabled = selected.length < 2;
  }

  function showBreed(id) {
    const breed = breeds.find(item => item.id === id);
    if (!breed) return;
    const image = horseImages[breed.image];
    els.breedModalContent.innerHTML = `
      <div class="breed-modal-hero" style="background-image:url('${image.url}')">
        <div>
          <p class="eyebrow">${breed.region} · ${breed.type}</p>
          <h2>${breed.name}</h2>
          <p>${breed.nativeName} · ${breed.origin}</p>
        </div>
      </div>
      <div class="modal-body">
        <dl class="fact-grid">
          <div><dt>Зріст</dt><dd>${breed.height}</dd></div>
          <div><dt>Масті</dt><dd>${breed.colors}</dd></div>
          <div><dt>Характер</dt><dd>${breed.temperament}</dd></div>
          <div><dt>Напрями</dt><dd>${breed.uses.join(", ")}</dd></div>
        </dl>
        <div class="modal-copy">
          <p><strong>${breed.summary}</strong></p>
          <p>${breed.description}</p>
          <p class="modal-note">${breed.note}</p>
        </div>
        <p class="photo-credit">Ілюстративне фото: <a href="${image.source}" target="_blank" rel="noopener">${image.credit} / Unsplash</a>. Фото не є гарантією точної відповідності стандарту породи.</p>
      </div>`;
    openDialog(els.breedModal);
  }

  function showStory(id) {
    const story = stories[id];
    if (!story) return;
    els.storyModalContent.innerHTML = `
      <p class="story-meta">${story.meta}</p>
      <h2>${story.title}</h2>
      <div class="story-copy">${story.text.map(p => `<p>${p}</p>`).join("")}</div>`;
    openDialog(els.storyModal);
  }

  function showComparison() {
    const selected = breeds.filter(breed => state.compare.has(breed.id));
    if (selected.length < 2) return;
    const rows = [
      ["Походження", ...selected.map(b => b.origin)],
      ["Регіон", ...selected.map(b => b.region)],
      ["Тип", ...selected.map(b => b.type)],
      ["Зріст", ...selected.map(b => b.height)],
      ["Масті", ...selected.map(b => b.colors)],
      ["Характер", ...selected.map(b => b.temperament)],
      ["Використання", ...selected.map(b => b.uses.join(", "))]
    ];
    els.compareWrap.innerHTML = `
      <table class="compare-table">
        <thead><tr><th>Ознака</th>${selected.map(b => `<th>${b.name}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`;
    openDialog(els.compareModal);
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.body.classList.add("modal-open");
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    document.body.classList.remove("modal-open");
  }

  function resetFilters() {
    state.query = "";
    state.region = "all";
    state.type = "all";
    state.use = "all";
    state.favoritesOnly = false;
    els.search.value = "";
    els.region.value = "all";
    els.type.value = "all";
    els.use.value = "all";
    els.showFavorites.setAttribute("aria-pressed", "false");
    els.showFavorites.textContent = "♡ Лише вибране";
    renderBreeds();
  }

  function renderGlossary(selectedIndex = 0) {
    els.glossaryTerms.innerHTML = glossary.map((item, index) => `
      <button class="glossary-term ${index === selectedIndex ? "active" : ""}" type="button" data-index="${index}">${item.term}</button>
    `).join("");
    const item = glossary[selectedIndex];
    els.glossaryDefinition.innerHTML = `
      <span class="glossary-letter">${item.letter}</span>
      <p class="eyebrow">Обраний термін</p>
      <h3>${item.term}</h3>
      <p>${item.definition}</p>`;
  }

  function saveStoryDraft() {
    const payload = { title: els.storyTitle.value.trim(), text: els.storyText.value.trim() };
    localStorage.setItem("horseStoryDraft", JSON.stringify(payload));
    els.storyStatus.textContent = "Чернетку збережено на цьому пристрої.";
  }

  function loadStoryDraft() {
    const draft = JSON.parse(localStorage.getItem("horseStoryDraft") || "null");
    if (!draft) return;
    els.storyTitle.value = draft.title || "";
    els.storyText.value = draft.text || "";
    els.storyStatus.textContent = "Відновлено збережену чернетку.";
  }

  function exportStory() {
    const title = els.storyTitle.value.trim() || "Моя історія про коня";
    const text = els.storyText.value.trim();
    if (!text) {
      els.storyStatus.textContent = "Спочатку напишіть хоча б кілька речень.";
      return;
    }
    const blob = new Blob([`${title}\n${"=".repeat(title.length)}\n\n${text}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-zа-яіїєґ0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "horse-story"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    els.storyStatus.textContent = "Файл підготовлено.";
  }

  function initializeTheme() {
    const saved = localStorage.getItem("horseTheme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefersDark;
    document.body.classList.toggle("dark-theme", dark);
    els.themeToggle.querySelector("span").textContent = dark ? "☀" : "☾";
  }

  function toggleTheme() {
    const dark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("horseTheme", dark ? "dark" : "light");
    els.themeToggle.querySelector("span").textContent = dark ? "☀" : "☾";
  }

  function bindEvents() {
    window.addEventListener("scroll", () => els.header.classList.toggle("scrolled", window.scrollY > 30), { passive: true });

    els.menuButton.addEventListener("click", () => {
      const open = els.nav.classList.toggle("open");
      els.menuButton.setAttribute("aria-expanded", String(open));
    });
    els.nav.addEventListener("click", event => {
      if (event.target.matches("a")) {
        els.nav.classList.remove("open");
        els.menuButton.setAttribute("aria-expanded", "false");
      }
    });
    els.themeToggle.addEventListener("click", toggleTheme);

    els.search.addEventListener("input", event => { state.query = event.target.value; renderBreeds(); });
    els.region.addEventListener("change", event => { state.region = event.target.value; renderBreeds(); });
    els.type.addEventListener("change", event => { state.type = event.target.value; renderBreeds(); });
    els.use.addEventListener("change", event => { state.use = event.target.value; renderBreeds(); });
    els.reset.addEventListener("click", resetFilters);

    els.showFavorites.addEventListener("click", () => {
      state.favoritesOnly = !state.favoritesOnly;
      els.showFavorites.setAttribute("aria-pressed", String(state.favoritesOnly));
      els.showFavorites.textContent = state.favoritesOnly ? "♥ Показано вибране" : "♡ Лише вибране";
      renderBreeds();
    });

    els.grid.addEventListener("click", event => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const card = button.closest(".breed-card");
      const id = card?.dataset.id;
      if (!id) return;
      if (button.dataset.action === "favorite") toggleFavorite(id);
      if (button.dataset.action === "compare") toggleCompare(id);
      if (button.dataset.action === "details") showBreed(id);
    });

    document.querySelectorAll(".random-breed").forEach(button => button.addEventListener("click", () => {
      const breed = breeds[Math.floor(Math.random() * breeds.length)];
      showBreed(breed.id);
    }));

    document.querySelectorAll(".story-open").forEach(button => button.addEventListener("click", () => showStory(button.dataset.story)));

    document.querySelectorAll("dialog").forEach(dialog => {
      dialog.querySelector(".modal-close")?.addEventListener("click", () => closeDialog(dialog));
      dialog.addEventListener("click", event => {
        const rect = dialog.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (!inside) closeDialog(dialog);
      });
      dialog.addEventListener("close", () => document.body.classList.remove("modal-open"));
    });

    els.openCompare.addEventListener("click", showComparison);
    els.clearCompare.addEventListener("click", () => {
      state.compare.clear();
      renderBreeds();
      updateCompareDock();
    });

    els.glossaryTerms.addEventListener("click", event => {
      const button = event.target.closest("[data-index]");
      if (button) renderGlossary(Number(button.dataset.index));
    });

    document.querySelector("#save-story").addEventListener("click", saveStoryDraft);
    document.querySelector("#export-story").addEventListener("click", exportStory);
  }

  initializeTheme();
  initializeFilters();
  renderBreeds();
  renderGlossary();
  loadStoryDraft();
  updateCompareDock();
  bindEvents();
  document.querySelector("#current-year").textContent = new Date().getFullYear();
})();
