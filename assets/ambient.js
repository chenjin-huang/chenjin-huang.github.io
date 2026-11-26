// Optional generative ambient soundtrack. Off by default; the visitor turns it on with the SOUND button.
// The page's scene comes from <body data-scene="...">; the choice is remembered across pages.
(function () {
  function createAmbient(scene) {
    // Generative space ambience. One preset per cosmic scale; deeper and slower at the largest scales.
    var PRESETS = {
      web:        { root: 55.00, chord: [1, 1.5, 2, 3],          cutoff: 420,  lfo: 0.025, spark: 6.5, noise: 0.05, octave: 4 },
      flow:       { root: 58.27, chord: [1, 1.5, 2, 2.25, 3],    cutoff: 560,  lfo: 0.03,  spark: 5.0, noise: 0.06, octave: 4 },
      localgroup: { root: 65.41, chord: [1, 1.5, 2, 2.5],        cutoff: 760,  lfo: 0.035, spark: 4.0, noise: 0.045, octave: 4 },
      arm:        { root: 73.42, chord: [1, 1.5, 2, 2.5, 3],     cutoff: 1000, lfo: 0.04,  spark: 3.2, noise: 0.04, octave: 5 },
      bubble:     { root: 82.41, chord: [1, 1.25, 1.5, 2],       cutoff: 1300, lfo: 0.05,  spark: 2.6, noise: 0.035, octave: 5 },
      solar:      { root: 98.00, chord: [1, 1.25, 1.5, 2, 3],    cutoff: 1700, lfo: 0.06,  spark: 2.0, noise: 0.03, octave: 5 },
      spiral:     { root: 65.41, chord: [1, 1.5, 2, 3],          cutoff: 700,  lfo: 0.035, spark: 4.0, noise: 0.045, octave: 4 }
    };
    var P = PRESETS[scene] || PRESETS.spiral;
    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = null, master = null, nodes = [], timer = 0, running = false, sparkleFn = null;
    var PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];

    function impulse(seconds) {
      var len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var c = 0; c < 2; c++) {
        var d = buf.getChannelData(c);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
      return buf;
    }
    function noiseBuffer() {
      var len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
      for (var i = 0; i < len; i++) { // soft pink-ish noise
        var wn = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + wn * 0.029; b1 = 0.985 * b1 + wn * 0.032; b2 = 0.95 * b2 + wn * 0.048;
        d[i] = (b0 + b1 + b2) * 0.35;
      }
      return buf;
    }
    function lfo(rate, depth, target) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(target); o.start(); nodes.push(o);
    }
    function build() {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0;
      var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 3;
      var verb = ctx.createConvolver(); verb.buffer = impulse(5);
      var wet = ctx.createGain(); wet.gain.value = 0.55;
      var dry = ctx.createGain(); dry.gain.value = 0.6;
      var bus = ctx.createGain();
      bus.connect(dry); bus.connect(verb); verb.connect(wet);
      dry.connect(master); wet.connect(master); master.connect(comp); comp.connect(ctx.destination);

      // drone pad through a slowly breathing low-pass filter
      var filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = P.cutoff; filt.Q.value = 0.7;
      lfo(P.lfo, P.cutoff * 0.45, filt.frequency);
      filt.connect(bus);
      P.chord.forEach(function (ratio, i) {
        [-4, 4].forEach(function (cents) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = i === 0 ? 'sine' : 'triangle';
          o.frequency.value = P.root * ratio; o.detune.value = cents + (Math.random() * 3 - 1.5);
          g.gain.value = (i === 0 ? 0.16 : 0.07) / P.chord.length * 2;
          lfo(0.02 + Math.random() * 0.05, g.gain.value * 0.6, g.gain);
          o.connect(g); g.connect(filt); o.start(); nodes.push(o);
        });
      });

      // cosmic wind: filtered noise
      var ns = ctx.createBufferSource(); ns.buffer = noiseBuffer(); ns.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = P.cutoff * 1.4; bp.Q.value = 0.8;
      lfo(P.lfo * 0.7, P.cutoff * 0.6, bp.frequency);
      var ng = ctx.createGain(); ng.gain.value = P.noise;
      ns.connect(bp); bp.connect(ng); ng.connect(bus); ns.start(); nodes.push(ns);

      // distant star sparkles: soft pentatonic pings
      function sparkle() {
        if (!running) return;
        var t = ctx.currentTime, f = P.root * Math.pow(2, P.octave - 1 + (Math.random() < 0.3 ? 1 : 0)) * PENTA[(Math.random() * PENTA.length) | 0];
        var o = ctx.createOscillator(), g = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
        o.connect(g);
        if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; g.connect(pan); pan.connect(verb); pan.connect(dry); } else g.connect(bus);
        o.start(t); o.stop(t + 3.6);
        timer = setTimeout(sparkle, (P.spark * (0.5 + Math.random())) * 1000);
      }
      sparkleFn = sparkle;
    }

    return {
      start: function () {
        if (!AC) return false;
        if (!ctx) build();
        running = true;
        if (ctx.state === 'suspended') ctx.resume();
        var t = ctx.currentTime;
        master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0.45, t + 2.5);
        if (!timer && sparkleFn) timer = setTimeout(sparkleFn, 1500);
        return true;
      },
      stop: function (close) {
        if (!ctx) return;
        running = false; clearTimeout(timer); timer = 0;
        var t = ctx.currentTime;
        master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0, t + 0.8);
        if (close) { var c = ctx; ctx = null; setTimeout(function () { try { c.close(); } catch (e) {} }, 900); }
        else setTimeout(function () { if (!running && ctx) ctx.suspend(); }, 900);
      },
      supported: !!AC
    };
  }
  var KEY = 'cj-sound', btn = document.querySelector('[data-sound-toggle]');
  if (!btn) return;
  var amb = createAmbient(document.body.getAttribute('data-scene'));
  if (!amb.supported) { btn.hidden = true; return; }
  var on = false, started = false;
  function save(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }
  function render() { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.querySelector('.sound-label').textContent = on ? 'SOUND ON' : 'SOUND OFF'; }
  function set(v) { on = v; if (on) { amb.start(); started = true; } else amb.stop(); save(on); render(); }
  btn.addEventListener('click', function () { if (on && !started) set(true); else set(!on); });
  var wanted = false;
  try { wanted = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (wanted) {
    // Browsers only allow sound after an interaction, so resume on the first click or key press.
    on = true; render();
    var resume = function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest('[data-sound-toggle]')) return;
      window.removeEventListener('pointerdown', resume); window.removeEventListener('keydown', resume);
      if (on && !started) { amb.start(); started = true; }
    };
    window.addEventListener('pointerdown', resume); window.addEventListener('keydown', resume);
  }
  render();
})();
