var express = require('express');
var router = express.Router();
const TwitchLevel = require('../classes/TwitchLevel');

let limiterWrapper = function(req, res, next) {
    globalRatelimiter(req, res, next);
};

router.get('/', function(req, res) {
    let requestedOrPlayedSongs = globalController.getRequestedSongs().concat(globalController.getPlayedSongs());

    res.render('index', {
        isAdmin: false,
        redirectUri: `${process.env.APP_URI}/login`,
        mobile: ('mobile' in req.query),
        playlists: globalController.getSongs(),
        requestedOrPlayedSongs: requestedOrPlayedSongs
    });
});

router.get('/songs', function (req, res) {
    res.send(globalController.getSongs());
});

router.post('/songrequest', limiterWrapper, async function (req, res) {
    const twitchRequirement = globalController.getTwitchRequirement();

    if (twitchRequirement !== 'none') {
        const userId = req.header('uid'),
            user = globalController.getTwitchUser(userId);

        if (!user) {
            return res.status(401).send('You need to be logged in with Twitch to vote!');
        }

        const userLevel = await user.getTwitchLevel(),
            neededLevel = globalController.getTwitchRequirement();

        if (TwitchLevel[userLevel] < TwitchLevel[globalController.getTwitchRequirement()]) {
            return res.status(401).send(`You need to be a Twitch ${neededLevel} to vote!`)
        }
    }

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
