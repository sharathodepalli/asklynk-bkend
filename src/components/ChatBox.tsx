import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, ChevronUp, Brain, Loader2, Save } from 'lucide-react';
import { useAIStore } from '../store/ai';
import Markdown from 'marked-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

export function ChatBox() {
  const { messages, isLoading, error, storeChat, setStoreChat, sendMessage, loadMessages } = useAIStore();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Syntax highlighting for code blocks
  useEffect(() => {
    Prism.highlightAll();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleStoreChat = async () => {
    await setStoreChat(!storeChat);
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all"
      >
        <Brain size={24} />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-[500px] w-[350px] bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between bg-indigo-600 p-4 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Brain className="text-white" size={24} />
          <div>
            <h2 className="text-white font-semibold">AskLynk AI Assistant</h2>
            <p className="text-indigo-200 text-sm">Ask anything about the lecture</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleStoreChat}
            className={`text-white hover:bg-indigo-700 rounded-full p-1 ${
              storeChat ? 'text-green-300' : 'text-gray-300'
            }`}
            title={storeChat ? 'Chat history is being saved' : 'Chat history is not being saved'}
          >
            <Save size={20} />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white hover:bg-indigo-700 rounded-full p-1"
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {error}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg overflow-hidden ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="p-3 prose prose-sm max-w-none">
                <Markdown>{message.content}</Markdown>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="animate-spin text-indigo-600" size={16} />
              <span className="text-sm text-gray-600">AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about the lecture..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2 rounded-full ${
              isRecording ? 'bg-red-500' : 'bg-gray-200'
            } hover:bg-opacity-80`}
          >
            <Mic
              size={20}
              className={isRecording ? 'text-white' : 'text-gray-600'}
            />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}