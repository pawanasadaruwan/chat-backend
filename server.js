const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;

// We will store the admin's socket ID here
let adminSocketId = null;

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // --- Identify if the connection is from Admin or a Client ---
  const isAdmin = socket.handshake.query.isAdmin === 'true';

  if (isAdmin) {
    adminSocketId = socket.id;
    console.log(`Admin connected with socket ID: ${adminSocketId}`);
    // We don't need to notify the admin about themselves
  } else {
    // This is a client. Their private room will be their socket ID.
    socket.join(socket.id);
    console.log(`Client ${socket.id} joined their private room.`);
    
    // Notify the admin that a new client has connected
    if (adminSocketId) {
      io.to(adminSocketId).emit('new-client-connected', { clientId: socket.id });
    }
  }

  // --- Handle Messages ---

  // Listen for messages FROM a CLIENT
  socket.on('client-message', (data) => {
    console.log(`Message from Client ${socket.id}: ${data.message}`);
    // Send the message to the client's own room (so they see it)
    io.to(socket.id).emit('new-message', { sender: 'You', text: data.message });
    // And also send it to the admin
    if (adminSocketId) {
      io.to(adminSocketId).emit('new-message', { sender: socket.id, text: data.message });
    }
  });

  // Listen for messages FROM the ADMIN
  socket.on('admin-message', (data) => {
    console.log(`Message from Admin to ${data.clientId}: ${data.message}`);
    // Send the message only to the specific client's room
    io.to(data.clientId).emit('new-message', { sender: 'Admin', text: data.message });
    // Also send it back to the admin so they can see their own reply
     if (adminSocketId) {
        io.to(adminSocketId).emit('new-message', { sender: `You (to ${data.clientId.substring(0,4)})`, text: data.message });
     }
  });

  // --- Handle Disconnections ---
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.id === adminSocketId) {
      console.log('Admin has disconnected.');
      adminSocketId = null;
    } else {
       // Notify the admin that a client has disconnected
       if (adminSocketId) {
        io.to(adminSocketId).emit('client-disconnected', { clientId: socket.id });
       }
    }
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
