# SPEC 02 — Home (landing) en `/inicio` y nav ampliado

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-15
> **Objetivo:** Portar la landing `home.jsx` y el nav de `references/templates/home-about/` a la app Next.js, moviendo la Biblioteca a `/biblioteca`, sin implementar la página Acerca de, y validar el resultado píxel a píxel con Playwright.

## Por qué existe este spec

El nuevo prototipo `references/templates/home-about/` añade una landing (Home) y un nav con cuatro enlaces (Inicio, Biblioteca, Salón de la Fama, Acerca de). Hoy `/` es la Biblioteca y el nav solo tiene dos enlaces. Este spec reorganiza las rutas para dar sitio a la landing y deja el enlace Acerca de preparado para un spec futuro.

## Alcance

**Entra:**

- Nueva ruta `/inicio` con la Home completa de `home.jsx`: hero con siluetas flotantes, sección `// 01 ¿POR QUÉ ARCADE VAULT?`, `// 02 JUEGOS DISPONIBLES AHORA` (6 mini-cards), bloque de stats, `// 03 ACTIVIDAD EN VIVO` (ticker + top jugadores), `// 04 PRECIOS` (tarjeta + FAQ) y CTA final.
- Animación `.reveal` por scroll (IntersectionObserver añade la clase `in`), igual que el prototipo.
- La Biblioteca se mueve de `/` a `/biblioteca` sin cambios visuales.
- `/` redirige a `/inicio`.
- Nav con enlaces Inicio (`/inicio`), Biblioteca (`/biblioteca`), Salón de la Fama (`/salon`) y Acerca de (`/acerca`), en escritorio y en el panel móvil.
- El logo del nav lleva a `/inicio`.
- Enlaces que hoy apuntan a `/` como "biblioteca" pasan a `/biblioteca`.
- Port a `app/globals.css` de las secciones CSS `HOME PAGE`, `ACTIVITY (leaderboard + ticker)` y `PRICING` de `references/templates/home-about/styles.css`.
- Verificación visual con el MCP de Playwright contra `references/templates/home-about/arcade-vault-standalone.html` a 1440 px y 375 px, ajustando hasta que coincidan.

**Fuera de alcance (para specs futuros):**

- Página Acerca de / Contacto (`about.jsx`): ni ruta, ni componentes, ni CSS `ABOUT PAGE`. `/acerca` muestra la 404 temática.
- CSS `GAMEPAD` y `Theme variants` de `home-about/styles.css` (no los usa la Home).
- Abrir el login directamente en la pestaña CREAR CUENTA (`?modo=registro`).
- Datos reales en la Home: actividad, top jugadores y stats siguen siendo texto fijo del prototipo.
- Rediseño visual: es un port fiel 1:1.
- Tests automatizados.

## Modelo de datos

Este spec no introduce estructuras de datos nuevas. Reutiliza `GAMES` de `lib/games.ts` (SPEC 01) para las mini-cards (`GAMES.slice(0, 6)`).

Los arrays de features, stats, ticker, top jugadores y FAQ se copian literalmente de `home.jsx` como constantes locales del componente de la Home. No se exportan ni se tipan aparte.

Tabla de rutas resultante:

| Ruta                 | Contenido                  | Enlace activo del nav |
| -------------------- | -------------------------- | --------------------- |
| `/`                  | Redirección 307 a `/inicio` (`redirects()` en `next.config.ts`, sin página) | — |
| `/inicio`            | Home (landing)             | Inicio                |
| `/biblioteca`        | Biblioteca (antes en `/`)  | Biblioteca            |
| `/juegos/[id]`       | Detalle                    | Biblioteca            |
| `/juegos/[id]/jugar` | Reproductor                | Biblioteca            |
| `/salon`             | Salón de la Fama           | Salón de la Fama      |
| `/acerca`            | 404 temática (sin archivo) | Acerca de             |
| `/login`             | Auth                       | — (solo panel móvil)  |

## Plan de implementación

