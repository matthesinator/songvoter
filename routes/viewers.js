var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
    let requestedOrPlayedSongs = globalController.getRequestedSongs().concat(globalController.getPlayedSongs());

    res.render('index', {
        playlists: globalController.getSongs(),
        requestedOrPlayedSongs: requestedOrPlayedSongs
    });
});

router.get('/songs', function (req, res) {
    res.send(globalController.getSongs());
});

router.post('/songrequest', function (req, res) {
    if (!req.body.uniqueId) {
        return res.status(400).send('Playlist or ID missing');
    }

    let uniqueId = req.body.uniqueId,
        userName = req.body._userName || 'unknown';

    try {
        globalController.requestSong(uniqueId, userName);
    } catch (error) {
        return res.status(400).send(error.message);
    }
    res.status(200).send('Request added to list');
});

module.exports = router;
