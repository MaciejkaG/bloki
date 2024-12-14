// Single Page App Library
// © 2024 mcjk

const basePath = '/menu';
const defaultViewId = 'mainView';

var activeView;
var viewChangeLock = false;

// Call this function to switch SPA views.
function switchView(viewId, useReplaceState = false, fast = false) {
    if (!viewChangeLock && viewId !== activeView) {
        viewChangeLock = true;

        // Animate leaving the current view.
        $(`.mainContent section`).css({ opacity: 0, animation: "SPAOutAnim 0.2s 1 ease" });
        setTimeout(() => {
            // Hide all views.
            $(`.mainContent section`).css("display", "none");
            // Show the new view.
            $(`.mainContent section#${viewId}`).css({ display: "inherit", opacity: 1, animation: "SPAInAnim 0.2s 1 ease" });

            // Get view's properties.
            let path = $(`.mainContent section#${viewId}`).data("path");
            let title = $(`.mainContent section#${viewId}`).data("title");

            // Modify browser's history with the view's properties retrieved earlier.
            try {
                if (useReplaceState) {
                    history.replaceState(null, "", basePath + (path ? path : "/"));
                } else {
                    history.pushState(null, title ? title : "Bloki", basePath + (path ? path : "/"));
                }
            } catch (error) {
                console.error('Couldn\'t push history state, likely due to the website being run in local (file://) mode.');
            }

            activeView = viewId;
            viewChangeLock = false;
        }, fast ? 0 : 210);
    }
}

// Get the path from query params
const initialURLParams = new URLSearchParams(window.location.search);
const initialPath = initialURLParams.get('path');

// Switch a view to the one with path included in ?path query param, if any was included
window.addEventListener('DOMContentLoaded', () => {
    // Switch to the default view id by default
    switchView(defaultViewId, true, true);

    if (initialPath != null) {
        // Select the view's element by its data-path attribute
        let elem = document.querySelector(`.mainContent section[data-path="${initialPath}"]`);

        // If the view isn't null, switch to it with its id
        if (elem != null)
            // We need a minor timeout to ensure the previous switchView() in this function has finished.
            setTimeout(() => {
                switchView(elem.id, true);
            }, 1);
    }
});

// When user tries to return (with an OS action, like Android back button/swipe back or with the browser's back button)
addEventListener("popstate", (event) => {
    // Prevent the default event (which would refresh the page)
    // preventDefault() doesn't prevent URL change to the previous one from browser's history
    event.preventDefault();
    // Get the previous view's element by its path (because the URL changed due to user returning).
    let elem = document.querySelector(`.mainContent section[data-path="${window.location.pathname}"]`);
    if (elem != null) {
        // Switch to the previous view.
        switchView(elem.id, true);
    }
});