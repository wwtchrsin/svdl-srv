#!/bin/bash

format="bv*[ext=mp4][height<=1080]+ba/bv*[height<=1080]+ba/b[height<=1080]"
outputDir="./public/videos/$2"

mkdir $outputDir
./yt-dlp/yt-dlp --no-mtime -f $format --paths $outputDir $1