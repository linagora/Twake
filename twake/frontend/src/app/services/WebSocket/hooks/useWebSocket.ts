import { useEffect, useRef, useState } from 'react';
import WebSocketFactory, { WebsocketEvents } from 'app/services/WebSocket/WebSocket';
import WebSocketService from 'app/services/WebSocket/WebSocketService';
import Logger from 'app/features/global/services/logger-service';

const logger = Logger.getLogger('useWebSocket');

const useWebSocket = () => {
  const wsRef = useRef<WebSocketService>();
  // having this will allow consumers to be updated with the io instance once connected
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    wsRef.current = WebSocketFactory.get();

    if (wsRef.current.isConnected()) {
      logger.debug('WS is connected');
      setConnected(() => true);
    }

    wsRef.current.on(WebsocketEvents.Connected, (data: { url: string }) => {
      logger.debug('WS is connected to', data.url);
      setConnected(() => true);
    });

    wsRef.current.on(WebsocketEvents.Disconnected, (data: { url: string }) => {
      console.log('WS is disconnected from', data.url);
      setConnected(() => false);
    });

    return () => {
      logger.debug('WS Cleanup');
    };
  }, []);

  return {
    websocket: wsRef.current,
    connected,
  };
};

export default useWebSocket;
