let resultTimer, playlistsToDelete = [], playlistsBlocked = [], playlistsRenamed = {};

$(document).ready(function () {
    $("#submitBtn").click(function (event) {
        event.preventDefault();
        let form = $('#fileUploadForm')[0],
            data = new FormData(form),
            names = [],
            errorStatus = undefined,
            inputFields = $('#filesTable input');

        inputFields.each((index) => {
            if (!inputFields[index].value) {
                errorStatus = "Playlist name missing";
            } else if (inputFields[index].value.includes(',')) {
                errorStatus = "No commas in playlist names";
            } else if (names.includes(inputFields[index].value)) {
                errorStatus = "Duplicate are not possible"
            }
            names.push(inputFields[index].value);
        });

        if (names.length > 5) {
            errorStatus = "Only up to five playlists are allowed.";
        }

        if (errorStatus) {
            alert(errorStatus);
            return;
        }

        data.append("names", names.toString());
        $("#btnSubmit").prop("disabled", true);

        sendRequest("/admin/uploadcsvplaylist", {
            enctype: 'multipart/form-data',
            data: data,
            processData: false,
            contentType: false,
            cache: false,
        }, () => {
            location.reload();
        });
    });

    $('#writeBtn').click(() => {
        sendRequest("/admin/savecurrentsongs");
    });

    $('#confirmPlaylistChanges').click(() => {
        let data = {};

        if (playlistsToDelete.length) {
            data.deletable = JSON.stringify(playlistsToDelete);
        }
        if (playlistsBlocked) {
            data.blockable = JSON.stringify(playlistsBlocked);
        }
        if (Object.keys(playlistsRenamed).length) {
            data.renameable = JSON.stringify(playlistsRenamed);
        }

        sendRequest("/admin/changeplaylists", {
            data: data,
            enctype: 'application/json'
        }, () => {
            location.reload();
        });
    });

    $('#readBtn').click(() => {
        sendRequest("/admin/readsavedsongs");
    });

    $('#setPasskeyBtn').click(() => {
        localStorage['passkey'] = prompt("Enter passkey");
    });

    let deleteButton = $('#deleteBtn');
    function clickDelete() {
        $('#warning').text("This will delete all locally stored songs. Click again to continue");
        deleteButton.click(() => {
            sendRequest("/admin/deletesavedsongs");
            $('#warning').text('');
        });

        setTimeout(() => {
            deleteButton.off();
            deleteButton.click(clickDelete);
            $('#warning').text("");
        }, 3000);
    }
    deleteButton.click(clickDelete);

    $(document).on("change",'#file-input' ,(event) => {
        let files = event.target.files,
            tableBody = $('#filesTable > tbody');

        console.log(files);
        for (let i = 0; i < files.length; i++) {
            let file = files[i],
                tdFile = $('<td class="td_fileName"></td>').text(file.name),
                tdPlaylist = $('<td class="td_fileName"></td>'),
                tr = $('<tr></tr>'),
                input = $('<input/>');

            input.attr({
                type: "text",
                id: `input_${file.name}`,
                placeholder: "Enter name",
                autocomplete: 'off'
            });
            tdPlaylist.append(input);
            tr.append(tdFile, input)
            tableBody.append(tr);
        }
    });
});

/**
 * Delete the playlist.
 *
 * @param button The pressed button
 */
function markForDelete(button) {
    let name = button.parentNode.parentNode.id.split('_')[1],
        index = playlistsToDelete.indexOf(name);

    if (index >= 0) {
        playlistsToDelete.splice(index, 1);
        button.classList.remove('warning');
    } else {
        playlistsToDelete.push(name)
        button.classList.add('warning');
    }
}

/**
 * Exclude the playlists from voting.
 *
 * @param button The pressed button
 */
function markPlaylistToBlock(button) {
    let name = button.parentNode.parentNode.id.split('_')[1],
        index = playlistsBlocked.indexOf(name);

    if (index >= 0) {
        playlistsBlocked.splice(index, 1);
    } else {
        playlistsBlocked.push(name)
    }

    if (button.classList.contains('failure')) {
        button.classList.remove('failure');
    } else {
        button.classList.add('failure');
    }
}

/**
 * Rename the playlist whose button was pressed.
 *
 * @param button The pressed button
 */
function renamePlaylist(button) {
    let name = button.parentNode.parentNode.id.split('_')[1],
        newName = prompt(`Enter new name for playlist ${name}: (Leave empty to reset)`);

    if (!newName) {
        delete playlistsRenamed[name];
        button.parentNode.parentNode.children[0].innerHTML = `${name}`;
        return
    }

    playlistsRenamed[name] = newName;
    button.parentNode.parentNode.children[0].innerHTML = `${name} → ${newName}`;
}

/**
 * Sends a POST request to the given URL. Additional parameters like Content-Type or data can be passed in an object.
 *
 * @param url The URL to POST to
 * @param additionalParams An object of additional parameters, the request object will be enhanced using Object.assign()
 * @param successCallback An optional callback which will be called on success
 */
function sendRequest (url, additionalParams, successCallback) {
    let ajaxSettings = Object.assign({
        type: "POST",
        headers: {
            'auth': localStorage['passkey']
        },
        url: url,
        success: (data) => {
            showResult(data, true);
            if (successCallback) {
                successCallback();
            }
        },
        error: (err) => {
            console.log("ERROR : ", err);
            showResult(err.responseText, false);
        }
    }, additionalParams);

    $.ajax(ajaxSettings);
}

/**
 * Changes the status text. (Re)sets a timer to 1.5 seconds to hide the status text again.
 *
 * @param text The text to display
 * @param success Whether the operation was successful
 */
function showResult (text, success) {
    let infotext = $('#result');

    infotext.text(text);
    if (success) {
        infotext.addClass('success');
    } else {
        infotext.addClass('failure');
    }
    clearTimeout(resultTimer);
    resultTimer = setTimeout(() => {
        infotext.text('');
        infotext.removeClass('success');
        infotext.removeClass('failure');
    }, 1500);
}