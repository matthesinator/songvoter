let selectedPlaylistName, selectedPlaylistButton, selectedRow, selectedSong, statusTimeout,
    userName = 'unknown';

document.addEventListener('DOMContentLoaded', function () {
    let playlistTables = document.getElementsByClassName('songsTable');
    playlistTables[0].style.display = 'block';
    selectedPlaylistButton = document.getElementsByClassName('playlist_btn')[0];
    selectedPlaylistButton.classList.add('selected');

    userName = localStorage['name'] ||
        prompt('Enter your name to send with your requests. You can change it at any time');

    localStorage['name'] = userName;
    $('#userName')[0].value = userName;

    if (window.songs) {
        selectedPlaylistName = Object.keys(window.songs)[0];
    } else {
        window.requestSongs(function () {
            selectedPlaylistName = Object.keys(window.songs)[0];
        });
    }
});

/**
 * Switches between playlists.
 *
 * @param name The name of the playlist
 * @param button The button, to highlight it
 */
function zelectPlaylist (name, button) {
    let playlistTables = document.getElementsByClassName('songsTable');
    Array.prototype.forEach.call(playlistTables, table => {
        table.style.display = 'none';
    });
    document.getElementById('table#' + name).style.display = 'block';
    selectedPlaylistName = name;

    if (selectedPlaylistButton) {
        selectedPlaylistButton.classList.remove('selected');
    }
    button.classList.add('selected');
    selectedPlaylistButton = button;
}

/**
 * Select or deselect the table row the user clicked on. Deselect every other row.
 *
 * @param songId The unique id of the song in the row
 * @param tableRow The table row which was clicked on
 */
function zelectSong (songId, tableRow) {
    if (tableRow.classList.contains('off')) {
        return;
    }
    if (tableRow.classList.contains("selected")) {
        tableRow.classList.remove("selected");
        selectedRow = undefined;
        selectedSong = undefined;
    } else {
        tableRow.classList.add("selected");
        if (selectedRow) {
            selectedRow.classList.remove("selected");
        }
        selectedRow = tableRow;
        selectedSong = { uniqueId: songId }
    }
}

/**
 * Sets the user name.
 */
function setUserName () {
    userName = document.getElementById('userName').value;
    localStorage['name'] = userName;
}

/**
 * Sends the currently selected song to the server. Alerts the user if no song has been selected.
 */
function sendRequest () {
    if (!selectedSong) {
        alert("No song selected!");
        return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/songrequest');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        let statusText = document.getElementById('statusText');

        if (xhr.readyState === 4 && xhr.status === 200) {
            statusText.innerText = xhr.responseText;
            statusText.classList.remove('failure');
            statusText.classList.add('success');
        } else if (xhr.readyState === 4) {
            statusText.innerText = xhr.responseText;
            statusText.classList.remove('success');
            statusText.classList.add('failure');
        }

        clearTimeout(statusTimeout);
        statusTimeout = setTimeout(function () {
            statusText.innerText = '';
            statusText.classList.remove('success');
            statusText.classList.remove('failure');
        }, 2000);
    };
    xhr.send(JSON.stringify(Object.assign(selectedSong, {_userName : userName})));
}