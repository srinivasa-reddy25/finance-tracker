/* Paisa landing page behaviour. Every number here is sample data for one person's September. */
;(function () {
  'use strict'

  var reduce =
    window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
  var hasGsap = !!window.gsap
  var $ = function (s, r) {
    return (r || document).querySelector(s)
  }
  var $$ = function (s, r) {
    return [].slice.call((r || document).querySelectorAll(s))
  }
  var clamp = function (v, a, b) {
    return Math.max(a, Math.min(b, v))
  }
  var fmt = function (n) {
    return Math.round(n).toLocaleString('en-IN')
  }
  var rs = function (n) {
    return '₹' + fmt(n)
  }

  var CATS = {
    food: 'Food & Dining',
    transport: 'Transport',
    fun: 'Entertainment',
    health: 'Health',
    shop: 'Shopping',
    bills: 'Bills & Utilities',
    others: 'Others'
  }
  var ORDER = ['food', 'transport', 'fun', 'health', 'shop', 'bills', 'others']
  var PLAY_URL =
    'https://play.google.com/store/apps/details?id=com.tejareddy.financetracker'

  if (!reduce) document.documentElement.classList.add('anim')

  /* ---------------- smooth scroll + ScrollTrigger ---------------- */
  var lenis = null
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger)
  if (!reduce && window.Lenis && hasGsap) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenis.on('scroll', function () {
      if (window.ScrollTrigger) ScrollTrigger.update()
    })
    gsap.ticker.add(function (t) {
      lenis.raf(t * 1000)
    })
    gsap.ticker.lagSmoothing(0)
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href')
      var el = id.length > 1 ? document.querySelector(id) : null
      if (!el) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(el, { offset: 0 })
      else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
    })
  })

  /* ---------------- nav: colour follows the section under it, hides on the way down ---------------- */
  var nav = $('#nav')
  var sections = $$('main > section')
  var lastY = window.scrollY
  function navTick() {
    var y = window.scrollY
    var probe = 36
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect()
      if (r.top <= probe && r.bottom > probe) {
        nav.setAttribute(
          'data-on',
          sections[i].getAttribute('data-theme') || 'paper'
        )
        break
      }
    }
    var d = y - lastY
    if (y > window.innerHeight * 0.8 && d > 6) nav.classList.add('hide')
    else if (d < -6 || y < 200) nav.classList.remove('hide')
    lastY = y
  }
  window.addEventListener('scroll', navTick, { passive: true })
  navTick()

  /* ---------------- word rise for headlines ---------------- */
  function splitWords(el) {
    var words = el.textContent.split(' ')
    el.textContent = ''
    words.forEach(function (w, i) {
      var o = document.createElement('span')
      o.className = 'w-rise'
      var n = document.createElement('span')
      n.textContent = w
      n.style.setProperty('--i', i)
      o.appendChild(n)
      el.appendChild(o)
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '))
    })
  }
  var h1 = $('#hero-t')
  if (!reduce) {
    splitWords($('.main', h1))
    splitWords($('.alt', h1))
    h1.setAttribute('aria-label', 'Where did it all go?')
  }

  /* ================= HERO: the month as a pile ================= */
  var hero = $('.hero')
  var pile = $('#pile')
  var chart = $('#chart')
  var sortBtn = $('#sortBtn')

  var MONTH = {
    // 1–25 Sep totals and budgets
    food: [10240, 9000],
    transport: [4380, 5000],
    fun: [2410, 2500],
    health: [1470, 3000],
    shop: [7990, 6500],
    bills: [7368, 9000],
    others: [2930, 5000]
  }
  var SLIPS = [
    ['fun', 649, 'Streaming plan'],
    ['food', 2460, 'Groceries'],
    ['transport', 690, 'Cab to airport'],
    ['others', 501, 'Shagun envelope'],
    ['shop', 1899, 'Kurta'],
    ['transport', 500, 'Metro top-up'],
    ['food', 780, 'Pizza night'],
    ['bills', 349, 'Recharge'],
    ['food', 90, 'Dosa'],
    ['health', 250, 'Gym day pass'],
    ['others', 300, 'Haircut'],
    ['shop', 399, 'Phone cover'],
    ['food', 240, 'Office lunch'],
    ['bills', 999, 'Broadband'],
    ['transport', 1000, 'Petrol'],
    ['others', 1500, 'Gift for Amma']
  ]

  // chart
  var maxV = 0
  ORDER.forEach(function (k) {
    maxV = Math.max(maxV, MONTH[k][0], MONTH[k][1])
  })
  ORDER.forEach(function (k, i) {
    var b = document.createElement('div')
    b.className = 'bar'
    b.setAttribute('data-cat', k)
    b.style.setProperty('--dl', i * 0.07 + 's')
    var over = MONTH[k][0] - MONTH[k][1]
    b.innerHTML =
      '<div class="meta"><span>' +
      CATS[k] +
      '</span><b class="num">' +
      rs(MONTH[k][0]) +
      '</b>' +
      (over > 0 ? '<em class="over">' + rs(over) + ' over</em>' : '') +
      '</div><div class="fill"></div><div class="budget" title="Budget"></div>'
    b.setAttribute(
      'aria-label',
      CATS[k] + ' ' + rs(MONTH[k][0]) + ' of ' + rs(MONTH[k][1]) + ' budget'
    )
    chart.appendChild(b)
  })
  function layoutChart() {
    var H = chart.clientHeight
    var room = H * 0.66
    $$('.bar', chart).forEach(function (b) {
      var k = b.getAttribute('data-cat')
      b.style.setProperty(
        '--hgt',
        Math.max(8, (MONTH[k][0] / maxV) * room) + 'px'
      )
      b.style.setProperty('--bud', (MONTH[k][1] / maxV) * room + 'px')
      b.style.setProperty(
        '--top',
        (Math.max(MONTH[k][0], MONTH[k][1]) / maxV) * room + 'px'
      )
    })
  }
  layoutChart()

  // slips
  var narrow = window.innerWidth < 700
  var slipData = narrow ? SLIPS.slice(0, 9) : SLIPS
  var slipEls = slipData.map(function (d, i) {
    var el = document.createElement('div')
    el.className = 'slip'
    el.setAttribute('data-cat', d[0])
    el.innerHTML =
      '<span class="amt num">' +
      rs(d[1]) +
      '</span><span class="lbl">' +
      d[2] +
      '</span>'
    el._cat = d[0]
    el._amt = d[1]
    el.style.setProperty('--r', ((i * 37) % 19) - 9 + 'deg')
    pile.appendChild(el)
    return el
  })
  var objEls = [] // photo objects are added by addObjects() when images exist

  function sizeSlips() {
    var W = hero.clientWidth
    var s = clamp(W / 1280, 0.64, 1.06)
    slipEls.forEach(function (el) {
      var w = (86 + 24 * Math.log10(el._amt)) * s,
        h = w * 0.52
      el._w = w
      el._h = h
      el.style.setProperty('--w', w.toFixed(1) + 'px')
      el.style.setProperty('--h', h.toFixed(1) + 'px')
      el.style.setProperty('--fs', (h * 0.36).toFixed(1) + 'px')
    })
  }
  sizeSlips()

  var M = window.Matter,
    engine = null,
    bodies = [],
    grab = null,
    running = false,
    visible = true,
    raf = 0,
    sorted = false,
    statics = []

  function syncEl(b) {
    var el = b.plugin.el
    el.style.transform =
      'translate(' +
      (b.position.x - el._w / 2).toFixed(1) +
      'px,' +
      (b.position.y - el._h / 2).toFixed(1) +
      'px) rotate(' +
      b.angle.toFixed(4) +
      'rad)'
  }
  function buildWalls() {
    if (statics.length) M.Composite.remove(engine.world, statics)
    var W = pile.clientWidth,
      H = pile.clientHeight,
      T = 400
    statics = [
      M.Bodies.rectangle(W / 2, H + T / 2 - 2, W + 2 * T, T, {
        isStatic: true,
        friction: 0.8
      }),
      M.Bodies.rectangle(-T / 2, H / 2 - H, T, H * 4, { isStatic: true }),
      M.Bodies.rectangle(W + T / 2, H / 2 - H, T, H * 4, { isStatic: true })
    ]
    M.Composite.add(engine.world, statics)
  }
  function startPhysics() {
    engine = M.Engine.create({ enableSleeping: true })
    engine.gravity.y = 1.15
    buildWalls()
    var W = pile.clientWidth,
      H = pile.clientHeight
    var floorTop = H - $('.hero-floor').clientHeight
    var all = slipEls.concat(objEls)
    all.forEach(function (el, i) {
      var x = clamp(W * (0.06 + 0.88 * ((i * 0.618) % 1)), el._w, W - el._w)
      var y = floorTop - 200 - (i % 6) * 90 - Math.floor(i / 6) * 60
      var body =
        el._shape === 'circle'
          ? M.Bodies.circle(x, y, (el._w / 2) * 0.86, {
              restitution: 0.2,
              friction: 0.5,
              frictionAir: 0.012,
              density: 0.0022
            })
          : M.Bodies.rectangle(x, y, el._w, el._h, {
              chamfer: { radius: Math.min(12, el._h * 0.2) },
              restitution: 0.14,
              friction: 0.45,
              frictionAir: 0.014,
              density: 0.002
            })
      M.Body.setAngle(body, (Math.random() - 0.5) * 0.9)
      M.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 3,
        y: 2 + Math.random() * 4
      })
      body.plugin.el = el
      el._body = body
      bodies.push(body)
      el.style.opacity = '0'
      setTimeout(
        function () {
          M.Composite.add(engine.world, body)
          el.style.opacity = ''
          syncEl(body)
        },
        250 + i * 55
      )
    })
    running = true
    var last = performance.now(),
      acc = 0,
      step = 1000 / 60
    var loop = function (now) {
      raf = requestAnimationFrame(loop)
      if (!running || !visible) {
        last = now
        return
      }
      acc += Math.min(64, now - last)
      last = now
      while (acc >= step) {
        M.Engine.update(engine, step)
        acc -= step
      }
      var Hh = pile.clientHeight,
        Ww = pile.clientWidth
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i]
        if (
          b.position.y > Hh + 300 ||
          b.position.x < -300 ||
          b.position.x > Ww + 300
        ) {
          M.Body.setPosition(b, {
            x: Ww / 2 + (Math.random() - 0.5) * 200,
            y: -100
          })
          M.Body.setVelocity(b, { x: 0, y: 0 })
        }
        if (!b.isSleeping || grab) syncEl(b)
      }
    }
    raf = requestAnimationFrame(loop)

    // grab and throw: a spring from the pointer to the slip, so page scrolling still works everywhere else
    var local = function (e) {
      var r = pile.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    var trail = []
    pile.addEventListener('pointerdown', function (e) {
      var el = e.target.closest('.slip, .obj')
      if (!el || !el._body || sorted) return
      e.preventDefault()
      var p = local(e),
        b = el._body
      M.Sleeping.set(b, false)
      grab = M.Constraint.create({
        pointA: p,
        bodyB: b,
        pointB: { x: p.x - b.position.x, y: p.y - b.position.y },
        stiffness: 0.18,
        damping: 0.12,
        length: 0
      })
      M.Composite.add(engine.world, grab)
      el.style.zIndex = 10
      el.style.cursor = 'grabbing'
      grab._el = el
      grab._id = e.pointerId
      trail = []
      bodies.forEach(function (o) {
        M.Sleeping.set(o, false)
      })
      pileCap.classList.add('used')
    })
    window.addEventListener('pointermove', function (e) {
      if (!grab || e.pointerId !== grab._id) return
      grab.pointA = local(e)
    })
    var drop = function (e) {
      if (!grab || e.pointerId !== grab._id) return
      var b = grab.bodyB
      M.Composite.remove(engine.world, grab)
      M.Body.setVelocity(b, {
        x: clamp(b.velocity.x, -38, 38),
        y: clamp(b.velocity.y, -38, 38)
      })
      grab._el.style.zIndex = ''
      grab._el.style.cursor = ''
      grab = null
    }
    window.addEventListener('pointerup', drop)
    window.addEventListener('pointercancel', drop)
    if ('IntersectionObserver' in window)
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting
      }).observe(hero)
    var rw = pile.clientWidth
    window.addEventListener('resize', function () {
      if (Math.abs(pile.clientWidth - rw) < 40) return
      rw = pile.clientWidth
      buildWalls()
      bodies.forEach(function (b) {
        M.Sleeping.set(b, false)
        M.Body.setPosition(b, {
          x: clamp(b.position.x, 40, rw - 40),
          y: Math.min(b.position.y, pile.clientHeight - 60)
        })
      })
    })
  }
  var pileCap = $('#pileCap')

  function barTop(k) {
    var bar = $('.bar[data-cat="' + k + '"]', chart),
      fill = $('.fill', bar)
    var pr = pile.getBoundingClientRect(),
      br = bar.getBoundingClientRect()
    return {
      x: br.left - pr.left + br.width / 2,
      y:
        br.bottom -
        pr.top -
        parseFloat(getComputedStyle(bar).getPropertyValue('--hgt'))
    }
  }
  function doSort(on) {
    sorted = on
    hero.classList.toggle('sorted', on)
    sortBtn.setAttribute('aria-pressed', on ? 'true' : 'false')
    sortBtn.textContent = on ? 'Make a mess again' : 'Sort my month'
    h1.setAttribute(
      'aria-label',
      on ? "There. That's where." : 'Where did it all go?'
    )
    if (!reduce) {
      var span = $(on ? '.alt' : '.main', h1)
      span.style.display = 'none'
      void span.offsetWidth
      span.style.display = ''
    }
    if (!engine || !hasGsap) {
      pile.style.visibility = on ? 'hidden' : ''
      return
    }
    var all = slipEls.concat(objEls)
    if (on) {
      running = false
      if (grab) {
        M.Composite.remove(engine.world, grab)
        grab = null
      }
      all.forEach(function (el, i) {
        var b = el._body,
          t = barTop(el._cat)
        var st = { x: b.position.x, y: b.position.y, a: b.angle, s: 1, o: 1 }
        gsap.to(st, {
          x: t.x,
          y: t.y,
          a: 0,
          s: 0.3,
          o: 0,
          duration: 0.75,
          delay: 0.02 * i,
          ease: 'power3.in',
          onUpdate: function () {
            el.style.transform =
              'translate(' +
              (st.x - el._w / 2) +
              'px,' +
              (st.y - el._h / 2) +
              'px) rotate(' +
              st.a +
              'rad) scale(' +
              st.s +
              ')'
            el.style.opacity = st.o
          }
        })
      })
    } else {
      all.forEach(function (el, i) {
        var b = el._body,
          t = barTop(el._cat)
        M.Sleeping.set(b, false)
        M.Body.setPosition(b, {
          x: t.x + (Math.random() - 0.5) * 30,
          y: t.y - 20
        })
        M.Body.setAngle(b, (Math.random() - 0.5) * 1.2)
        M.Body.setVelocity(b, {
          x: (Math.random() - 0.5) * 16,
          y: -12 - Math.random() * 14
        })
        M.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.3)
        el.style.opacity = '1'
        syncEl(b)
      })
      running = true
    }
  }
  sortBtn.addEventListener('click', function () {
    doSort(!sorted)
  })

  function initPile() {
    if (reduce || !M) {
      pile.classList.add('static')
      return
    }
    startPhysics()
  }

  /* photo objects (from the generated set) join the pile when present */
  var OBJECTS = [
    ['chai', 'food', 20, 1.0],
    ['auto', 'transport', 140, 1.3],
    ['biryani', 'food', 389, 1.25],
    ['lpg', 'bills', 903, 1.2],
    ['medicine', 'health', 320, 1.1],
    ['popcorn', 'fun', 560, 1.1],
    ['chappal', 'shop', 1299, 1.25],
    ['bulb', 'bills', 1850, 1.0],
    ['marigold', 'others', 101, 1.15]
  ]
  function addObjects(done) {
    var list = narrow ? OBJECTS.slice(0, 5) : OBJECTS
    var left = list.length,
      ok = []
    list.forEach(function (o) {
      var img = new Image()
      img.onload = function () {
        var el = document.createElement('div')
        el.className = 'obj'
        el.setAttribute('data-cat', o[1])
        var base = clamp(hero.clientWidth / 1280, 0.62, 1.05) * 118 * o[3]
        var ar = img.naturalWidth / img.naturalHeight
        el._w = ar >= 1 ? base : base * ar
        el._h = ar >= 1 ? base / ar : base
        el._cat = o[1]
        el._amt = o[2]
        el.style.setProperty('--w', el._w + 'px')
        el.style.setProperty('--h', el._h + 'px')
        img.alt = ''
        el.appendChild(img)
        var tag = document.createElement('span')
        tag.className = 'tag num'
        tag.textContent = rs(o[2])
        el.appendChild(tag)
        ok.push(el)
        if (--left === 0) finish()
      }
      img.onerror = function () {
        if (--left === 0) finish()
      }
      img.src = 'img/' + o[0] + '.webp'
    })
    function finish() {
      ok.forEach(function (el) {
        pile.appendChild(el)
        objEls.push(el)
      })
      done()
    }
  }
  addObjects(initPile)

  /* ================= CHAIN ================= */
  var LINES = [
    ['Mon 1 Sep · 9:12 am', 'Chai outside the office', 20, 'food'],
    [
      'Mon 1 Sep · 6:40 pm',
      'Auto home. The metro was packed.',
      140,
      'transport'
    ],
    ['Wed 3 Sep · 11:48 pm', 'Biryani, after a long day', 389, 'food'],
    ['Fri 5 Sep · 1:15 pm', 'Kolhapuris, 40% off', 1299, 'shop'],
    ['Sat 6 Sep · 12:00 am', 'A streaming plan renewed itself', 649, 'fun'],
    ['Tue 9 Sep · 8:05 pm', 'Pharmacy', 320, 'health'],
    ['Thu 11 Sep · 10:10 am', 'Electricity bill', 1850, 'bills'],
    ['Sat 13 Sep · 9:30 pm', 'Movie, plus popcorn', 560, 'fun'],
    ['Wed 16 Sep · 7:20 am', 'Gas cylinder', 903, 'bills'],
    ['Mon 21 Sep · 11:00 am', 'Groceries for the week', 2460, 'food'],
    ['2–25 Sep', '48 more, just as small', 28198, 'others', true]
  ]
  var linesEl = $('#lines'),
    countV = $('#countV'),
    countBar = $('#countBar'),
    counter = $('#counter')
  var cum = 0,
    sums = []
  LINES.forEach(function (l) {
    cum += l[2]
    sums.push(cum)
    var li = document.createElement('li')
    li.className = 'line' + (l[4] ? ' more' : '')
    li.setAttribute('data-cat', l[3])
    li.innerHTML =
      '<span class="when">' +
      l[0].replace(' · ', '<br>') +
      '</span><span class="what">' +
      l[1] +
      '</span><span class="amt">' +
      rs(l[2]) +
      '</span>'
    linesEl.appendChild(li)
  })
  var shown = { v: 0 }
  function setCount(v) {
    countV.textContent = rs(v)
    countBar.style.setProperty('--p', clamp(v / 40000, 0, 1))
    counter.classList.toggle('hot', v >= 32000)
  }
  function countTo(target) {
    if (!hasGsap || reduce) {
      shown.v = target
      setCount(target)
      return
    }
    gsap.to(shown, {
      v: target,
      duration: 0.9,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: function () {
        setCount(shown.v)
      }
    })
  }
  var lineEls = $$('.line', linesEl)
  if (reduce || !window.ScrollTrigger) {
    lineEls.forEach(function (li) {
      li.classList.add('on')
    })
    setCount(cum)
  } else {
    setCount(0)
    lineEls.forEach(function (li, i) {
      ScrollTrigger.create({
        trigger: li,
        start: 'top 72%',
        onEnter: function () {
          li.classList.add('on')
          countTo(sums[i])
        },
        onLeaveBack: function () {
          li.classList.remove('on')
          countTo(i ? sums[i - 1] : 0)
        }
      })
    })
  }

  /* ================= SHARED MONTH (try-it + widgets) ================= */
  var BUDGET = 40000
  var BASE = {
    food: 6910,
    transport: 3020,
    fun: 1649,
    health: 1120,
    shop: 5210,
    bills: 5251,
    others: 1700
  }
  var state = {
    cats: Object.assign({}, BASE),
    today: 460,
    added: 0,
    addedAmt: 0,
    warned: false,
    over: false
  }
  var listeners = []
  function total() {
    var t = 0
    ORDER.forEach(function (k) {
      t += state.cats[k]
    })
    return t
  }
  function logSpend(amt, label, cat, from) {
    var before = (total() / BUDGET) * 100
    state.cats[cat] += amt
    state.today += amt
    state.added++
    state.addedAmt += amt
    var pct = (total() / BUDGET) * 100
    listeners.forEach(function (f) {
      f({ amt: amt, label: label, cat: cat, from: from })
    })
    if (pct >= 100 && !state.over) {
      state.over = true
      state.warned = true
      toast(
        'over',
        'Budget limit reached!',
        "You've spent " + rs(total()) + ' — 100% of your monthly budget.'
      )
    } else if (pct >= 80 && before < 80 && !state.warned) {
      state.warned = true
      toast(
        'warn',
        'Approaching budget limit',
        "You've used " +
          Math.round(pct) +
          '% of your monthly budget. Spent ' +
          rs(total()) +
          '.'
      )
    }
  }
  function resetMonth() {
    state.cats = Object.assign({}, BASE)
    state.today = 460
    state.added = 0
    state.addedAmt = 0
    state.warned = false
    state.over = false
    listeners.forEach(function (f) {
      f(null)
    })
  }

  /* toasts */
  var toasts = $('#toasts')
  function toast(kind, t, b) {
    var n = document.createElement('div')
    n.className = 'note ' + kind
    n.setAttribute('role', 'status')
    n.innerHTML =
      '<span class="ic" aria-hidden="true">P</span><span class="app">Paisa · now</span><span class="t"></span><span class="b"></span>'
    $('.t', n).textContent = t
    $('.b', n).textContent = b
    toasts.appendChild(n)
    var kill = function () {
      n.classList.add('out')
      setTimeout(function () {
        n.remove()
      }, 380)
    }
    n.addEventListener('click', kill)
    setTimeout(kill, 6500)
  }

  /* ================= TRY IT ================= */
  var PICKS = [
    [5400, 'Flight home for Diwali', 'transport'],
    [2500, "Cousin's wedding gift", 'others'],
    [1200, 'Dinner with friends', 'food'],
    [999, 'Broadband', 'bills'],
    [2199, 'Running shoes', 'shop'],
    [560, 'Movie + popcorn', 'fun'],
    [320, 'Pharmacy', 'health'],
    [2999, 'Headphones', 'shop']
  ]
  var picksEl = $('#picks'),
    month = $('#month'),
    track = $('#track'),
    overBar = $('#overBar'),
    legend = $('#legend')
  var totalEl = $('#total'),
    ofEl = $('#of'),
    statusEl = $('#status'),
    logCount = $('#logCount')
  ORDER.forEach(function (k) {
    var s = document.createElement('div')
    s.className = 'seg'
    s.setAttribute('data-cat', k)
    track.appendChild(s)
    var li = document.createElement('li')
    li.setAttribute('data-cat', k)
    li.innerHTML = '<span>' + CATS[k] + '</span><b></b>'
    legend.appendChild(li)
  })
  var totLi = document.createElement('li')
  totLi.className = 'tot'
  totLi.innerHTML = '<span>Total</span><b></b>'
  legend.appendChild(totLi)
  var shownTotal = { v: total() }
  function renderTotal(v) {
    totalEl.innerHTML = '<small>₹</small>' + fmt(v)
  }
  function renderMonth(ev) {
    var t = total(),
      pct = (t / BUDGET) * 100,
      scale = Math.max(BUDGET, t)
    ORDER.forEach(function (k) {
      $('.seg[data-cat="' + k + '"]', track).style.width =
        (state.cats[k] / scale) * 100 + '%'
      $('li[data-cat="' + k + '"] b', legend).textContent = rs(state.cats[k])
    })
    $('li.tot b', legend).textContent = rs(t)
    $('.t80', month).style.left = ((0.8 * BUDGET) / scale) * 100 + '%'
    $('.t100', month).style.left = (BUDGET / scale) * 100 + '%'
    overBar.style.left = (BUDGET / scale) * 100 + '%'
    overBar.style.width = (Math.max(0, t - BUDGET) / scale) * 100 + '%'
    overBar.style.top = '0'
    overBar.style.bottom = '0'
    overBar.style.border = t > BUDGET ? '' : '0'
    var st = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok'
    month.setAttribute('data-state', st)
    statusEl.textContent =
      st === 'over'
        ? 'Budget exceeded by ' + rs(t - BUDGET)
        : st === 'warn'
          ? Math.round(pct) + '% of budget used'
          : Math.round(pct) + '% used'
    ofEl.textContent =
      'of your ₹40,000 budget · ' +
      (t > BUDGET ? rs(t - BUDGET) + ' over' : rs(BUDGET - t) + ' left')
    logCount.textContent = state.added
      ? 'Added here: ' +
        state.added +
        (state.added === 1 ? ' spend, ' : ' spends, ') +
        rs(state.addedAmt)
      : 'Nothing added yet'
    if (hasGsap && !reduce)
      gsap.to(shownTotal, {
        v: t,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: function () {
          renderTotal(shownTotal.v)
        }
      })
    else renderTotal(t)
    if (ev) {
      var li = $('li[data-cat="' + ev.cat + '"]', legend)
      li.classList.remove('bump')
      void li.offsetWidth
      li.classList.add('bump')
    }
    if (!ev) {
      $$('.pick', picksEl).forEach(function (p) {
        p.classList.remove('used')
        p.disabled = false
      })
    }
  }
  listeners.push(renderMonth)
  renderMonth(null)

  PICKS.forEach(function (p) {
    var b = document.createElement('button')
    b.type = 'button'
    b.className = 'pick'
    b.setAttribute('data-cat', p[2])
    b.innerHTML = '<b class="num">' + rs(p[0]) + '</b><span>' + p[1] + '</span>'
    b.setAttribute(
      'aria-label',
      'Add ' + rs(p[0]) + ', ' + p[1] + ', ' + CATS[p[2]]
    )
    b._p = p
    picksEl.appendChild(b)
  })
  function flyTo(fromEl, cat, done) {
    if (!hasGsap || reduce) {
      done()
      return
    }
    var fr = fromEl.getBoundingClientRect()
    var seg = $('.seg[data-cat="' + cat + '"]', track).getBoundingClientRect()
    var g = fromEl.cloneNode(true)
    g.className = 'pick ghost-slip'
    g.setAttribute('data-cat', cat)
    g.removeAttribute('id')
    g.style.width = fr.width + 'px'
    document.body.appendChild(g)
    gsap.fromTo(
      g,
      { x: fr.left, y: fr.top, rotate: 0, scale: 1 },
      {
        x: seg.right - fr.width * 0.3,
        y: seg.top + seg.height / 2 - fr.height / 2,
        rotate: 8,
        scale: 0.35,
        duration: 0.7,
        ease: 'power2.in',
        onComplete: function () {
          g.remove()
          done()
        }
      }
    )
  }
  function usePick(b) {
    if (b.classList.contains('used')) return
    b.classList.add('used')
    b.disabled = true
    flyTo(b, b._p[2], function () {
      logSpend(b._p[0], b._p[1], b._p[2], 'pick')
    })
  }
  // tap, or drag onto the month
  var drag = null
  picksEl.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('.pick')
    if (!b || b.classList.contains('used') || e.button > 0) return
    drag = {
      b: b,
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      moved: false,
      g: null
    }
  })
  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return
    var dx = e.clientX - drag.x,
      dy = e.clientY - drag.y
    if (!drag.moved && Math.hypot(dx, dy) > 8) {
      drag.moved = true
      var r = drag.b.getBoundingClientRect()
      drag.ox = e.clientX - r.left
      drag.oy = e.clientY - r.top
      drag.g = drag.b.cloneNode(true)
      drag.g.className = 'pick ghost-slip'
      drag.g.style.width = r.width + 'px'
      document.body.appendChild(drag.g)
      drag.b.classList.add('dragging')
    }
    if (drag.moved) {
      e.preventDefault()
      drag.g.style.transform =
        'translate(' +
        (e.clientX - drag.ox) +
        'px,' +
        (e.clientY - drag.oy) +
        'px) rotate(' +
        clamp(dx * 0.02, -10, 10) +
        'deg)'
      var mr = month.getBoundingClientRect()
      month.classList.toggle(
        'hot',
        e.clientX > mr.left &&
          e.clientX < mr.right &&
          e.clientY > mr.top &&
          e.clientY < mr.bottom
      )
    }
  })
  var endDrag = function (e) {
    if (!drag || e.pointerId !== drag.id) return
    var d = drag
    drag = null
    if (!d.moved) {
      usePick(d.b)
      return
    }
    d.b.classList.remove('dragging')
    var hit = month.classList.contains('hot')
    month.classList.remove('hot')
    if (hit) {
      d.b.classList.add('used')
      d.b.disabled = true
      d.g.remove()
      logSpend(d.b._p[0], d.b._p[1], d.b._p[2], 'drag')
    } else if (hasGsap) {
      var r = d.b.getBoundingClientRect()
      gsap.to(d.g, {
        x: r.left,
        y: r.top,
        rotate: 0,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: function () {
          d.g.remove()
        }
      })
    } else d.g.remove()
  }
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
  picksEl.addEventListener('click', function (e) {
    if (e.detail === 0) {
      var b = e.target.closest('.pick')
      if (b) usePick(b)
    }
  }) // keyboard
  picksEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      var b = e.target.closest('.pick')
      if (b) {
        e.preventDefault()
        usePick(b)
      }
    }
  })

  // custom form
  var fCats = $('#fCats'),
    fCat = 'food'
  ORDER.forEach(function (k) {
    var c = document.createElement('button')
    c.type = 'button'
    c.className = 'cat'
    c.setAttribute('data-cat', k)
    c.setAttribute('aria-pressed', k === fCat ? 'true' : 'false')
    c.textContent = CATS[k]
    c.addEventListener('click', function () {
      fCat = k
      $$('.cat', fCats).forEach(function (x) {
        x.setAttribute('aria-pressed', x === c ? 'true' : 'false')
      })
    })
    fCats.appendChild(c)
  })
  var fAmt = $('#fAmt'),
    fDesc = $('#fDesc'),
    fErr = $('#fErr')
  fAmt.addEventListener('input', function () {
    var d = fAmt.value.replace(/[^0-9]/g, '').slice(0, 8)
    fAmt.value = d ? Number(d).toLocaleString('en-IN') : ''
  })
  $('#form').addEventListener('submit', function (e) {
    e.preventDefault()
    var amt = Number(fAmt.value.replace(/[^0-9]/g, ''))
    if (!amt) {
      fErr.textContent = 'Enter an amount greater than ₹0.'
      fAmt.focus()
      return
    }
    if (amt > 10000000) {
      fErr.textContent = 'The most one spend can be is ₹1,00,00,000.'
      fAmt.focus()
      return
    }
    if (!fDesc.value.trim()) {
      fErr.textContent = 'Say what it was, so you remember later.'
      fDesc.focus()
      return
    }
    fErr.textContent = ''
    logSpend(amt, fDesc.value.trim(), fCat, 'form')
    fAmt.value = ''
    fDesc.value = ''
  })
  $('#resetMonth').addEventListener('click', resetMonth)

  /* ================= HOME SCREEN WIDGETS ================= */
  var screen = $('#screen'),
    sheet = $('#sheet'),
    sheetCat = $('#sheetCat'),
    sheetAmt = $('#sheetAmt'),
    sugg = $('#sugg'),
    keys = $('#keys'),
    save = $('#sheetSave'),
    snack = $('#snack')
  var SUGG = {
    food: ['Chai', 'Lunch', 'Groceries'],
    transport: ['Auto', 'Metro', 'Cab'],
    shop: ['Clothes', 'Online order', 'Gift'],
    bills: ['Recharge', 'Electricity', 'Gas']
  }
  var sh = { cat: 'food', amt: '', desc: '' }
  function renderWidgets() {
    var t = total(),
      p = Math.min(100, (t / BUDGET) * 100)
    $('#wToday').textContent = rs(state.today)
    $('#wToday2').textContent = rs(state.today)
    $('#wMonth').textContent = rs(t)
    $('#wBar').style.setProperty('--p', p + '%')
    $('#wRing').setAttribute('stroke-dasharray', p.toFixed(1) + ' 100')
    $('#wRing').setAttribute(
      'stroke',
      t >= BUDGET ? '#FF6E60' : t >= 0.8 * BUDGET ? '#E5A640' : '#2ED68A'
    )
    $('#wPct').textContent = Math.round((t / BUDGET) * 100) + '%'
  }
  listeners.push(renderWidgets)
  renderWidgets()
  ;['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'].forEach(
    function (k) {
      var b = document.createElement('button')
      b.type = 'button'
      b.textContent = k
      b.setAttribute('aria-label', k === '⌫' ? 'Delete' : k)
      b.addEventListener('click', function () {
        if (k === '⌫') sh.amt = sh.amt.slice(0, -1)
        else if (sh.amt.length < 7 && !(sh.amt === '' && k[0] === '0'))
          sh.amt = (sh.amt + k).slice(0, 7)
        drawSheet()
      })
      keys.appendChild(b)
    }
  )
  function drawSheet() {
    sheetAmt.innerHTML =
      '<small>₹</small>' +
      (sh.amt ? Number(sh.amt).toLocaleString('en-IN') : '0')
    save.disabled = !Number(sh.amt)
  }
  function openSheet(cat, name) {
    sh = { cat: cat, amt: '', desc: SUGG[cat][0] }
    sheetCat.setAttribute('data-cat', cat)
    sheetCat.textContent = name
    sugg.innerHTML = ''
    SUGG[cat].forEach(function (s, i) {
      var b = document.createElement('button')
      b.type = 'button'
      b.textContent = s
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false')
      b.addEventListener('click', function () {
        sh.desc = s
        $$('button', sugg).forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false')
        })
      })
      sugg.appendChild(b)
    })
    drawSheet()
    screen.classList.add('open')
    setTimeout(function () {
      var f = $('button', keys)
      if (f) f.focus({ preventScroll: true })
    }, 450)
  }
  function closeSheet() {
    screen.classList.remove('open')
  }
  $$('#qa button').forEach(function (b) {
    b.addEventListener('click', function () {
      openSheet(b.getAttribute('data-cat'), b.getAttribute('data-name'))
    })
  })
  $('#sheetX').addEventListener('click', closeSheet)
  $('#scrim').addEventListener('click', closeSheet)
  save.addEventListener('click', function () {
    var a = Number(sh.amt)
    if (!a) return
    logSpend(a, sh.desc, sh.cat, 'widget')
    closeSheet()
    snack.textContent =
      'Logged ' + rs(a) + ' · ' + sh.desc + ' · ' + CATS[sh.cat]
    snack.classList.add('on')
    clearTimeout(snack._t)
    snack._t = setTimeout(function () {
      snack.classList.remove('on')
    }, 2600)
  })

  /* ================= MIDNIGHT ================= */
  var night = $('#night')
  ;(function () {
    if (!hasGsap || !window.ScrollTrigger || reduce) return
    var fH = $('#fH'),
      fM = $('#fM'),
      cDate = $('#cDate'),
      cAp = $('#cAp')
    var due = $$('[data-run]', night),
      note = $('#nightNote'),
      stamps = $$('.stamp', night)
    var digits = [
      fH.children[0],
      fH.children[1],
      fM.children[0],
      fM.children[1]
    ]
    gsap.set(night, { '--bgc': '#F4F2EC', '--fg': '#1A1714' })
    gsap.set(digits, { y: 0, yPercent: 0 })
    cDate.textContent = 'Wed 30 Sep'
    cAp.textContent = 'PM'
    due.forEach(function (r) {
      r.classList.remove('logged')
    })
    gsap.set(stamps, { autoAlpha: 0, scale: 1.8 })
    gsap.set(note, { autoAlpha: 0, y: -20 })
    night.setAttribute('data-theme', 'paper')
    var midnight = function (on) {
      cDate.textContent = on ? 'Thu 1 Oct' : 'Wed 30 Sep'
      cAp.textContent = on ? 'AM' : 'PM'
      due.forEach(function (r) {
        r.classList.toggle('logged', on)
      })
    }
    var pin = window.innerWidth > 1100 && window.innerHeight >= 700
    var tl = gsap.timeline({
      scrollTrigger: pin
        ? {
            trigger: night,
            start: 'top top',
            end: '+=150%',
            pin: '#nightPin',
            scrub: 0.6,
            onUpdate: function (st) {
              night.setAttribute(
                'data-theme',
                st.progress > 0.12 ? 'night' : 'paper'
              )
            }
          }
        : {
            trigger: night,
            start: 'top 55%',
            toggleActions: 'play none none reverse',
            onEnter: function () {
              night.setAttribute('data-theme', 'night')
            },
            onLeaveBack: function () {
              night.setAttribute('data-theme', 'paper')
            }
          },
      defaults: { ease: 'none' }
    })
    tl.to(night, {
      '--bgc': '#0E0E0F',
      '--fg': '#F4F2EC',
      duration: 0.25,
      ease: 'power1.inOut'
    })
      .to(
        digits,
        { yPercent: -100, duration: 0.08, ease: 'power2.inOut' },
        0.32
      )
      .add(function () {
        midnight(
          tl.reversed()
            ? false
            : !(tl.scrollTrigger && tl.scrollTrigger.direction < 0)
        )
      }, 0.36)
      .to(
        stamps[0],
        { autoAlpha: 1, scale: 1, duration: 0.06, ease: 'back.out(3)' },
        0.44
      )
      .to(
        stamps[1],
        { autoAlpha: 1, scale: 1, duration: 0.06, ease: 'back.out(3)' },
        0.52
      )
      .to(
        note,
        { autoAlpha: 1, y: 0, duration: 0.08, ease: 'back.out(2)' },
        0.6
      )
      .to({}, { duration: 0.3 })
    if (!pin) tl.duration(2.4)
  })()

  /* ================= THE 1ST: receipt prints as you scroll ================= */
  ;(function () {
    if (!hasGsap || !window.ScrollTrigger || reduce) return
    var r = $('#receipt'),
      stamp = $('#stamp')
    gsap.set(r, { yPercent: -100 })
    gsap.set(stamp, { autoAlpha: 0, scale: 1.9, rotate: -24 })
    gsap
      .timeline({
        scrollTrigger: {
          trigger: '#printer',
          start: 'top 70%',
          end: 'bottom 75%',
          scrub: 0.5
        }
      })
      .to(r, { yPercent: 0, ease: 'none', duration: 1 })
      .to(
        stamp,
        {
          autoAlpha: 1,
          scale: 1,
          rotate: -12,
          ease: 'back.out(2.5)',
          duration: 0.12
        },
        0.9
      )
  })()
  $$('#export .seg-ctl').forEach(function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button')
      if (!b) return
      $$('button', g).forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false')
      })
    })
  })
  $('#exportBtn').addEventListener('click', function () {
    var f = $('#export [data-group="fmt"] [aria-pressed="true"]').textContent
    var r = $(
      '#export [data-group="range"] [aria-pressed="true"]'
    ).textContent.toLowerCase()
    $('#exportRes').textContent =
      'In the app, this emails you a ' + f + ' of ' + r + '.'
  })

  /* ================= SIX PINGS ================= */
  var PINGS = [
    [
      'warn',
      'Paisa · now',
      'Approaching budget limit',
      "You've used 82% of your monthly budget. Spent ₹32,800.",
      'The moment you pass 80% · also by email'
    ],
    [
      'over',
      'Paisa · now',
      'Budget limit reached!',
      "You've spent ₹40,120 — 100% of your monthly budget.",
      'The moment you pass 100% · also by email'
    ],
    [
      '',
      'Paisa · 12:00 am',
      'House help',
      '₹4,000 auto-debited · Next: 1 Nov',
      '12:00 am, the day a repeat is due'
    ],
    [
      '',
      'Paisa · 1 Oct, 9:00 am',
      'Your September report is ready',
      'You spent ₹38,410 last month. Tap to see the full breakdown.',
      '1st of the month, 9:00 am · also by email'
    ],
    [
      'mail',
      'Email · Monday 9:00 am',
      'Your week in a glance — 21–27 Sep 📋',
      '₹6,240 across 14 spends, 4% less than last week. Top: Food & Dining.',
      'Every Monday, 9:00 am'
    ],
    [
      'mail',
      'Email · 10:00 am',
      "Hey Ananya, haven't seen you in 5 days 👀",
      'Still tracking? We miss you, Ananya.',
      'After 5 days without a spend'
    ]
  ]
  var desk = $('#desk')
  var SPOTS = [
    [0.06, 0.08, -4],
    [0.44, 0.05, 3],
    [0.2, 0.34, 2],
    [0.56, 0.36, -3],
    [0.1, 0.6, -2],
    [0.48, 0.64, 4]
  ]
  var SPOTS_N = [
    [0.03, 0.02, -3],
    [0.17, 0.175, 3],
    [0.03, 0.33, 2],
    [0.17, 0.485, -3],
    [0.03, 0.64, -2],
    [0.17, 0.795, 3]
  ]
  var pingEls = PINGS.map(function (p, i) {
    var n = document.createElement('div')
    n.className = 'note ' + p[0]
    n.tabIndex = 0
    n.innerHTML =
      '<span class="ic" aria-hidden="true">' +
      (p[0] === 'mail' ? '@' : 'P') +
      '</span><span class="app"></span><span class="t"></span><span class="b"></span><span class="when"></span>'
    $('.app', n).textContent = p[1]
    $('.t', n).textContent = p[2]
    $('.b', n).textContent = p[3]
    $('.when', n).textContent = p[4]
    desk.insertBefore(n, desk.firstChild)
    return n
  })
  function placePings(animate) {
    var mob = desk.clientWidth < 620,
      S = mob ? SPOTS_N : SPOTS
    pingEls.forEach(function (n, i) {
      var s = S[i]
      n._pos = { x: 0, y: 0 }
      n.style.left = s[0] * 100 + '%'
      n.style.top = s[1] * 100 + '%'
      n.style.rotate = s[2] + 'deg'
      n.style.zIndex = i + 1
      if (animate && hasGsap && !reduce)
        gsap.fromTo(
          n,
          { translate: '0px -60px', opacity: 0 },
          {
            translate: '0px 0px',
            opacity: 1,
            duration: 0.6,
            delay: i * 0.07,
            ease: 'back.out(1.8)'
          }
        )
      else n.style.translate = '0px 0px'
    })
  }
  placePings(false)
  ;(function throwable() {
    var z = 20
    pingEls.forEach(function (n) {
      var d = null,
        fling = 0
      var put = function () {
        n.style.translate =
          n._pos.x.toFixed(1) + 'px ' + n._pos.y.toFixed(1) + 'px'
      }
      n.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return
        e.preventDefault()
        cancelAnimationFrame(fling)
        var w = n.offsetWidth,
          h = n.offsetHeight,
          L = n.offsetLeft,
          T = n.offsetTop
        d = {
          id: e.pointerId,
          ox: e.clientX - n._pos.x,
          oy: e.clientY - n._pos.y,
          lx: e.clientX,
          ly: e.clientY,
          lt: performance.now(),
          vx: 0,
          vy: 0,
          lim: {
            x0: -L - w * 0.35,
            x1: desk.clientWidth - L - w * 0.65,
            y0: -T - h * 0.2,
            y1: desk.clientHeight - T - h * 0.6
          }
        }
        n.style.zIndex = ++z
        n.classList.add('grabbed')
      })
      window.addEventListener('pointermove', function (e) {
        if (!d || e.pointerId !== d.id) return
        var now = performance.now(),
          dt = Math.max(8, now - d.lt)
        d.vx = d.vx * 0.5 + ((e.clientX - d.lx) / dt) * 0.5
        d.vy = d.vy * 0.5 + ((e.clientY - d.ly) / dt) * 0.5
        d.lx = e.clientX
        d.ly = e.clientY
        d.lt = now
        n._pos.x = clamp(e.clientX - d.ox, d.lim.x0, d.lim.x1)
        n._pos.y = clamp(e.clientY - d.oy, d.lim.y0, d.lim.y1)
        put()
        n.style.rotate = clamp(d.vx * 16, -24, 24).toFixed(1) + 'deg'
      })
      var up = function (e) {
        if (!d || e.pointerId !== d.id) return
        var vx = d.vx * 18,
          vy = d.vy * 18,
          lim = d.lim,
          rot = parseFloat(n.style.rotate) || 0
        if (performance.now() - d.lt > 90) {
          vx = 0
          vy = 0
        }
        d = null
        n.classList.remove('grabbed')
        var step = function () {
          n._pos.x += vx
          n._pos.y += vy
          vx *= 0.91
          vy *= 0.91
          rot *= 0.9
          if (n._pos.x < lim.x0 || n._pos.x > lim.x1) {
            n._pos.x = clamp(n._pos.x, lim.x0, lim.x1)
            vx *= -0.5
          }
          if (n._pos.y < lim.y0 || n._pos.y > lim.y1) {
            n._pos.y = clamp(n._pos.y, lim.y0, lim.y1)
            vy *= -0.5
          }
          put()
          n.style.rotate = rot.toFixed(2) + 'deg'
          if (Math.abs(vx) + Math.abs(vy) > 0.3 || Math.abs(rot) > 0.3)
            fling = requestAnimationFrame(step)
        }
        fling = requestAnimationFrame(step)
      }
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
      n.addEventListener('keydown', function (e) {
        var k = {
          ArrowLeft: [-30, 0],
          ArrowRight: [30, 0],
          ArrowUp: [0, -30],
          ArrowDown: [0, 30]
        }[e.key]
        if (!k) return
        e.preventDefault()
        n._pos.x += k[0]
        n._pos.y += k[1]
        put()
      })
    })
  })()
  $('#deskReset').addEventListener('click', function () {
    placePings(true)
  })
  if ('IntersectionObserver' in window && !reduce && hasGsap) {
    pingEls.forEach(function (n) {
      n.style.opacity = '0'
    })
    var pio = new IntersectionObserver(
      function (es) {
        if (es[0].isIntersecting) {
          placePings(true)
          pio.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    pio.observe(desk)
  }

  /* ================= CTA: QR + wordmark in Indian scripts ================= */
  ;(function () {
    var box = $('#qr')
    if (!box || !window.qrcode) return
    var q = qrcode(0, 'M')
    q.addData(PLAY_URL)
    q.make()
    var n = q.getModuleCount(),
      d = ''
    for (var r = 0; r < n; r++)
      for (var c = 0; c < n; c++)
        if (q.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z'
    box.innerHTML =
      '<svg viewBox="0 0 ' +
      n +
      ' ' +
      n +
      '" shape-rendering="crispEdges" aria-hidden="true"><path d="' +
      d +
      '" fill="#1A1714"/></svg>'
  })()
  var WORDS = [
    ['Paisa', 'en', 'Paisa', 'English'],
    ['पैसा', 'hi', 'पैसा', 'Hindi, Marathi'],
    ['పైసా', 'te', 'పైసా', 'Telugu'],
    ['பைசா', 'ta', 'பைசா', 'Tamil'],
    ['পয়সা', 'bn', 'পয়সা', 'Bengali'],
    ['ಪೈಸೆ', 'kn', 'ಪೈಸೆ', 'Kannada'],
    ['પૈસા', 'gu', 'પૈસા', 'Gujarati'],
    ['ਪੈਸਾ', 'pa', 'ਪੈਸਾ', 'Punjabi'],
    ['പൈസ', 'ml', 'പൈസ', 'Malayalam'],
    ['ପଇସା', 'or', 'ପଇସା', 'Odia']
  ]
  var mark = $('#mark'),
    markLang = $('#markLang'),
    markNote = $('#markNote'),
    wi = 0,
    cur = $('span', mark),
    auto = 0,
    markSeen = false
  function nextWord() {
    wi = (wi + 1) % WORDS.length
    var w = WORDS[wi],
      s = document.createElement('span')
    s.textContent = w[0]
    s.lang = w[1]
    if (w[1] === 'en') s.className = 'lat'
    s.classList.add('next')
    mark.appendChild(s)
    void s.offsetWidth
    var old = cur
    cur = s
    s.classList.remove('next')
    old.classList.add('prev')
    setTimeout(function () {
      old.remove()
    }, 900)
    markLang.textContent = w[3]
    markNote.textContent =
      w[1] === 'en'
        ? 'tap the word'
        : 'same word, ' + (wi + 1) + ' of ' + WORDS.length
  }
  mark.addEventListener('click', function () {
    nextWord()
    clearInterval(auto)
    auto = setInterval(nextWord, 2600)
  })
  if ('IntersectionObserver' in window && !reduce) {
    new IntersectionObserver(
      function (es) {
        clearInterval(auto)
        if (es[0].isIntersecting) {
          if (!markSeen) {
            markSeen = true
            nextWord()
          }
          auto = setInterval(nextWord, 2600)
        }
      },
      { threshold: 0.4 }
    ).observe(mark)
  }

  /* ================= entrance reveals ================= */
  if (!reduce && 'IntersectionObserver' in window) {
    var rio = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            rio.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px' }
    )
    $$(
      '.try-head, .home-copy, .first-copy, .pings-head, .qa-item, .cta-top, .chain-head'
    ).forEach(function (el) {
      el.classList.add('rise')
      rio.observe(el)
    })
  }

  window.addEventListener('load', function () {
    layoutChart()
    if (window.ScrollTrigger) ScrollTrigger.refresh()
  })
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(function () {
      if (window.ScrollTrigger) ScrollTrigger.refresh()
    })
})()
