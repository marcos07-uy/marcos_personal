# Nuestra próxima aventura ❤️

## Arquitectura

`/nuestra-aventura/` es una aplicación pequeña dentro del sitio Hugo existente. El catálogo editorial se versiona en `static/adventure/catalog.js`; no contiene datos personales. La interfaz está en `static/adventure/app.js`, con datos privados exclusivamente obtenidos desde `/api/adventure`.

CloudFront envía `/nuestra-aventura*` a la Lambda/API Gateway y desactiva su caché. El bucket S3 ya es privado y sólo acepta a CloudFront mediante OAC: por lo tanto no puede usarse una URL de S3 para saltear el borde. La Lambda entrega un shell sin datos privados; las APIs requieren una sesión válida. Los recursos estáticos (código, estilos y catálogo) son públicos por diseño, pero no incluyen secretos ni información personal.

La misma Lambda y tabla DynamoDB que Sudoku se reutilizan deliberadamente para no crear otro recurso facturable. Los registros de aventura viven bajo `userId = adventure#<usuario>` y `puzzleId = PROFILE`, aislados por la autorización de la sesión. No se consulta ni devuelve el registro de otra persona antes de que ambas hayan finalizado sus cuestionarios.

## Usuarios y seguridad

Terraform recibe `adventure_users_json`: un JSON sensible con usuarios `marcos` y `claudia`, un `name` y un hash `scrypt$N$r$p$saltBase64$hashBase64`. Nunca se almacena una contraseña en el frontend ni en el repositorio. Generar cada hash localmente:

```bash
node -e "const c=require('crypto'),p=process.argv[1],s=c.randomBytes(16); console.log('scrypt$16384$8$1$'+s.toString('base64')+'$'+c.scryptSync(p,s,64,{N:16384,r:8,p:1,maxmem:128*1024*1024}).toString('base64'))" 'una-contraseña-larga'
```

La sesión dura ocho horas y se firma con `adventure_session_secret`. Es una cookie `HttpOnly; Secure; SameSite=Strict`. Las mutaciones requieren además un token CSRF de doble envío, también `Secure; SameSite=Strict`. Hay límite de cinco fallos por usuario/IP por quince minutos (registro con TTL en DynamoDB), validación de longitud y esquema, `no-store`, `Vary: Cookie`, logout y autorización por identidad. HTTPS se exige en CloudFront.

Antes de aplicar Terraform, definí valores reales en un `terraform.tfvars` ignorado. El ejemplo contiene sólo marcadores. Rotar `adventure_session_secret` invalida las sesiones actuales.

## Catálogo y contenido

El catálogo inicial tiene más de 50 lugares y cubre todas las regiones solicitadas en Inglaterra, Gales, Escocia, Irlanda del Norte y República de Irlanda. Cada entrada tiene identificador estable, región, país, coordenadas, etiquetas, interés editorial, datos operativos con estado explícito cuando están pendientes y fuente/revisión. Las coordenadas se señalan como provenientes de OpenStreetMap/Nominatim; antes de reservas conviene contrastar horarios, senderos, estacionamientos, ferries y accesos con el organismo turístico/operador correspondiente.

Para agregar un destino, usá el constructor `d()` en `catalog.js`, vinculalo a una región existente (o agregá una a `regions`) y no sustituyas `Pendiente de verificar` por una estimación. Hay cuatro postales iniciales de Wikimedia Commons (Edimburgo, Glencoe, Skye y Cliffs of Moher), con autor, licencia y enlace a la ficha visibles junto a cada imagen. Se cargan de forma diferida. Para incorporar otras, guardar URL, licencia, autor y fuente en `photo`; no reutilizar resultados arbitrarios de Google Images.

Las etiquetas son identificadores estables en inglés (`mountain`, `lake`, `coastal`, `cliffs`, `castle`, `history`, `museum`, `city`, `village`, `countryside`, `hiking`, `challenging-hiking`, `scenic-drive`, `wildlife`, `gastronomy`, `music`, `romantic`, `relaxed`, `adventure`) y se muestran como señales, no como datos personales.

## Recomendaciones e itinerarios

La afinidad individual suma una base editorial y señales configurables de las ocho respuestas. Una caminata exigente recibe penalización clara si se indicó caminata corta. Los sueños escritos hacen coincidir sólo el nombre normalizado del catálogo por ahora y reciben un refuerzo mayor. No se asignan automáticamente textos ambiguos.

La puntuación conjunta usa `70% × mínimo(afinidades) + 30% × máximo(afinidades)`: prioriza que ambos estén razonablemente contentos y evita que el interés alto de uno tape el bajo del otro. Las explicaciones se componen únicamente con etiquetas que dispararon puntos. Los pesos están al inicio de `app.js` (`tagWeights`) y son fáciles de auditar.

Las rutas son borradores deterministas, con corredores geográficos explícitos. No inventan tiempos de conducción ni presentan repartos definitivos de noches sin validación; sí conservan las restricciones de 16 noches, una actividad principal por día, pocas bases y la última noche cerca de Gatwick. La siguiente mejora es incorporar tiempos revisados de transporte y transformar el borrador elegido en etapas con noches que sumen exactamente 16.

## Desarrollo, pruebas y despliegue

Ejecutar:

```bash
npm test
npm run validate:rewards
hugo --minify
terraform -chdir=infra/terraform/aws init -backend=false
terraform -chdir=infra/terraform/aws validate
```

No se despliega automáticamente desde este cambio. El workflow existente desplegará al hacer push a `main`, por lo que revisar el plan de Terraform y configurar los dos secretos de aventura antes de ese paso. Costos nuevos: ninguno; la aventura agrega lecturas/escrituras PAY_PER_REQUEST a DynamoDB y ejecución Lambda/API Gateway dentro de servicios ya existentes. Puede haber costos marginales por tráfico. Un mapa Leaflet/MapLibre con teselas externas no fue agregado: se usa un mapa ilustrado por privacidad/costo y porque no se debe asumir una política de teselas sin confirmarla. Para un mapa cartográfico real, elegir primero un proveedor compatible con su política de uso y atribución.
