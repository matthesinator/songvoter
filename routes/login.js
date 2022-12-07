const express = require('express');
const axios = require('axios');
const router = express.Router();
const TwitchUser = require('../classes/TwitchUser'),
    TwitchStreamer = require('../classes/TwitchStreamer');

/**
 * Reads the code given by Twitch and reads access- and refresh-token from Twitch. Creates a new user with the token,
 * logging them in.
 */
router.get('/', async function(req, res) {
    let code = req.query.code,
        tokenData, user;

    try {
        tokenData = await getTokens(code);
    } catch (error) {
        return res.status(500).render('error', {
            message: '500: Internal Server Error',
            error: {
                status: 'Something went wrong while trying to authenticate you with Twitch.',
                stack: error
            }
        });
    }

    user = new TwitchUser(tokenData.access_token, tokenData.refresh_token);
    const userId = globalController.addTwitchUser(user),
        userName = await user.getUserName();

    res.render('loginRedirect', {
        admin: false,
        userId: userId,
        userName: userName
    });
});

/**
 * Reads the code given by Twitch and reads access- and refresh-token from Twitch. Creates a new streamer with the
 * token, logging them in.
 */
router.get('/admin', async function(req, res) {
    let code = req.query.code,
        tokenData, streamer;

    try {
        tokenData = await getTokens(code);
    } catch (error) {
        return res.status(500).render('error', {
            message: '500: Internal Server Error',
            error: {
                status: 'Something went wrong while trying to authenticate you with Twitch.',
                stack: error
            }
        });
    }


    streamer = new TwitchStreamer(tokenData.access_token, tokenData.refresh_token)

    let userId, userName;

    try {
        userId = globalController.setStreamer(streamer);
    } catch (err) {
        return res.status(500).render('error', {
            message: '401: Unauthorized',
            error: {
                status: 'A streamer is already signed in.',
                stack: err
            }
        });
    }

    userName = await streamer.getUserName();

    res.render('loginRedirect', {
        admin: true,
        userId: userId,
        userName: userName
    });
});

/**
 * Uses the code supplied by Twitch to fetch the OAuth tokens for the user.
 * @param code The authorization code supplied by Twitch
 * @returns {Promise<any>} A promise which will resolve with the OAuth tokens
 */
async function getTokens(code) {
    let response;

    try {
        response = await axios.post('https://id.twitch.tv/oauth2/token', {
            code: code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost:3000/login'
        });
    } catch (err) {
        console.error('Network error');
        console.log(err)
        throw new Error(`Twitch error, server returned: ${err.response.data.message}`);
    }

    return response.data;
}

module.exports = router;
