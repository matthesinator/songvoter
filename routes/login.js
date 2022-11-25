const express = require('express');
const axios = require('axios');
const router = express.Router();
const TwitchUser = require('../classes/TwitchUser'),
    TwitchStreamer = require('../classes/TwitchStreamer');
const stream = require("stream");

/**
 * TODO: Comment, Fehlerfall
 */
router.get('/', async function(req, res) {
    let code = req.query.code,
        tokenData, user;

    try {
        tokenData = await getTokens(code);
    } catch (error) {
        return res.redirect('/'); //TODO: Inform user of error
    }

    user = new TwitchUser(tokenData.access_token, tokenData.refresh_token);
    const userId = globalController.addTwitchUser(user);

    res.header('uid', userId);
    res.redirect(303, '/');
});

/**
 * TODO: Comment & Admin functionality
 */
router.get('/admin', async function(req, res) {
    let code = req.params.code,
        tokenData, streamer;

    try {
        tokenData = await getTokens(code);
    } catch (error) {
        return res.redirect('/admin'); //TODO: Inform user of error
    }

    streamer = new TwitchStreamer(tokenData.access_token, tokenData.refresh_token)
    const userId = globalController.setStreamer(streamer);

    res.header('uid', userId);
    res.redirect('/admin');
});

async function getTokens(code) {
    let response;

    try {
        response = await axios.post('https://id.twitch.tv/oauth2/token', {
            code: code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost:3000/login/finalize'
        });
    } catch (err) {
        console.error('Network error');
        console.log(err)
        throw new Error(`Twitch error, server returned: ${err.response.data.message}`);
    }

    return response.data;
}

module.exports = router;
