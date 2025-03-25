import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Brain, X, Maximize2, Minimize2 } from 'lucide-react';
import { FloatingOverlay } from './FloatingOverlay';

interface ChatHeadProps {
  platform: string;
}

export function ChatHead({ platform }: ChatHeadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  // Load saved position
  useEffect(() => {
    const savedPosition = localStorage.getItem('chatHeadPosition');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
  }, []);

  // Save position when it changes
  useEffect(() => {
    localStorage.setItem('chatHeadPosition', JSON.stringify(position));
  }, [position]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (e: any, data: { x: number; y: number }) => {
    setIsDragging(false);
    setPosition({ x: data.x, y: data.y });
  };

  const handleClick = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <Draggable
        position={position}
        onStart={handleDragStart}
        onStop={handleDragStop}
        bounds="parent"
      >
        <div 
          className={`
            fixed z-50 cursor-grab active:cursor-grabbing
            ${isOpen ? 'hidden' : 'block'}
          `}
        >
          <button
            onClick={handleClick}
            className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
          >
            <Brain size={24} />
          </button>
        </div>
      </Draggable>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <Minimize2 size={20} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <FloatingOverlay />
            </div>
          </div>
        </div>
      )}
    </>
  );
}