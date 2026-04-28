# Catálogo Distrifel 2026

Sitio público de catálogo de productos para Distrifel (distribuidora argentina de plomería, gas y aislantes). Frontend estático servido desde GitHub Pages.

## Stack

- HTML / CSS / JS vanilla (sin framework)
- Hosting: GitHub Pages (`leandromondin-gh/Distrifel-catalogo`)
- Datos: `products.js` generado desde `Lista de precios-N.xlsx` (Python + openpyxl)
- Persistencia carrito: `localStorage`

## Estructura

```
.
├── index.html              # Layout único (navbar + sidebar + grid + modales)
├── styles.css              # Todos los estilos (~5000 líneas)
├── script.js               # App logic (~2000 líneas)
├── products.js             # Datos de productos + ofertas + config markup
├── Brands-icons/           # Logos de marcas (PNG/JPG/WebP)
├── banners/                # Banners promocionales del modal de ofertas
├── DECISIONES.md           # Decisiones de negocio y técnicas (lectura obligada)
└── Lista de precios-N.xlsx # Fuente de datos (no se sirve, solo en repo)
```

## Cómo actualizar productos

1. Editar `Lista de precios-N.xlsx` (sheet `Version-Final`).
2. Correr el parser (Python) que lee el Excel y regenera `products.js`.
3. Verificar local — abrir `index.html` en navegador, validar carga, filtros, ofertas.
4. Push a `main` → GitHub Pages despliega solo.

Estructura del Excel `Version-Final`:
- Col A: número de producto (solo en primera fila del grupo)
- Col B/C: CATEGORIA / TIPO (solo primera fila)
- Col D: Código (cada variante)
- Col E: Descripción producto (solo primera fila)
- Col F: Variante (cada fila)
- Col G: Precio (cada fila — `-` o vacío = sin stock)
- Col H: Imagen URL (solo primera fila)
- Col I: Marca (cada fila)

**Marcas y tipos nuevos** se agregan en `script.js` (`BRAND_NAMES`, `TYPE_LABELS`) y, si tienen logo, en `BRAND_LOGOS` + botón en el filtro HTML. Sin logo van como `filter-option--text-tile`.

## Features clave (v1)

- Búsqueda + filtros (Categoría > Tipo > Marca) con badges activos en sidebar
- Modal de ofertas con carousel autoplay y banners promocionales
- Carrito persistente con detección de oferta automática (precio dinámico según `boxQty`)
- Variantes sin precio aparecen como "Sin stock" (chip gris, Agregar deshabilitado)
- Toggle de sidebar para más espacio de catálogo
- Descarga de lista en CSV (Excel-compatible)
- Mobile responsive: drawer para sidebar y carrito, modal centrado, banners adaptados

## Lo que viene en v2 (planeado)

- Login por email + JWT (cliente accede sin corredor)
- Reactivar markup 20% + descuentos por cliente premium
- Niveles de descuento por cliente (A/B/C según acuerdo comercial)
- Descarga de lista en PDF
- Subcategorías desplegables (ej: Flexibles → Mallado / Cobre)

## Despliegue

`git push origin main` → GitHub Pages publica automáticamente. La rama remota usa un PAT personal del usuario (no credenciales de empresa).

## Documentación

- `DECISIONES.md` — por qué se tomaron ciertas decisiones (markup desactivado, precio por caja cerrada, sin login en v1, etc.). **Leer antes de tocar lógica de precios o auth.**
