# DealStartups

Marketplace P2P de deals (buscar socio, vender empresa, buscar inversor…) donde
la visibilidad se compra con **pujas semanales**. Sin puja minima: los deals con
0 € se publican en la seccion secundaria «Ultimos deals», y quien mas puja
aparece arriba del ranking.

Stack: **Next.js 14 (App Router) · React · Tailwind CSS · Supabase (PostgreSQL +
Auth + Storage) · Stripe · Vercel**.

---

## Ver la web en 2 minutos (modo demo)

```bash
npm install
npm run dev     # http://localhost:3000
```

Sin ninguna variable de entorno, la web arranca en **modo demo**: portada con
ranking, filtros, busqueda, paginacion y fichas de deal, todo con datos de
ejemplo. Auth, publicacion y pagos quedan desactivados y se indica con un aviso.
Es la forma rapida de ver la interfaz antes de dar de alta Supabase y Stripe.

## Puesta en marcha completa

```bash
npm install
cp .env.example .env.local   # rellena las claves
npm run dev                  # http://localhost:3000
```

En cuanto `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` existen,
el modo demo se apaga solo y la web pasa a leer y escribir en tu base de datos.

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre el **SQL Editor** y ejecuta [`supabase/schema.sql`](supabase/schema.sql).
   Crea las tablas, la vista de ranking, las funciones, las politicas RLS y el
   bucket `deal-images`.
3. Copia en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`
   (Settings → API). La service role key es **solo de servidor**.

### 2. Stripe

1. Copia `STRIPE_SECRET_KEY` y `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` del dashboard de
   Stripe (modo test).
2. Webhook a `POST /api/webhooks/stripe` escuchando `payment_intent.succeeded`,
   `payment_intent.payment_failed` y `payment_intent.canceled`. Guarda el
   secreto en `STRIPE_WEBHOOK_SECRET`.
3. En local:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Aunque no configures el webhook, tras pagar el cliente llama a
   `/api/payments/confirm`, que verifica el cobro contra Stripe y aplica la puja
   (la operacion es idempotente, el webhook posterior no duplica nada).

### 3. Email (opcional)

`SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` activan los avisos de nuevo contacto
y de deal publicado. Sin clave, el envio se omite y se registra en consola.

### 4. Reset semanal

`vercel.json` programa `GET /api/cron/weekly-reset` cada **lunes a las 00:00
UTC**. La ruta acepta tambien una llamada manual:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://tu-dominio/api/cron/weekly-reset
```

Actualiza `week_number` de los deals vivos y archiva los que superan 8 semanas.

---

## Modelo de datos

| Tabla           | Contenido                                                             |
| --------------- | --------------------------------------------------------------------- |
| `users`         | Perfil publico (la contrasena vive en `auth.users`, la gestiona Supabase Auth) |
| `deals`         | Deal, tipo, puja actual, estado, semana, contadores de visitas/contactos |
| `bid_history`   | Cada puja con su `payment_id` de Stripe y su estado de pago            |
| `deal_contacts` | Mensajes recibidos por deal                                            |

Vista `ranked_deals`: expone los campos publicos del deal + `author_name` y
calcula la **posicion** con `row_number()` sobre `current_bid DESC, updated_at
DESC`. El email del publicador nunca sale por esta vista.

Estados de un deal: `pending` (creado, esperando el pago de la puja inicial) →
`active` → `closed` (reportado como cerrado) / `archived` (limpieza semanal).
La columna `deals.position` existe segun el esquema original pero la posicion se
calcula en lectura desde la vista, que siempre esta al dia.

---

## Flujo de pago

1. `POST /api/deals` crea el deal. Con puja 0 € se publica al momento; con puja
   mayor queda en `pending` y se crea un `PaymentIntent`.
2. El front confirma el pago con Stripe Elements.
3. `payment_intent.succeeded` (webhook) o `/api/payments/confirm` (reconciliacion
   inmediata) marcan la puja como `succeeded`, aplican `current_bid`, refrescan
   `updated_at` y activan el deal.
4. Si el pago falla, la puja pasa a `failed` y el deal `pending` se elimina.

Una repuja sigue el mismo camino con `kind = 'rebid'` y debe superar la puja
actual.

---

## API

| Metodo | Ruta                        | Descripcion                              |
| ------ | --------------------------- | ---------------------------------------- |
| POST   | `/api/auth/signup`          | Registro                                  |
| POST   | `/api/auth/login`           | Login                                     |
| POST   | `/api/auth/logout`          | Logout                                    |
| GET    | `/api/auth/me`              | Usuario actual                            |
| GET    | `/api/deals`                | Listado (`page`, `perPage`, `type`, `q`, `section`) |
| POST   | `/api/deals`                | Crear deal (+ intent si hay puja)         |
| GET    | `/api/deals/[id]`           | Detalle publico                           |
| PUT    | `/api/deals/[id]`           | Editar (solo owner)                       |
| PUT    | `/api/deals/[id]/close`     | Marcar como cerrado (solo owner)          |
| POST   | `/api/deals/[id]/rebid`     | Nueva puja (solo owner, debe superar la actual) |
| POST   | `/api/deals/[id]/contact`   | Enviar mensaje (requiere sesion)          |
| GET    | `/api/deals/[id]/contacts`  | Mensajes recibidos (solo owner)           |
| POST   | `/api/payments/create-intent` | PaymentIntent para un deal propio       |
| POST   | `/api/payments/confirm`     | Reconciliacion tras el checkout           |
| POST   | `/api/webhooks/stripe`      | Webhook de Stripe                         |
| GET    | `/api/users/[id]`           | Perfil publico + deals activos            |
| GET    | `/api/users/me/dashboard`   | Panel privado                             |
| GET/POST | `/api/cron/weekly-reset`  | Reset semanal (cron o `CRON_SECRET`)      |

---

## Reglas de negocio

- Solo usuarios con sesion pueden publicar, repujar o contactar.
- Una repuja debe ser **estrictamente mayor** que la puja actual.
- Un deal cerrado no admite pujas ni contactos.
- Maximo **5 deals al dia** por usuario (contador en memoria + comprobacion en BD).
- Puja minima cobrable: 0,50 € (limite de Stripe). 0 € es gratis y va a
  «Ultimos deals».
- Todas las entradas se validan en servidor con zod; RLS protege las tablas y el
  service role solo se usa tras comprobar la autorizacion a mano.

---

## Scripts

```bash
npm run dev        # desarrollo
npm run build      # build de produccion
npm run start      # servidor de produccion
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

## Despliegue en Vercel

Importa el repo, define las variables de `.env.example` en el proyecto y
despliega. El cron semanal se activa solo con `vercel.json`. Recuerda apuntar el
webhook de Stripe al dominio de produccion y ajustar `NEXT_PUBLIC_SITE_URL`.

## Pendiente (fase 3)

Filtros avanzados por importe de puja, panel de administracion, analitica propia,
comision del 5–10 % al reportar un deal como cerrado.
