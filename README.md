# DogFood 🐶

Landing page estática de comida para perros con carrito y pedidos por WhatsApp.

## Estructura

- `index.html` — página principal
- `css/styles.css` — estilos
- `js/app.js` — lógica del carrito, filtros, cupones, favoritos
- `js/register-sw.js` — registro del service worker
- `sw.js` — caché offline
- `manifest.json` — PWA

## Uso

```sh
npm start   # sirve en http://localhost:8080
```

Configura el número de WhatsApp en `js/app.js` (`wa.me/...`) y en el botón flotante de `index.html`.
