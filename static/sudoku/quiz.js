export const quizQuestions = [
  { question: "Marcos dice: 'no tengo hambre'.", context: 'Cuarenta minutos después llega la comida de Claudia.', answers: ['No come porque dijo que no tenía hambre.', 'Pide probar un poquito.', 'Come del plato de Claudia sin reconocer formalmente que tenía hambre.', 'Explica que comer del plato de Claudia no entra dentro de los derechos de Marcos y que solo Claudia puede comer del plato de Marcos porque, en definitiva, también es su plato. No es una propiedad bidireccional.'], correct: 3 },
  { question: 'Son las 22:30 y mañana entrenamos temprano.', context: '¿Qué propone Marcos?', answers: ['Dormir ocho horas como dos deportistas responsables.', 'Ir a la cama temprano.', 'Quedarnos charlando y teniendo sexo hasta tarde.', 'Decir que vamos a dormir temprano y que inexplicablemente termine ocurriendo C.'], correct: 3 },
  { question: 'Claudia afirma algo incorrecto.', context: '¿Qué corresponde hacer?', answers: ['Corregirla.', 'Presentar evidencia.', 'Explicarle respetuosamente por qué está equivocada.', 'Revisar la pregunta porque evidentemente fue formulada incorrectamente.'], correct: 3 },
  { question: '¿Cuál de estas distribuciones representa mejor los derechos y obligaciones de la relación?', answers: ['50% / 50%', 'Depende de la situación.', 'Ambos tienen los mismos derechos y obligaciones.', 'Claudia posee los derechos. Marcos posee las obligaciones.'], correct: 3 },
  { question: 'Claudia quiere algo. Marcos no tiene demasiadas ganas.', context: '¿Qué corresponde?', answers: ['Negociar.', 'Buscar un punto medio.', 'Marcos explica sus motivos y Claudia decide.', 'No se entiende la pregunta. Claudia quiere algo.'], correct: 3 },
  { question: "Claudia le dice a Marcos: 'No hace falta que hagas nada complicado'.", context: '¿Qué entiende Marcos?', answers: ['No hacer nada complicado.', 'Preparar un detalle sencillo.', 'Hacer algo lindo sin exagerar.', 'Crear seis Sudokus, rewards, infraestructura cloud, contenido multimedia y posiblemente escribir más código del estrictamente necesario.'], correct: 3 },
  { question: '¿Quién manda en la relación?', answers: ['Claudia', 'Claudia', 'Claudia', 'Todas las anteriores'], correct: 3, allCorrect: true },
  { question: 'Marcos tuvo un día de mierda.', context: '¿Qué es lo que más probablemente necesita de Claudia?', answers: ['Que lo deje tranquilo.', 'Que le dé una solución.', 'Hablar del problema durante horas.', 'Tenerla cerca.'], correct: 3 },
  { question: 'Marcos y Claudia están discutiendo y Marcos presenta evidencia objetiva, verificable e irrefutable de que tiene razón.', answers: ['Marcos gana la discusión.', 'Claudia reconoce el error.', 'Se declara empate.', 'La evidencia deberá ser revisada para determinar por qué contradice a Claudia.'], correct: 3 },
  { question: '¿Qué tan afortunado es Marcos de estar con Claudia?', answers: ['Bastante.', 'Mucho.', 'Ridículamente.', 'No existe una unidad de medida adecuada.'], correct: 3 }
];

