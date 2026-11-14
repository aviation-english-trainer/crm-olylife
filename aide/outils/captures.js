#!/usr/bin/env node
/* Captures d'écran des tutoriels — CRM OlyLife WLHT
   ------------------------------------------------------------------
   Rejoue le CRM dans un téléphone simulé, avec le jeu de données de démonstration
   (demo-data.js) à la place du serveur, et enregistre les images dans aide/img/.
   Aucune requête ne part vers le vrai serveur : tout est intercepté.

   Lancer depuis la racine du dépôt :
       npm i playwright            (une seule fois)
       node aide/outils/captures.js            → toutes les captures
       node aide/outils/captures.js profil     → seulement celles dont le nom contient « profil »

   Variable facultative FONTS_DIR : dossier node_modules contenant @fontsource/outfit et
   @fontsource/cormorant-garamond, pour les machines sans accès à Google Fonts. */
'use strict';
var fs = require('fs'), path = require('path'), http = require('http');
var playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require(path.join(process.env.PW_MODULE || '', 'playwright')); }
var demo = require('./demo-data.js');

var ROOT = path.resolve(__dirname, '..', '..');
var OUT = path.join(ROOT, 'aide', 'img');
var ONLY = process.argv[2] || '';
var MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
var UA_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
var UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

function serve() {
  return new Promise(function (res) {
    var s = http.createServer(function (rq, rs) {
      var p = decodeURIComponent(rq.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      var f = path.join(ROOT, p);
      if (f.indexOf(ROOT) !== 0 || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end(); return; }
      rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(rs);
    }).listen(0, '127.0.0.1', function () { res(s); });
  });
}

function fontCss() {
  var dir = process.env.FONTS_DIR; if (!dir) return null;
  var css = '', files = {};
  [['outfit', 'Outfit', [400, 500, 600, 700]], ['cormorant-garamond', 'Cormorant Garamond', [500, 600, 700]]].forEach(function (f) {
    f[2].forEach(function (w) {
      ['latin', 'latin-ext'].forEach(function (sub) {
        var name = f[0] + '-' + sub + '-' + w + '-normal.woff2', fp = path.join(dir, '@fontsource', f[0], 'files', name);
        if (!fs.existsSync(fp)) return;
        files[name] = fp;
        css += '@font-face{font-family:"' + f[1] + '";font-weight:' + w + ';font-style:normal;src:url(https://fonts.gstatic.com/demo/' + name + ') format("woff2");unicode-range:' +
          (sub === 'latin' ? 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD' : 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF') + ';}\n';
      });
    });
  });
  return { css: css, files: files };
}

/* Ouvre le CRM dans un téléphone simulé. opt : {role, ua, connecte, installe, storage, serveur} */
async function ouvrir(browser, base, opt) {
  opt = opt || {};
  var payload = demo.build(opt.role || 'gestionnaire');
  if (opt.user) Object.assign(payload.user, opt.user);
  var ctx = await browser.newContext({
    viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: opt.ua || UA_ANDROID, locale: 'fr-FR', timezoneId: 'Europe/Paris', serviceWorkers: 'block'
  });
  await ctx.grantPermissions(['notifications']).catch(function () {});
  var fonts = fontCss();
  var etat = { horsLigne: false };
  await ctx.route(function (u) { return u.hostname !== '127.0.0.1'; }, async function (route) {
    var u = new URL(route.request().url());
    if (u.hostname === 'script.google.com') {
      if (etat.horsLigne) return route.abort('internetdisconnected');
      var body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      if (body.op === 'login' || body.op === 'pull') return route.fulfill({ contentType: 'application/json', body: JSON.stringify(payload) });
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, sessions: [{ id: 's1', label: 'Android · Chrome · app installée', current: true, last: new Date().toISOString() }] }) });
    }
    if (fonts && u.hostname === 'fonts.googleapis.com') return route.fulfill({ contentType: 'text/css', body: fonts.css });
    if (fonts && u.hostname === 'fonts.gstatic.com') { var n = path.basename(u.pathname); if (fonts.files[n]) return route.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(fonts.files[n]) }); }
    if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return route.continue().catch(function () {});
    return route.abort();
  });
  var storage = Object.assign({}, opt.storage || {});
  if (opt.connecte !== false) storage.owlht2_token = payload.token;
  if (opt.installe !== false) storage.owlht2_installed = '1';
  storage.owlht2_calnudge = storage.owlht2_calnudge || 'done';
  await ctx.addInitScript(function (st) {
    try { Object.keys(st).forEach(function (k) { if (localStorage.getItem(k) === null) localStorage.setItem(k, st[k]); }); sessionStorage.setItem('owlht2_inst_note', '1'); } catch (e) {}
  }, storage);
  var page = await ctx.newPage();
  await page.goto(base + '/index.html', { waitUntil: 'load' });
  await page.evaluate(function () { return document.fonts && document.fonts.ready; });
  await page.waitForTimeout(1400);
  // Les messages furtifs (« Bonjour … ») ne doivent pas masquer l'écran capturé
  await page.addStyleTag({ content: '#otc{display:none!important}' }).catch(function () {});
  return { ctx: ctx, page: page, etat: etat, payload: payload };
}

