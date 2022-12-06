const TwitchUser = require('./TwitchUser');
const axios = require("axios");

class TwitchStreamer extends TwitchUser {
    constructor(access_token, refresh_token) {
        super(access_token, refresh_token);
    }

    /**
     * Check whether the user with the given ID is subscribed to this streamer.
     * @param twitchUserId The user ID to check
     * @returns {Promise<AxiosResponse<any>>} Promise which can be used to read the response
     */
    checkSubscriptionForUser(twitchUserId) {
        return axios.get('https://api.twitch.tv/helix/subscriptions?'
            + `broadcaster_id=${this.twitchUserId}&user_id=${twitchUserId}`, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Client-Id': this.clientId
            }
        });
    }

    /**
     * Since this is the streamer, the channel interaction level doesn't need to be checked.
     */
    loadChannelInteraction() {
        this.isFollowing = true;
        this.isSubscribed = true;
    }
}

module.exports = TwitchStreamer;