/* global requestSongs */
document.addEventListener('DOMContentLoaded', function () {
    requestSongs();
});

let requestSent = false,
    callbacks = [];

/**
 * Request all songs from the server.
 *
 * @param callback Function to call when the request finished.
 * @param forceUpdate Whether currently stored songs shall be overwritten
 */
window.requestSongs = function requestSongs(callback, forceUpdate=false) {
    let xhr = new XMLHttpRequest();
    if (!requestSent || forceUpdate) {
        xhr.open('GET', '/songs');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                window.songs = JSON.parse(xhr.responseText);
                if (callback) {
                    callback();
                }
                callbacks.forEach((cb) => {
                    cb();
                });
            }
        };
        xhr.send();
    } else if (window.songs) {
        callback();
    } else {
        callbacks.push(callback);
    }

    requestSent = true;
}