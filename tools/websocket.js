const { Server } = require('ws');

exports.createWebsocketServer = function (server) {
    const wss = new Server({ server });

    wss.on('connection', function (ws) {
        ws.send('connected');
        globalController.addViewer(ws);

        ws.on('message', function (message) {
            message = JSON.parse(message);

            switch (message.target) {
            case 'authorize':
                ws.authorized = message.passkey === globalPasskey;
                break;
            case 'played':
                if (!ws.authorized) {
                    return ws.send(JSON.stringify({
                        unauthorized: true,
                        initialRequest: message
                    }));
                }
                if (!message.playedSong || !message.playedAt) {
                    return ws.send(JSON.stringify({ error: 'argument missing' }));
                }
                globalController.markSongPlayed(message.playedSong, message.playedAt);
                ws.send(JSON.stringify({ message: 'song marked' }));
                break;
            case 'toggleRequests':
                if (!ws.authorized) {
                    return ws.send(JSON.stringify({
                        unauthorized: true,
                        initialRequest: message
                    }));
                }
                globalController.toggleRequests();
                ws.send(JSON.stringify({ message: 'requests toggled' }));
                break;
            }
        });

        ws.on('close', function () {
            globalController.cleanUpViewers();
        });
    });

    return wss;
}