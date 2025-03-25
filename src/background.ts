// // Background script for AskLynk extension
// console.log('[AskLynk] Background script loaded');

// // Track active meeting tabs
// const activeMeetingTabs: Record<number, {
//   platform: string;
//   url: string;
// }> = {};

// // Listen for installation
// chrome.runtime.onInstalled.addListener(() => {
//   console.log('[AskLynk] Extension installed');
// });

// // Handle when extension icon is clicked
// chrome.action.onClicked.addListener((tab) => {
//   if (tab.id) {
//     console.log(`[AskLynk] Extension icon clicked in tab ${tab.id}`);
//     chrome.tabs.sendMessage(tab.id, { action: "toggleAssistant" });
//   }
// });

// // Check if a URL is a meeting platform
// function isMeetingPlatform(url: string): { isMeeting: boolean, platform: string | null } {
//   if (!url) return { isMeeting: false, platform: null };
  
//   if (url.includes('zoom.us')) {
//     return { isMeeting: true, platform: 'zoom' };
//   }
//   if (url.includes('meet.google.com')) {
//     return { isMeeting: true, platform: 'google-meet' };
//   }
//   if (url.includes('teams.microsoft.com')) {
//     return { isMeeting: true, platform: 'ms-teams' };
//   }
//   if (url.includes('webex.com/meet')) {
//     return { isMeeting: true, platform: 'webex' };
//   }
  
//   return { isMeeting: false, platform: null };
// }

// // Listen for tab updates to know when the user navigates to a meeting platform
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete' && tab.url) {
//     // Check if the URL matches any of our supported meeting platforms
//     const { isMeeting, platform } = isMeetingPlatform(tab.url);
    
//     if (isMeeting && platform) {
//       console.log(`[AskLynk] Meeting platform detected: ${platform} in tab ${tabId}`);
      
//       // Store this tab as an active meeting
//       activeMeetingTabs[tabId] = {
//         platform,
//         url: tab.url
//       };
      
//       // Enable the extension icon
//       chrome.action.setIcon({
//         tabId: tabId,
//         path: {
//           "16": "icons/icon16.png",
//           "32": "icons/icon32.png",
//           "48": "icons/icon48.png",
//           "128": "icons/icon128.png"
//         }
//       });
      
//       // Set badge text to show platform
//       chrome.action.setBadgeText({
//         tabId: tabId, 
//         text: platform.substring(0, 1).toUpperCase()
//       });
      
//       // Set badge color based on platform
//       let color = '#4285F4'; // Default blue
//       if (platform === 'zoom') color = '#2D8CFF';
//       if (platform === 'ms-teams') color = '#6264A7';
//       if (platform === 'webex') color = '#00CF64';
      
//       chrome.action.setBadgeBackgroundColor({
//         tabId: tabId,
//         color: color
//       });
//     } else {
//       // Not a meeting platform, remove from active meetings if it was there
//       if (activeMeetingTabs[tabId]) {
//         console.log(`[AskLynk] Tab ${tabId} is no longer on a meeting platform`);
//         delete activeMeetingTabs[tabId];
        
//         // Reset the extension icon
//         chrome.action.setIcon({
//           tabId: tabId,
//           path: {
//             "16": "icons/icon16.png",
//             "32": "icons/icon32.png",
//             "48": "icons/icon48.png",
//             "128": "icons/icon128.png"
//           }
//         });
        
//         // Clear badge
//         chrome.action.setBadgeText({
//           tabId: tabId, 
//           text: ''
//         });
//       }
//     }
//   }
// });

// // Clean up when tabs are closed
// chrome.tabs.onRemoved.addListener((tabId) => {
//   if (activeMeetingTabs[tabId]) {
//     console.log(`[AskLynk] Meeting tab ${tabId} closed`);
//     delete activeMeetingTabs[tabId];
//   }
// });

// // Listen for messages from content script
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log('[AskLynk] Message received:', message);
  
//   if (message.action === 'contentScriptInitialized' && sender.tab?.id) {
//     console.log(`[AskLynk] Content script initialized in tab ${sender.tab.id} on ${message.platform}`);
    
//     // If we have platform info, update our tracking
//     if (message.platform && sender.tab.url) {
//       activeMeetingTabs[sender.tab.id] = {
//         platform: message.platform,
//         url: sender.tab.url
//       };
      
//       // Update badge
//       chrome.action.setBadgeText({
//         tabId: sender.tab.id, 
//         text: message.platform.substring(0, 1).toUpperCase()
//       });
//     }
//   }
  
//   // Always respond to keep the connection alive
//   sendResponse({ success: true });
//   return true;
// });


// background.ts
chrome.runtime.onInstalled.addListener(() => {
  console.log('AskLynk extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "toggleAssistant" });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  if (message.action === 'contentScriptReady') {
    console.log('Content script ready');
  }
});