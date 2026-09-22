# Latita — catálogo de postres en lata

Catálogo React/Vite adaptable a celular y computadora. Incluye filtros, búsqueda, carrito persistente y pedido redactado para WhatsApp. Alojamiento estático en GitHub Pages.

## Panel de dueños

Abrir `https://mayerlucass.github.io/my-react-app/?admin=1` desde una computadora o celular. El enlace **Acceso dueños** también aparece al pie del catálogo.

1. El propietario del repositorio invita a cada dueño como colaborador con permiso de escritura desde GitHub → Settings → Collaborators. Cada dueño acepta la invitación.
2. Cada colaborador crea su propio **personal access token (classic)** con el alcance `public_repo` en `https://github.com/settings/tokens`. GitHub no permite que un token fine-grained acceda a un repositorio al que su titular fue invitado como colaborador externo. El propietario del repositorio sí puede usar un token fine-grained limitado a este repositorio con `Contents: Read and write`.
3. En el panel, cada dueño pega su token para entrar, cambia los productos y pulsa **Guardar cambios**. El token permanece en memoria durante la sesión; no se guarda en el navegador ni se incluye en el repositorio. Conviene revocarlo si deja de usar el panel.

Se pueden agregar, quitar y ordenar productos; editar nombres, categorías, descripciones, etiquetas y precios en pesos; subir fotos; indicar sin stock u ocultar; y configurar el WhatsApp del negocio con código de país sin `+` ni espacios, por ejemplo `5493511234567`. Los cambios se guardan en `public/catalog.json` y `docs/catalog.json`, con las fotos en `products/`. GitHub Pages tarda unos minutos en publicarlos. Los productos ocultos siguen en el repositorio público.

Los seis productos precargados tienen precios para consultar y dibujos CSS hasta que los dueños suban las fotos y precios reales. `src/catalog.js` es la copia de emergencia que se muestra solo si falla la carga de `catalog.json`.

El pedido se confirma manualmente con el negocio; este sitio no cobra ni almacena pedidos en un servidor.

## Desarrollo

`npm install` y `npm run dev`. Para generar los archivos de Pages: `npm run build`.

## Publicación

El build se guarda también en `docs/` para la configuración existente de GitHub Pages que publica desde `main` y `/docs`. El flujo `.github/workflows/pages.yml` permite publicar desde GitHub Actions si Pages está configurado con ese origen. URL prevista: `https://mayerlucass.github.io/my-react-app/`.
