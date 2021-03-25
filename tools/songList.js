/**
 * Creates a song list object. This list holds key-value pairs of songs and their unique id, and an
 * array to remember the order of the songs.
 */
function SongList() {
    this.uniqueIds = [];
    this.uniqueId2Song = {};
}

/**
 * Adds a song to the queue. Songs will always be inserted at the first position.
 *
 * @param uniqueId The unique identifier of the song
 * @param song The song object
 */
SongList.prototype.push = function (uniqueId, song) {
    this.uniqueIds.unshift(uniqueId);
    this.uniqueId2Song[uniqueId] = song;
};

/**
 * Return the song for the given id
 * @param uniqueId The unique identifier of the song
 * @returns {*} The song object
 */
SongList.prototype.getSong = function (uniqueId) {
    return this.uniqueId2Song[uniqueId];
};

/**
 * Removes the given song from the list.
 *
 * @param uniqueId The id of the song
 */
SongList.prototype.remove = function (uniqueId) {
    this.uniqueIds.splice(this.uniqueIds.indexOf(uniqueId), 1);
    delete this.uniqueId2Song[uniqueId];
};

/**
 * Checks if the given song is in the list.
 *
 * @param uniqueId The id of the song
 * @returns {boolean} Whether the song is in the list
 */
SongList.prototype.has = function (uniqueId) {
    return !!this.uniqueId2Song[uniqueId];
};

/**
 * Get the list in sorted order.
 *
 * @returns {Object[]} An array with the songs in the order they have been added.
 */
SongList.prototype.getList = function () {
    return this.uniqueIds.map((id) => {
        return this.uniqueId2Song[id];
    });
};

module.exports = SongList;