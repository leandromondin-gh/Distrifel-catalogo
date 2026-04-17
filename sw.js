const CACHE_NAME = 'distrifel-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './logo.png',
    './fondo.jpg',
    './Brands-icons/alarsa.png',
    './Brands-icons/latyn-flex.png',
    './Brands-icons/paz.png',
    './Brands-icons/duke.png',
    './imagenes-productos/latynflex/flexible-agua.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS).catch(() => {}))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    event.respondWith(
        caches.match(req).then(cached => {
            const network = fetch(req).then(resp => {
                if (resp && resp.status === 200 && resp.type === 'basic') {
                    const copy = resp.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, copy));
                }
                return resp;
            }).catch(() => cached);

            return cached || network;
        })
    );
});
