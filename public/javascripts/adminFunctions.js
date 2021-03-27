/* global connectWebsocket, ws */
let selectedRequestRow, selectedRequestSong;

$('document').ready(() => {
    localStorage['passkey'] = localStorage['passkey'] || prompt("Enter passkey");
});
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
        ws.send('played:' + id);
    } else {
        connectWebsocket(false, (createdWs) => {
            createdWs.send('played:' + id);
        });
    }
}