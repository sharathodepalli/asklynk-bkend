import React, { useEffect, useCallback } from "react";
import { useTranscriptionStore } from "../store/transcription";
import { useAuthStore } from "../store/auth";
import { useSessionStore } from "../store/session";
import {
  Mic,
  MicOff,
  Type,
  Download,
  AlertCircle,
  Settings,
  Check,
} from "lucide-react";

const SUPPORTED_LANGUAGES = {
  "en-US": "English",
  "es-ES": "Spanish",
  "fr-FR": "French",
  "de-DE": "German",
  "it-IT": "Italian",
  "ja-JP": "Japanese",
  "ko-KR": "Korean",
  "zh-CN": "Chinese (Simplified)",
};

const CAPTION_SIZES = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
};

const CAPTION_COLORS = {
  white: "text-white",
  yellow: "text-yellow-300",
  cyan: "text-cyan-300",
};

export function TranscriptionControls() {
  const { user } = useAuthStore();
  const { session } = useSessionStore();
  const {
    isTranscribing,
    captionsEnabled,
    selectedLanguage,
    captionStyle,
    error,
    startTranscription,
    stopTranscription,
    setCaptionsEnabled,
    setSelectedLanguage,
    setCaptionStyle,
    generateSummary,
  } = useTranscriptionStore();

  const [showSettings, setShowSettings] = React.useState(false);

  // Auto-start transcription for professors when session starts
  useEffect(() => {
    if (
      session?.status === "active" &&
      user?.role === "professor" &&
      !isTranscribing
    ) {
      console.log("Auto-starting transcription");
      startTranscription().catch((err) =>
        console.error("Error auto-starting transcription:", err)
      );
    }
  }, [session?.status, user?.role, isTranscribing, startTranscription]);

  // Stop transcription when session ends
  useEffect(() => {
    if (session?.status === "ended" && isTranscribing) {
      console.log("Auto-stopping transcription due to session end");
      stopTranscription();
      generateSummary().catch((err) =>
        console.error("Error generating summary:", err)
      );
    }
  }, [session?.status, isTranscribing, stopTranscription, generateSummary]);

  // Create memoized handlers to avoid recreation on each render
  const handleTranscriptionToggle = useCallback(() => {
    console.log("Transcription toggle clicked, current state:", isTranscribing);
    if (isTranscribing) {
      stopTranscription();
    } else {
      startTranscription().catch((err) =>
        console.error("Error starting transcription:", err)
      );
    }
  }, [isTranscribing, startTranscription, stopTranscription]);

  const handleCaptionsToggle = useCallback(() => {
    console.log("Captions toggle clicked, current state:", captionsEnabled);
    setCaptionsEnabled(!captionsEnabled);
  }, [captionsEnabled, setCaptionsEnabled]);

  const handleSettingsToggle = useCallback(() => {
    console.log("Settings toggle clicked, current state:", showSettings);
    setShowSettings((prev) => !prev);
  }, [showSettings]);

  const handleLanguageChange = useCallback(
    (langCode: string) => {
      console.log("Language change clicked:", langCode);
      setSelectedLanguage(langCode);
    },
    [setSelectedLanguage]
  );

  const handleCaptionSizeChange = useCallback(
    (size: string) => {
      console.log("Caption size change clicked:", size);
      setCaptionStyle({ size });
    },
    [setCaptionStyle]
  );

  const handleCaptionColorChange = useCallback(
    (color: string) => {
      console.log("Caption color change clicked:", color);
      setCaptionStyle({ color });
    },
    [setCaptionStyle]
  );

  const handleDownloadTranscript = useCallback(() => {
    if (session) {
      console.log("Download transcript clicked for session:", session.id);
      window.open(`/api/transcripts/${session.id}`, "_blank");
    }
  }, [session]);

  if (!session || !user) return null;

  return (
    <div className="fixed bottom-4 left-4 flex flex-col gap-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
        <div className="flex items-center gap-4">
          {/* Transcription Toggle */}
          {user.role === "professor" && (
            <button
              onClick={handleTranscriptionToggle}
              className={`p-3 rounded-lg flex items-center gap-2 ${
                isTranscribing
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-green-100 text-green-600 hover:bg-green-200"
              }`}
            >
              {isTranscribing ? <MicOff size={20} /> : <Mic size={20} />}
              <span>
                {isTranscribing ? "Stop Recording" : "Start Recording"}
              </span>
            </button>
          )}

          {/* Caption Toggle */}
          <button
            onClick={handleCaptionsToggle}
            className={`p-3 rounded-lg flex items-center gap-2 ${
              captionsEnabled
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Type size={20} />
            <span>{captionsEnabled ? "Hide Captions" : "Show Captions"}</span>
          </button>

          {/* Settings Toggle */}
          <button
            onClick={handleSettingsToggle}
            className="p-3 rounded-lg flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <Settings size={20} />
            <span>Caption Settings</span>
          </button>

          {/* Download Transcript */}
          {session.status === "ended" && (
            <button
              onClick={handleDownloadTranscript}
              className="p-3 rounded-lg flex items-center gap-2 bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
            >
              <Download size={20} />
              <span>Download Transcript</span>
            </button>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Caption Language
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                      selectedLanguage === code
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {selectedLanguage === code && <Check size={12} />}
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Size */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Caption Size
              </label>
              <div className="flex gap-2">
                {Object.keys(CAPTION_SIZES).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleCaptionSizeChange(size)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      captionStyle.size === size
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Color */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Caption Color
              </label>
              <div className="flex gap-2">
                {Object.keys(CAPTION_COLORS).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleCaptionColorChange(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      captionStyle.color === color
                        ? "border-indigo-600"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
