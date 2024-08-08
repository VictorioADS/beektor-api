const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { comprobarJWTSocket } = require('../helpers/JWT');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Reemplaza con el dominio de tu frontend
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

let socketIo;

const socketController = (socket, io) => {
  socketIo = io;

  console.log('Cliente conectado', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado', socket.id);
  });

  const [validar, uid] = comprobarJWTSocket(socket.handshake.query['my-custom-header']);

  if (!validar) {
    return socket.disconnect();
  }

  socket.join(uid);

  console.log('Cliente autenticado', uid);
};

const emitId = (id, data) => {
  socketIo.to(id).emit('newDataSensores', data);
};

io.on('connection', (socket) => {
  socketController(socket, io);
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

module.exports = {
  emitId,
  socketController
};
