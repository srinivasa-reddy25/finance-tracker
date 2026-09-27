"""Original soundtrack for the Paisa launch film.

120 BPM. Hook in D minor, resolves to F major on the brand reveal.
Every effect is pitched to the chord underneath it and shares the music's reverb.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
from scipy import signal
from scipy.io import wavfile

HERE = Path(__file__).resolve().parent
SR = 48000
rng = np.random.default_rng(7)

CUES = json.loads(re.search(r"=\s*(\{.*\})\s*;", (HERE.parent / "site" / "cues.js").read_text(), re.S).group(1))
DUR = CUES["duration"]
N = int(SR * (DUR + 0.0))
BEAT = 60.0 / CUES["bpm"]
BAR = 4 * BEAT


# ---------------------------------------------------------------- utilities
def mtof(m):
    return 440.0 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def stereo():
    return np.zeros((N, 2))


def place(buf, x, t, gain=1.0, pan=0.0):
    """Add mono or stereo x into stereo buf at time t (constant-power pan)."""
    i = int(round(t * SR))
    if i >= len(buf):
        return
    if x.ndim == 1:
        a = (pan + 1) * np.pi / 4
        x = np.stack([x * np.cos(a), x * np.sin(a)], axis=1) * np.sqrt(2)
    j0 = max(i, 0)
    k0 = j0 - i
    n = min(len(x) - k0, len(buf) - j0)
    if n > 0:
        buf[j0:j0 + n] += x[k0:k0 + n] * gain


def sos(kind, fc, order=2):
    return signal.butter(order, fc, kind, fs=SR, output="sos")


def filt(x, kind, fc, order=2):
    return signal.sosfilt(sos(kind, fc, order), x, axis=0)


def tv_filter(x, fc_fn, kind="lowpass", order=2, block=256):
    """Time-varying Butterworth filter, coefficients updated per block."""
    x = np.atleast_2d(x.T).T if x.ndim == 1 else x
    out = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        t = (s + block / 2) / SR
        fc = float(np.clip(fc_fn(t), 20, SR / 2 * 0.95))
        so = sos(kind, fc, order)
        if zi is None:
            zi = np.zeros((so.shape[0], 2, x.shape[1]))
        out[s:s + block], zi = signal.sosfilt(so, x[s:s + block], axis=0, zi=zi)
    return out


def polyblep_saw(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    tt = ph[m] / dt[m]
    y[m] -= tt + tt - tt * tt - 1
    m = ph > 1 - dt
    tt = (ph[m] - 1) / dt[m]
    y[m] -= tt * tt + tt + tt + 1
    return y


def env_ar(n, a, r_start, r):
    """Linear-ish attack, hold, exponential-ish release starting at r_start seconds."""
    t = np.arange(n) / SR
    e = np.clip(t / max(a, 1e-4), 0, 1)
    e = e * e * (3 - 2 * e)
    rel = np.clip((t - r_start) / max(r, 1e-4), 0, 1)
    return e * (1 - rel) ** 2


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


# ---------------------------------------------------------------- reverb / delay
def make_ir(rt60=2.2, dur=3.0, pre=0.018, bright=5500, seed=1):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for ch in range(2):
        tail = filt(r.standard_normal(n), "lowpass", 2800) * np.exp(-6.9 * t / rt60)
        early = filt(r.standard_normal(n), "lowpass", bright) * np.exp(-t / 0.09)
        er = np.zeros(n)
        for k in range(10):
            er[int((0.007 + 0.011 * k + r.uniform(0, 0.006)) * SR)] += r.uniform(0.3, 0.7) * (0.8 ** k)
        ir[:, ch] = tail + 0.6 * early + filt(er, "lowpass", 7000)
    ir = filt(ir, "highpass", 180)
    p = int(pre * SR)
    ir = np.vstack([np.zeros((p, 2)), ir])[:n]
    fade = np.ones(n)
    fade[-2000:] = np.linspace(1, 0, 2000)
    ir *= fade[:, None]
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, ir):
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], axis=1)
    return y


def pingpong(x, d=0.375, fb=0.42, taps=7, lp=4200):
    mono = x.mean(axis=1)
    y = np.zeros_like(x)
    src = filt(mono, "lowpass", lp)
    src = filt(src, "highpass", 350)
    for k in range(1, taps + 1):
        s = int(k * d * SR)
        g = fb ** k
        ch = k % 2
        if s < len(x):
            y[s:, ch] += src[:len(x) - s] * g
    return y


# ---------------------------------------------------------------- instruments
def kick(f_end=55.0, f_start=170, pdecay=0.04, adecay=0.26, dur=0.55, click=0.25):
    t = tvec(dur)
    f = f_end + (f_start - f_end) * np.exp(-t / pdecay)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR)
    y *= np.exp(-t / adecay) * smooth(t / 0.002)
    c = filt(rng.standard_normal(len(t)), "bandpass", [1500, 6000]) * np.exp(-t / 0.004) * click
    y = np.tanh(1.7 * (y + c)) / np.tanh(1.7)
    y *= 1 - smooth((t - (dur - 0.05)) / 0.05)
    return y


def clap(dur=0.45):
    t = tvec(dur)
    n = rng.standard_normal(len(t))
    e = np.zeros_like(t)
    for k, o in enumerate([0.0, 0.010, 0.021, 0.030]):
        e += np.where(t >= o, np.exp(-(t - o) / 0.0055), 0) * (0.8 if k < 3 else 1.0)
    e += np.where(t >= 0.03, np.exp(-(t - 0.03) / 0.11), 0) * 0.55
    y = filt(n, "bandpass", [850, 5200]) * e
    body = np.sin(2 * np.pi * 210 * t) * np.exp(-t / 0.03) * 0.25
    return (y + body) * 0.9


def hat(open_=False, dur=None):
    dur = dur or (0.35 if open_ else 0.08)
    t = tvec(dur)
    metal = sum(np.sign(np.sin(2 * np.pi * f * 1.9 * t)) for f in [205.3, 304.4, 369.6, 522.7, 540.0, 800.0])
    y = 0.55 * rng.standard_normal(len(t)) + 0.12 * metal
    y = filt(y, "highpass", 7600, 4)
    y = filt(y, "lowpass", 14000)
    d = 0.16 if open_ else 0.028
    return y * np.exp(-t / d) * smooth(t / 0.0015)


def shaker(dur=0.09):
    t = tvec(dur)
    y = filt(rng.standard_normal(len(t)), "bandpass", [4500, 11000])
    return y * smooth(t / 0.012) * np.exp(-t / 0.035)


def crash(dur=2.4, decay=0.75):
    t = tvec(dur)
    metal = sum(np.sign(np.sin(2 * np.pi * f * 2.3 * t + k)) for k, f in enumerate([205.3, 304.4, 369.6, 522.7, 540.0, 800.0, 1233.0]))
    y = rng.standard_normal(len(t)) * 0.7 + metal * 0.08
    y = filt(y, "highpass", 3800, 4)
    y = tv_filter(y, lambda tt: 15000 * np.exp(-tt / 1.4) + 5000)[:, 0]
    return y * np.exp(-t / decay) * smooth(t / 0.002)


def impact(dur=3.0):
    t = tvec(dur)
    f = 41 + 50 * np.exp(-t / 0.16)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    body = filt(rng.standard_normal(len(t)), "lowpass", 900) * np.exp(-t / 0.18) * 0.5
    y = np.tanh(1.4 * (boom + body)) * smooth(t / 0.003)
    return y


def fm_note(freq, dur, ratio=1.0, index=2.0, idecay=0.08, adecay=0.35, attack=0.002, detune=0.0):
    t = tvec(dur)
    I = index * np.exp(-t / idecay)
    ph = 2 * np.pi * freq * (1 + detune) * t
    y = np.sin(ph + I * np.sin(ratio * ph))
    y *= np.exp(-t / adecay) * smooth(t / attack)
    y *= 1 - smooth((t - (dur - 0.03)) / 0.03)
    return y


def pluck(m, dur=0.7, bright=1.6, decay=0.32):
    f = float(mtof(m))
    y = fm_note(f, dur, ratio=1.0, index=bright, idecay=0.06, adecay=decay)
    y += 0.35 * fm_note(f * 2, dur, ratio=1.0, index=0.6, idecay=0.03, adecay=decay * 0.5)
    return y


def bell(m, dur=2.2, level=1.0):
    f = float(mtof(m))
    y = fm_note(f, dur, ratio=3.5, index=1.3, idecay=0.25, adecay=0.9)
    y += 0.5 * fm_note(f, dur, ratio=1.0, index=0.4, idecay=0.2, adecay=1.3)
    y += 0.12 * fm_note(f * 4.02, dur, ratio=1.0, index=0.0, idecay=1, adecay=0.18)
    return y * level


def pad_chord(notes, start, end, a=0.5, r=0.9, voices=(-13, -6, 0, 6, 13)):
    """Detuned saw pad. Returns (stereo array, start time)."""
    dur = end - start + r
    n = int(dur * SR)
    out = np.zeros((n, 2))
    e = env_ar(n, a, end - start, r)
    for m in notes:
        f = float(mtof(m))
        for k, cents in enumerate(voices):
            pan = np.interp(k, [0, len(voices) - 1], [-0.75, 0.75])
            vib = 1 + 0.0012 * np.sin(2 * np.pi * (0.23 + 0.07 * k) * np.arange(n) / SR + k)
            y = polyblep_saw(f * 2 ** (cents / 1200) * vib, n, phase0=rng.uniform())
            ang = (pan + 1) * np.pi / 4
            out[:, 0] += y * np.cos(ang)
            out[:, 1] += y * np.sin(ang)
        # a soft sine an octave down for body
        out += (np.sin(2 * np.pi * f / 2 * np.arange(n) / SR) * 0.35)[:, None]
    out *= e[:, None] / (len(notes) * len(voices)) * 2.2
    return out


def bass_note(m, dur, sub=1.0, grit=0.35, decay=None):
    n = int(dur * SR)
    f = float(mtof(m))
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * sub
    s = polyblep_saw(f, n)
    y += filt(s, "lowpass", 420 if decay is None else 700) * grit
    e = smooth(t / 0.006) * (1 - smooth((t - (dur - 0.04)) / 0.04))
    if decay:
        e *= np.exp(-t / decay) * 0.6 + 0.4
    return np.tanh(1.3 * y * e) / np.tanh(1.3)


def noise_sweep(dur, f0, f1, f2=None, peak=0.55, width=1.1, pan0=-0.6, pan1=0.6):
    """Whoosh: bandpassed noise sweeping f0 -> f1 (-> f2), bell envelope, panning."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    if f2 is None:
        fc = lambda tt: f0 * (f1 / f0) ** np.clip(tt / dur, 0, 1)
    else:
        fc = lambda tt: (f0 * (f1 / f0) ** np.clip(tt / (dur * peak), 0, 1)) if tt < dur * peak else (f1 * (f2 / f1) ** np.clip((tt - dur * peak) / (dur * (1 - peak)), 0, 1))
    y = tv_filter(x, fc, "lowpass", 2)[:, 0]
    y = filt(y, "highpass", 120)
    u = t / dur
    e = np.where(u < peak, (u / peak) ** 2.2, np.exp(-(u - peak) / (1 - peak) * 4.5))
    pan = pan0 + (pan1 - pan0) * smooth(u)
    ang = (pan + 1) * np.pi / 4
    return np.stack([y * e * np.cos(ang), y * e * np.sin(ang)], axis=1) * np.sqrt(2)


