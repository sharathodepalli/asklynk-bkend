import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/auth";
import { LogOut, MessageCircle } from "lucide-react";

const Popup: React.FC = () => {
  const { user, isLoading, checkAuth, signOut } = useAuthStore();
  const [isEnabled, setIsEnabled] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Check authentication status
    checkAuth();

    // Load extension state from Chrome storage
    chrome.storage.sync.get(["enabled"], (result: { enabled?: boolean }) => {
      setIsEnabled(result.enabled !== false);
    });
  }, [checkAuth]);

  const toggleExtension = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    // Save to Chrome storage
    chrome.storage.sync.set({ enabled: newState });

    // Send message to active tab
    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs: chrome.tabs.Tab[]) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: newState ? "enable" : "disable",
          });
        }
      }
    );
  };

  const toggleOverlay = () => {
    // Send message to toggle overlay
    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs: chrome.tabs.Tab[]) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "toggleAssistant",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 w-64 h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 w-80 max-h-96 bg-gray-50 text-gray-800 overflow-y-auto">
      <div className="flex flex-col space-y-4">
        <h1 className="text-xl font-bold text-center flex items-center justify-center gap-2">
          <MessageCircle className="text-indigo-600" />
          AskLynk
        </h1>

        {/* User Authentication Status */}
        {user ? (
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{user.full_name}</p>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={signOut}
                className="text-red-600 hover:text-red-700"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Extension Controls */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Enable AskLynk</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isEnabled}
                onChange={toggleExtension}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Open Overlay Button */}
          {user && (
            <button
              onClick={toggleOverlay}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Open Chat Overlay
            </button>
          )}
        </div>

        {/* Supported Platforms */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <h3 className="font-medium mb-2">Supported Platforms</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {[
              "Zoom Meetings",
              "Google Meet",
              "Microsoft Teams",
              "Cisco Webex",
              "Canvas LMS",
              "Blackboard",
              "Moodle",
            ].map((platform) => (
              <li key={platform}>• {platform}</li>
            ))}
          </ul>
        </div>

        {/* Version Info */}
        <div className="text-center text-xs text-gray-500">AskLynk v1.0.0</div>
      </div>
    </div>
  );
};

export default Popup;
