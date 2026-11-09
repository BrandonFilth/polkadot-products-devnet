# La app: Product SDK 0.39.0

Un Polkadot Product es una app web estática (Vite + TypeScript) que corre **dentro de un Host**
(Polkadot Desktop o la Polkadot App del teléfono). El Host conecta con la cadena, deriva la cuenta y
firma. La app no tiene backend.

Todo lo de este archivo sigue la app de referencia del equipo, probada con `@parity/product-sdk` 0.39.0 (polkadot-api 3.2.1,
`@parity/truapi` 0.25.0). Las firmas de funciones pueden cambiar en otras versiones del SDK.

## Dónde probar: solo en un dominio `.dot`

- **Ningún Host se conecta a `localhost`:** ni la Polkadot App del teléfono ni Polkadot Desktop.
  Conectar la cuenta, firmar, pedir PGAS o guardar algo en el contrato solo se prueba con la app
  **publicada en su dominio `.dot`** y abierta desde el Host. Comprobado por el equipo con los Hosts
  del devnet.
- `pnpm dev` (p. ej. `http://127.0.0.1:5173`) sirve solo en un navegador normal, para la parte
  visual, el juego y las lecturas por ETH-RPC. Ahí `isInsideContainer()` es `false` y la app debe
  mostrar que está fuera del Host.
- Ciclo de trabajo: cambiar → `pnpm build` → publicar (`publicar.md`, sección 2: *pool* + nombre
  temporal + pegar el CID en el `contenthash`) → abrir `tu-app.dot` en el Host → probar. Cada build
  nuevo da un CID nuevo que se vuelve a pegar. Es el mismo método de la publicación final.
- Nunca decirle al usuario "pruébalo en localhost dentro de Desktop o de la Polkadot App": no
  funciona.

## Reglas del sandbox

- **Fuera de un Host la app no funciona.** Comprobarlo al inicio con `isInsideContainer()` y mostrar
  un mensaje ("Abre esta app dentro de Polkadot Desktop o de la Polkadot App").