1. **Mover la Biblioteca.** Crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx`. Eliminar `app/page.tsx` y redirigir `/` → `/inicio` con `redirects()` en `next.config.ts` (`permanent: false`, 307). Verificación: `/biblioteca` muestra la biblioteca; `/` redirige (a una 404 hasta el paso 7).
2. **Actualizar enlaces a la biblioteca.** Cambiar `href="/"` / `router.push("/")` por `/biblioteca` en `components/auth-form.tsx` (2), `components/game-player.tsx` (VOLVER AL VAULT), `app/juegos/[id]/page.tsx` (VOLVER AL VAULT), `components/hall-of-fame.tsx` (VOLVER A LA BIBLIOTECA) y `app/not-found.tsx`. Verificación: `grep` no encuentra `href="/"` ni `push("/")` en `app/` y `components/`.
3. **Nav ampliado.** En `components/nav.tsx`, ampliar `Section` a `"inicio" | "biblioteca" | "salon" | "acerca" | "auth"`. `isActive`: inicio → `/inicio`; biblioteca → `/biblioteca` o `/juegos/*`; salon → `/salon`; acerca → `/acerca`; auth → `/login`. Añadir los enlaces Inicio y Acerca de en el orden del prototipo, en la barra y en el panel móvil. El logo enlaza a `/inicio`. Verificación: los cuatro enlaces aparecen y el activo cambia al navegar.
4. **CSS de la Home.** Copiar a `app/globals.css`, en un bloque `/* ===== home ===== */` tras el de salón, las secciones `HOME PAGE`, `ACTIVITY (leaderboard + ticker)` y `PRICING` de `references/templates/home-about/styles.css`, sin las de `ABOUT PAGE`, `GAMEPAD` ni `Theme variants`. No duplicar reglas que ya existen (`.btn.xl`, `.btn.pulse`, `.fade-in`, `.blink`…). Verificación: `npm run build` compila.
5. **Componentes decorativos.** Crear `components/floating-silhouettes.tsx` (las 8 SVG `s1`–`s8`), `components/feature-icon.tsx` (GAMEPAD, FREE, TROPHY, ROCKET) y `components/mini-card.tsx` (`<Link>` a `/juegos/[id]` con `cover-bg` + título + categoría). Todos Server Components. Verificación: build compila.
6. **Reveal por scroll.** Crear `components/reveal-observer.tsx` (`"use client"`) que en un `useEffect` observa todos los `.reveal` con `IntersectionObserver` (`threshold: 0.12`), añade `in` y hace `disconnect` al desmontar. No renderiza nada. Verificación: al hacer scroll las secciones aparecen con fade.
7. **Página Home.** Crear `app/inicio/page.tsx` (Server Component) portando `home.jsx` 1:1: mismos textos, clases y `transitionDelay`/`animationDelay` inline. Monta `<RevealObserver />`. Botones: EXPLORAR JUEGOS, VER TODOS LOS JUEGOS e INSERTAR MONEDA → `/biblioteca`; CREAR CUENTA y EMPEZAR GRATIS → `/login`; VER SALÓN → `/salon`. Los botones de navegación se implementan como `<Link>` con las mismas clases `btn …`. Números con `toLocaleString("es-ES")` en servidor. Verificación: `/inicio` muestra las 7 secciones.
8. **Lint y build.** `npm run lint` y `npm run build` sin errores; `/inicio` y `/biblioteca` aparecen como estáticas.
9. **Verificación visual con Playwright.** Con `npm run dev` en marcha, abrir con el MCP de Playwright el prototipo (`references/templates/home-about/arcade-vault-standalone.html`, pantalla Home) y `http://localhost:3000/inicio`. A 1440 px y a 375 px, tomar capturas de página completa de ambos (tras hacer scroll para disparar los `.reveal`) y del menú móvil abierto a 375 px. Guardarlas en `.playwright-screenshots/` con nombres `proto-home-1440.png`, `app-home-1440.png`, `proto-home-375.png`, `app-home-375.png`, `proto-nav-375.png`, `app-nav-375.png`. Comparar sección a sección (tipografía, espaciados, colores, glow, grids) y corregir CSS/markup hasta que coincidan. Repetir capturas tras cada corrección.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de Cache Components.
- [ ] `npm run lint` termina sin errores.
- [ ] Visitar `/` redirige a `/inicio`.
- [ ] `/biblioteca` muestra la biblioteca con sus 8 tarjetas, buscador y chips como antes.
- [ ] `/inicio` muestra, en orden: hero, `// 01`, `// 02`, stats, `// 03`, `// 04` y CTA final, con los textos exactos de `home.jsx`.
- [ ] La sección `// 02` muestra 6 mini-cards (los 6 primeros juegos de `GAMES`) y pulsar una navega a `/juegos/<id>`.
- [ ] EXPLORAR JUEGOS, VER TODOS LOS JUEGOS e INSERTAR MONEDA navegan a `/biblioteca`.
- [ ] CREAR CUENTA y EMPEZAR GRATIS navegan a `/login`; VER SALÓN navega a `/salon`.
- [ ] Las secciones con `.reveal` empiezan invisibles y aparecen al entrar en el viewport.
- [ ] El nav muestra Inicio · Biblioteca · Salón de la Fama · Acerca de, en escritorio y en el panel móvil.
- [ ] El logo del nav lleva a `/inicio`.
- [ ] Inicio está activo en `/inicio`; Biblioteca en `/biblioteca`, `/juegos/caida` y `/juegos/caida/jugar`; Salón en `/salon`; Acerca de en `/acerca`.
- [ ] `/acerca` muestra la 404 temática.
- [ ] VOLVER AL VAULT (detalle y reproductor), VOLVER A LA BIBLIOTECA (salón y 404) y el envío del login navegan a `/biblioteca`.
- [ ] `app/globals.css` no contiene ninguna regla de las secciones `ABOUT PAGE`, `GAMEPAD` ni `Theme variants`.
- [ ] Existen en `.playwright-screenshots/` las 6 capturas del paso 9, tomadas tras la última corrección.
- [ ] En esas capturas, la app y el prototipo coinciden en layout, textos, colores y grids a 1440 px y 375 px (feature-grid en 4 → 1 columnas, mini-rail en 6 → 2, stats en 3 → 1, activity y pricing en 2 → 1).
- [ ] La consola del navegador no muestra errores ni avisos de hidratación en `/inicio` ni `/biblioteca`.

