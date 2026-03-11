# Acuaponía Escolar · Seguimiento e Investigación

Sitio estático listo para subir a GitHub Pages.

## Incluye
- Diseño moderno responsive
- Tema claro / oscuro
- Herramientas de accesibilidad
- Formulario de registro diario
- Guardado local en navegador
- Exportación CSV
- Gráficos con Chart.js
- PWA básica
- Páginas preparadas para 3D, AR y VR
- SEO básico (robots, sitemap, schema)

## Estructura
- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `sw.js`
- `robots.txt`
- `sitemap.xml`
- `pages/viewer3d.html`
- `pages/viewerAR.html`
- `pages/viewerVR.html`
- `assets/icon.svg`
- `assets/models/acuaponia.glb` *(placeholder: debes agregar tu modelo)*
- `google-sheets/Code.gs`

## Publicación en GitHub Pages
1. Crea un repositorio nuevo.
2. Sube todos los archivos.
3. Ve a `Settings > Pages`.
4. En `Build and deployment`, selecciona `Deploy from a branch`.
5. Elige la rama principal y la carpeta raíz `/`.

## Integración con Google Sheets
1. Crea una hoja nueva en Google Sheets.
2. Abre `Extensiones > Apps Script`.
3. Copia el contenido de `google-sheets/Code.gs`.
4. Publica como `Aplicación web` con acceso para quien tenga el enlace.
5. Copia la URL publicada.
6. En `app.js`, reemplaza `PEGA_AQUI_TU_URL_DE_APPS_SCRIPT` por la URL.

## Personalización sugerida
- Cambiar `TU-USUARIO` y nombre del repositorio en `sitemap.xml`, `robots.txt` y `canonical`.
- Reemplazar el modelo 3D placeholder.
- Ajustar colores o textos a tu identidad visual.
