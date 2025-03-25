// import React, { useState, useEffect, useRef } from 'react';
// import { Lock, Send, Check, Loader2, Search, ArrowLeft } from 'lucide-react';
// import { useChatStore } from '../store/chat';
// import { useAuthStore } from '../store/auth';
// import { useSessionStore } from '../store/session';
// import { usePrivateChatStore } from '../store/privateChat';

// interface ChatThread {
//   id: string;
//   name: string;
//   isAnonymous: boolean;
//   userId?: string;
//   anonymousThreadId?: string;
//   lastMessage: {
//     content: string;
//     timestamp: string;
//     isRead: boolean;
//   };
//   unreadCount: number;
// }

// export function ProfessorAnonymousMessage() {
//   const { user } = useAuthStore();
//   const { session } = useSessionStore();
//   const {
//     messages: publicMessages,
//     isLoading: isPublicLoading,
//     error: publicError,
//   } = useChatStore();

//   const {
//     messages: privateMessages,
//     isLoading: isPrivateLoading,
//     error: privateError,
//     sendMessage,
//     markAsDelivered,
//     markAsRead,
//   } = usePrivateChatStore();

//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
//   const [replyInput, setReplyInput] = useState('');
//   const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const [isMobileView, setIsMobileView] = useState(false);
//   const [showChat, setShowChat] = useState(false);

//   // Handle responsive layout
//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobileView(window.innerWidth < 768);
//     };

//     handleResize();
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // Auto-scroll to bottom on new messages
//   useEffect(() => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, [privateMessages, selectedThread]);

//   // Mark messages as delivered and read
//   useEffect(() => {
//     const undeliveredMessages = privateMessages.filter(
//       msg => msg.receiver_id === user?.id && !msg.delivered_at
//     );

//     if (undeliveredMessages.length > 0) {
//       undeliveredMessages.forEach(msg => markAsDelivered(msg.id));
//     }

//     if (selectedThread) {
//       const unreadMessages = privateMessages.filter(
//         msg =>
//           msg.receiver_id === user?.id &&
//           !msg.read_at &&
//           (msg.anonymous_name === selectedThread.name || msg.sender?.full_name === selectedThread.name)
//       );

//       if (unreadMessages.length > 0) {
//         unreadMessages.forEach(msg => markAsRead(msg.id));
//       }
//     }
//   }, [privateMessages, user?.id, selectedThread, markAsDelivered, markAsRead]);

//   // Organize messages into threads
//   useEffect(() => {
//     const threads = new Map<string, ChatThread>();

//     // Process anonymous messages
//     [...publicMessages, ...privateMessages]
//       .filter(msg => msg.type === 'anonymous')
//       .forEach(msg => {
//         const threadId = msg.anonymous_thread_id || msg.anonymous_name || msg.user_id;
//         const existingThread = threads.get(threadId);

//         if (!existingThread) {
//           threads.set(threadId, {
//             id: threadId,
//             name: msg.anonymous_name || 'Anonymous Student',
//             isAnonymous: true,
//             userId: msg.user_id,
//             anonymousThreadId: msg.anonymous_thread_id,
//             lastMessage: {
//               content: msg.content,
//               timestamp: msg.created_at,
//               isRead: !!msg.read_at,
//             },
//             unreadCount: msg.receiver_id === user?.id && !msg.read_at ? 1 : 0,
//           });
//         } else {
//           const messageTimestamp = new Date(msg.created_at).getTime();
//           const threadTimestamp = new Date(existingThread.lastMessage.timestamp).getTime();

//           if (messageTimestamp > threadTimestamp) {
//             existingThread.lastMessage = {
//               content: msg.content,
//               timestamp: msg.created_at,
//               isRead: !!msg.read_at,
//             };
//           }

//           if (msg.receiver_id === user?.id && !msg.read_at) {
//             existingThread.unreadCount++;
//           }
//         }
//       });

//     // Sort threads by last message timestamp
//     const sortedThreads = Array.from(threads.values()).sort((a, b) =>
//       new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
//     );

//     // Filter threads based on search query
//     const filteredThreads = sortedThreads.filter(thread =>
//       thread.name.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     setChatThreads(filteredThreads);
//   }, [publicMessages, privateMessages, searchQuery, user?.id]);

