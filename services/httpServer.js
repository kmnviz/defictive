require('dotenv').config({ path: '../.env' });

const http = require('http');
const WebSocket = require('ws');

const httpServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, HTTP server is running!');
});

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws) => {
    console.log('WebSocket connected');
  
    ws.on('message', (message) => {
      console.log(`Received message from WebSocket client: `, message);
    });
  
    ws.send('Welcome to the WebSocket server!');
});

const PORT = process.env.HTTP_PORT;
httpServer.listen(PORT, () => {
    console.log(`Combined HTTP and WebSocket server is running on port ${PORT}`);
});