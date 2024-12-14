import { Server } from 'socket.io';

export default function setupSocket(server) {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('message', (data) => {
            console.log('Received message:', data);
            socket.broadcast.emit('message', data); // Broadcast to all connected clients
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
        });
    });

    return io;
}
