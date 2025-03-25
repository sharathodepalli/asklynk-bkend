// import React, { useState, useEffect, useRef } from 'react';
// import { MessageSquare, ThumbsUp, Send, Loader2, Check } from 'lucide-react';
// import { useChatStore } from '../store/chat';
// import { useAuthStore } from '../store/auth';
// import { useSessionStore } from '../store/session';

// export function ClassroomChat() {
//   const { user } = useAuthStore();
//   const { session } = useSessionStore();
//   const {
//     messages,
//     isLoading,
//     error,
//     sendMessage,
//     upvoteMessage,
//     markAsDelivered,
//     markAsRead,
//     setTyping,
//     subscribeToChat,
//     unsubscribeFromChat,
//     loadMoreMessages,
//   } = useChatStore();

//   const [input, setInput] = useState('');
//   const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>();
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const chatContainerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (session?.id) {
//       subscribeToChat();
//     }
//     return () => unsubscribeFromChat();
//   }, [session?.id, subscribeToChat, unsubscribeFromChat]);

//   useEffect(() => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, [messages]);

//   // Mark messages as delivered when they appear in view
//   useEffect(() => {
//     const undeliveredMessages = messages.filter(
//       msg => msg.user_id !== user?.id && !msg.delivered_at && msg.type === 'public'
//     );

//     if (undeliveredMessages.length > 0) {
//       undeliveredMessages.forEach(msg => markAsDelivered(msg.id));
//     }
//   }, [messages, user?.id, markAsDelivered]);

//   // Mark messages as read when the chat is opened
//   useEffect(() => {
//     const unreadMessages = messages.filter(
//       msg => msg.user_id !== user?.id && !msg.read_at && msg.type === 'public'
//     );

//     if (unreadMessages.length > 0) {
//       unreadMessages.forEach(msg => markAsRead(msg.id));
//     }
//   }, [messages, user?.id, markAsRead]);

//   const handleScroll = () => {
//     const container = chatContainerRef.current;
//     if (container && container.scrollTop === 0 && !isLoading) {
//       loadMoreMessages();
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setInput(e.target.value);

//     if (typingTimeout) {
//       clearTimeout(typingTimeout);
//     }

//     setTyping(true);
//     const timeout = setTimeout(() => setTyping(false), 1000);
//     setTypingTimeout(timeout);
//   };

//   const handleSend = async () => {
//     if (!input.trim()) return;

//     try {
//       await sendMessage(input);
//       setInput('');
//     } catch (err) {
//       console.error('Failed to send message:', err);
//     }
//   };

//   const formatTime = (timestamp: string) => {
//     return new Date(timestamp).toLocaleTimeString([], {
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   const getMessageStatus = (message: any) => {
//     if (message.user_id === user?.id) {
//       if (message.read_at) {
//         return (
//           <div className="flex items-center gap-0.5 text-blue-600">
//             <Check size={14} />
//             <Check size={14} />
//           </div>
//         );
//       }
//       if (message.delivered_at) {
//         return (
//           <div className="flex items-center gap-0.5 text-gray-600">
//             <Check size={14} />
//             <Check size={14} />
//           </div>
//         );
//       }
//       return (
//         <div className="flex items-center text-gray-400">
//           <Check size={14} />
//         </div>
//       );
//     }
//     return null;
//   };

//   if (!session) return null;

//   const publicMessages = messages.filter(msg => msg.type === 'public');

//   return (
//     <div className="flex flex-col h-[500px] bg-white rounded-lg">
//       <div className="bg-green-600 p-4 rounded-t-lg">
//         <h2 className="text-white font-semibold flex items-center gap-2">
//           <MessageSquare size={20} />
//           Classroom Chat
//         </h2>
//       </div>

//       {error && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
//           {error}
//         </div>
//       )}

//       <div
//         ref={chatContainerRef}
//         className="flex-1 overflow-y-auto p-4 space-y-4"
//         onScroll={handleScroll}
//       >
//         {isLoading && (
//           <div className="flex justify-center">
//             <Loader2 className="animate-spin text-gray-500" size={24} />
//           </div>
//         )}

//         {publicMessages.map((message) => (
//           <div
//             key={message.id}
//             className={`flex flex-col ${
//               message.user_id === user?.id ? 'items-end' : 'items-start'
//             }`}
//           >
//             <div className="flex items-start gap-2 max-w-[80%]">
//               <div
//                 className={`rounded-lg p-3 ${
//                   message.user_id === user?.id
//                     ? 'bg-green-600 text-white'
//                     : 'bg-gray-100 text-gray-800'
//                 }`}
//               >
//                 <div className="flex items-center gap-2 mb-1">
//                   <span className="font-medium text-sm">
//                     {message.user_full_name}
//                   </span>
//                   <span className="text-xs opacity-75">
//                     {formatTime(message.created_at)}
//                   </span>
//                 </div>
//                 <p>{message.content}</p>
//               </div>
//               {message.user_id !== user?.id && (
//                 <button
//                   onClick={() => upvoteMessage(message.id)}
//                   className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 p-1"
//                 >
//                   <ThumbsUp size={16} />
//                   {message.votes > 0 && (
//                     <span className="font-medium">{message.votes}</span>
//                   )}
//                 </button>
//               )}
//             </div>
//             {getMessageStatus(message)}
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       <div className="p-4 border-t">
//         <div className="flex gap-2">
//           <input
//             type="text"
//             value={input}
//             onChange={handleInputChange}
//             onKeyPress={(e) => e.key === 'Enter' && handleSend()}
//             placeholder="Share your thoughts with the class..."
//             className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
//           />
//           <button
//             onClick={handleSend}
//             disabled={!input.trim()}
//             className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//           >
//             <Send size={20} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, ThumbsUp, Send, Loader2, Check } from "lucide-react";
import { useChatStore } from "../store/chat";
import { useAuthStore } from "../store/auth";
import { useSessionStore } from "../store/session";

export function ClassroomChat() {
  const { user } = useAuthStore();
  const { session } = useSessionStore();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    upvoteMessage,
    markAsDelivered,
    markAsRead,
    setTyping,
    subscribeToChat,
    unsubscribeFromChat,
    loadMoreMessages,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.id) {
      subscribeToChat();
    }
    return () => unsubscribeFromChat();
  }, [session?.id, subscribeToChat, unsubscribeFromChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark messages as delivered when they appear in view
  useEffect(() => {
    const undeliveredMessages = messages.filter(
      (msg) =>
        msg.user_id !== user?.id && !msg.delivered_at && msg.type === "public"
    );

    if (undeliveredMessages.length > 0) {
      undeliveredMessages.forEach((msg) => markAsDelivered(msg.id));
    }
  }, [messages, user?.id, markAsDelivered]);

  // Mark messages as read when the chat is opened
  useEffect(() => {
    const unreadMessages = messages.filter(
      (msg) => msg.user_id !== user?.id && !msg.read_at && msg.type === "public"
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => markAsRead(msg.id));
    }
  }, [messages, user?.id, markAsRead]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container && container.scrollTop === 0 && !isLoading) {
      loadMoreMessages();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    setTyping(true);
    const timeout = setTimeout(() => setTyping(false), 1000);
    setTypingTimeout(timeout);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      // Explicitly pass 'public' as the type argument
      await sendMessage(input, "public");
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

  if (!session) return null;

  const publicMessages = messages.filter((msg) => msg.type === "public");

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg">
      <div className="bg-green-600 p-4 rounded-t-lg">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <MessageSquare size={20} />
          Classroom Chat
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

        {publicMessages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.user_id === user?.id ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-start gap-2 max-w-[80%]">
              <div
                className={`rounded-lg p-3 ${
                  message.user_id === user?.id
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {message.user_full_name}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <p>{message.content}</p>
              </div>
              {message.user_id !== user?.id && (
                <button
                  onClick={() => upvoteMessage(message.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 p-1"
                >
                  <ThumbsUp size={16} />
                  {(message.votes ?? 0) > 0 && (
                    <span className="font-medium">{message.votes ?? 0}</span>
                  )}
                </button>
              )}
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
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Share your thoughts with the class..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
