// import { create } from 'zustand';
// import { supabase } from '../lib/supabase';
// import { useSessionStore } from './session';
// import { useAuthStore } from './auth';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// interface TranscriptionState {
//   isTranscribing: boolean;
//   transcript: string;
//   captions: string[];
//   selectedLanguage: string;
//   captionsEnabled: boolean;
//   captionStyle: {
//     size: string;
//     color: string;
//   };
//   error: string | null;
//   startTranscription: () => Promise<void>;
//   stopTranscription: () => void;
//   setCaptionsEnabled: (enabled: boolean) => void;
//   setSelectedLanguage: (language: string) => void;
//   setCaptionStyle: (style: { size?: string; color?: string }) => void;
//   generateSummary: () => Promise<void>;
// }

// export const useTranscriptionStore = create<TranscriptionState>((set, get) => {
//   let speechConfig: sdk.SpeechConfig | null = null;
//   let recognizer: sdk.SpeechRecognizer | null = null;

//   const initializeSpeechConfig = () => {
//     try {
//       if (!speechConfig) {
//         speechConfig = sdk.SpeechConfig.fromSubscription(
//           import.meta.env.VITE_AZURE_SPEECH_KEY,
//           import.meta.env.VITE_AZURE_SPEECH_REGION
//         );
//         speechConfig.speechRecognitionLanguage = get().selectedLanguage;
//         speechConfig.enableDictation();
//         speechConfig.outputFormat = sdk.OutputFormat.Detailed;
//       }
//       return speechConfig;
//     } catch (error) {
//       console.error('Failed to initialize speech config:', error);
//       throw error;
//     }
//   };

//   const cleanup = () => {
//     if (recognizer) {
//       try {
//         recognizer.stopContinuousRecognitionAsync();
//         recognizer.close();
//       } catch (error) {
//         console.error('Error cleaning up recognizer:', error);
//       }
//       recognizer = null;
//     }
//     if (speechConfig) {
//       try {
//         speechConfig.close();
//       } catch (error) {
//         console.error('Error cleaning up speech config:', error);
//       }
//       speechConfig = null;
//     }
//   };

//   return {
//     isTranscribing: false,
//     transcript: '',
//     captions: [],
//     selectedLanguage: 'en-US',
//     captionsEnabled: true,
//     captionStyle: {
//       size: 'medium',
//       color: 'white'
//     },
//     error: null,

//     startTranscription: async () => {
//       const session = useSessionStore.getState().session;
//       const user = useAuthStore.getState().user;
    
//       if (!session || !user) {
//         set({ error: 'No active session' });
//         return;
//       }
    
//       try {
//         // Clean up any existing resources
//         cleanup();
    
//         // Initialize new speech recognition
//         const config = initializeSpeechConfig();
//         const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
//         recognizer = new sdk.SpeechRecognizer(config, audioConfig);
    
//         // Handle recognition results
//         recognizer.recognized = async (s, e) => {
//           if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
//             const text = e.result.text.trim();
//             if (text) {
//               // Update captions
//               set(state => ({
//                 captions: [...state.captions.slice(-2), text],
//                 transcript: state.transcript + ' ' + text
//               }));
    
//               // Save to database
//               try {
//                 await supabase.from('session_transcripts').insert({
//                   session_id: session.id,
//                   content: text,
//                   timestamp: new Date().toISOString(),
//                   speaker_id: user.id,
//                   language: get().selectedLanguage
//                 });
//               } catch (error) {
//                 console.error('Failed to save transcript:', error);
//               }
//             }
//           }
//         };
    
//         // Handle recognition errors
//         recognizer.canceled = (s, e) => {
//           if (e.reason === sdk.CancellationReason.Error) {
//             set({
//               error: `Speech recognition error: ${e.errorDetails}`,
//               isTranscribing: false
//             });
//             cleanup();
//           }
//         };
    
//         // Handle recognition session stopped
//         recognizer.sessionStopped = (s, e) => {
//           set({ isTranscribing: false });
//           cleanup();
//         };
    
//         // Start recognition
//         await recognizer.startContinuousRecognitionAsync();
//         set({ isTranscribing: true, error: null });
    
