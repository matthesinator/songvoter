const axios = require('axios');

class TwitchUser {
    constructor(access_token, refresh_token) {
        this.accessToken = access_token;
        this.refreshToken = refresh_token;
        this.userId = undefined;
        this.name = undefined;
        this.validated = false;
        this.disconnected = false;
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
        }).catch(err => {
            console.warn(`user ${this.name} likely disconnected, removing...`);
            clearInterval(this.validateInterval);
            this.disconnected = true;
        });
    }

    loadChannelInteraction() {
        let adminId = globalController.adminId;

        adminId = 599015888;

        this.isFollowingPromise =
            axios.get(`https://api.twitch.tv/helix/users/follows?from_id=${this.userId}&to_id=${adminId}`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Client-Id': this.clientId
                }
            }).then((res) => {
                this.isFollowing = res.data.total === 1;
                console.log(res.data);
            }).catch(err => {
                console.log(err.response.data)
            });

        this.isSubscribedPromise =
            globalController.getStreamer().checkSubscriptionForUser(this.userId).then((res) => {
                this.isFollowing = res.data.total === 1;
                console.log(res.data);
            }).catch(err => {
                console.log(err.response.data)
            });
    }

    getUserId() {
        return this.userId;
    }

    setUserId(userId) {
        this.userId = userId;
    }

    async getTwitchLevel() {
        await Promise.all([this.validationPromise, this.isFollowingPromise, this.isSubscribedPromise]);

        if (this.isSubscribed) {
            return 'Subscriber';
        } else if (this.isFollowing) {
            return 'Follower';
        } else if (this.validated) {
            return 'User';
        } else {
            return 'none';
        }
    }
}

module.exports = TwitchUser;