# Publicar: Bulletin + nombre `.dot`

Publicar es: construir `dist/`, subirlo a **Bulletin**, obtener su **CID** y ponerlo como
`contenthash` de un nombre `.dot`. El Host abre la app desde ese nombre.

Herramientas (versiones fijas, siempre con `pnpm dlx --ignore-scripts`):

| Atajo | Paquete npm | Versión |
|---|---|---|
| `pad` | `@polkadot-community-foundation/polkadot-app-deploy` | 0.16.7 |
| `dotns` | `@polkadot-community-foundation/dotns-cli` | 0.9.5 |

Atajos para una sesión de PowerShell:

```powershell
function pad { $env:PAD_UPDATE_CHECK = '0'; pnpm dlx --ignore-scripts @polkadot-community-foundation/polkadot-app-deploy@0.16.7 @args }
function dotns { pnpm dlx --ignore-scripts @polkadot-community-foundation/dotns-cli@0.9.5 @args }
$env:PAD_ENV   = "devnet"
$env:DOTNS_ENV = "devnet"
```

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
- ¿Está libre? `dotns lookup owner-of <etiqueta> --env devnet`.
- Registrar: `dotns register domain --name <etiqueta> --env devnet`.
- Para el taller, el nombre se compra en la Polkadot App desde `dotns.dot` (sección 2).
  `dotns register` necesita una cuenta en el keystore de `dotns` y no es el método del taller.

