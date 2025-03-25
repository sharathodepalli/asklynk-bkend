// Enhanced fallback mechanism for AskLynk
// This provides a more reliable way to detect when the main overlay fails to render

// Define global state interface for TypeScript
declare global {
  interface Window {
    __ASKLYNK_STATE__: {
      showLoginModal: boolean;
      showOverlay: boolean;
    };
  }
}

/**
 * Interface for the fallback system functions
 */
interface FallbackSystem {
  initialize: () => void;
  setupFallbackTimers: () => void;
  createFallbackDialog: () => void;
  checkMainUIVisibility: () => boolean;
  clearFallbackTimers: () => void;
}

/**
 * Creates an improved fallback system for AskLynk
 * @returns {FallbackSystem} Utility functions for fallback management
 */
export const createFallbackSystem = (): FallbackSystem => {
  let fallbackTimers: number[] = [];
  let fallbackDialogCreated: boolean = false;
  
  // Clear any existing fallback timers
  const clearFallbackTimers = (): void => {
    fallbackTimers.forEach(timer => window.clearTimeout(timer));
    fallbackTimers = [];
  };
  
  // Check if the main UI is visible and working
  // Check if the main UI is visible and working
const checkMainUIVisibility = (): boolean => {
  const overlayContainer = document.getElementById('asklynk-floating-overlay-container');
  
  // Check for either dialog or minimize button (for minimized state)
  const overlayDialog = document.querySelector('.asklynk-dialog');
  const minimizeButton = document.querySelector('button.bg-indigo-600');
  
  const loadingIndicator = document.querySelector('.asklynk-loading');
  
  // If we see a loading indicator, wait for it to finish
  if (loadingIndicator) return false;
  
  // Check if we're in minimized state - this is also a valid state!
  const isMinimizedVisible = !!minimizeButton && 
                            window.getComputedStyle(minimizeButton).display !== 'none' &&
                            window.getComputedStyle(minimizeButton).visibility !== 'hidden';
  
  // UI is visible if either the dialog is visible or we're in minimized state
  return Boolean((overlayContainer && overlayDialog) || isMinimizedVisible);
};
  
  // Create a simple fallback dialog when the main UI fails
  const createFallbackDialog = (): void => {
    if (fallbackDialogCreated) return;
    
    console.log("[AskLynk] Creating fallback dialog");
    
    const dialog = document.createElement("div");
    dialog.id = "asklynk-fallback-dialog";
    dialog.style.position = "fixed";
    dialog.style.top = "50%";
    dialog.style.left = "50%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.backgroundColor = "white";
    dialog.style.padding = "20px";
    dialog.style.borderRadius = "8px";
    dialog.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    dialog.style.zIndex = "2147483647"; // Maximum z-index
    dialog.style.width = "400px";
    dialog.style.maxWidth = "90%";
    dialog.style.pointerEvents = "auto";
    
    dialog.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="margin: 0; color: #4f46e5; font-size: 18px;">AskLynk</h2>
        <button id="asklynk-fallback-retry" style="background: none; border: none; cursor: pointer; color: #4f46e5;">
          Try Again
        </button>
      </div>
      <p style="margin: 0 0 15px 0;">The AskLynk interface couldn't be loaded properly. You can:</p>
      <div style="display: flex; gap: 10px;">
        <button id="asklynk-fallback-dashboard" style="flex: 1; padding: 8px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Open Dashboard
        </button>
        <button id="asklynk-fallback-close" style="flex: 1; padding: 8px; background: #e5e7eb; color: #374151; border: none; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    fallbackDialogCreated = true;
    
    // Add button event listeners
    const closeButton = document.getElementById("asklynk-fallback-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        dialog.remove();
        fallbackDialogCreated = false;
      });
    }
    
    const retryButton = document.getElementById("asklynk-fallback-retry");
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        dialog.remove();
        fallbackDialogCreated = false;
        
        // Attempt to show the main UI again
        if (window.__ASKLYNK_STATE__) {
          window.__ASKLYNK_STATE__.showOverlay = true;
        }
        
        // Set up fallback timers again
        setupFallbackTimers();
      });
    }
    
    const dashboardButton = document.getElementById("asklynk-fallback-dashboard");
    if (dashboardButton) {
      dashboardButton.addEventListener("click", () => {
        dialog.remove();
        fallbackDialogCreated = false;
        
        // Force show the overlay with null tab to show dashboard
        if (window.__ASKLYNK_STATE__) {
          window.__ASKLYNK_STATE__.showOverlay = true;
          
          // Try to reset the tab to show dashboard
          try {
            const event = new CustomEvent('asklynk-show-dashboard', { 
              detail: { showDashboard: true } 
            });
            document.dispatchEvent(event);
          } catch (e) {
            console.error("[AskLynk] Error dispatching dashboard event:", e);
          }
        }
      });
    }
  };
  
  // Set up tiered fallback timers (500ms, 2s, 5s)
  const setupFallbackTimers = (): void => {
    clearFallbackTimers();
    
    // First check after 500ms
    fallbackTimers.push(window.setTimeout(() => {
      if (!checkMainUIVisibility() && window.__ASKLYNK_STATE__?.showOverlay) {
        console.log("[AskLynk] UI not visible after 500ms, waiting longer...");
      }
    }, 500));
    
    // Second check after 2s
    fallbackTimers.push(window.setTimeout(() => {
      if (!checkMainUIVisibility() && window.__ASKLYNK_STATE__?.showOverlay) {
        console.log("[AskLynk] UI not visible after 2s, trying once more...");
        
        // Force a re-render attempt
        const currentState = window.__ASKLYNK_STATE__?.showOverlay;
        if (window.__ASKLYNK_STATE__) {
          window.__ASKLYNK_STATE__.showOverlay = false;
          setTimeout(() => {
            if (window.__ASKLYNK_STATE__) {
              window.__ASKLYNK_STATE__.showOverlay = Boolean(currentState);
            }
          }, 100);
        }
      }
    }, 2000));
    
    // Final check after 5s - show fallback if needed
    fallbackTimers.push(window.setTimeout(() => {
      if (!checkMainUIVisibility() && window.__ASKLYNK_STATE__?.showOverlay) {
        console.log("[AskLynk] UI still not visible after 5s, showing fallback");
        createFallbackDialog();
      }
    }, 5000));
  };
  
  // Initialize fallback system
  const initialize = (): void => {
    // Set up listeners for UI state changes
    const observer = new MutationObserver(() => {
      if (window.__ASKLYNK_STATE__?.showOverlay) {
        setupFallbackTimers();
      } else {
        clearFallbackTimers();
        if (fallbackDialogCreated) {
          const dialog = document.getElementById("asklynk-fallback-dialog");
          if (dialog) {
            dialog.remove();
            fallbackDialogCreated = false;
          }
        }
      }
    });
    
    // Start observing when available
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
    
    // Listen for dashboard show requests
    document.addEventListener('asklynk-show-dashboard', (event) => {
      if (window.__ASKLYNK_STATE__) {
        console.log("[AskLynk] Received request to show dashboard");
        
        // Toggle overlay off and on to force refresh
        const wasShowing = window.__ASKLYNK_STATE__.showOverlay;
        window.__ASKLYNK_STATE__.showOverlay = false;
        
        setTimeout(() => {
          if (window.__ASKLYNK_STATE__) {
            window.__ASKLYNK_STATE__.showOverlay = true;
          }
        }, 100);
      }
    });
  };
  
  return {
    initialize,
    setupFallbackTimers,
    createFallbackDialog,
    checkMainUIVisibility,
    clearFallbackTimers
  };
};