let SongList = require('./songList');
let path = require('path');
let fileManager = require('./filemanager'),
    rateLimit = require('express-rate-limit');

/**
 * Manages requests and played songs, and notifies connected users of changes of both.
 *
 * @constructor
 */
function Controller() {
    this.ratelimit = 5;
    this.takeRequests = true;
    this.requestedSongs = new SongList();
    this.playedSongs = new SongList();
    this.songs = {};
    this.viewers = [];
    this.filePath = path.join(__dirname, '..', 'data', 'songs.json');
    this.readSavedSongs();
}

/**
 * Add a new playlist. If a playlist with that name exists, it will be overwritten.
 *
 * @param name The desired name
 * @param playlist The playlist object
 */
Controller.prototype.addPlaylist = function (name, playlist) {
    this.songs[name] = playlist;
    this.sendMessageToViewers('reload')
};

/**
 * Sends the given message to all connected users. Cleans up disconnected users before sending the message.
 *
 * @param message The message to send
 */
Controller.prototype.sendMessageToViewers = function (message) {
    if (typeof(message) !== 'string') {
        message = JSON.stringify(message);
    }
    this.cleanUpViewers();
    this.viewers.forEach(function (connection) {
        connection.send(message);
    });
};

/**
 * Find a song object from its unique identifier.
 *
 * @param uniqueId The unique identifier of the song
 * @returns The song object
 */
Controller.prototype.findSong = function (uniqueId) {
    let parts = uniqueId.split('.')

    return this.songs[parts[0]].songs.find((song) => {
        return song.id === parts[1];
    });
};

Controller.prototype.changeRatelimit = function (timeframe) {
    this.ratelimit = timeframe;
    globalRatelimiter = rateLimit({
        windowMs: timeframe * 60 * 1000,
        max: 1,
        message: `Only one request per ${timeframe} minute(s) possible.`
    });
};

/**
 * Request a song by its unique identifier. Checks if the song has already been requested or played. Notifies users of
 * the request and pushes the song into the queue.
 *
 * @param uniqueId The songs unique identifier
 * @param userName The name of the user requesting the song
 * @returns {boolean} Whether the request has been added
 */
Controller.prototype.requestSong = function (uniqueId, userName) {
    if (this.requestedSongs.has(uniqueId) || this.playedSongs.has(uniqueId)) {
        throw new Error('Song already requested');
    }

    if (!this.takeRequests) {
        throw new Error('Requests are blocked at the moment');
    }

    if (this.songs[uniqueId.split('.')[0]]._disabled) {
        throw new Error('This playlist is blocked right now.');
    }

    let song = this.findSong(uniqueId);
    song.requested = true;
    song.requestedBy = userName
    song.requestCounter++;
    this.requestedSongs.push(uniqueId, song);
    this.sendMessageToViewers({
        request: song,
        uniqueId: uniqueId
    });
};

/**
 * Set whether new requests should be taken or rejected.
 */
Controller.prototype.toggleRequests = function () {
    this.takeRequests = !this.takeRequests;
};

/**
 * Marks the given song as played, removes it from the queue and notifies the connected users.
 *
 * @param uniqueId The unique identifier of the song
 */
Controller.prototype.markSongPlayed = function (uniqueId, playedAt) {
    let song = this.requestedSongs.getSong(uniqueId);
    if (!song) {
        return;
    }

    this.requestedSongs.remove(uniqueId);

    song.played = true;
    song.playedAt = playedAt;
    this.playedSongs.addFirst(uniqueId, song);
    this.sendMessageToViewers({
        playedSong: song,
        uniqueId: uniqueId
    });
};

/**
 * Adds a user which will be notified of requests and played song.
 *
 * @param connection The websocket connection to the user
 */
Controller.prototype.addViewer = function (connection) {
    this.viewers.push(connection);
};

/**
 * Removes all disconnected users.
 */
Controller.prototype.cleanUpViewers = function () {
    this.viewers = this.viewers.filter(function (connection) {
        return connection.readyState === 1;
    });
};

/**
 * Returns the request queue.
 *
 * @returns {Object[]} The requested songs in the order they've been requested
 */
Controller.prototype.getRequestedSongs = function () {
    return this.requestedSongs.getList();
};

/**
 * Returns the played songs.
 *
 * @returns {Object[]} The played songs in the order they've been played
 */
Controller.prototype.getPlayedSongs = function () {
    return this.playedSongs.getList();
};

/**
 * Returns the whole library of songs.
 *
 * @returns {*|{}} All songs
 */
Controller.prototype.getSongs = function () {
    return this.songs;
}

/**
 * Writes the current songs to a file and resets their requested, requestedBy, played and playedAt properties.
 *
 * @return boolean Whether the write was successful
 */
Controller.prototype.saveCurrentSongs = function () {
    for (let playlist in this.songs) {
        this.songs[playlist].songs.forEach((song) => {
            song.requested = false;
            song.requestedBy = false;
            song.played = false;
            song.playedAt = undefined;
        });
    }

    try {
        fileManager.exportJSONFile(this.filePath, this.songs);
    } catch (err) {
        console.log("Couldn't write file: ");
        console.log(err);
        return false;
    }
    return true;
};

/**
 * Reads previously stored songs from a file on the disk.
 *
 * @return boolean Whether the read was successful
 */
Controller.prototype.readSavedSongs = function () {
    let songs;

    try {
        songs = fileManager.importJSONFile(this.filePath);
    } catch (err) {
        console.log("No saved songs available.");
        return false;
    }

    this.songs = songs;
    return true;
};

/**
 * Deletes the locally stored songs.
 *
 * @return {boolean} Whether the deletion was successful
 */
Controller.prototype.deleteSavedSongs = function () {
    fileManager.deleteFile(this.filePath);
}

/**
 * Deletes the given playlist(s).
 *
 * @param playlists The playlist names to delete
 */
Controller.prototype.deletePlaylists = function (playlists) {
    playlists = Array.isArray(playlists) ? playlists : [playlists];

    playlists.forEach((playlist) => {
        delete this.songs[playlist];
    });

    this.resetRequestsPlayedData();
};

/**
 * Disables voting for the given playlist(s).
 *
 * @param playlist The playlists names
 */
Controller.prototype.blockPlaylists = function (playlist) {
    if (!Array.isArray(playlist)) {
        playlist = [playlist];
    }

    playlist.forEach((name) => {
        this.songs[name]._disabled = !this.songs[name]._disabled;
    });

    this.sendMessageToViewers('reload');
};

/**
 * Renames the given playlist(s).
 *
 * @param playlist The playlists and their new names
 */
Controller.prototype.renamePlaylists = function (oldName2newName) {
    for (let oldName in oldName2newName) {
        let newName = oldName2newName[oldName];

        this.songs[newName] = this.songs[oldName];
        this.songs[newName]._name = newName;
        this.songs[newName].songs.forEach((song) => {
            song.uniqueId = `${newName}.${song.id}`;
        });
        delete this.songs[oldName];
    }

    this.resetRequestsPlayedData();
};

/**
 * Resets the status of all played and requested songs and sends a reload message to all connected users.
 */
Controller.prototype.resetRequestsPlayedData = function () {
    this.requestedSongs.getList().forEach((song) => {
        song.requested = false;
        song.requestedBy = undefined;
    });

    this.playedSongs.getList().forEach((song) => {
        song.requested = false;
        song.requestedBy = undefined;
        song.played = false;
        song.playedAt = undefined;
    });

    this.requestedSongs = new SongList();
    this.playedSongs = new SongList();
    this.sendMessageToViewers('reload');
};

let controller = new Controller();

module.exports = controller;