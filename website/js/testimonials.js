/*
 * testimonials.js — Local Testimonials demo
 * Version: 0.1.0 | 2026-11-10
 * Author: Jared Husson
 *
 * Browser-only storage.
 * No API, SQL, credentials, or public publishing.
 *
 * Treat form and storage data as untrusted.
 * Render customer content with textContent.
 */

(() => {
    "use strict";

    const root = document.getElementById("testimonials-app");

    if (!root || root.dataset.initialized === "true") {
        return;
    }

    root.dataset.initialized = "true";

    const byId = id => root.querySelector("#" + id);

    const form = byId("review-form");
    const panel = byId("review-panel");
    const open = byId("open-review");
    const name = byId("review-name");
    const town = byId("review-town");
    const feedback = byId("review-text");
    const consent = byId("review-consent");
    const filter = byId("rating-filter");
    const sort = byId("review-sort");
    const more = byId("load-reviews");
    const status = byId("review-status");

    const radios = [
        ...form.querySelectorAll('input[name="rating"]')
    ];

    const STORAGE_KEY = "sns-testimonials-demo-v1";
    const MAX_REVIEWS = 1000;
    const MAX_STORAGE_LENGTH = 2000000;
    const PAGE_SIZE = 6;

    let limit = PAGE_SIZE;

    // Clearly labeled examples, never real customer endorsements.
    const sampleMessages = {
        1: "Example feedback: the results did not meet expectations, and a follow-up was requested.",
        2: "Example feedback: several areas were missed, although the team was friendly.",
        3: "Example feedback: the kitchen looked good, but some rooms needed more attention.",
        4: "Example feedback: a good cleaning overall, with a little more time needed on the floors.",
        5: "Example feedback: the team was punctual, careful, and left the home feeling fresh."
    };

    const sampleRatings = [
        5, 4, 5, 3, 5, 4, 5, 2, 4, 5, 1, 5, 4, 5
    ];

    const sampleTowns = [
        "Rochester", "Fairport", "Penfield", "Pittsford"
    ];

    const samples = sampleRatings.map((rating, index) => ({
        id: "sample-" + index,
        name: "Example customer " +
            String.fromCharCode(65 + index) + ".",
        town: sampleTowns[index % sampleTowns.length],
        rating,
        text: sampleMessages[rating],
        createdAt: Date.UTC(2026, 10, 9 - index, 17),
        consent: true,
        sample: true
    }));

    // Normalize whitespace and remove non-printing control characters.
    // Quotes and ordinary punctuation remain intact.
    function cleanText(value) {
        return value
            .replace(/\r\n?/g, "\n")
            .replace(
                /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,
                ""
            )
            .trim();
    }

    function validReview(review) {
        return review &&
            typeof review === "object" &&
            typeof review.id === "string" &&
            review.id.length <= 100 &&
            typeof review.name === "string" &&
            cleanText(review.name).length >= 1 &&
            review.name.length <= 60 &&
            typeof review.town === "string" &&
            review.town.length <= 60 &&
            typeof review.text === "string" &&
            cleanText(review.text).length >= 10 &&
            review.text.length <= 1500 &&
            Number.isInteger(review.rating) &&
            review.rating >= 1 &&
            review.rating <= 5 &&
            Number.isSafeInteger(review.createdAt) &&
            review.createdAt > 0 &&
            review.createdAt <= Date.now() + 60000 &&
            review.consent === true;
    }

    function readSaved() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                return [];
            }

            if (raw.length > MAX_STORAGE_LENGTH) {
                throw new Error("Storage too large");
            }

            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed)) {
                throw new Error("Invalid storage");
            }

            const seen = new Set();

            return parsed
                .slice(0, MAX_REVIEWS)
                .filter(validReview)
                .filter(review => {
                    if (seen.has(review.id)) {
                        return false;
                    }

                    seen.add(review.id);
                    return true;
                })
                .map(review => ({
                    id: review.id,
                    name: cleanText(review.name),
                    town: cleanText(review.town),
                    text: cleanText(review.text),
                    rating: review.rating,
                    createdAt: review.createdAt,
                    consent: true,
                    sample: false
                }));
        } catch (_) {
            status.textContent =
                "Saved demo data could not be read. " +
                "Sample reviews are still available.";

            return [];
        }
    }

    function selectReviews(items, rating, order) {
        return items
            .filter(review =>
                rating === "all" ||
                review.rating === Number(rating)
            )
            .sort((a, b) => {
                if (order === "highest") {
                    return b.rating - a.rating ||
                        b.createdAt - a.createdAt;
                }

                if (order === "lowest") {
                    return a.rating - b.rating ||
                        b.createdAt - a.createdAt;
                }

                if (order === "oldest") {
                    return a.createdAt - b.createdAt;
                }

                return b.createdAt - a.createdAt;
            });
    }

    let saved = readSaved();

    const dates = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York"
    });

    // All displayed content is text, never interpreted as HTML.
    function element(tag, className, text) {
        const node = document.createElement(tag);
        node.className = className;
        node.textContent = text;
        return node;
    }

    function render() {
        const all = [...saved, ...samples];

        const matching = selectReviews(
            all,
            filter.value,
            sort.value
        );

        const list = byId("review-list");
        list.replaceChildren();

        matching.slice(0, limit).forEach(review => {
            const card = element(
                "article",
                "review-card",
                ""
            );

            const top = element(
                "div",
                "review-card-top",
                ""
            );

            const stars = element(
                "span",
                "review-stars",
                "★".repeat(review.rating) +
                    "☆".repeat(5 - review.rating)
            );

            stars.setAttribute("role", "img");
            stars.setAttribute(
                "aria-label",
                review.rating + " out of 5 stars"
            );

            top.append(
                stars,
                element(
                    "span",
                    "review-badge",
                    review.sample
                        ? "Example review"
                        : "Your demo review"
                )
            );

            const date = element(
                "time",
                "review-muted",
                dates.format(review.createdAt)
            );

            date.dateTime =
                new Date(review.createdAt).toISOString();

            card.append(
                top,
                element(
                    "p",
                    "review-feedback",
                    review.text
                ),
                element(
                    "div",
                    "review-author",
                    review.name
                )
            );

            if (review.town) {
                card.append(
                    element(
                        "div",
                        "review-muted review-town",
                        review.town
                    )
                );
            }

            card.append(date);
            list.append(card);
        });

        // Summary always covers all reviews, regardless of filters.
        const average = all.length
            ? all.reduce(
                (sum, review) => sum + review.rating,
                0
            ) / all.length
            : 0;

        byId("review-average").textContent = all.length
            ? average.toFixed(1) + " / 5"
            : "No rating yet";

        byId("average-stars").textContent = all.length
            ? "★".repeat(Math.round(average)) +
                "☆".repeat(5 - Math.round(average))
            : "";

        byId("review-total").textContent =
            all.length + " demo reviews (includes samples)";

        byId("review-matches").textContent = matching.length
            ? "Showing " +
                Math.min(limit, matching.length) +
                " of " + matching.length +
                " matching reviews"
            : "";

        const empty = byId("review-empty");
        empty.hidden = matching.length > 0;

        empty.textContent = all.length
            ? "No reviews match this rating."
            : "No reviews yet. Share your experience to get started.";

        more.hidden = limit >= matching.length;
    }

    function paintRating() {
        const selected = radios.find(
            radio => radio.checked
        );

        const rating = selected
            ? Number(selected.value)
            : 0;

        radios.forEach(radio => {
            radio.nextElementSibling.textContent =
                Number(radio.value) <= rating
                    ? "★"
                    : "☆";
        });

        byId("rating-label").textContent = rating
            ? rating + " out of 5 stars"
            : "Choose 1–5 stars";
    }

    function closeForm() {
        panel.hidden = true;
        open.setAttribute("aria-expanded", "false");
        open.focus();
    }

    open.disabled = false;

    open.addEventListener("click", () => {
        panel.hidden = !panel.hidden;

        open.setAttribute(
            "aria-expanded",
            String(!panel.hidden)
        );

        if (!panel.hidden) {
            name.focus();
        }
    });

    byId("cancel-review").addEventListener(
        "click",
        closeForm
    );

    radios.forEach(radio => {
        radio.addEventListener("change", paintRating);
    });

    [name, town, feedback].forEach(field => {
        field.addEventListener("input", () => {
            field.setCustomValidity("");
        });
    });

    [filter, sort].forEach(control => {
        control.addEventListener("change", () => {
            limit = PAGE_SIZE;
            render();
        });
    });

    more.addEventListener("click", () => {
        limit += PAGE_SIZE;
        render();
    });

    form.addEventListener("submit", event => {
        event.preventDefault();

        name.value = cleanText(name.value);
        town.value = cleanText(town.value);
        feedback.value = cleanText(feedback.value);

        name.setCustomValidity(
            name.value.length >= 1 &&
            name.value.length <= 60
                ? ""
                : "Enter a display name of 1–60 characters."
        );

        town.setCustomValidity(
            town.value.length <= 60
                ? ""
                : "Use no more than 60 characters."
        );

        feedback.setCustomValidity(
            feedback.value.length >= 10 &&
            feedback.value.length <= 1500
                ? ""
                : "Write 10–1,500 characters about your experience."
        );

        if (!form.reportValidity()) {
            return;
        }

        if (saved.length >= MAX_REVIEWS) {
            status.textContent =
                "This browser's demo storage is full. " +
                "Your review was not added.";

            return;
        }

        const selected = radios.find(
            radio => radio.checked
        );

        const review = {
            id: "demo-" + Date.now() + "-" +
                Math.random().toString(36).slice(2),
            name: name.value,
            town: town.value,
            text: feedback.value,
            rating: selected
                ? Number(selected.value)
                : 0,
            createdAt: Date.now(),
            consent: consent.checked,
            sample: false
        };

        if (!validReview(review)) {
            status.textContent =
                "Check your name, rating, feedback, " +
                "and display permission.";

            return;
        }

        saved.unshift(review);

        let persisted = false;

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(saved)
            );

            persisted = true;
        } catch (_) {
            // Posting still works for the current page session.
        }

        // Show the new review first, even if a filter was active.
        filter.value = "all";
        sort.value = "newest";
        limit = PAGE_SIZE;

        render();
        form.reset();
        paintRating();
        closeForm();

        status.textContent =
            "Thanks for sharing! Your demo review appears first. " +
            (
                persisted
                    ? "Saved in this browser only; nothing was published."
                    : "Browser storage is unavailable; " +
                      "this review will disappear when you reload."
            );
    });

    render();
})();
