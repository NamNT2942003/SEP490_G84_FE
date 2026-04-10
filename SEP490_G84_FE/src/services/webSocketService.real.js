// Real WebSocket service with STOMP/SockJS - use when dependencies are resolved
// To use this: rename webSocketService.js to webSocketService.mock.js and rename this file to webSocketService.js

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import apiClient from './apiClient';

class RealWebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect() {
    if (this.isConnected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      try {
        const apiBaseUrl = apiClient.defaults.baseURL || '';
        const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
        const socket = new SockJS(`${backendOrigin}/ws`);
        
        this.client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {},
          debug: (str) => {
            console.log('[WebSocket Debug]', str);
          },
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: (frame) => {
            console.log('[WebSocket] Connected:', frame);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            resolve();
          },
          onStompError: (frame) => {
            console.error('[WebSocket] STOMP Error:', frame);
            this.isConnected = false;
            reject(frame);
          },
          onWebSocketClose: (event) => {
            console.warn('[WebSocket] Connection closed:', event);
            this.isConnected = false;
            this.handleReconnect();
          },
          onWebSocketError: (event) => {
            console.error('[WebSocket] WebSocket Error:', event);
            this.isConnected = false;
            reject(event);
          }
        });

        this.client.activate();
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        reject(error);
      }
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('[WebSocket] Reconnection failed:', error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WebSocket] Max reconnection attempts reached');
          }
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.client && this.isConnected) {
      this.client.deactivate();
      this.isConnected = false;
      this.eventHandlers.clear();
    }
  }

  // Subscribe to all room events
  subscribeToAllRooms(callback) {
    if (!this.isConnected) {
      console.warn('[WebSocket] Not connected. Call connect() first.');
      return null;
    }

    return this.client.subscribe('/topic/room/all', (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });
  }

  // Subscribe to specific room events
  subscribeToRoom(roomId, callback) {
    if (!this.isConnected) {
      console.warn('[WebSocket] Not connected. Call connect() first.');
      return null;
    }

    return this.client.subscribe(`/topic/room/${roomId}`, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });
  }

  // Subscribe to specific furniture events
  subscribeToFurniture(furnitureId, callback) {
    if (!this.isConnected) {
      console.warn('[WebSocket] Not connected. Call connect() first.');
      return null;
    }

    return this.client.subscribe(`/topic/furniture/${furnitureId}`, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });
  }

  // Send message to server
  sendMessage(destination, body) {
    if (!this.isConnected) {
      console.warn('[WebSocket] Not connected. Call connect() first.');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body)
    });
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const realWebSocketService = new RealWebSocketService();

export default realWebSocketService;