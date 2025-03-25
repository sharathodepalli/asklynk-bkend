// src/components/OverlayProvider.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { useOverlayStore } from "../store/overlay";

// Create the context
type OverlayContextType = ReturnType<typeof useOverlayStore>;
export const OverlayContext = createContext<OverlayContextType | null>(null);

// Create a hook to use the context
export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return context;
};

// Create the provider component
interface OverlayProviderProps {
  children: ReactNode;
}

export const OverlayProvider: React.FC<OverlayProviderProps> = ({
  children,
}) => {
  const overlay = useOverlayStore();

  return (
    <OverlayContext.Provider value={overlay}>
      {children}
    </OverlayContext.Provider>
  );
};
