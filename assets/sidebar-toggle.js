// sphinx-book-theme hides the header toggles that pydata-sphinx-theme
// listens to, and leaves the visible ≡ buttons with no handler.
// Forward those clicks to the bound header button.
(() => {
  function wire(buttonSelector) {
    const buttons = document.querySelectorAll(buttonSelector);
    const bound = buttons[0];
    if (!bound || buttons.length < 2) return;

    for (const button of Array.prototype.slice.call(buttons, 1)) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        bound.click();
      });
    }
  }

  function init() {
    wire(".primary-toggle");
    wire(".secondary-toggle");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
