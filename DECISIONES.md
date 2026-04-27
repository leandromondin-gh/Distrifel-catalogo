# Decisiones del Proyecto — Catálogo Distrifel 2026

Registro de decisiones de negocio y técnicas. Cada entrada explica **qué** se decidió y **por qué**, para entender el sistema sin leer el código.

---

## 1. Precios con markup del 20%

**Decisión:** Todos los precios del catálogo se muestran con un 20% de incremento sobre el precio real.

**Por qué:** La competencia puede acceder a la página y ver los precios. Al mostrar precios inflados, se protege el margen real de Distrifel.

**Cómo funciona:**
- `products.js` contiene los precios reales.
- Al renderizar las cards, se multiplica por `PRICE_MARKUP` (1.20).
- Los clientes de la lista de descuento ven el precio real (el markup se anula).

**Dónde está:** `script.js` → constante `PRICE_MARKUP` y función `applyClientDiscount()`.

---

## 2. Descuento por cliente (lista fija, sin login)

**Decisión:** Clientes con descuento se identifican solo por nombre en el popup de corredor. No hay login ni contraseña en v1.

**Por qué:** Simplicidad para v1. El corredor carga el nombre del cliente al inicio de la sesión. Si el nombre está en la lista, los precios se muestran sin el markup.

**Lista de clientes con descuento:** definida en `products.js` → `DISCOUNT_CLIENTS` (array de nombres, case-insensitive).

**Descuento aplicado:** -20% sobre el precio mostrado (equivale al precio real).

**Evolución futura:** Reemplazar por login con email + JWT para que cada cliente acceda desde su dispositivo sin corredor.

---

## 3. Ofertas por caja cerrada — precio dinámico

**Decisión:** Las ofertas solo aplican el descuento si la cantidad en el carrito es ≥ `boxQty` (cantidad mínima de caja cerrada).

**Por qué:** El precio especial existe porque el cliente compra una caja completa. Si baja la cantidad, ya no aplica la condición comercial.

**Cómo funciona:**
- El modal de Ofertas agrega `boxQty` unidades de una vez al precio con descuento.
- Si el usuario baja la cantidad en el carrito por debajo de `boxQty`, el precio vuelve al precio unitario normal (con markup si corresponde).
- El carrito muestra un badge verde "-X% aplicado" o rojo "Necesitás N u. para el descuento".

**Dónde está:** `products.js` → array `DISTRIFEL_OFFERS`. Cada oferta tiene `originalPrice`, `discount` (%) y `boxQty`.

---

## 4. Estructura de ofertas — array editable

**Decisión:** Las ofertas se definen en `products.js` en el array `DISTRIFEL_OFFERS`, no hardcodeadas en el HTML.

**Por qué:** Permite agregar/modificar/quitar ofertas sin tocar código JS ni HTML. Solo editar el array.

**Campos por oferta:**
```js
{
  title:         'Nombre del producto',
  variant:       'Variante',
  image:         'URL de la imagen',
  brand:         'clave de marca (igual que en BRAND_LOGOS)',
  originalPrice: 58673,   // precio real sin descuento
  discount:      10,       // porcentaje de descuento
  boxQty:        12,       // cantidad mínima para aplicar el descuento
  condition:     'caja cerrada'
}
```

---

## 5. Filtro de marcas — grilla de logos

**Decisión:** El filtro de marcas en el sidebar muestra logos en una grilla de 2-3 columnas en vez de lista de texto.

**Por qué:** Más visual, reconocimiento de marca inmediato, ocupa menos espacio vertical que una lista.

**Marcas sin logo** (Cirino, Espuma Foam): se muestran como tiles de texto del mismo tamaño para mantener consistencia visual.

**Dónde están los logos:** carpeta `Brands-icons/`. Para agregar una marca nueva: subir el logo a esa carpeta, agregar la entrada en `BRAND_LOGOS` (`script.js`) y agregar el botón en `index.html` dentro del `filter-menu[data-menu="brand"]`.

---

## 6. Modal de Ofertas — botón central en navbar

**Decisión:** El botón "Ofertas Destacadas" va centrado en el navbar con animación de pulso sutil.

**Por qué:** Es el principal diferenciador comercial de la semana. Posición central maximiza visibilidad sin competir con las acciones principales (logo izquierda, carrito/corredor derecha).

**Color:** Azul royal (`#1D4ED8 → #2563EB`) — se diferencia del teal del carrito y del fondo oscuro del navbar.

---

## 7. Carrito — persistencia en localStorage

**Decisión:** El carrito se guarda en `localStorage` bajo la clave `distrifel_cart`.

**Por qué:** El corredor puede cerrar el navegador accidentalmente y no perder el pedido en construcción.

**Limitación:** Los datos no se sincronizan entre dispositivos. Es suficiente para v1 donde cada corredor usa su propio dispositivo.

---

## 8. Sin login en v1

**Decisión:** No hay autenticación. La identidad del corredor/cliente se carga manualmente en el popup al inicio de la sesión.

**Por qué:** Reduce complejidad de v1. El objetivo es validar el catálogo con clientes reales antes de invertir en infraestructura de autenticación.

**Riesgos aceptados:** Cualquiera puede poner un nombre de la lista de descuento y ver precios reales. Mitigado porque la URL no es pública todavía.

---

## 9. Variantes — todas visibles (sin dropdown "···")

**Decisión:** Todas las variantes de un producto se muestran como chips visibles. No se truncan con "···".

**Por qué:** El cliente necesita ver todas las opciones disponibles de un vistazo para decidir. El truncado generaba fricción innecesaria.

**CSS:** `.card-variants` usa `flex-wrap`, los chips saltan de línea cuando no entran.

---

## Pendientes / Próximas decisiones

- [ ] **Filtros con subcategorías desplegables** (ej: Flexibles → Mallado / Cobre / Extensibles)
- [ ] **Descarga de lista en Excel y PDF**
- [ ] **Login por email** para que clientes accedan desde su dispositivo sin corredor
- [ ] **Precios por nivel de cliente** (descuento A, B, C según acuerdo comercial)