export function quizOutcome(index, answer) {
  const correct = quizQuestions[index].allCorrect || answer === quizQuestions[index].correct;
  if (index === 0 && !correct) return { realPoint: 0, lines: ['La respuesta registrada por Marcos era D.'], delayed: ['APELACIÓN AUTOMÁTICA EN CURSO...', 'Apelación aceptada.', 'Claudia evidentemente interpretó correctamente la intención de la pregunta.', '+1 punto'] };
  if (index === 1 && !correct) {
    if (answer === 2) return { realPoint: 0, lines: ['Respuesta aceptada.', 'Técnicamente Marcos había marcado D, pero el Comité determinó que C describe suficientemente bien los hechos.', '+1 punto'] };
    if (answer === 0) return { realPoint: 0, lines: ['Respuesta inicialmente marcada como incorrecta.'], delayed: ['Intervención de Su Majestad.', 'Claudia sostiene que Marcos debería elegir A.', 'El tribunal acepta el argumento.', '+1 punto'] };
    return { realPoint: 0, lines: ['Respuesta incorrecta.', 'La evidencia histórica disponible no permite sostener semejante nivel de responsabilidad.'], delayed: ['Revisión del Tribunal...', 'Claudia considera que la intención era buena.', 'Punto concedido.'] };
  }
  if (index === 2 && !correct) return { realPoint: 0, lines: ['ERROR GRAVE.', 'Se recuerda al participante que Claudia no se equivoca.', 'En ocasiones responde correctamente a preguntas defectuosas.', '−1 punto'] };
  if (index === 3 && !correct) return { realPoint: 0, lines: ['La respuesta registrada era D.'], delayed: ['El Comité recuerda que los derechos adicionales de Claudia incluyen también el derecho a interpretar libremente este cuestionario.', 'Respuesta aceptada por privilegio constitucional.'] };
  if (index === 4 && !correct) return { realPoint: 0, lines: ['La respuesta registrada era D.', 'Se detectó información irrelevante en el enunciado.', 'El dato sobre las ganas de Marcos no afectaba la resolución del problema.'] };
  if (index === 5 && !correct) return { realPoint: 0, lines: ['La respuesta registrada era D.', 'Respuesta comprensible, pero incompatible con la evidencia disponible.', "El proyecto fue inicialmente clasificado como 'un detalle'."] };
  if (index === 6) return { realPoint: 1, lines: ['✓ Correcto.', 'Esta pregunta fue diseñada para recuperar la confianza del participante después de preguntas anteriores excesivamente difíciles.'] };
  if (index === 7) return correct ? { realPoint: 1, lines: ['✓ Correcto.'], delayed: ['Esta sí era en serio.'] } : { realPoint: 0, lines: ['La respuesta de Marcos era: tenerla cerca.'], delayed: ['Esta sí era en serio.'] };
  if (index === 8) return correct ? { realPoint: 1, lines: ['✓ Correcto.', 'El problema nunca fue Claudia.'], delayed: ['El problema eran los datos.'] } : { realPoint: 0, lines: ['La respuesta registrada era D.', 'La evidencia presentada por Marcos será sometida a revisión.'], delayed: ['El problema nunca fue Claudia.', 'El problema eran los datos.'] };
  if (index === 9) return correct ? { realPoint: 1, lines: ['✓ Correcto.'], delayed: ['Esta también era en serio.'] } : { realPoint: 0, lines: ['La respuesta de Marcos era: no existe una unidad de medida adecuada.'], delayed: ['Esta también era en serio.'] };
  if (correct && index === 3) return { realPoint: 1, lines: ['✓ Correcto.', 'Principio fundamental del orden constitucional de la relación.'] };
  if (correct && index === 4) return { realPoint: 1, lines: ['✓ Exacto.', 'La pregunta contenía información irrelevante.'] };
  if (correct && index === 5) return { realPoint: 1, lines: ['✓ Correcto.', "El proyecto fue inicialmente clasificado como 'un detalle'."] };
  return { realPoint: correct ? 1 : 0, lines: correct ? ['✓ Correcto.'] : [] };
}

export const realScore = (answers) => answers.reduce((score, answer, index) => score + quizOutcome(index, answer).realPoint, 0);
export const percentageForScore = (score) => score * 10;
export function royalProgression(start) { if (start >= 100) return [100]; const gap = 100 - start; const steps = gap < 12 ? 2 : 3; return Array.from({ length: steps }, (_, index) => index === steps - 1 ? 100 : Math.min(99, Math.round(start + gap * ((index + 1) / steps)))); }
