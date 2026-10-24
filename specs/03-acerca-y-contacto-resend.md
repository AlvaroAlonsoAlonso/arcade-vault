# SPEC 03 — Página Acerca de en `/acerca` con formulario de contacto vía Resend

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-17
> **Objetivo:** Portar la página Acerca de / Contacto de `references/templates/home-about/about.jsx` a `/acerca` y hacer que su formulario envíe un correo real al equipo mediante una Server Action que usa Resend.

## Por qué existe este spec

SPEC 02 dejó el enlace "Acerca de" del nav apuntando a `/acerca`, que hoy muestra la 404 temática. El prototipo define esa página con un formulario de contacto que solo simula el envío. Este spec la porta 1:1 y conecta el formulario a un envío real, que es la primera pieza de lógica de servidor del proyecto (Server Action + secreto en variables de entorno).

## Alcance

**Entra:**

- Nueva ruta `/acerca` con el contenido completo de `about.jsx`: hero (`▸ ACERCA DE`, título, misión), fila de tres highlights con iconos pixel (HEART, BROWSER, PLANT), divisor animado de 24 píxeles y sección `▸ CONTACTO` (intro, tips con LEDs y formulario).
- Animación `.reveal` por scroll reutilizando `components/reveal-observer.tsx` (SPEC 02).
- Formulario con campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE, enviado mediante una Server Action con `useActionState`.
- Envío de **un único correo al equipo** con Resend: destinatario `CONTACT_TO_EMAIL`, remitente `CONTACT_FROM_EMAIL`, `replyTo` = correo del usuario. Cuerpo en HTML simple con estilo neón inline + versión en texto plano.
- Validación en servidor: los tres campos obligatorios (tras `trim`), formato de email, longitudes máximas. Honeypot oculto anti-bots.
- Estados de UI:
  - **Enviando:** botón deshabilitado con texto `▶  TRANSMITIENDO…`.
  - **Éxito:** terminal VAULT-OS del prototipo con `GRACIAS, {NOMBRE}.` y botón ENVIAR OTRO MENSAJE.
  - **Error de validación:** shake del formulario + mensaje en magenta bajo cada campo inválido; se conserva lo escrito.
  - **Error de envío** (Resend falla o falta configuración): terminal VAULT-OS en rojo con líneas `[ERR]` y botón REINTENTAR que vuelve al formulario conservando lo escrito.
- Dependencia nueva `resend`.
- `.env.template` documentando `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`, y excepción `!.env.template` en `.gitignore`.
- Port a `app/globals.css` de la sección CSS `ABOUT PAGE` de `references/templates/home-about/styles.css`, más los estilos nuevos de error (por campo y terminal en rojo).
- Verificación visual con el MCP de Playwright contra `references/templates/home-about/arcade-vault-standalone.html` a 1440 px y 375 px, y un envío real comprobado en el buzón.

**Fuera de alcance (para specs futuros):**

- Correo de confirmación/acuse al usuario (requiere dominio verificado en Resend).
- Rate limiting por IP o captcha.
- Plantillas con React Email.
- Guardar los mensajes en base de datos o panel de administración.
- Rellenar nombre/correo a partir de la sesión del usuario.
- CSS `GAMEPAD` y `Theme variants` de `home-about/styles.css`.
- Rediseño visual: es un port fiel 1:1 (salvo los estados de error, que el prototipo no define).
- Tests automatizados.

## Modelo de datos

Variables de entorno (servidor, nunca `NEXT_PUBLIC_`):

```bash
# .env.template
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_TO_EMAIL=equipo@ejemplo.com
CONTACT_FROM_EMAIL="Arcade Vault <onboarding@resend.dev>"
```

Si `CONTACT_FROM_EMAIL` no está definida, se usa `"Arcade Vault <onboarding@resend.dev>"`. `RESEND_API_KEY` y `CONTACT_TO_EMAIL` son obligatorias; si faltan, la acción devuelve `status: "error"` sin llamar a Resend.

Estado de la Server Action (`app/acerca/actions.ts`):

```ts
export type ContactField = "name" | "email" | "msg";

export type ContactState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: Partial<Record<ContactField, string>>;
      values: { name: string; email: string; msg: string };
    }
  | { status: "sent"; name: string }
  | { status: "error"; values: { name: string; email: string; msg: string } };

export async function sendContact(
  prev: ContactState,
  formData: FormData,
): Promise<ContactState>;
```

Campos del `FormData`: `name`, `email`, `msg` y el honeypot `website` (oculto con CSS, `tabIndex={-1}`, `autoComplete="off"`).

Reglas de validación (servidor):

| Campo   | Regla                                                            | Mensaje de error                                  |
| ------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| `name`  | Obligatorio, máx. 60 caracteres                                  | `NOMBRE OBLIGATORIO` / `NOMBRE DEMASIADO LARGO`   |
| `email` | Obligatorio, regex simple `^[^\s@]+@[^\s@]+\.[^\s@]+$`, máx. 254 | `CORREO NO VÁLIDO`                                |
| `msg`   | Obligatorio, máx. 2000 caracteres                                | `MENSAJE OBLIGATORIO` / `MENSAJE DEMASIADO LARGO` |

