// contentScript.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { FloatingOverlay } from "./components/FloatingOverlay";
import { detectPlatform } from "./utils/platformDetection";
import { useAuthStore } from "./store/auth";
import { useSessionStore } from "./store/session";
import { useOverlayStore } from "./store/overlay";

let overlayContainer: HTMLElement | null = null;
let reactRoot: any = null;

// Function to inject the overlay container
const injectOverlayContainer = () => {
  if (document.getElementById("asklynk-floating-overlay-container")) {
    return;
  }

  overlayContainer = document.createElement("div");
  overlayContainer.id = "asklynk-floating-overlay-container";
  document.body.appendChild(overlayContainer);

  // Apply styles
  overlayContainer.style.position = "fixed";
  overlayContainer.style.top = "0";
  overlayContainer.style.left = "0";
  overlayContainer.style.width = "100%";
  overlayContainer.style.height = "100%";
  overlayContainer.style.zIndex = "2147483647";
  overlayContainer.style.pointerEvents = "none";
  overlayContainer.style.visibility = "hidden";
  overlayContainer.style.opacity = "0";
  overlayContainer.style.transition = "opacity 0.3s ease";
};

// Function to render the React component
const renderOverlay = () => {
  if (!overlayContainer) return;

  reactRoot = createRoot(overlayContainer);
  reactRoot.render(
    <React.StrictMode>
      <FloatingOverlay />
    </React.StrictMode>
  );
};

// Function to show the overlay
const showOverlay = () => {
  if (overlayContainer) {
    overlayContainer.style.pointerEvents = "auto";
    overlayContainer.style.visibility = "visible";
    overlayContainer.style.opacity = "1";
  }
};

// Function to hide the overlay
const hideOverlay = () => {
  if (overlayContainer) {
    overlayContainer.style.pointerEvents = "none";
    overlayContainer.style.visibility = "hidden";
    overlayContainer.style.opacity = "0";
  }
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(
  (message: any, sender: any, sendResponse: any) => {
    if (message.action === "toggleAssistant") {
      const currentState = overlayContainer?.style.pointerEvents === "auto";
      if (currentState) {
        hideOverlay();
      } else {
        showOverlay();
      }
    }
  }
);

// Initial setup
injectOverlayContainer();
renderOverlay();

// Detect platform and set initial state
const platform = detectPlatform(window.location.href);
console.log("Detected platform:", platform);

// Initialize stores
useAuthStore.getState().checkAuth();
useSessionStore.getState().loadSessions();
useOverlayStore.getState().setActiveTab(null);

// Add event listener for custom events
document.addEventListener("asklynk-show-dashboard", () => {
  useOverlayStore.getState().setActiveTab(null);
  showOverlay();
});
