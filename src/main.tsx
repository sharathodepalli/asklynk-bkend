import "regenerator-runtime/runtime";

import "./index.css";

import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupAPI } from "./api";

// Initialize the API
setupAPI();

// Initialize SpeechRecognition polyfill
if (!("webkitSpeechRecognition" in window)) {
  (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
