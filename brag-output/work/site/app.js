(() => {
  const C = window.CUES;
  const I = window.ICONS;
  const W = 1920;
  const H = 1080;

  // ------------------------------------------------------------------ math
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const E = {
    outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inExpo: x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outCubic: x => 1 - Math.pow(1 - x, 3),
    inCubic: x => x * x * x,
    inQuad: x => x * x,
    outQuad: x => 1 - (1 - x) * (1 - x),
    inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inOutQuint: x => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
    outQuint: x => 1 - Math.pow(1 - x, 5),
    inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
    outBack: (x, s = 1.6) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  };

  // ------------------------------------------------------------------ dom helpers
  const h = html => {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const svg = (name, size, color = 'currentColor') =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block"><path fill="${color}" d="${I[name]}"/></svg>`;
  const inr = n => Math.round(n).toLocaleString('en-IN');
  const px = n => `${n.toFixed(2)}px`;
  const hexA = (hex, a) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  };
  function tf(el, o) {
    const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, sx = 1, sy = 1, w = 0, hh = 0 } = o;
    el.style.transform =
      `translate3d(${px(x - w / 2)},${px(y - hh / 2)},${px(z)}) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) ` +
      `rotateZ(${rz.toFixed(3)}deg) scale(${(s * sx).toFixed(4)},${(s * sy).toFixed(4)})`;
  }
  const show = (el, on) => el.classList.toggle('hidden', !on);
  const fx = (el, { o = 1, blur = 0 }) => {
    el.style.opacity = o.toFixed(4);
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  };

  // ------------------------------------------------------------------ brand data
  const CAT = {
    food: { c: '#DA8400', bg: '#FAF0DB', name: 'Food', icon: 'food' },
    transport: { c: '#2F6BE2', bg: '#E8EFFD', name: 'Transport', icon: 'transport' },
    entertainment: { c: '#7C5CFF', bg: '#EEEAFF', name: 'Entertainment', icon: 'entertainment' },
    health: { c: '#E0484D', bg: '#FBEAEB', name: 'Health', icon: 'health' },
    shopping: { c: '#D6308C', bg: '#FAE6F1', name: 'Shopping', icon: 'shopping' },
    bills: { c: '#0E9F8E', bg: '#E0F4F1', name: 'Bills', icon: 'bills' },
    others: { c: '#7A746B', bg: '#EFEDE7', name: 'Others', icon: 'others' },
  };
  const cbg = (k, dark) => (dark ? hexA(CAT[k].c, 0.18) : CAT[k].bg);

  // ------------------------------------------------------------------ stage
  const stage = $('#stage');
  const layer = (id, cls = 'scene') => {
    const el = h(`<div id="${id}" class="${cls}"></div>`);
    stage.appendChild(el);
    return el;
  };
  const bgPaper = layer('bgPaper', 'layer');
  const bgDark = layer('bgDark', 'layer');
  const sHook = layer('hook');
  const sReveal = layer('reveal');
  const s3 = layer('s3');
  const s4 = layer('s4');
  const s5 = layer('s5');
  const s6 = layer('s6');
  const flash = layer('flash', 'layer');
  document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute">
    ${['mb3', 'mb4', 'mb5'].map(id => `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter>`).join('')}</svg>`);
  // directional motion blur for a whole scene, sized to fill the gap between shutter sub-samples
  let CUR_SAMPLES = { n: 1, shutter: 0.5 };
  let TXT_T = 0;
  function motionBlur(el, id, vx, vy) {
    const exp = CUR_SAMPLES.shutter / 60 / CUR_SAMPLES.n;
    const sx = Math.abs(vx) * exp * 0.55;
    const sy = Math.abs(vy) * exp * 0.55;
    if (Math.max(sx, sy) < 0.6) {
      el.style.filter = 'none';
      return;
    }
    document.querySelector(`#${id} feGaussianBlur`).setAttribute('stdDeviation', `${sx.toFixed(2)} ${sy.toFixed(2)}`);
    el.style.filter = `url(#${id})`;
  }
  const vel = (fn, t) => {
    const d = 1 / 600;
    const a = fn(t - d);
    const b = fn(t + d);
    return { vx: (b.x - a.x) / (2 * d), vy: (b.y - a.y) / (2 * d) };
  };
  const fade = layer('fade', 'layer');

  // ------------------------------------------------------------------ phone + screens
  const sb = () =>
    `<div class="sb"><span>9:41</span><span class="sb-icons">${svg('signal', 17)}${svg('wifi', 17)}<span class="batt"></span></span></div>`;

  function tabbar(active) {
    const tab = (k, icon, label) =>
      `<div class="tab ${active === k ? 'on' : ''}">${svg(icon, 23)}<span>${label}</span></div>`;
    return `<div class="tabbar">${tab('home', 'home', 'Home')}${tab('history', 'history', 'History')}
      <div><div class="addbtn" data-r="addbtn">${svg('plus', 28, 'var(--accentInk)')}</div></div>
      ${tab('insights', 'poll', 'Insights')}${tab('profile', 'account', 'Profile')}</div><div class="homeind"></div>`;
  }

  const RECENT = [
    { k: 'food', a: 480, d: 'Biryani with the team', dt: 'Today', isNew: true },
    { k: 'transport', a: 212, d: 'Cab home', dt: 'Today' },
    { k: 'shopping', a: 3499, d: 'Sneakers', dt: 'Yesterday' },
    { k: 'bills', a: 1860, d: 'Electricity', dt: '21 Sep' },
  ];
  const BREAK = [
    { k: 'food', a: 8420 },
    { k: 'bills', a: 6150 },
    { k: 'shopping', a: 4980 },
    { k: 'transport', a: 2610 },
  ];
  const TOTAL = 24860;

  function dashboardHTML(dark, opts = {}) {
    const added = opts.added !== false;
    const total = added ? 24860 : 24380;
    const rc = RECENT.map(
      r => `<div class="rc" ${r.isNew ? 'data-r="newcard"' : ''}>
        <div class="rc-top"><div class="ic30" style="background:${cbg(r.k, dark)}">${svg(CAT[r.k].icon, 17, CAT[r.k].c)}</div>
        <div class="rc-amt">₹${inr(r.a)}</div></div>
        <div class="rc-desc">${r.d}</div><div class="rc-date">${r.dt}</div></div>`,
    ).join('');
    const max = BREAK[0].a;
    const br = BREAK.map(
      b => `<div class="brow"><div class="ic30" style="background:${cbg(b.k, dark)}">${svg(CAT[b.k].icon, 17, CAT[b.k].c)}</div>
        <div class="binfo"><div class="btop"><span class="bname">${CAT[b.k].name}</span><span class="bamt">₹${inr(b.a)}</span></div>
        <div class="btrack"><div class="bfill" style="width:${((b.a / max) * 100).toFixed(1)}%;background:${CAT[b.k].c}"></div></div></div></div>`,
    ).join('');
    return `<div class="scr dash">${sb()}
      <div class="d-head"><div class="pill">September ${svg('chevronDown', 18)}</div><div class="avatar">S</div></div>
      <div class="hero"><div class="hero-label">TOTAL SPENT · SEP</div>
        <div class="hero-amt"><span class="hero-rupee">₹</span><span class="hero-num" data-r="total">${inr(total)}</span></div>
        <div class="hero-stats"><span data-r="count">${added ? 38 : 37} transactions</span><i></i><span data-r="pct">${added ? 62 : 61}% used</span></div></div>
      <div class="budget"><div class="track"><div class="fill" data-r="bfill" style="width:${added ? 62.15 : 60.95}%"></div></div>
        <div class="cap"><span data-r="left">₹${inr(40000 - total)} left</span><span class="muted">Budget ₹40,000</span></div></div>
      <div class="sec" style="top:334px"><span class="sec-t">Recent</span><span class="see">See all</span></div>
      <div class="recent" data-r="recent">${rc}</div>
      <div class="sec" style="top:490px"><span class="sec-t">Where it went</span></div>
      <div class="card" style="top:526px" data-r="brk">${br}</div>
      ${tabbar('home')}
      ${opts.sheet ? sheetHTML(dark) : ''}
    </div>`;
  }

  function sheetHTML(dark) {
    const order = ['food', 'transport', 'bills', 'shopping', 'health', 'entertainment', 'others'];
    const chips = order
      .map(
        k => `<div class="cchip" data-chip="${k}"><div class="ic22" style="background:${cbg(k, dark)}">${svg(CAT[k].icon, 15, CAT[k].c)}</div>${CAT[k].name}</div>`,
      )
      .join('');
    return `<div class="overlay" data-r="overlay"></div>
      <div class="sheet" data-r="sheet"><div class="grab"></div>
        <div class="sh-head"><span class="sh-title">Add expense</span><span class="xbtn">${svg('close', 17, 'var(--ink2)')}</span></div>
        <div class="amt"><span class="cur">₹</span><span class="amt-v" data-r="amt"></span><span class="amt-ph" data-r="amtph">0</span><span class="caret" data-r="caret1"></span></div>
        <div class="inp"><span data-r="desc"></span><span class="caret" data-r="caret2" style="height:20px;width:2px"></span><span class="ph" data-r="descph">&nbsp;What was it for?</span></div>
        <div class="lbl">CATEGORY</div>
        <div style="overflow:hidden;margin-right:-20px;-webkit-mask:linear-gradient(90deg,#000 80%,transparent)"><div class="chips" style="flex-wrap:nowrap">${chips}</div></div>
        <div class="sbtn" data-r="sbtn">Add expense</div>
      </div>`;
  }

  const DAILY = [820, 1240, 460, 2150, 980, 3480, 610, 1320, 890, 2240, 540, 1760, 1180, 960];
  function insightsHTML(dark) {
    const peak = Math.max(...DAILY);
    const bars = DAILY.map(
      (v, i) => `<div class="dcol"><div class="dtrack"><div class="dfill" data-bar="${i}" data-h="${((v / peak) * 90).toFixed(1)}"
        style="height:${((v / peak) * 90).toFixed(1)}px;opacity:${i === DAILY.length - 1 ? 1 : 0.3}"></div></div><span class="dlab">${10 + i}</span></div>`,
    ).join('');
    const max = BREAK[0].a;
    const br = BREAK.map(
      b => `<div class="brow"><div class="ic30" style="background:${cbg(b.k, dark)}">${svg(CAT[b.k].icon, 17, CAT[b.k].c)}</div>
        <div class="binfo"><div class="btop"><span class="bname">${CAT[b.k].name}</span><span class="bamt">₹${inr(b.a)}</span></div>
        <div class="btrack"><div class="bfill" style="width:${((b.a / max) * 100).toFixed(1)}%;background:${CAT[b.k].c}"></div></div></div></div>`,
    ).join('');
    return `<div class="scr ins">${sb()}
      <div class="ins-title">Insights</div><div class="ins-pill">This month ${svg('chevronDown', 16)}</div>
      <div class="card" style="top:124px;padding-bottom:4px"><div class="snap-l">MONTHLY SNAPSHOT</div>
        <div class="snap-v">₹<span data-r="snap">${inr(TOTAL)}</span></div>
        <div class="snap-row"><div class="snap-mini"><div class="k">Transactions</div><div class="v">38</div></div>
          <div class="snap-mini"><div class="k">Biggest spend</div><div class="v">₹3,499</div></div></div></div>
      <div class="card" style="top:302px;padding-bottom:14px"><div style="display:flex;justify-content:space-between">
        <span class="snap-l">DAILY SPENDING</span><span style="font-size:12px;font-weight:700;color:var(--ink2)">Peak ₹3.5k</span></div>
        <div class="dbars">${bars}</div></div>
      <div class="card" style="top:496px" data-r="brk"><div style="font-size:17px;font-weight:800;letter-spacing:-0.3px;margin-bottom:14px">By Category</div>${br}</div>
      ${tabbar('insights')}
    </div>`;
  }

  const NOTIFS = [
    { t: 'Your August report is ready', b: 'You spent ₹31,420 last month. Tap to see the full breakdown.', w: '1 Sep' },
    { t: 'Rent', b: '₹18,000 auto-debited · Next: 1 Oct', w: '1 Sep' },
    { t: 'Approaching budget limit', b: "You've used 80% of your monthly budget. Spent ₹32,000.", w: 'now' },
  ];
  function lockHTML() {
    const n = NOTIFS.map(
      (x, i) => `<div class="nt" data-n="${i}"><div class="nt-ic">P<i></i></div><div class="nt-body">
        <div class="nt-top"><span>PAISA</span><span>${x.w}</span></div><div class="nt-title">${x.t}</div><div class="nt-text">${x.b}</div></div></div>`,
    ).join('');
    return `<div class="lock" data-r="lock">${sb()}
      <div style="position:absolute;left:50%;top:62px;margin-left:-9px;opacity:.9">${svg('lock', 18, '#fff')}</div>
      <div class="lk-date">Wednesday, 24 September</div><div class="lk-time">9:41</div>
      <div class="lk-notifs">${n}</div>
      <div class="lk-btn" style="left:46px">${svg('flashlight', 24, '#fff')}</div><div class="lk-btn" style="right:46px">${svg('camera', 24, '#fff')}</div>
      <div class="homeind"></div></div>`;
  }

  function makePhone(screenHTML, theme) {
    const wrap = h(`<div class="phone-wrap"></div>`);
    const body = h(`<div class="ph-body">
      <div class="ph-btn" style="left:-8px;top:170px;height:30px"></div>
      <div class="ph-btn" style="left:-8px;top:224px;height:58px"></div>
      <div class="ph-btn" style="left:-8px;top:294px;height:58px"></div>
      <div class="ph-btn" style="right:-8px;top:250px;height:92px"></div>
      <div class="ph-screen theme-${theme}">${screenHTML}<div class="ph-glare"></div><div class="touch"></div><div class="ring"></div></div>
      <div class="ph-island"></div></div>`);
    wrap.appendChild(body);
    const r = {};
    $$('[data-r]', wrap).forEach(el => (r[el.dataset.r] = el));
    return { el: wrap, r, screen: $('.ph-screen', wrap), glare: $('.ph-glare', wrap), touch: $('.touch', wrap), ring: $('.ring', wrap) };
  }
  const PW = 417;
  const PH = 876;
  function placePhone(ph, o) {
    tf(ph.el, { ...o, w: PW, hh: PH });
    // glare slides with the yaw so the glass catches light as it turns
    const g = 50 + (o.ry || 0) * 2.2 + (o.rx || 0) * 0.8;
    ph.glare.style.backgroundPosition = `${g.toFixed(1)}% 0`;
  }
  function makeShadow(parent) {
    const s = h(`<div class="ph-shadow"></div>`);
    parent.appendChild(s);
    return s;
  }
  function placeShadow(sh, o, strength = 1) {
    tf(sh, { x: o.x + 40, y: o.y + 70, z: (o.z || 0) - 160, rx: o.rx, ry: o.ry, rz: o.rz, s: (o.s || 1) * 0.94, w: PW, hh: PH });
    sh.style.opacity = (0.34 * strength).toFixed(3);
  }
  // screen-space position of an element inside a phone screen (layout coords, ignores transforms)
  function screenPos(el, screen) {
    let x = el.offsetWidth / 2;
    let y = el.offsetHeight / 2;
    let n = el;
    while (n && n !== screen) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return { x, y };
  }
  function touchAt(ph, t, pos, tDown, tIn = tDown - 0.16, tOut = tDown + 0.2) {
    const vis = P(t, tIn, tIn + 0.1) * (1 - P(t, tOut, tOut + 0.12));
    const press = Math.exp(-Math.pow((t - tDown) / 0.05, 2));
    ph.touch.style.left = px(pos.x);
    ph.touch.style.top = px(pos.y);
    ph.touch.style.opacity = vis.toFixed(3);
    ph.touch.style.transform = `scale(${(1.15 - 0.25 * press - 0.15 * (1 - P(t, tIn, tIn + 0.12))).toFixed(3)})`;
    const rp = P(t, tDown, tDown + 0.4);
    ph.ring.style.left = px(pos.x);
    ph.ring.style.top = px(pos.y);
    ph.ring.style.opacity = t >= tDown && rp < 1 ? (0.9 * (1 - rp)).toFixed(3) : '0';
    ph.ring.style.transform = `scale(${(1 + 1.6 * E.outCubic(rp)).toFixed(3)})`;
  }

  // ================================================================== HOOK
  sHook.innerHTML = `
    <div class="glow" id="hookGlow" style="left:360px;top:180px;width:1200px;height:760px;background:radial-gradient(closest-side, rgba(46,214,138,0.16), rgba(46,214,138,0))"></div>
    <div id="hook3d" class="abs" style="left:0;top:0;width:1920px;height:1080px;transform-style:preserve-3d">
    <div id="hookGroup" class="abs" style="left:0;top:0;width:1920px;height:420px;transform-style:preserve-3d">
      <div id="hookLabel" class="caps" style="top:18px">Day <b>1</b></div>
      <div id="hookNum" style="top:70px"></div>
    </div>
    <div id="chips" class="abs" style="left:0;top:0;width:1920px;height:1080px;transform-style:preserve-3d"></div>
    <div id="hookHead" class="display" style="top:0"></div>
    </div>
    <div id="collapse"></div>`;
  const hookGroup = $('#hookGroup');
  const hookLabel = $('#hookLabel');
  const hookNum = $('#hookNum');
  const hookHead = $('#hookHead');
  const hookGlow = $('#hookGlow');
  const collapse = $('#collapse');
  hookHead.innerHTML = ['Where', 'did', 'it', 'all']
    .map(w => `<span class="word">${w}</span>`)
    .join(' ') + ` <span class="word serif">go?</span>`;
  const headWords = $$('.word', hookHead);

  const CHIPS = [
    ['food', 'Biryani', 480, 205],
    ['transport', 'Cab home', 212, 340],
    ['shopping', 'Sneakers', 3499, 150],
    ['bills', 'Electricity', 1860, 25],
    ['entertainment', 'Movie night', 649, 250],
    ['bills', 'Rent', 18000, 315],
    ['food', 'Chai & samosa', 60, 120],
    ['health', 'Pharmacy', 340, 60],
    ['food', 'Groceries', 2150, 185],
    ['entertainment', 'Concert', 2500, 290],
    ['transport', 'Fuel', 2000, 350],
  ];
  const chipsEl = $('#chips');
  const chipObjs = CHIPS.map(([k, label, amt, ang], i) => {
    const el = h(`<div class="chip"><div class="ic" style="background:${hexA(CAT[k].c, 0.2)}">${svg(CAT[k].icon, 30, CAT[k].c)}</div>
      <span>${label}</span><span class="amt">−₹${inr(amt)}</span></div>`);
    chipsEl.appendChild(el);
    return { el, k, amt, ang: (ang * Math.PI) / 180, t0: C.hook.chips[i], life: 1.15 - 0.4 * (i / 10), w: 0, hh: 0 };
  });
  const MINI = Array.from({ length: 14 }, (_, i) => {
    const ks = ['food', 'transport', 'shopping', 'bills', 'health', 'entertainment', 'food'];
    const k = ks[i % ks.length];
    const el = h(`<div class="chip mini"><div class="ic" style="background:${hexA(CAT[k].c, 0.2)}">${svg(CAT[k].icon, 30, CAT[k].c)}</div></div>`);
    chipsEl.appendChild(el);
    const ang = ((i * 137.5 + 20) % 360) * (Math.PI / 180);
    return { el, ang, t0: lerp(C.hook.cascadeStart, C.hook.cascadeEnd, i / 13), life: 0.7 };
  });
  const HOOK_START = 40000;
  const HOOK_END = 312;
  const labelledSum = CHIPS.reduce((s, c) => s + c[2], 0);
  function hookValue(t) {
    let v = HOOK_START;
    for (const c of chipObjs) v -= c.amt * E.outCubic(P(t, c.t0, c.t0 + 0.14));
    const rest = HOOK_START - HOOK_END - labelledSum;
    v -= rest * P(t, C.hook.cascadeStart, C.hook.cascadeEnd);
    return Math.max(HOOK_END, v);
  }
  let DIGIT_W = 0;
  let COMMA_W = 0;
  function renderNumber(v) {
    const s = inr(v);
    let html = `<span class="cur">₹</span>`;
    for (const ch of s) {
      if (ch === ',') html += `<span class="dg" style="width:${COMMA_W}px">,</span>`;
      else html += `<span class="dg" style="width:${DIGIT_W}px">${ch}</span>`;
    }
    if (hookNum._s !== s) {
      hookNum.innerHTML = html;
      hookNum._s = s;
    }
  }

  function renderHook(t) {
    const on = t < C.hook.drop + 0.02;
    show(sHook, on);
    show(bgDark, t < C.hook.drop);
    if (!on) return;
    const H0 = C.hook;
    // number group
    const intro = E.outExpo(P(t, 0, 0.5));
    let pulse = 0;
    for (const c of chipObjs) if (t >= c.t0) pulse += 0.016 * Math.exp(-(t - c.t0) / 0.07);
    const shrink = E.outExpo(P(t, H0.headline, H0.headline + 0.55));
    const col = E.inExpo(P(t, H0.collapse, H0.drop));
    const gy = lerp(250, 140, shrink);
    const gs = lerp(1.07, 1, intro) * (1 - pulse) * lerp(1, 0.5, shrink) * (1 + 2.2 * col);
    tf(hookGroup, { x: 960, y: gy + 210, z: 0, s: gs, w: 1920, hh: 420 });
    fx(hookGroup, { o: intro * (1 - col), blur: 18 * (1 - intro) + 16 * col });
    const v = hookValue(TXT_T);
    renderNumber(v);
    const landed = P(TXT_T, H0.land - 0.02, H0.land + 0.08);
    hookNum.style.color = landed > 0 ? `rgb(${Math.round(lerp(245, 255, landed))},${Math.round(lerp(242, 110, landed))},${Math.round(lerp(236, 96, landed))})` : '#F5F2EC';
    const spent = (HOOK_START - v) / (HOOK_START - HOOK_END);
    const day = Math.min(23, 1 + Math.floor(22 * spent + 1e-6));
    if (hookLabel._d !== day) {
      hookLabel.innerHTML = `Day <b>${day}</b>`;
      hookLabel._d = day;
    }
    hookLabel.querySelector('b').style.color = landed > 0 ? `rgb(255,${Math.round(lerp(242, 110, landed))},${Math.round(lerp(236, 96, landed))})` : '#F5F2EC';

    // chips burst toward camera
    const cx = 960;
    const cy = 250 + 210 + 70;
    const flyChip = (c, isMini) => {
      const p = P(t, c.t0, c.t0 + c.life);
      if (t < c.t0 || p >= 1) {
        c.el.style.display = 'none';
        return;
      }
      c.el.style.display = 'flex';
      if (!c.w) {
        c.w = c.el.offsetWidth;
        c.hh = c.el.offsetHeight;
      }
      const u = 0.5 * p + 0.5 * E.inQuad(p);
      const dx = Math.cos(c.ang);
      const dy = Math.sin(c.ang);
      const reach = isMini ? 1500 : 1250;
      const x = cx + dx * (260 + reach * u);
      const y = cy + dy * (110 + 620 * u);
      const z = -380 + (isMini ? 1500 : 1350) * E.inCubic(p);
      const s = (isMini ? 0.9 : 1) * lerp(0.55, 1, E.outCubic(P(p, 0, 0.18)));
      tf(c.el, { x, y, z, ry: dx * 28 * p, rx: -dy * 18 * p, rz: dx * 6 * p, s, w: c.w, hh: c.hh });
      fx(c.el, { o: P(p, 0, 0.07) * (1 - P(p, 0.72, 1)), blur: 16 * E.inQuad(P(p, 0.45, 1)) });
    };
    chipObjs.forEach(c => flyChip(c, false));
    MINI.forEach(c => flyChip(c, true));

    // headline
    const hs = lerp(1, 1.045, E.inOutSine(P(t, H0.headline + 0.4, H0.collapse))) * (1 + 2.6 * col);
    tf(hookHead, { x: 960, y: 640, s: hs, w: 1920, hh: 150 });
    headWords.forEach((w, i) => {
      const p = E.outExpo(P(t, H0.headline + 0.04 + i * 0.055, H0.headline + 0.04 + i * 0.055 + 0.6));
      w.style.transform = `translateY(${px(lerp(60, 0, p))})`;
      fx(w, { o: P(t, H0.headline + i * 0.055, H0.headline + i * 0.055 + 0.18) * (1 - col), blur: 16 * (1 - p) + 18 * col });
    });
    hookGlow.style.opacity = (0.35 + 0.65 * E.inOutSine(P(t, 2.4, H0.collapse))).toFixed(3);
    // collapse to a point of light, then white
    const cp = P(t, H0.collapse - 0.12, H0.drop);
    const size = 10 + 4200 * E.inExpo(cp);
    collapse.style.width = collapse.style.height = px(size);
    collapse.style.margin = `${px(-size / 2)} 0 0 ${px(-size / 2)}`;
    collapse.style.top = '640px';
    collapse.style.opacity = (P(cp, 0, 0.3) * 1).toFixed(3);
  }

  // ================================================================== REVEAL
  const COINS = [
    { k: 'food', x: 330, y: 250, d: 150, blur: 0, z: 60 },
    { k: 'transport', x: 1610, y: 290, d: 124, blur: 1.5, z: 0 },
    { k: 'shopping', x: 1520, y: 830, d: 176, blur: 0, z: 90 },
    { k: 'bills', x: 400, y: 820, d: 118, blur: 2.5, z: -40 },
    { k: 'entertainment', x: 1130, y: 150, d: 84, blur: 5, z: -200 },
    { k: 'health', x: 770, y: 925, d: 92, blur: 4, z: -160 },
    { k: 'others', x: 1790, y: 600, d: 70, blur: 6, z: -260 },
    { k: 'food', x: 140, y: 560, d: 64, blur: 7, z: -300 },
  ];
  sReveal.innerHTML = `
    <div class="leak" id="leak1" style="width:1400px;height:1000px;background:radial-gradient(closest-side, rgba(255,190,110,0.55), rgba(255,190,110,0))"></div>
    <div class="leak" id="leak2" style="width:1200px;height:900px;background:radial-gradient(closest-side, rgba(46,214,138,0.35), rgba(46,214,138,0))"></div>
    <div id="revCam" class="abs" style="left:0;top:0;width:1920px;height:1080px;transform-style:preserve-3d">
      <div id="coins" class="abs" style="left:0;top:0;width:1920px;height:1080px;transform-style:preserve-3d"></div>
      <div id="wordmark" class="display" style="top:305px"></div>
      <div id="tagline" style="top:668px"></div>
    </div>`;
  const revCam = $('#revCam');
  const wordmark = $('#wordmark');
  const tagline = $('#tagline');
  const leak1 = $('#leak1');
  const leak2 = $('#leak2');
  const wmHTML = () =>
    'Paisa'
      .split('')
      .map(c => `<span class="mask"><span class="word lt">${c}</span></span>`)
      .join('') + `<span class="mask" style="overflow:visible"><span class="wm-dot"></span></span>`;
  wordmark.innerHTML = wmHTML();
  const wmLetters = $$('.lt', wordmark);
  const wmDot = $('.wm-dot', wordmark);
  tagline.innerHTML = 'Know where every rupee goes.'
    .split(' ')
    .map(w => `<span class="word">${w}</span>`)
    .join(' ');
  const tagWords = $$('.word', tagline);
  const coinEls = COINS.map(c => {
    const el = h(`<div class="coin" style="width:${c.d}px;height:${c.d}px;background:${CAT[c.k].bg}">${svg(CAT[c.k].icon, c.d * 0.44, CAT[c.k].c)}</div>`);
    $('#coins').appendChild(el);
    return el;
  });

  // squash-and-bounce drop for the brand dot
  function dotMotion(t, t0) {
    // t0 = landing time
    const fall = P(t, t0 - 0.2, t0);
    let y = -560 * (1 - E.inQuad(fall));
    let sx = 1;
    let sy = 1;
    if (t >= t0) {
      const a = t - t0;
      if (a < 0.07) {
        const q = Math.sin((a / 0.07) * Math.PI);
        sx = 1 + 0.32 * q;
        sy = 1 - 0.3 * q;
        y = 0;
      } else if (a < 0.27) {
        const q = (a - 0.07) / 0.2;
        y = -52 * Math.sin(q * Math.PI);
        sy = 1 + 0.08 * Math.sin(q * Math.PI);
        sx = 1 - 0.05 * Math.sin(q * Math.PI);
      } else if (a < 0.33) {
        const q = Math.sin(((a - 0.27) / 0.06) * Math.PI);
        sx = 1 + 0.1 * q;
        sy = 1 - 0.1 * q;
        y = 0;
      } else if (a < 0.43) {
        y = -9 * Math.sin(((a - 0.33) / 0.1) * Math.PI);
      } else y = 0;
    }
    return { y, sx, sy, o: t >= t0 - 0.2 ? 1 : 0 };
  }

  function renderReveal(t) {
    const R = C.reveal;
    const on = t >= C.hook.drop && t < R.out + 0.6;
    show(sReveal, on);
    if (!on) return;
    const out = E.inCubic(P(t, R.out, R.out + 0.38));
    const cam = lerp(1, 1.055, E.inOutSine(P(t, 4.0, R.out + 0.38)));
    tf(revCam, { x: 960, y: 540 - 12 * P(t, 4, 7.8), s: cam, w: 1920, hh: 1080 });
    wmLetters.forEach((l, i) => {
      const p = E.outExpo(P(t, R.letters + i * 0.045, R.letters + i * 0.045 + 0.75));
      l.style.transform = `translateY(${(lerp(105, 0, p)).toFixed(2)}%)`;
    });
    const d = dotMotion(t, R.dot);
    wmDot.style.transform = `translateY(${px(d.y)}) scale(${d.sx.toFixed(3)},${d.sy.toFixed(3)})`;
    wmDot.style.transformOrigin = '50% 100%';
    wmDot.style.opacity = d.o;
    tagWords.forEach((w, i) => {
      const a = R.tagline + i * 0.06;
      const p = E.outExpo(P(t, a, a + 0.65));
      w.style.transform = `translateY(${px(lerp(26, 0, p))})`;
      fx(w, { o: P(t, a, a + 0.22), blur: 10 * (1 - p) });
    });
    wordmark.style.transform = `translateY(${px(-150 * out)})`;
    tagline.style.transform = `translateY(${px(-170 * out)})`;
    fx(wordmark, { o: 1 - out, blur: 14 * out });
    fx(tagline, { o: 1 - out, blur: 14 * out });
    COINS.forEach((c, i) => {
      const el = coinEls[i];
      const a = 4.05 + i * 0.06;
      const pop = P(t, a, a + 0.75);
      const s = pop <= 0 ? 0.001 : E.outBack(pop, 1.7);
      const dx = c.x - 960;
      const dy = c.y - 540;
      const x = c.x + Math.cos(t * 0.7 + i * 1.7) * 10 + dx * 0.9 * out;
      const y = c.y + Math.sin(t * 0.9 + i) * 14 + dy * 0.9 * out - 40 * E.outExpo(pop);
      tf(el, { x, y, z: c.z + 400 * out, rz: Math.sin(t * 0.6 + i) * 8, ry: Math.cos(t * 0.5 + i) * 14, s: Math.max(0.001, s), w: c.d, hh: c.d });
      fx(el, { o: P(pop, 0, 0.15) * (1 - out), blur: c.blur + 10 * out });
      el.style.boxShadow = c.blur + 10 * out > 0.5 ? 'none' : '';
    });
    // warm light leak after the flash
    const lk = 1 - E.outCubic(P(t, 4.0, 5.4));
    tf(leak1, { x: lerp(300, 900, P(t, 4, 5.4)), y: 300, s: 1, w: 1400, hh: 1000 });
    tf(leak2, { x: lerp(1700, 1200, P(t, 4, 5.4)), y: 850, s: 1, w: 1200, hh: 900 });
    leak1.style.opacity = (0.7 * lk).toFixed(3);
    leak2.style.opacity = (0.6 * lk).toFixed(3);
  }

  // ================================================================== S3 — Tap. Type. Tracked.
  s3.innerHTML = `
    <div class="glow" style="left:780px;top:40px;width:1100px;height:1000px;background:radial-gradient(closest-side, rgba(14,123,83,0.10), rgba(14,123,83,0))"></div>
    <div id="s3cam" class="abs" style="left:0;top:0;width:1920px;height:1080px;transform-style:preserve-3d"></div>`;
  const s3cam = $('#s3cam');
  const s3shadow = makeShadow(s3cam);
  const ph3 = makePhone(dashboardHTML(false, { sheet: true, added: false }), 'light');
  s3cam.appendChild(ph3.el);
  const s3words = [
    h(`<div class="feat display" style="left:190px;top:238px"><span class="word">Tap.</span></div>`),
    h(`<div class="feat display" style="left:190px;top:418px"><span class="word">Type.</span></div>`),
    h(`<div class="feat display" style="left:190px;top:598px"><span class="word serif">Tracked.</span></div>`),
  ];
  s3words.forEach(w => s3cam.appendChild(w));

  // ================================================================== S4 — See where it went
  s4.innerHTML = `
    <div class="glow" style="left:40px;top:40px;width:1100px;height:1000px;background:radial-gradient(closest-side, rgba(218,132,0,0.09), rgba(218,132,0,0))"></div>
    <div id="s4cam" class="abs" style="left:0;top:0;width:1920px;height:1080px;transform-style:preserve-3d"></div>`;
  const s4cam = $('#s4cam');
  const s4shadow = makeShadow(s4cam);
  const ph4 = makePhone(insightsHTML(false), 'light');
  s4cam.appendChild(ph4.el);
  const fcard = h(`<div class="fcard"><div class="fc-head"><span class="fc-t">Where it went</span><span class="fc-m">September</span></div>
    ${BREAK.map(
      b => `<div class="frow"><div class="ic" style="background:${CAT[b.k].bg}">${svg(CAT[b.k].icon, 27, CAT[b.k].c)}</div><div class="inf">
      <div class="top"><span class="nm">${CAT[b.k].name}</span><span><span class="am">₹0</span><span class="pc">0%</span></span></div>
      <div class="tr"><div class="fl" style="width:0;background:${CAT[b.k].c}"></div></div></div></div>`,
    ).join('')}</div>`);
  const fcShadow = h(`<div class="ph-shadow" style="width:540px;height:420px;border-radius:60px"></div>`);
  s4cam.appendChild(fcShadow);
  s4cam.appendChild(fcard);
  const fRows = $$('.frow', fcard).map(r => ({ am: $('.am', r), pc: $('.pc', r), fl: $('.fl', r) }));
  const s4text = h(`<div class="feat display" style="left:1345px;top:390px;font-size:116px;line-height:1.04">
    <div><span class="word">See</span> <span class="word">where</span></div><div><span class="word">it</span> <span class="word serif">went.</span></div></div>`);
  s4cam.appendChild(s4text);
  const s4words = $$('.word', s4text);

  // ================================================================== S5 — heads-up
  s5.innerHTML = `
    <div class="glow" style="left:760px;top:0px;width:1200px;height:1080px;background:radial-gradient(closest-side, rgba(14,123,83,0.12), rgba(14,123,83,0))"></div>
    <div id="s5cam" class="abs" style="left:0;top:0;width:1920px;height:1080px;transform-style:preserve-3d"></div>`;
  const s5cam = $('#s5cam');
  const s5shadow = makeShadow(s5cam);
  const ph5 = makePhone(dashboardHTML(false, { added: true }), 'light');
  // add lock screen on top of the dashboard
  $('.scr', ph5.el).insertAdjacentHTML('beforeend', lockHTML());
  const lock5 = $('.lock', ph5.el);
  const notifEls = $$('.nt', ph5.el);
  s5cam.appendChild(ph5.el);
  const s5text = h(`<div class="feat display" style="left:150px;top:292px;font-size:128px;line-height:1.04">
    <div><span class="word">A</span> <span class="word">heads-up</span></div><div><span class="word">before</span> <span class="word">it's</span></div><div><span class="word serif">gone.</span></div></div>`);
  s5cam.appendChild(s5text);
  const s5words = $$('.word', s5text);

  // ================================================================== S6 — dark flip + end card
  s6.innerHTML = `
    <div id="s6bg" class="layer" style="background:radial-gradient(1200px 800px at 50% 70%, #16201B 0%, #0E0E0F 55%, #080808 100%)"></div>
    <div class="glow" id="endGlow" style="left:360px;top:380px;width:1200px;height:900px;background:radial-gradient(closest-side, rgba(46,214,138,0.22), rgba(46,214,138,0))"></div>
    <div id="s6cam" class="abs" style="left:0;top:0;width:1920px;height:1080px;transform-style:preserve-3d"></div>`;
  const s6cam = $('#s6cam');
  const endGlow = $('#endGlow');
  const ph6c = makePhone(dashboardHTML(true, { added: true }), 'dark');
  const ph6l = makePhone(insightsHTML(true), 'dark');
  const ph6r = makePhone(dashboardHTML(true, { sheet: true, added: true }), 'dark');
  s6cam.appendChild(ph6l.el);
  s6cam.appendChild(ph6r.el);
  s6cam.appendChild(ph6c.el);
  const endMark = h(`<div id="endMark" class="display" style="top:70px">${wmHTML()}</div>`);
  const endTag = h(`<div id="endTag" style="top:246px">${'Know where every rupee goes.'.split(' ').map(w => `<span class="word">${w}</span>`).join(' ')}</div>`);
  const endPlat = h(`<div id="endPlat" style="top:312px">iOS&nbsp;&nbsp;·&nbsp;&nbsp;Android</div>`);
  s6.appendChild(endMark);
  s6.appendChild(endTag);
  s6.appendChild(endPlat);
  const endLetters = $$('.lt', endMark);
  const endDot = $('.wm-dot', endMark);
  const endTagWords = $$('.word', endTag);
  const wipeEdge = h(`<div class="wipe-edge"></div>`);
  stage.insertBefore(wipeEdge, flash);

  // static states for end-card side phone (sheet open, amount typed, food selected)
  (() => {
    const r = ph6r.r;
    r.overlay.style.opacity = 1;
    r.amt.textContent = '480';
    r.amtph.style.display = 'none';
    r.caret1.style.display = 'none';
    r.desc.textContent = 'Biryani with the team';
    r.descph.style.display = 'none';
    r.caret2.style.display = 'none';
    const chip = $('[data-chip="food"]', ph6r.el);
    chip.style.background = hexA(CAT.food.c, 0.18);
    chip.style.borderColor = CAT.food.c;
  })();

  // ------------------------------------------------------------------ shared phone path S5 -> S6
  function mainPhone(t) {
    const S5 = C.s5;
    const inP = 1 - E.outCubic(P(t, 15.85, 16.3));
    const drift = E.inOutSine(P(t, 16.3, S5.unlock));
    const toC = E.inOutCubic(P(t, S5.unlock, C.s6.impact));
    const settle = E.outExpo(P(t, C.s6.impact, C.s6.impact + 0.9));
    const floatY = Math.sin(t * 1.1) * 5 * P(t, 20.5, 21.5);
    return {
      x: lerp(lerp(1330, 1318, drift), 960, toC),
      y: lerp(lerp(560, 548, drift), 600, toC) + 1500 * inP + lerp(0, 198, settle) + floatY,
      z: lerp(0, -40, settle),
      rx: lerp(lerp(6, 3, drift), 0, toC) + lerp(0, 4, settle),
      ry: lerp(lerp(-13, -7, drift), 0, toC),
      rz: 0,
      s: lerp(lerp(1.1, 1.14, drift), 1.0, toC),
    };
  }

  // ================================================================== render
  function s3Phone(t) {
    const S = C.s3;
    const enter = E.outExpo(P(t, S.phoneIn, S.phoneIn + 0.9));
    const q = E.inOutSine(P(t, S.phoneIn + 0.85, S.out));
    const whip = E.inCubic(P(t, S.out, S.out + 0.36));
    return {
      x: lerp(1300, 1280, q) - 2700 * whip,
      y: lerp(1600, 545, enter) - 6 * q,
      z: 0,
      rx: lerp(40, 7, enter) - 2 * q,
      ry: lerp(-30, -15, enter) + 7 * q,
      rz: lerp(8, 0, enter),
      s: lerp(1.0, 1.07, q),
    };
  }

  function renderS3(t) {
    const S = C.s3;
    const on = t >= S.phoneIn - 0.05 && t < S.out + 0.45;
    show(s3, on);
    if (!on) return;
    const enter = E.outExpo(P(t, S.phoneIn, S.phoneIn + 0.9));
    const whip = E.inCubic(P(t, S.out, S.out + 0.36));
    const o = s3Phone(t);
    const v = vel(s3Phone, t);
    motionBlur(s3, 'mb3', v.vx, v.vy);
    placePhone(ph3, o);
    placeShadow(s3shadow, o, enter);
    // words
    const T = [S.tapPlus, S.digits[2] + 0.125, S.tracked];
    s3words.forEach((w, i) => {
      const a = T[i] - 0.06;
      const p = E.outExpo(P(t, a, a + 0.6));
      const dim = i < 2 ? 1 - 0.7 * E.outCubic(P(t, T[i + 1] - 0.05, T[i + 1] + 0.3)) : 1;
      w.style.transform = `translate3d(${px(-2700 * whip)},${px(lerp(70, 0, p))},0) scale(${lerp(0.96, 1, p).toFixed(4)})`;
      fx(w, { o: P(t, a, a + 0.18) * dim, blur: 16 * (1 - p) });
    });
    // ---- UI
    const r = ph3.r;
    const plusPos = screenPos(r.addbtn, ph3.screen);
    const foodChip = $('[data-chip="food"]', ph3.el);
    const foodPos = screenPos(foodChip, ph3.screen);
    const btnPos = screenPos(r.sbtn, ph3.screen);
    const press = Math.exp(-Math.pow((t - S.tapPlus) / 0.06, 2));
    r.addbtn.style.transform = `translateY(-4px) scale(${(1 - 0.12 * press).toFixed(3)})`;
    const open = E.outExpo(P(t, S.tapPlus + 0.05, S.tapPlus + 0.6));
    const close = E.inOutCubic(P(t, S.tapAdd + 0.1, S.tapAdd + 0.45));
    r.overlay.style.opacity = (open * (1 - close)).toFixed(3);
    r.sheet.style.transform = `translateY(${(lerp(108, 0, open) + 108 * close).toFixed(2)}%)`;
    // amount typing
    const typed = S.digits.filter(d => TXT_T >= d).length;
    r.amt.textContent = '480'.slice(0, typed);
    r.amtph.style.display = typed ? 'none' : '';
    const lastD = typed ? S.digits[typed - 1] : 0;
    const pop = typed ? 1 + 0.12 * Math.exp(-(t - lastD) / 0.05) : 1;
    r.amt.style.display = 'inline-block';
    r.amt.style.transform = `scale(${pop.toFixed(3)})`;
    r.amt.style.transformOrigin = '0 70%';
    const blink = Math.floor(t * 2.2) % 2 === 0 ? 1 : 0;
    const inDesc = t >= S.descStart;
    r.caret1.style.opacity = !inDesc ? (typed > 0 && t - lastD < 0.4 ? 1 : blink) : 0;
    const nch = Math.floor(21 * P(TXT_T, S.descStart, S.descEnd));
    r.desc.textContent = 'Biryani with the team'.slice(0, nch);
    r.descph.style.display = nch ? 'none' : '';
    r.caret2.style.opacity = inDesc && t < S.tapFood ? 1 : 0;
    const sel = P(t, S.tapFood, S.tapFood + 0.12);
    foodChip.style.background = sel > 0 ? hexA(CAT.food.c, 0.15 * sel) : '';
    foodChip.style.borderColor = sel > 0 ? CAT.food.c : '';
    foodChip.style.transform = `scale(${(1 - 0.06 * Math.exp(-Math.pow((t - S.tapFood) / 0.05, 2))).toFixed(3)})`;
    r.sbtn.style.transform = `scale(${(1 - 0.04 * Math.exp(-Math.pow((t - S.tapAdd) / 0.05, 2))).toFixed(3)})`;
    // touches
    if (t < S.tapPlus + 0.5) touchAt(ph3, t, plusPos, S.tapPlus);
    else if (t < S.tapFood + 0.13) touchAt(ph3, t, foodPos, S.tapFood);
    else {
      const m = E.inOutCubic(P(t, S.tapFood + 0.05, S.tapAdd - 0.06));
      touchAt(ph3, t, { x: lerp(foodPos.x, btnPos.x, m), y: lerp(foodPos.y, btnPos.y, m) }, S.tapAdd, S.tapFood + 0.05);
    }
    // tracked: card lands, totals count
    const land = E.outExpo(P(t, S.tracked, S.tracked + 0.6));
    r.newcard.style.width = px(148 * land);
    r.newcard.style.marginRight = px(-10 * (1 - land));
    r.newcard.style.padding = land < 0.02 ? '12px 0' : '';
    r.newcard.style.opacity = P(t, S.tracked + 0.08, S.tracked + 0.3).toFixed(3);
    const cnt = E.outCubic(P(t, S.tracked + 0.05, S.tracked + 0.75));
    const total = lerp(24380, 24860, E.outCubic(P(TXT_T, S.tracked + 0.05, S.tracked + 0.75)));
    r.total.textContent = inr(total);
    const hp = Math.exp(-Math.pow((t - S.tracked - 0.25) / 0.2, 2));
    r.total.style.display = 'inline-block';
    r.total.style.transform = `scale(${(1 + 0.05 * hp).toFixed(3)})`;
    r.total.style.transformOrigin = '0 60%';
    r.total.style.color = hp > 0.02 ? `color-mix(in srgb, var(--accent) ${(hp * 100).toFixed(0)}%, var(--ink))` : '';
    r.count.textContent = `${TXT_T >= S.tracked + 0.1 ? 38 : 37} transactions`;
    r.pct.textContent = `${TXT_T >= S.tracked + 0.4 ? 62 : 61}% used`;
    r.bfill.style.width = `${lerp(60.95, 62.15, cnt).toFixed(3)}%`;
    r.left.textContent = `₹${inr(40000 - total)} left`;
  }

  function renderS4(t) {
    const S = C.s4;
    const on = t >= C.s3.out + 0.15 && t < S.out + 0.45;
    show(s4, on);
    if (!on) return;
    const inP = 1 - E.outCubic(P(t, C.s3.out + 0.2, C.s3.out + 0.66));
    const q = E.inOutSine(P(t, S.in + 0.3, S.out));
    const whip = E.inCubic(P(t, S.out, S.out + 0.36));
    const dx = 2700 * inP;
    const dy = -1500 * whip;
    const s4off = tt => ({ x: 2700 * (1 - E.outCubic(P(tt, C.s3.out + 0.2, C.s3.out + 0.66))), y: -1500 * E.inCubic(P(tt, S.out, S.out + 0.36)) });
    const v4 = vel(s4off, t);
    motionBlur(s4, 'mb4', v4.vx, v4.vy);
    const o = { x: 560 + dx, y: 545 + dy + 8 * q, z: 0, rx: 6 - 2 * q, ry: 18 - 6 * q, rz: 0, s: lerp(1.0, 1.04, q) };
    placePhone(ph4, o);
    placeShadow(s4shadow, o, 1);
    // in-phone animations
    const bars = $$('[data-bar]', ph4.el);
    bars.forEach((b, i) => {
      const a = S.in + 0.05 + i * 0.04;
      b.style.height = px(parseFloat(b.dataset.h) * E.outExpo(P(t, a, a + 0.55)));
    });
    ph4.r.snap.textContent = inr(TOTAL * E.outExpo(P(TXT_T, S.in, S.in + 0.9)));
    // floating card lifts out of the phone
    const lift = E.outExpo(P(t, S.in + 0.15, S.in + 0.85));
    const fo = {
      x: lerp(600, 955, lift) + dx + 6 * q,
      y: lerp(760, 625, lift) + dy - 10 * q,
      z: lerp(-20, 150, lift),
      rx: lerp(6, 3, lift),
      ry: lerp(18, -5, lift) + 3 * q,
      rz: lerp(0, -1.5, lift),
      s: lerp(0.62, 1, lift),
    };
    const fcH = fcard.offsetHeight;
    tf(fcard, { ...fo, w: 540, hh: fcH });
    fcard.style.opacity = P(t, S.in + 0.15, S.in + 0.3).toFixed(3);
    tf(fcShadow, { x: fo.x + 30, y: fo.y + 60, z: fo.z - 200, rx: fo.rx, ry: fo.ry, s: fo.s * 0.92, w: 540, hh: 420 });
    fcShadow.style.opacity = (0.3 * lift).toFixed(3);
    ph4.r.brk.style.opacity = (1 - 0.75 * lift).toFixed(3);
    const tot = BREAK.reduce((s, b) => s + b.a, 0);
    BREAK.forEach((b, i) => {
      const a = S.bars[i];
      const p = E.outExpo(P(t, a - 0.05, a + 0.75));
      fRows[i].fl.style.width = `${((b.a / BREAK[0].a) * 100 * p).toFixed(2)}%`;
      const pt = E.outExpo(P(TXT_T, a - 0.05, a + 0.75));
      fRows[i].am.textContent = `₹${inr(b.a * pt)}`;
      fRows[i].pc.textContent = `${Math.round((b.a / TOTAL) * 100 * pt)}%`;
    });
    void tot;
    s4words.forEach((w, i) => {
      const a = S.in + 0.22 + i * 0.07 + (i >= 2 ? 0.08 : 0);
      const p = E.outExpo(P(t, a, a + 0.65));
      w.style.transform = `translate3d(${px(dx)},${px(lerp(60, 0, p) + dy)},0)`;
      fx(w, { o: P(t, a, a + 0.2), blur: 14 * (1 - p) });
    });
  }

  function renderS5(t) {
    const S = C.s5;
    const on = t >= C.s4.out + 0.15 && t < C.s6.impact + 0.3;
    show(s5, on);
    if (!on) return;
    const o = mainPhone(t);
    placePhone(ph5, o);
    placeShadow(s5shadow, o, 1 - P(t, S.unlock, C.s6.impact));
    const inDy = 1500 * (1 - E.outCubic(P(t, 15.85, 16.3)));
    const v5 = vel(tt => ({ x: 0, y: 1500 * (1 - E.outCubic(P(tt, 15.85, 16.3))) }), t);
    motionBlur(s5, 'mb5', v5.vx, v5.vy);
    // notifications stack (newest on top)
    const hts = notifEls.map(n => n.offsetHeight);
    const arr = S.notifs.map(a => E.outExpo(P(t, a, a + 0.55)));
    notifEls.forEach((n, i) => {
      let y = 0;
      for (let j = i + 1; j < notifEls.length; j++) y += (hts[j] + 10) * arr[j];
      const a = arr[i];
      n.style.transform = `translateY(${px(y - 50 * (1 - a))}) scale(${lerp(0.92, 1, a).toFixed(4)})`;
      n.style.opacity = P(t, S.notifs[i], S.notifs[i] + 0.12).toFixed(3);
    });
    const un = E.inOutCubic(P(t, S.unlock, S.unlock + 0.38));
    lock5.style.transform = `translateY(${(-102 * un).toFixed(2)}%)`;
    // text
    const tout = E.inCubic(P(t, S.unlock, S.unlock + 0.3));
    s5words.forEach((w, i) => {
      const a = 16.2 + i * 0.06 + (i >= 2 ? 0.06 : 0) + (i >= 4 ? 0.06 : 0);
      const p = E.outExpo(P(t, a, a + 0.65));
      w.style.transform = `translate3d(${px(-60 * tout)},${px(lerp(60, 0, p) + inDy)},0)`;
      fx(w, { o: P(t, a, a + 0.2) * (1 - tout), blur: 14 * (1 - p) + 10 * tout });
    });
  }

  function renderS6(t) {
    const S = C.s6;
    const on = t >= S.flip - 0.05;
    show(s6, on);
    show(wipeEdge, t >= S.flip - 0.05 && t < S.flip + 0.6);
    if (!on) return;
    // wipe
    const wp = E.inOutCubic(P(t, S.flip, S.flip + 0.5));
    const xw = lerp(-520, 2440, wp);
    if (wp < 1) s6.style.clipPath = `polygon(0 0, ${px(xw + 260)} 0, ${px(xw - 260)} 1080px, 0 1080px)`;
    else s6.style.clipPath = 'none';
    wipeEdge.style.left = px(xw);
    wipeEdge.style.transform = 'rotate(25.7deg)';
    wipeEdge.style.opacity = (Math.sin(Math.PI * clamp(wp * 1.02)) * 0.95).toFixed(3);
    // phones
    const o = mainPhone(t);
    placePhone(ph6c, o);
    const side = E.outExpo(P(t, S.impact + 0.04, S.impact + 1.0));
    const fl = k => Math.sin(t * 1.0 + k) * 6 * P(t, 20.6, 21.6);
    placePhone(ph6l, { x: lerp(-360, 470, side), y: 850 + fl(1), z: -230, rx: 4, ry: 24, rz: -2.5, s: 0.96 });
    placePhone(ph6r, { x: lerp(2280, 1450, side), y: 850 + fl(2), z: -230, rx: 4, ry: -24, rz: 2.5, s: 0.96 });
    // camera push
    const push = E.inOutSine(P(t, S.impact + 0.6, S.fadeOut + 0.45));
    tf(s6cam, { x: 960, y: 540, s: 1 + 0.03 * push, w: 1920, hh: 1080 });
    endGlow.style.opacity = E.outCubic(P(t, S.impact, S.impact + 1.2)).toFixed(3);
    // type
    endLetters.forEach((l, i) => {
      const p = E.outExpo(P(t, S.impact + 0.08 + i * 0.045, S.impact + 0.08 + i * 0.045 + 0.75));
      l.style.transform = `translateY(${lerp(105, 0, p).toFixed(2)}%)`;
    });
    const d = dotMotion(t, S.dot);
    endDot.style.transformOrigin = '50% 100%';
    endDot.style.transform = `translateY(${px(d.y * 0.6)}) scale(${d.sx.toFixed(3)},${d.sy.toFixed(3)})`;
    endDot.style.opacity = d.o;
    endTagWords.forEach((w, i) => {
      const a = S.impact + 0.55 + i * 0.06;
      const p = E.outExpo(P(t, a, a + 0.65));
      w.style.transform = `translateY(${px(lerp(22, 0, p))})`;
      fx(w, { o: P(t, a, a + 0.22), blur: 10 * (1 - p) });
    });
    const pp = E.outExpo(P(t, S.impact + 0.95, S.impact + 1.6));
    endPlat.style.transform = `translateY(${px(lerp(14, 0, pp))})`;
    fx(endPlat, { o: P(t, S.impact + 0.95, S.impact + 1.2), blur: 6 * (1 - pp) });
    const ts = 1 + 0.012 * push;
    [endMark, endTag, endPlat].forEach(el => {
      el.style.scale = ts.toFixed(4);
    });
  }

  function renderGlobal(t) {
    show(bgPaper, t >= C.hook.drop - 0.001);
    const fl = 1 - E.outCubic(P(t, C.hook.drop, C.hook.drop + 0.5));
    flash.style.opacity = t >= C.hook.drop ? fl.toFixed(3) : '0';
    fade.style.opacity = E.inOutSine(P(t, C.s6.fadeOut, C.s6.end)).toFixed(3);
  }

  function renderAt(t, samples, frameT) {
    CUR_SAMPLES = samples || samplesAt(t);
    TXT_T = frameT ?? t;
    renderGlobal(t);
    renderHook(t);
    renderReveal(t);
    renderS3(t);
    renderS4(t);
    renderS5(t);
    renderS6(t);
  }

  // motion-blur sample counts: more sub-frames where things move fast
  const BLUR_WINDOWS = [
    [0.45, 1.95, 5, 0.5],
    [C.hook.collapse - 0.1, C.hook.drop, 8, 0.5],
    [C.reveal.dot - 0.22, C.reveal.dot + 0.05, 10, 0.5],
    [C.reveal.out, C.s3.phoneIn + 0.7, 6, 0.5],
    [C.s3.tapPlus, C.s3.tapPlus + 0.35, 3, 0.5],
    [C.s3.tapAdd + 0.1, C.s3.tapAdd + 0.45, 4, 0.5],
    [C.s3.out, C.s3.out + 0.7, 6, 1.0],
    [C.s4.in + 0.1, C.s4.in + 0.6, 5, 0.5],
    [C.s4.out, C.s4.out + 0.7, 6, 1.0],
    [C.s5.unlock, C.s6.flip + 0.55, 6, 0.5],
    [C.s6.impact, C.s6.impact + 0.45, 8, 0.5],
    [C.s6.impact + 0.45, C.s6.impact + 0.8, 4, 0.5],
    [C.s6.dot - 0.22, C.s6.dot + 0.05, 8, 0.5],
  ];
  function samplesAt(t) {
    let n = 1;
    let shutter = 0.5;
    for (const [a, b, k, sh] of BLUR_WINDOWS)
      if (t >= a && t <= b) {
        if (k > n) {
          n = k;
          shutter = sh;
        }
      }
    return { n, shutter };
  }

  async function init() {
    await document.fonts.ready;
    await Promise.all(['800 300px Hanken', '400 100px Serif', '800 40px Rupee', '700 20px Hanken', '600 20px Hanken', '500 20px Hanken', '400 20px Hanken'].map(f => document.fonts.load(f, '₹0aA')));
    // fixed-width digits for the counter
    const probe = h(`<span style="position:absolute;visibility:hidden;font-weight:800;font-size:300px;letter-spacing:-0.04em"></span>`);
    hookNum.appendChild(probe);
    for (const d of '0123456789') {
      probe.textContent = d;
      DIGIT_W = Math.max(DIGIT_W, probe.getBoundingClientRect().width);
    }
    probe.textContent = ',';
    COMMA_W = probe.getBoundingClientRect().width;
    probe.remove();
    renderAt(0);
    window.READY = true;
  }
  window.renderAt = renderAt;
  window.samplesAt = samplesAt;
  init();

  const q = new URLSearchParams(location.search);
  if (q.has('t')) setTimeout(() => renderAt(parseFloat(q.get('t'))), 300);
})();
