# Simple Video Downloader Server
The server side of a web app that provides a user interface for
the yt-dlp utility. The server was built using Express.js.

## Requirements
Due to its reliance on shell scripts the server can only
be run on POSIX-compatible systems (like Linux or BSD). 
Make sure you have `Node.js` installed on your machine. 
The server has been tested on Node.js v20 and Node.js v24.

## Installation
```bash
npm install
```

## Launch
```bash
node ./bin/www
```
By default the server will be listening on port 3000.
You can override the port value by setting the `PORT` environment variable.
```bash
PORT=1234 node ./bin/www
```
Note that the port the server listens on and 
the port the client sends requests to must match.
Once the server is started it will automatically check for
yt-dlp updates every 3 hours.

## API endpoints

### Download video
**URL**
```
POST /url
```
**Body**
```javascript
{
    "url": string, //video url
    "quality": "high" | "medium" | "low", //video resolution
                    //high - 1080p
                    //medium - 720p
                    //low - 480p
    "label": string, //label for the video so
                    //it can be found later on
}
```
**Success** (status: 200)
```javascript
{ 
    uid: string, //video identifier
}
```
**Error** (status: 400)
```
{ 
    uid: undefined
}
```

### Get download status
**URL**
```
GET /video/{uid}
```
**Parameters**
```
{uid}: string //video identifier
```
**Success** (status: 200)
```javascript
{
    url: string, //downloaded file url relative to the public directory
                 //undefined if the file is still being downloaded
    error: boolean, //yt-dlp related error
    message: string, //last message from yt-dlp to stdout
}
```
**Error** (status: 404)
```javascript
{
    url: undefined
    error: true,
    message: undefined,
}
```

### Find videos by label
**URL**
```
GET /sets/{label}
```
**Parameters**
```
{label}: string
```
**Success** (status: 200)
```javascript
{
    src: string, //source video url
    quality: "high" | "medium" | "low", //video resolution
    url: //downloaded file url relative to the public directory
         //undefined if the file is still being downloaded
    error: //yt-dlp related error
    message: //last message from yt-dlp to stdout
}[]
```

## Output
The video files downloaded will be located in the `./public/videos/` directory
relative to the server root. The files will automatically be deleted 3 hours after
they were downloaded.


