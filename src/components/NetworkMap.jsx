import React, { useMemo } from 'react';

/*
NetworkMap renders a simple schematic of stations (nodes) and tracks (edges).
It accepts props: graph (nodes, edges), trains (array with position info), reservations (edgeId -> occupancy info)
*/
export default function NetworkMap({ graph, trains, reservations, onSelectEdge }) {
  const { nodes, edges } = graph;

  const positions = useMemo(() => {
    // Compute circular layout for nodes for a clean default look
    const n = nodes.length;
    const radius = 180;
    const center = { x: 250, y: 220 };
    const map = new Map();
    nodes.forEach((node, idx) => {
      const angle = (idx / n) * Math.PI * 2;
      map.set(node.id, {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      });
    });
    return map;
  }, [nodes]);

  return (
    <div className="w-full h-[520px] bg-white rounded-lg shadow border p-4">
      <svg viewBox="0 0 500 440" className="w-full h-full">
        {/* Edges */}
        {edges.map((e) => {
          const a = positions.get(e.from);
          const b = positions.get(e.to);
          if (!a || !b) return null;
          const key = `${e.id}`;
          const res = reservations[e.id];
          const oc = res && res.occupiedBy ? res.occupiedBy.length : 0;
          const color = oc > 0 ? '#ef4444' : '#94a3b8';
          const width = 4 + Math.min(oc, 3);
          return (
            <g key={key} onClick={() => onSelectEdge && onSelectEdge(e)} className="cursor-pointer">
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={width} />
              {/* arrow for direction if one-way */}
              {e.direction === 'one-way' && (
                <polygon
                  points={`${(a.x + b.x) / 2},${(a.y + b.y) / 2} ${(a.x + b.x) / 2 - 6},${(a.y + b.y) / 2 - 6} ${(a.x + b.x) / 2 + 6},${(a.y + b.y) / 2 - 6}`}
                  fill={color}
                  transform={`rotate(${Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI) + 90}, ${(a.x + b.x) / 2}, ${(a.y + b.y) / 2})`}
                />
              )}
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8} fontSize={10} textAnchor="middle" fill="#475569">
                {e.speedLimit}km/h · cap {e.capacity}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          const color = n.type === 'station' ? '#2563eb' : n.type === 'junction' ? '#0ea5e9' : n.type === 'signal' ? '#16a34a' : '#334155';
          return (
            <g key={n.id}>
              <circle cx={p.x} cy={p.y} r={8} fill={color} />
              <text x={p.x + 12} y={p.y + 4} fontSize={12} fill="#0f172a">{n.name}</text>
            </g>
          );
        })}

        {/* Trains */}
        {trains.map((t) => {
          if (!t.currentEdge) return null;
          const edge = edges.find((e) => e.id === t.currentEdge);
          if (!edge) return null;
          const a = positions.get(edge.from);
          const b = positions.get(edge.to);
          if (!a || !b) return null;
          const x = a.x + (b.x - a.x) * t.progress;
          const y = a.y + (b.y - a.y) * t.progress;
          return (
            <g key={t.id}>
              <circle cx={x} cy={y} r={6} fill={t.color || '#f59e0b'} stroke="#0f172a" strokeWidth={1} />
              <text x={x + 10} y={y + 4} fontSize={11} fill="#0f172a">{t.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
