import React, { useEffect, useState } from "react";
import { FloatingOverlay } from "./components/FloatingOverlay";
import { AuthModal } from "./components/AuthModal";
import { ProfessorDashboard } from "./components/ProfessorDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import { useAuthStore } from "./store/auth";
import { LogOut } from "lucide-react";
import { TranscriptionControls } from "./components/TranscriptionControls";
import { Captions } from "./components/Captions";
import { OverlayProvider } from "./components/OverlayProvider";
import "./styles/overlay.css";
function App() {
  const { user, isLoading, checkAuth, signOut } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <OverlayProvider>
      <div className="min-h-screen bg-gray-100">
        {!user ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Welcome to AskLynk
              </h1>
              <p className="text-gray-600 mb-8">
                Sign in to join or create classroom sessions
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Get Started
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-white shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="font-medium">{user.full_name}</span>
                <span className="text-sm text-gray-500 capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>

            {user.role === "professor" ? (
              <ProfessorDashboard />
            ) : (
              <StudentDashboard />
            )}

            <FloatingOverlay />
            <TranscriptionControls />
            <Captions />
          </>
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    </OverlayProvider>
  );
}

export default App;