# ---------------------------------------------------------------- arrangement
H, R3, S3, S4, S5, S6 = CUES["hook"], CUES["reveal"], CUES["s3"], CUES["s4"], CUES["s5"], CUES["s6"]
DROP = H["drop"]
FINAL = S6["impact"]

drums = stereo()
bass = stereo()
pad = stereo()
arp = stereo()
keys = stereo()   # plucks, bells, ui tones (musical fx)
fx = stereo()     # whooshes, risers, impacts, clicks
kicks = []

# --- pad chords
CHORDS = [
    (0.0, H["collapse"] + 0.2, [50, 53, 57, 64]),          # Dm(add9) hook
    (4.0, 6.0, [53, 57, 60, 64, 67]),                        # Fmaj9
    (6.0, 8.0, [52, 55, 60, 62, 67]),                        # C/E (add9)
    (8.0, 10.0, [53, 57, 60, 64, 69]),                       # Dm9
    (10.0, 12.0, [57, 60, 62, 65, 69]),                      # Bbmaj9 (upper)
    (12.0, 14.0, [53, 57, 60, 64, 67]),
    (14.0, 16.0, [52, 55, 60, 62, 67]),
    (16.0, 18.0, [53, 57, 60, 64, 69]),
    (18.0, 19.0, [57, 60, 62, 65, 69]),                      # Bbmaj9
    (19.0, 20.0, [58, 62, 65, 69, 72]),                      # Gm9/C (sus dominant)
    (20.0, 23.2, [53, 57, 60, 64, 67, 72]),                  # Fmaj9 final
]
BASS_ROOT = {4.0: 41, 6.0: 40, 8.0: 38, 10.0: 34, 12.0: 41, 14.0: 40, 16.0: 38, 18.0: 34, 19.0: 36, 20.0: 41}
for s, e, notes in CHORDS:
    a = 0.9 if s == 0 else (0.02 if s in (4.0, 20.0) else 0.12)
    r = 0.06 if s == 0 else (1.8 if s == 20.0 else 0.35)
    place(pad, pad_chord(notes, s, e, a=a, r=r), s)


