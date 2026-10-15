# SPEC 01 — MVP visual de Arcade Vault: todas las pantallas del prototipo

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-14
> **Objetivo:** Portar a Next.js App Router las cinco pantallas del prototipo `references/templates/` (biblioteca, detalle, reproductor, login y salón de la fama) más la navegación, solo a nivel visual y con datos mock, sin implementar ningún juego.

## Por qué existe este spec

`app/` sigue siendo el scaffold de create-next-app. El tema visual ya está portado: `app/globals.css` contiene los tokens y todas las clases `av-*`, `cover-*`, `btn`, `crt`, `modal`, `podium`, etc. y `app/layout.tsx` ya carga las fuentes y el fondo (`av-bg`, `av-noise`). Falta construir las pantallas que usan esas clases, para tener un MVP navegable sobre el que los specs futuros enchufarán juegos reales, backend y autenticación.

## Alcance

**Entra:**

- Datos mock tipados en `lib/games.ts`: `GAMES`, `CATS`, `PLAYERS`, `seededScores()` y `getGame(id)`, copiados del prototipo `data.jsx`.
- Sesión mock en cliente (`lib/session.tsx`): usuario en `localStorage` `av_user`, login, logout y guardado de puntuaciones en `localStorage` `av_scores`.
- Navegación superior con logo, enlaces Biblioteca / Salón de la Fama, contador decorativo `CRÉDITOS · 03`, botón de sesión y menú móvil (hamburguesa + panel lateral).
- Pie de página `© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0`.
- Ruta `/` — Biblioteca: hero, buscador por nombre, chips de categoría, grid de tarjetas con efecto tilt y estado "NO HAY RESULTADOS".
- Ruta `/juegos/[id]` — Detalle: portada, tags, descripción larga, stat-strip, botones JUGAR AHORA / VOLVER AL VAULT y leaderboard mock de 10 filas.
- Ruta `/juegos/[id]/jugar` — Reproductor: HUD (jugador, puntuación, vidas, nivel), botones PAUSA/REANUDAR, FIN y SALIR, pantalla CRT con arena decorativa animada, puntuación y nivel simulados, overlay de pausa y modal "FIN DEL JUEGO" con guardar puntuación, jugar de nuevo y volver.
- Ruta `/login` — Auth: pestañas INICIAR SESIÓN / CREAR CUENTA, campos usuario/correo/contraseña, JUGAR COMO INVITADO y botones decorativos GOOGLE / GITHUB.
- Ruta `/salon` — Salón de la Fama: pestañas por juego, podio top 3, tabla de 12 filas y fila "TU MEJOR MARCA" cuando hay sesión.
- `app/not-found.tsx` con estética arcade y botón de volver a la biblioteca, usado por ids de juego inexistentes.
- Port fiel 1:1 del prototipo: mismos textos, mismas clases, mismo comportamiento.

**Fuera de alcance (para specs futuros):**

- Cualquier juego jugable (lógica, canvas, input de teclado/táctil).
- Autenticación real, validación de formularios, OAuth con Google/GitHub.
- Backend, base de datos o API para juegos y puntuaciones.
- Leer `av_scores` para mostrarlas en el Salón o en el Detalle (los rankings siguen siendo `seededScores()`).
- Créditos funcionales (el contador `CRÉDITOS · 03` es decorativo).
- Rediseño visual: `/frontend-design` solo se usa para la página 404, que no existe en el prototipo.
- Tests automatizados (no hay framework de tests en el repo).

## Modelo de datos

```ts
// lib/games.ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type AccentColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string; // slug, p. ej. "bloque-buster"; se usa en la URL
  title: string; // "BLOQUE BUSTER"
  short: string; // descripción corta (tarjeta)
  long: string; // descripción larga (detalle)
  cat: Category;
  cover: string; // clase CSS de portada, p. ej. "cover-bricks"
  color: AccentColor; // color del botón JUGAR en la tarjeta
  best: number; // mejor puntuación global mock
  plays: string; // "12.4K"
};

export const GAMES: Game[]; // los 8 juegos de data.jsx, sin cambios
export const CATS: ("TODOS" | Category)[]; // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export const PLAYERS: string[]; // los 18 nombres de data.jsx

export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
}; // date "DD/MM/2026"
export function seededScores(seed: number, count?: number): ScoreRow[]; // mismo algoritmo determinista
export function getGame(id: string): Game | undefined;
```

