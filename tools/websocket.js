const WebSocket = require('ws');

const wss = new WebSocket.Server({port: 3001});

function handleMessage(message) {
    let parts = message.split(':'),
        command = parts[0],
        argument = parts[1];

    switch (command) {
    case 'played':
        globalController.markSongPlayed(argument);
        return 'done';
    default:
        return 'did nothing';
    }
}

wss.on('connection', function (ws, req) {
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

module.exports = wss;