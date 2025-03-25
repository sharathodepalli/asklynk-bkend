// import { create } from 'zustand';
// import { supabase } from '../lib/supabase';

// interface Profile {
//   id: string;
//   full_name: string;
//   role: 'student' | 'professor';
// }

// interface AuthState {
//   user: Profile | null;
//   isLoading: boolean;
//   error: string | null;
//   checkAuth: () => Promise<void>;
//   signOut: () => Promise<void>;
// }

// export const useAuthStore = create<AuthState>((set) => ({
//   user: null,
//   isLoading: true,
//   error: null,

//   checkAuth: async () => {
//     try {
//       set({ isLoading: true });
//       const { data: { user } } = await supabase.auth.getUser();
      
//       if (user) {
//         const { data: profile, error: profileError } = await supabase
//           .from('profiles')
//           .select('*')
//           .eq('id', user.id)
//           .single();

//         if (profileError) throw profileError;

//         if (profile) {
//           set({ user: profile, isLoading: false, error: null });
//         } else {
//           set({ user: null, isLoading: false, error: 'Profile not found' });
//         }
//       } else {
//         set({ user: null, isLoading: false, error: null });
//       }
//     } catch (error) {
//       set({ error: (error as Error).message, isLoading: false, user: null });
//     }
//   },

//   signOut: async () => {
//     try {
//       await supabase.auth.signOut();
//       set({ user: null, error: null });
//     } catch (error) {
//       set({ error: (error as Error).message });
//     }
//   },
// }));

// src/store/auth.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';



interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'professor';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  
  // Function to check authentication status
  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log("[AskLynk] Checking auth status");
      
      // Get session from Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.log("[AskLynk] No active session found");
        set({ user: null, isLoading: false });
        
        // Update Chrome storage
        // Remove user from Chrome storage
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.remove(["authUser"]);
}
        return;
      }
      
      const userId = sessionData.session.user.id;
      
      // Fetch user profile from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error("[AskLynk] Error fetching profile:", profileError);
        set({ error: profileError.message, isLoading: false });
        return;
      }
      
      if (!profileData) {
        console.error("[AskLynk] No profile found for user");
        set({ error: "No profile found", isLoading: false });
        return;
      }
      
      // Create user object with combined data
      const user = {
        id: userId,
        email: sessionData.session.user.email || '',
        full_name: profileData.full_name,
        role: profileData.role as 'student' | 'professor',
      };
      
      console.log("[AskLynk] User authenticated:", user);
      set({ user, isLoading: false });
      
      // Store user in Chrome storage for content script access
      // Store user in Chrome storage for content script access
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.set({ authUser: user });
}
    } catch (err) {
      console.error("[AskLynk] Auth check error:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  
  // Function to sign out
  signOut: async () => {
    try {
      set({ isLoading: true });
      console.log("[AskLynk] Signing out");
      
      await supabase.auth.signOut();
      
      set({ user: null, isLoading: false });
      
      // Only attempt to use Chrome storage if it exists
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        // Remove user from Chrome storage
        chrome.storage.local.remove(["authUser"]);
      }
      
      console.log("[AskLynk] Sign out successful");
    } catch (err) {
      console.error("[AskLynk] Sign out error:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));