const productos = [
  { nombre: "Croquetas Premium 5kg", precio: 25, emoji: "🦴", rating: 5, desc: "Pollo y arroz", cat: "croquetas", stock: 12 },
  { nombre: "Croquetas Cachorro 3kg", precio: 18, emoji: "🐕", rating: 4, desc: "Para cachorros", cat: "croquetas", stock: 12 },
  { nombre: "Snacks de Hígado 200g", precio: 6, emoji: "🥩", rating: 5, desc: "Premio natural", cat: "snacks", stock: 8 },
  { nombre: "Croquetas Senior 4kg", precio: 22, emoji: "🐾", rating: 4, desc: "Perros mayores", cat: "croquetas", stock: 12 },
  { nombre: "Huesos Masticables", precio: 9, emoji: "🍖", rating: 3, desc: "Higiene dental", cat: "snacks", stock: 5 },
];

const fmt = n => '$' + n.toFixed(2);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const limpiar = s => String(s).replace(/[<>"'\\\x00-\x1f]/g, '').slice(0, 120);
const calcularTotales = () => {
  const subtotal = carrito.reduce((s, p) => s + p.precio * p.qty, 0);
  const descuento = (subtotal >= 50 ? subtotal * 0.1 : 0) + (cupon ? subtotal * 0.1 : 0);
  const envio = subtotal - descuento >= 40 || subtotal === 0 ? 0 : 5;
  return { subtotal, descuento, envio, total: subtotal - descuento + envio };
};
let cupon = localStorage.getItem('cupon') || '';
let carrito = (JSON.parse(localStorage.getItem('carrito') || '[]') || [])
  .filter(c => c && productos.some(p => p.nombre === c.nombre) && Number.isInteger(c.qty) && c.qty > 0 && c.qty <= 99);

const stockGuardado = JSON.parse(localStorage.getItem('stock') || '{}');
productos.forEach(p => { if (Number.isInteger(stockGuardado[p.nombre])) p.stock = stockGuardado[p.nombre]; });
let favoritos = (JSON.parse(localStorage.getItem('favoritos') || '[]') || [])
  .filter(f => productos.some(p => p.nombre === f));

function actualizarOpciones() {
  const n = cat => productos.filter(p => p.cat === cat).length;
  document.querySelector('#categoria option[value="croquetas"]').textContent = `Croquetas (${n('croquetas')})`;
  document.querySelector('#categoria option[value="snacks"]').textContent = `Snacks (${n('snacks')})`;
  document.querySelector('#categoria option[value="fav"]').textContent = `❤️ Favoritos (${favoritos.length})`;
}
let vistos = JSON.parse(sessionStorage.getItem('vistos') || '[]');
function ver(i) {
  const n = productos[i].nombre;
  vistos = [n, ...vistos.filter(v => v !== n)].slice(0, 4);
  sessionStorage.setItem('vistos', JSON.stringify(vistos));
  renderVistos();
}
function renderVistos() {
  document.getElementById('vistos').innerHTML = vistos.map(n => {
    const p = productos.find(x => x.nombre === n);
    return p ? `<span>${p.emoji} ${esc(p.nombre)}</span>` : '';
  }).join('') || '<span class="vacio">Aún no has visto productos</span>';
}
function toggleFav(i) {
  const n = productos[i].nombre;
  favoritos = favoritos.includes(n) ? favoritos.filter(f => f !== n) : [...favoritos, n];
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
  renderProductos();
  actualizarOpciones();
}
function compartir() {
  if (navigator.share) navigator.share({ title: 'DogFood', text: '¡Mira esta tienda de comida para perros!', url: location.href });
  else { navigator.clipboard.writeText(location.href); toast('Enlace copiado'); }
}

(function initFiltros() {
  const p = new URLSearchParams(location.search);
  if (p.get('q')) document.getElementById('buscar').value = p.get('q');
  if (p.get('cat')) document.getElementById('categoria').value = p.get('cat');
  if (p.get('orden')) document.getElementById('orden').value = p.get('orden');
})();
function actualizarURL() {
  const p = new URLSearchParams();
  const q = document.getElementById('buscar').value;
  if (q) p.set('q', q);
  const cat = document.getElementById('categoria').value;
  if (cat) p.set('cat', cat);
  const orden = document.getElementById('orden').value;
  if (orden) p.set('orden', orden);
  history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
}
function renderProductos() {
  actualizarURL();
  const q = document.getElementById('buscar').value.toLowerCase();
  const cat = document.getElementById('categoria').value;
  const lista = productos.filter(p =>
    p.nombre.toLowerCase().includes(q) &&
    (cat === 'fav' ? favoritos.includes(p.nombre) : (!cat || p.cat === cat)));
  const orden = document.getElementById('orden').value;
  const ordenes = {
    asc: (a, b) => a.precio - b.precio,
    desc: (a, b) => b.precio - a.precio,
    rating: (a, b) => b.rating - a.rating,
    nombre: (a, b) => a.nombre.localeCompare(b.nombre),
    stock: (a, b) => b.stock - a.stock,
  };
  if (ordenes[orden]) lista.sort(ordenes[orden]);
  document.getElementById('products').innerHTML = lista.map(p => {
    const i = productos.indexOf(p);
    return `<div class="card">
      ${p.precio < 10 ? '<span class="badge">OFERTA</span>' : ''}
      <div class="emoji">${esc(p.emoji)}</div>
      <button onclick="toggleFav(${i})" class="fav-btn">${favoritos.includes(p.nombre) ? '❤️' : '🤍'}</button>
      <h3 class="link-prod" onclick="ver(${i})">${esc(p.nombre)}</h3>
      <p>${esc(p.desc)}</p>
      <p class="price">$${p.precio}</p>
      <p class="stock${p.stock < 6 ? ' bajo' : ''}">${p.stock < 6 ? '¡Últimas ' + p.stock + ' unidades!' : 'En stock: ' + p.stock}</p>
      <p>${'★'.repeat(p.rating)}${'☆'.repeat(5 - p.rating)}</p>
      <button onclick="agregar(${i})" ${p.stock <= 0 ? 'disabled class="agotado"' : ''}>${p.stock <= 0 ? 'Agotado' : 'Agregar'}</button>
    </div>`;
  }).join('') || '<p>No hay productos.</p>';
  document.getElementById('resultados').textContent = lista.length + ' producto(s) encontrado(s)';
}

function agregar(i) {
  if (productos[i].stock <= 0) return toast('Agotado');
  productos[i].stock--;
  const item = carrito.find(c => c.nombre === productos[i].nombre);
  if (item) item.qty++;
  else carrito.push({ ...productos[i], qty: 1 });
  const cc = document.getElementById('carrito-count');
  cc.classList.remove('pulso'); void cc.offsetWidth; cc.classList.add('pulso');
  guardar();
  renderProductos();
  toast(productos[i].nombre + ' agregado');
}
function resetDatos() {
  if (confirm('¿Borrar carrito, favoritos y preferencias?')) { localStorage.clear(); location.reload(); }
}
function limpiarFiltros() {
  document.getElementById('buscar').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('orden').value = '';
  renderProductos();
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = 1;
  clearTimeout(t._h);
  t._h = setTimeout(() => t.style.opacity = 0, 2000);
}
function toggleTema() {
  document.body.classList.toggle('oscuro');
  localStorage.setItem('tema', document.body.classList.contains('oscuro') ? 'oscuro' : 'claro');
  toast(document.body.classList.contains('oscuro') ? 'Modo oscuro' : 'Modo claro');
}
if (localStorage.getItem('tema') === 'oscuro' || (!localStorage.getItem('tema') && matchMedia('(prefers-color-scheme: dark)').matches))
  document.body.classList.add('oscuro');
function quitar(i) {
  const prod = productos.find(p => p.nombre === carrito[i].nombre);
  if (prod) prod.stock += carrito[i].qty;
  carrito.splice(i, 1);
  guardar();
  renderProductos();
}
function cambiar(i, d) {
  const prod = productos.find(p => p.nombre === carrito[i].nombre);
  if (d > 0 && prod && prod.stock <= 0) return toast('Sin stock');
  const nueva = carrito[i].qty + d;
  if (nueva > 99) return toast('Máximo 99 por producto');
  if (prod) prod.stock -= d;
  carrito[i].qty = nueva;
  if (carrito[i].qty <= 0) carrito.splice(i, 1);
  guardar();
  renderProductos();
}
function guardar() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
  localStorage.setItem('stock', JSON.stringify(Object.fromEntries(productos.map(p => [p.nombre, p.stock]))));
  render();
}
function render() {
  document.getElementById('cart-items').innerHTML = carrito.map((p, i) =>
    `<li><span>${esc(p.nombre)}</span><span class="qty">
      <button onclick="cambiar(${i},-1)">-</button>${p.qty}<button onclick="cambiar(${i},1)">+</button>
      $${(p.precio * p.qty).toFixed(2)} <button onclick="quitar(${i})" class="btn-quitar">x</button></span></li>`).join('');
  const { subtotal, descuento, envio, total } = calcularTotales();
  document.getElementById('total').textContent = 'Total: ' + fmt(total) + (carrito.length ? (envio ? ' (envío $' + envio.toFixed(2) + ')' : ' (envío gratis)') : '');
  document.getElementById('ahorro').textContent = descuento ? 'Ahorras $' + descuento.toFixed(2) + (cupon ? ' (incluye cupón)' : '') : '';
  const btn = document.querySelector('button[onclick="enviarPedido()"]');
  if (btn) btn.textContent = carrito.length ? 'Pedir por WhatsApp (' + fmt(total) + ')' : 'Pedir por WhatsApp';
  document.getElementById('carrito-count').textContent = '🛒 ' +
    carrito.reduce((s, p) => s + p.qty, 0);
  if (!carrito.length)
    document.getElementById('cart-items').innerHTML = '<li>El carrito está vacío.</li>';
}
function vaciar() {
  if (carrito.length && confirm('¿Vaciar el carrito?')) {
    carrito.forEach(c => { const p = productos.find(x => x.nombre === c.nombre); if (p) p.stock += c.qty; });
    carrito = []; guardar(); renderProductos(); toast('Carrito vacío');
  }
}
document.getElementById('year').textContent = new Date().getFullYear();
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); document.getElementById('buscar').focus(); }
});
let _t;
function buscarDebounced() { clearTimeout(_t); _t = setTimeout(renderProductos, 250); }
if (cupon) document.getElementById('cupon').value = cupon;
function aplicarCupon() {
  const c = document.getElementById('cupon').value.trim().toUpperCase();
  if (c === 'BIENVENIDA10') { cupon = c; localStorage.setItem('cupon', c); toast('Cupón aplicado: 10% extra'); }
  else { cupon = ''; localStorage.removeItem('cupon'); toast('Cupón inválido'); }
  render();
}
function construirMensaje() {
  const nombre = limpiar(document.getElementById('nombre').value.trim());
  const dir = limpiar(document.getElementById('direccion').value.trim());
  const { descuento, envio, total } = calcularTotales();
  const idPedido = Math.random().toString(36).slice(2, 8).toUpperCase();
  let msg = `Hola, soy ${nombre}. Pedido #${idPedido} (${new Date().toLocaleDateString()}):\n`;
  carrito.forEach(p => msg += `- ${p.nombre} x${p.qty} ($${p.precio * p.qty})\n`);
  if (cupon) msg += `Cupón: ${cupon}\n`;
  if (envio) msg += `Envío: $${envio.toFixed(2)}\n`;
  msg += `Total: $${total.toFixed(2)}\nDirección: ${dir}`;
  return msg;
}
function previsualizar() {
  if (!carrito.length) return alert('Agrega productos al carrito');
  alert(construirMensaje());
}
function copiarPedido() {
  if (!carrito.length) return alert('Agrega productos al carrito');
  navigator.clipboard.writeText(construirMensaje()).then(() => toast('Pedido copiado'));
}
let ultimoEnvio = 0;
function enviarPedido() {
  if (!carrito.length) return alert('Agrega productos al carrito');
  if (document.getElementById('web').value) return;
  const ahora = Date.now();
  if (ahora - ultimoEnvio < 5000) return toast('Espera unos segundos antes de reenviar');
  ultimoEnvio = ahora;
  const nombre = document.getElementById('nombre').value.trim();
  const dir = document.getElementById('direccion').value.trim();
  if (!nombre || !dir) return alert('Completa tu nombre y dirección');
  const msg = construirMensaje();
  window.open('https://wa.me/0000000000?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  carrito = [];
  guardar();
}

renderProductos();
render();
actualizarOpciones();
renderVistos();
window.addEventListener('storage', e => {
  if (e.key === 'carrito') {
    carrito = (JSON.parse(e.newValue || '[]') || []).filter(c => c && productos.some(p => p.nombre === c.nombre));
    render();
  }
});
