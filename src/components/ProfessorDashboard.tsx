import React, { useState, useEffect } from "react";
import { useSessionStore } from "../store/session";
import { useOverlayStore } from "../store/overlay";
import { useAuthStore } from "../store/auth";
import {
  Plus,
  Loader2,
  CheckCircle,
  X,
  Users,
  MessageSquare,
  Brain,
  BarChart3,
  Mail,
  History,
  Clock,
  ArrowLeft,
  Download,
} from "lucide-react";
import { SessionHistory } from "./SessionHistory";
import { VoicePollCreator } from "./VoicePollCreator";
import { format } from "date-fns";

interface SessionAnalytics {
  studentCount: number;
  messageCount: number;
  aiInteractions: number;
  pollCount: number;
}

export function ProfessorDashboard() {
  const {
    session,
    sessions,
    createSession,
    endSession,
    isLoading,
    error,
    loadSessions,
  } = useSessionStore();
  const { setActiveTab } = useOverlayStore();
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionDuration, setSessionDuration] = useState("");
  const [showEndedSummary, setShowEndedSummary] = useState(false);

  useEffect(() => {
    if (session) {
      // Notify FloatingOverlay of session change
      const event = new CustomEvent("asklynk-session-update", {
        detail: { session },
      });
      document.dispatchEvent(event);
    }
  }, [session]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (session?.status === "active") {
      const interval = setInterval(() => {
        const start = new Date(session.created_at);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setSessionDuration(`${hours}h ${minutes}m`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Show ended summary when session ends
  useEffect(() => {
    if (session?.status === "ended") {
      setShowEndedSummary(true);
    } else {
      setShowEndedSummary(false);
    }
  }, [session?.status]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSession(title, description);
    setTitle("");
    setDescription("");
    setShowCreateForm(false);
  };

  const handleEndSession = async () => {
    if (window.confirm("Are you sure you want to end this session?")) {
      await endSession();
    }
  };

  const handleBackToHome = () => {
    setShowEndedSummary(false);
    setShowHistory(true);
  };

  const handleStartNewSession = () => {
    setShowEndedSummary(false);
    setShowCreateForm(true);
  };

  const handleOpenAI = () => setActiveTab("ai");
  const handleOpenChat = () => setActiveTab("chat");
  const handleOpenMessages = () => setActiveTab("anonymous");
  const handleOpenPolls = () => setActiveTab("polls");

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* AI Assistant Card - Always Available */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">AI Teaching Assistant</h2>
            <p className="text-gray-600">
              Get instant help with lesson planning, grading, and more.
            </p>
          </div>
          <button
            onClick={handleOpenAI}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Brain size={20} />
            Open AI Assistant
          </button>
        </div>
      </div>

      {/* Session History Toggle */}
      {sessions.length > 0 && !session && !showCreateForm && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <History size={20} />
            {showHistory ? "Hide History" : "Show History"}
          </button>
        </div>
      )}

      {/* Session History */}
      {showHistory && !session && !showCreateForm && <SessionHistory />}

      {/* Session Ended Summary */}
      {showEndedSummary && session && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Session Ended Successfully
            </h2>
            <p className="text-gray-600">
              Session "{session.title}" has ended. Here's a summary of the
              session:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {session.student_count || 0}
              </div>
              <div className="text-gray-500">Students</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {session.message_count || 0}
              </div>
              <div className="text-gray-500">Messages</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {session.ai_interaction_count || 0}
              </div>
              <div className="text-gray-500">AI Interactions</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {session.poll_count || 0}
              </div>
              <div className="text-gray-500">Polls</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={handleBackToHome}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <button
              onClick={handleStartNewSession}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Start New Session
            </button>
            <button
              onClick={() =>
                window.open(`/api/transcripts/${session.id}`, "_blank")
              }
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download Session Data
            </button>
          </div>
        </div>
      )}

      {!session && !showCreateForm && !showHistory && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Start a New Session</h2>
          <p className="text-gray-600 mb-6">
            Create a session to enable class chat, polls, and student messages.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Create Session
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Create New Session</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
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
                <Plus size={20} />
              )}
              Create Session
            </button>
          </form>
        </div>
      )}

      {session && !showEndedSummary && (
        <div className="space-y-8">
          {/* Session Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{session.title}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Code:</span>
                    <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded">
                      {session.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {sessionDuration}
                    </span>
                  </div>
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
              {session.status === "active" && (
                <button
                  onClick={handleEndSession}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <X size={20} />
                  End Session
                </button>
              )}
            </div>

            {session.description && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-2">Session Description</h3>
                <p className="text-gray-700">{session.description}</p>
              </div>
            )}

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4 border border-gray-200 hover:border-indigo-200 transition-colors">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Students</h3>
                  <p className="text-2xl font-bold">
                    {session.student_count || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4 border border-gray-200 hover:border-green-200 transition-colors">
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Messages</h3>
                  <p className="text-2xl font-bold">
                    {session.message_count || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4 border border-gray-200 hover:border-purple-200 transition-colors">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                  <Brain size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">AI Interactions</h3>
                  <p className="text-2xl font-bold">
                    {session.ai_interaction_count || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 flex items-center gap-4 border border-gray-200 hover:border-blue-200 transition-colors">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Active Polls</h3>
                  <p className="text-2xl font-bold">
                    {session.poll_count || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Session Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <button
                onClick={handleOpenChat}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <MessageSquare size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Class Chat</h3>
                  <p className="text-sm text-gray-500">View class discussion</p>
                </div>
              </button>

              <button
                onClick={handleOpenMessages}
                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Mail size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Student Messages</h3>
                  <p className="text-sm text-gray-500">View private messages</p>
                </div>
              </button>

              <button
                onClick={handleOpenPolls}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-3 transition-colors"
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <BarChart3 size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Live Polls</h3>
                  <p className="text-sm text-gray-500">Create & manage polls</p>
                </div>
              </button>

              <button
                onClick={handleOpenAI}
                className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-3 transition-colors"
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
            </div>
          </div>
        </div>
      )}

      {/* Voice Poll Creator */}
      {session?.status === "active" && user?.role === "professor" && (
        <VoicePollCreator />
      )}
    </div>
  );
}