//       } catch (error) {
//         cleanup();
//         set({
//           error: (error as Error).message,
//           isTranscribing: false
//         });
//         console.error('Failed to start transcription:', error);
//       }
//     },
    

//     stopTranscription: () => {
//       if (recognizer) {
//         const stopRecognition = recognizer.stopContinuousRecognitionAsync();
//         if (stopRecognition && typeof stopRecognition.then === 'function') {
//           stopRecognition
//             .then(() => {
//               cleanup();
//               set({ isTranscribing: false });
//             })
//             .catch((error) => {
//               console.error('Error stopping transcription:', error);
//               cleanup();
//               set({ isTranscribing: false });
//             });
//         } else {
//           console.error('stopContinuousRecognitionAsync did not return a promise');
//           cleanup();
//           set({ isTranscribing: false });
//         }
//       } else {
//         console.warn('Recognizer is not initialized');
//         set({ isTranscribing: false }); // Ensure transcription state is updated even if recognizer is undefined
//       }
//     },
    

//     generateSummary: async () => {
//       const session = useSessionStore.getState().session;
//       if (!session) {
//         set({ error: 'No active session' });
//         return;
//       }

//       try {
//         // Get full transcript
//         const { data: transcripts, error: transcriptError } = await supabase
//           .from('session_transcripts')
//           .select('content')
//           .eq('session_id', session.id)
//           .order('timestamp', { ascending: true });

//         if (transcriptError) throw transcriptError;

//         if (!transcripts?.length) {
//           set({ error: 'No transcript available' });
//           return;
//         }

//         const fullTranscript = transcripts.map(t => t.content).join(' ');

//         // Generate summary using Gemini
//         const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });
//         const prompt = `Generate a comprehensive summary of this lecture transcript. Include:
//           1. Key topics discussed
//           2. Important concepts explained
//           3. Main takeaways
//           4. Any questions or polls conducted

//           Transcript:
//           ${fullTranscript}

//           Format the summary in markdown with clear sections and bullet points.`;

//         const result = await model.generateContent(prompt);
//         const summary = await result.response.text();

//         // Save summary
//         const { error: summaryError } = await supabase
//           .from('session_summaries')
//           .insert({
//             session_id: session.id,
//             content: summary,
//             created_at: new Date().toISOString()
//           });

//         if (summaryError) throw summaryError;

//       } catch (error) {
//         set({ error: (error as Error).message });
//       }
//     }
//   };
// });
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useSessionStore } from './session';
import { useAuthStore } from './auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface TranscriptionState {
  isTranscribing: boolean;
  transcript: string;
  captions: string[];
  selectedLanguage: string;
  captionsEnabled: boolean;
  captionStyle: {
    size: string;
    color: string;
  };
  error: string | null;
  startTranscription: () => Promise<void>;
  stopTranscription: () => void;
  setCaptionsEnabled: (enabled: boolean) => void;
  setSelectedLanguage: (language: string) => void;
  setCaptionStyle: (style: { size?: string; color?: string }) => void;
  generateSummary: () => Promise<void>;
}

