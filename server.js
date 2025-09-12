const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;

// This code runs for every client that connects
io.on('connection', (socket) => {
  console.log('A user connected');

  // When a 'chat message' arrives from a client...
  socket.on('chat message', (msg) => {
    // Show the message in the server's terminal
    console.log('message: ' + msg);
    // Send the message back to ALL connected clients
    io.emit('chat message', msg);
  });

  // When a client disconnects...
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});