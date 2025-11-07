import React from 'react';
import { Train, MapPin, Activity } from 'lucide-react';

export default function TrainList({ trains }) {
  return (
    <div className="w-full bg-white rounded-lg shadow border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Train size={18} className="text-blue-600" />
        <h2 className="font-semibold">Live Trains</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-4">Train</th>
              <th className="py-2 pr-4">Edge</th>
              <th className="py-2 pr-4">Progress</th>
              <th className="py-2 pr-4">Speed</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {trains.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="py-2 pr-4 font-medium text-gray-900">{t.name}</td>
                <td className="py-2 pr-4 text-gray-700 inline-flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" /> {t.currentEdge || '—'}
                </td>
                <td className="py-2 pr-4 text-gray-700">{Math.round(t.progress * 100)}%</td>
                <td className="py-2 pr-4 text-gray-700">{t.speed.toFixed(1)} km/h</td>
                <td className="py-2 pr-4">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                    t.status === 'moving' ? 'bg-emerald-50 text-emerald-700' : t.status === 'stopped' ? 'bg-yellow-50 text-yellow-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Activity size={12} /> {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
