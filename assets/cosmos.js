// Animated cosmic scenes for <canvas data-cosmos data-scene="web|flow|localgroup|arm|bubble|solar|spiral">.
// Optional attributes: data-x, data-y (centre, 0-1), data-size, data-tilt, data-stars, data-speed.
(function () {
  function createCosmos(canvas, opts) {
    // ---- shared setup ----
    var o = { scene: 'spiral', x: 0.67, y: 0.42, size: 1, tilt: -0.38, stars: 4500, speed: 1 };
    for (var key in opts) if (opts[key] !== undefined && opts[key] !== null && opts[key] !== '') o[key] = opts[key];
    ['x', 'y', 'size', 'tilt', 'stars', 'speed'].forEach(function (k) { o[k] = parseFloat(o[k]); });
    var host = canvas.parentElement, ctx = canvas.getContext('2d');
    var still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var small = window.innerWidth < 700;
    var w = 1, h = 1, mx = 0, my = 0, tx = 0, ty = 0, raf = 0, visible = true, dead = false, ro = null, io = null;
    var rnd = Math.random, PI2 = Math.PI * 2;
    var gauss = function () { return (rnd() + rnd() + rnd() - 1.5) / 1.5; };
    var rgba = function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(2) + ')'; };
    var count = function (n) { return Math.round(n * (o.stars / 4500) * (small ? 0.55 : 1)); };
    var field = [];
    for (var fi = 0; fi < 260; fi++) field.push({ x: rnd(), y: rnd(), s: rnd() * 1.3 + 0.3, p: rnd() * 6.28, f: 0.5 + rnd() * 2 });

    function clear(alpha) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = alpha >= 1 ? '#000' : 'rgba(0,0,0,' + alpha + ')';
      ctx.fillRect(0, 0, w, h);
    }
    function twinkle(t, amt) {
      for (var i = 0; i < field.length; i++) {
        var f = field[i];
        ctx.fillStyle = 'rgba(255,255,255,' + ((0.25 + 0.55 * Math.abs(Math.sin(f.p + t * 0.001 * f.f))) * amt).toFixed(2) + ')';
        ctx.fillRect(f.x * w - mx * 0.3, f.y * h - my * 0.3, f.s, f.s);
      }
    }
    function glow(x, y, r, inner, mid) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, inner); g.addColorStop(0.3, mid); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    function dot(x, y, s, c) {
      ctx.fillStyle = c;
      if (s > 4) { ctx.beginPath(); ctx.arc(x, y, s, 0, PI2); ctx.fill(); } else ctx.fillRect(x, y, s, s);
    }
    // 3D helpers: rotate around Y then X, perspective project
    function proj(p, ry, rx, cx, cy, scale, out) {
      var cy1 = Math.cos(ry), sy1 = Math.sin(ry), cx1 = Math.cos(rx), sx1 = Math.sin(rx);
      var x = p[0] * cy1 + p[2] * sy1, z = -p[0] * sy1 + p[2] * cy1;
      var y = p[1] * cx1 - z * sx1; z = p[1] * sx1 + z * cx1;
      var d = 3.2 / (z + 3.2);
      out[0] = cx + x * scale * d; out[1] = cy + y * scale * d; out[2] = d;
      return out;
    }

    // spiral galaxy particles (shared by spiral + local group)
    function spiral(n, palette) {
      var P = [], core = [255, 214, 170], mid = [205, 218, 255];
      var outer = palette || [[120, 160, 255], [176, 140, 255], [255, 140, 205], [140, 210, 255]];
      for (var i = 0; i < n; i++) {
        if (i % 5 === 0) { P.push({ r: Math.abs(gauss()) * 0.22, a: rnd() * PI2, s: 0.6 + rnd() * 1.2, c: rgba([255, 200 + (rnd() * 40 | 0), 170], 0.5 + rnd() * 0.5) }); continue; }
        if (i % 9 === 0) { var rn = 0.2 + rnd() * 0.75; P.push({ r: rn, a: (i % 2) * Math.PI + rn * 5.6 + gauss() * 0.4, s: 6 + rnd() * 10, c: rgba([[120, 150, 255], [190, 120, 255], [255, 120, 190]][(rnd() * 3) | 0], 0.05) }); continue; }
        var r = Math.pow(rnd(), 0.75), c;
        if (r < 0.14) c = core;
        else if (r < 0.45) { var k = (r - 0.14) / 0.31; c = [0, 1, 2].map(function (j) { return Math.round(core[j] + (mid[j] - core[j]) * k); }); }
        else c = rnd() < 0.6 ? mid : outer[(rnd() * outer.length) | 0];
        P.push({ r: r + gauss() * 0.09, a: (i % 2) * Math.PI + r * 5.6 + gauss() * (1.9 - r * 0.9), s: rnd() < 0.04 ? 2.2 : 0.6 + rnd() * 1.1, c: rgba(c, r < 0.2 ? 0.9 : 0.35 + rnd() * 0.5) });
      }
      return P;
    }
    function drawSpiral(P, cx, cy, R, tilt, flat, time, coreGlow) {
      var ct = Math.cos(tilt), st = Math.sin(tilt);
      if (coreGlow) glow(cx, cy, R * 0.55, 'rgba(255,220,180,' + coreGlow + ')', 'rgba(170,150,255,0.16)');
      for (var i = 0; i < P.length; i++) {
        var p = P[i], ang = p.a + time / (0.18 + p.r);
        var x = Math.cos(ang) * p.r * R, y = Math.sin(ang) * p.r * R * flat;
        dot(cx + x * ct - y * st, cy + x * st + y * ct, p.s * (R < 160 ? 0.8 : 1), p.c);
      }
    }
    function blob(n, spread, color) {
      var P = [];
      for (var i = 0; i < n; i++) P.push({ x: gauss() * spread, y: gauss() * spread * 0.7, s: 0.5 + rnd() * 1.1, c: rgba(color, 0.3 + rnd() * 0.6) });
      return P;
    }

    // ---- scenes ----
    var S = {};

    // Observable Universe: rotating 3D cosmic web
    S.web = (function () {
      var pts = [], nodes = [], K = small ? 26 : 40, i, j;
      for (i = 0; i < K; i++) nodes.push([(rnd() * 2 - 1) * 1.7, (rnd() * 2 - 1) * 1.0, (rnd() * 2 - 1) * 1.7]);
      var edges = {};
      for (i = 0; i < K; i++) {
        var ds = [];
        for (j = 0; j < K; j++) if (j !== i) { var dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2]; ds.push([dx * dx + dy * dy + dz * dz, j]); }
        ds.sort(function (a, b) { return a[0] - b[0]; });
        for (j = 0; j < 3; j++) edges[Math.min(i, ds[j][1]) + '-' + Math.max(i, ds[j][1])] = [i, ds[j][1], Math.sqrt(ds[j][0])];
      }
      var budget = count(small ? 9000 : 15000), keys = Object.keys(edges), total = 0;
      keys.forEach(function (k) { total += edges[k][2]; });
      var fil = [[120, 150, 255], [160, 140, 255], [200, 150, 255], [140, 200, 255]];
      keys.forEach(function (k) {
        var e = edges[k], a = nodes[e[0]], b = nodes[e[1]], m = Math.round(budget * 0.7 * e[2] / total);
        for (var q = 0; q < m; q++) {
          var u = rnd(), sp = 0.018 + 0.03 * Math.sin(u * Math.PI);
          pts.push({ p: [a[0] + (b[0] - a[0]) * u + gauss() * sp, a[1] + (b[1] - a[1]) * u + gauss() * sp, a[2] + (b[2] - a[2]) * u + gauss() * sp], s: 0.6 + rnd() * 0.9, c: rgba(fil[(rnd() * fil.length) | 0], 0.3 + rnd() * 0.5) });
        }
      });
      nodes.forEach(function (n) {
        var m = Math.round(budget * 0.15 / K);
        for (var q = 0; q < m; q++) pts.push({ p: [n[0] + gauss() * 0.045, n[1] + gauss() * 0.045, n[2] + gauss() * 0.045], s: 0.6 + rnd() * 1.4, c: rgba(rnd() < 0.5 ? [255, 222, 190] : [235, 225, 255], 0.5 + rnd() * 0.5) });
        pts.push({ p: n, s: 7 + rnd() * 6, c: 'rgba(190,170,255,0.08)' });
      });
      var out = [0, 0, 0];
      return function (t) {
        clear(1); twinkle(t, 0.7);
        ctx.globalCompositeOperation = 'lighter';
        var ry = (still ? 0.6 : t * 0.00004 * o.speed) + mx * 0.004, rx = -0.32 + my * 0.004;
        var cx = w * o.x, cy = h * o.y, sc = Math.min(w, h * 1.7) * 0.36 * o.size;
        for (var i = 0; i < pts.length; i++) {
          var q = pts[i]; proj(q.p, ry, rx, cx, cy, sc, out);
          if (out[2] <= 0) continue;
          dot(out[0], out[1], q.s * out[2], q.c);
        }
      };
    })();

    // Laniakea → Virgo: galaxies streaming along flow lines into the Great Attractor
    S.flow = (function () {
      var n = count(1600), P = [];
      var A = [[0, 0, 1], [-0.42, -0.28, 0.45], [0.55, 0.32, 0.25]];
      function spawn(p) {
        var a = rnd() * PI2, r = 0.55 + rnd() * 0.75;
        p.x = Math.cos(a) * r * 1.6; p.y = Math.sin(a) * r; p.life = 0;
        p.c = rnd() < 0.15 ? [255, 220, 190] : (rnd() < 0.5 ? [150, 180, 255] : [200, 170, 255]);
        p.s = 0.7 + rnd() * 1.1;
        return p;
      }
      for (var i = 0; i < n; i++) { var p = spawn({}); var adv = rnd() * 9000; for (var k = 0; k < adv; k += 50) step(p, 50); P.push(p); }
      function step(p, dt) {
        var vx = 0, vy = 0;
        for (var j = 0; j < 3; j++) {
          var dx = A[j][0] - p.x, dy = A[j][1] - p.y, d2 = dx * dx + dy * dy + 0.02, wgt = A[j][2];
          vx += wgt * (dx / d2 * 0.12 - dy / d2 * 0.05); vy += wgt * (dy / d2 * 0.12 + dx / d2 * 0.05);
        }
        var sp = Math.sqrt(vx * vx + vy * vy) || 1, lim = Math.min(sp, 1.2) / sp;
        p.x += vx * lim * dt * 0.00012; p.y += vy * lim * dt * 0.00012; p.life += dt;
        if (p.x * p.x + p.y * p.y < 0.0025 || p.life > 30000) spawn(p);
      }
      var last = 0;
      return function (t) {
        var dt = still ? 0 : Math.min(50, t - (last || t)) * o.speed; last = t;
        clear(still ? 1 : 0.09); twinkle(t, 0.35);
        ctx.globalCompositeOperation = 'lighter';
        var cx = w * o.x + mx, cy = h * o.y + my, R = Math.min(w * 0.36, h * 0.62) * o.size;
        var ga = still ? 1 : 0.09;
        glow(cx, cy, R * 0.4, 'rgba(255,225,190,' + (0.3 * ga).toFixed(3) + ')', 'rgba(150,140,255,' + (0.06 * ga).toFixed(3) + ')');
        glow(cx + A[1][0] * R, cy + A[1][1] * R, R * 0.16, 'rgba(220,210,255,' + (0.25 * ga).toFixed(3) + ')', 'rgba(150,170,255,' + (0.05 * ga).toFixed(3) + ')');
        for (var i = 0; i < P.length; i++) {
          var p = P[i]; step(p, dt);
          var r = Math.sqrt(p.x * p.x + p.y * p.y), al = Math.min(1, r * 1.6) * 0.8;
          dot(cx + p.x * R, cy + p.y * R, p.s, rgba(p.c, al * 0.75));
        }
      };
    })();

    // Local Group → Milky Way: Milky Way, Andromeda, Triangulum and dwarfs
    S.localgroup = (function () {
      var MW = spiral(count(2600)), M31 = spiral(count(2600), [[150, 170, 255], [200, 160, 255], [255, 170, 210]]), M33 = spiral(count(500));
      var dw = [blob(count(220), 0.05, [200, 210, 255]), blob(count(160), 0.035, [210, 200, 255]), blob(count(120), 0.03, [255, 220, 200]), blob(count(140), 0.04, [190, 200, 255])];
      return function (t) {
        clear(1); twinkle(t, 0.8);
        ctx.globalCompositeOperation = 'lighter';
        var time = still ? 0 : t * 0.00005 * o.speed, cx = w * o.x + mx, cy = h * o.y + my, R = Math.min(w * 0.42, h * 0.62) * o.size;
        var mwx = cx - R * 0.55, mwy = cy + R * 0.2, ax = cx + R * 0.45, ay = cy - R * 0.25;
        drawSpiral(M31, ax, ay, R * 0.6, 0.62, 0.3, time, 0.45);
        drawSpiral(MW, mwx, mwy, R * 0.42, -0.25, 0.5, time, 0.5);
        drawSpiral(M33, cx + R * 0.95, cy + R * 0.25, R * 0.16, 0.3, 0.6, time * 1.4, 0.3);
        var orb = [[mwx, mwy, 0.62, 0.8], [mwx, mwy, 0.55, 2.6], [ax, ay, 0.8, 4.2], [ax, ay, 0.72, 1.4]];
        for (var d = 0; d < dw.length; d++) {
          var ang = orb[d][3] + time * 0.4, ox = orb[d][0] + Math.cos(ang) * R * orb[d][2], oy = orb[d][1] + Math.sin(ang) * R * orb[d][2] * 0.35;
          for (var i = 0; i < dw[d].length; i++) { var q = dw[d][i]; dot(ox + q.x * R, oy + q.y * R, q.s, q.c); }
        }
      };
    })();

    // Orion Arm → Gould Belt: a sweeping spiral arm with the tilted ring of young stars around the Sun
    S.arm = (function () {
      var n = count(5200), P = [], G = [], i;
      for (i = 0; i < n; i++) {
        var u = rnd() * 2.6 - 1.3, th = 0.2 + 0.08 * Math.sin(u * 2.3), v = gauss() * th;
        var neb = i % 28 === 0, young = !neb && rnd() < 0.12;
        P.push({ u: u, v: v, s: neb ? 8 + rnd() * 16 : (young ? 1.2 + rnd() * 1.2 : 0.5 + rnd() * 1), c: neb ? rgba(rnd() < 0.6 ? [255, 110, 170] : [140, 120, 255], 0.045) : (young ? rgba([170, 200, 255], 0.6 + rnd() * 0.4) : rgba(rnd() < 0.7 ? [230, 225, 255] : [255, 215, 180], 0.4 + rnd() * 0.5)) });
      }
      for (i = 0; i < count(520); i++) { var a = rnd() * PI2; G.push({ a: a, r: 1 + gauss() * 0.08, z: gauss() * 0.05, s: 0.9 + rnd() * 1.6, c: rgba(rnd() < 0.7 ? [175, 205, 255] : [230, 235, 255], 0.55 + rnd() * 0.45) }); }
      var out = [0, 0, 0];
      return function (t) {
        clear(1); twinkle(t, 0.6);
        ctx.globalCompositeOperation = 'lighter';
        var time = still ? 0 : t * 0.000012 * o.speed, cx = w * o.x + mx, cy = h * o.y + my;
        var ct = Math.cos(o.tilt), st = Math.sin(o.tilt), L = w * 0.7, H = h * 0.75 * o.size;
        for (var i = 0; i < P.length; i++) {
          var p = P[i], u = ((p.u + time + 1.3) % 2.6 + 2.6) % 2.6 - 1.3;
          var x = u * L, y = (u * u * 0.12 - 0.06 + p.v) * H;
          dot(cx + x * ct - y * st, cy + x * st + y * ct, p.s, p.c);
        }
        var gr = Math.min(w, h) * 0.2 * o.size, ry = still ? 0 : t * 0.00008 * o.speed;
        for (var j = 0; j < G.length; j++) {
          var g = G[j], ang = g.a + ry;
          proj([Math.cos(ang) * g.r, g.z, Math.sin(ang) * g.r], 0, 1.15 + my * 0.003, cx, cy, gr, out);
          var rot = 0.33, X = out[0] - cx, Y = out[1] - cy;
          dot(cx + X * Math.cos(rot) - Y * Math.sin(rot), cy + X * Math.sin(rot) + Y * Math.cos(rot), g.s * out[2], g.c);
        }
        glow(cx, cy, 26, 'rgba(255,230,170,0.9)', 'rgba(255,200,120,0.25)');
        var pulse = still ? 0.5 : (t * 0.0006) % 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255,230,170,' + (0.7 * (1 - pulse)).toFixed(2) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, 6 + pulse * 30, 0, PI2); ctx.stroke();
      };
    })();

    // Local Bubble → Local Interstellar Cloud: a rotating cavity shell with the Local Fluff at its heart
    S.bubble = (function () {
      var shell = [], fluff = [], wisps = [], i;
      for (i = 0; i < count(3200); i++) {
        var u = rnd() * 2 - 1, a = rnd() * PI2, s = Math.sqrt(1 - u * u), r = 1 + gauss() * 0.05 + 0.08 * Math.sin(a * 3) * s;
        shell.push({ p: [s * Math.cos(a) * r * 1.15, u * r * 0.9, s * Math.sin(a) * r], s: 0.6 + rnd() * 1.2, c: rgba(rnd() < 0.5 ? [150, 175, 255] : [195, 160, 255], 0.35 + rnd() * 0.5) });
      }
      for (i = 0; i < count(700); i++) fluff.push({ p: [gauss() * 0.13 + 0.05, gauss() * 0.08, gauss() * 0.11], s: 0.8 + rnd() * 1.5, c: rgba(rnd() < 0.5 ? [175, 220, 255] : [235, 235, 255], 0.3 + rnd() * 0.5) });
      for (i = 0; i < 70; i++) fluff.push({ p: [gauss() * 0.12 + 0.05, gauss() * 0.07, gauss() * 0.1], s: 7 + rnd() * 9, c: 'rgba(140,200,255,0.05)' });
      for (i = 0; i < count(900); i++) { var ang = rnd() * PI2, rr = 1.25 + rnd() * 0.5, big = rnd() < 0.06; wisps.push({ p: [Math.cos(ang) * rr * 1.2 + gauss() * 0.1, gauss() * 0.25, Math.sin(ang) * rr], s: big ? 9 + rnd() * 9 : 0.5 + rnd(), c: big ? (rnd() < 0.5 ? 'rgba(255,120,180,0.045)' : 'rgba(140,120,255,0.045)') : rgba([200, 190, 255], 0.2 + rnd() * 0.3) }); }
      var out = [0, 0, 0];
      return function (t) {
        clear(1); twinkle(t, 0.6);
        ctx.globalCompositeOperation = 'lighter';
        var ry = (still ? 0.5 : t * 0.00005 * o.speed) + mx * 0.004, rx = 0.35 + my * 0.004, cx = w * o.x, cy = h * o.y, sc = Math.min(w * 0.32, h * 0.46) * o.size;
        var all = [wisps, shell, fluff];
        for (var g = 0; g < 3; g++) for (var i = 0; i < all[g].length; i++) {
          var q = all[g][i]; proj(q.p, ry, rx, cx, cy, sc, out); dot(out[0], out[1], q.s * out[2], q.c);
        }
        proj([0.17, 0.02, 0.04], ry, rx, cx, cy, sc, out);
        glow(out[0], out[1], 18, 'rgba(255,230,170,0.95)', 'rgba(255,200,120,0.25)');
      };
    })();

    // Oort Cloud → Earth: the icy shell, planets on their orbits, Earth highlighted
    S.solar = (function () {
      var oort = [], i;
      for (i = 0; i < count(3400); i++) {
        var u = rnd() * 2 - 1, a = rnd() * PI2, s = Math.sqrt(1 - u * u), r = 0.72 + Math.pow(rnd(), 0.6) * 0.33;
        oort.push({ p: [s * Math.cos(a) * r, u * r, s * Math.sin(a) * r], s: 0.5 + rnd() * 0.9, c: rgba(rnd() < 0.6 ? [190, 210, 240] : [160, 190, 255], 0.3 + rnd() * 0.5) });
      }
      var planets = [[0.09, 2, [200, 190, 180]], [0.13, 2.8, [255, 220, 170]], [0.175, 3.4, [110, 170, 255]], [0.22, 2.6, [255, 140, 110]], [0.32, 5.6, [230, 200, 160]], [0.41, 4.8, [235, 215, 170]], [0.5, 3.8, [160, 230, 240]], [0.58, 3.7, [110, 150, 255]]];
      var phase = planets.map(function () { return rnd() * PI2; });
      var out = [0, 0, 0], tmp = [0, 0, 0];
      return function (t) {
        clear(1); twinkle(t, 0.7);
        ctx.globalCompositeOperation = 'lighter';
        var ry = (still ? 0.4 : t * 0.00003 * o.speed) + mx * 0.004, rx = 1.05 + my * 0.003, cx = w * o.x, cy = h * o.y, sc = Math.min(w * 0.4, h * 0.75) * o.size;
        for (var i = 0; i < oort.length; i++) { var q = oort[i]; proj(q.p, ry, rx, cx, cy, sc, out); dot(out[0], out[1], q.s * out[2], q.c); }
        glow(cx, cy, sc * 0.12, 'rgba(255,235,190,1)', 'rgba(255,190,110,0.35)');
        var time = still ? 0 : t * 0.00025 * o.speed;
        ctx.globalCompositeOperation = 'source-over';
        for (var k = 0; k < planets.length; k++) {
          var pr = planets[k][0], isEarth = k === 2;
          ctx.strokeStyle = isEarth ? 'rgba(157,184,255,0.55)' : 'rgba(255,255,255,0.12)'; ctx.lineWidth = isEarth ? 1.2 : 1;
          ctx.beginPath();
          for (var sgm = 0; sgm <= 64; sgm++) { var aa = sgm / 64 * PI2; proj([Math.cos(aa) * pr, 0, Math.sin(aa) * pr], ry, rx, cx, cy, sc, tmp); if (sgm) ctx.lineTo(tmp[0], tmp[1]); else ctx.moveTo(tmp[0], tmp[1]); }
          ctx.stroke();
          var pa = phase[k] + time / Math.pow(pr / 0.175, 1.5);
          proj([Math.cos(pa) * pr, 0, Math.sin(pa) * pr], ry, rx, cx, cy, sc, out);
          ctx.globalCompositeOperation = 'lighter';
          if (isEarth) {
            glow(out[0], out[1], 22, 'rgba(120,180,255,0.9)', 'rgba(80,140,255,0.25)');
            var pulse = still ? 0.5 : (t * 0.0007) % 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'rgba(157,184,255,' + (0.8 * (1 - pulse)).toFixed(2) + ')';
            ctx.beginPath(); ctx.arc(out[0], out[1], 5 + pulse * 26, 0, PI2); ctx.stroke();
            ctx.globalCompositeOperation = 'lighter';
          }
          ctx.fillStyle = rgba(planets[k][2], 1);
          ctx.beginPath(); ctx.arc(out[0], out[1], planets[k][1] * out[2] * (small ? 0.8 : 1), 0, PI2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }
      };
    })();

    // Single spiral galaxy (fallback)
    S.spiral = (function () {
      var P = spiral(count(4500));
      return function (t) {
        clear(1); twinkle(t, 1);
        ctx.globalCompositeOperation = 'lighter';
        var cx = (w < 760 ? w * 0.55 : w * o.x) + mx, cy = h * o.y + my, R = Math.min(w * 0.42, h * 0.62) * o.size;
        drawSpiral(P, cx, cy, R, o.tilt, 0.42, still ? 0 : t * 0.00005 * o.speed, 0.55);
      };
    })();

    var draw = S[o.scene] || S.spiral;

    // ---- lifecycle ----
    function resize() {
      var b = host.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, b.width); h = Math.max(1, b.height);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (still) draw(0);
    }
    function onMove(e) {
      var b = host.getBoundingClientRect();
      tx = ((e.clientX - b.left) / b.width - 0.5) * 40; ty = ((e.clientY - b.top) / b.height - 0.5) * 30;
    }
    function loop(t) {
      if (dead) return;
      mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      draw(t);
      raf = visible ? requestAnimationFrame(loop) : 0;
    }
    host.addEventListener('pointermove', onMove);
    resize();
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(host); } else window.addEventListener('resize', resize);
    if (!still) {
      if (window.IntersectionObserver) {
        io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !raf && !dead) raf = requestAnimationFrame(loop); });
        io.observe(host);
      }
      raf = requestAnimationFrame(loop);
    }
    return {
      stop: function () {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointermove', onMove);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        if (io) io.disconnect();
      }
    };
  }
  document.querySelectorAll('canvas[data-cosmos]').forEach(function (c) {
    var d = c.dataset;
    createCosmos(c, { scene: d.scene, x: d.x, y: d.y, size: d.size, tilt: d.tilt, stars: d.stars, speed: d.speed });
  });
})();
