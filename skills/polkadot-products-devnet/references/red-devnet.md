# Red: Products Devnet

Products Devnet es el entorno de Polkadot Products que corre sobre las cadenas de sistema de la
testnet pública Paseo. En el SDK se llama `devnet`. **No es** el entorno `paseo` del SDK, que apunta
a Paseo Next v2 (`*-next-*.polkadot.io`), una red distinta.

Fuente: skill `product-sdk-chain-connection` de Parity, sección *Environment Support*
([commit 07fed91](https://github.com/paritytech/product-sdk/blob/07fed919bc067c7de4605ceb61fd72ed741d6d86/product-sdk/skills/product-sdk-chain-connection/SKILL.md)).

## Datos de la red

Comprobados el 2026-10-15 (ver `versiones.md`, sección *Cómo se probó*, paso 3).

| Dato | Valor |
|---|---|
| Cadena de contratos | Paseo Asset Hub, parachain **1000** (`system_chain` = `Paseo Asset Hub`) |
| Génesis de Asset Hub | `0xd6eec26135305a8ad257a20d003357284c8aa03d0bdb2b357ab0a22371e11ef2` |
| WebSocket (Substrate) | `wss://asset-hub-paseo-rpc.n.dwellir.com` |
| ETH-RPC (MetaMask, Remix, viem) | `https://eth-rpc-testnet.polkadot.io` |
| chainId EVM | **`420420417`** |
| Explorador | Blockscout: `https://blockscout-testnet.polkadot.io` |
| Bulletin (WebSocket) | `wss://bulletin-paseo.tservices.es:8443` (`system_chain` = `Bulletin Paseo`) |
| Token nativo | PAS, 10 decimales en la cadena; la capa EVM lo muestra con 18 |
| Faucet | `https://faucet.polkadot.io` → red **Paseo** → **Asset Hub (1000)** |

## MetaMask

Red agregada a mano (Remix no la trae en su lista):

| Campo | Valor |
|---|---|
| Nombre | Polkadot Hub TestNet |
| URL de RPC | `https://eth-rpc-testnet.polkadot.io` |
| ID de cadena | `420420417` |
| Símbolo | `PAS` |
| Explorador | `https://blockscout-testnet.polkadot.io` |

- La red **«Paseo PassetHub (420420422)»** que aparece en algunas listas ya no existe. No usarla.
- El faucet acepta direcciones `0x…` de MetaMask para Asset Hub (1000). Fuente: capítulo 3 del
  bootcamp (`contenido/03-smart-contracts.md`, sección 17, con captura).
- No elegir *Asset Hub Next (1500)* ni *People Next (1502)*: son de Paseo Next v2 y los fondos
  nunca aparecen en Products Devnet.

## SDK: cómo se conecta una app

- Descriptor de Asset Hub: `devnet_asset_hub`, importado desde
  `@parity/product-sdk-descriptors/devnet-asset-hub` (subruta, nunca el paquete raíz).
- Conexión: `createChainClient({ chains: { assetHub: devnet_asset_hub } })` desde
  `@parity/product-sdk/chain`. Es el patrón de la app de referencia del equipo.
- **No usar `getChainAPI()`** con Polkadot Desktop 0.1.3: su llamada de descubrimiento choca con otro
  método del Host (pruebas del equipo). El preset `getChainAPI('devnet')`
  existe en el SDK, pero no se ha probado en Desktop 0.1.3: **POR VERIFICAR**.
- El Host elige el RPC. El SDK **no tiene transporte propio**: fuera de un Host falla con
  `Host provider unavailable for chain 0xd6ee…` (comprobado en Node, ver `versiones.md`).
- Lecturas sin Host: ETH-RPC con viem (`readContract`) contra `https://eth-rpc-testnet.polkadot.io`.
  Responde con CORS abierto (comprobado en la app de referencia).

## PGAS (gas de las cuentas de Product)

| Dato | Valor |
|---|---|
| Asset id | `2000000000` |
| Decimales | 10 |
| Precompile ERC-20 | `0x7735940000000000000000000000000001200000` (formato `0x{assetId:8 hex}` + 24 ceros + `01200000`) |
| Cómo se obtiene | El Host lo asigna con el recurso `SmartContractAllowance` (ver `app-sdk.md`) |

Fuente: app de referencia del equipo. Comprobado el
2026-10-15 por ETH-RPC: el precompile responde a `totalSupply()`; `symbol()` y `decimals()` revierten
con `Metadata not found`, así que los decimales se fijan en el código (10).

## Saldos que no se mezclan

| Saldo | Para qué | De dónde sale |
|---|---|---|
| PAS en MetaMask | Desplegar contratos desde Remix | Faucet |
| PGAS de la cuenta del Product | Firmar llamadas a contratos desde la app | Host (`SmartContractAllowance`) |
| PAS de una cuenta con `.dot` | Depósito del nombre (10 PAS) y publicar | Faucet |
| CASH | Pagos dentro de la Polkadot App; no paga comisiones | Top-up de la app |

Fuente CASH vs PAS: [Money, PCF docs](https://docs.polkadotcommunity.foundation/architecture/money/).
