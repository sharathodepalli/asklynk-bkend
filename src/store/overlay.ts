// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

// type Tab = 'ai' | 'chat' | 'anonymous' | 'polls' | null;

// interface OverlayState {
//   activeTab: Tab;
//   isMinimized: boolean;
//   position: { x: number; y: number };
//   setActiveTab: (tab: Tab) => void;
//   setMinimized: (minimized: boolean) => void;
//   toggleTab: (tab: Tab) => void;
//   closeOverlay: () => void;
//   setPosition: (position: { x: number; y: number }) => void;
// }

// export const useOverlayStore = create<OverlayState>()(
//   persist(
//     (set) => ({
//       activeTab: null,
//       isMinimized: false,
//       position: { x: 20, y: 20 },
//       setActiveTab: (tab) => set({ activeTab: tab, isMinimized: false }),
//       setMinimized: (minimized) => set({ isMinimized: minimized }),
//       toggleTab: (tab) => set((state) => ({
//         activeTab: state.activeTab === tab ? null : tab,
//         isMinimized: false
//       })),
//       closeOverlay: () => set({ activeTab: null, isMinimized: false }),
//       setPosition: (position) => set({ position })
//     }),
//     {
//       name: 'asklynk-overlay',
//       partialize: (state) => ({
//         position: state.position,
//         isMinimized: state.isMinimized
//       })
//     }
//   )
// );




// // --------------------------------------------------------
// // src/store/overlay.ts



// import { create } from 'zustand';



// // Debug flag - set to true to enable extensive logging
// const DEBUG_MODE = true;

// // Enhanced logging function
// const debugLog = (...args: any[]): void => {
//   if (DEBUG_MODE) {
//     console.log(`[AskLynk Debug]`, ...args);
//   }
// };

// // Error logging function that always runs regardless of debug mode
// const errorLog = (...args: any[]): void => {
//   console.error(`[AskLynk Error]`, ...args);
// };

// // Inject a debug overlay for direct interaction
// const injectDebugOverlay = (): void => {
//   if (!DEBUG_MODE) return;
  
//   // Check if debug overlay already exists
//   if (document.getElementById('asklynk-debug-overlay')) return;
  
//   debugLog('Injecting debug overlay');
  
//   // Create debug overlay
//   const debugOverlay = document.createElement('div');
//   debugOverlay.id = 'asklynk-debug-overlay';
//   debugOverlay.style.position = 'fixed';
//   debugOverlay.style.bottom = '10px';
//   debugOverlay.style.left = '10px';
//   debugOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
//   debugOverlay.style.color = '#00ff00';
//   debugOverlay.style.padding = '10px';
//   debugOverlay.style.borderRadius = '5px';
//   debugOverlay.style.zIndex = '999999';
//   debugOverlay.style.maxWidth = '300px';
//   debugOverlay.style.maxHeight = '200px';
//   debugOverlay.style.overflow = 'auto';
//   debugOverlay.style.fontSize = '12px';
//   debugOverlay.style.fontFamily = 'monospace';
  
//   // Create buttons for direct interaction
//   const showLoginButton = document.createElement('button');
//   showLoginButton.innerText = 'Show Login';
//   showLoginButton.style.margin = '5px';
//   showLoginButton.style.padding = '5px';
//   showLoginButton.addEventListener('click', () => {
//     debugLog('Debug: Forcing login modal to show');
//     injectOverlayContainer();
//     window.__ASKLYNK_STATE__.showLoginModal = true;
//   });
  
//   const resetButton = document.createElement('button');
//   resetButton.innerText = 'Reset App';
//   resetButton.style.margin = '5px';
//   resetButton.style.padding = '5px';
//   resetButton.addEventListener('click', () => {
//     debugLog('Debug: Resetting app state');
//     window.__ASKLYNK_STATE__.showLoginModal = false;
//     window.__ASKLYNK_STATE__.showOverlay = false;
//     chrome.storage.local.remove(["authUser"]);
//     location.reload();
//   });
  
//   const statusDiv = document.createElement('div');
//   statusDiv.id = 'asklynk-debug-status';
//   statusDiv.style.marginTop = '10px';
//   statusDiv.innerText = 'Status: Initializing...';
  
//   // Add components to overlay
//   debugOverlay.appendChild(showLoginButton);
//   debugOverlay.appendChild(resetButton);
//   debugOverlay.appendChild(statusDiv);
  
//   // Append to body
//   document.body.appendChild(debugOverlay);
  
//   // Update status periodically
//   setInterval(() => {
//     const statusEl = document.getElementById('asklynk-debug-status');
//     if (statusEl) {
//       statusEl.innerText = `Status: 
// Button: ${document.getElementById('asklynk-button') ? 'Exists' : 'Missing'}
// Login: ${window.__ASKLYNK_STATE__.showLoginModal ? 'Showing' : 'Hidden'}
// Overlay: ${window.__ASKLYNK_STATE__.showOverlay ? 'Showing' : 'Hidden'}
// Time: ${new Date().toLocaleTimeString()}`;
//     }
//   }, 1000);
  
