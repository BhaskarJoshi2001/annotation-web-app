/* Shared theme controller: light / dark / system, persisted. */
(function () {
  const KEY = "as-theme";
  const root = document.documentElement;

  function systemPref() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function resolved(mode) {
    return mode === "system" ? systemPref() : mode;
  }
  // Suppress transitions for one frame during a theme flip. Without this,
  // engines can leave background/color properties (whose value comes from a
  // var() that changed via an ancestor attribute) stuck at the old value.
  let killEl = null;
  function suppressTransitions() {
    if (!document.head) return;
    if (!killEl) {
      killEl = document.createElement("style");
      killEl.textContent = "*,*::before,*::after{transition:none !important}";
    }
    if (!killEl.isConnected) document.head.appendChild(killEl);
    // force reflow so the "no transition" state is committed before the swap
    void root.offsetWidth;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { if (killEl && killEl.isConnected) killEl.remove(); });
    });
  }
  function apply(mode, animate) {
    if (animate) suppressTransitions();
    root.setAttribute("data-theme", resolved(mode));
    root.setAttribute("data-theme-mode", mode);
  }
  function get() {
    return localStorage.getItem(KEY) || "system";
  }
  function set(mode) {
    localStorage.setItem(KEY, mode);
    apply(mode, true);
    document.querySelectorAll("[data-theme-btn]").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.themeBtn === mode ? "true" : "false");
    });
    window.dispatchEvent(new CustomEvent("themechange", { detail: { mode, resolved: resolved(mode) } }));
  }

  // init ASAP to avoid flash
  apply(get());

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (get() === "system") apply("system", true);
  });

  window.ASTheme = { get, set, resolved: () => resolved(get()) };

  document.addEventListener("DOMContentLoaded", () => {
    set(get());
    document.querySelectorAll("[data-theme-btn]").forEach((b) => {
      b.addEventListener("click", () => set(b.dataset.themeBtn));
    });
  });
})();
