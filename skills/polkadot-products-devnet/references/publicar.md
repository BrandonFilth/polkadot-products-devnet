# Publicar: Bulletin + nombre `.dot`

Publicar es: construir `dist/`, subirlo a **Bulletin**, obtener su **CID** y ponerlo como
`contenthash` de un nombre `.dot`. El Host abre la app desde ese nombre.

Herramientas (versiones fijas, siempre con `pnpm dlx --ignore-scripts`):

| Atajo | Paquete npm | Versión |
|---|---|---|
| `pad` | `@polkadot-community-foundation/polkadot-app-deploy` | 0.22.1 (pide Node 22+) |
| `dotns` | `@polkadot-community-foundation/dotns-cli` | 1.0.0 (firmar con el teléfono por QR pide Node 21+) |

Atajos para una sesión de PowerShell:

```powershell
function pad { $env:PAD_UPDATE_CHECK = '0'; pnpm dlx --ignore-scripts @polkadot-community-foundation/polkadot-app-deploy@0.22.1 @args }
function dotns { pnpm dlx --ignore-scripts @polkadot-community-foundation/dotns-cli@1.0.0 @args }
$env:PAD_ENV   = "devnet"
$env:DOTNS_ENV = "devnet"
```

- Correr la función desde la raíz del repo funciona: los overrides acotados de `versiones.md` no
  alcanzan a `pad` (probado con la caché de `pnpm dlx` vacía). Los overrides globales sí lo rompen
  (`errores-comunes.md`).

- **`--env devnet` siempre.** El valor por defecto de `pad` es `paseo-next-v2`, otra red (`pad --help`).
- `--js-merkle` evita necesitar el binario de IPFS Kubo.
- Sin `--ignore-scripts`, `pnpm dlx` puede preguntar qué compilar o fallar con `not a terminal`.
- La primera ejecución descarga el paquete (30–100 s); después es casi inmediato.

## 1. Nombre `.dot`

| Longitud de la etiqueta | Quién puede registrar | Depósito |
|---|---|---|
| 9 caracteres o más | cualquiera | 10 PAS, reembolsable |
| 6 a 8 | requiere Proof of Personhood *Full* | 10 PAS, reembolsable |
| 5 o menos | no disponible por esta vía | — |

- Etiqueta de 3 a 63 caracteres: `a-z`, `0-9`, `-`; sin guion al inicio ni al final.
- Para el hackatón: **nombres de 9 caracteres o más**.
- El registro es *commit-reveal*: reserva, espera de ~60 s (no está colgado), registro final.
- Registrar (método del taller): en la Polkadot App o Desktop, `dotns.dot` → Search → Register →
  Register → Continue → firmar en el teléfono. Es el flujo del capítulo 5, sección 8 del tutorial
  ("Compra tu dominio .dot", con captura).
- ¿Está libre? `dotns lookup owner-of <etiqueta> --env devnet`.
- Alternativa por CLI (no es el método del taller): `dotns register domain --name <etiqueta> --env devnet`;
  necesita una cuenta en el keystore de `dotns`. No se repitió el 2026-10-15: **POR VERIFICAR**.

