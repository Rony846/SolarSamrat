import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { chatSocketUrl } from './api/chat';

type ChatEvent = { type: string; channel_id?: string; message?: unknown };

/**
 * Maintains a single realtime chat WebSocket with auto-reconnect. Calls `onEvent`
 * for every server event (e.g. {type:'message', channel_id, message}). Reconnects
 * on drop and when the app returns to the foreground.
 */
export function useChatSocket(onEvent: (e: ChatEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;
  const closedRef = useRef(false);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    closedRef.current = false;

    const connect = async () => {
      if (closedRef.current) return;
      const url = await chatSocketUrl();
      if (!url || closedRef.current) return;
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;
        ws.onmessage = (ev) => {
          try { cbRef.current(JSON.parse(ev.data as string)); } catch { /* ignore */ }
        };
        ws.onclose = () => { scheduleReconnect(); };
        ws.onerror = () => { try { ws.close(); } catch { /* ignore */ } };
      } catch {
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (closedRef.current) return;
      if (retryRef.current) clearTimeout(retryRef.current);
      retryRef.current = setTimeout(connect, 3000);
    };

    connect();

    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active' && (!wsRef.current || wsRef.current.readyState > 1)) connect();
    });

    return () => {
      closedRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      sub.remove();
      try { wsRef.current?.close(); } catch { /* ignore */ }
      wsRef.current = null;
    };
  }, []);
}
