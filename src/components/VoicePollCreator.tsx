// import React, { useState, useEffect } from 'react';
// import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
// import { usePollsStore } from '../store/polls';
// import { useAuthStore } from '../store/auth';
// import { useSessionStore } from '../store/session';

// export function VoicePollCreator() {
//   const { user } = useAuthStore();
//   const { session } = useSessionStore();
//   const { createPoll, generatePollFromTopic, isLoading, error: pollError } = usePollsStore();
//   const [isListening, setIsListening] = useState(false);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [feedback, setFeedback] = useState<string | null>(null);
//   const [duration, setDuration] = useState(30); // Default duration in seconds
//   const [transcript, setTranscript] = useState('');

//   // Check if browser supports speech recognition
//   const browserSupportsSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
//   const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;

//   // Initialize speech recognition
//   const recognition = browserSupportsSpeechRecognition ? new SpeechRecognition() : null;
//   if (recognition) {
//     recognition.continuous = true;
//     recognition.interimResults = true;
//     recognition.lang = 'en-US';
//   }

//   useEffect(() => {
//     if (!recognition) return;

//     recognition.onresult = (event) => {
//       const current = event.resultIndex;
//       const transcript = event.results[current][0].transcript;
//       setTranscript(transcript);
//       handleTranscriptUpdate(transcript);
//     };

//     recognition.onerror = (event) => {
//       console.error('Speech recognition error:', event.error);
//       setError(`Speech recognition error: ${event.error}`);
//       setIsListening(false);
//     };

//     recognition.onend = () => {
//       if (isListening) {
//         recognition.start();
//       }
//     };

//     return () => {
//       recognition.stop();
//     };
//   }, [recognition, isListening]);

//   const extractTopicFromCommand = (text: string): string | null => {
//     const patterns = [
//       /create (?:a )?poll (?:about|on) "(.*?)"/i,
//       /create (?:a )?poll (?:about|on) (.*?)(?:\s|$)/i,
//       /make (?:a )?poll (?:about|on) "(.*?)"/i,
//       /make (?:a )?poll (?:about|on) (.*?)(?:\s|$)/i,
//     ];

//     for (const pattern of patterns) {
//       const match = text.match(pattern);
//       if (match && match[1]) {
//         return match[1].trim();
//       }
//     }

//     return null;
//   };

//   const handleTranscriptUpdate = async (text: string) => {
//     if (!text) return;

//     // Check for wake word
//     if (!text.toLowerCase().includes('hey asklynk')) {
//       return;
//     }

//     if (!user || !session) {
//       setError('No active session');
//       return;
//     }

//     if (user.role !== 'professor') {
//       setError('Only professors can create polls');
//       return;
//     }

//     setProcessing(true);
//     setError(null);

//     try {
//       // Check for duration setting
//       const durationMatch = text.match(/set (?:poll )?duration to (\d+) seconds?/i);
//       if (durationMatch) {
//         const newDuration = parseInt(durationMatch[1], 10);
//         if (!isNaN(newDuration) && newDuration > 0) {
//           setDuration(newDuration);
//           setFeedback(`Poll duration set to ${newDuration} seconds`);
//           setTranscript('');
//           return;
//         }
//       }

//       // Extract topic from command
//       const topic = extractTopicFromCommand(text);

//       if (topic) {
//         setFeedback(`Generating poll about "${topic}"...`);

//         const pollData = await generatePollFromTopic(topic);

//         await createPoll(
//           pollData.question,
//           pollData.options,
//           text, // Store original voice command
//           duration
//         );

//         setFeedback(`Created poll about ${topic}`);
//         setTranscript('');
//         return;
//       }

//       setError('Could not understand command. Try saying "Hey AskLynk, create a poll about [topic]"');
//     } catch (err) {
//       setError((err as Error).message);
//       setFeedback(null);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleStartListening = () => {
//     if (!recognition) {
//       setError('Speech recognition is not supported in this browser');
//       return;
//     }

//     setError(null);
//     setFeedback('Listening for "Hey AskLynk" commands...');
//     setTranscript('');
//     setIsListening(true);
//     recognition.start();
//   };

//   const handleStopListening = () => {
//     if (recognition) {
//       recognition.stop();
//     }
//     setIsListening(false);
//     setFeedback(null);
//   };

//   if (!browserSupportsSpeechRecognition) {
//     return (
//       <div className="fixed bottom-24 right-4 p-4 bg-red-50 rounded-lg text-red-600 flex items-center gap-2">
//         <AlertCircle size={20} />
//         <span className="text-sm">Browser doesn't support speech recognition</span>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed bottom-24 right-4 flex flex-col items-end gap-3">
//       {/* Error Message */}
//       {error && (
//         <div className="p-3 bg-red-50 text-red-700 rounded-lg shadow-lg max-w-xs flex items-center gap-2">
//           <AlertCircle size={16} />
//           <span className="text-sm">{error}</span>
//         </div>
//       )}

//       {/* Feedback Message */}
//       {feedback && !error && (
//         <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg shadow-lg max-w-xs">
//           <p className="text-sm">{feedback}</p>
//         </div>
//       )}