Honeypot: si `website` llega con contenido, la acción devuelve `{ status: "sent", name }` **sin** llamar a Resend (el bot no sabe que fue descartado).

Correo enviado:

- `subject`: `[Arcade Vault] Nuevo mensaje de {name}`
- `html`: generado por `buildContactEmail()` en `lib/contact-email.ts`, con `name`, `email` y `msg` **escapados** (`&`, `<`, `>`, `"`, `'`) y saltos de línea del mensaje convertidos a `<br>`.
- `text`: misma información en texto plano.

## Plan de implementación

1. **Dependencia y entorno.** `npm install resend`. Crear `.env.template` con las tres variables y añadir `!.env.template` a `.gitignore`. Verificación: `git status` muestra `.env.template` como nuevo; `npm run build` compila.
2. **CSS de About.** Copiar a `app/globals.css`, en un bloque `/* ===== acerca ===== */` tras el de home, la sección `ABOUT PAGE` de `references/templates/home-about/styles.css` (incluidos `@keyframes shake` y `pxblink` si no existen). No duplicar reglas existentes (`.field`, `.kicker`, `.btn.xl`, `.reveal`…). Verificación: build compila.
3. **Página estática.** Crear `components/highlight-icon.tsx` (SVG HEART, BROWSER, PLANT; Server Component) y `app/acerca/page.tsx` (Server Component) con hero, highlights, divisor, intro de contacto y `<RevealObserver />`. De momento el formulario es el maquetado del prototipo sin lógica. Verificación: `/acerca` se ve como el prototipo y el enlace "Acerca de" del nav queda activo.
4. **Plantilla de correo.** Crear `lib/contact-email.ts` con `escapeHtml()` y `buildContactEmail({ name, email, msg }) → { subject, html, text }`. Verificación: build compila.
5. **Server Action.** Crear `app/acerca/actions.ts` (`"use server"`) con `ContactState` y `sendContact`: leer `FormData`, comprobar honeypot, validar, comprobar variables de entorno, instanciar `Resend` y llamar a `resend.emails.send({ from, to, replyTo, subject, html, text })`. Si `error` viene informado o se lanza excepción → `console.error` y `{ status: "error", values }`. Leer antes la guía de Server Actions / Forms en `node_modules/next/dist/docs/`. Verificación: build compila.
6. **Formulario cliente.** Crear `components/contact-form.tsx` (`"use client"`) con `useActionState(sendContact, { status: "idle" })`, honeypot oculto, estado pendiente, mensajes por campo, shake al recibir `invalid` (y también validación previa en cliente de vacíos, como el prototipo), terminal de éxito, terminal de error con REINTENTAR, y ENVIAR OTRO MENSAJE que resetea al formulario vacío. Montarlo en `app/acerca/page.tsx`. Verificación: enviar vacío tiembla y muestra errores; sin `.env.local` aparece la terminal roja.
7. **Estilos de error.** Añadir al bloque `acerca` de `globals.css` `.field-error` (magenta, pixel, 9px), borde magenta en `.field.invalid input/textarea`, y `.terminal-error` (variante de `.terminal-success` con líneas `[ERR]` en magenta). Verificación: los estados de error se distinguen visualmente y siguen la estética neón.
8. **Verificación visual con Playwright.** Comparar `/acerca` con la pantalla About del prototipo a 1440 px y 375 px (capturas en `.playwright-screenshots/`), forzando `.in` en los `.reveal`. Ajustar CSS hasta que coincidan. Capturar también los estados de validación, error y éxito.
9. **Envío real.** Con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` reales en `.env.local`, enviar el formulario y comprobar que el correo llega al buzón con el contenido correcto y que "Responder" apunta al correo del usuario.

## Criterios de aceptación

- [ ] `/acerca` responde 200 y ya no muestra la 404 temática.
- [ ] El enlace "Acerca de" del nav (barra y panel móvil) aparece activo en `/acerca`.
- [ ] Hero, tres highlights, divisor animado y sección de contacto coinciden con el prototipo a 1440 px y 375 px.
- [ ] Las secciones `.reveal` aparecen al hacer scroll.
- [ ] Enviar con algún campo vacío hace temblar el formulario y no llama a la Server Action desde el cliente.
- [ ] Enviar con un correo con formato inválido (p.ej. `a@b`) muestra `CORREO NO VÁLIDO` bajo el campo y conserva el texto escrito en los tres campos.
- [ ] Un mensaje de más de 2000 caracteres se rechaza con `MENSAJE DEMASIADO LARGO`.
- [ ] Mientras se envía, el botón está deshabilitado y muestra `TRANSMITIENDO…`.
- [ ] Con las variables configuradas, un envío válido muestra la terminal de éxito con el nombre en mayúsculas y el correo llega a `CONTACT_TO_EMAIL`.
- [ ] El correo recibido tiene asunto `[Arcade Vault] Nuevo mensaje de {name}`, versión HTML y texto, y `replyTo` igual al correo del usuario.
- [ ] Un mensaje con `<script>` llega escapado en el HTML del correo (se ve como texto, no se interpreta).
- [ ] Sin `RESEND_API_KEY` o sin `CONTACT_TO_EMAIL`, el envío muestra la terminal de error, aparece un `console.error` en el servidor y la página no rompe.
- [ ] REINTENTAR desde la terminal de error vuelve al formulario con los valores conservados.
- [ ] ENVIAR OTRO MENSAJE desde la terminal de éxito vuelve al formulario vacío.
- [ ] Con el honeypot `website` relleno, se muestra éxito pero no se llama a Resend (no llega correo).
- [ ] `RESEND_API_KEY` no aparece en ningún bundle de cliente (`grep` en `.next/static` sin resultados).
- [ ] `.env.template` está versionado y `.env.local` no.
- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] Las capturas de Playwright están en `.playwright-screenshots/`.

## Decisiones

- **Sí:** Server Action + `useActionState`. Sin endpoint público, idiomático en Next 16 y el formulario funciona con progressive enhancement.
- **No:** Route Handler `app/api/contacto/route.ts`. Más código y un endpoint expuesto que nadie más consume.
- **Sí:** un único correo al equipo con `replyTo` del usuario. Funciona con el remitente de pruebas `onboarding@resend.dev` sin verificar dominio.
- **No:** acuse al usuario. El sandbox de Resend solo envía al propietario de la cuenta; necesita dominio verificado y va en otro spec.
- **Sí:** HTML simple escrito a mano + texto plano. Solo añade la dependencia `resend`.
- **No:** React Email. Dependencias y complejidad extra para un único correo.
- **Sí:** validación manual en servidor + honeypot. Sin dependencias nuevas; el servidor es la fuente de verdad.
- **No:** Zod. Tres campos no justifican una dependencia.
- **No:** rate limit / captcha. Requiere almacenamiento o servicio externo; spec futuro si hay abuso.
- **Sí:** el honeypot devuelve éxito falso. No da pistas al bot.
- **Sí:** errores de envío en terminal VAULT-OS roja con REINTENTAR. El prototipo no define el estado y así es coherente con el de éxito.
- **No:** mensaje de error suelto bajo el botón. Rompe la simetría con el estado de éxito.
- **Sí:** shake + mensaje por campo. El shake es del prototipo; el mensaje hace falta porque el servidor puede rechazar cosas que el usuario no ve (formato, longitud).
- **Sí:** sin API key → error controlado + `console.error`. Nunca se simula un éxito que no ocurrió.
- **No:** modo simulado en desarrollo. Riesgo de dar por bueno un envío que no funciona.
- **Sí:** `CONTACT_FROM_EMAIL` con valor por defecto `onboarding@resend.dev`. Permite cambiar a un dominio propio sin tocar código.
- **Sí:** `.env.template` versionado con excepción en `.gitignore` (con `.env*` ignorado para que `.env.local` nunca se versione).
- **Sí:** página como Server Component y solo `contact-form.tsx` en cliente. Minimiza JS, igual que la Home de SPEC 02.
- **Sí:** reutilizar `components/reveal-observer.tsx`. Ya existe desde SPEC 02.
- **Sí:** port fiel 1:1 sin `/frontend-design`, misma decisión que SPEC 01 y 02. El prototipo es la especificación visual; solo los estados de error son diseño nuevo y siguen los tokens existentes.
- **Sí:** verificación con Playwright a 1440 px y 375 px + un envío real. Cubre la parte visual y la integración de extremo a extremo.

## Riesgos

| Riesgo                                                                                                      | Mitigación                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Sandbox de Resend: con `onboarding@resend.dev` solo se puede enviar al correo del propietario de la cuenta. | `CONTACT_TO_EMAIL` debe ser el correo de la cuenta de Resend hasta verificar un dominio. Documentado en `.env.template`.        |
| La API key se filtra al cliente.                                                                            | Solo se lee en `actions.ts` (`"use server"`), sin prefijo `NEXT_PUBLIC_`; criterio de aceptación con `grep` en `.next/static`. |
| Inyección de HTML en el correo a través del mensaje.                                                        | `escapeHtml()` en todos los valores interpolados; criterio de aceptación con `<script>`.                                       |
| Spam masivo por el formulario.                                                                              | Honeypot y longitudes máximas. Rate limit queda para un spec futuro.                                                           |
| Server Actions / `useActionState` se comportan distinto en Next 16 con Cache Components.                    | Leer la guía en `node_modules/next/dist/docs/` antes del paso 5; la página no lee datos dinámicos.                             |
| `@keyframes shake` o `pxblink` chocan con keyframes de Tailwind (como pasó con `pulse` en SPEC 02).         | Comprobar en la verificación con Playwright; renombrar con prefijo `av-` si se pisan.                                          |

## Lo que **no** entra en este spec

- Correo de acuse al usuario y verificación de dominio en Resend.
- Rate limiting, captcha o cualquier anti-spam más allá del honeypot.
- React Email.
- Persistencia de mensajes o panel de administración.
- Autorrelleno desde la sesión.
- CSS de Gamepad y Theme variants.
- Tests automatizados.

Cada uno de estos, si llega, va en su propio spec.