## Decisiones

- **Sí:** Home en `/inicio` y Biblioteca en `/biblioteca`, con `/` redirigiendo a `/inicio`. Cada pantalla tiene su URL propia y no hay contenido duplicado.
- **No:** Home en `/` con la Biblioteca en `/biblioteca`. El usuario prefiere una ruta explícita `/inicio`.
- **No:** mostrar la Home también en `/`. Duplica contenido y complica el enlace activo.
- **Sí:** redirigir `/` con `redirects()` en `next.config.ts`, antes del render. Cambio decidido durante la implementación.
- **No:** `redirect()` en `app/page.tsx` (plan original). Con `partialPrefetching`, en dev provoca `Could not validate 'instant' because an error prevented the target segment from rendering` en `/`.
- **No:** `export const instant = false` en `app/page.tsx`. Silencia la validación pero mantiene una página que solo redirige.
- **Sí:** renombrar `@keyframes pulse` del tema a `av-pulse`. Tailwind v4 emite su propio `@keyframes pulse` (opacidad) sin capa y pisaba el glow de `.btn.pulse`. Detectado en la verificación con Playwright.
- **Sí:** `font-weight: 700` en `.home-title`, `.section-title` y `.final-title`. El preflight de Tailwind quita el bold de `h1`/`h2` y el prototipo pinta Press Start 2P con negrita sintética.
- **Sí:** enlace Acerca de apuntando a `/acerca`, aunque hoy dé 404. Fiel al diseño y queda listo para el spec de About.
- **No:** quitar el enlace o deshabilitarlo. Se desvía del prototipo.
- **Sí:** logo → `/inicio`, igual que el prototipo.
- **Sí:** los enlaces de "volver a los juegos" (detalle, reproductor, salón, 404, login) van a `/biblioteca`. Conservan su significado actual.
- **Sí:** CREAR CUENTA y EMPEZAR GRATIS → `/login` sin parámetros. Leer `searchParams` es dato dinámico y con Cache Components obligaría a usar `<Suspense>`.
- **Sí:** Home como Server Component con un único componente cliente (`RevealObserver`) para el IntersectionObserver. Minimiza JS en cliente.
- **Sí:** botones de navegación como `<Link className="btn …">` en vez de `<button onClick>`. Navegación real y prefetch, mismo aspecto.
- **Sí:** stats, ticker y top jugadores como texto fijo del prototipo (incluido "12+ JUEGOS" aunque `GAMES` tenga 8). Port fiel; los datos reales van en otro spec.
- **Sí:** port fiel 1:1 sin `/frontend-design`, misma decisión que SPEC 01. El prototipo es la especificación visual.
- **Sí:** solo se portan las secciones CSS que usa la Home. Las de About, Gamepad y Theme variants esperan a sus specs.
- **Sí:** verificación con Playwright a 1440 px y 375 px. Cubre escritorio, móvil y el menú hamburguesa.
- **No:** añadir 980 px. Se descartó para acotar la verificación.

## Riesgos

| Riesgo                                                                                     | Mitigación                                                                                                                   |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `.reveal` deja secciones invisibles si el observer no se ejecuta (JS desactivado o error). | Se acepta, como en el prototipo. Las capturas se toman tras hacer scroll completo.                                           |
| Las capturas de página completa no disparan el IntersectionObserver.                       | Hacer scroll hasta el final con `browser_evaluate` antes de capturar, o forzar `.in` en todos los `.reveal` para la captura. |
| Diferencias de fuente (prototipo con Google Fonts por CDN, app con `next/font`).           | Comparar con las fuentes ya cargadas; si difieren métricas, ajustar en `globals.css` sin tocar el prototipo.                 |
| Algún enlace a `/` queda sin actualizar y lleva a la landing en lugar de a la biblioteca.  | `grep` de `href="/"` y `push("/")` en el paso 2 y criterio de aceptación específico.                                         |
| `redirect()` en `app/page.tsx` se comporta distinto con Cache Components.                  | Materializado (error de validación `instant` en dev). Resuelto con `redirects()` en `next.config.ts`.                        |

## Lo que **no** entra en este spec

- Página Acerca de / Contacto y su CSS.
- CSS de Gamepad y Theme variants.
- Login abierto en la pestaña CREAR CUENTA.
- Datos reales en actividad, ranking o stats de la Home.
- Rediseño visual respecto al prototipo.
- Tests automatizados.

Cada uno de estos, si llega, va en su propio spec.
