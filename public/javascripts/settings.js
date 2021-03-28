let resultTimer, playlistsMarked = [];

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
        });
    });

    $('#writeBtn').click(() => {
        sendRequest("/admin/savecurrentsongs");
    });

    $('#deletePlaylistBtn').click(() => {
        sendRequest("/admin/deleteplaylists", {
            data: {
                playlists: JSON.stringify(playlistsMarked.map((playlist) => {
                    return playlist.id.split('_')[1]
                }))
            },
            enctype: 'application/json'
        }, () => {
            playlistsMarked.forEach((tr) => {
                tr.remove()
            });
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

function markForDelete(tableRow) {
    let index = playlistsMarked.indexOf(tableRow)
    if (index >= 0) {
        playlistsMarked.splice(index, 1);
        tableRow.classList.remove('selected');
    } else {
        playlistsMarked.push(tableRow)
        tableRow.classList.add('selected');
    }
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