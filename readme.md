<!-- lint disable lint-first-heading-level -->

# [`wooorm.com`][site]

[![][screenshot]][site]

## Build

To build the site, create a `.env` file with the following tokens, from GitHub,
OpenCollective, Last.fm, Trakt.tv, and The Movie DB.

```ini
GH_TOKEN=123123123
OC_TOKEN=123123123
LFM_TOKEN=123123123
LFM_USER=username
TTV_TOKEN=123123123
TTV_USER=username
TMDB_TOKEN=123123123
SPOT_R_TOKEN=123123123
SPOT_C_ID=123123123
SPOT_C_SECRET=123123123
```

Do `npm i` and then `npm t`, which checks and builds the site.

For Spotify, create an app, configure a callback URL as `http://localhost/callback`, note the client ID and secret, then go to (in a browser):

```
https://accounts.spotify.com/authorize?client_id=$CLIENT_ID&response_type=code&redirect_uri=http://localhost/callback&scope=user-top-read
```

Accept, grab the code from the URL, and do the following in a terminal:

```
curl --verbose \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=http://localhost/callback" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "code=$CODE" \
  https://accounts.spotify.com/api/token
```

Grab the `refresh_token` from the result.
Place it, the client id, and the client secret in `.env`.

[site]: https://wooorm.com

[screenshot]: screenshot.png