/* Entoure un élément d'un cadre or + pastille numérotée, pour montrer où toucher. */
async function marquer(page, sel, num) {
  await page.evaluate(function (a) {
    var el = typeof a.sel === 'string' ? document.querySelector(a.sel) : null; if (!el) return;
    if (getComputedStyle(el).position !== 'fixed') el.scrollIntoView({ block: 'center' });
    var r = el.getBoundingClientRect(), m = document.createElement('div');
    var W = window.innerWidth, H = window.innerHeight;
    var x = Math.max(4, r.left - 5), y = Math.max(4, r.top - 5), w = Math.min(r.right + 5, W - 4) - x, h = Math.min(r.bottom + 5, H - 4) - y;
    m.className = 'tuto-mark';
    m.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;border:3px solid #C9A84C;border-radius:14px;box-shadow:0 0 0 4px rgba(201,168,76,.28);left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px';
    if (a.num) { var b = document.createElement('b'); b.textContent = a.num; b.style.cssText = 'position:absolute;top:' + Math.max(-13, 2 - y) + 'px;left:' + Math.max(-13, 2 - x) + 'px;width:26px;height:26px;border-radius:50%;background:#C9A84C;color:#20362A;font:700 14px/26px Outfit,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.3)'; m.appendChild(b); }
    document.body.appendChild(m);
  }, { sel: sel, num: num || '' });
  await page.waitForTimeout(150);
}
async function demarquer(page) { await page.evaluate(function () { document.querySelectorAll('.tuto-mark').forEach(function (m) { m.remove(); }); }); }

async function photo(page, nom) {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, nom + '.jpg'), type: 'jpeg', quality: 72 });
  console.log('  ✓ ' + nom + '.jpg');
}

module.exports = { ouvrir: ouvrir, marquer: marquer, demarquer: demarquer, photo: photo, serve: serve, UA_ANDROID: UA_ANDROID, UA_IPHONE: UA_IPHONE, OUT: OUT };

if (require.main === module) {
  (async function () {
    var scenes = require('./scenes.js');
    var srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port;
    var browser = await playwright.chromium.launch();
    var fait = 0, rate = 0;
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i]; if (ONLY && s.nom.indexOf(ONLY) < 0) continue;
      console.log(s.nom);
      var o = null;
      try { o = await ouvrir(browser, base, s.opt); await s.jouer(o.page, { marquer: marquer, demarquer: demarquer, photo: photo, etat: o.etat }); fait++; }
      catch (e) { rate++; console.error('  ✗ ' + s.nom + ' : ' + e.message.split('\n')[0]); }
      if (o) await o.ctx.close();
    }
    await browser.close(); srv.close();
    console.log(fait + ' scène(s) jouée(s)' + (rate ? ', ' + rate + ' en échec' : ''));
    process.exit(rate ? 1 : 0);
  })();
}
