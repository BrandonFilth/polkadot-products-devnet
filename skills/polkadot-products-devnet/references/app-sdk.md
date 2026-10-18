# La app: Product SDK 0.27.0

Un Polkadot Product es una app web estática (Vite + TypeScript) que corre **dentro de un Host**
(Polkadot Desktop o la Polkadot App del teléfono). El Host conecta con la cadena, deriva la cuenta y
firma. La app no tiene backend.

Todo lo de este archivo sigue la app de referencia del equipo, probada con `@parity/product-sdk` 0.27.0. Las firmas de funciones pueden
cambiar en otras versiones del SDK.

## Dónde probar: `localhost` no basta

- **La Polkadot App no abre `localhost`.** Conectar la cuenta, firmar, pedir PGAS o guardar algo en
  el contrato solo se prueba con la app **publicada en su dominio `.dot`** y abierta desde el Host.
- `pnpm dev` en `localhost:5173` sirve para la parte visual y las lecturas por ETH-RPC (en el
  navegador o en Desktop), no para la conexión ni las firmas.
- Ciclo de trabajo: cambiar → `pnpm build` → publicar (`publicar.md`, sección 2: subir con el *pool*
  y pegar el CID en el `contenthash`) → abrir `tu-app.dot` → probar. Cada CID nuevo se pega otra vez.
- No decirle al usuario "pruébalo en localhost dentro de la Polkadot App": no funciona.

## Reglas del sandbox

- **Fuera de un Host la app no funciona.** Comprobarlo al inicio con `isInsideContainer()` y mostrar
  un mensaje ("Abre esta app dentro de Polkadot Desktop o de la Polkadot App").
- El Host API (TrUAPI) es la única salida: red, cadena, almacenamiento y firma pasan por él
  ([Sandbox, docs.polkadot.com](https://docs.polkadot.com/reference/apps/protocol/truapi/sandbox/)).
- La app recibe una **cuenta derivada por Product**, nunca la cuenta raíz del usuario. La misma
  persona tiene direcciones distintas en `localhost:5173` y en `mi-app.dot`.
- Las peticiones HTTP salientes se limitan a los dominios declarados en el manifest
  ([Permisos de Desktop](https://docs.polkadot.com/reference/apps/hosts/polkadot-desktop/permissions/)).
  El ETH-RPC público se leyó desde el Host en la app de referencia; el detalle de permisos para otros
  dominios queda **POR VERIFICAR**.
- **Una firma a la vez.** El Host atiende las solicitudes en orden; una segunda firma espera detrás
  de la primera. No lanzar firmas en segundo plano.
- `getProductContext()` no responde en Desktop 0.1.3: si se usa, ponerle timeout (3 s en el Event
  Tracker) y deducir el id del Product desde la URL.

## Vite

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: el bundle se sirve desde un CID de Bulletin, no desde la raíz de un dominio.
  base: './',
});
```

## Imports (SDK 0.27.0)

```ts
import { createChainClient } from '@parity/product-sdk/chain';
import { createContract, createContractRuntimeFromClient, type AbiEntry } from '@parity/product-sdk/contracts';
import { isInsideContainer, requestResourceAllocation } from '@parity/product-sdk/host';
import { SignerManager } from '@parity/product-sdk/wallet';
import { devnet_asset_hub } from '@parity/product-sdk-descriptors/devnet-asset-hub';
```

Comprobado el 2026-10-15: estos imports y el flujo de abajo pasan `tsc --noEmit` (y los imports,
`vite build`) con las versiones de `versiones.md`. El flujo no se ejecutó dentro de un Host en esa
fecha: **POR VERIFICAR** en Desktop 0.1.3 y en el teléfono.

## Flujo completo

```ts
const CONTRACT = '0x…';           // dirección que dio Remix
const DERIVATION_INDEX = 0;       // índice de la cuenta del Product

// 1. ¿Estamos dentro de un Host?
if (!(await isInsideContainer())) throw new Error('Abre esta app dentro de un Host de Polkadot.');

// 2. Cadena y runtime de contratos (no usar getChainAPI() con Desktop 0.1.3).
const client = await createChainClient({ chains: { assetHub: devnet_asset_hub } });
const runtime = createContractRuntimeFromClient(client.raw.assetHub, devnet_asset_hub, { at: 'best' });

// 3. Sesión de firma y cuenta del Product.
const manager = new SignerManager({ dappName: 'mi-app.dot', ss58Prefix: 42, hostTimeout: 30_000, maxRetries: 1, persistence: null });
const connected = await manager.connect();
if (!connected.ok) throw connected.error;
const account = await manager.getProductAccount('mi-app.dot', DERIVATION_INDEX);
if (!account.ok) throw account.error;
const me = account.value;          // me.address (SS58), me.h160Address (0x…), me.getSigner()

// 4. Contrato con origen y firmante por defecto.
const contract = createContract(runtime, CONTRACT, abi as AbiEntry[], {
  defaultOrigin: me.address,
  defaultSigner: me.getSigner(),
});

// 5. Gas (PGAS) para la cuenta del Product. Respuestas: 'Allocated' | 'Rejected' | 'NotAvailable'.
const gas = await requestResourceAllocation([
  { tag: 'SmartContractAllowance', value: { tag: 'Index', value: DERIVATION_INDEX } },
]);
```

En la app de referencia `dappName` y el id del Product salen del dominio (`productId`), que se deduce de
la URL (`localhost:5173`, `mi-app.dot`, `mi-app.dot.li` → `mi-app.dot`).

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
  waitFor: 'best',
  timeoutMs: 300_000,               // el usuario aprueba en el teléfono: darle tiempo
  onStatus: (status) => console.log(status),
});
if (!sent.ok) return mostrarError(sent.error);
```

- `.tx()` devuelve `{ ok, error }`.
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

Comprobado desde Node el 2026-10-15 contra el `Leaderboard` del devnet (ver `versiones.md`).

## Errores de firma frecuentes

| Texto del error | Significado | Qué hacer |
|---|---|---|
| `Invalid.Payment` y PGAS bajo | Sin gas | Pedir `SmartContractAllowance` y reintentar una vez |
| `Invalid.Payment` con PGAS suficiente | El Host armó mal la comisión | Reconectar (nueva cadena + `SignerManager`) y reintentar |
| `Invalid.Stale` / `Future` / `nonce` | La sesión de firma se desfasó | Reconectar y reintentar |
| `reject` / `cancel` / `denied` | El usuario no aprobó | Ofrecer reintentar |
| `timeout` | El teléfono no respondió a tiempo (la tx pudo entrar) | Leer el estado antes de reintentar |
| `Host provider` / `disconnect` | Se cayó la conexión con el Host | Reconectar |

Clasificación tomada de la app de referencia. Más casos en `errores-comunes.md`.
