import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import NetworkMap from './components/NetworkMap';
import ControlPanel from './components/ControlPanel';
import TrainList from './components/TrainList';

/*
This frontend provides a self-contained simulation of the Project Sanchalak ideas.
It models a small graph, runs edge reservations/occupancy, auto-signals, and moves trains.
No backend is required for this visualization, but the architecture mirrors a real system.
*/

// Simple typed helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Build a demo graph with nodes and edges
function useDemoGraph() {
  return useMemo(() => {
    const nodes = [
      { id: 'A', name: 'Alpha', type: 'station' },
      { id: 'B', name: 'Beta', type: 'station' },
      { id: 'C', name: 'Cross', type: 'junction' },
      { id: 'D', name: 'Delta', type: 'station' },
      { id: 'S1', name: 'Sig-1', type: 'signal' },
      { id: 'S2', name: 'Sig-2', type: 'signal' },
    ];

    const edges = [
      { id: 'e1', from: 'A', to: 'C', length: 4, speedLimit: 80, direction: 'bi', capacity: 1 },
      { id: 'e2', from: 'C', to: 'B', length: 4, speedLimit: 80, direction: 'bi', capacity: 1 },
      { id: 'e3', from: 'C', to: 'D', length: 6, speedLimit: 70, direction: 'bi', capacity: 1 },
      { id: 'e4', from: 'A', to: 'S1', length: 2, speedLimit: 60, direction: 'one-way', capacity: 1 },
      { id: 'e5', from: 'S1', to: 'B', length: 2, speedLimit: 60, direction: 'one-way', capacity: 1 },
      { id: 'e6', from: 'B', to: 'S2', length: 2, speedLimit: 60, direction: 'one-way', capacity: 1 },
      { id: 'e7', from: 'S2', to: 'A', length: 2, speedLimit: 60, direction: 'one-way', capacity: 1 },
    ];

    // adjacency for routing
    const adj = new Map();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => {
      adj.get(e.from).push({ to: e.to, edge: e });
      if (e.direction !== 'one-way') {
        adj.get(e.to)?.push({ to: e.from, edge: { ...e, id: `${e.id}-r`, from: e.to, to: e.from } });
      }
    });

    return { nodes, edges, adj };
  }, []);
}

// Dijkstra shortest path on the demo graph by length
function shortestPath(adj, start, goal) {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  const pq = [];
  const push = (node, d) => {
    pq.push({ node, d });
    pq.sort((a, b) => a.d - b.d);
  };
  adj.forEach((_, k) => dist.set(k, Infinity));
  dist.set(start, 0);
  push(start, 0);

  while (pq.length) {
    const { node } = pq.shift();
    if (visited.has(node)) continue;
    visited.add(node);
    if (node === goal) break;
    for (const { to, edge } of adj.get(node) || []) {
      const alt = dist.get(node) + (edge.length || 1);
      if (alt < dist.get(to)) {
        dist.set(to, alt);
        prev.set(to, { node, edge });
        push(to, alt);
      }
    }
  }
  if (!prev.has(goal)) return null;
  const pathNodes = [];
  const pathEdges = [];
  let cur = goal;
  while (cur !== start) {
    const p = prev.get(cur);
    pathNodes.push(cur);
    pathEdges.push(p.edge);
    cur = p.node;
  }
  pathNodes.push(start);
  pathNodes.reverse();
  pathEdges.reverse();
  return { nodes: pathNodes, edges: pathEdges };
}