Fuentes: [Register a .dot domain](https://docs.polkadot.com/apps/register-dot-domain/),
[PoP rules and pricing](https://docs.polkadot.com/reference/apps/infrastructure/dotns/poprules-pricing/).

## 2. Probar y publicar: el método del taller

El mismo flujo tiene dos usos: pruebas con `--no-manifest` (pasos de abajo) y la publicación final
con config + `APP_DOT` (variante, más abajo). Ningún Host se
conecta a `localhost` (ver `app-sdk.md`, *Dónde probar*): todo lo que pase por el Host se prueba con
la app publicada en su `.dot`.

1. **Una sola vez:** comprar el nombre en la Polkadot App desde `dotns.dot` (9 caracteres o más). El
   nombre es de la cuenta del teléfono.
2. Desde la carpeta del proyecto, después de `pnpm build`:

   ```powershell
   function pad { $env:PAD_UPDATE_CHECK = '0'; pnpm dlx --ignore-scripts @polkadot-community-foundation/polkadot-app-deploy@0.22.1 @args }
   $tmp = 'tmp' + (-join ((Get-Date -Format 'yyyyMMddHHmmss').ToCharArray() | ForEach-Object { [char](97 + [int]"$_") })) + '.dot'
   pad .\dist $tmp --env devnet --js-merkle --no-manifest
   ```

   En macOS/Linux:

   ```bash
   pad() { PAD_UPDATE_CHECK=0 pnpm dlx --ignore-scripts @polkadot-community-foundation/polkadot-app-deploy@0.22.1 "$@"; }
   tmp="tmp$(date +%Y%m%d%H%M%S | tr '0-9' 'a-j').dot"
   pad ./dist "$tmp" --env devnet --js-merkle --no-manifest
   ```

   `.\dist` es la carpeta del build; en un workspace puede ser otra (por ejemplo `.\game\dist` desde
   la raíz): revisar la configuración de Vite. Sin carpeta temporal, sin cerrar sesión, sin
   mnemónico y sin keystore.
3. Copiar el CID de la línea `CID: bafy…` (casi al final, antes de `Domain:`).
4. Pegarlo en el `contenthash` del nombre propio desde `dotns.dot` (sección 3). Es la única firma y
   se hace en el teléfono. El manifest (icono, nombre, descripción) es opcional: variante de abajo y
   sección 4.
5. Abrir el nombre desde el Host y probar. Cada build da un CID nuevo, que se vuelve a pegar.

- Éxito = estas líneas, en este orden:

  ```text
  Storage signer: pool fallback (no session)
  Using pool account N: 5…
  Root CID: bafy…
  Verified on-chain: bafy…
  P2P retrieval: ✓
  DEPLOYMENT COMPLETE!
  https://<nombre-temporal>.dev-dot.li
  <nombre-temporal>.dot  (in a Polkadot app: mobile or desktop)
  CID: bafy…
  Domain: <nombre-temporal>.dot
  ```

  El CID que se copia es el de `CID: bafy…` (igual al *Root CID*). Las líneas `CID: bafkrei…` del
  medio son los trozos, no el CID de la app.
- En el camino salen dos avisos inofensivos: `WARNING: devnet declares DotNS 1.0.0, newer than 0.8.0 …
  Continuing on the v0.6.0 profile…` (varias veces) y `Revive.call: nonce contention (attempt N/5)`
  (`pad` reintenta solo). No hay que hacer nada.
- Tarda unos 4 min con la muestra del taller (2.08 MB después del plugin de Vite, `app-sdk.md`,
  *Vite*): 3 min 49 s.
- Comprobación sin el Host: `https://<nombre-temporal>.dev-dot.li`.

### Variante: publicar con icono y manifest (config + `APP_DOT`)

Para la versión final con tarjeta (icono, nombre y descripción). Requiere
`polkadot-app-deploy.config.mjs` junto a `dist/` (sección 4). El nombre temporal va en la variable
`APP_DOT`, que lee la config, y ya no se usa `--no-manifest`:

```powershell
function pad { $env:PAD_UPDATE_CHECK = '0'; pnpm dlx --ignore-scripts @polkadot-community-foundation/polkadot-app-deploy@0.22.1 @args }
pnpm build
$env:APP_DOT = 'tmp' + (-join ((Get-Date -Format 'yyyyMMddHHmmss').ToCharArray() | ForEach-Object { [char](97 + [int]"$_") })) + '.dot'
pad .\dist $env:APP_DOT --env devnet --js-merkle
```

En macOS/Linux (`export` es necesario para que `pad` vea la variable; no probado, solo Windows):

```bash
pad() { PAD_UPDATE_CHECK=0 pnpm dlx --ignore-scripts @polkadot-community-foundation/polkadot-app-deploy@0.22.1 "$@"; }
pnpm build
export APP_DOT="tmp$(date +%Y%m%d%H%M%S | tr '0-9' 'a-j').dot"
pad ./dist "$APP_DOT" --env devnet --js-merkle
```

- Las cuatro líneas en la misma terminal en cada subida: la tercera genera un nombre nuevo.
- Una sola corrida sube el bundle y el icono y escribe el manifest en el nombre temporal. Éxito =
  estas líneas:

  ```text
  CID: bafybei…
    Loaded config: …\polkadot-app-deploy.config.mjs
    Icon CID: bafk2bza…
    Executable [app] reused build-dir CID: bafybei…
     Verified text[manifest]: {"$v":1,"displayName":"…",…}
    Atomically writing contenthash and executable manifest on app.<nombre-temporal>.dot …
  DEPLOYMENT COMPLETE!
  ```

  `CID: bafybei…` sale **antes** de `Loaded config`; después siguen el icono, el manifest y el
  subnombre `app.` (sección 4).
- Tarda 3 min 36 s hasta la línea `CID:` y 5 min 09 s en total con la muestra del taller; ~50 s más
  la primera vez que `pnpm dlx` descarga `pad`.
- Se copian dos cosas: el CID (va en Resolve) y el JSON de `Verified text[manifest]:`, de la primera
  `{` a la última `}` (va en el registro `manifest`). Ambos se pegan en el nombre propio (sección 4).
- Correr `pad` sin tuberías (`| Tee-Object`, `| ForEach-Object`): en PowerShell 5.1 la salida por
  tubería se decodifica con la página de códigos de la consola y los acentos del JSON salen como
  `r├®cord` (el valor en la cadena es correcto). Si pasa, corregir los acentos a mano o ejecutar
  `[Console]::OutputEncoding = [Text.Encoding]::UTF8` y leerlo con
  `dotns text view <etiqueta> manifest --env devnet`.

Fuente: corrida del 2026-10-23 con `pad` 0.22.1 en Windows (nombre temporal
`tmpcacgbacdahcceb.dot`, exit 0) y lectura con `dotns` 1.0.0.

Por qué cada parte:

| Parte | Motivo |
|---|---|
| `--env devnet` | El valor por defecto de `pad` es `paseo-next-v2`, otra red |
| `--js-merkle` | No necesita el binario de IPFS Kubo |
| `--no-manifest` | `pad` sube solo el bundle y no escribe el manifest; con la config presente funciona sin `APP_DOT` (corrida del 2026-10-23). `pad --help` lo describe igual que no tener config (alias `--content-only`) |
| Nombre temporal | `pad --help` no muestra un modo de solo subir: el uso es siempre `<build-dir> <domain.dot>` y `pad` registra o actualiza el nombre que recibe. Sin sesión firma DotNS con su worker de desarrollo (`5DfhGy…` / `0x35cd…`; paga 11 PAS por nombre nuevo) y sube con una cuenta del *pool*. El nombre queda a nombre del worker y no se reutiliza |
| Dígitos a letras (0→a … 9→j) | DotNS solo acepta 0 o 2 dígitos al final. Con la fecha en números falla `Name has 14 trailing digits; DotNS allows exactly 0 or 2 trailing digits` |
| `PAD_UPDATE_CHECK=0` | Variable que lee `pad` (`dist/chunk-L5FT4ZUZ.js`). Evita el aviso de actualización y la oferta de actualizarse tras un fallo |

Si falla: `errores-comunes.md`, *Publicación*. La organización autorizó las 10 cuentas del *pool*
con 1000 transacciones y 1000 MB cada una (unos 10 GB en total).

Bulletin borra el contenido a los ~14 días. Volver a publicar el bundle y el icono solo cuando haga
falta: para renovar el almacenamiento antes de los ~14 días o para una versión nueva. No es una
rutina.

### Login móvil de `pad` (BUG-007)

En Products Devnet, `pad login --env devnet` empareja con la Polkadot App, pero después:

- `Your wallet did not return the product account key within 25s`: no se obtiene la cuenta del
  Product, así que no se puede mostrar ni fondear.
- `Allowance pre-warm failed: Allocation request timed out after 60s` y
  `Bulletin storage slot: not allocated`: no hay espacio propio en Bulletin y `pad` usa el *pool*.

Cerrar sesión y repetir lo reproduce. La consulta `dotns pop status --signer qr` muestra la cuenta
del worker y no la del teléfono, así que no sirve para saber el estado PoP de tu cuenta. Mientras
siga así, usar el método de la sección 2. Observado por el equipo en octubre de 2026. En `pad`
0.22.1 el flujo de login es el mismo según su código; no se volvió a probar. Usar el método de la
sección 2.

Nunca pegar un mnemónico en el chat con la IA, en un archivo del proyecto ni en un commit.

Fuente de esta sección: corrida del 2026-10-23 con `pad` 0.22.1 en Windows (subida con el *pool* a
un nombre temporal, con `--no-manifest` y con config + `APP_DOT`).

## 3. Apuntar el nombre al CID

- Si el nombre es de la cuenta del teléfono (el caso del taller): abrir `dotns.dot` dentro del Host
  (Polkadot App o Desktop) → *Profile* → *My Domains* → la fila del nombre → **Resolve**, pegar el
  CID en "IPFS Hash or Gateway URL", *Save* y firmar en el teléfono.
- **Solo si la cuenta del keystore de `dotns` es dueña del nombre (no es el método del taller):**
  `dotns content set mi-app-hackaton.dot <CID> --env devnet`.
- **Solo el dueño** puede cambiar el `contenthash`. La delegación: **POR VERIFICAR**.

## 4. Nombre, descripción e icono (manifest)

La tarjeta que muestra el Host (icono, nombre, descripción) sale del registro de texto `manifest`
del nombre. Con la variante de la sección 2, `pad` lo escribe en el nombre temporal a partir de
`polkadot-app-deploy.config.mjs`, en la carpeta del proyecto, junto a `dist/`:

```js
// polkadot-app-deploy.config.mjs
export default {
  domain: process.env.APP_DOT,
  displayName: 'Mi App',
  description: 'Qué hace la app, en una línea.',
  // Solo png o jpeg, cuadrado (512×512).
  icon: { path: './assets/icono.png', format: 'png' },
  executables: [{ kind: 'app', path: './dist', appVersion: [1, 0, 0] }],
};
```

`domain` se deja como `process.env.APP_DOT`: cada subida usa un nombre temporal nuevo y `pad` exige
que sea igual al `<domain>` de la línea de comandos. La config va en el commit (no tiene secretos).

Comportamiento de `pad` 0.22.1 (corrida del 2026-10-23 y `pad --help`):

- Busca la config subiendo desde la carpeta del build (`<build-dir>` y sus carpetas de arriba), o
  con `--config <ruta>`. Lo confirma la línea `Loaded config: …`.
- Las rutas (`icon.path`, `executables[].path`) son relativas a la carpeta de la config. Si
  `executables` apunta a la misma carpeta del build, reutiliza su CID
  (`Executable [app] reused build-dir CID`).
- Mensajes de error de dominio y config (no se repitieron con `pad` 0.22.1: **POR VERIFICAR**):
  - sin `<domain>` en la línea de comandos: `Error: domain required (e.g. my-app.dot)`;
  - con un nombre a mano y `APP_DOT` sin definir:
    `Error: Invalid product config at …: product config domain must be a non-empty dotNS name ending in one of: .dot, .paseo`
    (exit 78), sin subir nada;
  - si `APP_DOT` y el `<domain>` no coinciden:
    `Config domain '…' (in …) does not match deploy domain '…'`, **después** de subir (bundle
    subido, manifest sin escribir). Pasar siempre `$env:APP_DOT` (`"$APP_DOT"`) como argumento.
- Con `--no-manifest` sube solo el bundle y no escribe el manifest. Con
  `polkadot-app-deploy.config.mjs` presente y `APP_DOT` sin definir terminó con exit 0 (corrida del
  2026-10-23).
- En el nombre temporal también registra `app.<nombre-temporal>.dot` y escribe en él el mismo
  `contenthash` y `text[executable]` en una sola transacción (línea
  `Atomically writing contenthash and executable manifest on app.<nombre-temporal>.dot`). Es
  inofensivo.

Reglas:

- **Icono como blob crudo con blake2b-256** (CID `bafk2bza…`). Es lo que hace `pad` (línea
  `Icon CID: bafk2bza…`). `dotns bulletin upload` guarda archivos como UnixFS (`bafybei…`); con un
  `icon.cid` `bafybei…` el Host muestra el icono en blanco.
- **Todo va en el dominio principal; no hace falta el subnombre `app.`.** El Host abre la app desde
  el `contenthash` del nombre propio.

**En el nombre del teléfono, a mano.** Desde `dotns.dot` → *Profile* → pestaña *My Domains* → la
fila del nombre:

1. **Resolve** → "Resolve to IPFS" → pegar el CID del bundle (`bafy…`) → *Save* → firmar en el
   teléfono. Es el `contenthash` (sección 3).
2. **Edit** → se abre *Edit Profile Records* → abajo, en *Custom Records*, **Add Record**: clave
   (`key`) `manifest`, valor (`value`) el JSON completo de la línea `Verified text[manifest]:` →
   *Save* → firmar en el teléfono.

Formato del valor (una línea, el que escribe `pad`):

```json
{"$v":1,"displayName":"Mi App","description":"Qué hace la app, en una línea.","icon":{"cid":"bafk2bza…","format":"png"}}
```

| Campo | Qué es |
|---|---|
| `$v` | Versión del formato: `1` |
| `displayName`, `description` | Los de la config |
| `icon.cid` | CID del icono, `bafk2bza…` |
| `icon.format` | `png` o `jpeg` |

Al volver a publicar sin cambiar icono, nombre ni descripción, el registro `manifest` se queda: el
mismo icono vuelve a subirse con el mismo CID. Solo se pega el CID nuevo con Resolve.

**Android: la tarjeta no se actualiza si la app ya estaba en marcadores.** La Polkadot App para
Android sigue mostrando el manifest anterior (o ninguno) de una app guardada en marcadores
(bookmarks). Solución: quitar el marcador, buscar la app otra vez y volver a agregarla. Confirmado
por el organizador y reportado a los desarrolladores de la Polkadot App.

Fuente: prueba del organizador con `polka-man.dot` en Polkadot Desktop y la Polkadot App para
Android (Resolve + registro `manifest` en el dominio principal, sin `app.`; conectar cuenta y firmar
funcionan) y corrida del 2026-10-23 con `pad` 0.22.1 en el nombre temporal
`tmpcacgbacdahcceb.dot` (manifest y `contenthash` leídos con `dotns` 1.0.0).

## 5. Mantenimiento

- **Bulletin borra el contenido a los ~14 días.** Volver a publicar el bundle y el icono solo
  cuando haga falta: para renovar el almacenamiento antes de los ~14 días o para una versión nueva.
  No es una rutina.
- Mostrar en la app un sello de versión (fecha del build) para saber qué carga el Host.
- La cuenta del Product depende del dominio: al cambiar de `mi-app.dot` a otro nombre las
  direcciones cambian. Lo que dependa de `msg.sender` (admins, dueños) se configura desde el dominio
  final.