```ts
// lib/session.tsx (Client Component)
export type SessionUser = { name: string }; // name en mayúsculas, máx. 10 caracteres
export type SavedScore = {
  game: string;
  score: number;
  name: string;
  at: number;
}; // at = Date.now()

// Contexto expuesto por <SessionProvider> y el hook useSession():
// { user: SessionUser | null, login(user: SessionUser | null), logout(), saveScore(entry: Omit<SavedScore, "at">) }
```

Claves de `localStorage` (idénticas al prototipo):

- `av_user` → `SessionUser` serializado, o ausente si no hay sesión.
- `av_scores` → `SavedScore[]` serializado; cada guardado hace push.

Semillas de rankings (idénticas al prototipo, para que los datos coincidan):

- Detalle: `seededScores(id.length * 17 + 3, 10)`.
- Salón: `seededScores(id.length * 23 + 7, 12)`.

## Plan de implementación

1. **Datos mock.** Crear `lib/games.ts` con los tipos y constantes del modelo de datos, portados de `references/templates/data.jsx`. Verificación: `npm run build` compila.
2. **Sesión mock.** Crear `lib/session.tsx` (`"use client"`) con `SessionProvider` y `useSession()`. Lee `av_user` tras montar, escribe/borra `av_user` en `login`/`logout` y hace push en `av_scores` en `saveScore`. Todos los accesos a `localStorage` van en `try/catch`. Verificación: build compila.
3. **Shell de la app.** Crear `components/nav.tsx` (`"use client"`, usa `usePathname` y `useSession`) y `components/footer.tsx`, portados de `nav.jsx` y `app.jsx`. Envolver `app/layout.tsx` con `SessionProvider` y montar `Nav`, `<main className="av-main">{children}</main>` y `Footer` dentro de `.av-app`. Enlaces con `next/link`. "Biblioteca" está activo en `/` y en `/juegos/*`. Pulsar el botón con el nombre de usuario cierra sesión, igual que el prototipo. Verificación: la nav aparece sobre la página scaffold y el menú móvil abre y cierra.
4. **Biblioteca.** Reemplazar `app/page.tsx` por la biblioteca: hero en Server Component y `components/library.tsx` (`"use client"`) con buscador, chips y grid. Crear `components/game-card.tsx` (`"use client"`) con el tilt por `onMouseMove`. Filtros en estado local (no en `searchParams`). La tarjeta y su botón JUGAR navegan a `/juegos/[id]`. Verificación: buscar "ca" deja solo CAÍDA; el chip SHOOTER deja INVASORES y ROCAS.
5. **Página 404.** Crear `app/not-found.tsx` con estética arcade (diseñada con `/frontend-design`, reutilizando tokens y clases existentes) y botón VOLVER A LA BIBLIOTECA. Verificación: `/no-existe` muestra la 404.
6. **Detalle.** Crear `app/juegos/[id]/page.tsx` como Server Component con `generateStaticParams` sobre `GAMES`. Llama a `notFound()` si `getGame(id)` no existe. Portar `detalle.jsx`, con JUGAR AHORA → `/juegos/[id]/jugar` y VOLVER AL VAULT → `/`. Antes de escribirlo, leer en `node_modules/next/dist/docs/` cómo se tipan y esperan `params` con Cache Components. Verificación: `/juegos/caida` muestra CAÍDA con 10 filas de leaderboard; `/juegos/xyz` muestra la 404.
7. **Reproductor.** Crear `app/juegos/[id]/jugar/page.tsx` (Server Component con `generateStaticParams` y `notFound()`) que renderiza `components/game-player.tsx` (`"use client"`), portado de `reproductor.jsx`. Simulación: +10..99 puntos cada 220 ms mientras no esté en pausa ni terminado; sube de nivel cuando `score % 2500 < 100`. El nombre por defecto es el del usuario o `INVITADO`. El input del modal pasa a mayúsculas y corta a 10 caracteres. GUARDAR PUNTUACIÓN llama a `saveScore` y muestra `▸ PUNTUACIÓN GUARDADA_`. SALIR → `/juegos/[id]`, VOLVER AL VAULT → `/`. Verificación: la puntuación sube, PAUSA la congela, FIN abre el modal y guardar añade una entrada a `av_scores`.
8. **Login.** Crear `app/login/page.tsx` y `components/auth-form.tsx` (`"use client"`), portados de `auth.jsx`. Enviar el formulario hace `login({ name: (usuario || "PLAYER1").toUpperCase().slice(0, 10) })` y navega a `/`. JUGAR COMO INVITADO hace `logout()` y navega a `/`. GOOGLE / GITHUB no hacen nada. El campo de correo solo aparece en la pestaña CREAR CUENTA. Verificación: tras entrar como `px_kai`, la nav muestra `PX_KAI ▾`.
9. **Salón de la Fama.** Crear `app/salon/page.tsx` y `components/hall-of-fame.tsx` (`"use client"`), portados de `salon.jsx`. El juego seleccionado es estado local, con el primer juego por defecto. Con sesión, se añade la fila "TU MEJOR MARCA" con los valores mock del prototipo. Verificación: cambiar de pestaña cambia podio y tabla; con sesión aparece la fila amarilla.
10. **Limpieza.** Eliminar del `app/page.tsx` cualquier resto del scaffold y comprobar que ningún componente usa clases de Tailwind del scaffold (`bg-zinc-50`, `dark:*`). Verificación: `npm run lint` y `npm run build` sin errores.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores ni avisos de Cache Components / datos dinámicos fuera de `<Suspense>`.
- [ ] `npm run lint` termina sin errores.
- [ ] Las rutas `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/login` y `/salon` existen y renderizan su pantalla.
- [ ] `/juegos/[id]` y `/juegos/[id]/jugar` se prerenderizan para los 8 ids de `GAMES` (aparecen como estáticas en la salida del build).
- [ ] `/juegos/xyz` y `/juegos/xyz/jugar` muestran la página 404 temática con botón a la biblioteca.
- [ ] La biblioteca muestra 8 tarjetas al cargar.
- [ ] Escribir "ca" en el buscador deja solo la tarjeta CAÍDA.
- [ ] Seleccionar el chip SHOOTER deja solo INVASORES y ROCAS.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Pulsar una tarjeta navega a `/juegos/<id>` de ese juego.
- [ ] El enlace "Biblioteca" de la nav aparece activo en `/`, `/juegos/caida` y `/juegos/caida/jugar`; "Salón de la Fama" aparece activo en `/salon`.
- [ ] En un viewport de 375 px de ancho, el botón ≡ abre el panel lateral y pulsar el fondo lo cierra.
- [ ] El detalle muestra 10 filas de leaderboard y los mismos nombres y puntuaciones que el prototipo para el mismo juego.
- [ ] En el reproductor la puntuación aumenta sola; PAUSA la detiene y muestra "EN PAUSA"; REANUDAR la reanuda.
- [ ] FIN abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] GUARDAR PUNTUACIÓN añade un objeto `{ game, score, name, at }` a `localStorage["av_scores"]` y muestra "▸ PUNTUACIÓN GUARDADA\_".
- [ ] JUGAR DE NUEVO reinicia puntuación a 0, vidas a 3 y nivel a 01.
- [ ] Enviar el login con usuario `px_kai` guarda `{"name":"PX_KAI"}` en `localStorage["av_user"]`, navega a `/` y la nav muestra `PX_KAI ▾`.
- [ ] Recargar la página mantiene la sesión.
- [ ] Pulsar `PX_KAI ▾` cierra sesión y elimina `av_user`.
- [ ] El campo "Correo electrónico" solo aparece en la pestaña CREAR CUENTA.
- [ ] El Salón muestra un podio de 3 y una tabla de 12 filas; cambiar de pestaña de juego cambia los datos.
- [ ] Con sesión iniciada, el Salón muestra la fila "▸ TU MEJOR MARCA EN <JUEGO>" con el nombre del usuario.
- [ ] La consola del navegador no muestra errores ni avisos de hidratación al recorrer todas las pantallas.

