// // src/content.tsx
// import React from "react";
// import ReactDOM from "react-dom/client";
// import { ChatHead } from "./components/ChatHead";
// import { OverlayProvider } from "./components/OverlayProvider";
// import "./content.css";

// // Define message types for type safety
// interface Message {
//   action: string;
//   [key: string]: any;
// }

// // Function to determine which meeting platform we're on
// function detectPlatform(): string {
//   const url = window.location.href;
//   if (url.includes("zoom.us")) return "zoom";
//   if (url.includes("meet.google.com")) return "google-meet";
//   if (url.includes("teams.microsoft.com")) return "ms-teams";
//   if (url.includes("webex.com/meet")) return "webex";
//   return "unknown";
// }

// // Helper to log with a prefix for easier debugging
// const log = (message: string, ...args: any[]) => {
//   console.log(`[AskLynk] ${message}`, ...args);
// };

// // Create container for our React app
// function createAppContainer() {
//   const container = document.createElement("div");
//   container.id = "asklynk-container";
//   container.setAttribute("data-platform", detectPlatform());
//   document.body.appendChild(container);
//   return container;
// }

// // Initialize the application
// async function initApp() {
//   log("Content script loaded");

//   // Check if we're on a supported platform
//   const platform = detectPlatform();
//   if (platform === "unknown") {
//     log("Not on a supported meeting platform");
//     return;
//   }

//   log(`Detected platform: ${platform}`);

//   // Wait for the page to be fully loaded
//   if (document.readyState !== "complete") {
//     await new Promise<void>((resolve) => {
//       window.addEventListener("load", () => resolve());
//     });
//   }

//   // Create the React container if it doesn't exist
//   const existingContainer = document.getElementById("asklynk-container");
//   const container = existingContainer || createAppContainer();

//   // Render the React application
//   const root = ReactDOM.createRoot(container);
//   root.render(
//     <React.StrictMode>
//       <OverlayProvider>
//         <ChatHead platform={platform} />
//       </OverlayProvider>
//     </React.StrictMode>
//   );

//   // Notify the background script that we're ready
//   try {
//     chrome.runtime.sendMessage({
//       action: "contentScriptInitialized",
//       platform,
//     } as Message);
//     log("Sent initialization message to background script");
//   } catch (error) {
//     console.error("[AskLynk] Failed to send initialization message:", error);
//   }
// }

// // Listen for messages from the background script
// chrome.runtime.onMessage.addListener(
//   (message: Message, sender, sendResponse) => {
//     if (message.action === "toggleAssistant") {
//       // Dispatch a custom event that the overlay provider can listen for
//       const container = document.getElementById("asklynk-container");
//       if (container) {
//         container.dispatchEvent(new CustomEvent("toggleOverlay"));
//       }
//     }

//     // Always respond to keep the connection alive
//     sendResponse({ success: true });
//     return true;
//   }
// );

// // Start the application
// initApp();

// (function () {
//   console.log("AskLynk Content Script Loaded");

//   // Helper to detect meeting platform
//   function detectPlatform() {
//     const url = window.location.href;
//     if (url.includes("zoom.us")) return "zoom";
//     if (url.includes("meet.google.com")) return "google-meet";
//     if (url.includes("teams.microsoft.com")) return "ms-teams";
//     if (url.includes("webex.com/meet")) return "webex";
//     return "unknown";
//   }

//   // Create container for UI
//   function createAppContainer() {
//     const container = document.createElement("div");
//     container.id = "asklynk-container";
//     container.setAttribute("data-platform", detectPlatform());
//     document.body.appendChild(container);
//     return container;
//   }

//   // Wait for page load before initializing
//   document.addEventListener("DOMContentLoaded", function () {
//     console.log("Initializing AskLynk Content Script");

//     const existingContainer = document.getElementById("asklynk-container");
//     const container = existingContainer || createAppContainer();

