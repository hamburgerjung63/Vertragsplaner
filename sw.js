'use strict';

const root = self.registration.scope;
const cachePrefix = 'vertragsplaner:' + root + ':';
const cacheName = cachePrefix + '1';
const files = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png']
  .map(path => new URL(path,root).href);

self.addEventListener('install',event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)).then(() => self.skipWaiting()));
});

self.addEventListener('activate',event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event => {
  const {request} = event;
  if (request.method !== 'GET' || !files.includes(new URL(request.url).origin + new URL(request.url).pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        try {
          await cache.put(request,response.clone());
        } catch {
          // A full cache should not interrupt normal online use.
        }
      }
      return response;
    } catch {
      return await cache.match(request,{ignoreSearch:true}) || Response.error();
    }
  })());
});
