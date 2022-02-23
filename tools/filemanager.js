let reader = require ("line-reader");
let fs = require('fs');

/**
 * Reads a .csv file in the format <number>,<song name> and adds it as a playlist to the controller. If a playlist with
 * the given name exists, it will be overwritten.
 *
 * @param filepath The path to the file
 * @param name The desired name of the playlist
 */
exports.importPlaylistFromCSV = function (filepath, name) {
    let playlist = {
        _disabled: false,
        _filepath: filepath,
        _name: name,
        _columns: {},
        songs: []
    };

    reader.eachLine(filepath, function (line) {
        if (!/^\d/.test(line)) {
            line.split("\t").forEach((part, i) => {
                if (part === "#") {
                    part = "id";
                }
                playlist._columns[i] = part.toLowerCase().replace(" ", "-");
            });
            return true;
        }

        let parts = line.split("\t"),
            song = {
                requested: false,
                requestedBy: undefined,
                requestCounter: 0,
                played: false,
                playedAt: undefined,
                uniqueId: `${name}.${parts[0]}`
            };

        for (let index in playlist._columns) {
            song[playlist._columns[index]] = parts[index];
        }

        playlist.songs.push(song);
    });

    globalController.addPlaylist(name, playlist);
};

exports.importPlaylistFromString = function (string, name) {
    let separator = string.includes('\r\n') ? '\r\n' : '\n',
        lines = string.split(separator),
        playlist = {
            _disabled: false,
            _name: name,
            _columns: {},
            songs: []
        };

    lines.forEach((line) => {
        if (!/^\d/.test(line)) {
            line.split("\t").forEach((part, i) => {
                if (part === "#") {
                    part = "id";
                }
                playlist._columns[i] = part.toLowerCase().replace(" ", "-");
            });
            return;
        }

        let parts = line.split("\t"),
            song = {
                requested: false,
                requestedBy: undefined,
                requestCounter: 0,
                played: false,
                playedAt: undefined,
                uniqueId: `${name}.${parts[0]}`,
                _columns: playlist._columns
            };

        for (let index in playlist._columns) {
            song[playlist._columns[index]] = parts[index];
        }

        playlist.songs.push(song);
    });

    globalController.addPlaylist(name, playlist);
}

exports.importJSONFile = function (filepath) {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
};

exports.exportJSONFile = function (filepath, json) {
    let data = JSON.stringify(json, null, 2),
        dirname = filepath.substring(0, filepath.lastIndexOf('/'));

    try {
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname);
        }
        fs.writeFile(filepath, data, "utf8", (err) => {
            console.log("Songs couldn't be saved 2");
            console.log(err)
        });
    } catch (err) {
        console.log("Songs couldn't be saved 1");
        console.log(err)
        return false;
    }
    return true;
};

exports.deleteFile = function (filepath) {
    try {
        fs.unlinkSync(filepath);
    } catch (err) {
        console.log("Couldn't delete file");
        if (err.code === 'ENOENT') {
            throw new Error("No such file.");
        }
    }
};