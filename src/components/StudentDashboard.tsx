import React, { useState, useEffect } from "react";
import { useSessionStore } from "../store/session";
import {
  LogIn,
  Loader2,
  X,
  CheckCircle,
  MessageSquare,
  Brain,
  BarChart3,
} from "lucide-react";
import { useOverlayStore } from "../store/overlay";

export function StudentDashboard() {
  const { joinSession, session, isLoading, error, clearSession } =
    useSessionStore();
  const { setActiveTab } = useOverlayStore();
  const [code, setCode] = useState("");

  useEffect(() => {
    if (session) {
      // Notify FloatingOverlay of session change
      const event = new CustomEvent("asklynk-session-update", {
        detail: { session },
      });
      document.dispatchEvent(event);
    }
  }, [session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSession();
    };
  }, [clearSession]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    await joinSession(code);
  };

  const handleOpenChat = () => {
    if (session?.status === "active") {
      setActiveTab("chat");
    }
  };

  const handleOpenAI = () => {
    setActiveTab("ai");
  };

  if (session) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{session.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-500">Session Code:</span>
                <span className="font-mono font-bold">{session.code}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    session.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {session.status === "active" ? (
                    <>
                      <CheckCircle size={12} className="mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <X size={12} className="mr-1" />
                      Ended
                    </>
                  )}
                </span>
              </div>
            </div>
            <button
              onClick={clearSession}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              Leave Session
            </button>
          </div>

          {session.description && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-2">Session Description</h3>
              <p className="text-gray-700">{session.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={handleOpenAI}
              className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-3"
            >
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Brain size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-medium">AI Assistant</h3>
                <p className="text-sm text-gray-500">
                  Get instant help anytime
                </p>
              </div>
            </button>

            <button
              onClick={handleOpenChat}
              disabled={session.status !== "active"}
              className={`p-4 rounded-lg flex items-center gap-3 ${
                session.status === "active"
                  ? "bg-green-50 hover:bg-green-100"
                  : "bg-gray-50 cursor-not-allowed opacity-50"
              }`}
            >
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <MessageSquare size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Class Chat</h3>
                <p className="text-sm text-gray-500">
                  {session.status === "active"
                    ? "Join the discussion"
                    : "Session has ended"}
                </p>
              </div>
            </button>

            <button
              onClick={() =>
                session.status === "active" && setActiveTab("polls")
              }
              disabled={session.status !== "active"}
              className={`p-4 rounded-lg flex items-center gap-3 ${
                session.status === "active"
                  ? "bg-blue-50 hover:bg-blue-100"
                  : "bg-gray-50 cursor-not-allowed opacity-50"
              }`}
            >
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BarChart3 size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Live Polls</h3>
                <p className="text-sm text-gray-500">
                  {session.status === "active"
                    ? "Participate in polls"
                    : "Session has ended"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Join Session</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleJoinSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              Join Session
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">AI Assistant</h2>
          <p className="text-gray-600 mb-4">
            Get instant help with your studies anytime, even without joining a
            session.
          </p>
          <button
            onClick={handleOpenAI}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <Brain size={20} />
            Open AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
