// import { createClient } from '@supabase/supabase-js';
// import type { Database } from './database.types';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables');
// }

// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: true,
//     storageKey: 'asklynk-auth',
//     storage: {
//       getItem: (key) => {
//         try {
//           const item = localStorage.getItem(key);
//           return item ? JSON.parse(item) : null;
//         } catch (error) {
//           console.error('Error reading auth state:', error);
//           return null;
//         }
//       },
//       setItem: (key, value) => {
//         try {
//           localStorage.setItem(key, JSON.stringify(value));
//         } catch (error) {
//           console.error('Error saving auth state:', error);
//         }
//       },
//       removeItem: (key) => {
//         try {
//           localStorage.removeItem(key);
//         } catch (error) {
//           console.error('Error removing auth state:', error);
//         }
//       }
//     }
//   },
//   global: {
//     headers: {
//       'X-Client-Info': 'asklynk-extension'
//     }
//   },
//   db: {
//     schema: 'public'
//   }
// });

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Hardcoded values for the extension
// Note: These will be visible in your extension code
const supabaseUrl = 'https://jrysjqyfykjmwqgextco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyeXNqcXlmeWtqbXdxZ2V4dGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MTkxMzIsImV4cCI6MjA1NzQ5NTEzMn0.DXbtkIXsfFSK8yOTBgi6U2_ha3bxFepXk4qi9EqoVaw';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'asklynk-auth',
    storage: {
      getItem: (key) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch (error) {
          console.error('Error reading auth state:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error saving auth state:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing auth state:', error);
        }
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'asklynk-extension'
    }
  },
  db: {
    schema: 'public'
  }
});