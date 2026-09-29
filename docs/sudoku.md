# Sudoku para Claudia

La configuración y carga de recompensas se documenta en [rewards.md](rewards.md).

## Arquitectura

`/sudoku/` es una página Hugo con JavaScript nativo, sin framework ni dependencia de ejecución. CloudFront enruta `/api/*` a API Gateway HTTP, que invoca una Lambda Node.js. La Lambda conserva las definiciones de los tableros y sus soluciones en el paquete privado de Lambda; los archivos estáticos sólo reciben el tablero inicial, la política de asistencia y el estado permitido.

El estado se guarda inmediatamente en `localStorage` y se sincroniza de forma diferida con DynamoDB. Cada registro usa `userId` + `puzzleId`, una revisión monotónica y marca temporal. Una escritura con una revisión antigua devuelve `409`; el cliente nunca sobrescribe silenciosamente una versión más nueva. DynamoDB tiene recuperación puntual activada. La validación de finalización vuelve a comparar el tablero completo con la solución dentro de Lambda y es idempotente.

## Uso sin conexión

Tras abrir Sudoku con internet, un service worker guarda la pantalla y los módulos del juego. El cliente también conserva el último catálogo autorizado, cada tablero ya abierto y el progreso local. Si se pierde la conexión durante una partida aparece un aviso visible: **“Podés seguir jugando sin cerrar esta pestaña”**. Las jugadas se guardan inmediatamente en el teléfono y se sincronizan automáticamente al recuperar conexión. Si el tablero quedó completo sin red, se vuelve a enviar para validación y recompensa al reconectar.

No se cachean rutas `/api`, soluciones ni recompensas privadas. La primera apertura y el primer inicio de sesión requieren conexión. Para máxima confiabilidad durante el vuelo, Claudia debe abrir la página y el Sudoku que va a jugar antes de salir; mantener la pestaña abierta evita depender de que iOS o Android descarte la pestaña por falta de memoria.

La hora para desbloquear se evalúa exclusivamente en Lambda. Las seis fechas son explícitas: 30 de septiembre; 3, 7, 10 y 15 de octubre; y el desafío final el 18 de octubre. Se interpretan como medianoche en `America/Montevideo` por defecto (configurable con `sudoku_timezone`) y no dependen de completar un desafío anterior.

## Estado de lanzamiento

La configuración de lanzamiento está: los Sudokus 01–06 se abren, respectivamente, el **30/09/2026, 03/10/2026, 07/10/2026, 10/10/2026, 15/10/2026 y 18/10/2026**, todos a las 00:00 en `America/Montevideo`.

Antes del lanzamiento se eliminaron los progresos, recompensas desbloqueadas y mensajes de prueba. Se conserva únicamente una marca técnica de reinicio por Sudoku: evita que una copia local de las pruebas vuelva a sincronizarse y desaparece en la primera sincronización nueva. Para Claudia, la experiencia inicia vacía.

## Acceso y recompensas

La pantalla inicial solicita un código compartido. Lambda verifica ese código, que sólo existe como variable sensible de Terraform, y entrega una sesión HMAC de 14 días. Esto es una protección sencilla para una experiencia de una persona, no un sistema de identidades. El acceso a progreso, validación y recompensas exige esa sesión; Lambda deriva el usuario, Sudoku y recompensa por sí misma.

`sudoku_developer_access_code` es un segundo código opcional, exclusivo de desarrollo. Su sesión usa un usuario DynamoDB separado (`marcos-development`) y desbloquea los seis desafíos sin cambiar el calendario ni el progreso de Claudia. Configuralo únicamente en `terraform.tfvars`; no lo compartas. La interfaz muestra una banda visible **Modo de prueba** cuando se usa.

`sudoku_admin_access_code` es una contraseña separada para Marcos. Al ingresar con ella, la página muestra el panel privado de administración: porcentaje, tiempo, pistas, última actualización y finalización de cada Sudoku de Claudia. Desde ese panel se puede resetear un desafío; la acción borra el progreso guardado de Claudia y el estado de su recompensa para ese desafío, pero no borra el muro de mensajes. Es una operación deliberada con confirmación en la interfaz.

El reset deja el desafío exactamente como nuevo: sin porcentaje, sin marca de “en progreso” y sin recompensa desbloqueada. Lambda conserva una marca técnica temporal para que un teléfono con una copia local antigua no pueda restaurar el progreso eliminado; cuando Claudia vuelva a abrir el Sudoku, recibe el tablero inicial vacío.

Cada desbloqueo programado envía un email con Resend. El panel admin permite enviar una prueba para cada Sudoku. Definí una `resend_api_key` con permiso de envío, limitada a `marcos-lucas.uy`, y mantenela sólo en `terraform.tfvars`. La configuración actual usa `Sudoku para Claudia <sudoku@marcos-lucas.uy>` como remitente y `marcos.s.lucas@gmail.com` como destinatario de prueba.

Cada Sudoku tiene un **Muro de mensajes** accesible antes de empezar o continuar el tablero. Claudia y Marcos pueden publicar mensajes de hasta 800 caracteres; Lambda guarda el autor derivado de la sesión y el momento de publicación. Los mensajes se almacenan en la misma tabla DynamoDB, en una partición compartida independiente de los progresos, y sólo se consultan o escriben mediante una sesión válida.

Las recompensas se almacenan en el bucket privado `*-sudoku-rewards`, separado del bucket Hugo y sin acceso público. Para una recompensa con archivo, asigná `assetKey` en el mapa `rewards` de `backend/lambda/index.mjs`, subí el archivo con esa clave al bucket y desplegá Terraform/Lambda. Sólo tras una finalización validada la API emite una URL S3 firmada por cinco minutos. Nunca pongas fotos o videos privados bajo `static/`.

