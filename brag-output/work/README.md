# Paisa launch film — source

Everything in `../brag.mp4` is generated from this folder.

- `site/` — the film as a web page. `app.js` builds every scene and `renderAt(t)` is a pure function of time; `cues.js` holds the timings shared with the music.
- `audio/music.py` — the original soundtrack (120 BPM, D minor → F major), synthesized with NumPy/SciPy and mixed to -14 LUFS.
- `render.mjs` — renders 1440 frames (24 s at 60 fps) in headless Chromium at 2× resolution, with motion blur from sub-frame sampling where things move fast.
- `finish.sh` — colour grade, poster frame baked in as frame 0, soundtrack mux, H.264 export.

Re-render:

```bash
npm install
pip install numpy scipy pyloudnorm
python3 audio/music.py
node render.mjs --workers 3        # → render/master.mp4
./finish.sh                        # → ../brag.mp4, ../brag.jpg
node stills.mjs 5.5 13.8 22.5      # quick stills of any moment → stills/
```

Chromium path in `render.mjs`/`stills.mjs` points at the Playwright build in `/opt/pw-browsers`; change `CHROME` if yours lives elsewhere.
