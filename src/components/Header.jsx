import React from 'react';
import { Play, Pause, Gauge, Settings, Train } from 'lucide-react';

export default function Header({ isRunning, onToggleRun, simSpeed, onSpeedChange }) {
  return (
    <header className="w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600 text-white">
            <Train size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Project Sanchalak</h1>
            <p className="text-xs text-gray-500">Real-time Train Traffic Control</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onToggleRun}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors border ${
              isRunning
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
            }`}
            aria-label={isRunning ? 'Pause simulation' : 'Start simulation'}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            {isRunning ? 'Pause' : 'Start'}
          </button>

          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-gray-500" />
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.25}
              value={simSpeed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-40 accent-blue-600"
              aria-label="Simulation speed"
            />
            <span className="w-10 text-right text-sm text-gray-600">{simSpeed.toFixed(2)}x</span>
          </div>

          <button className="hidden md:inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border bg-gray-50 text-gray-700 hover:bg-gray-100">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}
