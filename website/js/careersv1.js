/*
 * careersv1.js — Application dialog preview
 * Purpose: Open/close the application form and demonstrate validation.
 * Dependencies: careersv1.html and browser support for HTML dialog.
 * Behavior:
 *   - Native dialog handles keyboard focus and Escape.
 *   - Closing preserves entered values while this page remains open.
 *   - Repeated initialization does not duplicate event listeners.
 * Safety: No network requests, secrets, or persistent applicant storage.
 * Author: Jared Husson
 * Version History:
 *   0.1.0 | 2026-10-20 | Initial dialog and preview submission behavior.
 */

(() => {
    "use strict";

    const dialog = document.getElementById("application-dialog");
    const openButton = document.getElementById("open-application");
    const closeButton = document.getElementById("close-application");
    const form = document.getElementById("application-form");
    const status = document.getElementById("application-status");

    // Guard against missing markup and repeated initialization.
    if (!dialog || !openButton || !closeButton || !form || !status) {
        return;
    }

    if (dialog.dataset.initialized === "true") {
        return;
    }

    dialog.dataset.initialized = "true";

    // Close without resetting the applicant's current entries.
    openButton.addEventListener("click", () => {
        if (!dialog.open) {
            dialog.showModal();
        }
    });

    closeButton.addEventListener("click", () => {
        dialog.close();
    });

    // Prevent transmission until a real submission service is connected.
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        status.textContent =
            "Preview complete. Nothing was sent. " +
            "Email delivery will be connected before applications open.";
    });
})();
