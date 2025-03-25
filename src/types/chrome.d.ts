// This file adds Chrome extension types to your project
/// <reference types="chrome" />

interface Window {
    chrome: typeof chrome;
  }
  
  // Chrome message types
  interface ChromeMessage {
    action: string;
    [key: string]: any;
  }
  
  interface TabInfo {
    id?: number;
    url?: string;
  }
  
  interface StorageData {
    enabled?: boolean;
    settings?: {
      autoActivate?: boolean;
      transcriptionEnabled?: boolean;
      notifications?: boolean;
    };
    [key: string]: any;
  }