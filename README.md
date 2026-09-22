# Latita — catálogo de postres en lata

Catálogo React/Vite adaptable a celular y computadora. Incluye filtros, búsqueda, carrito persistente y pedido redactado para WhatsApp. Alojamiento estático en GitHub Pages.

## Configuración del negocio

Editar `src/catalog.js`:

- `brand.whatsapp`: número de WhatsApp del negocio con código internacional, solo dígitos. Ejemplo de formato argentino: `5493511234567` (usar el número real). Mientras está vacío, WhatsApp abre el pedido para compartir y el cliente debe elegir el destinatario.
- `products`: los seis nombres se tomaron de una publicación pública del perfil; confirmar disponibilidad e ingredientes, y agregar precios reales. `price: null` muestra «Consultar precio» y omite el importe del pedido. Los precios numéricos se expresan en ARS.
- Los dibujos de latas son ilustraciones CSS de muestra. La paleta y la tipografía se inspiran en el perfil público; las ilustraciones CSS siguen siendo provisionales. Se necesita el archivo original del logo y las fotos autorizadas para integrarlos con calidad.

El pedido se confirma manualmente con el negocio; este sitio no cobra ni almacena pedidos en un servidor.

## Desarrollo

`npm install` y `npm run dev`. Para generar los archivos de Pages: `npm run build`.

## Publicación

El build se guarda también en `docs/` para la configuración existente de GitHub Pages que publica desde `main` y `/docs`. El flujo `.github/workflows/pages.yml` permite publicar desde GitHub Actions si Pages está configurado con ese origen. URL prevista: `https://mayerlucass.github.io/my-react-app/`.