//     // Create a simple UI element
//     const button = document.createElement("button");
//     button.innerText = "Toggle AskLynk";
//     button.style.position = "fixed";
//     button.style.top = "10px";
//     button.style.right = "10px";
//     button.onclick = () => alert("AskLynk activated!");
//     container.appendChild(button);
//   });

//   // Handle messages from background script
//   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "toggleAssistant") {
//       console.log("Toggling Assistant UI");
//     }
//     sendResponse({ success: true });
//     return true;
//   });
// })();

//-----
// src/store/overlay.ts
// import React from "react";
// import { createRoot } from "react-dom/client";
// import { FloatingOverlay } from "./components/FloatingOverlay";
// import { OverlayProvider } from "./components/OverlayProvider";
// import { OverlayTab } from "./store/overlay";

// // Flag to track if the overlay has been injected
// let overlayInjected = false;
// let overlayVisible = false;

// // Function to inject the overlay container
// const injectOverlayContainer = () => {
//   if (overlayInjected) return;

//   console.log("[AskLynk] Injecting overlay container");

//   // Create a container for the overlay
//   const container = document.createElement("div");
//   container.id = "asklynk-floating-overlay";
//   container.style.position = "fixed";
//   container.style.top = "0";
//   container.style.left = "0";
//   container.style.width = "100%";
//   container.style.height = "100%";
//   container.style.zIndex = "9999";
//   container.style.pointerEvents = "none"; // Allow interaction with page beneath
//   document.body.appendChild(container);

//   // Create our React root and render the overlay (initially hidden)
//   const root = createRoot(container);
//   root.render(
//     <React.StrictMode>
//       <OverlayProvider>
//         <FloatingOverlay />
//       </OverlayProvider>
//     </React.StrictMode>
//   );

//   overlayInjected = true;
//   console.log("[AskLynk] Overlay container injected");
// };

// // Function to toggle the overlay visibility
// const toggleOverlay = () => {
//   const overlayStore = window.__ASKLYNK_OVERLAY_STORE__;

//   if (overlayStore) {
//     if (!overlayVisible) {
//       // If overlay is hidden, show it and set activeTab to 'ai'
//       overlayStore.setMinimized(false);
//       overlayStore.toggleTab("ai" as OverlayTab);
//       console.log("[AskLynk] Showing overlay");
//     } else {
//       // If overlay is visible, hide it
//       overlayStore.setMinimized(true);
//       console.log("[AskLynk] Hiding overlay");
//     }

//     overlayVisible = !overlayVisible;
//   } else {
//     console.error("[AskLynk] Overlay store not found");
//   }
// };

// // Function to inject the AskLynk button for Google Meet
// const injectAskLynkButton = () => {
//   // Check if we're on Google Meet
//   if (!window.location.href.includes("meet.google.com")) return;

//   // Check if button already exists
//   if (document.getElementById("asklynk-button")) return;

//   console.log("[AskLynk] Injecting AskLynk button for Google Meet");

//   // Create the button
//   const button = document.createElement("button");
//   button.id = "asklynk-button";
//   button.innerText = "AskLynk";
//   button.style.position = "fixed";
//   button.style.top = "10px";
//   button.style.right = "10px";
//   button.style.zIndex = "9000";
//   button.style.padding = "8px 16px";
//   button.style.backgroundColor = "#4f46e5"; // Indigo color
//   button.style.color = "white";
//   button.style.border = "none";
//   button.style.borderRadius = "4px";
//   button.style.cursor = "pointer";
//   button.style.fontFamily = "Arial, sans-serif";
//   button.style.fontWeight = "bold";

//   // Add hover effect
//   button.onmouseover = () => {
//     button.style.backgroundColor = "#4338ca";
//   };
//   button.onmouseout = () => {
//     button.style.backgroundColor = "#4f46e5";
//   };

//   // Add click handler
//   button.onclick = () => {
//     // Ensure overlay is injected
//     injectOverlayContainer();

