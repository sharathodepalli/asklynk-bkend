// global.d.ts

// Import the OverlayTab type from your store
import { OverlayTab } from './store/overlay';

// Speech Recognition interfaces
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: (event: Event) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Chrome API type definitions
declare namespace chrome {
  namespace runtime {
    function sendMessage(message: any, responseCallback?: (response: any) => void): void;
    const onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: any) => boolean | void): void;
    };
    const onInstalled: {
      addListener(callback: () => void): void;
    };
  }

  namespace storage {
    const sync: {
      get(keys: string | string[] | Object | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: Object, callback?: () => void): void;
    };
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active: boolean;
      [key: string]: any;
    }
    
    function query(queryInfo: { active: boolean, currentWindow: boolean }, callback: (tabs: Tab[]) => void): void;
    function sendMessage(tabId: number, message: any, responseCallback?: (response: any) => void): void;
    const onUpdated: {
      addListener(callback: (tabId: number, changeInfo: any, tab: Tab) => void): void;
    };
  }
}

// Global window extensions
declare global {
  interface Window {
    // Speech Recognition
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    
    // AskLynk Overlay Store - updated to include setActiveTab
    __ASKLYNK_OVERLAY_STORE__: {
      activeTab: OverlayTab | null;
      isMinimized: boolean;
      position: { x: number; y: number };
      toggleTab: (tab: OverlayTab) => void;
      setActiveTab: (tab: OverlayTab | null) => void; // Added this method
      setMinimized: (minimized: boolean) => void;
      closeOverlay: () => void;
      setPosition: (position: { x: number; y: number }) => void;
    };
  }
}

export {};