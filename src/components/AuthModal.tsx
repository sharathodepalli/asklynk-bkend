// import React, { useState } from 'react';
// import { supabase } from '../lib/supabase';
// import { LogIn, UserPlus, Mail, Lock, Loader2 } from 'lucide-react';
// import { useAuthStore } from '../store/auth';

// type AuthMode = 'login' | 'signup';

// interface AuthModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export function AuthModal({ isOpen, onClose }: AuthModalProps) {
//   const { checkAuth } = useAuthStore();
//   const [mode, setMode] = useState<AuthMode>('login');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [fullName, setFullName] = useState('');
//   const [role, setRole] = useState<'student' | 'professor'>('student');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   if (!isOpen) return null;

//   const handleAuth = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       if (mode === 'signup') {
//         const { data: authData, error: signUpError } = await supabase.auth.signUp({
//           email,
//           password,
//         });

//         if (signUpError) throw signUpError;

//         if (authData.user) {
//           // Create profile
//           const { error: profileError } = await supabase
//             .from('profiles')
//             .insert([
//               {
//                 id: authData.user.id,
//                 full_name: fullName,
//                 role,
//               },
//             ]);

//           if (profileError) throw profileError;

//           // Check auth to update the store
//           await checkAuth();
//         }
//       } else {
//         const { error: signInError } = await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });

//         if (signInError) throw signInError;

//         // Check auth to update the store
//         await checkAuth();
//       }

//       onClose();
//     } catch (err) {
//       setError((err as Error).message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//         <div className="flex items-center justify-between p-6 border-b">
//           <h2 className="text-xl font-semibold">
//             {mode === 'login' ? 'Welcome Back' : 'Create Account'}
//           </h2>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//             <Lock size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleAuth} className="p-6 space-y-4">
//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//               {error}
//             </div>
//           )}

//           {mode === 'signup' && (
//             <>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Full Name
//                 </label>
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Role
//                 </label>
//                 <select
//                   value={role}
//                   onChange={(e) => setRole(e.target.value as 'student' | 'professor')}
//                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 >
//                   <option value="student">Student</option>
//                   <option value="professor">Professor</option>
//                 </select>
//               </div>
//             </>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Email Address
//             </label>
//             <div className="relative">
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 required
//               />
//               <Mail className="absolute left-3 top-2.5 text-gray-400" size={20} />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Password
//             </label>
//             <div className="relative">
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 required
//               />
//               <Lock className="absolute left-3 top-2.5 text-gray-400" size={20} />
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
//           >
//             {loading ? (
//               <Loader2 size={20} className="animate-spin" />
//             ) : mode === 'login' ? (
//               <LogIn size={20} />
//             ) : (
//               <UserPlus size={20} />
//             )}
//             {mode === 'login' ? 'Sign In' : 'Create Account'}
//           </button>

//           <div className="text-center">
//             <button
//               type="button"
//               onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
//               className="text-indigo-600 hover:text-indigo-700 text-sm"
//             >
//               {mode === 'login'
//                 ? "Don't have an account? Sign up"
//                 : 'Already have an account? Sign in'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
//_____________________________________________________________________________________
//woring version of AuthModal.tsx
// Fixed version of AuthModal.tsx
// import React, { useState } from "react";
// import { supabase } from "../lib/supabase";
// import { LogIn, UserPlus, Mail, Lock, Loader2 } from "lucide-react";
// import { useAuthStore } from "../store/auth";

// type AuthMode = "login" | "signup";

// interface AuthModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export function AuthModal({ isOpen, onClose }: AuthModalProps) {
//   const { checkAuth } = useAuthStore();
//   const [mode, setMode] = useState<AuthMode>("login");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [role, setRole] = useState<"student" | "professor">("student");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   if (!isOpen) return null;

//   const handleAuth = async (e: React.FormEvent) => {
//     e.preventDefault();
//     e.stopPropagation();

//     setLoading(true);
//     setError(null);

//     try {
//       if (mode === "signup") {
//         const { data: authData, error: signUpError } =
//           await supabase.auth.signUp({
//             email,
//             password,
//           });

//         if (signUpError) throw signUpError;

//         if (authData.user) {
//           // Create profile
//           const { error: profileError } = await supabase
//             .from("profiles")
//             .insert([
//               {
//                 id: authData.user.id,
//                 full_name: fullName,
//                 role,
//               },
//             ]);

//           if (profileError) throw profileError;

