#!/bin/bash

if [ "$DEV_MODE" != "1" ]; then
  ./yt-dlp/yt-dlp -U
fi