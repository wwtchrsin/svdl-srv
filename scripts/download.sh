#!/bin/sh

format="bv*[ext=mp4][height<=$2]+ba/bv*[height<=$2]+ba/b[height<=$2]"
outputDir="./public/videos/$3"

mkdir "$outputDir"
./yt-dlp/yt-dlp --no-mtime -f "$format" --paths "$outputDir" "$1"