//           // Check auth to update the store
//           await checkAuth();
//         }
//       } else {
//         const { error: signInError } = await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });

//         if (signInError) throw signInError;

//         // Check auth to update the store
//         await checkAuth();
//       }

//       onClose();
//     } catch (err) {
//       setError((err as Error).message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Create a custom stopPropagation handler to prevent events from being blocked
//   const handleInputClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//   };

//   return (
//     <div
//       className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
//       style={{ zIndex: 100000, pointerEvents: "auto" }}
//     >
//       <div
//         className="bg-white rounded-lg shadow-xl w-full max-w-md"
//         style={{ pointerEvents: "auto" }}
//         onClick={handleInputClick}
//       >
//         <div className="flex items-center justify-between p-6 border-b">
//           <h2 className="text-xl font-semibold">
//             {mode === "login" ? "Welcome Back" : "Create Account"}
//           </h2>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onClose();
//             }}
//             className="text-gray-500 hover:text-gray-700"
//             style={{ pointerEvents: "auto" }}
//           >
//             <Lock size={20} />
//           </button>
//         </div>

//         <form
//           onSubmit={(e) => {
//             e.stopPropagation();
//             handleAuth(e);
//           }}
//           className="p-6 space-y-4"
//           style={{ pointerEvents: "auto" }}
//         >
//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//               {error}
//             </div>
//           )}

