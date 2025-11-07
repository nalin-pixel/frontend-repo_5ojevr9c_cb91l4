import React from 'react';
import { AlertTriangle, Route, Clock, Activity } from 'lucide-react';

export default function ControlPanel({ alerts, routes, onRecalculate, stats }) {
  return (
    <aside className="w-full md:w-80 bg-white rounded-lg shadow border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-blue-600" />
        <h2 className="font-semibold">System Status</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Trains" value={stats.trains} />
        <Stat label="Occupied" value={stats.occupied} />
        <Stat label="Throughput" value={`${stats.throughput}/h`} />
        <Stat label="Conflicts" value={stats.conflicts} danger={stats.conflicts > 0} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <AlertTriangle size={18} className="text-amber-500" />
        <h3 className="font-medium">Alerts</h3>
      </div>
      <ul className="space-y-2 max-h-40 overflow-auto pr-2">
        {alerts.length === 0 && <li className="text-sm text-gray-500">No active alerts</li>}
        {alerts.map((a, i) => (
          <li key={i} className={`text-sm ${a.severity === 'high' ? 'text-red-600' : 'text-amber-700'}`}>
            • {a.message}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 pt-2">
        <Route size={18} className="text-emerald-600" />
        <h3 className="font-medium">Active Routes</h3>
      </div>
      <ul className="space-y-2 max-h-40 overflow-auto pr-2">
        {routes.length === 0 && <li className="text-sm text-gray-500">No routes planned</li>}
        {routes.map((r) => (
          <li key={r.trainId} className="text-sm text-gray-700">
            <span className="font-medium">{r.trainName}</span>
            <span className="mx-2">→</span>
            <span className="text-gray-500">{r.path.map((n) => n.name).join(' · ')}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onRecalculate}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm font-medium shadow hover:bg-blue-700 transition-colors"
      >
        <Clock size={16} /> Recalculate Schedules
      </button>
    </aside>
  );
}

function Stat({ label, value, danger = false }) {
  return (
    <div className={`rounded-md border p-3 ${danger ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-semibold ${danger ? 'text-red-700' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}
