import React from 'react';
import { useTranscriptionStore } from '../store/transcription';

export function Captions() {
  const { captionsEnabled, captions, captionStyle } = useTranscriptionStore();

  if (!captionsEnabled || captions.length === 0) return null;

  return (
    <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 w-full max-w-3xl text-center z-50">
      <div 
        className={`
          inline-block bg-black bg-opacity-75 p-4 rounded-lg shadow-lg
          ${captionStyle.size === 'small' ? 'text-sm' : ''}
          ${captionStyle.size === 'medium' ? 'text-base' : ''}
          ${captionStyle.size === 'large' ? 'text-lg' : ''}
          ${captionStyle.color === 'white' ? 'text-white' : ''}
          ${captionStyle.color === 'yellow' ? 'text-yellow-300' : ''}
          ${captionStyle.color === 'cyan' ? 'text-cyan-300' : ''}
        `}
      >
        {captions.map((caption, index) => (
          <p key={index} className="leading-relaxed">
            {caption}
          </p>
        ))}
      </div>
    </div>
  );
}