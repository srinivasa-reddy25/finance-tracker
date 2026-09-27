#!/usr/bin/env bash
# Pull frames from a video at given times into review/ and build a contact sheet.
set -e
cd "$(dirname "$0")"
V=$1; shift
rm -rf review && mkdir -p review
for t in "$@"; do ffmpeg -y -loglevel error -ss "$t" -i "$V" -frames:v 1 "review/f$(printf '%05.2f' "$t").png"; done
python3 sheet.py review/sheet.png 'review/f*.png'
