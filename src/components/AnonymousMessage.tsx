import React, { useState, useEffect, useRef } from 'react';
import { Lock, Send, Check, Loader2 } from 'lucide-react';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { useSessionStore } from '../store/session';
import { supabase } from '../lib/supabase';
import { ProfessorAnonymousMessage } from './ProfessorAnonymousMessage';

export function AnonymousMessage() {
  const { user } = useAuthStore();
  const { session } = useSessionStore();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsDelivered,
    markAsRead,
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const [anonymousName, setAnonymousName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // If user is a professor, show the professor view
  if (user?.role === 'professor') {
    return <ProfessorAnonymousMessage />;
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as delivered when they appear in view
  useEffect(() => {
    const undeliveredMessages = messages.filter(
      msg => msg.user_id !== user?.id && !msg.delivered_at && msg.type === 'anonymous'
    );
    
    if (undeliveredMessages.length > 0) {
      undeliveredMessages.forEach(msg => markAsDelivered(msg.id));
    }
  }, [messages, user?.id, markAsDelivered]);

  // Mark messages as read when the chat is opened
  useEffect(() => {
    const unreadMessages = messages.filter(
      msg => msg.user_id !== user?.id && !msg.read_at && msg.type === 'anonymous'
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => markAsRead(msg.id));
    }
  }, [messages, user?.id, markAsRead]);

  // Fetch anonymous name when component mounts
  useEffect(() => {
    if (session?.id && user?.id) {
      const fetchAnonymousName = async () => {
        try {
          const { data: nameData, error: nameError } = await supabase
            .rpc('generate_anonymous_name', {
              p_session_id: session.id,
              p_user_id: user.id
            });

          if (nameError) throw nameError;
          setAnonymousName(nameData);
        } catch (err) {
          console.error('Failed to fetch anonymous name:', err);
        }
      };

      fetchAnonymousName();
    }
  }, [session?.id, user?.id]);

  const handleSend = async () => {
    if (!input.trim() || !session) return;

    try {
      await sendMessage(input, 'anonymous');
      setInput('');
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

  const getMessageStatus = (message: any) => {
    if (message.user_id === user?.id) {
      if (message.read_at) {
        return (
          <div className="flex items-center gap-0.5 text-blue-600">
            <Check size={14} />
            <Check size={14} />
          </div>
        );
      }
      if (message.delivered_at) {
        return (
          <div className="flex items-center gap-0.5 text-gray-600">
            <Check size={14} />
            <Check size={14} />
          </div>
        );
      }
      return (
        <div className="flex items-center text-gray-400">
          <Check size={14} />
        </div>
      );
    }
    return null;
  };

  const anonymousMessages = messages.filter(msg => msg.type === 'anonymous');

  return (
    <div className="flex flex-col h-[500px] w-[350px] bg-white rounded-lg shadow-lg">
      <div className="bg-purple-600 p-4 rounded-t-lg">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Lock size={20} />
          Anonymous Message to Professor
        </h2>
        {anonymousName && (
          <p className="text-purple-100 text-sm mt-1">
            You appear as: {anonymousName}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

        {anonymousMessages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.user_id === user?.id ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-start gap-2 max-w-[80%]">
              <div
                className={`rounded-lg p-3 ${
                  message.user_id === user?.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {message.anonymous_name || 'Anonymous'}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <p>{message.content}</p>
              </div>
            </div>
            {getMessageStatus(message)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Send an anonymous message..."
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
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Lock size={12} />
          Your identity will remain anonymous
        </p>
      </div>
    </div>
  );
}