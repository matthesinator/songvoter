let ws, wsErrorCounter = 0, wsTimeout, requestsTable;

document.addEventListener('DOMContentLoaded', function () {
    connectWebsocket();
    requestsTable = document.getElementById('requestTable');
});

/**
 * Opens a websocket connection to the server to refresh requested and played songs in real time.
 *
 * @param callback Function to call when a connection has been established
 */
function connectWebsocket (callback) {
    ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

    /**
     * Check if the websocket is still connected every 10 seconds. Reconnect if necessary.
     *
     * @param timeout When the connection should be checked again
     */
    function setWsTimeout(timeout) {
        clearTimeout(wsTimeout);
        wsTimeout = setTimeout(() => {
            if (ws.readyState !== 1) {
                connectWebsocket();
            } else {
                setWsTimeout();
            }
        }, timeout);
    }

    ws.onerror = () => {
        wsErrorCounter++;
        let timeout = wsErrorCounter * 10000;
        console.warn(`Couldn't connect to websocket, trying again in ${timeout / 1000} seconds.`);
        setWsTimeout(timeout);
    };

    ws.onmessage = (message) => {
        let data;
        try {
            data = JSON.parse(message.data);
        } catch (SyntaxError) {
            data = message.data;
        }

        if (data.request) {
            addRequestInTable(data.request, data.uniqueId);
        } else if (data.playedSong) {
            markPlayedInTable(data.playedSong, data.uniqueId);
        } else if (data.unauthorized) {
            localStorage['passkey'] = prompt("Enter correct passkey to continue.");
            ws.send(JSON.stringify({
                target: 'authorize',
                passkey: localStorage['passkey']
            }));
            ws.send(data.initialRequest);
        } else if (data === 'reload') {
            location.reload();
        }
    }

    ws.onopen = () => {
        console.log('Websocket connected.');
        wsErrorCounter = 0;

        if (window.location.pathname.includes('admin')) {
            localStorage['passkey'] = localStorage['passkey'] || prompt("Enter passkey");
            ws.send(JSON.stringify({
                target: 'authorize',
                passkey: localStorage['passkey']
            }));
        }
        if (callback) {
            callback(ws);
        }
    }

    setWsTimeout(10000);
}

/**
 * Creates a new table row for the given song. The table row contains fields for song number and name, the time it was
 * played at and the user who requested it.
 *
 * @param song The song object to create the table row for
 * @param uniqueId The unique id to identify the song across playlists
 * @returns {*|Window.jQuery|HTMLElement} The created table row
 */
function createTableRow(song, uniqueId) {
    let tr = $(`<tr id="tr_${uniqueId}" onclick='selectSong(this)'></tr>`);

    for (let column of Object.values(song._columns)) {
        if (column === 'id') {continue;}
        let td = $('<td class="songCell"></td>').text(song[column]);
        tr.append(td);
    }

    tr.append($('<td class="songCell tdUser"></td>').text(song.requestedBy));
    return tr;
}

/**
 * Adds the newly requested song to the table of requested songs. Always puts it at the top. Also greys out the
 * corresponding song in the voter table.
 *
 * @param song The song object to create the table row for
 * @param uniqueId The unique id to identify the song across playlists
 */
function addRequestInTable(song, uniqueId) {
    let firstOffRow = $("#requestTable > tbody > tr.off").first();

    if (!firstOffRow.length) {
        $("#requestTable > tbody").append(createTableRow(song, uniqueId));
    } else {
        firstOffRow.before(createTableRow(song, uniqueId));
    }

    let selectRow = $(document.getElementById(`vote_${uniqueId}`));
    if (selectRow.length) {
        selectRow.addClass('off');
    }
}

/**
 * Marks the given song as played in the table of requested songs. Adds the time the song was played at in the table.
 *
 * @param song The song which was played
 * @param uniqueId The unique id to identify the song across playlists
 */
function markPlayedInTable(song, uniqueId) {
    let playedRow = $(document.getElementById(`tr_${uniqueId}`)),
        firstOffRow = $("#requestTable > tbody > tr.off").first();

    playedRow.addClass('off');
    playedRow.find('.tdTime').text(song.playedAt);

    if (!firstOffRow.length) {
        $("#requestTable > tbody > tr").last().after(playedRow);
    } else {
        firstOffRow.before(playedRow);
    }
}