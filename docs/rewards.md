# Recompensas privadas de Sudoku

## Arquitectura y seguridad

La configuración vive en `backend/lambda/reward-config.mjs`, dentro del paquete privado de Lambda. El navegador nunca recibe claves S3. Al abrir una recompensa, Lambda verifica la sesión y que el Sudoku asociado esté completado en DynamoDB; sólo entonces devuelve datos de presentación y URLs S3 firmadas por cinco minutos. Las recompensas bloqueadas sólo muestran su número y el Sudoku necesario, sin tipo ni metadata de media.

El estado mutable usa la misma tabla DynamoDB con una clave de orden `REWARD#<id>`: guarda cuándo se abrió y, para `CHOICE`, la opción elegida. El desbloqueo no se duplica: siempre se deriva del registro de finalización del Sudoku. La meta-recompensa deriva sus seis piezas de los seis Sudokus completados.

## Configuración

Editá `backend/lambda/reward-config.mjs`. Buscá `TODO_REWARD` para encontrar todo el contenido pendiente. Cada recompensa tiene `id`, `puzzleId`, `type`, `title`, `message` y `enabled`. Los tipos disponibles son:

- `PHOTO`: `asset`, `caption` opcional.
- `TEXT`: `message`; se usa principalmente como bloque de `FINAL`.
- `AUDIO`: `asset`, `transcript` opcional.
- `VIDEO`: `asset`, `poster` y `transcript` opcionales.
- `SONG`: `song: { title, artist, url }`.
- `VOUCHER`: `validFrom`, `expiresAt` opcional y `conditions` opcionales.
- `CHOICE`: `options`, `permanent` y `showAllChoices`.
- `FINAL`: `blocks`, que pueden ser texto, foto, audio, video, canción o vale.
- `STORY`: una secuencia de escenas privadas. Cada escena puede incluir texto, mensajes, momentos y una foto privada; el navegador sólo recibe la URL firmada de cada foto cuando la recompensa está autorizada.

Ejemplo ficticio de cada tipo:

```js
{ id: 'reward-xx', puzzleId: '01', type: 'PHOTO', title: 'Título', message: 'Mensaje', asset: { key: 'rewards/reward-xx/photo.jpg', alt: 'Descripción' } }
{ id: 'reward-xx', puzzleId: '02', type: 'AUDIO', title: 'Título', message: 'Mensaje', asset: { key: 'rewards/reward-xx/audio.m4a', alt: 'Audio personal' }, transcript: 'Transcripción' }
{ id: 'reward-xx', puzzleId: '03', type: 'VIDEO', title: 'Título', message: 'Mensaje', asset: { key: 'rewards/reward-xx/video.mp4', alt: 'Descripción del video' }, poster: { key: 'rewards/reward-xx/poster.jpg', alt: 'Poster' } }
{ id: 'reward-xx', puzzleId: '04', type: 'SONG', title: 'Título', message: 'Mensaje', song: { title: 'Tema', artist: 'Artista', url: 'https://ejemplo.com' } }
{ id: 'reward-xx', puzzleId: '05', type: 'VOUCHER', title: 'Vale', message: 'Descripción', validFrom: '2026-10-21', expiresAt: null, conditions: 'Condiciones' }
{ id: 'reward-xx', puzzleId: '06', type: 'CHOICE', title: 'Elegí', message: 'Descripción', permanent: true, options: [{ id: 'a', label: 'Opción A' }, { id: 'b', label: 'Opción B' }] }
{ id: 'reward-final', puzzleId: '06', type: 'FINAL', title: 'Final', message: 'Mensaje', blocks: [{ type: 'TEXT', message: 'Texto' }, { type: 'PHOTO', asset: { key: 'rewards/reward-final/photo.jpg', alt: 'Descripción' } }] }
```

Una elección permanente muestra una advertencia y exige confirmación; Lambda impide cambiarla incluso si se manipula el navegador.

