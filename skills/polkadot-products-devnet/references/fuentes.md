# Registro de fuentes

Estas son las fuentes externas curadas de la skill. Orden de búsqueda:

1. Los archivos de `references/` de esta skill.
2. Las URLs de este registro, leídas con la herramienta web del agente.
3. Si hace falta otra página de docs.polkadot.com, buscarla en su índice
   `https://docs.polkadot.com/llms.txt` y citarla como **"fuera del registro curado"**.
4. Si no está en ninguna: responder "no verificado" y decir qué habría que probar. No inventar.

Si el agente no tiene herramienta para leer páginas web (o el usuario no la autoriza), decirlo y
responder solo con `references/`.

Al responder, citar siempre el archivo o la URL de donde sale el dato. Si una fuente externa
contradice a `references/`, gana `references/` para Products Devnet, y se menciona la diferencia.

Columnas: **Fijación** = commit, versión o fecha de consulta. Las URLs respondieron HTTP 200 el
2026-10-15 salvo donde se indica.

## Polkadot: documentación oficial

| URL | Fijación | Qué cubre |
|---|---|---|
| https://docs.polkadot.com/llms.txt | consultada 2026-10-15 | Índice de toda la documentación, pensado para agentes |
| https://docs.polkadot.com/reference/apps/skills/ | consultada 2026-10-15 | Referencia de las skills oficiales del Product SDK |
| https://docs.polkadot.com/apps/get-started/set-up-your-ai-agent/ | consultada 2026-10-15 | Instalación de las skills y *setup prompt* oficial (dice PolkaVM: **no aplica** aquí) |
| https://docs.polkadot.com/apps/concepts/accounts/ | consultada 2026-10-15 | Cuenta raíz, cuenta del Product, MetaMask |
| https://docs.polkadot.com/apps/build/sign-and-submit/ | consultada 2026-10-15 | Firma y envío desde un Product |
| https://docs.polkadot.com/smart-contracts/ | consultada 2026-10-15 | Contratos en Polkadot Hub |
| https://docs.polkadot.com/smart-contracts/for-eth-devs/accounts/ | consultada 2026-10-15 | Mapeo `0x…` ↔ SS58, `map_account`, decimales |
| https://docs.polkadot.com/reference/apps/protocol/truapi/sandbox/ | consultada 2026-10-15 | Reglas del sandbox (TrUAPI como única salida) |
| https://docs.polkadot.com/reference/apps/hosts/polkadot-desktop/ | consultada 2026-10-15 | Polkadot Desktop |
| https://docs.polkadot.com/reference/apps/hosts/polkadot-desktop/permissions/ | consultada 2026-10-15 | Permisos que declara un Product |
| https://docs.polkadot.com/apps/register-dot-domain/ | consultada 2026-10-15 | Registro de nombres `.dot` |
| https://docs.polkadot.com/reference/apps/infrastructure/dotns/poprules-pricing/ | consultada 2026-10-15 | Longitud del nombre, personhood, depósito |

## Polkadot Community Foundation

| URL | Fijación | Qué cubre |
|---|---|---|
| https://docs.polkadotcommunity.foundation/reference/networks/ | consultada 2026-10-15 | Redes y endpoints |
| https://docs.polkadotcommunity.foundation/architecture/money/ | consultada 2026-10-15 | CASH vs PAS |

## Skills de Parity (Apache-2.0)

Repositorio `paritytech/product-sdk`, carpeta `product-sdk/skills`. Una sola fijación:

| URL | Fijación | Qué cubre |
|---|---|---|
| https://github.com/paritytech/product-sdk/tree/941edee26951744174030b3351692cec2a754d53/product-sdk/skills | commit `941edee` | Corresponde al SDK en uso (`@parity/product-sdk` 0.39.0, `polkadot-api` 3) |

Para leerlas, usar estos archivos directos (texto plano, commit `941edee`), no la vista de carpeta
(los cuatro respondieron HTTP 200 el 2026-10-23):

| Skill | URL |
|---|---|
| `product-sdk-chain-connection` | https://raw.githubusercontent.com/paritytech/product-sdk/941edee26951744174030b3351692cec2a754d53/product-sdk/skills/product-sdk-chain-connection/SKILL.md |
| `product-sdk-contracts` | https://raw.githubusercontent.com/paritytech/product-sdk/941edee26951744174030b3351692cec2a754d53/product-sdk/skills/product-sdk-contracts/SKILL.md |
| `product-sdk-transactions` | https://raw.githubusercontent.com/paritytech/product-sdk/941edee26951744174030b3351692cec2a754d53/product-sdk/skills/product-sdk-transactions/SKILL.md |
| `product-sdk-transactions`, API del firmante | https://raw.githubusercontent.com/paritytech/product-sdk/941edee26951744174030b3351692cec2a754d53/product-sdk/skills/product-sdk-transactions/references/signer-api.md |