export default function App() {
  const graph = useDemoGraph();
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [reservations, setReservations] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tick, setTick] = useState(0);

  const trainsRef = useRef([
    { id: 'T1', name: 'T1 - Alpha → Delta', color: '#ef4444', speed: 60, status: 'moving', currentEdge: 'e1', progress: 0, path: [] },
    { id: 'T2', name: 'T2 - Beta → Alpha', color: '#22c55e', speed: 55, status: 'moving', currentEdge: 'e2', progress: 0, path: [] },
    { id: 'T3', name: 'T3 - Loop', color: '#3b82f6', speed: 40, status: 'moving', currentEdge: 'e6', progress: 0, path: [] },
  ]);

  // Initialize routes using Dijkstra
  useEffect(() => {
    const plan = [];
    const r1 = shortestPath(graph.adj, 'A', 'D');
    const r2 = shortestPath(graph.adj, 'B', 'A');
    const r3 = shortestPath(graph.adj, 'B', 'A');
    if (r1) plan.push({ trainId: 'T1', trainName: 'T1', path: graph.nodes.filter(n => r1.nodes.includes(n.id)) });
    if (r2) plan.push({ trainId: 'T2', trainName: 'T2', path: graph.nodes.filter(n => r2.nodes.includes(n.id)) });
    if (r3) plan.push({ trainId: 'T3', trainName: 'T3', path: graph.nodes.filter(n => r3.nodes.includes(n.id)) });
    setRoutes(plan);
  }, [graph]);

  // Reservation helpers
  const reserveEdge = (edgeId, trainId) => {
    setReservations((prev) => {
      const r = { ...prev };
      const entry = r[edgeId] || { occupiedBy: [] };
      if (!entry.occupiedBy.includes(trainId)) {
        entry.occupiedBy = [...entry.occupiedBy, trainId];
      }
      r[edgeId] = entry;
      return r;
    });
  };
  const releaseEdge = (edgeId, trainId) => {
    setReservations((prev) => {
      const r = { ...prev };
      const entry = r[edgeId] || { occupiedBy: [] };
      entry.occupiedBy = entry.occupiedBy.filter((t) => t !== trainId);
      r[edgeId] = entry;
      return r;
    });
  };

  // Auto-signal and collision prevention: if edge capacity reached, trains approaching must pause.
  const canEnter = (edgeId) => {
    const info = reservations[edgeId];
    const cap = (graph.edges.find((e) => e.id === edgeId) || {}).capacity || 1;
    const occ = info && info.occupiedBy ? info.occupiedBy.length : 0;
    return occ < cap;
  };

  // Main simulation loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 250 / simSpeed);
    return () => clearInterval(interval);
  }, [isRunning, simSpeed]);

  useEffect(() => {
    const trains = trainsRef.current.map((t) => ({ ...t }));
    const newAlerts = [];

    trains.forEach((t) => {
      if (!t.currentEdge) return;
      // if at start of an edge and it's not reserved, try to reserve
      reserveEdge(t.currentEdge, t.id);
      const edge = graph.edges.find((e) => e.id === t.currentEdge);
      if (!edge) return;

      // If edge is at capacity and train hasn't entered sufficiently, stop before entering
      const info = reservations[t.currentEdge] || { occupiedBy: [] };
      const cap = edge.capacity || 1;
      const occupied = info.occupiedBy.length;
      const isOnEdge = t.progress > 0.05; // after 5% we consider it entered

      if (occupied > cap && !isOnEdge) {
        t.status = 'stopped';
        return;
      }

      // Move
      t.status = 'moving';
      const speedFactor = clamp(t.speed, 10, edge.speedLimit) / 1000; // arbitrary unit per tick
      t.progress = clamp(t.progress + speedFactor * (edge.length || 1), 0, 1);

      // If reaching end, transition to next edge by routing greedily toward destination
      if (t.progress >= 1) {
        // release current edge
        releaseEdge(t.currentEdge, t.id);

        // pick next hop: favor continuing toward target node based on planned route or simple adjacency
        const fromNode = edge.to;
        const target = t.id === 'T1' ? 'D' : 'A';
        const sp = shortestPath(graph.adj, fromNode, target);
        if (sp && sp.edges.length > 0) {
          const nextEdge = sp.edges[0];
          if (canEnter(nextEdge.id)) {
            t.currentEdge = nextEdge.id;
            t.progress = 0;
            reserveEdge(nextEdge.id, t.id);
          } else {
            // wait at virtual signal
            t.status = 'stopped';
            t.progress = 0.99; // hold at end until free
            newAlerts.push({ severity: 'low', message: `${t.name} waiting for clearance on ${nextEdge.id}` });
          }
        } else {
          // terminal
          t.currentEdge = null;
          t.status = 'idle';
        }
      }
    });

    // Basic conflict detection: any edge with > capacity
    graph.edges.forEach((e) => {
      const info = reservations[e.id] || { occupiedBy: [] };
      if (info.occupiedBy.length > (e.capacity || 1)) {
        newAlerts.push({ severity: 'high', message: `Conflict detected on ${e.id}` });
      }
    });

    trainsRef.current = trains;
    setAlerts(newAlerts);
  }, [tick]);

  const trains = trainsRef.current;

  const stats = useMemo(() => {
    const occupied = Object.values(reservations).filter((r) => r.occupiedBy && r.occupiedBy.length > 0).length;
    const conflicts = alerts.filter((a) => a.severity === 'high').length;
    const throughput = Math.round(trains.filter((t) => t.progress >= 1).length * 2);
    return { trains: trains.length, occupied, conflicts, throughput };
  }, [reservations, alerts, trains]);

  const handleRecalculate = () => {
    // simulate dynamic rescheduling by slightly randomizing speeds
    trainsRef.current = trainsRef.current.map((t) => ({ ...t, speed: clamp(t.speed + (Math.random() - 0.5) * 10, 30, 90) }));
    setAlerts([{ severity: 'low', message: 'Rescheduling applied: speeds adjusted based on congestion.' }]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header isRunning={isRunning} onToggleRun={() => setIsRunning((v) => !v)} simSpeed={simSpeed} onSpeedChange={setSimSpeed} />

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          <NetworkMap graph={graph} trains={trains} reservations={reservations} />
          <TrainList trains={trains} />
        </div>
        <ControlPanel alerts={alerts} routes={routes} onRecalculate={handleRecalculate} stats={stats} />
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-6 text-xs text-gray-500">
        Automation • Safety • Intelligent Scheduling — demo simulation only
      </footer>
    </div>
  );
}
