import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

var key = process.env.LFM_TOKEN
var user = process.env.LFM_USER

if (!key) throw new Error('Missing `LFM_TOKEN`')
if (!user) throw new Error('Missing `LFM_USER`')

var outpath = path.join('data', 'albums.json')

fetch(
  'http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=' +
    user +
    '&api_key=' +
    key +
    '&format=json&period=1month&limit=60'
)
  .then((response) => response.json())
  .then(function (body) {
    var albums = body.topalbums.album.flatMap(function (d) {
      var image = d.image
        .map((d) => d['#text'])
        .filter(Boolean)
        .pop()
      return image
        ? {
            name: d.name,
            artist: d.artist.name,
            image,
            count: Number.parseInt(d.playcount, 10)
          }
        : []
    })

    return fs.promises
      .mkdir(path.dirname(outpath), {recursive: true})
      .then(() =>
        fs.promises.writeFile(outpath, JSON.stringify(albums, null, 2) + '\n')
      )
  })
  .catch(() => {
    throw new Error('Could not get albums')
  })
