import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { Grip } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

export function DraggableExample() {
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  // Save position when dragging stops
  const handleDragStop = (e: any, data: Position) => {
    setIsDragging(false);
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <Draggable
      position={position}
      onStart={() => setIsDragging(true)}
      onStop={handleDragStop}
      bounds="parent"
      handle=".drag-handle"
    >
      <div className={`
        fixed z-50 
        bg-white rounded-lg shadow-lg 
        ${isDragging ? 'cursor-grabbing shadow-xl' : ''}
      `}>
        {/* Draggable handle */}
        <div className="drag-handle flex items-center gap-2 p-3 bg-indigo-600 text-white rounded-t-lg cursor-grab active:cursor-grabbing">
          <Grip size={20} />
          <span className="font-medium">Drag me around!</span>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium mb-2">Current Position</h3>
          <p className="text-sm text-gray-600">
            X: {Math.round(position.x)}, Y: {Math.round(position.y)}
          </p>
        </div>
      </div>
    </Draggable>
  );
}