- El Host API (TrUAPI) es la única salida: red, cadena, almacenamiento y firma pasan por él
  ([Sandbox, docs.polkadot.com](https://docs.polkadot.com/reference/apps/protocol/truapi/sandbox/)).
- La app recibe una **cuenta derivada por Product**, nunca la cuenta raíz del usuario. La misma
  persona tiene direcciones distintas en `mi-app.dot` y en `otra-app.dot`.
- Las peticiones HTTP salientes se limitan a los dominios declarados en el manifest
  ([Permisos de Desktop](https://docs.polkadot.com/reference/apps/hosts/polkadot-desktop/permissions/)).
  El ETH-RPC público se leyó desde el Host en la app de referencia; el detalle de permisos para otros
  dominios queda **POR VERIFICAR**.
- **Una firma a la vez.** El Host atiende las solicitudes en orden; una segunda firma espera detrás
  de la primera. No lanzar firmas en segundo plano.
- `getProductContext()` puede no responder: ponerle timeout (3 s en la app de referencia) y deducir el
  id del Product de la URL (`mi-app.dot`, `mi-app.dot.li`, `mi-app.app.dot.li`, `mi-app.dev-dot.li`,
  `mi-app.app.dev-dot.li` → `mi-app.dot`; `productIdFromHost` en `polkadot-app-hackaton/game/src/hub/hub.ts`).

## Permisos al conectar

Al conectar, el Host puede mostrar hasta tres solicitudes. El usuario acepta las tres:

- identidad y username (`getUserId`);
- enviar transacciones (`ChainSubmit`, lo pide `manager.connect()`);
- el permiso de gas (`SmartContractAllowance`, lo pide `requestResourceAllocation`).

Fuente: código de `@parity/product-sdk-signer` 0.17.3 (`manager.connect()` pide `getUserId` y
`ChainSubmit`) y de `@parity/product-sdk-host` 0.28.0 (`requestResourceAllocation`), leído el
2026-10-23. La prueba del organizador en la Polkadot App para Android, el mismo día, confirma que la
conexión, el gas y la firma funcionan; no registra qué pantallas mostró el Host.

## Vite

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: el bundle se sirve desde un CID de Bulletin, no desde la raíz de un dominio.
  base: './',
});
```

### Bundle sin metadatos de otras cadenas

`@parity/product-sdk-chain-client` importa de forma dinámica los metadatos de todas las cadenas (los
presets de `getChainAPI`). Suman unos 4-5 MB (previewnet, paseo, kusama, polkadot asset hub…)
aunque la app solo use devnet. La solución es un plugin de Vite, solo para el build, que cambia
cada subruta de `@parity/product-sdk-descriptors/*` por un módulo vacío, menos `devnet-asset-hub`:

```js
// vite.config.js
import { defineConfig } from 'vite';

const DESCRIPTORES = '@parity/product-sdk-descriptors/';
const STUB = '\0descriptor-sin-usar:';

// @parity/product-sdk-chain-client importa de forma dinámica los metadatos de todas las cadenas
// (presets de getChainAPI) aunque el juego solo usa devnet-asset-hub. En el build se cambian los
// demás descriptores por un módulo vacío para que no terminen en dist.
// Solo aplica en el build: si el juego llega a importar otra cadena, en pnpm dev y en los tests
// funciona, pero en dist queda vacía. Agrega su subruta a la condición de resolveId.
export function soloDescriptorDevnet() {
  return {
    name: 'solo-descriptor-devnet',
    apply: 'build',
    enforce: 'pre',
    resolveId(id) {
      if (!id.startsWith(DESCRIPTORES)) return null;
      const subruta = id.slice(DESCRIPTORES.length);
      return subruta === 'devnet-asset-hub' ? null : STUB + subruta;
    },
    load(id) {
      return id.startsWith(STUB) ? 'export {};' : null;
    },
  };
}

export default defineConfig({
  // Rutas relativas: el bundle se sirve desde un CID de Bulletin, no desde la raíz de un dominio.
  base: './',
  plugins: [soloDescriptorDevnet()],
});
```

- Con el alias de PCF el plugin sigue aplicando: el import es `@parity/product-sdk-descriptors/*`.
- Resultado en la muestra del taller: `dist` queda en 2.08 MB / 37 archivos; los otros 10 descriptores
  quedan como módulos vacíos. Tiempos de publicación en `publicar.md`, sección 2.
- Solo aplica en el build: si la app importa otra cadena, funciona en `pnpm dev` y en los tests,
  pero queda vacía en `dist`. Agregar su subruta a la condición de `resolveId`.

Fuente: muestra del taller (`polkadot-app-hackaton/game/vite.config.js`), 2026-10-23.

## Imports (SDK 0.39.0)

```ts
import { createChainClient } from '@parity/product-sdk/chain';
import { createContract, createContractRuntimeFromClient, type AbiEntry } from '@parity/product-sdk/contracts';
import { getAccountsProvider, isInsideContainer, requestResourceAllocation } from '@parity/product-sdk/host';
import { SignerManager } from '@parity/product-sdk/wallet';
import { devnet_asset_hub } from '@parity/product-sdk-descriptors/devnet-asset-hub';
```

Comprobado el 2026-10-23: `tsc`, `vite build` y la app dentro de la Polkadot App para Android
(conectar, gas, firmar, username), con las versiones de `versiones.md`. El flujo está en
`polkadot-app-hackaton/game/src/hub/hub.ts`.

## Flujo completo

```ts
const CONTRACT = '0x…';           // dirección que dio Remix
const DERIVATION_INDEX = 0;       // índice de la cuenta del Product
const TX_EXT_VERSION = 1;         // pipeline con AsPgas: la comisión sale de PGAS (ver *Pipelines*)

// 1. ¿Estamos dentro de un Host?
if (!(await isInsideContainer())) throw new Error('Abre esta app dentro de un Host de Polkadot.');

// 2. Cadena y runtime de contratos (no usar getChainAPI()).
const client = await createChainClient({ chains: { assetHub: devnet_asset_hub } });
const runtime = createContractRuntimeFromClient(client.raw.assetHub, devnet_asset_hub, { at: 'best' });

// 3. Sesión de firma y cuenta del Product.
const manager = new SignerManager({ dappName: 'mi-app.dot', ss58Prefix: 42, hostTimeout: 30_000, maxRetries: 1, persistence: null });
const connected = await manager.connect();
if (!connected.ok) throw connected.error;
const account = await manager.getProductAccount('mi-app.dot', DERIVATION_INDEX);
if (!account.ok) throw account.error;
const me = account.value;          // me.address (SS58), me.h160Address (0x…), me.publicKey, me.getSigner()

// 4. Firmante en el pipeline 1. me.getSigner() firma en el 0 (comisión en PAS): no usarlo para Asset Hub.
const provider = await getAccountsProvider();
if (!provider) throw new Error('El Host no entregó el proveedor de cuentas.');
const signer = provider.getProductAccountSigner(
  { dotNsIdentifier: 'mi-app.dot', derivationIndex: DERIVATION_INDEX, publicKey: me.publicKey },
  { txExtVersion: TX_EXT_VERSION },
);

// 5. Contrato con origen y firmante por defecto.
const contract = createContract(runtime, CONTRACT, abi as AbiEntry[], {
  defaultOrigin: me.address,
  defaultSigner: signer,
});

// 6. Gas (PGAS) para la cuenta del Product.
const r = await requestResourceAllocation([
  { tag: 'SmartContractAllowance', value: { tag: 'Index', value: DERIVATION_INDEX } },
]);
const outcome = r.ok ? r.value[0] : undefined; // 'Allocated' | 'Rejected' | 'NotAvailable'
```

En la app de referencia `dappName` y el id del Product salen del dominio (`productId`), que se deduce de
la URL (`mi-app.dot`, `mi-app.dot.li`, `mi-app.dev-dot.li` → `mi-app.dot`). El mismo `productId` va en
`dotNsIdentifier` del firmante, con `.dot`.

## Pipelines de extensiones (`txExtVersion`)

Desde el runtime 2005005 de Asset Hub (bloque 15,367,035, 2026-11-05 18:04 UTC; hoy 2005006) la
metadata v16 declara dos pipelines (`extrinsic.extensionsByVersion`):

| Pipeline | Extensiones | Comisión | Firma |
|---|---|---|---|
| 0 | 13: las de sistema + `ChargeAssetTxPayment` | en **PAS** | extrínseca v4 (`0x84`) |
| 1 | 19: las del 0 + `VerifyMultiSignature`, `AsPgas`, `AsScarcity`, `AsDotnsGateway`, `RestrictOrigins`, `UnitTransactionExtension` | en **PGAS** (evento `PgasAllowance.PGASFeePaid`) | extrínseca v5 general (`0x45`, versión 1) |

Antes del upgrade había un solo pipeline con `AsPgas`. El SDK (`product-sdk-host` 0.28.0,
`product-sdk-signer` 0.17.3) firma en el 0 si nadie pide otro: `getProductAccountSigner(account,
{ txExtVersion = 0 })`, y `SignerAccount.getSigner()` lo llama sin opciones. Por eso las apps hechas
antes del 5 nov empezaron a fallar con `Invalid.Payment` en cuentas sin PAS
([paritytech/product-sdk#339](https://github.com/paritytech/product-sdk/issues/339)).

Reglas:

- **Asset Hub (contratos):** firmante de `getAccountsProvider().getProductAccountSigner(…, { txExtVersion: 1 })`,
  como en *Flujo completo*. `createContract` y `SignerManager` no exponen la opción.
- **Bulletin:** solo declara el pipeline 0. Seguir con `me.getSigner()`; con 1 falla con
  `chain declares no transaction-extension pipeline version 1`.
- **Si el Host no acepta el 1** (Desktop 0.1.4-rc.3 no se ha probado), rearmar el firmante con 0 y
  reintentar una vez: la comisión vuelve a salir de PAS.
- **Depósito de almacenamiento:** PGAS solo paga la comisión. El depósito de Revive por datos nuevos
  (p. ej. 0.00528 PAS por el primer username de Polka-Man) se cobró en PAS en la prueba de Lotería en
  Cadena (fondearon ~0.3 PAS). Sin PAS la simulación puede fallar con
  `Revive.StorageDepositNotEnoughFunds`. **POR VERIFICAR** con una cuenta sin PAS y el pipeline 1.

Comprobar que pagó con PGAS: en el bloque de la transacción, la extrínseca empieza (tras la longitud)
con `0x45 01` y aparece `PgasAllowance.PGASFeePaid`. Con el pipeline 0 aparecen
`TransactionPayment.TransactionFeePaid` y `Balances.Withdraw` (PAS).

Comprobado el 2026-11-08 y 2026-11-09: Lotería en Cadena en iPhone (bloque 15,498,137,
`PGASFeePaid` 0.0064 PGAS) y Polka-Man en Android con el mismo cambio.

### Actualizar una app hecha antes del 5 nov 2026

1. Constante `TX_EXT_VERSION = 1` junto a `DERIVATION_INDEX`.
2. Cambiar `defaultSigner: me.getSigner()` por el firmante de `getAccountsProvider()` (arriba). Las
   subidas a Bulletin se quedan con `me.getSigner()`.
3. El mensaje de `Invalid.Payment` con PGAS: dejar de decir "actualiza la Polkadot App"; ahora
   significa que se firmó en el pipeline 0 o que falta PAS.
4. Probar en un Host actualizado (`versiones.md`) y revisar el bloque como se describe arriba.

Ejemplos: `polkadot-app-hackaton/game/src/hub/hub.ts` (`writer()`, con el reintento en 0) y
Lotería en Cadena, commit `184b13d`, `src/chain/wallet.js`.

## Leer: `.query()`

```ts
const r = await contract.getScores.query(0n, 10n);
if (r.success) {
  const [addrs, usernames, scores] = r.value as [string[], string[], bigint[]];
} else {
  // revert: r.value trae el error del contrato
}
```

- `.query()` devuelve `{ success, value }`. Un revert es una respuesta (`success: false`), no una
  excepción.
- Funciones que leen `msg.sender` (p. ej. `myProfile()`) necesitan el origen:
  `contract.myProfile.query({ origin: me.address })`.

## Escribir: primero `.query()`, después `.tx()`

```ts
// Simular: no cuesta nada y devuelve el motivo del revert sin pedir firma.
const preview = await contract.submitScore.query(1240n, { origin: me.address });
if (!preview.success) return mostrarError(preview.value);

// Firmar y enviar.
const sent = await contract.submitScore.tx(1240n, {
  waitFor: 'finalized',
  timeoutMs: 300_000,               // el usuario aprueba en el teléfono: darle tiempo
  onStatus: (status) => console.log(status),
});
if (!sent.ok) return mostrarError(sent.error);
```

- `.tx()` devuelve `{ ok, error }`.
- `waitFor`: `'best-block'` resuelve al entrar en bloque y `'finalized'` al finalizar; no hay otro valor.
  `onStatus` recibe `signing`, `broadcasting`, `in-block`, `finalized` y `error`.
- Siempre simular antes de firmar. Nunca dos `.tx()` en paralelo.

## Lecturas rápidas por ETH-RPC (opcional)

En iOS la conexión del Host puede tardar. La app de referencia lee primero por ETH-RPC con viem y usa el
Host como respaldo; las firmas siempre van por el Host.

```ts
import { createPublicClient, http } from 'viem';

const rpc = createPublicClient({ transport: http('https://eth-rpc-testnet.polkadot.io', { timeout: 8_000 }) });
// En TypeScript la misma ABI se pasa a viem como `abi as unknown as Abi` (import type { Abi } from 'viem').
const count = await rpc.readContract({ address: CONTRACT, abi, functionName: 'playerCount' });
// Para funciones con msg.sender: readContract({ …, account: me.h160Address })
```

Comprobado desde Node el 2026-10-23 con `test:red` de la muestra contra el `Leaderboard` del devnet
(ver `versiones.md`).

## Errores de firma frecuentes

| Texto del error | Significado | Qué hacer |
|---|---|---|
| `Invalid.Payment` y PGAS bajo | Sin gas | Pedir `SmartContractAllowance` y reintentar una vez |
| `Invalid.Payment` con PGAS suficiente | Se firmó en el pipeline 0: la comisión se cobra en PAS y la cuenta no tiene | Firmar con `txExtVersion: 1` (*Pipelines*); mientras tanto, mandar unos 0.05 PAS a la cuenta |
| `Revive.StorageDepositNotEnoughFunds` | El depósito de almacenamiento por datos nuevos no alcanza (probablemente se paga en PAS) | Mandar un poco de PAS a la cuenta (*Pipelines*) |
| `chain declares no transaction-extension pipeline version 1` | Se pidió el pipeline 1 en una cadena que no lo tiene (Bulletin) | Usar `me.getSigner()` en esa cadena |
| `Invalid.Stale` / `Future` / `nonce` | La sesión de firma se desfasó | Reconectar y reintentar |
| `reject` / `cancel` / `denied` | El usuario no aprobó | Ofrecer reintentar |
| `timeout` | El teléfono no respondió a tiempo (la tx pudo entrar) | Leer el estado antes de reintentar |
| `Host provider` / `disconnect` | Se cayó la conexión con el Host | Reconectar |

Clasificación tomada de la app de referencia. Más casos en `errores-comunes.md`.