## Puzles y asistencia

Los seis tableros están en `backend/lambda/puzzle-data.mjs`. Cada definición incluye id, tipo, dificultad, fecha, política y recompensa. `npm run generate:sudoku-dev` produce el catálogo local sin soluciones desde esa misma fuente. Las soluciones quedan dentro de Lambda; `test/sudoku.test.js` verifica que cada tablero sea válido y tenga una solución única antes de desplegar.

La clasificación técnica es reproducible con `npm run analyze:sudoku`. El analizador mantiene candidatos y aplica, sin adivinar, singles visibles, singles ocultos, candidatos bloqueados y pares desnudos. Registra cada técnica y un puntaje ponderado. Para Claudia, la curva visible privilegia una progresión amable: 01 **Fácil**, 02–04 **Accesible**, 05 **Un poco menos accesible** y 06 **Quizás un poco complicado**. Los puntajes técnicos son 30, 51, 49, 48, 56 y 70, respectivamente, y todos los tableros se resuelven con las técnicas disponibles.

`npm test` comprueba que las etiquetas visibles y la clasificación técnica coincidan con la configuración, que todos tengan solución única y que la solución privada de Lambda coincida con la solución verificada. El motor comparte candidatos, singles visibles/ocultos y pistas con el cliente. Las pistas sólo describen pasos que el motor encuentra; los niveles altos pueden revelar valores cuando la política del Sudoku lo permite. Antes de iniciar se explica cada restricción. Las herramientas de usabilidad (notas manuales, deshacer, rehacer, borrar, resaltados y conflictos) se mantienen siempre.

Para reemplazar un Sudoku, cambiá únicamente su cadena de 81 caracteres y sus metadatos; ejecutá `npm test` antes de desplegar. Para añadir uno, agregá una definición y una recompensa, una fecha explícita y extendé la prueba de fechas. Las soluciones no se deben mover al frontend.

## Desarrollo y despliegue

Ejecutá `hugo server -D` para la interfaz; la API requiere `terraform apply` en `infra/terraform/aws`. Antes de aplicar, definí `sudoku_access_code`, `sudoku_developer_access_code` y `sudoku_session_secret` como valores secretos en `terraform.tfvars` (no lo confirmes en Git); el último debe ser una cadena aleatoria larga. Ejecutá `terraform init`, `terraform fmt`, `terraform validate` y `terraform plan`. El workflow actual despliega Hugo; los cambios de infraestructura/Lambda se aplican por Terraform como el resto de la infraestructura.

Para recorrer los seis Sudokus localmente, iniciá Hugo y abrí `http://localhost:1313/sudoku/?sudokuDev=unlock-all`. Este modo sólo se activa en localhost o una IP privada de la LAN y requiere ese parámetro explícito. Simula la API en `localStorage`, muestra una banda visible de desarrollo y nunca contiene soluciones ni contenido privado. Usá el botón **Reiniciar todos los progresos de prueba** para empezar de cero en ese dispositivo. No existe en el dominio desplegado y no cambia el calendario, autenticación ni validación del backend de producción. Para probar el backend desplegado antes de una fecha, entrá en el dominio con `sudoku_developer_access_code`.

Pruebas: `npm test` verifica reglas, conflictos, candidatos, eliminación automática, unicidad, finalización, pistas, políticas y calendario. Las pruebas de integración API requieren credenciales AWS y se cubren por la validación de Lambda de entradas y revisiones. Limitación conocida: las técnicas avanzadas se califican mediante la curva editorial y coste de búsqueda, no con un catálogo completo de X-Wing/XY-Wing; la arquitectura de `nextLogicalStep` permite agregar técnicas sin cambiar la UI ni persistencia.

## Próxima sesión: puesta en marcha

Seguí esta secuencia. No ejecuta cambios en AWS hasta el paso 3.

1. Regenerá el fixture de desarrollo, corré las verificaciones y probá los seis tableros localmente:

   ```bash
   npm run generate:sudoku-dev
   npm test
   hugo server -D --bind 0.0.0.0
   ```

   Abrí `http://localhost:1313/sudoku/?sudokuDev=unlock-all`. Desde un teléfono en la misma Wi-Fi usá la IP privada de la laptop con el mismo parámetro. Probá notas, deshacer/rehacer, cerrar/reabrir, reinicio local y finalización.

2. Confirmá que `infra/terraform/aws/terraform.tfvars` existe sólo en tu máquina e incluye valores privados para `sudoku_access_code`, `sudoku_developer_access_code`, `sudoku_admin_access_code` y `sudoku_session_secret`. No lo agregues a Git.

3. Revisá y, si el plan es el esperado, aplicá la infraestructura:

   ```bash
   cd infra/terraform/aws
   terraform plan
   terraform apply
   ```

   El plan debe crear la API HTTP, Lambda, DynamoDB, bucket privado de recompensas, permisos IAM y el comportamiento `/api/*` de CloudFront. Terraform sigue siendo deliberadamente manual; GitHub Actions sólo valida Terraform y despliega Hugo.

4. Probá `https://<tu-dominio>/sudoku/` usando el código configurado. Verificá desbloqueos, guardado al cerrar/reabrir, sesión, finalización y la recompensa de texto antes de cargar contenido privado.

5. Guardá y publicá el código estático:

   ```bash
   git add .
   git commit -m "Add private Claudia Sudoku experience"
   git push origin main
   ```

   El push activa el despliegue Hugo. Si Terraform modificó CloudFront, esperá a que la distribución termine de propagarse antes de probar la API desde el dominio.
