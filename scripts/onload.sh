#!/bin/sh

if [ ! -d "./public/videos" ]; then
  mkdir ./public
  mkdir ./public/videos
fi

if [ ! -f "./yt-dlp/yt-dlp" ]; then
  mkdir ./yt-dlp
  wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -O ./yt-dlp/yt-dlp
  chmod ug+x ./yt-dlp/yt-dlp
fi

rm -rf ./public/videos/*