//           {mode === "signup" && (
//             <>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Full Name
//                 </label>
//                 <input
//                   type="text"
//                   value={fullName}
//                   onChange={(e) => {
//                     e.stopPropagation();
//                     setFullName(e.target.value);
//                   }}
//                   onClick={handleInputClick}
//                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//                   style={{ pointerEvents: "auto" }}
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Role
//                 </label>
//                 <select
//                   value={role}
//                   onChange={(e) => {
//                     e.stopPropagation();
//                     setRole(e.target.value as "student" | "professor");
//                   }}
//                   onClick={handleInputClick}
//                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//                   style={{ pointerEvents: "auto" }}
//                 >
//                   <option value="student">Student</option>
//                   <option value="professor">Professor</option>
//                 </select>
//               </div>
//             </>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Email Address
//             </label>
//             <div className="relative">
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => {
//                   e.stopPropagation();
//                   setEmail(e.target.value);
//                 }}
//                 onClick={handleInputClick}
//                 className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 style={{ pointerEvents: "auto" }}
//                 required
//               />
//               <Mail
//                 className="absolute left-3 top-2.5 text-gray-400"
//                 size={20}
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Password
//             </label>
//             <div className="relative">
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => {
//                   e.stopPropagation();
//                   setPassword(e.target.value);
//                 }}
//                 onClick={handleInputClick}
//                 className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
//                 style={{ pointerEvents: "auto" }}
//                 required
//               />
//               <Lock
//                 className="absolute left-3 top-2.5 text-gray-400"
//                 size={20}
//               />
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             onClick={(e) => e.stopPropagation()}
//             className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
//             style={{ pointerEvents: "auto" }}
//           >
//             {loading ? (
//               <Loader2 size={20} className="animate-spin" />
//             ) : mode === "login" ? (
//               <LogIn size={20} />
//             ) : (
//               <UserPlus size={20} />
//             )}
//             {mode === "login" ? "Sign In" : "Create Account"}
//           </button>

//           <div className="text-center">
//             <button
//               type="button"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setMode(mode === "login" ? "signup" : "login");
//               }}
//               className="text-indigo-600 hover:text-indigo-700 text-sm"
//               style={{ pointerEvents: "auto" }}
//             >
//               {mode === "login"
//                 ? "Don't have an account? Sign up"
//                 : "Already have an account? Sign in"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
// function injectOverlayContainer() {
//   throw new Error("Function not implemented.");
// }

//-------------------------------------------------------------------------------------

// version with capturing the extension to save login state
// Updated version of AuthModal.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { LogIn, UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/auth";

type AuthMode = "login" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { checkAuth } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "professor">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtension, setIsExtension] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if we were opened by the extension
    const urlParams = new URLSearchParams(window.location.search);
    const extensionParam = urlParams.get("extension");
    const returnUrlParam = urlParams.get("returnUrl");

    if (extensionParam === "true") {
      setIsExtension(true);
    }

    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    }
  }, []);

  if (!isOpen) return null;

  // Function to handle communication with the extension
  // Function to handle communication with the extension
  const handleExtensionCommunication = (userData: {
    userId: string; // Add user ID
    username: string;
    role: string;
    token?: string; // Add token (optional for now)
  }) => {
    if (isExtension) {
      try {
        // Try to send message to extension
        const extensionId = "lgnidekfhibkeinpnnabmjebkfhhgbfc";

        if (
          typeof chrome !== "undefined" &&
          chrome.runtime &&
          chrome.runtime.sendMessage
        ) {
          chrome.runtime.sendMessage(
            extensionId,
            {
              type: "LOGIN_SUCCESS",
              userId: userData.userId, // Send the user ID
              username: userData.username,
              role: userData.role,
              token: userData.token, // Send the token if available
            },
            (response) => {
              console.log("Authentication sent to extension:", response);

              if (returnUrl) {
                window.location.href = returnUrl;
              }
            }
          );
        } else {
          // Fallback method using URL redirect
          const authSuccessUrl = `http://localhost:5173/auth-success?userId=${encodeURIComponent(userData.userId)}&username=${encodeURIComponent(userData.username)}&role=${encodeURIComponent(userData.role)}${userData.token ? `&token=${encodeURIComponent(userData.token)}` : ""}`;
          window.location.href = authSuccessUrl;
        }
      } catch (err) {
        console.log("Extension messaging failed:", err);

        // Fallback method using URL redirect
        if (returnUrl) {
          const authSuccessUrl = `${returnUrl}#auth-success?userId=${encodeURIComponent(userData.userId)}&username=${encodeURIComponent(userData.username)}&role=${encodeURIComponent(userData.role)}${userData.token ? `&token=${encodeURIComponent(userData.token)}` : ""}`;
          window.location.href = authSuccessUrl;
        } else {
          const authSuccessUrl = `http://localhost:5173/auth-success?userId=${encodeURIComponent(userData.userId)}&username=${encodeURIComponent(userData.username)}&role=${encodeURIComponent(userData.role)}${userData.token ? `&token=${encodeURIComponent(userData.token)}` : ""}`;
          window.location.href = authSuccessUrl;
        }
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { data: authData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
          });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: authData.user.id,
                full_name: fullName,
                role,
              },
            ]);

          if (profileError) throw profileError;

          // Check auth to update the store
          await checkAuth();

          // Notify extension about the new user
          // For signup
          handleExtensionCommunication({
            userId: authData.user.id, // Include user ID from auth data
            username: fullName,
            role: role,
            token: authData.session?.access_token, // Include session token if available
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Check auth to update the store
        await checkAuth();

        // Get user profile data for extension notification
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", userData.user.id)
            .single();

          // Get the session data to get the token
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;

          if (profileData) {
            handleExtensionCommunication({
              userId: userData.user.id, // Include the user ID from auth data
              username: profileData.full_name,
              role: profileData.role,
              token: token, // Use the token we just retrieved
            });
          }
        }
      }

      if (!isExtension) {
        onClose();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Create a custom stopPropagation handler to prevent events from being blocked
  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 100000, pointerEvents: "auto" }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        style={{ pointerEvents: "auto" }}
        onClick={handleInputClick}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
            {isExtension && " (Extension)"}
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
            style={{ pointerEvents: "auto" }}
          >
            <Lock size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            handleAuth(e);
          }}
          className="p-6 space-y-4"
          style={{ pointerEvents: "auto" }}
        >
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    e.stopPropagation();
                    setFullName(e.target.value);
                  }}
                  onClick={handleInputClick}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  style={{ pointerEvents: "auto" }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => {
                    e.stopPropagation();
                    setRole(e.target.value as "student" | "professor");
                  }}
                  onClick={handleInputClick}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  style={{ pointerEvents: "auto" }}
                >
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  e.stopPropagation();
                  setEmail(e.target.value);
                }}
                onClick={handleInputClick}
                className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                style={{ pointerEvents: "auto" }}
                required
              />
              <Mail
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  e.stopPropagation();
                  setPassword(e.target.value);
                }}
                onClick={handleInputClick}
                className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                style={{ pointerEvents: "auto" }}
                required
              />
              <Lock
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            onClick={(e) => e.stopPropagation()}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ pointerEvents: "auto" }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : mode === "login" ? (
              <LogIn size={20} />
            ) : (
              <UserPlus size={20} />
            )}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMode(mode === "login" ? "signup" : "login");
              }}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
              style={{ pointerEvents: "auto" }}
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function injectOverlayContainer() {
  throw new Error("Function not implemented.");
}
