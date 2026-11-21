/* Service worker for My Entrepreneur OS.
   =========================================================================
   Two different jobs, so two strategies:

   - index.html and app.enc are NETWORK FIRST. A published build must win
     over a cached one, or the installed app would keep opening an old
     version with no way to notice. When the network is gone, the cached
     copy answers and the app opens offline exactly as it did last time.
   - icons and fonts are CACHE FIRST. They never change without a new
     version of this file.

   app.enc is ciphertext, so caching it stores nothing readable.
   ====================================================================== */

var VERSION = 'eos-v1';
var SHELL = ['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(VERSION).then(function(c){
      /* addAll fails the whole install if any single file 404s, which would
         leave the app with no offline copy at all; each file is added on
         its own so one missing icon cannot do that. */
      return Promise.all(SHELL.map(function(u){
        return c.add(u).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== VERSION; })
                            .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     /* fonts.css lives elsewhere: leave it alone */

  var path = url.pathname;
  var isApp = /app\.enc$/.test(path);
  var isPage = path.endsWith('/') || /index\.html$/.test(path);

  if (isApp || isPage) {
    e.respondWith(
      fetch(req).then(function(res){
        /* The page asks for app.enc?v=<timestamp>; store it under the plain
           URL so the next offline open finds it whatever the query was. */
        var copy = res.clone();
        caches.open(VERSION).then(function(c){ c.put(isApp ? 'app.enc' : 'index.html', copy); });
        return res;
      }).catch(function(){
        return caches.match(isApp ? 'app.enc' : 'index.html').then(function(hit){
          return hit || Response.error();
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(VERSION).then(function(c){ c.put(req, copy); });
        return res;
      });
    })
  );
});
