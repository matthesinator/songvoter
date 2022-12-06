let selectedPlaylistName, selectedPlaylistButton, selectedRow, selectedSong, statusTimeout,
    userName = undefined;

document.addEventListener('DOMContentLoaded', function () {
    let playlistTables = document.getElementsByClassName('songsTable'),
        nameInput = $('#userName')[0];

    if (playlistTables.length) {
        playlistTables[0].classList.remove('hidden');
    }

    selectedPlaylistButton = document.getElementsByClassName('playlist_btn')[0];
    if (selectedPlaylistButton) {
        selectedPlaylistButton.classList.add('selected');
    }

    if (localStorage['sessionStart'] && localStorage['sessionStart'] + 1000 * 60 * 60 * 24 > Date.now()) {
        userName = localStorage['twitchName'];
        localStorage['name'] = userName;
        if (nameInput) {
            nameInput.disabled = true;
        }

        $('#notLoggedIn').css('display', 'none');
        $('#loggedIn').css('display', 'block');
    } else {
        localStorage['name'] = userName;
        $('#notLoggedIn').css('display', 'block');
        $('#loggedIn').css('display', 'none');
    }

    if (userName && nameInput) {
        nameInput.value = userName;
    }

    if (localStorage['twitchName'] && nameInput) {
        nameInput.disabled = true;
    }

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
        table.classList.add('hidden');
    });
    document.getElementById('table_' + name).classList.remove('hidden');
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

    if (!userName) {
        userName = prompt('You need to enter a name to send requests.')

        if (!userName) {
            return;
        }

        $('#userName')[0].value = userName;
        localStorage['name'] = userName;
    }

    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/songrequest');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('uid', localStorage['uid']);
    xhr.onreadystatechange = function () {
        let statusText = document.getElementById('statusText');

        if (xhr.readyState === 4 && xhr.status === 200) {
            statusText.innerText = xhr.responseText;
            statusText.classList.remove('failure');
            statusText.classList.add('success');
        } else if (xhr.readyState === 4) {
            if (xhr.responseText === 'You need to be logged in with Twitch to vote!') {
                $('#notLoggedIn').css('display', 'block');
                $('#loggedIn').css('display', 'none');
                $('#userName')[0].disabled = false;

                delete localStorage['uid'];
                delete localStorage['twitchName'];
                delete localStorage['sessionStart'];
            }

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