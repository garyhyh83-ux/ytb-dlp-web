// frontend/src/api/useWebSocket.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import type { Task } from '../types';

interface WSMessage {
  type: string;
  tasks?: Task[];
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === 'tasks_update' && msg.tasks) {
          setTasks(msg.tasks);
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { tasks, connected };
}
