# Sudoku para Claudia

## Arquitectura

`/sudoku/` es una página Hugo con JavaScript nativo, sin framework ni dependencia de ejecución. CloudFront enruta `/api/*` a API Gateway HTTP, que invoca una Lambda Node.js. La Lambda conserva las definiciones de los tableros y sus soluciones en el paquete privado de Lambda; los archivos estáticos sólo reciben el tablero inicial, la política de asistencia y el estado permitido.

El estado se guarda inmediatamente en `localStorage` y se sincroniza de forma diferida con DynamoDB. Cada registro usa `userId` + `puzzleId`, una revisión monotónica y marca temporal. Una escritura con una revisión antigua devuelve `409`; el cliente nunca sobrescribe silenciosamente una versión más nueva. DynamoDB tiene recuperación puntual activada. La validación de finalización vuelve a comparar el tablero completo con la solución dentro de Lambda y es idempotente.

## Uso sin conexión

Tras abrir Sudoku con internet, un service worker guarda la pantalla y los módulos del juego. El cliente también conserva el último catálogo autorizado, cada tablero ya abierto y el progreso local. Si se pierde la conexión durante una partida aparece un aviso visible: **“Podés seguir jugando sin cerrar esta pestaña”**. Las jugadas se guardan inmediatamente en el teléfono y se sincronizan automáticamente al recuperar conexión. Si el tablero quedó completo sin red, se vuelve a enviar para validación y recompensa al reconectar.

No se cachean rutas `/api`, soluciones ni recompensas privadas. La primera apertura y el primer inicio de sesión requieren conexión. Para máxima confiabilidad durante el vuelo, Claudia debe abrir la página y el Sudoku que va a jugar antes de salir; mantener la pestaña abierta evita depender de que iOS o Android descarte la pestaña por falta de memoria.

La hora para desbloquear se evalúa exclusivamente en Lambda. Las seis fechas son explícitas: 30 de septiembre; 2, 5, 7 y 10 de octubre; y el desafío final el 16 de octubre. Se interpretan como medianoche en `America/Montevideo` por defecto (configurable con `sudoku_timezone`) y no dependen de completar un desafío anterior.

## Acceso y recompensas

La pantalla inicial solicita un código compartido. Lambda verifica ese código, que sólo existe como variable sensible de Terraform, y entrega una sesión HMAC de 14 días. Esto es una protección sencilla para una experiencia de una persona, no un sistema de identidades. El acceso a progreso, validación y recompensas exige esa sesión; Lambda deriva el usuario, Sudoku y recompensa por sí misma.

`sudoku_developer_access_code` es un segundo código opcional, exclusivo de desarrollo. Su sesión usa un usuario DynamoDB separado (`marcos-development`) y desbloquea los seis desafíos sin cambiar el calendario ni el progreso de Claudia. Configuralo únicamente en `terraform.tfvars`; no lo compartas. La interfaz muestra una banda visible **Modo de prueba** cuando se usa.

Las recompensas se almacenan en el bucket privado `*-sudoku-rewards`, separado del bucket Hugo y sin acceso público. Para una recompensa con archivo, asigná `assetKey` en el mapa `rewards` de `backend/lambda/index.mjs`, subí el archivo con esa clave al bucket y desplegá Terraform/Lambda. Sólo tras una finalización validada la API emite una URL S3 firmada por cinco minutos. Nunca pongas fotos o videos privados bajo `static/`.

## Puzles y asistencia

Los seis tableros están en `backend/lambda/puzzle-data.mjs`. Cada definición incluye id, tipo, dificultad, fecha, política y recompensa. `npm run generate:sudoku-dev` produce el catálogo local sin soluciones desde esa misma fuente. Las soluciones quedan dentro de Lambda; `test/sudoku.test.js` verifica que cada tablero sea válido y tenga una solución única antes de desplegar.