Fuentes: [Register a .dot domain](https://docs.polkadot.com/apps/register-dot-domain/),
[PoP rules and pricing](https://docs.polkadot.com/reference/apps/infrastructure/dotns/poprules-pricing/).
El registro con `dotns register domain` no se repitió el 2026-10-15: **POR VERIFICAR**.

## 2. Probar y publicar: el método del taller

Es el mismo método para probar durante el desarrollo y para la publicación final. Ningún Host se
conecta a `localhost` (ver `app-sdk.md`, *Dónde probar*): todo lo que pase por el Host se prueba con
la app publicada en su `.dot`.

1. **Una sola vez:** comprar el nombre en la Polkadot App desde `dotns.dot` (9 caracteres o más). El
   nombre es de la cuenta del teléfono.
2. Desde la carpeta del proyecto, después de `pnpm build`:

   ```powershell
   function pad { $env:PAD_UPDATE_CHECK = '0'; pnpm dlx --ignore-scripts @polkadot-community-foundation/polkadot-app-deploy@0.16.7 @args }
   $tmp = 'tmp' + (-join ((Get-Date -Format 'yyyyMMddHHmmss').ToCharArray() | ForEach-Object { [char](97 + [int]"$_") })) + '.dot'
   pad .\dist $tmp --env devnet --js-merkle --no-manifest
   ```

   En macOS/Linux:

   ```bash
   pad() { PAD_UPDATE_CHECK=0 pnpm dlx --ignore-scripts @polkadot-community-foundation/polkadot-app-deploy@0.16.7 "$@"; }
   tmp="tmp$(date +%Y%m%d%H%M%S | tr '0-9' 'a-j').dot"
   pad ./dist "$tmp" --env devnet --js-merkle --no-manifest
   ```

   `.\dist` es la carpeta del build; en un workspace puede ser otra (por ejemplo `.\game\dist` desde
   la raíz): revisar la configuración de Vite. Sin carpeta temporal, sin cerrar sesión, sin
   mnemónico y sin keystore.
3. Copiar el CID de la última línea (`CID: bafy…`).
4. Pegarlo en el `contenthash` del nombre propio desde `dotns.dot` (sección 3). Es la única firma y
   se hace en el teléfono. El manifest (icono, descripción) es opcional: sección 4.
5. Abrir el nombre desde el Host y probar. Cada build da un CID nuevo, que se vuelve a pegar.

- Éxito = `Storage signer: pool fallback (no session)`, `Using pool account N`, `Verified on-chain`,
  `DEPLOYMENT COMPLETE!` y la última línea `CID: bafy…` (el *Root CID*). Las líneas `bafkrei…` son
  los trozos, no el CID de la app. Tarda unos 3.5 min para un bundle chico (3 min 28 s, medido dos
  veces).
- Comprobación sin el Host: `https://<nombre-temporal>.dev-dot.li`.

Por qué cada parte:

| Parte | Motivo |
|---|---|
| `--env devnet` | El valor por defecto de `pad` es `paseo-next-v2`, otra red |
| `--js-merkle` | No necesita el binario de IPFS Kubo |
| `--no-manifest` | `pad` ignora por completo cualquier `polkadot-app-deploy.config.ts`, igual que sin config. El dominio usado es siempre el de la línea de comandos (probado desde una carpeta con un config que apunta a otro dominio: usó el temporal) |
| Nombre temporal | `pad` 0.16.7 no tiene modo de solo subir: siempre registra o actualiza el nombre que recibe. Sin sesión firma DotNS con su worker de desarrollo (`5DfhGy…` / `0x35cd…`, ~2,015,606 PAS; paga ~11 PAS por nombre nuevo) y sube con una cuenta del *pool*. El nombre queda a nombre del worker y no se reutiliza |
| Dígitos a letras (0→a … 9→j) | DotNS solo acepta 0 o 2 dígitos al final. Con la fecha en números falla `Name has 14 trailing digits; DotNS allows exactly 0 or 2 trailing digits` |
| `PAD_UPDATE_CHECK=0` | Variable que lee el código de `pad` 0.16.7. Evita que, tras un fallo, ofrezca `Update and retry? [Y/n]`, que intentaría `npm install -g @parity/polkadot-app-deploy@latest` |

Si falla: `errores-comunes.md`, *Publicación*. La organización autorizó las 10 cuentas del *pool*
con 1000 transacciones y 1000 MB cada una (unos 10 GB en total).

Bulletin borra el contenido a los ~14 días: volver a publicar antes de demos o evaluación.

### Login móvil de `pad` (BUG-007)

En Products Devnet, `pad login --env devnet` empareja con la Polkadot App, pero después:

- `Your wallet did not return the product account key within 25s`: no se obtiene la cuenta del
  Product, así que no se puede mostrar ni fondear.
- `Allowance pre-warm failed: Allocation request timed out after 60s` y
  `Bulletin storage slot: not allocated`: no hay espacio propio en Bulletin y `pad` usa el *pool*.

Cerrar sesión y repetir lo reproduce. La consulta `dotns pop status --signer qr` muestra la cuenta
del worker y no la del teléfono, así que no sirve para saber el estado PoP de tu cuenta. Mientras
siga así, usar el método de la sección 2. Observado por el equipo con `pad` 0.16.7 en octubre de
2026.

Nunca pegar un mnemónico en el chat con la IA, en un archivo del proyecto ni en un commit.

Fuente de esta sección: pruebas del equipo el 2026-10-18 con `pad` 0.16.7 en Windows (subida con el
*pool* a un nombre temporal y `--no-manifest`).

## 3. Apuntar el nombre al CID

- Si el nombre es de la cuenta del teléfono (el caso del taller): abrir `dotns.dot` dentro del Host
  (Polkadot App o Desktop) → *Profile* → el nombre → **Edit**, pegar el CID en `contenthash` y
  firmar en el teléfono.
- Fuera del método del taller, si la cuenta del keystore de `dotns` es **dueña** del nombre:
  `dotns content set mi-app-hackaton.dot <CID> --env devnet`.
- Con `dotns` 0.9.5 y `pad` 0.16.7 **solo el dueño** puede cambiar el `contenthash`; la delegación
  no se respeta.

## 4. Nombre, descripción e icono (manifest)

La tarjeta que muestra la Polkadot App sale del registro de texto `manifest` del nombre. `pad` lo
escribe cuando encuentra un `polkadot-app-deploy.config.ts` (lo busca subiendo desde la carpeta del
build, o con `--config <ruta>`):

```ts
// polkadot-app-deploy.config.ts
export default {
  domain: 'mi-app-hackaton.dot',
  displayName: 'Mi App',
  description: 'Qué hace la app, en una línea.',
  // Solo png o jpeg, cuadrado (512×512).
  icon: { path: './assets/icono.png', format: 'png' },
  executables: [{ kind: 'app', path: './dist', appVersion: [1, 0, 0] }],
};
```

Reglas:

- **Icono como blob crudo con blake2b-256** (CID `bafk2bza…`). Es lo que hace `pad`.
  `dotns bulletin upload` guarda archivos como UnixFS (`bafybei…`); el CID crudo que se deduce de ahí
  nunca se puede recuperar y el Host muestra el icono en blanco.
- **Con `manifest`, Desktop abre la app desde `app.<nombre>.dot`**, que necesita su propio
  `contenthash` y un registro de texto `executable`. Sin ese subnombre la tarjeta aparece pero la app
  no abre. Con el config de arriba, `pad` escribe los registros en el nombre y sus subnombres `app`,
  `widget`, `funding` y `worker` (`pad --help`, opción `--config`).
- Con `--no-manifest`, `pad` ignora el config por completo.

**A mano, con el nombre del teléfono.** Con el método de la sección 2 `pad` no escribe el manifest en
tu nombre. Se agrega desde `dotns.dot` → *Profile* → el nombre → **Edit** → *Edit Profile Records* →
*Custom Records* → **Add Record**, con la clave y el valor de cada registro, y se firma en el
teléfono. Así lo hizo el equipo con la app de referencia. El formato exacto de las claves y valores
del manifest y si hace falta el subnombre `app.` en este modo: **POR VERIFICAR** (copiar los que
escribe `pad` en un nombre de prueba con `polkadot-app-deploy.config.ts`).

Fuente: pruebas del equipo con la app de referencia. El flujo completo con
`manifest` + subnombre `app.` no se repitió el 2026-10-15: **POR VERIFICAR**.

## 5. Mantenimiento

- **Bulletin borra el contenido a los ~14 días.** Volver a publicar el bundle y el icono antes de
  cada demo o evaluación.
- Mostrar en la app un sello de versión (fecha del build) para saber qué carga el Host.
- La cuenta del Product depende del dominio: al cambiar de `mi-app.dot` a otro nombre las
  direcciones cambian. Lo que dependa de `msg.sender` (admins, dueños) se configura desde el dominio
  final.
