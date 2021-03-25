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
        res.status(400).send('Playlist or ID missing');
        return;
    }

    let uniqueId = req.body.uniqueId,
        userName = req.body._userName || 'unknown',
        addedToRequests = globalController.requestSong(uniqueId, userName);

    if (addedToRequests) {
        res.status(200).send('Request added to list');
    } else {
        res.status(400).send('Song already requested');
    }
});

module.exports = router;
