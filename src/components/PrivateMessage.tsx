import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Lock, Loader2, Check, X } from 'lucide-react';
import { usePrivateChatStore } from '../store/privateChat';
import { useAuthStore } from '../store/auth';
import { useSessionStore } from '../store/session';

export function PrivateMessage() {
  const { user } = useAuthStore();
  const { session } = useSessionStore();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsDelivered,
    markAsRead,
  } = usePrivateChatStore();
  
  const [input, setInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as delivered when they appear in view
  useEffect(() => {
    const undeliveredMessages = messages.filter(
      msg => msg.sender_id !== user?.id && !msg.delivered_at
    );
    
    if (undeliveredMessages.length > 0) {
      undeliveredMessages.forEach(msg => markAsDelivered(msg.id));
    }
  }, [messages, user?.id, markAsDelivered]);

  // Mark messages as read when the chat is opened
  useEffect(() => {
    const unreadMessages = messages.filter(
      msg => msg.sender_id !== user?.id && !msg.read_at
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => markAsRead(msg.id));
    }
  }, [messages, user?.id, markAsRead]);

  const handleSend = async () => {
    if (!input.trim() || !session) return;

    if (isAnonymous && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      // For students, send to professor. For professors, send to the student who last messaged them
      const receiverId = user?.role === 'student' 
        ? session.professor_id 
        : messages.find(m => m.sender_id !== user?.id)?.sender_id;

      if (!receiverId) return;

      await sendMessage(receiverId, input, isAnonymous);
      setInput('');
      setShowConfirmation(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group messages by conversation
  const groupedMessages = messages.reduce((groups: Record<string, any[]>, message) => {
    // Create a unique key for each conversation
    const key = message.type === 'anonymous' 
      ? message.anonymous_name || 'Anonymous'
      : message.sender_id === user?.id
        ? `chat-${message.receiver_id}`
        : `chat-${message.sender_id}`;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
    return groups;
  }, {});

  if (!session) return null;

  return (
    <div className="flex flex-col h-[500px] w-[350px] bg-white rounded-lg shadow-lg">
      <div className="bg-purple-600 p-4 rounded-t-lg">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <MessageSquare size={20} />
          {user?.role === 'student' ? 'Message Professor' : 'Student Messages'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-gray-500" size={24} />
          </div>
        )}

        {Object.entries(groupedMessages).map(([key, groupMessages]) => (
          <div key={key} className="space-y-3">
            {/* Show conversation header for anonymous chats */}
            {key.startsWith('Anonymous') && (
              <div className="flex items-center gap-2 pb-2 border-b">
                <span className="font-medium text-gray-700">{key}</span>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                  Anonymous
                </span>
              </div>
            )}

            {groupMessages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.sender_id === user?.id ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender_id === user?.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {message.type === 'anonymous'
                          ? message.anonymous_name || 'Anonymous'
                          : message.sender_id === user?.id
                          ? 'You'
                          : message.sender_name || 'Professor'}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p>{message.content}</p>
                  </div>
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
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showConfirmation && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-100">
          <p className="text-sm text-yellow-800 mb-2">
            You are about to send an anonymous message. The professor won't be able to see your identity.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              className="flex-1 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Send Anonymous
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              className="px-3 py-1 text-yellow-800 hover:bg-yellow-100 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="p-4 border-t">
        {user?.role === 'student' && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                setIsAnonymous(!isAnonymous);
                setShowConfirmation(false);
              }}
              className={`p-2 rounded-lg ${
                isAnonymous ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-purple-600'
              }`}
            >
              <Lock size={20} />
            </button>
            <span className="text-sm text-gray-500">
              {isAnonymous ? 'Anonymous mode' : 'Regular mode'}
            </span>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Send a ${isAnonymous ? 'anonymous ' : ''}message...`}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}