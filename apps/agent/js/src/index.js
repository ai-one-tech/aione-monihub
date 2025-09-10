const WebSocket = require('ws');

// JavaScript agent for AiOne MoniHub
class MoniHubAgent {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket(this.serverUrl);
    
    this.ws.on('open', () => {
      console.log('Connected to AiOne MoniHub server');
      // Send initial heartbeat
      this.sendHeartbeat();
    });

    this.ws.on('message', (data) => {
      console.log('Received message:', data);
      this.handleMessage(data);
    });

    this.ws.on('close', () => {
      console.log('Disconnected from server');
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  sendHeartbeat() {
    const heartbeat = {
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    };
    this.ws.send(JSON.stringify(heartbeat));
  }

  handleMessage(data) {
    // Handle messages from the server
    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case 'command':
          this.executeCommand(message);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  executeCommand(command) {
    console.log('Executing command:', command);
    // Command execution logic would go here
  }
}

// Initialize agent
const agent = new MoniHubAgent('ws://localhost:8080');
agent.connect();

module.exports = MoniHubAgent;