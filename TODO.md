# Pendientes

## Notificaciones de Sudoku con Resend

- Reemplazar el envío de emails mediante Amazon SES por Resend.
- Verificar y configurar `marcos-lucas.uy` en Resend para usar un remitente propio, por ejemplo `sudoku@marcos-lucas.uy`.
- Guardar la clave `RESEND_API_KEY` únicamente como configuración sensible local/de infraestructura; nunca versionarla en Git.
- Actualizar la Lambda de Sudoku para enviar los avisos de desbloqueo y los emails de prueba a través de Resend.
- Una vez que Resend esté funcionando, retirar las reglas, permisos e identidad de SES que se agregaron para estas notificaciones.
