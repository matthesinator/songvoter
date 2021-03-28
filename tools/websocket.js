const { Server } = require('ws');

exports.createWebsocketServer = function (server) {
    const wss = new Server({ server });

    function handleMessage(message) {
        let parts = message.split(':'),
            command = parts[0],
            argument = parts[1];

        switch (command) {
        case 'allowRequests':
            globalController.allowRequests(argument === 'true');
            return 'done';
        case 'played':
            globalController.markSongPlayed(argument);
            return 'done';
        default:
            return 'did nothing';
        }
    }

    wss.on('connection', function (ws) {
        ws.send('connected');
        globalController.addViewer(ws);

        ws.on('message', function (message) {
            if (message.startsWith('passkey')) {
                ws.authorized = message.split(':')[1] === globalPasskey;
                return;
            }
            if (!ws.authorized) {
                ws.send(JSON.stringify({
                    unauthorized: true,
                    initialRequest: message
                }));
                return;
            }
            ws.send(handleMessage(message));
        });

        ws.on('close', function () {
            globalController.cleanUpViewers();
        });
    });

    return wss;
}