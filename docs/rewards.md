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

## Media privada y carga

Usá claves predecibles bajo el bucket privado, por ejemplo:

```text
rewards/reward-01/photo.jpg
rewards/reward-02/audio.m4a
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

El fixture `static/sudoku/dev-rewards.js` sólo contiene `TODO_REWARD` y nunca usa la API ni claves privadas. No existe un bypass de recompensas en producción: el código de desarrollo de producción únicamente desbloquea fechas de Sudoku; aún exige completarlos para recompensas.

Después de editar la configuración y/o subir media, aplicá Lambda y publicá el frontend:

```bash
AWS_PROFILE=personal terraform -chdir=infra/terraform/aws plan
AWS_PROFILE=personal terraform -chdir=infra/terraform/aws apply
git add backend/lambda/reward-config.mjs static/sudoku docs/rewards.md
git commit -m "Configure Sudoku rewards"
git push origin main
```

La meta-recompensa se controla con `rewardConfig.pieces.enabled`. Cuando está activa, muestra `n / 6 piezas encontradas`; el detalle final sólo se entrega después de las seis finalizaciones.