//   const handleSendReply = async () => {
//     if (!replyInput.trim() || !selectedThread) return;

//     try {
//       await sendMessage(
//         selectedThread.userId || selectedThread.id,
//         replyInput,
//         selectedThread.isAnonymous,
//         selectedThread.anonymousThreadId
//       );
//       setReplyInput('');
//     } catch (err) {
//       console.error('Failed to send reply:', err);
//     }
//   };

//   const formatTime = (timestamp: string) => {
//     const date = new Date(timestamp);
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);

//     if (date.toDateString() === today.toDateString()) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } else if (date.toDateString() === yesterday.toDateString()) {
//       return 'Yesterday';
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//     }
//   };

//   const getMessageStatus = (message: any) => {
//     if (message.sender_id === user?.id) {
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

//   const getThreadMessages = (thread: ChatThread) => {
//     return [...publicMessages, ...privateMessages]
//       .filter(msg =>
//         (msg.anonymous_thread_id === thread.anonymousThreadId) ||
//         (msg.anonymous_name === thread.name) ||
//         (msg.type === 'private' &&
//           ((msg.sender_id === thread.userId && msg.receiver_id === user?.id) ||
//            (msg.sender_id === user?.id && msg.receiver_id === thread.userId)))
//       )
//       .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
//   };

//   if (!session) return null;

//   const renderChatList = () => (
//     <div className="h-full flex flex-col">
//       <div className="p-4 bg-purple-600">
//         <h2 className="text-white font-semibold flex items-center gap-2">
//           <Lock size={20} />
//           Student Messages
//         </h2>
//       </div>

//       <div className="p-4 border-b">
//         <div className="relative">
//           <input
//             type="text"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             placeholder="Search conversations..."
//             className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//           />
//           <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         {chatThreads.map((thread) => (
//           <div
//             key={thread.id}
//             onClick={() => {
//               setSelectedThread(thread);
//               if (isMobileView) setShowChat(true);
//             }}
//             className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
//               selectedThread?.id === thread.id ? 'bg-purple-50' : ''
//             }`}
//           >
//             <div className="flex justify-between items-start mb-1">
//               <h3 className="font-medium flex items-center gap-2">
//                 {thread.name}
//                 {thread.isAnonymous && (
//                   <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
//                     Anonymous
//                   </span>
//                 )}
//               </h3>
//               <span className="text-xs text-gray-500">
//                 {formatTime(thread.lastMessage.timestamp)}
//               </span>
//             </div>
//             <div className="flex justify-between items-center">
//               <p className="text-sm text-gray-600 truncate max-w-[80%]">
//                 {thread.lastMessage.content}
//               </p>
//               {thread.unreadCount > 0 && (
//                 <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
//                   {thread.unreadCount}
//                 </span>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   const renderChat = () => {
//     if (!selectedThread) {
//       return (
//         <div className="h-full flex items-center justify-center text-gray-500">
//           <p>Select a conversation to start messaging</p>
//         </div>
//       );
//     }

//     const threadMessages = getThreadMessages(selectedThread);

//     return (
//       <div className="h-full flex flex-col">
//         <div className="p-4 bg-purple-600 flex items-center gap-4">
//           {isMobileView && (
//             <button
//               onClick={() => setShowChat(false)}
//               className="text-white hover:bg-purple-700 p-1 rounded"
//             >
//               <ArrowLeft size={24} />
//             </button>
//           )}
//           <div>
//             <h2 className="text-white font-semibold">{selectedThread.name}</h2>
//             {selectedThread.isAnonymous && (
//               <span className="text-xs bg-purple-800 text-purple-100 px-2 py-0.5 rounded-full">
//                 Anonymous
//               </span>
//             )}
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-4 space-y-4">
//           {threadMessages.map((message) => (
//             <div
//               key={message.id}
//               className={`flex flex-col ${
//                 message.sender_id === user?.id ? 'items-end' : 'items-start'
//               }`}
//             >
//               <div className="max-w-[80%]">
//                 <div
//                   className={`rounded-lg p-3 ${
//                     message.sender_id === user?.id
//                       ? 'bg-purple-600 text-white'
//                       : 'bg-gray-100 text-gray-800'
//                   }`}
//                 >
//                   <p>{message.content}</p>
//                 </div>
//                 <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
//                   <span>{formatTime(message.created_at)}</span>
//                   {getMessageStatus(message)}
//                 </div>
//               </div>
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>

