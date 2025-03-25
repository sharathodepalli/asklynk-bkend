import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Lock, Loader2, Check } from "lucide-react";
import { usePrivateChatStore } from "../store/privateChat";
import { useAuthStore } from "../store/auth";
import { useSessionStore } from "../store/session";

export function PrivateChat() {
  const { user } = useAuthStore();
  const { session } = useSessionStore();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    subscribeToPrivateChat,
    unsubscribeFromPrivateChat,
    loadMoreMessages,
  } = usePrivateChatStore();

  const [input, setInput] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    subscribeToPrivateChat();
    return () => unsubscribeFromPrivateChat();
  }, [subscribeToPrivateChat, unsubscribeFromPrivateChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container && container.scrollTop === 0 && !isLoading) {
      loadMoreMessages();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !session || !user) return;

    try {
      // For now, send to professor if student, and vice versa
      const receiverId =
        user.role === "student"
          ? session.professor_id
          : messages.find((m) => m.sender_id !== user.id)?.sender_id;

      if (!receiverId) return;

      await sendMessage(receiverId, input, isAnonymous);
      setInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!session) return null;

  return (
    <div className="flex flex-col h-[80vh] bg-white rounded-lg">
      <div className="bg-purple-600 p-4 rounded-t-lg">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <MessageSquare size={20} />
          {user?.role === "student" ? "Message Professor" : "Student Messages"}
        </h2>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          {error}
        </div>
      )}

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-gray-500" size={24} />
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.sender_id === user?.id ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`rounded-lg p-3 max-w-[80%] ${
                message.sender_id === user?.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {message.type === "anonymous"
                    ? message.anonymous_name || "Anonymous"
                    : message.sender_id === user?.id
                    ? "You"
                    : message.sender?.full_name}
                </span>
                <span className="text-xs opacity-75">
                  {formatTime(message.created_at)}
                </span>
              </div>
              <p>{message.content}</p>
            </div>
            {message.sender_id === user?.id && (
              <div className="flex items-center gap-0.5 mt-1 text-xs">
                {message.read_at ? (
                  <div className="text-blue-600">
                    <Check size={14} />
                    <Check size={14} />
                  </div>
                ) : message.delivered_at ? (
                  <div className="text-gray-600">
                    <Check size={14} />
                    <Check size={14} />
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Check size={14} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`p-2 rounded-lg ${
              isAnonymous ? "bg-purple-100 text-purple-600" : "text-gray-400"
            }`}
          >
            <Lock size={20} />
          </button>
          <span className="text-sm text-gray-500">
            {isAnonymous ? "Anonymous mode" : "Regular mode"}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Send a ${isAnonymous ? "anonymous " : ""}message...`}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