Antes de aplicar algo de ellas, revisar la sección *Qué ignorar de las skills de Parity* en
`SKILL.md`.

## Contratos

| URL | Fijación | Qué cubre |
|---|---|---|
| https://remix.ethereum.org | consultada 2026-10-15 | IDE para compilar y desplegar |
| https://blockscout-testnet.polkadot.io | consultada 2026-10-15 | Explorador de Products Devnet |
| https://faucet.polkadot.io | consultada 2026-10-15 | PAS de prueba (Paseo → Asset Hub 1000) |
| https://docs.openzeppelin.com/contracts/5.x | 5.x, consultada 2026-10-15 | Documentación de OpenZeppelin Contracts |
| https://github.com/OpenZeppelin/openzeppelin-contracts/tree/v5.6.1 | tag `v5.6.1` | Código fuente de la versión fija |
| https://www.soliditylang.org/blog/2026/02/18/solidity-0.8.34-release-announcement/ | publicado 2026-02-18 | Alcance real del bug que corrige 0.8.34 |

## Paquetes npm

Para consultar metadatos de una versión fija: `pnpm view <paquete>@<versión>`. La web de npmjs.com
respondió 403 a peticiones automáticas el 2026-10-15; usar el registro (los seis respondieron HTTP 200
el 2026-10-23):

| URL | Fijación | Qué cubre |
|---|---|---|
| https://registry.npmjs.org/@parity/product-sdk/0.39.0 | versión 0.39.0 | Metadatos y dependencias del SDK |
| https://registry.npmjs.org/polkadot-api/3.2.1 | versión 3.2.1 | `polkadot-api` |
| https://registry.npmjs.org/@parity/truapi/0.25.0 | versión 0.25.0 | Protocolo con el Host (codec 3) |
| https://registry.npmjs.org/@polkadot-community-foundation/product-sdk-descriptors/0.14.0-pcf.1 | versión 0.14.0-pcf.1 | Descriptores del devnet (`devnet-asset-hub`) |
| https://registry.npmjs.org/@polkadot-community-foundation/polkadot-app-deploy/0.22.1 | versión 0.22.1 | `pad` (`--help`, `--no-manifest`, variable `PAD_UPDATE_CHECK` en su código) |
| https://registry.npmjs.org/@polkadot-community-foundation/dotns-cli/1.0.0 | versión 1.0.0 | `dotns` |

## Hosts del devnet

Instalar la versión de devnet más reciente de cada uno. Los enlaces respondieron HTTP 200 el 2026-10-23.

| Host | URL | Notas |
|---|---|---|
| Polkadot App para iOS | https://testflight.apple.com/join/HnBX59vz | TestFlight |
| Polkadot App para Android | https://appdistribution.firebase.dev/i/f3b79521380b40b9 | Grupo de testers |
| Polkadot App para Android (APK) | https://github.com/Polkadot-Community-Foundation/polkadot-android-community/releases/tag/devnet/2026-10-22.1 | `app-polkadot-devnet.apk`; sin servicios de Google: `app-polkadot-devnet-nogms.apk` |
| Polkadot Desktop | https://github.com/Polkadot-Community-Foundation/polkadot-desktop-community/releases/latest | `polkadot-desktop-<versión>-x64.exe`, `-arm64.dmg`, `-x64.dmg`, `-x86_64.AppImage`. En macOS se llama **Polkadot Desktop Dev** y no está firmada: clic derecho → Abrir |

Fallas del devnet: https://github.com/Polkadot-Community-Foundation/products-devnet-issues

## Skills: formato e instalación

| URL | Fijación | Qué cubre |
|---|---|---|
| https://agentskills.io/specification | consultada 2026-10-15 | Formato de `SKILL.md` y frontmatter |
| https://github.com/vercel-labs/skills | CLI `skills` 1.7.2 | `npx skills add`, rutas por agente, `--copy`, `--list` |
| https://www.skills.sh | consultada 2026-10-15 | Directorio de skills y auditorías automáticas |

## Pruebas propias

Lo que no sale de una URL de este registro viene de pruebas del equipo de Polkadot México
(app de referencia y material del bootcamp, septiembre–octubre 2026) y ya está resumido en
`references/`, con fecha y marca **POR VERIFICAR** donde no se repitió.

Contrato de prueba en el devnet: `Leaderboard` en `0x0aAf511a454c6A522b37210ca6931Cde1c400Ac9`
(Blockscout: https://blockscout-testnet.polkadot.io/address/0x0aAf511a454c6A522b37210ca6931Cde1c400Ac9).