//     // Toggle the overlay
//     setTimeout(() => toggleOverlay(), 100);
//   };

//   // Append to body
//   document.body.appendChild(button);
//   console.log("[AskLynk] AskLynk button injected");
// };

// // Listen for messages from the extension popup
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("[AskLynk] Received message:", message);

//   if (message.action === "toggleAssistant") {
//     // Ensure overlay is injected
//     injectOverlayContainer();

//     // Toggle the overlay
//     setTimeout(() => toggleOverlay(), 100);

//     sendResponse({ success: true });
//   }

//   return true; // Keep the message channel open for async responses
// });

// // Initialize the extension
// const initExtension = () => {
//   console.log("[AskLynk] Initializing extension");

//   // Check if we should initialize based on stored settings
//   chrome.storage.sync.get(["enabled"], (result) => {
//     const enabled = result.enabled !== false; // Default to enabled if not set

//     if (enabled) {
//       // Inject overlay container
//       injectOverlayContainer();

//       // Inject AskLynk button for Google Meet
//       injectAskLynkButton();

//       // Try to inject the button again if the Meet UI loads slowly
//       setTimeout(injectAskLynkButton, 3000);
//       setTimeout(injectAskLynkButton, 6000);
//     }
//   });
// };

// // Run when the page is loaded
// if (document.readyState === "complete") {
//   initExtension();
// } else {
//   window.addEventListener("load", initExtension);
// }

// // Also try again after a delay to handle dynamic page loads
// setTimeout(initExtension, 2000);
//____________________________________________________________________________________________________________________
// Modified content.tsx with pointer-events fixes
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { FloatingOverlay } from "./components/FloatingOverlay";
import { OverlayProvider } from "./components/OverlayProvider";
import { AuthModal } from "./components/AuthModal";
import { useAuthStore } from "./store/auth";
import { OverlayTab, useOverlayStore } from "./store/overlay";

import "./styles/asklynk.css";

import { createFallbackSystem } from "./utils/fallback";

// Initialize fallback system if in extension mode
if (window.chrome && chrome.runtime) {
  const fallbackSystem = createFallbackSystem();
  fallbackSystem.initialize();
}
// Global state to track app state
declare global {
  interface Window {
    __ASKLYNK_STATE__: {
      showLoginModal: boolean;
      showOverlay: boolean;
    };
    createAskLynkDialog: () => string;
    askLynkTest: {
      showLogin: () => void;
      showOverlay: () => void;
      checkState: () => void;
    };
  }
}

// Initialize global state
window.__ASKLYNK_STATE__ = {
  showLoginModal: false,
  showOverlay: false,
};

// Flag to track if the overlay has been injected
let overlayInjected = false;

// Function to inject the overlay container
const injectOverlayContainer = () => {
  if (overlayInjected) return;

  console.log("[AskLynk] Injecting overlay container");

  // Create a container for the overlay with enhanced visibility
  const container = document.createElement("div");
  container.id = "asklynk-floating-overlay";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.zIndex = "2147483647"; // Maximum z-index
  container.style.pointerEvents = "auto";
  container.style.visibility = "visible";
  container.style.opacity = "1";
  document.body.appendChild(container);

  // Create our React root and render the overlay (initially hidden)
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <OverlayProvider>
        <AskLynkApp />
      </OverlayProvider>
    </React.StrictMode>
  );

  overlayInjected = true;
  console.log("[AskLynk] Overlay container injected");
};

// Main App Container component to handle auth state and app flow

