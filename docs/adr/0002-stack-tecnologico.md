# ADR 0002: Stack tecnológico y despliegue

- **Estado**: aceptada
- **Fecha**: 2026-10-05
- **Revisión**: 2026-10-06. Se reemplaza "Pages + Workers con Hono" por un solo Worker con Astro, tras verificar que el adaptador de Astro ya no soporta Pages. Se corrigen datos de alternativas.

## Contexto

La Fase 1 necesita un catálogo público rápido en celular (Lighthouse ≥90, principio II), un panel privado usable desde el celular (HU-06 a HU-10) y despliegue con CI (HU-14). Todo con costo recurrente $0 y con proveedores cuya capa gratuita permita uso comercial (principio I). El sitio no debe "dormirse" por inactividad: el tráfico será bajo e irregular.

El desarrollador conoce Flask, React y Postgres, y quiere reforzar TypeScript.

## Decisión

- **Lenguaje**: TypeScript de punta a punta.
- **Framework**: Astro con el adaptador de Cloudflare.
  - Catálogo y detalle: renderizado en el servidor (SSR) leyendo de D1, sin JavaScript en el cliente salvo lo mínimo.
  - Panel: páginas de Astro con islas de React donde haga falta interactividad (formulario con procesamiento de foto).
  - API: endpoints de Astro (`src/pages/api/...`). No se usa un framework de backend aparte.
- **Ejecución**: un solo Cloudflare Worker con static assets, con bindings a D1 (ADR 0003) y R2 (ADR 0004).
- **URL**: subdominio gratuito `*.workers.dev` al inicio. Antes del lanzamiento con clientes reales se reevalúa comprar un dominio propio (único gasto permitido por la constitución).
- **CI/CD**: GitHub Actions. En cada PR: tipos, lint y pruebas. Al fusionar en `main`: `wrangler deploy`.

## Verificación de costos (principio I)

Consultado el 2026-10-06.

| Recurso | Capa gratuita | Fuente |
|---|---|---|
| Requests al Worker | 100.000/día | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| CPU por request | 10 ms | ídem |
| Cuerpo de request | 100 MB | ídem |
| Static assets (CSS, JS, fuentes, logo) | Gratis e ilimitados; no cuentan en los 100.000/día | [Static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) |

- **Uso comercial**: el [Self-Serve Subscription Agreement](https://www.cloudflare.com/terms/) no limita los servicios gratuitos a uso personal. La única restricción específica es no procesar tarjetas de crédito, y el proyecto no tiene pagos.
- **Al exceder límites**: en el plan gratuito los requests fallan; no hay cobro.
- **Capacidad estimada**: una visita al catálogo cuesta 1 request de HTML más 1 por imagen (unas 20). Eso da unas 4.000 visitas/día, muy por encima de lo esperado.

## Consecuencias

- Un solo proyecto, un solo despliegue y un solo dominio: sin CORS, y la cookie de sesión funciona sin configuración extra.
- **Riesgo de CPU**: 10 ms por request alcanza para renderizar páginas simples y consultar D1 (la espera de red no cuenta como CPU). Se mide en el Hito 1 con el esqueleto desplegado. Si se excede, se reduce el trabajo por request antes de considerar un plan de pago.
- Hay que aprender Workers, D1 y R2. Las pruebas locales usan `wrangler dev`, que emula D1 y R2.
- Cloudflare [recomienda](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) dominio propio para producción y describe `workers.dev` como "para proyectos personales o hobby que no son críticos". Se acepta para la Fase 1. Migrar a un dominio es configuración, no código.
- **Salida si el proyecto crece**: Workers Paid (USD 5/mes) eleva los límites sin cambiar código.

## Alternativas consideradas

1. **Flask + React + Postgres en Render**: es el stack que se domina. Descartada porque el servicio web gratuito de Render [se suspende tras 15 minutos sin tráfico](https://render.com/docs/free) y tarda cerca de un minuto en despertar. Su disco es efímero, así que las fotos se perderían.
2. **Next.js en Vercel**: el plan Hobby es [solo para uso personal y no comercial](https://vercel.com/docs/plans/hobby). Descartada por el principio I.
3. **Astro en Cloudflare Pages + Hono en Workers**: era la decisión original. Descartada porque el adaptador de Astro [ya no soporta Pages](https://docs.astro.build/en/guides/integrations-guide/cloudflare/), y dos despliegues separados agregan CORS y complican las cookies sin aportar nada.

## Referencias

- Constitución: principios I, II, VI y VII.
- PRD Fase 1: HU-13, HU-14 y sección 7 (orden de construcción).
- ADR 0003, ADR 0004, ADR 0005, ADR 0006.