//       {/* Live Transcript */}
//       {isListening && (
//         <div className="p-3 bg-white rounded-lg shadow-lg max-w-xs w-64">
//           <div className="flex items-center gap-2 mb-2">
//             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
//             <p className="text-sm font-medium">Listening...</p>
//           </div>
//           <p className="text-xs text-gray-600 break-words">
//             {transcript || 'Say "Hey AskLynk, create a poll about [topic]"'}
//           </p>
//         </div>
//       )}

//       {/* Voice Control Button */}
//       <button
//         onClick={isListening ? handleStopListening : handleStartListening}
//         disabled={processing}
//         className={`p-4 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 ${
//           isListening
//             ? 'bg-red-600 hover:bg-red-700'
//             : 'bg-indigo-600 hover:bg-indigo-700'
//         } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
//         title={isListening ? 'Stop listening' : 'Start voice command'}
//       >
//         {processing ? (
//           <Loader2 className="animate-spin" size={24} />
//         ) : isListening ? (
//           <MicOff size={24} />
//         ) : (
//           <Mic size={24} />
//         )}
//       </button>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { usePollsStore } from "../store/polls";
import { useAuthStore } from "../store/auth";
import { useSessionStore } from "../store/session";

// Define types for Speech Recognition to help TypeScript
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function VoicePollCreator() {
  const { user } = useAuthStore();
  const { session } = useSessionStore();
  const {
    createPoll,
    generatePollFromTopic,
    isLoading,
    error: pollError,
  } = usePollsStore();
  const [isListening, setIsListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [duration, setDuration] = useState(30); // Default duration in seconds
  const [transcript, setTranscript] = useState("");

  // Check if browser supports speech recognition
  const browserSupportsSpeechRecognition =
    "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  const SpeechRecognition =
    window.webkitSpeechRecognition || window.SpeechRecognition;

  // Initialize speech recognition
  const recognition = browserSupportsSpeechRecognition
    ? new SpeechRecognition()
    : null;
  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
  }

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);
      handleTranscriptUpdate(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    return () => {
      recognition.stop();
    };
  }, [recognition, isListening]);

  const extractTopicFromCommand = (text: string): string | null => {
    const patterns = [
      /create (?:a )?poll (?:about|on) "(.*?)"/i,
      /create (?:a )?poll (?:about|on) (.*?)(?:\s|$)/i,
      /make (?:a )?poll (?:about|on) "(.*?)"/i,
      /make (?:a )?poll (?:about|on) (.*?)(?:\s|$)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  };

  const handleTranscriptUpdate = async (text: string) => {
    if (!text) return;

    // Check for wake word
    if (!text.toLowerCase().includes("hey asklynk")) {
      return;
    }

    if (!user || !session) {
      setError("No active session");
      return;
    }

    if (user.role !== "professor") {
      setError("Only professors can create polls");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Check for duration setting
      const durationMatch = text.match(
        /set (?:poll )?duration to (\d+) seconds?/i
      );
      if (durationMatch) {
        const newDuration = parseInt(durationMatch[1], 10);
        if (!isNaN(newDuration) && newDuration > 0) {
          setDuration(newDuration);
          setFeedback(`Poll duration set to ${newDuration} seconds`);
          setTranscript("");
          return;
        }
      }

      // Extract topic from command
      const topic = extractTopicFromCommand(text);

      if (topic) {
        setFeedback(`Generating poll about "${topic}"...`);

        const pollData = await generatePollFromTopic(topic);

        await createPoll(
          pollData.question,
          pollData.options,
          text, // Store original voice command
          duration
        );

        setFeedback(`Created poll about ${topic}`);
        setTranscript("");
        return;
      }

      setError(
        'Could not understand command. Try saying "Hey AskLynk, create a poll about [topic]"'
      );
    } catch (err) {
      setError((err as Error).message);
      setFeedback(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleStartListening = () => {
    if (!recognition) {
      setError("Speech recognition is not supported in this browser");
      return;
    }

    setError(null);
    setFeedback('Listening for "Hey AskLynk" commands...');
    setTranscript("");
    setIsListening(true);
    recognition.start();
  };

  const handleStopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
    setFeedback(null);
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="fixed bottom-24 right-4 p-4 bg-red-50 rounded-lg text-red-600 flex items-center gap-2">
        <AlertCircle size={20} />
        <span className="text-sm">
          Browser doesn't support speech recognition
        </span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 flex flex-col items-end gap-3">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg shadow-lg max-w-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Feedback Message */}
      {feedback && !error && (
        <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm">{feedback}</p>
        </div>
      )}

      {/* Live Transcript */}
      {isListening && (
        <div className="p-3 bg-white rounded-lg shadow-lg max-w-xs w-64">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-medium">Listening...</p>
          </div>
          <p className="text-xs text-gray-600 break-words">
            {transcript || 'Say "Hey AskLynk, create a poll about [topic]"'}
          </p>
        </div>
      )}

      {/* Voice Control Button */}
      <button
        onClick={isListening ? handleStopListening : handleStartListening}
        disabled={processing}
        className={`p-4 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 ${
          isListening
            ? "bg-red-600 hover:bg-red-700"
            : "bg-indigo-600 hover:bg-indigo-700"
        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isListening ? "Stop listening" : "Start voice command"}
      >
        {processing ? (
          <Loader2 className="animate-spin" size={24} />
        ) : isListening ? (
          <MicOff size={24} />
        ) : (
          <Mic size={24} />
        )}
      </button>
    </div>
  );
}
