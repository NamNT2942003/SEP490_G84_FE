// Mock WebSocket service to avoid dependency issues
// This provides the same API as the real WebSocket service for development

class WebSocketService {
  constructor() {
    this.isConnected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  async connect() {
    console.log('[WebSocket] Mock connection established');
    this.isConnected = true;
    return Promise.resolve();
  }

  disconnect() {
    console.log('[WebSocket] Mock disconnected');
    this.isConnected = false;
    this.subscriptions.clear();
  }

  // Mock subscription to all room events
  subscribeToAllRooms(callback) {
    console.log('[WebSocket] Mock subscribed to all rooms');
    const subscriptionId = 'room-all-' + Date.now();
    this.subscriptions.set(subscriptionId, callback);
    
    // Return a mock subscription object
    return {
      unsubscribe: () => {
        console.log('[WebSocket] Mock unsubscribed from all rooms');
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  // Mock subscription to specific room events
  subscribeToRoom(roomId, callback) {
    console.log(`[WebSocket] Mock subscribed to room ${roomId}`);
    const subscriptionId = 'room-' + roomId + '-' + Date.now();
    this.subscriptions.set(subscriptionId, callback);
    
    return {
      unsubscribe: () => {
        console.log(`[WebSocket] Mock unsubscribed from room ${roomId}`);
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  // Mock subscription to furniture events
  subscribeToFurniture(furnitureId, callback) {
    console.log(`[WebSocket] Mock subscribed to furniture ${furnitureId}`);
    const subscriptionId = 'furniture-' + furnitureId + '-' + Date.now();
    this.subscriptions.set(subscriptionId, callback);
    
    return {
      unsubscribe: () => {
        console.log(`[WebSocket] Mock unsubscribed from furniture ${furnitureId}`);
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  // Mock send message
  sendMessage(destination, body) {
    console.log(`[WebSocket] Mock sending message to ${destination}:`, body);
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  // Method to simulate receiving messages (for testing)
  simulateMessage(type, data) {
    console.log('[WebSocket] Simulating message:', { type, data });
    this.subscriptions.forEach(callback => {
      try {
        callback({ type, ...data });
      } catch (error) {
        console.error('[WebSocket] Error in subscription callback:', error);
      }
    });
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;