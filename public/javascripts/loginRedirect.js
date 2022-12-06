document.addEventListener('DOMContentLoaded', function () {
    let userId = document.getElementById('user-id').content,
        userName = document.getElementById('user-name').content,
        redirectURI = document.getElementById('redirect-uri').content;

    localStorage['twitchName'] = userName;
    localStorage['uid'] = userId;
    localStorage['sessionStart'] = Date.now();
    window.location.href = redirectURI;
});