La clasificación es reproducible con `npm run analyze:sudoku`. El analizador mantiene candidatos y aplica, sin adivinar, singles visibles, singles ocultos, candidatos bloqueados y pares desnudos. Registra cada técnica y un puntaje ponderado. La curva de producción queda verificada así: 01 Fácil (45), 02 Fácil (51), 03 Fácil / Medio (56), 04 Medio (70), 05 Difícil (92) y 06 Experto. El 06 se estanca tras una sola deducción básica: requiere técnicas avanzadas fuera del conjunto actual, por lo que el informe lo marca explícitamente como `advancedRequired`; no se afirma falsamente que el motor lo haya resuelto.

`npm test` comprueba que las seis etiquetas coincidan con ese análisis, que los puntajes 01–05 sean ascendentes, que el 06 requiera técnicas avanzadas, que todos tengan solución única y que la solución privada de Lambda coincida con la solución verificada. El motor comparte candidatos, singles visibles/ocultos y pistas con el cliente. Las pistas sólo describen pasos que el motor encuentra; nivel 4 puede revelar, mientras que Experto está limitado a nivel 1 y nunca revela un número. Antes de iniciar se explica cada restricción. Las herramientas de usabilidad (notas manuales, deshacer, rehacer, borrar, resaltados y conflictos) se mantienen siempre.

Para reemplazar un Sudoku, cambiá únicamente su cadena de 81 caracteres y sus metadatos; ejecutá `npm test` antes de desplegar. Para añadir uno, agregá una definición y una recompensa, una fecha explícita y extendé la prueba de fechas. Las soluciones no se deben mover al frontend.

## Desarrollo y despliegue

Ejecutá `hugo server -D` para la interfaz; la API requiere `terraform apply` en `infra/terraform/aws`. Antes de aplicar, definí `sudoku_access_code`, `sudoku_developer_access_code` y `sudoku_session_secret` como valores secretos en `terraform.tfvars` (no lo confirmes en Git); el último debe ser una cadena aleatoria larga. Ejecutá `terraform init`, `terraform fmt`, `terraform validate` y `terraform plan`. El workflow actual despliega Hugo; los cambios de infraestructura/Lambda se aplican por Terraform como el resto de la infraestructura.

Para recorrer los seis Sudokus localmente, iniciá Hugo y abrí `http://localhost:1313/sudoku/?sudokuDev=unlock-all`. Este modo sólo se activa en localhost o una IP privada de la LAN y requiere ese parámetro explícito. Simula la API en `localStorage`, muestra una banda visible de desarrollo y nunca contiene soluciones ni contenido privado. Usá el botón **Reiniciar todos los progresos de prueba** para empezar de cero en ese dispositivo. No existe en el dominio desplegado y no cambia el calendario, autenticación ni validación del backend de producción. Para probar el backend desplegado antes de una fecha, entrá en el dominio con `sudoku_developer_access_code`.

Pruebas: `npm test` verifica reglas, conflictos, candidatos, eliminación automática, unicidad, finalización, pistas, políticas Experto y calendario. Las pruebas de integración API requieren credenciales AWS y se cubren por la validación de Lambda de entradas y revisiones. Limitación conocida: las técnicas avanzadas se califican mediante la curva editorial y coste de búsqueda, no con un catálogo completo de X-Wing/XY-Wing; la arquitectura de `nextLogicalStep` permite agregar técnicas sin cambiar la UI ni persistencia.

## Próxima sesión: puesta en marcha

Seguí esta secuencia. No ejecuta cambios en AWS hasta el paso 3.

1. Regenerá el fixture de desarrollo, corré las verificaciones y probá los seis tableros localmente:

   ```bash
   npm run generate:sudoku-dev
   npm test
   hugo server -D --bind 0.0.0.0
   ```

   Abrí `http://localhost:1313/sudoku/?sudokuDev=unlock-all`. Desde un teléfono en la misma Wi-Fi usá la IP privada de la laptop con el mismo parámetro. Probá notas, deshacer/rehacer, cerrar/reabrir, reinicio local y finalización.

2. Confirmá que `infra/terraform/aws/terraform.tfvars` existe sólo en tu máquina e incluye valores privados para `sudoku_access_code`, `sudoku_developer_access_code` y `sudoku_session_secret`. No lo agregues a Git.

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
