'use client' 

import React, { useEffect, useState } from 'react';

interface ScrambleVisualizerProps {
  scramble: string;
  puzzleType: string;
  onGenerateNew?: () => void;
}

const mapPuzzleTypeToTwisty = (type: string): string => {
  const map: Record<string, string> = {
    '3x3x3':   '3x3x3',
    '2x2x2':   '2x2x2',
    '4x4x4':   '4x4x4',
    '5x5x5':   '5x5x5',
    '6x6x6':   '6x6x6',
    '7x7x7':   '7x7x7',
    'OH':       '3x3x3',
    'BLD':      '3x3x3',
    'Pyraminx': 'pyraminx',
    'Megaminx': 'megaminx',
    'Skewb':    'skewb',
    'Square-1': 'square1',
    'Clock':    'clock',
  };
  return map[type] ?? '3x3x3';
};

export default function ScrambleVisualizer({ scramble, puzzleType, onGenerateNew }: ScrambleVisualizerProps) {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [is3D, setIs3D] = useState<boolean>(false);

  useEffect(() => {
    // Dynamically import twisty player on client-side mount
    import("cubing/twisty")
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load twisty-player:", err);
      });
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 p-6 bg-gray-900 rounded-xl w-full max-w-2xl mx-auto border border-gray-800">
      
      {/* 1. The Scramble Text */}
      <h2 className="text-2xl md:text-3xl font-mono text-center text-fg tracking-wide whitespace-pre-line leading-relaxed">
        {scramble || "Loading scramble..."}
      </h2>
      
      {/* 2. The Visualizer */}
      <div className="w-64 h-64 flex items-center justify-center">
        {isLoaded && scramble && (
          <twisty-player 
            alg={scramble} 
            puzzle={mapPuzzleTypeToTwisty(puzzleType)}
            visualization={is3D ? "3D" : "2D"} 
            background="none"
            control-panel="none"
          ></twisty-player>
        )}
      </div>

      {/* 3. Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Toggle 2D/3D Button */}
        <button 
          onClick={() => setIs3D(!is3D)}
          className="px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Switch to {is3D ? '2D View' : '3D View'}
        </button>

        {/* Generate New Scramble Button */}
        {onGenerateNew && (
          <button 
            onClick={onGenerateNew}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Generate New Scramble
          </button>
        )}
      </div>
      
    </div>
  );
}