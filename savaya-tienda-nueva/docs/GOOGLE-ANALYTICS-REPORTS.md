# Google Analytics en el admin: cuenta de servicio

El panel /admin/analytics consulta GA4 en modo de solo lectura. No necesita OAuth Playground, autorización interactiva ni refresh tokens. Incluye fechas personalizadas, comparación con el período anterior, usuarios activos, sesiones, vistas, compras, ingresos USD, evolución diaria, fuentes/campañas, páginas, dispositivos, productos y embudo secuencial.

## Variables privadas

Configurar en Vercel (Production) y opcionalmente en .env.local:

- GA4_PROPERTY_ID: ID numérico de la propiedad, diferente del identificador G-...
- GA4_SERVICE_ACCOUNT_EMAIL: client_email de la clave JSON de la cuenta de servicio.
- GA4_SERVICE_ACCOUNT_PRIVATE_KEY: private_key completa del JSON, sin las comillas exteriores. Admite saltos de línea reales o escritos como \\n.

La cuenta debe tener rol Lector en la propiedad GA4, sin restricciones de ingresos. Habilitar Google Analytics Data API en su proyecto Cloud. No requiere roles IAM sobre el proyecto, delegación de dominio ni acceso a Drive/Sheets.

Los secretos se mantienen en el servidor. La biblioteca oficial google-auth-library firma la autorización y obtiene access tokens con el alcance exclusivo analytics.readonly. No se registran errores originales de autenticación porque podrían incluir credenciales. Las claves pueden revocarse o rotarse en Google Cloud.

Después de configurar las variables y desplegar el código actualizado, abrir el panel con permiso analytics:read. El indicador Conectado aparece solo si se consultó GA4 correctamente.

## Uso

El panel da prioridad a GA4. Los datos de tráfico interno conservan su sección desplegable con su propio período. Los filtros GA4 admiten 7, 30, 90 días o un rango de hasta 366 días. El botón responde con desplazamiento/escala al pulsarlo y muestra el estado Consultando durante la navegación. Se respeta la preferencia de reducir movimiento.

Se puede alternar el gráfico entre usuarios, sesiones e ingresos y explorar audiencia, productos/compras y detalle diario. Los días sin actividad se muestran a cero. Las tablas tienen desplazamiento horizontal en pantallas pequeñas.

Se retiraron la exportación GA4 a Google Sheets, su endpoint y la descarga CSV de GA4. El reporte de ventas interno preexistente sigue disponible; es independiente de Google.

Las antiguas variables GOOGLE_REPORTS_CLIENT_ID, GOOGLE_REPORTS_CLIENT_SECRET y GOOGLE_REPORTS_REFRESH_TOKEN ya no se utilizan. Pueden eliminarse tras migrar. Revocar la autorización OAuth anterior si ya no se usa.

## Interpretación

- Caché de cinco minutos; se muestra fecha de consulta.
- Los días siguen la zona horaria de la propiedad GA4. La fecha predeterminada usa Venezuela.
- Los resultados dependen del consentimiento, bloqueadores y procesamiento; no reemplazan los pedidos/pagos internos.
- Los desgloses muestran hasta 50 filas principales; la evolución diaria admite 366 días.
- Etapas de compra cuenta eventos y usuarios independientes. El embudo cerrado exige visita → producto → carrito → checkout → compra en orden dentro del período, con eventos intermedios y distintas sesiones.
- El endpoint de embudos es alpha; si falla, el resto del informe sigue disponible con un aviso.
- Los avisos incluyen los umbrales, muestreo y agrupación (other) indicados por Google.

## Verificación

Comparar el mismo período, zona y moneda en GA4. Probar filtros, vista móvil y roles sin analytics:read. Sin credenciales se muestra conexión pendiente, sin datos ficticios. Las pruebas automatizadas simulan la autenticación de Google.

Referencias: [cuentas de servicio](https://developers.google.com/identity/protocols/oauth2/service-account), [GA4 runReport](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport), [embudos](https://developers.google.com/analytics/devguides/reporting/data/v1/funnels).
