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

Repositorio `paritytech/product-sdk`, carpeta `product-sdk/skills`. Dos fijaciones:

| URL | Fijación | Qué cubre |
|---|---|---|
| https://github.com/paritytech/product-sdk/tree/07fed919bc067c7de4605ceb61fd72ed741d6d86/product-sdk/skills | commit `07fed91` = tag `@parity/product-sdk@0.27.0` (2026-09-03) | **Usar esta.** Corresponde a la versión fija del SDK |
| https://github.com/paritytech/product-sdk/tree/44a6c0a8578fae3af84263ea83f76b643a8768b7/product-sdk/skills | commit `44a6c0a` (2026-10-13), último cambio de la carpeta al 2026-10-15 | Solo referencia: documenta el SDK nuevo (≥ 0.36, `polkadot-api` 3) |

Para leerlas, usar estos archivos directos (texto plano, commit `07fed91`), no la vista de carpeta:

| Skill | URL |
|---|---|
| `product-sdk-chain-connection` | https://raw.githubusercontent.com/paritytech/product-sdk/07fed919bc067c7de4605ceb61fd72ed741d6d86/product-sdk/skills/product-sdk-chain-connection/SKILL.md |
| `product-sdk-contracts` | https://raw.githubusercontent.com/paritytech/product-sdk/07fed919bc067c7de4605ceb61fd72ed741d6d86/product-sdk/skills/product-sdk-contracts/SKILL.md |
| `product-sdk-transactions` | https://raw.githubusercontent.com/paritytech/product-sdk/07fed919bc067c7de4605ceb61fd72ed741d6d86/product-sdk/skills/product-sdk-transactions/SKILL.md |

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
respondió 403 a peticiones automáticas el 2026-10-15; usar el registro:

| URL | Fijación | Qué cubre |
|---|---|---|
| https://registry.npmjs.org/@parity/product-sdk/0.27.0 | versión 0.27.0 | Metadatos y dependencias del SDK |
| https://registry.npmjs.org/@parity/product-sdk-descriptors/0.11.0 | versión 0.11.0 | Descriptores (`devnet-asset-hub`) |
| https://registry.npmjs.org/@parity/truapi/0.13.1 | versión 0.13.1 | Protocolo con el Host |
| https://registry.npmjs.org/@polkadot-community-foundation/polkadot-app-deploy/0.16.7 | versión 0.16.7 | `pad` (`--help`, `--no-manifest`, variable `PAD_UPDATE_CHECK` en su código) |
| https://registry.npmjs.org/@polkadot-community-foundation/dotns-cli/0.9.5 | versión 0.9.5 | `dotns` |

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

Contrato de prueba en el devnet: `Leaderboard` en `0xa2625aa8e8790a3322acd045b32f67fba1808542`
(Blockscout: https://blockscout-testnet.polkadot.io/address/0xa2625aa8e8790a3322acd045b32f67fba1808542).
