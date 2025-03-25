import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { ChatBox } from "./ChatBox";
import { ClassroomChat } from "./ClassroomChat";
import { AnonymousMessage } from "./AnonymousMessage";
import { PollsUI } from "./PollsUI";
import {
  MessageSquare,
  Brain,
  Lock,
  X,
  Minimize2,
  Maximize2,
  BarChart3,
} from "lucide-react";
import { useSessionStore } from "../store/session";
import { useOverlayStore } from "../store/overlay";

export function FloatingOverlay() {
  const {
    activeTab,
    isMinimized,
    position,
    toggleTab,
    setMinimized,
    closeOverlay,
    setPosition,
  } = useOverlayStore();
  const { session } = useSessionStore();
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update bounds when window resizes
  useEffect(() => {
    const updateBounds = () => {
      if (overlayRef.current) {
        const rect = overlayRef.current.getBoundingClientRect();
        setBounds({
          left: 0,
          top: 0,
          right: window.innerWidth - rect.width,
          bottom: window.innerHeight - rect.height,
        });
      }
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, [activeTab, isMinimized]);

  // Ensure position stays within bounds
  useEffect(() => {
    const newPosition = {
      x: Math.min(Math.max(position.x, bounds.left), bounds.right),
      y: Math.min(Math.max(position.y, bounds.top), bounds.bottom),
    };
    if (newPosition.x !== position.x || newPosition.y !== position.y) {
      setPosition(newPosition);
    }
  }, [bounds, position, setPosition]);

  // Check if tab is allowed based on session status
  const isTabAllowed = (tab: string): boolean => {
    if (tab === "ai") return true; // AI chat always allowed
    return session?.status === "active"; // Other features need active session
  };

  const handleDragStop = (_e: any, data: { x: number; y: number }) => {
    const newPosition = {
      x: Math.min(Math.max(data.x, bounds.left), bounds.right),
      y: Math.min(Math.max(data.y, bounds.top), bounds.bottom),
    };
    setPosition(newPosition);
  };

  const handleTabClick = (tab: string) => {
    if (isTabAllowed(tab)) {
      setIsTransitioning(true);
      toggleTab(tab as any);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tab: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(tab);
    }
  };

  if (!activeTab && !isMinimized) return null;

  return (
    <div className="fixed inset-0 pointer-events-none">
      <Draggable
        nodeRef={dragRef}
        position={position}
        onStop={handleDragStop}
        bounds="parent"
        handle=".overlay-header"
      >
        <div
          ref={dragRef}
          className="absolute pointer-events-auto"
          style={{ zIndex: 9999 }}
        >
          {isMinimized ? (
            <button
              onClick={() => setMinimized(false)}
              className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
              aria-label="Maximize overlay"
            >
              <Maximize2 size={24} />
            </button>
          ) : (
            <div
              ref={overlayRef}
              className="bg-white rounded-lg shadow-xl transition-all duration-300"
              role="dialog"
              aria-label="Chat overlay"
            >
              <div className="overlay-header flex items-center justify-between p-2 bg-gray-100 rounded-t-lg cursor-grab active:cursor-grabbing">
                <div
                  className="flex gap-2"
                  role="tablist"
                  aria-label="Chat features"
                >
                  <button
                    role="tab"
                    aria-selected={activeTab === "ai"}
                    aria-controls="ai-panel"
                    onClick={() => handleTabClick("ai")}
                    onKeyDown={(e) => handleKeyDown(e, "ai")}
                    className={`p-2 rounded-lg transition-colors ${
                      activeTab === "ai"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Brain size={20} />
                    <span className="sr-only">AI Assistant</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === "chat"}
                    aria-controls="chat-panel"
                    onClick={() => handleTabClick("chat")}
                    onKeyDown={(e) => handleKeyDown(e, "chat")}
                    disabled={!isTabAllowed("chat")}
                    className={`p-2 rounded-lg transition-colors ${
                      !isTabAllowed("chat")
                        ? "opacity-50 cursor-not-allowed text-gray-400"
                        : activeTab === "chat"
                          ? "bg-green-600 text-white"
                          : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title={
                      !isTabAllowed("chat")
                        ? "Join a session to access class chat"
                        : ""
                    }
                  >
                    <MessageSquare size={20} />
                    <span className="sr-only">Class Chat</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === "anonymous"}
                    aria-controls="anonymous-panel"
                    onClick={() => handleTabClick("anonymous")}
                    onKeyDown={(e) => handleKeyDown(e, "anonymous")}
                    disabled={!isTabAllowed("anonymous")}
                    className={`p-2 rounded-lg transition-colors ${
                      !isTabAllowed("anonymous")
                        ? "opacity-50 cursor-not-allowed text-gray-400"
                        : activeTab === "anonymous"
                          ? "bg-purple-600 text-white"
                          : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title={
                      !isTabAllowed("anonymous")
                        ? "Join a session to send anonymous messages"
                        : ""
                    }
                  >
                    <Lock size={20} />
                    <span className="sr-only">Anonymous Messages</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === "polls"}
                    aria-controls="polls-panel"
                    onClick={() => handleTabClick("polls")}
                    onKeyDown={(e) => handleKeyDown(e, "polls")}
                    disabled={!isTabAllowed("polls")}
                    className={`p-2 rounded-lg transition-colors ${
                      !isTabAllowed("polls")
                        ? "opacity-50 cursor-not-allowed text-gray-400"
                        : activeTab === "polls"
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-200"
                    }`}
                    title={
                      !isTabAllowed("polls")
                        ? "Join a session to participate in polls"
                        : ""
                    }
                  >
                    <BarChart3 size={20} />
                    <span className="sr-only">Polls</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMinimized(true)}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                    aria-label="Minimize overlay"
                  >
                    <Minimize2 size={20} />
                  </button>
                  <button
                    onClick={closeOverlay}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                    aria-label="Close overlay"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div
                  role="tabpanel"
                  id="ai-panel"
                  aria-labelledby="ai-tab"
                  className={`transition-opacity duration-300 ${
                    isTransitioning ? "opacity-0" : "opacity-100"
                  }`}
                  hidden={activeTab !== "ai"}
                >
                  {activeTab === "ai" && <ChatBox />}
                </div>
                <div
                  role="tabpanel"
                  id="chat-panel"
                  aria-labelledby="chat-tab"
                  className={`transition-opacity duration-300 ${
                    isTransitioning ? "opacity-0" : "opacity-100"
                  }`}
                  hidden={activeTab !== "chat"}
                >
                  {activeTab === "chat" && isTabAllowed("chat") && (
                    <ClassroomChat />
                  )}
                </div>
                <div
                  role="tabpanel"
                  id="anonymous-panel"
                  aria-labelledby="anonymous-tab"
                  className={`transition-opacity duration-300 ${
                    isTransitioning ? "opacity-0" : "opacity-100"
                  }`}
                  hidden={activeTab !== "anonymous"}
                >
                  {activeTab === "anonymous" && isTabAllowed("anonymous") && (
                    <AnonymousMessage />
                  )}
                </div>
                <div
                  role="tabpanel"
                  id="polls-panel"
                  aria-labelledby="polls-tab"
                  className={`transition-opacity duration-300 ${
                    isTransitioning ? "opacity-0" : "opacity-100"
                  }`}
                  hidden={activeTab !== "polls"}
                >
                  {activeTab === "polls" && isTabAllowed("polls") && (
                    <PollsUI />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Draggable>
    </div>
  );
}
//----------------------------------------------------------------
// import React, { useState, useEffect, useRef } from "react";
// import Draggable from "react-draggable";
// import { ChatBox } from "./ChatBox";
// import { ClassroomChat } from "./ClassroomChat";
// import { AnonymousMessage } from "./AnonymousMessage";
// import { PollsUI } from "./PollsUI";
// import {
//   MessageSquare,
//   Brain,
//   Lock,
//   X,
//   Minimize2,
//   Maximize2,
//   BarChart3,
//   LogOut,
// } from "lucide-react";
// import { useOverlayStore } from "../store/overlay";
// import { useSessionStore } from "../store/session";
// import { useAuthStore } from "../store/auth";

// export function FloatingOverlay() {
//   console.log("[AskLynk] FloatingOverlay rendered");

//   const {
//     activeTab,
//     isMinimized,
//     position,
//     toggleTab,
//     setMinimized,
//     closeOverlay,
//     setPosition,
//   } = useOverlayStore();

//   const { session } = useSessionStore();
//   const { user, signOut } = useAuthStore();

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const dragRef = useRef<HTMLDivElement>(null);
//   const [bounds, setBounds] = useState({
//     left: 0,
//     top: 0,
//     right: 0,
//     bottom: 0,
//   });
//   const [isTransitioning, setIsTransitioning] = useState(false);

//   // Update bounds when window resizes
//   useEffect(() => {
//     const updateBounds = () => {
//       if (overlayRef.current) {
//         const rect = overlayRef.current.getBoundingClientRect();
//         setBounds({
//           left: 0,
//           top: 0,
//           right: window.innerWidth - rect.width,
//           bottom: window.innerHeight - rect.height,
//         });
//       }
//     };

//     updateBounds();
//     window.addEventListener("resize", updateBounds);
//     return () => window.removeEventListener("resize", updateBounds);
//   }, [activeTab, isMinimized]);

//   // Ensure position stays within bounds
//   useEffect(() => {
//     const newPosition = {
//       x: Math.min(Math.max(position.x, bounds.left), bounds.right),
//       y: Math.min(Math.max(position.y, bounds.top), bounds.bottom),
//     };
//     if (newPosition.x !== position.x || newPosition.y !== position.y) {
//       setPosition(newPosition);
//     }
//   }, [bounds, position, setPosition]);

//   // Create dialog box on mount - for testing
//   useEffect(() => {
//     console.log("[AskLynk] FloatingOverlay useEffect triggered");

//     // Debug message to confirm overlay is mounted
//     const overlayElement = document.getElementById("asklynk-floating-overlay");
//     if (overlayElement) {
//       console.log("[AskLynk] Overlay element found in DOM");
//     } else {
//       console.error("[AskLynk] Overlay element NOT found in DOM");
//     }
//   }, []);

//   // Handle closing the overlay
//   const handleClose = () => {
//     closeOverlay();

//     // Hide the entire app
//     if (window.__ASKLYNK_STATE__) {
//       window.__ASKLYNK_STATE__.showOverlay = false;
//     }
//   };

//   // Handle sign out
//   const handleSignOut = () => {
//     signOut();

//     // Hide the overlay after signing out
//     if (window.__ASKLYNK_STATE__) {
//       window.__ASKLYNK_STATE__.showOverlay = false;
//     }
//   };

//   // Check if tab is allowed based on session status
//   const isTabAllowed = (tab: string): boolean => {
//     if (tab === "ai") return true; // AI chat always allowed
//     return session?.status === "active"; // Other features need active session
//   };

//   const handleDragStop = (_e: any, data: { x: number; y: number }) => {
//     const newPosition = {
//       x: Math.min(Math.max(data.x, bounds.left), bounds.right),
//       y: Math.min(Math.max(data.y, bounds.top), bounds.bottom),
//     };
//     setPosition(newPosition);
//   };

//   const handleTabClick = (tab: string) => {
//     if (isTabAllowed(tab)) {
//       setIsTransitioning(true);
//       toggleTab(tab as any);
//       setTimeout(() => setIsTransitioning(false), 300);
//     }
//   };

//   if (!activeTab && !isMinimized) return null;

//   console.log("[AskLynk] Rendering floating overlay", {
//     activeTab,
//     isMinimized,
//   });

//   return (
//     <div className="fixed inset-0 pointer-events-none">
//       <Draggable
//         nodeRef={dragRef}
//         position={position}
//         onStop={handleDragStop}
//         bounds="parent"
//         handle=".overlay-header"
//       >
//         <div
//           ref={dragRef}
//           className="absolute pointer-events-auto"
//           style={{ zIndex: 9999 }}
//         >
//           {isMinimized ? (
//             <button
//               onClick={() => setMinimized(false)}
//               className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
//               aria-label="Maximize overlay"
//             >
//               <Maximize2 size={24} />
//             </button>
//           ) : (
//             <div
//               ref={overlayRef}
//               className="bg-white rounded-lg shadow-xl transition-all duration-300 w-80 asklynk-dialog"
//               style={{ maxHeight: "80vh" }}
//               role="dialog"
//               aria-label="Chat overlay"
//             >
//               {/* User Info Bar */}
//               <div className="bg-indigo-600 text-white p-2 text-sm rounded-t-lg flex justify-between items-center">
//                 <div className="flex items-center gap-2">
//                   <div className="w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold">
//                     {user?.full_name?.charAt(0) || "?"}
//                   </div>
//                   <div className="flex flex-col">
//                     <span className="font-medium">
//                       {user?.full_name || "User"}
//                     </span>
//                     <span className="text-xs opacity-80 capitalize">
//                       {user?.role || ""}
//                     </span>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleSignOut}
//                   className="text-white/80 hover:text-white p-1 rounded transition-colors"
//                   aria-label="Sign out"
//                   title="Sign out"
//                 >
//                   <LogOut size={16} />
//                 </button>
//               </div>

//               <div className="overlay-header flex items-center justify-between p-2 bg-gray-100 border-b cursor-grab active:cursor-grabbing">
//                 <div
//                   className="flex gap-2"
//                   role="tablist"
//                   aria-label="Chat features"
//                 >
//                   <button
//                     role="tab"
//                     aria-selected={activeTab === "ai"}
//                     aria-controls="ai-panel"
//                     onClick={() => handleTabClick("ai")}
//                     className={`p-2 rounded-lg transition-colors ${
//                       activeTab === "ai"
//                         ? "bg-indigo-600 text-white"
//                         : "text-gray-600 hover:bg-gray-200"
//                     }`}
//                   >
//                     <Brain size={20} />
//                     <span className="sr-only">AI Assistant</span>
//                   </button>
//                   <button
//                     role="tab"
//                     aria-selected={activeTab === "chat"}
//                     aria-controls="chat-panel"
//                     onClick={() => handleTabClick("chat")}
//                     disabled={!isTabAllowed("chat")}
//                     className={`p-2 rounded-lg transition-colors ${
//                       !isTabAllowed("chat")
//                         ? "opacity-50 cursor-not-allowed text-gray-400"
//                         : activeTab === "chat"
//                           ? "bg-green-600 text-white"
//                           : "text-gray-600 hover:bg-gray-200"
//                     }`}
//                     title={
//                       !isTabAllowed("chat")
//                         ? "Join a session to access class chat"
//                         : ""
//                     }
//                   >
//                     <MessageSquare size={20} />
//                     <span className="sr-only">Class Chat</span>
//                   </button>
//                   <button
//                     role="tab"
//                     aria-selected={activeTab === "anonymous"}
//                     aria-controls="anonymous-panel"
//                     onClick={() => handleTabClick("anonymous")}
//                     disabled={!isTabAllowed("anonymous")}
//                     className={`p-2 rounded-lg transition-colors ${
//                       !isTabAllowed("anonymous")
//                         ? "opacity-50 cursor-not-allowed text-gray-400"
//                         : activeTab === "anonymous"
//                           ? "bg-purple-600 text-white"
//                           : "text-gray-600 hover:bg-gray-200"
//                     }`}
//                     title={
//                       !isTabAllowed("anonymous")
//                         ? "Join a session to send anonymous messages"
//                         : ""
//                     }
//                   >
//                     <Lock size={20} />
//                     <span className="sr-only">Anonymous Messages</span>
//                   </button>
//                   <button
//                     role="tab"
//                     aria-selected={activeTab === "polls"}
//                     aria-controls="polls-panel"
//                     onClick={() => handleTabClick("polls")}
//                     disabled={!isTabAllowed("polls")}
//                     className={`p-2 rounded-lg transition-colors ${
//                       !isTabAllowed("polls")
//                         ? "opacity-50 cursor-not-allowed text-gray-400"
//                         : activeTab === "polls"
//                           ? "bg-blue-600 text-white"
//                           : "text-gray-600 hover:bg-gray-200"
//                     }`}
//                     title={
//                       !isTabAllowed("polls")
//                         ? "Join a session to participate in polls"
//                         : ""
//                     }
//                   >
//                     <BarChart3 size={20} />
//                     <span className="sr-only">Polls</span>
//                   </button>
//                 </div>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setMinimized(true)}
//                     className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
//                     aria-label="Minimize overlay"
//                   >
//                     <Minimize2 size={20} />
//                   </button>
//                   <button
//                     onClick={handleClose}
//                     className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
//                     aria-label="Close overlay"
//                   >
//                     <X size={20} />
//                   </button>
//                 </div>
//               </div>

//               <div
//                 className="p-4 overflow-y-auto"
//                 style={{ maxHeight: "calc(80vh - 120px)" }}
//               >
//                 {/* Tab Panel Heading */}
//                 <div className="mb-3">
//                   <h2 className="font-medium text-lg">
//                     {activeTab === "ai" && "AI Assistant"}
//                     {activeTab === "chat" && "Class Chat"}
//                     {activeTab === "anonymous" && "Anonymous Messages"}
//                     {activeTab === "polls" && "Polls"}
//                   </h2>
//                   <p className="text-sm text-gray-500">
//                     {activeTab === "ai" && "Ask questions about your class"}
//                     {activeTab === "chat" && "Communicate with your classmates"}
//                     {activeTab === "anonymous" && "Send anonymous questions"}
//                     {activeTab === "polls" && "View and participate in polls"}
//                   </p>
//                 </div>

//                 {/* Tab Content */}
//                 <div
//                   role="tabpanel"
//                   id="ai-panel"
//                   className={`transition-opacity duration-300 ${
//                     isTransitioning ? "opacity-0" : "opacity-100"
//                   }`}
//                   hidden={activeTab !== "ai"}
//                 >
//                   {activeTab === "ai" && <ChatBox />}
//                 </div>
//                 <div
//                   role="tabpanel"
//                   id="chat-panel"
//                   className={`transition-opacity duration-300 ${
//                     isTransitioning ? "opacity-0" : "opacity-100"
//                   }`}
//                   hidden={activeTab !== "chat"}
//                 >
//                   {activeTab === "chat" && isTabAllowed("chat") && (
//                     <ClassroomChat />
//                   )}
//                 </div>
//                 <div
//                   role="tabpanel"
//                   id="anonymous-panel"
//                   className={`transition-opacity duration-300 ${
//                     isTransitioning ? "opacity-0" : "opacity-100"
//                   }`}
//                   hidden={activeTab !== "anonymous"}
//                 >
//                   {activeTab === "anonymous" && isTabAllowed("anonymous") && (
//                     <AnonymousMessage />
//                   )}
//                 </div>
//                 <div
//                   role="tabpanel"
//                   id="polls-panel"
//                   className={`transition-opacity duration-300 ${
//                     isTransitioning ? "opacity-0" : "opacity-100"
//                   }`}
//                   hidden={activeTab !== "polls"}
//                 >
//                   {activeTab === "polls" && isTabAllowed("polls") && (
//                     <PollsUI />
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </Draggable>
//     </div>
//   );
// }

// // ----------------------------------------------------------------
// ----------------------------------------------------------------
// import React, { useState, useEffect, useRef } from "react";
// import Draggable from "react-draggable";
// import { ChatBox } from "./ChatBox";
// import { ClassroomChat } from "./ClassroomChat";
// import { AnonymousMessage } from "./AnonymousMessage";
// import { PollsUI } from "./PollsUI";
// import {
//   MessageSquare,
//   Brain,
//   Lock,
//   X,
//   Minimize2,
//   Maximize2,
//   BarChart3,
//   LogOut,
//   Plus,
//   Clock,
//   Users,
//   Mail,
//   History,
//   CheckCircle,
//   Home,
//   Loader2,
//   ArrowLeft,
//   LogIn,
//   Download,
// } from "lucide-react";
// import { useOverlayStore } from "../store/overlay";
// import { useSessionStore } from "../store/session";
// import { useAuthStore } from "../store/auth";

// export function FloatingOverlay() {
//   console.log("[AskLynk] FloatingOverlay rendered");

//   const {
//     activeTab,
//     isMinimized,
//     position,
//     toggleTab,
//     setMinimized,
//     closeOverlay,
//     setPosition,
//     setActiveTab,
//   } = useOverlayStore();

//   const {
//     session,
//     sessions,
//     isLoading,
//     error,
//     createSession,
//     endSession,
//     loadSessions,
//     joinSession,
//     clearSession,
//   } = useSessionStore();

//   const { user, signOut } = useAuthStore();

//   // New state for dashboard views
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [showHistory, setShowHistory] = useState(false);
//   const [joinSessionView, setJoinSessionView] = useState(false);
//   const [sessionCode, setSessionCode] = useState("");
//   const [sessionTitle, setSessionTitle] = useState("");
//   const [sessionDescription, setSessionDescription] = useState("");
//   const [sessionDuration, setSessionDuration] = useState("");
//   const [showEndedSummary, setShowEndedSummary] = useState(false);

//   const overlayRef = useRef<HTMLDivElement>(null);
//   const dragRef = useRef<HTMLDivElement>(null);
//   const [bounds, setBounds] = useState({
//     left: 0,
//     top: 0,
//     right: 0,
//     bottom: 0,
//   });
//   const [isTransitioning, setIsTransitioning] = useState(false);

//   // Load sessions for professors on mount
//   useEffect(() => {
//     if (user?.role === "professor") {
//       loadSessions();
//     }
//   }, [loadSessions, user?.role]);

//   useEffect(() => {
//     const handleShowDashboard = (event: CustomEvent) => {
//       if (event.detail?.showDashboard) {
//         setMinimized(false); // Ensure not minimized
//         setActiveTab(null); // Set to dashboard view
//       }
//     };

//     document.addEventListener(
//       "asklynk-show-dashboard",
//       handleShowDashboard as EventListener
//     );

//     return () => {
//       document.removeEventListener(
//         "asklynk-show-dashboard",
//         handleShowDashboard as EventListener
//       );
//     };
//   }, [setMinimized, setActiveTab]);
//   // Calculate session duration if in active session
//   useEffect(() => {
//     if (session?.status === "active") {
//       const interval = setInterval(() => {
//         const start = new Date(session.created_at);
//         const now = new Date();
//         const diff = now.getTime() - start.getTime();
//         const hours = Math.floor(diff / (1000 * 60 * 60));
//         const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//         setSessionDuration(`${hours}h ${minutes}m`);
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [session]);

//   // Show ended summary when session ends
//   useEffect(() => {
//     if (session?.status === "ended") {
//       setShowEndedSummary(true);
//     } else {
//       setShowEndedSummary(false);
//     }
//   }, [session?.status]);

//   // Update bounds when window resizes
//   useEffect(() => {
//     const updateBounds = () => {
//       if (overlayRef.current) {
//         const rect = overlayRef.current.getBoundingClientRect();
//         setBounds({
//           left: 0,
//           top: 0,
//           right: window.innerWidth - rect.width,
//           bottom: window.innerHeight - rect.height,
//         });
//       }
//     };

//     updateBounds();
//     window.addEventListener("resize", updateBounds);
//     return () => window.removeEventListener("resize", updateBounds);
//   }, [activeTab, isMinimized]);

//   // Ensure position stays within bounds
//   useEffect(() => {
//     const newPosition = {
//       x: Math.min(Math.max(position.x, bounds.left), bounds.right),
//       y: Math.min(Math.max(position.y, bounds.top), bounds.bottom),
//     };
//     if (newPosition.x !== position.x || newPosition.y !== position.y) {
//       setPosition(newPosition);
//     }
//   }, [bounds, position, setPosition]);

//   // Create dialog box on mount - for testing
//   useEffect(() => {
//     console.log("[AskLynk] FloatingOverlay useEffect triggered");

//     // Debug message to confirm overlay is mounted
//     const overlayElement = document.getElementById("asklynk-floating-overlay");
//     if (overlayElement) {
//       console.log("[AskLynk] Overlay element found in DOM");
//     } else {
//       console.error("[AskLynk] Overlay element NOT found in DOM");
//     }
//   }, []);

//   // Handle closing the overlay
//   const handleClose = () => {
//     closeOverlay();

//     // Hide the entire app
//     if (window.__ASKLYNK_STATE__) {
//       window.__ASKLYNK_STATE__.showOverlay = false;
//     }
//   };

//   // Handle sign out
//   const handleSignOut = () => {
//     signOut();

//     // Hide the overlay after signing out
//     if (window.__ASKLYNK_STATE__) {
//       window.__ASKLYNK_STATE__.showOverlay = false;
//     }
//   };

//   // Check if tab is allowed based on session status
//   const isTabAllowed = (tab: string): boolean => {
//     if (tab === "ai") return true; // AI chat always allowed
//     return session?.status === "active"; // Other features need active session
//   };

//   const handleDragStop = (_e: any, data: { x: number; y: number }) => {
//     const newPosition = {
//       x: Math.min(Math.max(data.x, bounds.left), bounds.right),
//       y: Math.min(Math.max(data.y, bounds.top), bounds.bottom),
//     };
//     setPosition(newPosition);
//   };

//   const handleTabClick = (tab: string) => {
//     if (isTabAllowed(tab)) {
//       setIsTransitioning(true);
//       toggleTab(tab as any);
//       setTimeout(() => setIsTransitioning(false), 300);
//     }
//   };

//   // Professor dashboard actions
//   const handleCreateSession = async (e: React.FormEvent) => {
//     e.preventDefault();
//     await createSession(sessionTitle, sessionDescription);
//     setSessionTitle("");
//     setSessionDescription("");
//     setShowCreateForm(false);
//   };

//   const handleEndSession = async () => {
//     if (window.confirm("Are you sure you want to end this session?")) {
//       await endSession();
//     }
//   };

//   // Student dashboard actions
//   const handleJoinSession = async (e: React.FormEvent) => {
//     e.preventDefault();
//     await joinSession(sessionCode);
//     setJoinSessionView(false);
//     // The session will be set by the joinSession function if successful
//   };

//   // Professor dashboard components
//   const renderProfessorDashboard = () => (
//     <>
//       <div className="mb-3">
//         <h2 className="font-medium text-lg">Professor Dashboard</h2>
//         <p className="text-sm text-gray-500">
//           Create a session or access AI assistance
//         </p>
//       </div>

//       <div className="space-y-4">
//         <div
//           className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 cursor-pointer transition-colors"
//           onClick={() => setActiveTab("ai")}
//         >
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
//               <Brain size={24} />
//             </div>
//             <div>
//               <h3 className="font-medium">AI Teaching Assistant</h3>
//               <p className="text-sm text-gray-500">
//                 Get instant help with lesson planning
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="flex gap-2">
//           <button
//             onClick={() => setShowCreateForm(true)}
//             className="flex-1 bg-indigo-600 text-white rounded-lg p-3 hover:bg-indigo-700 flex items-center justify-center gap-2"
//           >
//             <Plus size={18} />
//             Create Session
//           </button>

//           <button
//             onClick={() => setShowHistory(true)}
//             className="flex-1 bg-gray-100 text-gray-700 rounded-lg p-3 hover:bg-gray-200 flex items-center justify-center gap-2"
//           >
//             <History size={18} />
//             Session History
//           </button>
//         </div>
//       </div>
//     </>
//   );

//   const renderCreateSessionForm = () => (
//     <>
//       <div className="flex items-center justify-between mb-3">
//         <h2 className="font-medium text-lg">Create New Session</h2>
//         <button
//           onClick={() => setShowCreateForm(false)}
//           className="text-gray-500 hover:text-gray-700"
//         >
//           <ArrowLeft size={18} />
//         </button>
//       </div>

//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
//           {error}
//         </div>
//       )}

//       <form onSubmit={handleCreateSession} className="space-y-3">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Session Title
//           </label>
//           <input
//             type="text"
//             value={sessionTitle}
//             onChange={(e) => setSessionTitle(e.target.value)}
//             className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Description
//           </label>
//           <textarea
//             value={sessionDescription}
//             onChange={(e) => setSessionDescription(e.target.value)}
//             className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//             rows={3}
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={isLoading}
//           className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
//         >
//           {isLoading ? (
//             <Loader2 size={20} className="animate-spin" />
//           ) : (
//             <Plus size={20} />
//           )}
//           Create Session
//         </button>
//       </form>
//     </>
//   );

//   const renderSessionHistory = () => (
//     <>
//       <div className="flex items-center justify-between mb-3">
//         <h2 className="font-medium text-lg">Session History</h2>
//         <button
//           onClick={() => setShowHistory(false)}
//           className="text-gray-500 hover:text-gray-700"
//         >
//           <ArrowLeft size={18} />
//         </button>
//       </div>

//       <div className="space-y-3 max-h-64 overflow-y-auto">
//         {sessions.length === 0 ? (
//           <p className="text-gray-500 text-center py-4">
//             No session history found
//           </p>
//         ) : (
//           sessions.map((s) => (
//             <div
//               key={s.id}
//               className="p-3 border rounded-lg hover:border-indigo-300 transition-colors cursor-pointer"
//               onClick={() => {
//                 // Logic to load this session
//                 console.log("Load session:", s.id);
//               }}
//             >
//               <div className="flex justify-between items-center">
//                 <h3 className="font-medium">{s.title}</h3>
//                 <span
//                   className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
//                     s.status === "active"
//                       ? "bg-green-100 text-green-800"
//                       : "bg-gray-100 text-gray-800"
//                   }`}
//                 >
//                   {s.status}
//                 </span>
//               </div>
//               <div className="flex items-center text-sm text-gray-500 mt-1 gap-3">
//                 <span>Code: {s.code}</span>
//                 <span>Students: {s.student_count || 0}</span>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </>
//   );

//   // Student dashboard components
//   const renderStudentDashboard = () => (
//     <>
//       <div className="mb-3">
//         <h2 className="font-medium text-lg">Student Dashboard</h2>
//         <p className="text-sm text-gray-500">
//           Join a session or access AI assistance
//         </p>
//       </div>

//       <div className="space-y-4">
//         <div
//           className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 cursor-pointer transition-colors"
//           onClick={() => setActiveTab("ai")}
//         >
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
//               <Brain size={24} />
//             </div>
//             <div>
//               <h3 className="font-medium">AI Learning Assistant</h3>
//               <p className="text-sm text-gray-500">
//                 Get help with your studies anytime
//               </p>
//             </div>
//           </div>
//         </div>

//         <button
//           onClick={() => setJoinSessionView(true)}
//           className="w-full bg-indigo-600 text-white rounded-lg p-3 hover:bg-indigo-700 flex items-center justify-center gap-2"
//         >
//           <LogIn size={18} />
//           Join Session
//         </button>
//       </div>
//     </>
//   );

//   const renderJoinSessionForm = () => (
//     <>
//       <div className="flex items-center justify-between mb-3">
//         <h2 className="font-medium text-lg">Join Session</h2>
//         <button
//           onClick={() => setJoinSessionView(false)}
//           className="text-gray-500 hover:text-gray-700"
//         >
//           <ArrowLeft size={18} />
//         </button>
//       </div>

//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
//           {error}
//         </div>
//       )}

//       <form onSubmit={handleJoinSession} className="space-y-3">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Session Code
//           </label>
//           <input
//             type="text"
//             value={sessionCode}
//             onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
//             className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
//             placeholder="Enter 6-digit code"
//             maxLength={6}
//             required
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={isLoading}
//           className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
//         >
//           {isLoading ? (
//             <Loader2 size={20} className="animate-spin" />
//           ) : (
//             <LogIn size={20} />
//           )}
//           Join Session
//         </button>
//       </form>
//     </>
//   );

//   // Active session dashboard (for both roles)
//   const renderActiveSessionDashboard = () => {
//     if (!session) return null;

//     return (
//       <>
//         <div className="flex items-center justify-between mb-3">
//           <div>
//             <h2 className="font-medium text-lg">{session.title}</h2>
//             <div className="flex items-center gap-2 mt-1 text-sm">
//               <span className="font-mono font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">
//                 {session.code}
//               </span>
//               {sessionDuration && (
//                 <span className="text-gray-500 flex items-center">
//                   <Clock size={12} className="mr-1" />
//                   {sessionDuration}
//                 </span>
//               )}
//               <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                 <CheckCircle size={10} className="mr-1" />
//                 Active
//               </span>
//             </div>
//           </div>
//           {user?.role === "professor" && (
//             <button
//               onClick={handleEndSession}
//               className="text-red-600 hover:bg-red-50 p-1.5 rounded"
//             >
//               End
//             </button>
//           )}
//         </div>

//         <div className="grid grid-cols-2 gap-2 mb-3">
//           <div
//             className="p-3 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer transition-colors"
//             onClick={() => setActiveTab("chat")}
//           >
//             <div className="flex items-center gap-2">
//               <MessageSquare size={16} className="text-green-600" />
//               <span className="font-medium text-sm">Class Chat</span>
//             </div>
//           </div>

//           <div
//             className="p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 cursor-pointer transition-colors"
//             onClick={() => setActiveTab("ai")}
//           >
//             <div className="flex items-center gap-2">
//               <Brain size={16} className="text-indigo-600" />
//               <span className="font-medium text-sm">AI Assistant</span>
//             </div>
//           </div>

//           <div
//             className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors"
//             onClick={() => setActiveTab("anonymous")}
//           >
//             <div className="flex items-center gap-2">
//               <Lock size={16} className="text-purple-600" />
//               <span className="font-medium text-sm">Anonymous</span>
//             </div>
//           </div>

//           <div
//             className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
//             onClick={() => setActiveTab("polls")}
//           >
//             <div className="flex items-center gap-2">
//               <BarChart3 size={16} className="text-blue-600" />
//               <span className="font-medium text-sm">Polls</span>
//             </div>
//           </div>
//         </div>

//         {user?.role === "professor" && (
//           <div className="bg-gray-50 rounded-lg p-3 mb-2">
//             <div className="grid grid-cols-2 gap-2 text-center">
//               <div>
//                 <div className="flex items-center justify-center gap-1 text-gray-600">
//                   <Users size={14} />
//                   <span className="text-xs">Students</span>
//                 </div>
//                 <div className="font-bold">{session.student_count || 0}</div>
//               </div>
//               <div>
//                 <div className="flex items-center justify-center gap-1 text-gray-600">
//                   <MessageSquare size={14} />
//                   <span className="text-xs">Messages</span>
//                 </div>
//                 <div className="font-bold">{session.message_count || 0}</div>
//               </div>
//             </div>
//           </div>
//         )}
//       </>
//     );
//   };

//   const renderSessionEndedSummary = () => {
//     if (!session) return null;

//     return (
//       <>
//         <div className="text-center mb-3">
//           <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full mb-2">
//             <CheckCircle size={20} />
//           </div>
//           <h2 className="font-medium text-lg">Session Ended</h2>
//           <p className="text-sm text-gray-500">
//             "{session.title}" has ended successfully
//           </p>
//         </div>

//         <div className="grid grid-cols-2 gap-2 mb-3">
//           <div className="bg-gray-50 p-2 rounded-lg text-center">
//             <div className="text-lg font-bold text-indigo-600">
//               {session.student_count || 0}
//             </div>
//             <div className="text-xs text-gray-500">Students</div>
//           </div>
//           <div className="bg-gray-50 p-2 rounded-lg text-center">
//             <div className="text-lg font-bold text-green-600">
//               {session.message_count || 0}
//             </div>
//             <div className="text-xs text-gray-500">Messages</div>
//           </div>
//         </div>

//         <div className="flex flex-col gap-2">
//           <button
//             onClick={() => {
//               if (user?.role === "professor") {
//                 setShowEndedSummary(false);
//                 setShowHistory(true);
//               } else {
//                 clearSession();
//               }
//             }}
//             className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
//           >
//             <ArrowLeft size={16} />
//             Back to Dashboard
//           </button>

//           {user?.role === "professor" && (
//             <button
//               onClick={() => {
//                 setShowEndedSummary(false);
//                 setShowCreateForm(true);
//               }}
//               className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
//             >
//               <Plus size={16} />
//               Start New Session
//             </button>
//           )}

//           {user?.role === "professor" && session.id && (
//             <button
//               onClick={() =>
//                 window.open(`/api/transcripts/${session.id}`, "_blank")
//               }
//               className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
//             >
//               <Download size={16} />
//               Download Data
//             </button>
//           )}
//         </div>
//       </>
//     );
//   };

//   // Determine what to display in the overlay
//   const renderDashboardContent = () => {
//     // If we have an active session, show session features
//     if (session) {
//       if (showEndedSummary && session.status === "ended") {
//         return renderSessionEndedSummary();
//       } else {
//         return renderActiveSessionDashboard();
//       }
//     }

//     // If no session, show role-specific dashboards
//     if (user?.role === "professor") {
//       if (showCreateForm) {
//         return renderCreateSessionForm();
//       } else if (showHistory) {
//         return renderSessionHistory();
//       } else {
//         return renderProfessorDashboard();
//       }
//     } else {
//       if (joinSessionView) {
//         return renderJoinSessionForm();
//       } else {
//         return renderStudentDashboard();
//       }
//     }
//   };

//   // Determine what content to show in the main tab panel
//   const renderTabContent = () => {
//     // If there's no active tab, show the dashboard
//     if (!activeTab) {
//       return (
//         <div
//           className="p-4 overflow-y-auto"
//           style={{ maxHeight: "calc(80vh - 120px)" }}
//         >
//           {renderDashboardContent()}
//         </div>
//       );
//     }

//     // Otherwise show the appropriate tab panel content
//     return (
//       <div
//         className="p-4 overflow-y-auto"
//         style={{ maxHeight: "calc(80vh - 120px)" }}
//       >
//         {/* Tab Panel Heading */}
//         <div className="mb-3">
//           <h2 className="font-medium text-lg">
//             {activeTab === "ai" && "AI Assistant"}
//             {activeTab === "chat" && "Class Chat"}
//             {activeTab === "anonymous" && "Anonymous Messages"}
//             {activeTab === "polls" && "Polls"}
//           </h2>
//           <p className="text-sm text-gray-500">
//             {activeTab === "ai" && "Ask questions about your class"}
//             {activeTab === "chat" && "Communicate with your classmates"}
//             {activeTab === "anonymous" && "Send anonymous questions"}
//             {activeTab === "polls" && "View and participate in polls"}
//           </p>
//         </div>

//         {/* Tab Content */}
//         <div
//           role="tabpanel"
//           id="ai-panel"
//           className={`transition-opacity duration-300 ${
//             isTransitioning ? "opacity-0" : "opacity-100"
//           }`}
//           hidden={activeTab !== "ai"}
//         >
//           {activeTab === "ai" && <ChatBox />}
//         </div>
//         <div
//           role="tabpanel"
//           id="chat-panel"
//           className={`transition-opacity duration-300 ${
//             isTransitioning ? "opacity-0" : "opacity-100"
//           }`}
//           hidden={activeTab !== "chat"}
//         >
//           {activeTab === "chat" && isTabAllowed("chat") && <ClassroomChat />}
//         </div>
//         <div
//           role="tabpanel"
//           id="anonymous-panel"
//           className={`transition-opacity duration-300 ${
//             isTransitioning ? "opacity-0" : "opacity-100"
//           }`}
//           hidden={activeTab !== "anonymous"}
//         >
//           {activeTab === "anonymous" && isTabAllowed("anonymous") && (
//             <AnonymousMessage />
//           )}
//         </div>
//         <div
//           role="tabpanel"
//           id="polls-panel"
//           className={`transition-opacity duration-300 ${
//             isTransitioning ? "opacity-0" : "opacity-100"
//           }`}
//           hidden={activeTab !== "polls"}
//         >
//           {activeTab === "polls" && isTabAllowed("polls") && <PollsUI />}
//         </div>
//       </div>
//     );
//   };

//   // if (!activeTab && !isMinimized) return null;
//   if (!activeTab && !isMinimized && !isTransitioning) return null;
//   console.log("[AskLynk] Rendering floating overlay", {
//     activeTab,
//     isMinimized,
//   });

//   return (
//     <div className="fixed inset-0 pointer-events-none">
//       <Draggable
//         nodeRef={dragRef}
//         position={position}
//         onStop={handleDragStop}
//         bounds="parent"
//         handle=".overlay-header"
//       >
//         <div
//           ref={dragRef}
//           className="absolute pointer-events-auto"
//           style={{ zIndex: 9999 }}
//         >
//           {isMinimized ? (
//             <button
//               onClick={() => setMinimized(false)}
//               className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
//               aria-label="Maximize overlay"
//             >
//               <Maximize2 size={24} />
//             </button>
//           ) : (
//             <div
//               ref={overlayRef}
//               className="bg-white rounded-lg shadow-xl transition-all duration-300 w-80 asklynk-dialog"
//               style={{ maxHeight: "80vh" }}
//               role="dialog"
//               aria-label="Chat overlay"
//               id="asklynk-floating-overlay"
//             >
//               {/* User Info Bar */}
//               <div className="bg-indigo-600 text-white p-2 text-sm rounded-t-lg flex justify-between items-center">
//                 <div className="flex items-center gap-2">
//                   <div className="w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold">
//                     {user?.full_name?.charAt(0) || "?"}
//                   </div>
//                   <div className="flex flex-col">
//                     <span className="font-medium">
//                       {user?.full_name || "User"}
//                     </span>
//                     <span className="text-xs opacity-80 capitalize">
//                       {user?.role || ""}
//                     </span>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleSignOut}
//                   className="text-white/80 hover:text-white p-1 rounded transition-colors"
//                   aria-label="Sign out"
//                   title="Sign out"
//                 >
//                   <LogOut size={16} />
//                 </button>
//               </div>

//               <div className="overlay-header flex items-center justify-between p-2 bg-gray-100 border-b cursor-grab active:cursor-grabbing">
//                 <div
//                   className="flex gap-2"
//                   role="tablist"
//                   aria-label="Features"
//                 >
//                   <button
//                     role="tab"
//                     aria-selected={!activeTab}
//                     aria-controls="dashboard-panel"
//                     onClick={() => {
//                       setActiveTab(null);
//                     }}
//                     className={`p-2 rounded-lg transition-colors ${
//                       !activeTab
//                         ? "bg-gray-600 text-white"
//                         : "text-gray-600 hover:bg-gray-200"
//                     }`}
//                   >
//                     <Home size={20} />
//                     <span className="sr-only">Dashboard</span>
//                   </button>

//                   <button
//                     role="tab"
//                     aria-selected={activeTab === "ai"}
//                     aria-controls="ai-panel"
//                     onClick={() => handleTabClick("ai")}
//                     className={`p-2 rounded-lg transition-colors ${
//                       activeTab === "ai"
//                         ? "bg-indigo-600 text-white"
//                         : "text-gray-600 hover:bg-gray-200"
//                     }`}
//                   >
//                     <Brain size={20} />
//                     <span className="sr-only">AI Assistant</span>
//                   </button>

//                   <button
//                     role="tab"
//                     aria-selected={activeTab === "chat"}
//                     aria-controls="chat-panel"
//                     onClick={() => handleTabClick("chat")}
//                     disabled={!isTabAllowed("chat")}
//                     className={`p-2 rounded-lg transition-colors ${
//                       !isTabAllowed("chat")
//                         ? "opacity-50 cursor-not-allowed text-gray-400"
//                         : activeTab === "chat"
//                           ? "bg-green-600 text-white"
//                           : "text-gray-600 hover:bg-gray-200"
//                     }`}
//                     title={
//                       !isTabAllowed("chat")
//                         ? "Join a session to access class chat"
//                         : ""
//                     }
//                   >
//                     <MessageSquare size={20} />
//                     <span className="sr-only">Class Chat</span>
//                   </button>

//                   <button
//                     role="tab"
//                     aria-selected={activeTab === "anonymous"}
//                     aria-controls="anonymous-panel"
//                     onClick={() => handleTabClick("anonymous")}
//                     disabled={!isTabAllowed("anonymous")}
//                     className={`p-2 rounded-lg transition-colors ${
//                       !isTabAllowed("anonymous")
//                         ? "opacity-50 cursor-not-allowed text-gray-400"
//                         : activeTab === "anonymous"
//                           ? "bg-purple-600 text-white"
//                           : "text-gray-600 hover:bg-gray-200"
//                     }`}
//                     title={
//                       !isTabAllowed("anonymous")
//                         ? "Join a session to send anonymous messages"
//                         : ""
//                     }
//                   >
//                     <Lock size={20} />
//                     <span className="sr-only">Anonymous Messages</span>
//                   </button>

//                   <button
//                     role="tab"
//                     aria-selected={activeTab === "polls"}
//                     aria-controls="polls-panel"
//                     onClick={() => handleTabClick("polls")}
//                     disabled={!isTabAllowed("polls")}
//                     className={`p-2 rounded-lg transition-colors ${
//                       !isTabAllowed("polls")
//                         ? "opacity-50 cursor-not-allowed text-gray-400"
//                         : activeTab === "polls"
//                           ? "bg-blue-600 text-white"
//                           : "text-gray-600 hover:bg-gray-200"
//                     }`}
//                     title={
//                       !isTabAllowed("polls")
//                         ? "Join a session to participate in polls"
//                         : ""
//                     }
//                   >
//                     <BarChart3 size={20} />
//                     <span className="sr-only">Polls</span>
//                   </button>
//                 </div>

//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setMinimized(true)}
//                     className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
//                     aria-label="Minimize overlay"
//                   >
//                     <Minimize2 size={20} />
//                   </button>
//                   <button
//                     onClick={handleClose}
//                     className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
//                     aria-label="Close overlay"
//                   >
//                     <X size={20} />
//                   </button>
//                 </div>
//               </div>

//               {renderTabContent()}
//             </div>
//           )}
//         </div>
//       </Draggable>
//     </div>
//   );
// }

//----------------------------------------------------------------
