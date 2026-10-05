/* Client-side access gate.
 * Keeps casual visitors out; it is NOT real security: anyone can read the site files.
 * Only a salted SHA-256 hash is stored here, never the credentials themselves.
 * To change them, run in Node:
 *   require('crypto').createHash('sha256').update('nicolas-site\n<user>\n<password>').digest('hex')
 * and paste the result into EXPECTED. User is compared lowercase; password is case-sensitive.
 */
(function () {
  'use strict';

  var SALT = 'nicolas-site';
  var EXPECTED = 'a776fa0e7ee579b1e60025e738f6f3cb544e6374bfad056f9656362ea03cbd60';

  function ror(x, n) { return (x >>> n) | (x << (32 - n)); }

  // Plain SHA-256, so it also works on http:// where crypto.subtle is unavailable.
  function sha256(str) {
    var msg = new TextEncoder().encode(str);
    var K = [], H = [], n = 0;
    function frac(x) { return ((x - Math.floor(x)) * 4294967296) | 0; }
    for (var p = 2; n < 64; p++) {
      var isPrime = true;
      for (var q = 2; q * q <= p; q++) if (p % q === 0) { isPrime = false; break; }
      if (!isPrime) continue;
      if (n < 8) H[n] = frac(Math.pow(p, 1 / 2));
      K[n++] = frac(Math.pow(p, 1 / 3));
    }

    var len = msg.length;
    var padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
    padded.set(msg);
    padded[len] = 0x80;
    var view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor((len * 8) / 4294967296));
    view.setUint32(padded.length - 4, (len * 8) >>> 0);

    var w = new Array(64);
    for (var off = 0; off < padded.length; off += 64) {
      var i;
      for (i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
      for (i = 16; i < 64; i++) {
        var s0 = ror(w[i - 15], 7) ^ ror(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = ror(w[i - 2], 17) ^ ror(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        var t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }

  var form = document.getElementById('gate-form');
  if (!form) return;
  var root = document.documentElement;
  var error = document.getElementById('gate-error');
  var busy = false;

  function unlock() {
    try { sessionStorage.setItem('auth', '1'); } catch (e) {}
    root.classList.remove('locked');
    window.scrollTo(0, 0);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (busy) return;
    busy = true;
    var user = form.elements.user.value.trim().toLowerCase();
    var pass = form.elements.pass.value;
    var ok = sha256(SALT + '\n' + user + '\n' + pass) === EXPECTED;
    // Small delay on every attempt to slow down guessing.
    setTimeout(function () {
      busy = false;
      if (ok) { unlock(); return; }
      error.hidden = false;
      form.elements.pass.value = '';
      form.elements.pass.focus();
      form.classList.remove('is-shaking');
      void form.offsetWidth;
      form.classList.add('is-shaking');
    }, 400);
  });

  form.addEventListener('input', function () { error.hidden = true; });

  if (root.classList.contains('locked')) {
    var first = form.elements.user;
    if (first) first.focus({ preventScroll: true });
  }
})();
