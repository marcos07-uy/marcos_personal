# Pendientes

## Notificaciones de Sudoku con Resend

- Reemplazar el envío de emails mediante Amazon SES por Resend.
- Verificar y configurar `marcos-lucas.uy` en Resend para usar un remitente propio, por ejemplo `sudoku@marcos-lucas.uy`.
- Guardar la clave `RESEND_API_KEY` únicamente como configuración sensible local/de infraestructura; nunca versionarla en Git.
- Actualizar la Lambda de Sudoku para enviar los avisos de desbloqueo y los emails de prueba a través de Resend.
- Usar este texto para el aviso de desbloqueo:

  ```text
  Asunto: Un nuevo Sudoku te está esperando

  Hola, Claudia.

  Se desbloqueó un nuevo Sudoku para que puedas poner a prueba tu ingenio,
  divertirte un rato y acercarte a una nueva recompensa.

  Cuando tengas ganas, tu próximo desafío ya está listo.
  ```

- Una vez que Resend esté funcionando, retirar las reglas, permisos e identidad de SES que se agregaron para estas notificaciones.