## Reward #2 — estado de producción

**Estado: cerrada y desplegada.** `reward-02` está asociada únicamente al Sudoku `02` y usa el tipo `STORY`. Su contenido final vive exclusivamente en `backend/lambda/reward-config.mjs`: son nueve escenas, con navegación manual, indicador discreto de escena y la última escena vista guardada localmente por perfil bajo `claudia-sudoku-story-v1-<perfil>-reward-02`.

Las escenas con fotos usan estos objetos privados ya cargados y optimizados en el bucket de recompensas:

```text
rewards/reward-02/19enero.jpg
rewards/reward-02/8mayo.jpg
rewards/reward-02/20septiembre.jpg
```

No hay copias de estas fotos en Git, `static/` ni Hugo. Lambda sólo expone URLs firmadas de cinco minutos después de verificar el desbloqueo. Si falta un objeto, la historia muestra **Contenido pendiente** sin revelar la clave del objeto.

La experiencia se implementa en `static/sudoku/rewards.js`, `static/sudoku/app.js` y `static/css/custom.css`. Las correcciones de visibilidad del control **EMPEZAR** ya están incluidas: debe aparecer inmediatamente después del texto inicial en móvil, sin requerir scroll.

## Media privada y carga

Usá claves predecibles bajo el bucket privado, por ejemplo:

```text
rewards/reward-01/photo.jpg
rewards/reward-02/audio.m4a
rewards/reward-02/19enero.jpg
rewards/reward-02/8mayo.jpg
rewards/reward-02/20septiembre.jpg
rewards/reward-03/video.mp4
rewards/reward-03/poster.jpg
rewards/reward-06/final-photo.jpg
rewards/meta-final/final.jpg
```

Nunca pongas estos archivos en `static/`. Para subir uno, obtené el bucket con Terraform y ejecutá:

```bash
BUCKET=$(AWS_PROFILE=personal terraform -chdir=infra/terraform/aws output -raw sudoku_rewards_bucket_name)
AWS_PROFILE=personal aws s3 cp ./private/rewards/reward-01/photo.jpg "s3://$BUCKET/rewards/reward-01/photo.jpg" --only-show-errors
```

Lambda comprueba que el objeto exista antes de firmarlo. Si falta, Claudia verá **Contenido pendiente**, sin claves S3 ni errores técnicos.

## Validación, preview y despliegue

```bash
npm run validate:rewards
npm test
```

Para ver los siete renderizadores de placeholder sin resolver Sudokus, sólo en localhost o una IP privada de LAN:

```text
/sudoku/?sudokuDev=reward-preview
```

El fixture local `static/sudoku/dev-rewards.js` sólo contiene `TODO_REWARD` y nunca usa la API ni claves privadas. Para revisar una recompensa real con media privada, entrá al sitio desplegado usando el código de desarrollador y abrí `/sudoku/?sudokuDev=reward-preview`: sólo esa sesión autenticada puede previsualizar Reward #2 sin completarla. Las sesiones normales siguen exigiendo la finalización de su Sudoku correspondiente.

Si el enlace de preview abre el catálogo normal, primero elegí **Cerrar sesión en este teléfono** e iniciá nuevamente con el código de desarrollador. Un token regular de Claudia no se transforma en sesión de preview por la URL.

Después de editar la configuración y/o subir media, aplicá Lambda y publicá el frontend:

```bash
AWS_PROFILE=personal terraform -chdir=infra/terraform/aws plan
AWS_PROFILE=personal terraform -chdir=infra/terraform/aws apply
git add backend/lambda/reward-config.mjs static/sudoku docs/rewards.md
git commit -m "Configure Sudoku rewards"
git push origin main
```

La meta-recompensa se controla con `rewardConfig.pieces.enabled`. Cuando está activa, muestra `n / 6 piezas encontradas`; el detalle final sólo se entrega después de las seis finalizaciones.