const AskLynkApp = () => {
  console.log("[AskLynk] AskLynkApp component rendered");

  const { user, isLoading, checkAuth } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const { setActiveTab } = useOverlayStore();
  // Check auth status on mount
  useEffect(() => {
    console.log("[AskLynk] Checking auth");
    checkAuth();
  }, [checkAuth]);
  useEffect(() => {
    if (user) {
      setActiveTab(null); // This ensures dashboard is shown initially
    }
  }, [user, setActiveTab]);

  // Check global state for changes
  useEffect(() => {
    const interval = setInterval(() => {
      const state = window.__ASKLYNK_STATE__;
      if (state.showLoginModal !== showLoginModal) {
        console.log(
          "[AskLynk] Updating showLoginModal from global state",
          state.showLoginModal
        );
        setShowLoginModal(state.showLoginModal);
      }
      if (state.showOverlay !== showOverlay) {
        console.log(
          "[AskLynk] Updating showOverlay from global state",
          state.showOverlay
        );
        setShowOverlay(state.showOverlay);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [showLoginModal, showOverlay]);

  // Update global state when component state changes
  useEffect(() => {
    window.__ASKLYNK_STATE__.showLoginModal = showLoginModal;
    window.__ASKLYNK_STATE__.showOverlay = showOverlay;
  }, [showLoginModal, showOverlay]);

  // Debug component mount status
  useEffect(() => {
    console.log("[AskLynk] Component mount status:");
    console.log("- User logged in:", !!user);
    console.log("- Show login modal:", showLoginModal);
    console.log("- Show overlay:", showOverlay);

    // Check if conditions for showing are met
    if (user && showOverlay) {
      console.log("[AskLynk] Conditions met to show overlay");
    } else {
      console.log("[AskLynk] Conditions NOT met to show overlay");
      console.log(
        "  Reason:",
        !user ? "User not logged in" : "Overlay flag not set"
      );
    }
  }, [user, showLoginModal, showOverlay]);

  console.log("[AskLynk] Render state:", {
    user: user ? "logged in" : "not logged in",
    isLoading,
    showLoginModal,
    showOverlay,
  });

  // Handle login modal close (including success handling)
  const handleLoginClose = () => {
    setShowLoginModal(false);
    window.__ASKLYNK_STATE__.showLoginModal = false;

    // If user is logged in after closing the modal, show the overlay
    if (user) {
      setShowOverlay(true);
      window.__ASKLYNK_STATE__.showOverlay = true;
    }
  };

  if (isLoading) {
    return (
      <div className="pointer-events-auto fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
        <div className="animate-spin h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-center mt-2 text-gray-600">Loading AskLynk...</p>
      </div>
    );
  }

  // If user is not logged in and the login modal should be shown
  if (!user && showLoginModal) {
    console.log("[AskLynk] Showing login modal");
    return (
      <div className="pointer-events-auto">
        <AuthModal isOpen={true} onClose={handleLoginClose} />
      </div>
    );
  }

  // If user is logged in and overlay should be shown
  if (user && showOverlay) {
    console.log("[AskLynk] Showing floating overlay, user role:", user.role);
    return (
      <div className="pointer-events-auto">
        <FloatingOverlay />
      </div>
    );
  }

  // Default case - nothing to show
  return null;
};

// Function to inject the AskLynk button for Google Meet with improved click handling
const injectAskLynkButton = () => {
  // Check if we're on Google Meet
  if (!window.location.href.includes("meet.google.com")) return;

  // Check if button already exists
  if (document.getElementById("asklynk-button")) return;

  console.log("[AskLynk] Injecting AskLynk button for Google Meet");

  // Create the button
  const button = document.createElement("button");
  button.id = "asklynk-button";
  button.innerText = "AskLynk";
  button.style.position = "fixed";
  button.style.top = "10px";
  button.style.right = "10px";
  button.style.zIndex = "2147483647"; // Maximum z-index
  button.style.padding = "12px 24px";
  button.style.backgroundColor = "#4f46e5"; // Indigo color
  button.style.color = "white";
  button.style.border = "2px solid white";
  button.style.borderRadius = "4px";
  button.style.cursor = "pointer";
  button.style.fontFamily = "Arial, sans-serif";
  button.style.fontWeight = "bold";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.gap = "4px";
  button.style.userSelect = "none"; // Prevent selection
  button.style.pointerEvents = "auto"; // Ensure clicks work
  button.style.fontSize = "16px";
  button.style.boxShadow = "0 0 10px 5px rgba(0,0,0,0.3)"; // Add shadow

  // Add AskLynk icon (optional)
  const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  iconSvg.setAttribute("width", "18");
  iconSvg.setAttribute("height", "18");
  iconSvg.setAttribute("viewBox", "0 0 24 24");
  iconSvg.setAttribute("fill", "none");
  iconSvg.setAttribute("stroke", "currentColor");
  iconSvg.setAttribute("stroke-width", "2");
  iconSvg.setAttribute("stroke-linecap", "round");
  iconSvg.setAttribute("stroke-linejoin", "round");

  const iconPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  iconPath.setAttribute(
    "d",
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  );

  iconSvg.appendChild(iconPath);
  button.prepend(iconSvg);

  // Add hover effect with better visibility for debugging
  button.onmouseover = () => {
    button.style.backgroundColor = "#4338ca";
    console.log("[AskLynk] Button hover");
  };

  button.onmouseout = () => {
    button.style.backgroundColor = "#4f46e5";
  };

  const handleButtonClick = (e: MouseEvent) => {
    // Add explicit MouseEvent type
    e.preventDefault();
    e.stopPropagation();

    console.log("[AskLynk] Button clicked");

    // Check if overlay is just minimized
    const minimizeButton = document.querySelector(
      'button.bg-indigo-600[aria-label="Maximize overlay"]'
    );
    if (minimizeButton) {
      console.log("[AskLynk] Found minimize button, clicking it");
      (minimizeButton as HTMLButtonElement).click(); // Cast to HTMLButtonElement
      return false;
    }

    // If not just minimized, initialize and show overlay
    injectOverlayContainer();

    // Show overlay
    if (window.__ASKLYNK_STATE__) {
      window.__ASKLYNK_STATE__.showOverlay = true;
    }

    return false;
  };

  // Add multiple event listeners to ensure click is captured
  button.addEventListener("click", handleButtonClick, { capture: true });

  // Force callback execution on button click
  button.onclick = handleButtonClick;

  // Add a mousedown handler as well for more robust click detection
  button.addEventListener(
    "mousedown",
    (e: MouseEvent) => {
      console.log("[AskLynk] Button mousedown");
      e.stopPropagation();
    },
    { capture: true }
  );

  // Append to body with forced positioning
  document.body.appendChild(button);
  console.log("[AskLynk] AskLynk button injected");

  // Periodically check if button was removed or disabled and reinject if necessary
  setInterval(() => {
    const existingButton = document.getElementById("asklynk-button");
    if (!existingButton || existingButton.style.display === "none") {
      console.log("[AskLynk] Button missing or hidden, reinjecting");
      document.body.appendChild(button);
    }
  }, 5000);
};

// Alternative approach using MutationObserver to ensure stable injection
const setupButtonWithMutationObserver = () => {
  console.log("[AskLynk] Setting up MutationObserver for button injection");

  // First inject the button directly
  injectAskLynkButton();

  // Then set up observer to maintain the button
  const observer = new MutationObserver((mutations) => {
    const buttonExists = document.getElementById("asklynk-button");
    if (!buttonExists) {
      console.log("[AskLynk] Button not found after DOM mutation, reinjecting");
      injectAskLynkButton();
    }
  });

  // Start observing with a delay to ensure DOM is settled
  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    console.log("[AskLynk] MutationObserver started");
  }, 2000);
};

// Add global function to directly create and test dialog box
window.createAskLynkDialog = () => {
  console.log("[AskLynk] Manually creating dialog box");

  // Remove any existing dialog
  const existingDialog = document.getElementById("asklynk-dialog-box");
  if (existingDialog) existingDialog.remove();

  // Create new dialog
  const dialog = document.createElement("div");
  dialog.id = "asklynk-dialog-box";
  dialog.className = "asklynk-dialog";
  dialog.style.position = "fixed";
  dialog.style.top = "50%";
  dialog.style.left = "50%";
  dialog.style.transform = "translate(-50%, -50%)";
  dialog.style.backgroundColor = "white";
  dialog.style.padding = "20px";
  dialog.style.borderRadius = "8px";
  dialog.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
  dialog.style.zIndex = "9999999"; // Very high z-index
  dialog.style.width = "400px";
  dialog.style.maxWidth = "90%";

  // Add content
  dialog.innerHTML = `
    <h2 style="margin-top: 0; color: #4f46e5;">AskLynk Test Dialog</h2>
    <p>This is a test dialog created directly from the console.</p>
    <button 
      id="asklynk-close-dialog" 
      style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;"
    >
      Close
    </button>
  `;

  // Append to body
  document.body.appendChild(dialog);

  // Add close button functionality
  document
    .getElementById("asklynk-close-dialog")
    ?.addEventListener("click", () => {
      dialog.remove();
    });

  return "Dialog created. Check the center of your screen.";
};

console.log(
  "[AskLynk] Dialog test function added. Run window.createAskLynkDialog() to test."
);

// Initialize with enhanced button injection
const initExtension = () => {
  console.log("[AskLynk] Initializing extension with enhanced button handling");

  // Check if we should initialize based on stored settings
  chrome.storage.sync.get(["enabled"], (result) => {
    const enabled = result.enabled !== false; // Default to enabled if not set

    if (enabled) {
      // Inject overlay container
      injectOverlayContainer();

      // Use the enhanced button injection with MutationObserver
      setupButtonWithMutationObserver();

      // Add event listeners to the document to see if events are being captured
      document.addEventListener(
        "click",
        (e: MouseEvent) => {
          console.log(
            "[AskLynk] Document click detected at:",
            e.clientX,
            e.clientY
          );
        },
        true
      );

      // Additional attempt with delays
      setTimeout(injectAskLynkButton, 3000);
      setTimeout(injectAskLynkButton, 6000);
    }
  });
};

// Diagnostic function to check extension state
const diagnoseExtensionState = () => {
  console.log("[AskLynk] Diagnostic Info:");
  console.log("- URL:", window.location.href);
  console.log("- Button exists:", !!document.getElementById("asklynk-button"));
  console.log(
    "- Overlay container exists:",
    !!document.getElementById("asklynk-floating-overlay")
  );
  console.log("- Global state:", window.__ASKLYNK_STATE__);

  // Try to access chrome storage
  try {
    chrome.storage.local.get(["authUser"], (result) => {
      console.log("- Storage access:", result ? "Success" : "No data");
    });
  } catch (e: unknown) {
    console.log(
      "- Storage access error:",
      e instanceof Error ? e.message : String(e)
    );
  }
};

// Add direct testing functions
window.askLynkTest = {
  showLogin: () => {
    window.__ASKLYNK_STATE__.showLoginModal = true;
    console.log("[AskLynk] Attempted to show login modal via test function");
  },
  showOverlay: () => {
    window.__ASKLYNK_STATE__.showOverlay = true;
    console.log("[AskLynk] Attempted to show overlay via test function");
  },
  checkState: () => {
    console.log("[AskLynk] Current state:", window.__ASKLYNK_STATE__);
  },
};

console.log(
  "[AskLynk] Test functions added - use window.askLynkTest.showLogin() to test"
);

// Run diagnostics periodically
setInterval(diagnoseExtensionState, 10000);

// Run the enhanced initialization
if (document.readyState === "complete") {
  initExtension();
} else {
  window.addEventListener("load", (e: Event) => {
    initExtension();
  });
}

// Additional initialization attempt after a delay
setTimeout(initExtension, 2000);
