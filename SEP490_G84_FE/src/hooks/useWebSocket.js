import { useState, useEffect, useRef, useCallback } from 'react';
import webSocketService from '../services/webSocketService';

// Hook for subscribing to all room events
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const subscriptionsRef = useRef(new Set());

  useEffect(() => {
    const connect = async () => {
      try {
        await webSocketService.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      // Clean up subscriptions when component unmounts
      subscriptionsRef.current.forEach(subscription => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      });
      subscriptionsRef.current.clear();
      setIsConnected(false);
    };
  }, []); // Empty dependency array - only run once

  const subscribe = useCallback((topic, callback) => {
    if (!isConnected) return null;

    let subscription = null;
    
    if (topic === 'all-rooms') {
      subscription = webSocketService.subscribeToAllRooms(callback);
    } else if (topic.startsWith('room-')) {
      const roomId = topic.replace('room-', '');
      subscription = webSocketService.subscribeToRoom(roomId, callback);
    } else if (topic.startsWith('furniture-')) {
      const furnitureId = topic.replace('furniture-', '');
      subscription = webSocketService.subscribeToFurniture(furnitureId, callback);
    }

    if (subscription) {
      subscriptionsRef.current.add(subscription);
    }

    return subscription;
  }, [isConnected]);

  const unsubscribe = useCallback((subscription) => {
    if (subscription && subscription.unsubscribe) {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(subscription);
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe
  };
};

// Hook specifically for room incident events
export const useRoomIncidents = (onIncident) => {
  const { isConnected, subscribe, unsubscribe } = useWebSocket();
  const subscriptionRef = useRef(null);
  const callbackRef = useRef(onIncident);
  
  // Update callback ref when onIncident changes
  useEffect(() => {
    callbackRef.current = onIncident;
  }, [onIncident]);

  useEffect(() => {
    if (isConnected && callbackRef.current) {
      // Clean up previous subscription first
      if (subscriptionRef.current) {
        unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      const handleMessage = (message) => {
        if (message.type === 'ROOM_INCIDENT' && callbackRef.current) {
          callbackRef.current(message);
        }
      };

      subscriptionRef.current = subscribe('all-rooms', handleMessage);
    }

    return () => {
      if (subscriptionRef.current) {
        unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [isConnected, subscribe, unsubscribe]); // Remove onIncident from dependencies

  return { isConnected };
};

// Hook specifically for furniture status change events
export const useFurnitureStatus = (onStatusChange) => {
  const { isConnected, subscribe, unsubscribe } = useWebSocket();
  const subscriptionRef = useRef(null);
  const callbackRef = useRef(onStatusChange);
  
  // Update callback ref when onStatusChange changes
  useEffect(() => {
    callbackRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (isConnected && callbackRef.current) {
      // Clean up previous subscription first
      if (subscriptionRef.current) {
        unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      const handleMessage = (message) => {
        if (message.type === 'FURNITURE_STATUS_CHANGE' && callbackRef.current) {
          callbackRef.current(message);
        }
      };

      subscriptionRef.current = subscribe('all-rooms', handleMessage);
    }

    return () => {
      if (subscriptionRef.current) {
        unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [isConnected, subscribe, unsubscribe]); // Remove onStatusChange from dependencies

  return { isConnected };
};