## Decisiones

- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`, `/login`). URLs compartibles y prerender estático.
- **No:** router por hash en una sola página como el prototipo. Desaprovecha Next y complica el SEO y la navegación.
- **Sí:** un solo spec para todas las pantallas. Los estilos ya están portados y todo es UI sin backend; el plan avanza pantalla a pantalla con pasos commiteables.
- **No:** dividir en dos specs. Añadía coordinación sin reducir riesgo.
- **Sí:** port fiel 1:1, reutilizando las clases de `app/globals.css`. El prototipo es la especificación visual.
- **No:** rediseñar pantallas con `/frontend-design`. Solo se usa para la 404, que el prototipo no tiene.
- **Sí:** datos mock tipados en `lib/games.ts`. Consumibles desde Server Components y `generateStaticParams` con tipado fuerte.
- **No:** `data/games.json`. Tipado más débil para el mismo resultado.
- **Sí:** sesión mock en `localStorage` (`av_user`) mediante un contexto cliente. Permite ver los estados con y sin sesión de la nav y del salón.
- **No:** cookies o sesión en servidor. Es trabajo del spec de autenticación real.
- **Sí:** guardar puntuaciones en `av_scores` sin leerlas todavía. Mantiene el comportamiento del prototipo sin ampliar alcance.
- **No:** mezclar `av_scores` con los rankings mock. Va en un spec futuro de puntuaciones.
- **Sí:** claves `av_user` / `av_scores` sin versión, idénticas al prototipo. Son datos mock desechables.
- **Sí:** reproductor con la simulación del prototipo (puntuación automática, nivel, pausa, modal). Permite validar todo el flujo visual sin un juego real.
- **No:** placeholder estático "PRÓXIMAMENTE". Dejaba sin validar el HUD y el modal de fin.
- **Sí:** `notFound()` con 404 temática para ids inexistentes.
- **No:** redirigir a `/` en silencio. Oculta errores de enlaces.
- **Sí:** filtros de la biblioteca y pestaña del salón en estado local. Leer `searchParams` es dato dinámico y bajo Cache Components obligaría a usar `<Suspense>` sin beneficio en un MVP.
- **Sí:** Server Components para páginas y partes estáticas; `"use client"` solo en componentes con estado o eventos (nav, library, game-card, game-player, auth-form, hall-of-fame, session).

## Riesgos

| Riesgo                                                                                   | Mitigación                                                                                                                                            |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desajuste de hidratación al leer `av_user` (servidor sin sesión, cliente con sesión).    | Leer `localStorage` solo tras montar. El primer render siempre es "sin sesión" y luego se actualiza. Se acepta un parpadeo breve del botón de la nav. |
| `localStorage` bloqueado (modo privado, cookies desactivadas).                           | Todos los accesos en `try/catch`. La app funciona sin persistir.                                                                                      |
| APIs de Next 16.4 distintas a lo conocido (`params` como Promise, Cache Components).     | Leer `node_modules/next/dist/docs/` antes de los pasos 3, 6 y 7. Comprobar con `npm run build`.                                                       |
| `seededScores()` usa `rand` determinista pero las fechas/puntuaciones dependen del seed. | Copiar el algoritmo sin cambios y usar las mismas semillas que el prototipo.                                                                          |
| Timers del reproductor siguen activos al salir de la ruta.                               | Limpiar el `setInterval` en el cleanup del efecto.                                                                                                    |

## Lo que **no** entra en este spec

- Juegos jugables de cualquier tipo.
- Autenticación real, OAuth o validación de formularios.
- Backend, base de datos o API.
- Mostrar las puntuaciones guardadas en el Salón o en el Detalle.
- Sistema de créditos.
- Rediseño visual respecto al prototipo.
- Tests automatizados.

Cada uno de estos, si llega, va en su propio spec.
