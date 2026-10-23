# Versiones probadas

Regla: usar **exactamente** estas versiones (sin `^` ni `~`). Una versión nueva solo entra después
de probarla dentro de los Hosts del devnet (Polkadot App y Polkadot Desktop).

Última prueba: **2026-10-23**, Windows, Node v22.18.0 (Node 22.19+ es el mínimo de pnpm 12), pnpm 12.6.0,
con la muestra del taller (Polka-Man).

## Tabla

| Pieza | Versión fija | Resultado (2026-10-23, salvo otra fecha) |
|---|---|---|
| Node.js | ≥ 22.19 (recomendado 24 LTS; `pad` 0.22.1 pide Node 22+) | mínimo de pnpm 12; no se probó una versión ≥ 22.19 en esta máquina |
| pnpm | 12.6.0 (`devEngines`) | ✅ instala y construye |
| `@parity/product-sdk` | 0.39.0 | ✅ `tsc`, `vite build` y 404 tests de la muestra |
| `polkadot-api` | 3.2.1 | ✅ una sola copia en `node_modules/.pnpm` |
| `@parity/truapi` | 0.25.0 (codec 3, overrides acotados) | ✅ una sola copia en `node_modules/.pnpm` |
| `@parity/product-sdk-descriptors` | alias `npm:@polkadot-community-foundation/product-sdk-descriptors@0.14.0-pcf.1` | ✅ `devnet_asset_hub` corresponde al runtime actual de Asset Hub del devnet |
| `viem` | 2.56.9 | ✅ `test:red` 9/9 (chainId 420420417, `Leaderboard` `0x0aAf…0Ac9`) |
| `typescript` / `vite` / `vitest` | 5.9.3 / 8.3.1 / 5.0.3 | ✅ |
| `solc` (solc-js) | 0.8.28, sin optimizador | ✅ prueba del equipo, 2026-10-15: compila `Leaderboard.sol` (5,686 B, igual al bytecode desplegado) |
| `@openzeppelin/contracts` | 5.6.1 | ✅ prueba del equipo, 2026-10-15: compila ERC-20 (3,554 B) y ERC-721 no transferible (8,510 B) |
| `pad` = `@polkadot-community-foundation/polkadot-app-deploy` | 0.22.1 | ✅ `--version` y `--help` desde la raíz del repo con la caché de `pnpm dlx` vacía; publicaciones de 3 min 49 s (`--no-manifest`) y 5 min 09 s (config) |
| `dotns` = `@polkadot-community-foundation/dotns-cli` | 1.0.0 | ✅ `lookup owner-of`, `text view` y `content view` |
| CLI `skills` (instalar skills) | 1.7.2 | ✅ prueba del equipo, 2026-10-15: `add <ruta> --list` y `add … -a kiro-cli/claude-code --copy`; declara Node ≥ 22.20.0 y con 22.18 solo avisa `EBADENGINE` |
| Polkadot App (Android) | `devnet/2026-10-22.1` | ✅ el organizador: conectar la cuenta, permiso de gas, guardar récord y username |
| Polkadot App (iOS, TestFlight) | versión de devnet más reciente | **POR VERIFICAR**: mismo protocolo, sin prueba propia |
| Polkadot Desktop | último release de devnet | **POR VERIFICAR**: mismo protocolo, sin prueba propia |
| dev-dot.li | — | ✅ carga la app y la app detecta el Host |

## Por qué estas versiones

- Los Hosts del devnet (iOS, Android, Desktop y dev-dot.li) hablan TrUAPI 0.25 (codec 3). La app y el
  Host deben hablar la misma versión: con otra, la app carga pero no conecta la cuenta.
- `@parity/product-sdk` 0.39.0 trae los sub-paquetes que usan `@parity/truapi` 0.25.0 y `polkadot-api` 3.
- Los descriptores del paquete de Polkadot Community Foundation (`0.14.0-pcf.1`) corresponden al runtime
  actual de Asset Hub del devnet. El import sigue siendo `@parity/product-sdk-descriptors/devnet-asset-hub`.
- Los overrides acotados (`padre@versión>hijo`) dejan una sola copia de truapi, polkadot-api y descriptores
  en el árbol de la app y no se aplican a las herramientas que se corren con `pnpm dlx` dentro del repo
  (por ejemplo `pad`). Los overrides globales (sin `>`) sí las alcanzan y rompen `pad`
  (`errores-comunes.md`).
- Si se sube cualquier versión del SDK hay que reescribir los selectores `padre@versión`: si no coinciden,
  dejan de aplicar sin avisar. `scripts/verificar-entorno.mjs` lo detecta (dos versiones de truapi o de
  polkadot-api en `node_modules/.pnpm`).

## Archivos del proyecto

