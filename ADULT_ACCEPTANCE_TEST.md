# Prueba adulta del onboarding

Duración prevista: 10–15 minutos. Usar una cuenta de prueba o aceptar que la misión quedará registrada en la cuenta seleccionada.

1. Abrir `/world`: un jugador sin onboarding debe ir a `/onboarding`.
2. Comprobar que NOVA explica el propósito sin lenguaje técnico.
3. Elegir personaje, recargar y confirmar que se conserva.
4. Intentar abrir directamente `/shop`, `/base`, `/achievements` y `/mission`: deben volver al onboarding.
5. Abrir la misión desde NOVA, responder parcialmente, recargar y confirmar que continúa.
6. Terminar exactamente 10 retos y comprobar XP y monedas.
7. Volver con NOVA, abrir el mundo y confirmar que el onboarding no reaparece.
8. Abrir el refugio y la Bitácora; revisar personaje, misión, aciertos, XP y monedas.
9. Revisar el recorrido a 390 px de ancho y solo con teclado.
10. Confirmar que ningún error muestra detalles técnicos o pierde progreso guardado.

La auditoría `npm run audit:adult-onboarding` comprueba automáticamente las barreras de rutas, la exigencia de una misión posterior al inicio y los límites de privacidad de la telemetría.
