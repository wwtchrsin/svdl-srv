const express = require("express")
const { urlencoded, json } = require("body-parser")
const { exec, spawn } = require("node:child_process")
const { randomUUID } = require("node:crypto")
const fs = require("node:fs")
const cors = require("cors")

const app = express()
const videos = []

app.use(cors())
app.use(express.static(__dirname + "/public"))
app.use(urlencoded({ extended: false }))
app.use(json())

app.post("/url", (req, res) => {
  let { url, quality } = req.body
  if ( !url || !url.trim ) {
    res.status(400)
    res.json({ uid: undefined })
    console.log("request to /url: error -- url not set")
    return
  }
  if ( !quality || !quality.trim ) {
    res.status(400)
    res.json({ uid: undefined })
    console.log("request to /url -- quality not set")
    return
  }
  quality = quality.trim()
  if ( !["high", "medium", "low"].includes(quality) ) {
    res.status(400)
    res.json({ uid: undefined })
    console.log("request to /url -- wrong quality parameter")
    return
  }
  url = url.trim()
  for ( let i=0; i < videos.length; i++ ) {
    if ( videos[i].src === url && videos[i].quality === quality ) {
      res.status(200)
      res.json({ uid: videos[i].uid })
      console.log(`request to /url from ${req.ip} -- known url`)
      return
    }
  }
  console.log(`request to /url from ${req.ip} -- new url`)
  const uid = randomUUID()
  const video = {
    log: [],
    uid: uid,
    error: false,
    src: url,
    quality: quality,
    url: undefined,
    timestamp: Math.floor((new Date()).valueOf() / 1000),
  }
  try {
    const maxHeight = ({ high: 1080, medium: 720, low: 480 })[quality]
    const command = spawn("./scripts/download.sh", [url, maxHeight, uid])
    command.stdout.on("data", (output) => {
      video.log.push(output.toString())
    })
    command.stderr.on("data", (output) => {
      console.error(`loading ${quality}-quality file from ${url}: command reports error`)
      console.error(output.toString())
    })
    command.on("error", (err) => {
      video.error = true
      console.error(`loading ${quality}-quality file from ${url}: command failed`)
      video.log.forEach(entry => console.error(entry))
      console.error(err.toString())
    })
    command.on("close", () => {
      const entries = fs.readdirSync(`./public/videos/${uid}`, { withFileTypes: true })
      const files = entries.filter(entry => entry.isFile())
      if ( files.length !== 1 ) {
        video.error = true
        console.error("file loaded: error -- wrong number of files in dir")
        video.log.forEach(entry => console.error(entry))
        return
      }
      video.url = `videos/${uid}/${files[0].name}`
      console.log(`${quality}-quality file loaded from ${url} as "${files[0].name}"`)
    })
    videos.push(video)
    res.status(200)
    res.json({ uid })
    console.log(`loading ${quality}-quality file from ${url}`)
  } catch (err) {
    res.status(500)
    res.json({ uid: undefined })
    console.error("request to /url: error")
    console.error(err.toString())
  }
})

app.get("/video/:uid", (req, res) => {
  const { uid } = req.params
  if ( !uid ) {
    res.status(400)
    res.json({
      message: undefined,
      url: undefined,
      error: true,
    })
    return
  }
  for ( let i=0; i < videos.length; i++ ) {
    if ( videos[i].uid === uid ) {
      res.status(200)
      res.json({
        url: videos[i].url,
        error: videos[i].error,
        message: videos[i].log.at(-1),
      })
      return
    }
  }
  res.status(404)
  res.json({
    url: undefined,
    error: true,
    message: undefined,
  })
  console.log("request to /video/uid: error")
  console.log(`video with uid ${uid} not found`)
})

setInterval(() => {
  const timestamp = Math.floor((new Date()).valueOf() / 1000)
  const HR3 = 3 * 3600
  for ( let i=0; i < videos.length; i++ ) {
    let video = videos[i]
    if ( timestamp - video.timestamp > HR3 ) {
      fs.rm(`./public/videos/${video.uid}`, {
        recursive: true,
        force: true,
      }, (err) => {
        if ( err ) {
          console.error(`deleting folder public/videos/${video.uid}: error`)
          console.error(err.toString())
          return
        }
        console.log(`deleting folder public/videos/${video.uid}: done`)
      })
      videos.splice(i--, 1)
    }
  }
  exec("./scripts/update.sh", (err, output) => {
    if ( err ) {
      console.error("script update.sh: error -- impossible to execute command")
      console.error(err.toString())
      return
    }
    console.log("script update.sh: done")
    output.length && console.log(output.toString())
  })
  console.log("task clean & update started")
}, 3600000)

module.exports = app