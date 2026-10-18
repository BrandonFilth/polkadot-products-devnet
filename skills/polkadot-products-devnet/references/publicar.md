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
function pad   { pnpm dlx --ignore-scripts @polkadot-community-foundation/polkadot-app-deploy@0.16.7 @args }
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

Fuentes: [Register a .dot domain](https://docs.polkadot.com/apps/register-dot-domain/),
[PoP rules and pricing](https://docs.polkadot.com/reference/apps/infrastructure/dotns/poprules-pricing/).
El registro con `dotns register domain` no se repitió el 2026-10-15: **POR VERIFICAR**.

## 2. Subir el bundle

**Flujo recomendado en Products Devnet** (el nombre es de la cuenta del teléfono):

1. Comprar el nombre en la Polkadot App (`dotns.dot`).
2. Subir el bundle con el *pool* a un **nombre desechable** y copiar el CID.
3. Pegar el CID en el `contenthash` del nombre comprado desde `dotns.dot` (sección 3) y firmar solo
   esa actualización en el teléfono.
4. Abrir el nombre desde el Host y comprobar que carga.

No usar `pad login` para este flujo: ver *Login móvil de `pad` (BUG-007)* abajo.

```powershell
pnpm build
pad logout
# Nombre desechable abierto: DotNS permite cero o exactamente dos dígitos finales.
$tmp = "tmp-image-stress04.dot"
pad .\dist $tmp --env devnet --js-merkle --no-manifest
```

En macOS/Linux: `tmp="tmp-image-stress04.dot"` y `pad ./dist "$tmp" --env devnet --js-merkle --no-manifest`.

- Éxito = `Verified on-chain` y un CID. Copiar el CID; es lo único que se usa.
- `pad` no tiene un modo de "solo subir": siempre registra o actualiza el nombre que recibe
  (`pad --help` 0.16.7). Por eso el nombre desechable: queda a nombre de una cuenta compartida del
  *pool* y los nombres de DotNS no expiran.
- **No pasar a `pad` un nombre que ya tiene dueño** (por ejemplo, el que compraste en el teléfono).
  `pad` intenta escribir su `contenthash` con el worker y falla por diferencia de propietario. El
  CID se pega a mano en el nombre propio (sección 3).
- **Correr `pad` fuera de la carpeta del proyecto o con `--no-manifest`.** `pad` busca un
  `polkadot-app-deploy.config.ts` subiendo desde la carpeta del build; si lo encuentra, usa su
  `domain` y escribe el manifest ahí.
- `--no-manifest` evita que `pad` escriba icono y descripción en el nombre desechable; el manifest se
  agrega a mano en el nombre real (sección 4).
- Probado el 2026-10-18 con `pad` 0.16.7 en Windows: un bundle de 2 archivos (21 KB) se subió con la
  cuenta 0 del *pool* en 3 min 28 s; un intento anterior cayó en la cuenta 3, sin autorización.
  Cuántas subidas seguidas aguanta el *pool* (por ejemplo, un grupo de 40 personas):
  **POR VERIFICAR**.

### Login móvil de `pad` (BUG-007)

En Products Devnet, `pad login --env devnet` empareja con la Polkadot App, pero después:

- `Your wallet did not return the product account key within 25s`: no se obtiene la cuenta del
  Product, así que no se puede mostrar ni fondear.
- `Allowance pre-warm failed: Allocation request timed out after 60s` y
  `Bulletin storage slot: not allocated`: no hay espacio propio en Bulletin y `pad` usa el *pool*.

Cerrar sesión y repetir lo reproduce. La consulta `dotns pop status --signer qr` muestra la cuenta
del worker y no la del teléfono, así que no sirve para saber el estado PoP de tu cuenta. Mientras
siga así, usar el flujo recomendado de arriba. Observado por el equipo con `pad` 0.16.7 en octubre de
2026.
- Con mnemónico propio (cuenta de **testnet**), leído de la variable `MNEMONIC` para que no quede en
  el historial:

```powershell
$env:MNEMONIC = [Net.NetworkCredential]::new('', (Read-Host 'Mnemónico' -AsSecureString)).Password
pad .\dist mi-app-hackaton.dot --env devnet --js-merkle
Remove-Item Env:MNEMONIC
```

Nunca pegar un mnemónico en el chat con la IA, en un archivo del proyecto ni en un commit.

Fuente de esta sección: pruebas del equipo (subida con el *pool* probada el
2026-10-03 con `pnpm dlx`; con mnemónico propio, probada con npm el 2026-09-23). No se repitió el
2026-10-15: **POR VERIFICAR** con `pnpm dlx`.

## 3. Apuntar el nombre al CID

- Si la cuenta del keystore de `dotns` es **dueña** del nombre:
  `dotns content set mi-app-hackaton.dot <CID> --env devnet`.
- Si el nombre es de la cuenta del teléfono (el caso normal): abrir `dotns.dot` dentro del Host
  (Polkadot App o Desktop) → *Profile* → el nombre → **Edit**, pegar el CID en `contenthash` y
  firmar en el teléfono.
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
- `--no-manifest` publica solo el contenido aunque exista el config.

**A mano, con el nombre del teléfono.** Con el flujo recomendado `pad` no escribe el manifest en tu
nombre. Se agrega desde `dotns.dot` → *Profile* → el nombre → **Edit** → *Edit Profile Records* →
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
- La cuenta del Product depende del dominio: al cambiar de `localhost:5173` a `mi-app.dot` las
  direcciones cambian. Lo que dependa de `msg.sender` (admins, dueños) se configura desde el dominio
  final.