//   debugLog('Debug overlay injected');
// };

// // Initialize debug tools
// const initDebugTools = (): void => {
//   if (!DEBUG_MODE) return;
  
//   debugLog('Initializing debug tools');
  
//   // Inject debug overlay
//   injectDebugOverlay();
  
//   // Log extension environment
//   debugLog('Extension environment:', {
//     url: window.location.href,
//     userAgent: navigator.userAgent,
//     viewportWidth: window.innerWidth,
//     viewportHeight: window.innerHeight
//   });
  
//   // Add global error handler
//   window.addEventListener('error', (event) => {
//     errorLog('Global error caught:', event.error);
//   });
  
//   debugLog('Debug tools initialized');
// };

// export type OverlayTab = 'ai' | 'chat' | 'anonymous' | 'polls';

// interface Position {
//   x: number;
//   y: number;
// }

// // Use an interface that includes all required methods
// export interface OverlayStore {
//   activeTab: OverlayTab | null;
//   isMinimized: boolean;
//   position: Position;
//   toggleTab: (tab: OverlayTab) => void;
//   setActiveTab: (tab: OverlayTab | null) => void; // Add this method
//   setMinimized: (minimized: boolean) => void;
//   closeOverlay: () => void;
//   setPosition: (position: Position) => void;
// }

// export const useOverlayStore = create<OverlayStore>((set) => {
//   const store = {
//     activeTab: null as OverlayTab | null,
//     isMinimized: true,
//     position: { x: window.innerWidth - 320, y: 20 },
    
//     toggleTab: (tab: OverlayTab) => 
//       set((state) => ({
//         activeTab: state.activeTab === tab ? null : tab,
//         isMinimized: false,
//       })),
    
//     // Add the setActiveTab method
//     setActiveTab: (tab: OverlayTab | null) =>
//       set({ activeTab: tab }),
      
//     setMinimized: (minimized: boolean) => 
//       set({ isMinimized: minimized }),
      
//     closeOverlay: () => 
//       set({ activeTab: null, isMinimized: true }),
      
//     setPosition: (position: Position) => 
//       set({ position }),
//   };
  
//   // Make the store globally accessible for the content script
//   if (typeof window !== 'undefined') {
//     window.__ASKLYNK_OVERLAY_STORE__ = store;
//   }
  
//   return store;
// });

// function injectOverlayContainer() {
//   throw new Error('Function not implemented.');
// }
//--------------------------------------------------------------------------------
// src/store/overlay.ts
import { create } from 'zustand';

export type OverlayTab = 'ai' | 'chat' | 'anonymous' | 'polls';

interface Position {
  x: number;
  y: number;
}

export interface OverlayStore {
  activeTab: OverlayTab | null;
  isMinimized: boolean;
  position: Position;
  toggleTab: (tab: OverlayTab) => void;
  setActiveTab: (tab: OverlayTab | null) => void;
  setMinimized: (minimized: boolean) => void;
  closeOverlay: () => void;
  setPosition: (position: Position) => void;
}

function injectOverlayContainer() {
  if (document.getElementById('asklynk-overlay-container')) return;

  const container = document.createElement('div');
  container.id = 'asklynk-overlay-container';
  container.className = 'asklynk-overlay-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.zIndex = '999999';
  container.style.pointerEvents = 'none';

  document.body.appendChild(container);

  const overlayElement = document.createElement('div');
  overlayElement.id = 'asklynk-floating-overlay';
  overlayElement.style.position = 'absolute';
  overlayElement.style.pointerEvents = 'auto';
  overlayElement.style.width = '320px';
  overlayElement.style.height = 'auto';
  overlayElement.style.background = 'white';
  overlayElement.style.borderRadius = '8px';
  overlayElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  overlayElement.style.transition = 'all 0.3s ease';

  container.appendChild(overlayElement);
}

const initialPosition = {
  x: window.innerWidth > 320 ? (window.innerWidth - 320) / 2 : 10,
  y: 20
};

export const useOverlayStore = create<OverlayStore>((set) => {
  const store = {
    activeTab: null as OverlayTab | null,
    isMinimized: true,
    position: initialPosition,
    
    toggleTab: (tab: OverlayTab) => 
      set((state) => ({
        activeTab: state.activeTab === tab ? null : tab,
        isMinimized: false,
      })),
    
    setActiveTab: (tab: OverlayTab | null) =>
      set({ activeTab: tab, isMinimized: false }),
      
    setMinimized: (minimized: boolean) => 
      set({ isMinimized: minimized }),
      
    closeOverlay: () => 
      set({ activeTab: null, isMinimized: true }),
      
    setPosition: (position: Position) => 
      set({ position }),
  };
  
  if (typeof window !== 'undefined') {
    window.__ASKLYNK_OVERLAY_STORE__ = store;
    injectOverlayContainer();
  }
  
  return store;
});