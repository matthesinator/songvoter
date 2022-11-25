var express = require('express');
var router = express.Router();
var filereader = require('../tools/filemanager');
const TwitchLevel = require('../classes/TwitchLevel');
let multer = require('multer'),
    storage = multer.memoryStorage(),
    upload = multer({ storage: storage });

/**
 * Get the admin page. Sends <code>isAdmin: true</code> so that admin controls are rendered.
 */
router.get('/', function(req, res) {
    let requestedOrPlayedSongs = globalController.getRequestedSongs().concat(globalController.getPlayedSongs());

    res.render('admin', {
        isAdmin: true,
        loggedIn: true, //TODO: Get from Controller, as String so Name can be shown
        mobile: ('mobile' in req.query),
        playlists: globalController.getSongs(),
        requestedOrPlayedSongs: requestedOrPlayedSongs
    });
});

/**
 * Get the settings.
 */
router.get('/settings', function (req, res) {
    res.render('settings', {
        mobile: ('mobile' in req.query),
        loggedIn: false, //TODO: Get from Controller
        playlists: globalController.getSongs(),
        ratelimit: globalController.ratelimit
    });
});

/**
 * Post and process new settings. The settings object may be partial, then only affected settings will be changed.
 */
router.post('/settings', function (req, res) {
    if (!checkAuthorization(req, res)) {
        return;
    }
});


router.post('/uploadcsvplaylist', upload.array('playlists', 10), function (req, res) {
    if (!checkAuthorization(req, res)) {
        return;
    }

    if (!req.body.names) {
        res.status(400).send('No names specified');
        return;
    }
    let files = req.files,
        names = req.body.names.split(',');

    files.forEach((file, i) => {
        filereader.importPlaylistFromString(file.buffer.toString(), names[i]);
    });

    res.send('file(s) added');
});

router.post('/changeplaylists', function (req, res) {
    if (!checkAuthorization(req, res)) {
        return;
    }
    if (!req.body.deletable && !req.body.blockable && !req.body.renameable) {
        return res.status(400).send('No operations requested.');
    }

    if (req.body.deletable) {
        globalController.deletePlaylists(JSON.parse(req.body.deletable));
    }
    if (req.body.blockable) {
        globalController.blockPlaylists(JSON.parse(req.body.blockable));
    }
    if (req.body.renameable) {
        globalController.renamePlaylists(JSON.parse(req.body.renameable));
    }

    res.send('Operations applied.');
});

router.post('/setratelimit', function (req, res) {
    if (!checkAuthorization(req, res)) {
        return;
    }

    if (!req.body.timeframe) {
        return res.status(400).send('No timeframe supplied.');
    }

    globalController.changeRatelimit(req.body.timeframe);
    res.send('Timeframe set');
});

router.post('/setTwitchRequirement', function (req, res) {
    if (!checkAuthorization(req, res)) {
        return;
    }

    if (!req.body.TwitchRequirement) {
        return res.status(400).send('No Twitch requirement supplied.');
    }

    const newRequirement = req.body.TwitchRequirement;

    if (!(newRequirement in TwitchLevel)) {
        return res.status(400).send('Unknown Twitch requirement.');
    }

    globalController.setTwitchRequirement(newRequirement);
    res.send('Twitch requirement set');
});

router.post('/blockplaylist', (req, res) => {
    if (!checkAuthorization(req, res)) {
        return;
    }
    if (!req.body.playlist) {
        return res.status(400).send('No playlist added.');
    }
    globalController.blockPlaylists(req.body.playlist);
    res.send('Playlist (un)blocked.')
});

router.post('/savecurrentsongs', function (req, res) {
    if (!checkAuthorization(req, res)) {
        return;
    }

    if (globalController.saveCurrentSongs()) {
        res.send('songs saved');
    } else {
        res.status(400).send('couldn\'t save songs');
    }
});

router.post('/readsavedsongs', function (req, res) {
    if (!checkAuthorization(req, res)) {
        return;
    }

    if (globalController.readSavedSongs()) {
        res.send('songs read');
    } else {
        res.status(400).send('Couldn\'t read songs');
    }
});

router.post('/deletesavedsongs', function (req, res) {
    if (!checkAuthorization(req, res)) {
        return;
    }

    try {
        globalController.deleteSavedSongs()
        res.send('songs deleted');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

/**
 * Checks if the request comes from a whitelisted IP. If not, it sends an appropriate response.
 *
 * @param req The request
 * @param res The response
 * @return {boolean} Whether the request is authorized
 */
function checkAuthorization(req, res) {
    const userId = req.header('uid');

    if (!userId === globalController.getStreamer().getUserId()) {
        if (req.method === 'GET') {
            res.status(401).render('error', {
                message: '401: Unauthorized',
                error: {
                    status: 'Stop right there, criminal scum.',
                    stack: 'Pay the court a fine or serve your sentence!'
                }
            });
        } else {
            res.status(401).send('Only the streamer is allowed to change these settings.');
        }
        return false;
    }

    return true;
}

module.exports = router;
