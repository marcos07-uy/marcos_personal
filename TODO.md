# Pendientes

## Reward #2 — cerrada

- Implementada y desplegada como **Nuestra historia hasta ahora**.
- Asociada al Sudoku #2; se mantiene bloqueada para Claudia hasta completarlo.
- Las fotos finales ya están optimizadas y cargadas en el bucket privado bajo `rewards/reward-02/`.
- El preview real requiere cerrar una sesión regular, ingresar con el código de desarrollador y abrir `/sudoku/?sudokuDev=reward-preview`.
- No modificar el contenido narrativo final salvo una corrección técnica solicitada explícitamente.

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

- Tras confirmar el primer email de prueba con Resend, retirar cualquier configuración SES residual que siga en AWS.
