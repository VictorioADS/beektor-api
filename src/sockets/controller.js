const { Socket } = require('socket.io');
const { comprobarJWTSocket } = require('../helpers/JWT');

let socketIo;

const socketController = (socket = new Socket(), io) => {
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
}

const emitId = (id, data) => {
    socketIo.to(id).emit('newDataSensores', data);
    notifySensorUpdate(id, data);
}

const notifySensorUpdate = (id, data) => {
    socketIo.to(id).emit('sensorUpdateNotification', {
        message: 'Sensores actualizados',
        data: data
    });
}

module.exports = {
    socketController,
    emitId
}