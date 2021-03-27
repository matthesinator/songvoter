let ws, requestsTable;
document.addEventListener('DOMContentLoaded', function () {
    connectWebsocket();
    requestsTable = document.getElementById('requestTable');
});

/**
 * Opens a websocket connection to the server to refresh requested and played songs in real time.
 *
 * @param retry As long as this is false, the function will retry to connect if the connection failed
 * @param callback Function to call when a connection has been established
 */
function connectWebsocket (retry, callback) {
    ws = new WebSocket(`ws://${window.location.hostname}:3001`)

    ws.onerror = () => {
        if (!retry) {
            connectWebsocket(true);
        } else {
            console.warn("Couldn't connect to websocket");
        }
    };

    ws.onmessage = (response) => {
        let data;
        try {
            data = JSON.parse(response.data);
        } catch (SyntaxError) {
            data = response.data;
        }

        if (data.request) {
            addRequestInTable(data.request, data.uniqueId);
        } else if (data.playedSong) {
            markPlayedInTable(data.playedSong, data.uniqueId);
        } else if (data.unauthorized) {
            localStorage['passkey'] = prompt("Enter correct passkey to continue.");
            ws.send('passkey:' + localStorage['passkey']);
            ws.send(data.initialRequest);
        }
    }

    ws.onopen = () => {
        if (window.location.pathname.includes('admin')) {
            localStorage['passkey'] = localStorage['passkey'] || prompt("Enter passkey");
            ws.send(`passkey:${localStorage['passkey']}`);
        }
        if (callback) {
            callback();
        }
    }
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
    let tdId = $('<td class="tdNumber"></td>').text(song.id),
        tdTime = $('<td class="tdTime"></td>'),
        tdName = $('<td class="tdName"></td>').text(song.name),
        tdUser = $('<td class="tdUser"></td>').text(song.requestedBy),
        tr = $(`<tr id="tr_${uniqueId}" onclick='selectSong(this)'></tr>`);

    tr.append(tdId, tdTime, tdName, tdUser);
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
    $('#requestTable > tbody').prepend(createTableRow(song, uniqueId));

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