//         <div className="p-4 border-t">
//           <div className="flex gap-2">
//             <input
//               type="text"
//               value={replyInput}
//               onChange={(e) => setReplyInput(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
//               placeholder="Type a message..."
//               className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//             />
//             <button
//               onClick={handleSendReply}
//               disabled={!replyInput.trim()}
//               className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
//             >
//               <Send size={20} />
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   if (isPublicLoading || isPrivateLoading) {
//     return (
//       <div className="h-[500px] w-full flex items-center justify-center">
//         <Loader2 className="animate-spin text-purple-600" size={32} />
//       </div>
//     );
//   }

//   if (publicError || privateError) {
//     return (
//       <div className="p-4 bg-red-100 text-red-700 rounded-lg">
//         {publicError || privateError}
//       </div>
//     );
//   }

//   return (
//     <div className="h-[500px] bg-white rounded-lg shadow-lg overflow-hidden">
//       <div className="h-full md:grid md:grid-cols-[350px,1fr]">
//         {/* Chat List */}
//         <div className={`h-full border-r ${isMobileView && showChat ? 'hidden' : ''}`}>
//           {renderChatList()}
//         </div>

//         {/* Chat Window */}
//         <div className={`h-full ${isMobileView && !showChat ? 'hidden' : ''}`}>
//           {renderChat()}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import { Lock, Send, Check, Loader2, Search, ArrowLeft } from "lucide-react";
import { useChatStore } from "../store/chat";
import { useAuthStore } from "../store/auth";
import { useSessionStore } from "../store/session";
import { usePrivateChatStore } from "../store/privateChat";
import {
  getUserId,
  getAnonymousThreadId,
  getSenderId,
  getReceiverId,
  isMessageRead,
  getMessageSenderName,
} from "../utils/messageUtils";

interface ChatThread {
  id: string;
  name: string;
  isAnonymous: boolean;
  userId?: string;
  anonymousThreadId?: string;
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export function ProfessorAnonymousMessage() {
  const { user } = useAuthStore();
  const { session } = useSessionStore();
  const {
    messages: publicMessages,
    isLoading: isPublicLoading,
    error: publicError,
  } = useChatStore();

  const {
    messages: privateMessages,
    isLoading: isPrivateLoading,
    error: privateError,
    sendMessage,
    markAsDelivered,
    markAsRead,
  } = usePrivateChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [privateMessages, selectedThread]);

  // Mark messages as delivered and read
  useEffect(() => {
    const undeliveredMessages = privateMessages.filter(
      (msg) => getReceiverId(msg) === user?.id && !msg.delivered_at
    );

    if (undeliveredMessages.length > 0) {
      undeliveredMessages.forEach((msg) => markAsDelivered(msg.id));
    }

    if (selectedThread) {
      const unreadMessages = privateMessages.filter(
        (msg) =>
          getReceiverId(msg) === user?.id &&
          !msg.read_at &&
          (msg.anonymous_name === selectedThread.name ||
            msg.sender?.full_name === selectedThread.name)
      );

      if (unreadMessages.length > 0) {
        unreadMessages.forEach((msg) => markAsRead(msg.id));
      }
    }
  }, [privateMessages, user?.id, selectedThread, markAsDelivered, markAsRead]);

  // Organize messages into threads
  useEffect(() => {
    const threads = new Map<string, ChatThread>();

    // Process anonymous messages
    [...publicMessages, ...privateMessages]
      .filter((msg) => msg.type === "anonymous")
      .forEach((msg) => {
        const threadId =
          getAnonymousThreadId(msg) || msg.anonymous_name || getUserId(msg);
        const existingThread = threads.get(threadId);

        if (!existingThread) {
          threads.set(threadId, {
            id: threadId,
            name: msg.anonymous_name || "Anonymous Student",
            isAnonymous: true,
            userId: getUserId(msg),
            anonymousThreadId: getAnonymousThreadId(msg),
            lastMessage: {
              content: msg.content,
              timestamp: msg.created_at,
              isRead: isMessageRead(msg),
            },
            unreadCount:
              getReceiverId(msg) === user?.id && !msg.read_at ? 1 : 0,
          });
        } else {
          const messageTimestamp = new Date(msg.created_at).getTime();
          const threadTimestamp = new Date(
            existingThread.lastMessage.timestamp
          ).getTime();

          if (messageTimestamp > threadTimestamp) {
            existingThread.lastMessage = {
              content: msg.content,
              timestamp: msg.created_at,
              isRead: isMessageRead(msg),
            };
          }

          if (getReceiverId(msg) === user?.id && !msg.read_at) {
            existingThread.unreadCount++;
          }
        }
      });

    // Sort threads by last message timestamp
    const sortedThreads = Array.from(threads.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.timestamp).getTime() -
        new Date(a.lastMessage.timestamp).getTime()
    );

    // Filter threads based on search query
    const filteredThreads = sortedThreads.filter((thread) =>
      thread.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setChatThreads(filteredThreads);
  }, [publicMessages, privateMessages, searchQuery, user?.id]);

  const handleSendReply = async () => {
    if (!replyInput.trim() || !selectedThread) return;

    try {
      await sendMessage(
        selectedThread.userId || selectedThread.id,
        replyInput,
        selectedThread.isAnonymous,
        selectedThread.anonymousThreadId
      );
      setReplyInput("");
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getMessageStatus = (message: any) => {
    if (getSenderId(message) === user?.id) {
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

  const getThreadMessages = (thread: ChatThread) => {
    return [...publicMessages, ...privateMessages]
      .filter(
        (msg) =>
          getAnonymousThreadId(msg) === thread.anonymousThreadId ||
          msg.anonymous_name === thread.name ||
          (msg.type === "private" &&
            ((getSenderId(msg) === thread.userId &&
              getReceiverId(msg) === user?.id) ||
              (getSenderId(msg) === user?.id &&
                getReceiverId(msg) === thread.userId)))
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  };

  if (!session) return null;

  const renderChatList = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-purple-600">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Lock size={20} />
          Student Messages
        </h2>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chatThreads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => {
              setSelectedThread(thread);
              if (isMobileView) setShowChat(true);
            }}
            className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
              selectedThread?.id === thread.id ? "bg-purple-50" : ""
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-medium flex items-center gap-2">
                {thread.name}
                {thread.isAnonymous && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                    Anonymous
                  </span>
                )}
              </h3>
              <span className="text-xs text-gray-500">
                {formatTime(thread.lastMessage.timestamp)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 truncate max-w-[80%]">
                {thread.lastMessage.content}
              </p>
              {thread.unreadCount > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  {thread.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChat = () => {
    if (!selectedThread) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <p>Select a conversation to start messaging</p>
        </div>
      );
    }

    const threadMessages = getThreadMessages(selectedThread);

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 bg-purple-600 flex items-center gap-4">
          {isMobileView && (
            <button
              onClick={() => setShowChat(false)}
              className="text-white hover:bg-purple-700 p-1 rounded"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div>
            <h2 className="text-white font-semibold">{selectedThread.name}</h2>
            {selectedThread.isAnonymous && (
              <span className="text-xs bg-purple-800 text-purple-100 px-2 py-0.5 rounded-full">
                Anonymous
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {threadMessages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                getSenderId(message) === user?.id ? "items-end" : "items-start"
              }`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`rounded-lg p-3 ${
                    getSenderId(message) === user?.id
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p>{message.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{formatTime(message.created_at)}</span>
                  {getMessageStatus(message)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyInput.trim()}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isPublicLoading || isPrivateLoading) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (publicError || privateError) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {publicError || privateError}
      </div>
    );
  }

  return (
    <div className="h-[500px] bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="h-full md:grid md:grid-cols-[350px,1fr]">
        {/* Chat List */}
        <div
          className={`h-full border-r ${
            isMobileView && showChat ? "hidden" : ""
          }`}
        >
          {renderChatList()}
        </div>

        {/* Chat Window */}
        <div className={`h-full ${isMobileView && !showChat ? "hidden" : ""}`}>
          {renderChat()}
        </div>
      </div>
    </div>
  );
}
