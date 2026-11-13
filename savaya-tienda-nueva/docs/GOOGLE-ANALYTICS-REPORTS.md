# Informes GA4 en el admin

`/admin/analytics` conserva el tráfico interno y añade un informe GA4 independiente por fechas. Incluye usuarios activos, sesiones, vistas, compras, ingresos USD, comparación con el período anterior de igual duración, evolución diaria, fuentes/campañas, páginas, dispositivos, productos y embudo secuencial cerrado. Los desgloses se limitan a las 50 filas principales; la evolución diaria admite 366 días. Las exportaciones contienen exactamente ese alcance, no todo el histórico.

## Conexión necesaria

El identificador público `G-...` y `GA4_API_SECRET` existentes **envían** eventos; no autorizan la lectura de GA4 ni la creación de archivos. Esta integración usa una cuenta de Google de la tienda con OAuth offline para que los informes pertenezcan a esa cuenta (no a una cuenta de servicio sin almacenamiento de Drive).

Variables privadas, tanto en `.env.local` como en Vercel:

```dotenv
GA4_PROPERTY_ID=123456789
GOOGLE_REPORTS_CLIENT_ID=...
GOOGLE_REPORTS_CLIENT_SECRET=...
GOOGLE_REPORTS_REFRESH_TOKEN=...
```

1. En Google Cloud, habilitar **Google Analytics Data API** y **Google Sheets API** en el proyecto OAuth.
2. La cuenta autorizada debe tener acceso de lectura a la propiedad GA4. Copiar el ID numérico desde Administrar → Configuración de la propiedad; no el identificador `G-...`.
3. Crear/configurar un cliente OAuth de aplicación web y su pantalla de consentimiento. Solicitar únicamente `https://www.googleapis.com/auth/analytics.readonly` y `https://www.googleapis.com/auth/drive.file`.
4. Obtener un refresh token con consentimiento de esa cuenta y `access_type=offline`. Para una configuración manual se puede usar [OAuth Playground](https://developers.google.com/oauthplayground/): autorizar `https://developers.google.com/oauthplayground` como redirect URI del cliente, activar **Use your own OAuth credentials**, introducir el cliente/secret, autorizar ambos scopes y canjear el código. Guardar el refresh token solo como variable privada; nunca en Git ni en mensajes.
5. Configurar el consentimiento para uso duradero según el tipo de cuenta y los requisitos de Google. En una aplicación externa en estado Testing, los refresh tokens con estos scopes suelen caducar a los siete días. Revisar publicación/verificación antes de producción.
6. Reiniciar el servidor local o redesplegar Vercel después de añadir las variables. Abrir el panel con un usuario que tenga `analytics:read` y consultar un período con tráfico.

## Exportación

**Crear informe en Google Sheets** crea un documento nuevo con pestañas, encabezados fijos y celdas numéricas, y devuelve un enlace para abrirlo. Google Sheets es un documento alojado, no un formato descargable; **Descargar CSV** ofrece además un archivo local que se puede importar en Sheets o Excel. Desde Sheets también se puede descargar XLSX/PDF. El documento hereda la privacidad de la cuenta conectada; la aplicación no lo comparte públicamente ni cambia permisos. Los usuarios del admin necesitarán acceso en Drive si no usan esa cuenta. Cada clic crea un nuevo documento.

GET exporta CSV y POST crea el documento. Ambos verifican sesión y `analytics:read`; POST exige mismo origen. Los nombres de páginas/campañas/productos se escriben como texto, sin ejecutar fórmulas. No se registran tokens ni respuestas privadas de Google.

## Interpretación y verificación

- Caché de GA4: cinco minutos; se muestra fecha de consulta. Los días se interpretan en la zona horaria de la propiedad GA4, indicada en el informe. La fecha predeterminada usa Venezuela.
- Los eventos enviados pueden tardar en aparecer y faltar por consentimiento/bloqueadores. GA4 no sustituye a los pedidos/pagos internos.
- **Etapas de compra** cuenta eventos y usuarios independientes; **Embudo de compra** consulta `runFunnelReport` y exige visita → producto → carrito → checkout → compra en orden dentro del período, admitiendo eventos intermedios y distintas sesiones. Este endpoint es alpha; si falla, el resto del informe sigue disponible con un aviso.
- Se muestran avisos cuando Google indica umbrales, muestreo o agrupación `(other)`.
- Para validar producción: comparar el mismo período/zona/moneda en GA4, crear un Sheet y comprobar pestañas, cifras y fechas; probar acceso denegado con un rol sin `analytics:read`.
- Sin OAuth configurado se muestra un estado de conexión pendiente; no se muestran cifras ficticias. Las pruebas automatizadas simulan Google y no crean archivos reales.

Referencias: [GA4 runReport](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport), [embudos](https://developers.google.com/analytics/devguides/reporting/data/v1/funnels), [Sheets create](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/create), [OAuth offline](https://developers.google.com/identity/protocols/oauth2/web-server#offline).