`package.json` (extracto):

```json
{
  "devEngines": {
    "packageManager": { "name": "pnpm", "version": "12.6.0", "onFail": "download" }
  },
  "dependencies": {
    "@parity/product-sdk": "0.39.0",
    "@parity/product-sdk-descriptors": "npm:@polkadot-community-foundation/product-sdk-descriptors@0.14.0-pcf.1",
    "polkadot-api": "3.2.1",
    "viem": "2.56.9"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vite": "8.3.1",
    "vitest": "5.0.3"
  }
}
```

`pnpm-workspace.yaml` (proyecto suelto; en un workspace se agrega arriba `packages:` con la lista de paquetes):

```yaml
allowBuilds:
  esbuild: false
# Los descriptores del devnet son una publicación reciente: se excluyen de la espera mínima de pnpm.
minimumReleaseAgeExclude:
  - '@polkadot-community-foundation/product-sdk-descriptors@0.14.0-pcf.1'
# Los Hosts de Products Devnet (iOS, Android, Desktop y dev-dot.li) hablan TrUAPI 0.25 (codec 3).
# @parity/truapi y polkadot-api se fijan para que el árbol del juego use una sola versión de cada uno.
# Los descriptores del devnet salen del paquete de Polkadot Community Foundation.
# Cada override va acotado al paquete del SDK que trae la dependencia: así no se aplica a herramientas
# que se corren con `pnpm dlx` dentro del repo (por ejemplo pad), que usan sus propias versiones.
overrides:
  '@parity/product-sdk-host@0.28.0>@parity/truapi': 0.25.0
  '@parity/product-sdk-renderer@0.7.0>@parity/truapi': 0.25.0
  '@parity/product-sdk-chain-client@0.13.3>@parity/product-sdk-descriptors': npm:@polkadot-community-foundation/product-sdk-descriptors@0.14.0-pcf.1
  '@parity/product-sdk-cloud-storage@0.13.3>@parity/product-sdk-descriptors': npm:@polkadot-community-foundation/product-sdk-descriptors@0.14.0-pcf.1
  '@parity/product-sdk@0.39.0>polkadot-api': 3.2.1
  '@parity/product-sdk-chain-client@0.13.3>polkadot-api': 3.2.1
  '@parity/product-sdk-cloud-storage@0.13.3>polkadot-api': 3.2.1
  '@parity/product-sdk-contracts@0.11.3>polkadot-api': 3.2.1
  '@parity/product-sdk-host@0.28.0>polkadot-api': 3.2.1
  '@parity/product-sdk-individuality@0.11.0>polkadot-api': 3.2.1
  '@parity/product-sdk-keys@0.5.3>polkadot-api': 3.2.1
  '@parity/product-sdk-signer@0.17.3>polkadot-api': 3.2.1
  '@parity/product-sdk-tx@0.5.3>polkadot-api': 3.2.1
  '@polkadot-community-foundation/product-sdk-descriptors@0.14.0-pcf.1>polkadot-api': 3.2.1
```

Agregar una dependencia nueva: `pnpm add <paquete>@<versión> --save-exact`.

## Cómo se probó (2026-10-23)

1. `pnpm install` en la muestra del taller, con y sin lockfile: una sola versión de `@parity/truapi`
   (0.25.0), de `polkadot-api` (3.2.1) y de los descriptores (PCF 0.14.0-pcf.1) en `node_modules/.pnpm`.
2. `pnpm typecheck` ✅, `pnpm test` ✅ (37 archivos, 404 tests) y `pnpm build` ✅: `dist` de 2.08 MB
   y 37 archivos, con el plugin de Vite de `app-sdk.md` (*Vite*).
3. `pnpm test:red` ✅ 9/9: lectura real por ETH-RPC (`chainId` 420420417) del contrato `Leaderboard`
   `0x0aAf511a454c6A522b37210ca6931Cde1c400Ac9`.
4. `pad` 0.22.1 corrido con la función de `publicar.md` desde la raíz del repo, con la caché de
   `pnpm dlx` vacía: `--version` y `--help` ✅. Dos publicaciones con el *pool* a nombres temporales:
   `--no-manifest` en 3 min 49 s y con config + `APP_DOT` en 3 min 36 s hasta `CID:` y 5 min 09 s en
   total, las dos con exit 0 (`publicar.md`, sección 2).
5. `dotns` 1.0.0 de solo lectura: `lookup owner-of`, `text view` y `content view` ✅.
6. El organizador, en la Polkadot App para Android `devnet/2026-10-22.1`: conectar la cuenta, dar el
   permiso de gas, guardar un récord con una firma y cambiar el username ✅. La lista de permisos que
   pide el SDK al conectar sale de su código (`app-sdk.md`, *Permisos al conectar*).
