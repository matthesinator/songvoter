const TwitchUser = require('./TwitchUser');
const axios = require("axios");

class TwitchStreamer extends TwitchUser {
    constructor() {
        super();
        this.isFollowing = true;
        this.isSubscribed = true;
    }

    checkSubscriptionForUser(userId) {
        return axios.get('https://api.twitch.tv/helix/subscriptions?'
            + `broadcaster_id=${this.userId}&user_id=${userId}`, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Client-Id': this.clientId
            }
        });
    }
}

module.exports = TwitchStreamer;