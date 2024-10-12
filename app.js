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
  let { url } = req.body
  if ( !url || !url.trim ) {
    res.status(400)
    res.json({ uid: undefined })
    return
  }
  url = url.trim()
  for ( let i=0; i < videos.length; i++ ) {
    if ( videos[i].src === url ) {
      res.status(200)
      res.json({ uid: videos[i].uid })
      return
    }
  }
  const uid = randomUUID()
  const video = {
    message: "",
    uid: uid,
    error: false,
    src: url,
    url: undefined,
    timestamp: Math.floor((new Date()).valueOf() / 1000),
  }
  try {
    const command = spawn("./scripts/download.sh", [url, uid])
    command.stdout.on("data", output => {
      video.message = output.toString()
    })
    command.on("error", () => {
      video.error = true
      video.message = ""
    })
    command.on("close", () => {
      const entries = fs.readdirSync(`./public/videos/${uid}`, { withFileTypes: true })
      const files = entries.filter(entry => entry.isFile())
      if ( files.length !== 1 ) {
        video.error = true
        return
      }
      video.url = `videos/${uid}/${files[0].name}`
    })
    videos.push(video)
    res.status(200)
    res.json({ uid })
  } catch (err) {
    res.status(500)
    res.json({ uid: undefined })
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
        message: videos[i].message,
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
})

setInterval(() => {
  const timestamp = Math.floor((new Date()).valueOf() / 1000)
  const HR3 = 3 * 3600
  for ( let i=0; i < videos.length; i++ ) {
    if ( timestamp - videos[i].timestamp > HR3 ) {
      fs.rm(`./public/videos/${videos[i].uid}`, {
        recursive: true,
        force: true,
      }, () => {})
      videos.splice(i--, 1)
    }
  }
  exec("./scripts/update.sh", () => {})
}, 3600000)

module.exports = app