export const useTranscriptionStore = create<TranscriptionState>((set, get) => {
  let speechConfig: sdk.SpeechConfig | null = null;
  let recognizer: sdk.SpeechRecognizer | null = null;

  // Removed initializeSpeechConfig since we're creating a fresh config every time

  const cleanup = () => {
    // Use local variables to avoid race conditions
    const currentRecognizer = recognizer;
    const currentSpeechConfig = speechConfig;
    
    // Clear the global variables first to prevent reuse
    recognizer = null;
    speechConfig = null;
    
    // Then handle closing if they exist
    if (currentRecognizer) {
      try {
        try {
          currentRecognizer.stopContinuousRecognitionAsync(
            // Success callback
            () => {
              try {
                currentRecognizer.close();
              } catch (innerError) {
                console.error('Error closing recognizer after stop:', innerError);
              }
            },
            // Error callback
            (err) => {
              console.error('Error stopping recognition:', err);
              try {
                currentRecognizer.close();
              } catch (innerError) {
                console.error('Error closing recognizer after stop error:', innerError);
              }
            }
          );
        } catch (stopError) {
          console.error('Error calling stopContinuousRecognitionAsync:', stopError);
          try {
            currentRecognizer.close();
          } catch (closeError) {
            console.error('Error closing recognizer after stop exception:', closeError);
          }
        }
      } catch (error) {
        console.error('Error in cleanup recognizer:', error);
      }
    }
    
    if (currentSpeechConfig) {
      try {
        currentSpeechConfig.close();
      } catch (error) {
        console.error('Error cleaning up speech config:', error);
      }
    }
  };

  return {
    isTranscribing: false,
    transcript: '',
    captions: [],
    selectedLanguage: 'en-US',
    captionsEnabled: true,
    captionStyle: {
      size: 'medium',
      color: 'white'
    },
    error: null,

    startTranscription: async () => {
      const session = useSessionStore.getState().session;
      const user = useAuthStore.getState().user;
    
      if (!session || !user) {
        set({ error: 'No active session' });
        return;
      }
    
      // First set state to loading to prevent multiple start attempts
      set({ isTranscribing: false });
      
      // Make sure any previous instance is fully cleaned up
      cleanup();
      
      // Wait a moment for any pending operations to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        // Create a fresh speech config every time
        speechConfig = sdk.SpeechConfig.fromSubscription(
          import.meta.env.VITE_AZURE_SPEECH_KEY,
          import.meta.env.VITE_AZURE_SPEECH_REGION
        );
        
        // Set the language explicitly with the correct locale format
        const language = get().selectedLanguage;
        console.log(`Setting recognition language to: ${language}`);
        speechConfig.speechRecognitionLanguage = language;
        
        // Additional configuration to improve language recognition
        speechConfig.enableDictation();
        speechConfig.outputFormat = sdk.OutputFormat.Detailed;
        
        // Add additional settings to improve multi-language support
        if (language !== 'en-US' && language !== 'es-ES') {
          // For non-English/Spanish languages, we may need additional configuration
          try {
            // Some languages might need specific options
            speechConfig.setProperty("speechRecognitionModel", "conversation");
            speechConfig.setProperty("languageIdentification.mode", "AtStart");
            
            // Log detailed language configuration for debugging
            console.log(`Configured advanced language settings for: ${language}`);
          } catch (langError) {
            console.warn(`Could not set advanced language properties for ${language}:`, langError);
          }
        }
        
        // Create audio config with microphone access request wrapped in try/catch
        let audioConfig;
        try {
          audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        } catch (micError) {
          set({ error: 'Microphone access error: Please ensure microphone permissions are granted and reload the page.' });
          console.error('Microphone access error:', micError);
          return;
        }
        
        // Create a new recognizer
        recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
        // Configure event handlers before starting recognition
        recognizer.recognized = async (_, e) => {
          if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
            const text = e.result.text.trim();
            if (text) {
              // Update captions
              set(state => ({
                captions: [...state.captions.slice(-2), text],
                transcript: state.transcript + ' ' + text
              }));
    
              try {
                // Check authentication status
                const { data } = await supabase.auth.getSession();
                if (!data.session) {
                  console.warn('No active Supabase session, transcript will not be saved');
                  return;
                }
                
                // Save the transcript
                const { error: insertError } = await supabase
                  .from('session_transcripts')
                  .insert({
                    session_id: session.id,
                    content: text,
                    timestamp: new Date().toISOString(),
                    speaker_id: user.id,
                    language: get().selectedLanguage
                  });
                  
                if (insertError) {
                  console.error('Supabase error:', insertError.message);
                }
              } catch (dbError) {
                console.error('Failed to save transcript:', dbError);
                // Don't set global error state to avoid disrupting the UI
              }
            }
          }
        };
    
        // Handle recognition errors with more detailed logging
        recognizer.canceled = (_, e) => {
          console.log('Recognition canceled, reason:', e.reason, 'Details:', e.errorDetails);
          if (e.reason === sdk.CancellationReason.Error) {
            set({
              error: `Speech recognition error: ${e.errorDetails}`,
              isTranscribing: false
            });
            cleanup();
          }
        };
    
        // Handle recognition session stopped
        recognizer.sessionStopped = () => {
          console.log('Recognition session stopped');
          set({ isTranscribing: false });
          cleanup();
        };
        
        // Add more event handlers for better debugging
        recognizer.sessionStarted = () => {
          console.log('Recognition session started successfully');
        };
        
        recognizer.speechStartDetected = () => {
          console.log('Speech start detected');
        };
        
        recognizer.speechEndDetected = () => {
          console.log('Speech end detected');
        };
    
        // Start recognition with explicit callbacks to catch errors
        await new Promise<void>((resolve, reject) => {
          if (!recognizer) {
            reject(new Error("Recognizer was unexpectedly null"));
            return;
          }
          
          try {
            recognizer.startContinuousRecognitionAsync(
              // Success callback
              () => {
                set({ isTranscribing: true, error: null });
                resolve();
              },
              // Error callback
              (err) => {
                console.error('Failed to start continuous recognition:', err);
                set({ 
                  error: `Failed to start speech recognition: ${err}`,
                  isTranscribing: false 
                });
                cleanup();
                reject(err);
              }
            );
          } catch (startError) {
            console.error('Exception starting recognition:', startError);
            set({ 
              error: `Exception starting speech recognition: ${(startError as Error).message}`,
              isTranscribing: false 
            });
            cleanup();
            reject(startError);
          }
        });
    
      } catch (error) {
        console.error('Failed to start transcription:', error);
        cleanup();
        set({
          error: `Failed to initialize speech recognition: ${(error as Error).message}`,
          isTranscribing: false
        });
      }
    },
    
    stopTranscription: () => {
      // First set state to not transcribing to prevent further processing
      set({ isTranscribing: false });
      
      // Then clean up resources
      cleanup();
    },
    
    setCaptionsEnabled: (enabled: boolean) => {
      set({ captionsEnabled: enabled });
    },
    
    setSelectedLanguage: (language: string) => {
      const wasTranscribing = get().isTranscribing;
      
      // Update the language in the state immediately
      set({ selectedLanguage: language });
      
      // If we're not transcribing, just update the language setting for next use
      if (!wasTranscribing) {
        // Force recreation of speech config with new language for next use
        if (speechConfig) {
          try {
            speechConfig.close();
          } catch (e) {
            console.error('Error closing speech config during language change:', e);
          }
          speechConfig = null;
        }
        return;
      }
      
      // If we are transcribing, we need to stop and restart
      set({ isTranscribing: false });
      
      // Clean up existing resources
      cleanup();
      
      // Wait a bit to ensure resources are released
      setTimeout(() => {
        // We don't need to explicitly set speechConfig to null here as
        // it's already handled in cleanup() and will be recreated in startTranscription
        
        // Restart transcription if it was active
        get().startTranscription().catch((error: Error) => {
          console.error('Failed to restart transcription after language change:', error);
        });
      }, 500); // Longer delay to ensure cleanup completes
    },
    
    setCaptionStyle: (style: { size?: string; color?: string }) => {
      set(state => ({
        captionStyle: {
          ...state.captionStyle,
          ...(style.size && { size: style.size }),
          ...(style.color && { color: style.color })
        }
      }));
    },

    generateSummary: async () => {
      const session = useSessionStore.getState().session;
      if (!session) {
        set({ error: 'No active session' });
        return;
      }

      try {
        // Get full transcript
        const { data: transcripts, error: transcriptError } = await supabase
          .from('session_transcripts')
          .select('content')
          .eq('session_id', session.id)
          .order('timestamp', { ascending: true });

        if (transcriptError) throw transcriptError;

        if (!transcripts?.length) {
          set({ error: 'No transcript available' });
          return;
        }

        const fullTranscript = transcripts.map(t => t.content).join(' ');

        // Generate summary using Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });
        const prompt = `Generate a comprehensive summary of this lecture transcript. Include:
          1. Key topics discussed
          2. Important concepts explained
          3. Main takeaways
          4. Any questions or polls conducted

          Transcript:
          ${fullTranscript}

          Format the summary in markdown with clear sections and bullet points.`;

        const result = await model.generateContent(prompt);
        const summary = await result.response.text();

        // Save summary
        const { error: summaryError } = await supabase
          .from('session_summaries')
          .insert({
            session_id: session.id,
            content: summary,
            created_at: new Date().toISOString()
          });

        if (summaryError) throw summaryError;

      } catch (error) {
        set({ error: (error as Error).message });
      }
    }
  };
});