def pad_cutoff(t):
    if t < DROP:
        return 450 + 700 * smooth(t / 1.8) + 2200 * smooth((t - 2.0) / 1.9) ** 2
    if t < 8:
        return 3200 - 900 * smooth((t - 4) / 1.5)
    if t < 18:
        return 2300 + 900 * smooth((t - 8) / 8)
    if t < 20:
        return 900 + 2600 * smooth((t - 18.5) / 1.45) ** 2
    return 3400 * np.exp(-(t - 20) / 3.5) + 700


pad = tv_filter(pad, pad_cutoff, "lowpass", 2)
pad = filt(pad, "highpass", 140)

# --- bass
place(bass, bass_note(38, H["land"] - 0.02, sub=0.6, grit=0.1) * np.linspace(0, 1, int((H["land"] - 0.02) * SR)) ** 1.5, 0.0)
_hb = bass_note(38, 2.1, sub=1.0, grit=0.15)
_hb *= np.exp(-np.arange(len(_hb)) / SR / 0.7) * 0.75 + 0.25
place(bass, _hb, H["land"])
for bs in [4.0, 6.0]:
    place(bass, bass_note(BASS_ROOT[bs], 1.95, grit=0.3), bs)
for b in range(8, 18):
    bs = float(2 * (b // 2))
    root = BASS_ROOT[bs]
    for k in range(2):
        tbeat = b + k * BEAT
        place(bass, bass_note(root, 0.2, grit=0.45, decay=0.12), tbeat + BEAT / 2)
        if k == 1 and (b % 2 == 1):
            place(bass, bass_note(root + 12, 0.12, grit=0.4, decay=0.08), tbeat + BEAT * 0.75, gain=0.6)
place(bass, bass_note(34, 1.0, grit=0.25), 18.0, gain=0.9)
place(bass, bass_note(36, 0.93, grit=0.25), 19.0, gain=0.9)
place(bass, bass_note(41, 3.4, grit=0.2, decay=1.4), 20.0)

# --- drums
def K(t, g=1.0):
    kicks.append(t)
    place(drums, kick(), t, gain=g)


# hook heartbeat
for t in [0.0, 0.5, 1.0]:
    place(drums, kick(f_end=36.7, f_start=110, adecay=0.28, click=0.05), t, gain=0.45 if t else 0.6)
# reveal: half-time
for t in [4.0, 5.0, 5.75, 6.0, 7.0, 7.75]:
    K(t, 1.0 if t in (4.0, 6.0) else 0.85)
for t in [5.0, 7.0]:
    place(drums, clap(), t, gain=0.55, pan=0.0)
for i in range(16):
    t = 4.0 + i * BEAT / 2
    if i % 2 == 1:
        place(drums, hat(), t, gain=0.22, pan=0.25)
# groove
for i in range(20):
    t = 8.0 + i * BEAT
    K(t, 0.95)
    if i % 2 == 1:
        place(drums, clap(), t, gain=0.5)
    for s in range(4):
        ts = t + s * BEAT / 4
        v = [0.16, 0.07, 0.22, 0.08][s] * (1.2 if t >= 12 else 1.0)
        if s == 2 and t >= 12:
            place(drums, hat(open_=True, dur=0.25), ts, gain=0.14, pan=-0.2)
        else:
            place(drums, hat(), ts, gain=v, pan=0.3)
        place(drums, shaker(), ts + 0.012, gain=[0.05, 0.08, 0.06, 0.1][s], pan=-0.35)
# fills
for k in range(4):
    place(drums, clap(0.25), 11.5 + k * BEAT / 4, gain=0.12 + 0.07 * k, pan=0.15)
for k in range(4):
    place(drums, clap(0.25), 15.5 + k * BEAT / 4, gain=0.12 + 0.07 * k, pan=-0.15)
# breakdown: kick on 18 then snare build
K(18.0, 0.9)
for k in range(14):
    t = 19.0 + k * (0.9 / 14)
    place(drums, clap(0.2), t, gain=0.05 + 0.2 * (k / 13) ** 2)
# finale
K(20.0, 1.0)
place(drums, crash(), 20.0, gain=0.3, pan=0.1)
place(drums, crash(dur=2.0, decay=0.6), 4.0, gain=0.3, pan=-0.1)
place(drums, crash(dur=1.6, decay=0.45), 12.0, gain=0.14)
place(drums, crash(dur=1.6, decay=0.45), 18.0, gain=0.18)

# --- arp (bars 5-10), 16ths
ARP_TONES = {8.0: [62, 65, 69, 72, 76], 10.0: [62, 65, 69, 72, 74], 12.0: [65, 69, 72, 76, 79], 14.0: [64, 67, 72, 74, 79],
             16.0: [62, 65, 69, 72, 76], 18.0: [62, 65, 69, 72, 74], 19.0: [65, 70, 74, 77, 79]}
PATTERN = [0, 2, 4, 3, 1, 3, 2, 4, 0, 3, 4, 2, 1, 2, 4, 3]
for i in range(int((20.0 - 8.0) / (BEAT / 4))):
    t = 8.0 + i * BEAT / 4
    key = max(k for k in ARP_TONES if k <= t)
    tones = ARP_TONES[key]
    m = tones[PATTERN[i % 16]]
    vel = [1.0, 0.55, 0.75, 0.55][i % 4]
    g = 0.5 + 0.5 * smooth((t - 8.0) / 4.0)
    if t >= 18.0:
        g *= 0.8
    place(arp, pluck(m, 0.45, bright=1.1, decay=0.16), t, gain=0.16 * vel * g, pan=0.35 * np.sin(i * 0.7))
# outro arp: slow 8ths fading
for i in range(12):
    t = 20.0 + i * BEAT / 2 + BEAT / 2
    m = [72, 76, 79, 77, 72, 69, 76, 72, 67, 72, 69, 65][i]
    place(arp, pluck(m, 0.9, bright=0.8, decay=0.4), t, gain=0.13 * (1 - i / 13) ** 1.3, pan=0.4 * np.sin(i * 1.3))
arp = tv_filter(arp, lambda t: 1500 + 4200 * smooth((t - 8) / 8) - (2500 * smooth((t - 18) / 0.6) * (1 - smooth((t - 19.2) / 0.8))), "lowpass", 2)

# --- hook: descending plucks, one per chip
DESC = [81, 79, 77, 76, 74, 72, 70, 69, 67, 65, 64]
for t, m in zip(H["chips"], DESC):
    place(keys, pluck(m, 0.8, bright=1.8, decay=0.28), t, gain=0.24, pan=rng.uniform(-0.5, 0.5))
    place(keys, pluck(m - 12, 0.5, bright=0.8, decay=0.18), t, gain=0.08)
casc = [62, 60, 57, 55, 53, 52, 50, 48, 45, 43]
for k, m in enumerate(casc):
    t = H["cascadeStart"] + k * (H["cascadeEnd"] - H["cascadeStart"]) / len(casc)
    place(keys, pluck(m, 0.35, bright=1.2, decay=0.12), t, gain=0.09, pan=rng.uniform(-0.7, 0.7))
# ticking clock on 16ths while money drains
for i in range(10):
    t = 0.5 + i * BEAT / 4 * 2
    if t < H["land"]:
        place(fx, hat(dur=0.05), t, gain=0.1 + 0.05 * i / 10, pan=0.4)
# landing thud (D)
place(fx, kick(f_end=36.7, f_start=90, pdecay=0.08, adecay=0.5, dur=0.9, click=0.0), H["land"], gain=0.8)
place(keys, pluck(50, 1.4, bright=0.9, decay=0.6), H["land"], gain=0.2)
place(keys, pluck(38, 1.4, bright=0.5, decay=0.6), H["land"], gain=0.2)
# riser into the drop
rs, re_ = H["headline"] + 0.1, H["collapse"] + 0.2
rn = int((re_ - rs) * SR)
tt = np.arange(rn) / SR
u = tt / (re_ - rs)
riser = tv_filter(rng.standard_normal(rn), lambda x: 300 * (9000 / 300) ** np.clip(x / (re_ - rs), 0, 1) ** 1.6, "lowpass", 2)[:, 0]
riser = filt(riser, "highpass", 250) * u ** 2.4 * 0.55
f_r = mtof(62) * 2 ** (2 * u ** 1.8)
tone = polyblep_saw(f_r, rn) * u ** 2 * 0.12
tone = filt(tone, "lowpass", 3500)
place(fx, np.stack([riser + tone, np.roll(riser, 240) + tone], axis=1), rs)
rev_c = crash(dur=1.7, decay=0.5)[::-1]
place(fx, rev_c, DROP - 0.06 - len(rev_c) / SR, gain=0.45)
# drop impact
place(fx, impact(), DROP, gain=0.75)
place(fx, impact(2.5), FINAL, gain=0.8)

# --- reveal dot plink + tagline shimmer
place(keys, bell(89, 2.4), R3["dot"], gain=0.16, pan=0.1)
place(keys, bell(84, 2.4), R3["dot"] + 0.045, gain=0.12, pan=-0.1)

# --- whooshes on transitions
place(fx, noise_sweep(0.62, 250, 3200, 500, peak=0.45), S3["phoneIn"] - 0.18, gain=0.4)
place(fx, noise_sweep(0.4, 600, 2600, 900, peak=0.5, pan0=0.2, pan1=-0.2), R3["out"] - 0.05, gain=0.18)
place(fx, noise_sweep(0.55, 400, 5500, 700, peak=0.62, pan0=0.7, pan1=-0.7), S3["out"] - 0.05, gain=0.42)
place(fx, noise_sweep(0.55, 400, 5500, 700, peak=0.62, pan0=-0.7, pan1=0.7), S4["out"] - 0.05, gain=0.42)
place(fx, noise_sweep(0.35, 900, 6000, 2000, peak=0.5, pan0=0, pan1=0), S5["unlock"], gain=0.2)
place(fx, noise_sweep(0.9, 200, 7000, 900, peak=0.42, pan0=-0.8, pan1=0.8), S6["flip"] - 0.15, gain=0.5)
# shimmer gliss into the finale (F major pentatonic)
PENTA = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86, 89, 91]
for k, m in enumerate(PENTA):
    t = S6["flip"] - 0.05 + k * 0.022
    place(keys, pluck(m, 0.6, bright=1.0, decay=0.25), t, gain=0.045 + 0.02 * k / 11, pan=-0.6 + 1.2 * k / 11)

# --- UI tones (s3)
def tap(t, m, g=1.0, pan=0.25):
    click = filt(rng.standard_normal(int(0.02 * SR)), "bandpass", [2000, 7000]) * np.exp(-np.arange(int(0.02 * SR)) / SR / 0.003)
    place(fx, click, t, gain=0.12 * g, pan=pan)
    place(keys, pluck(m, 0.5, bright=0.9, decay=0.14), t, gain=0.13 * g, pan=pan)


tap(S3["tapPlus"], 72)
for t, m in zip(S3["digits"], [69, 72, 74]):
    tap(t, m, 0.8)
nchar = len("Biryani with the team")
for k in range(nchar):
    t = S3["descStart"] + k * (S3["descEnd"] - S3["descStart"]) / nchar
    click = filt(rng.standard_normal(int(0.012 * SR)), "bandpass", [2500, 8000]) * np.exp(-np.arange(int(0.012 * SR)) / SR / 0.002)
    place(fx, click, t, gain=0.035, pan=0.3)
tap(S3["tapFood"], 65)
tap(S3["tapAdd"], 69)
place(keys, bell(86, 2.0), S3["tracked"], gain=0.14, pan=0.2)       # D6
place(keys, bell(81, 2.0), S3["tracked"] + 0.06, gain=0.1, pan=-0.2)  # A5

# --- s4: ascending plucks under each category bar
for t, m in zip(S4["bars"], [77, 81, 84, 88]):
    place(keys, pluck(m, 0.7, bright=1.3, decay=0.25), t, gain=0.13, pan=-0.3)

# --- s5: notification dings (Dm9 tones)
for t, m in zip(S5["notifs"], [81, 84, 88]):
    place(keys, bell(m, 1.6), t, gain=0.12, pan=0.25)
    place(keys, bell(m + 7, 1.2), t + 0.07, gain=0.07, pan=0.25)

# --- end card dot plink
place(keys, bell(89, 3.0), S6["dot"], gain=0.13)
place(keys, bell(84, 3.0), S6["dot"] + 0.05, gain=0.09)
place(keys, bell(77, 3.0), S6["dot"] + 0.1, gain=0.08)

# ---------------------------------------------------------------- mix
# dynamic arc: the hook sits lower and the riser climbs into the drop
t_env = np.arange(N) / SR
arc = np.where(t_env < 2.6, 0.6, 0.6 + 0.4 * smooth((t_env - 2.6) / (DROP - 0.08 - 2.6)))
arc = np.where(t_env >= DROP - 0.08, 1.0, arc)
for _stem in (drums, bass, pad, arp, keys, fx):
    _stem *= arc[:, None]
# sidechain duck from kicks
t_all = np.arange(N) / SR
duck = np.ones(N)
for tk in kicks:
    i0 = int(tk * SR)
    L = int(0.26 * SR)
    seg = 1 - 0.55 * (1 - smooth(np.arange(L) / L)) * smooth(np.arange(L) / (0.004 * SR))
    j = min(N, i0 + L)
    duck[i0:j] = np.minimum(duck[i0:j], seg[: j - i0])
pad *= duck[:, None]
bass *= (0.35 + 0.65 * duck)[:, None]
arp *= (0.5 + 0.5 * duck)[:, None]

bass = filt(bass, "lowpass", 900)
bass = filt(bass, "highpass", 28)
bass_m = bass.mean(axis=1, keepdims=True)
bass = np.repeat(bass_m, 2, axis=1)

ir_big = make_ir(2.6, 3.2, seed=3)
ir_room = make_ir(1.1, 1.6, pre=0.01, seed=5)

G = dict(drums=0.62, bass=0.42, pad=0.62, arp=1.25, keys=0.85, fx=0.42)
dry = drums * G["drums"] + bass * G["bass"] + pad * G["pad"] + arp * G["arp"] + keys * G["keys"] + fx * G["fx"]
send_big = pad * G["pad"] * 0.25 + arp * 0.45 + keys * 0.5 + fx * 0.25
send_room = drums * 0.12
delay = pingpong(arp * 0.6 + keys * 0.35, d=0.375, fb=0.38)
wet = reverb(send_big, ir_big) * 0.28 + reverb(send_room, ir_room) * 0.35 + delay * 0.35
mix = dry + wet
meter = pyln.Meter(SR)
pre_lufs = meter.integrated_loudness(mix)
mix *= 10 ** ((-17.0 - pre_lufs) / 20)
for _n in ("drums", "bass", "pad", "arp", "keys", "fx"):
    G[_n] *= 10 ** ((-17.0 - pre_lufs) / 20)
wet *= 10 ** ((-17.0 - pre_lufs) / 20)

# master: high-pass, gentle tilt, glue compression, soft limiter
mix = filt(mix, "highpass", 32)
mix = mix - 0.0 * filt(mix, "lowpass", 250)
# block RMS compressor (4:1 above threshold, slow)
blk = int(0.01 * SR)
rms = np.sqrt(np.convolve(np.mean(mix ** 2, axis=1), np.ones(blk) / blk, mode="same") + 1e-12)
db = 20 * np.log10(rms)
thr = -19.0
gr = np.where(db > thr, (db - thr) * (1 - 1 / 2.0), 0)
# smooth gain reduction (attack ~10ms, release ~150ms)
gs = np.zeros_like(gr)
a_att, a_rel = np.exp(-1 / (0.01 * SR)), np.exp(-1 / (0.15 * SR))
g = 0.0
gr_b = gr[::32]
gs_b = np.zeros_like(gr_b)
for i, x in enumerate(gr_b):
    coef = a_att ** 32 if x > g else a_rel ** 32
    g = coef * g + (1 - coef) * x
    gs_b[i] = g
gs = np.interp(np.arange(N), np.arange(0, N, 32)[: len(gs_b)], gs_b)
mix *= (10 ** (-gs / 20))[:, None]

# loudness normalise to -14 LUFS, then soft-clip limiter at -1 dBFS
print(f"glue GR: mean {gs.mean():.2f} dB, max {gs.max():.2f} dB")
lufs = meter.integrated_loudness(mix)
mix *= 10 ** ((-14.0 - lufs) / 20)
ceiling = 10 ** (-1.0 / 20)
from scipy.ndimage import minimum_filter1d, uniform_filter1d
W = int(0.004 * SR)
peak = np.max(np.abs(mix), axis=1)
glim = np.minimum(1.0, ceiling / (peak + 1e-9))
glim = uniform_filter1d(minimum_filter1d(glim, size=2 * W + 1), size=W)
# release smoothing: slower recovery
glim = np.minimum(glim, uniform_filter1d(minimum_filter1d(glim, size=int(0.03 * SR)), size=int(0.03 * SR)))
mix *= glim[:, None]
# fade in/out
fade_in = smooth(t_all / 0.02)
fo0, fo1 = S6["fadeOut"], S6["end"]
fade_out = 1 - smooth((t_all - fo0) / (fo1 - fo0))
mix *= (fade_in * fade_out ** 1.5)[:, None]

final_lufs = meter.integrated_loudness(mix)
print(f"LUFS in: {lufs:.1f}  out: {final_lufs:.1f}  peak: {20*np.log10(np.max(np.abs(mix))):.2f} dBFS")
for name, x in dict(drums=drums * G['drums'], bass=bass * G['bass'], pad=pad * G['pad'], arp=arp * G['arp'], keys=keys * G['keys'], fx=fx * G['fx'], wet=wet).items():
    r = np.sqrt(np.mean(x ** 2)) + 1e-12
    sl = meter.integrated_loudness(x * 10 ** ((-14.0 - lufs) / 20))
    print(f"  {name:6s} LUFS {sl:6.1f}  rms {20*np.log10(r):6.1f} dB")

# short-term loudness curve (1s windows)
st = [meter.integrated_loudness(mix[int(a*SR):int((a+1.0)*SR)]) if a+1 <= DUR else None for a in np.arange(0, DUR-0.99, 1.0)]
print("short-term:", " ".join(f"{a:.0f}s:{v:.0f}" for a, v in zip(np.arange(0, DUR, 1.0), st) if v is not None))
out = HERE / "soundtrack.wav"
wavfile.write(out, SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
if "--stems" in sys.argv:
    for name, x in dict(drums=drums, bass=bass, pad=pad, arp=arp, keys=keys, fx=fx).items():
        wavfile.write(HERE / f"stem-{name}.wav", SR, (np.clip(x / (np.max(np.abs(x)) + 1e-9), -1, 1) * 32767).astype(np.int16))
print("wrote", out)
