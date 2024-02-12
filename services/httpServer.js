require('dotenv').config({ path: '../.env' });

const http = require('http');
const WebSocket = require('ws');

const eventSourceClients = new Set();
const httpServer = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    res.write('\n');

    eventSourceClients.add(res);

    req.on('close', () => {
        eventSourceClients.delete(res);
    });
});

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws) => {
    console.log('WebSocket connected');
  
    ws.on('message', (message) => {
        console.log(`Received message from WebSocket client: `, message.toString());

        eventSourceClients.forEach((client) => {
            client.write(`data: ${message.toString()}\n\n`);
        });
    });
  
    ws.send('Welcome to the WebSocket server!');
});

const PORT = process.env.HTTP_PORT;
httpServer.listen(PORT, () => {
    console.log(`Combined HTTP and WebSocket server is running on port ${PORT}`);
});
