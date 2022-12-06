const axios = require('axios');

class TwitchUser {
    constructor(access_token, refresh_token) {
        this.accessToken = access_token;
        this.refreshToken = refresh_token;
        this.twitchUserId = undefined;
        this.appUserId = undefined;
        this.name = undefined;
        this.validated = false;
        this.isFollowing = undefined;
        this.isSubscribed = undefined;
        this.validationPromise = undefined;
        this.isFollowingPromise = undefined;
        this.isSubscribedPromise = undefined;
        this.validate();
        this.validateInterval = setInterval(() => {
            this.validate();
        }, 1000 * 3600 /* hourly validation necessary */);
    }

    validate(retry = true) {
        this.validationPromise = axios.get('https://id.twitch.tv/oauth2/validate', {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        }).then(res => {
            this.validated = true;
            this.name = res.data.login;
            this.twitchUserId = res.data.user_id;
            this.clientId = res.data.client_id;
            this.loadChannelInteraction();
        }).catch(err => {
            this.validated = false;

            if (err.response.data.message === 'invalid access token' && retry) {
                this.refreshAccessToken().then(() => {
                    this.validate(false);
                });
            }
        });
    }

    refreshAccessToken() {
        return axios.post('https://id.twitch.tv/oauth2/token', {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken
        }).then(res => {
            this.accessToken = res.data.access_token;
            this.refreshToken = res.data.refresh_token;
        }).catch(() => {
            console.warn(`user ${this.name} likely disconnected, removing...`);
            clearInterval(this.validateInterval);
        });
    }

    loadChannelInteraction() {
        const streamer = globalController.getStreamer();

        if (!streamer) {
            return;
        }

        const streamerId = streamer.getTwitchUserId();

        this.isFollowingPromise =
            axios.get(`https://api.twitch.tv/helix/users/follows?from_id=${this.twitchUserId}&to_id=${streamerId}`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Client-Id': this.clientId
                }
            }).then((res) => {
                this.isFollowing = res.data.total === 1;
                console.log(res.data);
            }).catch(err => {
                console.log(`Couldn't load following state: ${err.response.data.message}`);
            });

        this.isSubscribedPromise =
            streamer.checkSubscriptionForUser(this.twitchUserId).then((res) => {
                this.isSubscribed = res.data.data.length >= 1;
                console.log(res.data);
            }).catch(err => {
                console.log(`Couldn't load subscribed state: ${err.response.data.message}`);
            });
    }

    getUserId() {
        return this.appUserId;
    }

    setUserId(userId) {
        this.appUserId = userId;
    }

    getTwitchUserId() {
        return this.twitchUserId;
    }

    async getUserName() {
        await this.validationPromise;
        return this.name;
    }

    async getTwitchLevel() {
        await Promise.all([this.validationPromise, this.isFollowingPromise, this.isSubscribedPromise]);

        if (this.isSubscribed) {
            return 'subscriber';
        } else if (this.isFollowing) {
            return 'follower';
        } else if (this.validated) {
            return 'user';
        } else {
            return 'none';
        }
    }

    async afterPromisesLoaded(callback) {
        await Promise.all([this.validationPromise, this.isFollowingPromise, this.isSubscribedPromise]);
        return callback();
    }
}

module.exports = TwitchUser;