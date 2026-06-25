(function () {
  const config = window.MILO_SITE_CONFIG || {};
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  function setText(selector, value) {
    $$(selector).forEach((node) => {
      node.textContent = value;
    });
  }

  function setCanonical() {
    const path = document.documentElement.dataset.pagePath || "/";
    const base = config.canonicalBaseUrl || window.location.origin;
    const url = new URL(path, base).toString();
    const canonical = $('link[rel="canonical"]');
    const ogUrl = $('meta[property="og:url"]');
    if (canonical) canonical.href = url;
    if (ogUrl) ogUrl.content = url;
  }

  function initContent() {
    setText("[data-age-range]", config.targetAgeRange || "5 à 11 ans");
    setText("[data-release-status]", config.releaseStatus === "available" ? "Application disponible" : "Milo arrive bientôt");
    setText("[data-current-year]", String(new Date().getFullYear()));
    setText("[data-contact-email]", config.contactEmail || "[À compléter avant publication]");
    setText("[data-site-version]", config.version || "[À compléter avant publication]");
    setText("[data-compatibility]", config.compatibility || "Tablette en priorité");

    const legalOwner = $("[data-legal-owner]");
    if (legalOwner) legalOwner.textContent = config.legalOwner || "[À compléter avant publication]";

    const learningGrid = $("#learning-grid");
    if (learningGrid && Array.isArray(config.learningCategories)) {
      learningGrid.innerHTML = config.learningCategories
        .map((item, index) => {
          const accent = item.accent || "orange";
          return `<article class="learning-card card-${accent}">
            <span class="learning-mark accent-${accent}" aria-hidden="true">${index + 1}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
          </article>`;
        })
        .join("");
    }

    const storeArea = $("#store-buttons");
    if (storeArea && config.releaseStatus === "available") {
      storeArea.innerHTML = "";
      if (config.downloadUrl) {
        storeArea.insertAdjacentHTML("beforeend", `<a class="button button-yellow" href="${escapeAttr(config.downloadUrl)}" target="_blank" rel="noopener noreferrer">Télécharger Milo</a>`);
        return;
      }
      if (config.appStoreUrl) {
        storeArea.insertAdjacentHTML("beforeend", `<a class="button button-yellow" href="${escapeAttr(config.appStoreUrl)}" target="_blank" rel="noopener noreferrer">App Store</a>`);
      }
      if (config.playStoreUrl) {
        storeArea.insertAdjacentHTML("beforeend", `<a class="button button-blue" href="${escapeAttr(config.playStoreUrl)}" target="_blank" rel="noopener noreferrer">Google Play</a>`);
      }
      if (!config.appStoreUrl && !config.playStoreUrl) {
        storeArea.insertAdjacentHTML("beforeend", '<span class="button button-disabled" aria-disabled="true">App Store</span>');
        storeArea.insertAdjacentHTML("beforeend", '<span class="button button-disabled" aria-disabled="true">Google Play</span>');
      }
    }
  }

  function initMobileMenu() {
    const button = $("#nav-toggle");
    const nav = $("#site-nav");
    if (!button || !nav) return;

    function setOpen(isOpen) {
      button.setAttribute("aria-expanded", String(isOpen));
      nav.dataset.open = String(isOpen);
      document.body.classList.toggle("menu-open", isOpen);
      if (isOpen) {
        const firstLink = $("a", nav);
        if (firstLink) firstLink.focus();
      }
    }

    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (event) => {
      if (event.target.matches("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        button.focus();
      }
    });
  }

  function initTabs() {
    $$('[role="tablist"]').forEach((tablist) => {
      const tabs = $$('[role="tab"]', tablist);
      const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

      function activate(tab, focusTab) {
        tabs.forEach((item, index) => {
          const selected = item === tab;
          item.setAttribute("aria-selected", String(selected));
          item.tabIndex = selected ? 0 : -1;
          if (panels[index]) panels[index].hidden = !selected;
        });
        if (focusTab) tab.focus();
      }

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activate(tab, false));
        tab.addEventListener("keydown", (event) => {
          const keyMap = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
          if (!(event.key in keyMap) && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault();
          let nextIndex = index;
          if (event.key === "Home") nextIndex = 0;
          else if (event.key === "End") nextIndex = tabs.length - 1;
          else nextIndex = (index + keyMap[event.key] + tabs.length) % tabs.length;
          activate(tabs[nextIndex], true);
        });
      });
    });
  }

  function initAccordions() {
    $$(".faq-question").forEach((button) => {
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      if (!panel) return;
      button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        panel.hidden = expanded;
        const icon = $("[data-accordion-icon]", button);
        if (icon) icon.textContent = expanded ? "+" : "−";
      });
    });
  }

  function initPreferences() {
    const form = $("#display-preferences");
    const demo = $("#preference-demo");
    if (!form || !demo) return;
    const storageKey = "milo-display-preferences";
    const stored = readJson(localStorage.getItem(storageKey)) || {};

    Object.entries(stored).forEach(([name, value]) => {
      const input = $(`input[name="${name}"][value="${value}"]`, form);
      if (input) input.checked = true;
    });

    function apply() {
      const data = new FormData(form);
      demo.classList.toggle("large", data.get("size") === "large");
      demo.classList.toggle("spacious", data.get("spacing") === "spacious");
      demo.classList.toggle("contrast", data.get("contrast") === "high");
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(data.entries())));
    }

    form.addEventListener("change", apply);
    apply();
  }

  function initForm() {
    const form = $("#launch-form");
    if (!form) return;
    const summary = $("#form-summary");
    const live = $("#form-live");

    function setFieldError(name, message) {
      const field = form.elements[name];
      const error = document.getElementById(`${name}-error`);
      if (!field || !error) return;
      field.setAttribute("aria-invalid", message ? "true" : "false");
      error.textContent = message;
    }

    function validate() {
      const data = new FormData(form);
      const email = String(data.get("email") || "").trim();
      const consent = data.get("consent") === "on";
      let isValid = true;
      setFieldError("email", "");
      setFieldError("consent", "");
      summary.textContent = "";

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError("email", "Indiquez une adresse e-mail valide.");
        isValid = false;
      }
      if (!consent) {
        setFieldError("consent", "Votre accord est nécessaire pour recevoir l'information de lancement.");
        isValid = false;
      }
      if (!isValid) {
        summary.textContent = "Le formulaire contient une erreur. Vérifiez les champs signalés.";
      }
      return isValid;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validate()) {
        const firstInvalid = $('[aria-invalid="true"]', form);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const button = $('[type="submit"]', form);
      const data = Object.fromEntries(new FormData(form).entries());
      button.disabled = true;
      if (live) live.textContent = "Envoi de la demande en cours.";

      try {
        const response = await fetch("/api/preinscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("server-error");
        localStorage.setItem("milo-launch-interest", JSON.stringify({ email: data.email, profile: data.profile || "", date: new Date().toISOString() }));
        window.location.href = "/merci/";
      } catch (error) {
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          localStorage.setItem("milo-launch-interest", JSON.stringify({ email: data.email, profile: data.profile || "", date: new Date().toISOString(), localPreview: true }));
          window.location.href = "/merci/";
          return;
        }
        summary.textContent = "L'inscription n'a pas pu être enregistrée pour le moment. Réessayez plus tard.";
        if (live) live.textContent = summary.textContent;
        button.disabled = false;
      }
    });
  }

  function readJson(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }

  document.addEventListener("DOMContentLoaded", () => {
    setCanonical();
    initContent();
    initMobileMenu();
    initTabs();
    initAccordions();
    initPreferences();
    initForm();
  });
})();
