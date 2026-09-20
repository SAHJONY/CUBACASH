# legal/ — Firma Legal interna de MY CUBA CASH

> **Investigación legal con IA — no es asesoría legal.**
> **AI LEGAL RESEARCH — NOT LEGAL ADVICE.**

Directorio INTERNO, solo para el propietario (rol `platform_owner`).

- **`deal-intakes/`** — Solicitudes de revisión legal previa a compromiso (deal/partnership
  advisory intake). Cada envío se guarda como un archivo `.json` + un resumen `.md`
  con marca de tiempo. **Nada de lo que se envía aquí sale a ningún tercero** —
  no se envía por correo, WhatsApp, API externa ni a ninguna autoridad.
- **`regulatory-watch-baseline.json`** — Alertas regulatorias de referencia (snapshot
  2026) relevantes para remesas/Cuba. Solo lectura para la página de Firma Legal;
  las actualizaciones se hacen por edición manual en esta rama, nunca de forma
  automática contra APIs externas.

## Reglas no negociables

1. **Solo uso interno del propietario.** Esto no es una oferta pública de asesoría
   legal (riesgo UPL — ejercicio no autorizado de la abogacía).
2. Nada aquí crea privilegio abogado-cliente ni sustituye a un abogado licenciado
   (gate de revisión de abogado del charter §6).
3. **Separación de negocios:** MY CUBA CASH y SAHJONY Import/Export son negocios
   SEPARADOS. Ningún proveedor, lead o contacto se archiva cruzado entre ellos.
   La firma legal sirve a cada negocio por separado.
4. Este módulo vive detrás de las rutas de propietario (`/command-center/...`).
   Nunca enlazarlo desde páginas públicas.
