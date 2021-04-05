/* global connectWebsocket, ws */
let selectedRequestRow, selectedRequestSong;

/**
 * Select or deselect the table row the user clicked on. Deselect every other row.
 *
 * @param tableRow The table row which the user clicked on
 */
function selectSong (tableRow) {
    if (tableRow.classList.contains('off')) {
        return;
    }
    if (tableRow.classList.contains("selected")) {
        tableRow.classList.remove("selected");
        selectedRequestRow = undefined;
        selectedRequestSong = undefined;
    } else {
        tableRow.classList.add("selected");
        if (selectedRequestRow) {
            selectedRequestRow.classList.remove("selected");
        }
        selectedRequestRow = tableRow;
        selectedRequestSong = tableRow.id
    }
}

/**
 * Send the currently selected song to the server and mark it as 'played'.
 */
function markPlayedOnServer() {
    let id = selectedRequestSong.split('_')[1];
    selectedRequestRow.classList.remove('selected');
    selectedRequestRow = undefined;
    selectedRequestSong = undefined;

    if (ws) {
        ws.send(`played:${id}`);
    } else {
        connectWebsocket(false, (createdWs) => {
            createdWs.send('played:' + id);
        });
    }
}

/**
 * Blocks or unblocks new requests.
 *
 * @param button The button which was pressed
 */
function toggleRequests(button) {
    if (button.classList.contains('failure')) {
        ws.send('allowRequests:true');
        button.classList.remove('failure');
    } else {
        ws.send('allowRequests:false');
        button.classList.add('failure');
    }
}

/**
 * Sends a request to the server to block requests from the given playlist.
 *
 * @param playlist The name of the playlist to block
 * @param button The pressed button
 */
function blockPlaylist(playlist, button) {
    $.ajax({
        data: { playlist: playlist },
        type: "POST",
        headers: { 'auth': localStorage['passkey'] },
        url: '/admin/blockplaylist',
        success: () => {
            if (button.classList.contains('failure')) {
                button.classList.remove('failure');
            } else {
                button.classList.add('failure');
            }
        },
        error: (err) => {
            console.log("ERROR : ", err);
        }
    });
}