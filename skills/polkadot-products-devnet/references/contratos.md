# Contratos: Solidity en REVM

En Products Devnet los contratos son **Solidity compilado a bytecode EVM** y se ejecutan en **REVM**
dentro de `pallet-revive` en Asset Hub (1000). Se despliegan con **Remix + MetaMask**. No hace falta
`resolc`, PolkaVM, `cdm`, Hardhat ni Foundry.

> Las skills y el *setup prompt* oficiales de Polkadot dicen que los contratos compilan a PolkaVM y que
> se evite el tooling de Ethereum. **Para este devnet, ignorar esa indicación.** Ver `SKILL.md`,
> sección *Qué ignorar de las skills de Parity*.

## Ajustes de compilación

| Ajuste | Valor |
|---|---|
| Pragma | `pragma solidity 0.8.28;` (fijo, sin `^`) |
| Compilador en Remix | 0.8.28 |
| Optimizador | apagado (valor por defecto de Remix) |
| Límite de tamaño | **24,576 bytes** de código desplegado (runtime) por contrato |

- Si una skill externa pide subir el pragma (p. ej. a 0.8.34 por un bug de `--via-ir` con `delete`
  sobre variables `transient`), no aplica mientras no se use `--via-ir` ni `transient`
  ([anuncio de Solidity 0.8.34](https://www.soliditylang.org/blog/2026/02/18/solidity-0.8.34-release-announcement/)).
- Si el contrato pasa de 24,576 bytes: dividirlo en dos contratos, quitar strings largos de los
  `require` (usar `error` personalizados) o activar el optimizador y volver a medir.

Tamaños medidos con solc 0.8.28 sin optimizador (2026-10-15):

| Contrato | Runtime |
|---|---|
| `Leaderboard` (marcador del juego) | 5,686 B |
| ERC-20 de OpenZeppelin 5.6.1 | 3,554 B |
| ERC-721 no transferible + `Ownable` (OZ 5.6.1, ejemplo de abajo) | 8,510 B |

## Desplegar con Remix + MetaMask

1. MetaMask con la red **Polkadot Hub TestNet** (chainId `420420417`, ver `red-devnet.md`).
2. PAS para la cuenta `0x…` de MetaMask desde el faucet (Paseo → Asset Hub 1000).
3. [remix.ethereum.org](https://remix.ethereum.org): crear el `.sol` y pegar el contrato.
4. *Solidity compiler*: versión **0.8.28**, sin optimizador. Compilar.
5. *Deploy & run transactions*: entorno **Injected Provider - MetaMask**. Confirmar que la red es
   `420420417`. **Deploy** y confirmar en MetaMask.
6. Guardar la **dirección** (*Deployed Contracts*) y la **ABI** (botón **ABI** en *Solidity compiler*).
7. Revisar en Blockscout: `https://blockscout-testnet.polkadot.io/address/<dirección>`.

En *Deployed Contracts*, los botones naranjas escriben (piden firma) y los azules solo leen.

## La ABI

La ABI es el JSON que describe las funciones, eventos y errores del contrato. La app la necesita para
armar cada llamada (`createContract(runtime, dirección, abi)` o viem `readContract({ abi, … })`).

- Guardarla como archivo, p. ej. `src/contract/miContrato.abi.json`, y no editarla a mano.
- Cada vez que cambia el contrato y se vuelve a desplegar: nueva dirección **y** nueva ABI.
- Con el SDK 0.39.0 la ABI se tipa como `AbiEntry[]` (un arreglo mutable). Un literal `as const` no
  compila (`readonly … cannot be assigned to the mutable type 'AbiEntry[]'`, comprobado con `tsc` el
  2026-10-23). La ABI importada como JSON y casteada `as AbiEntry[]` sí compila (mismo día):

```ts
import type { AbiEntry } from '@parity/product-sdk/contracts';
import abiJson from './miContrato.abi.json';

export const miContratoAbi = abiJson as AbiEntry[];
```

## OpenZeppelin 5.6.1

Para tokens y permisos, usar la librería en vez de escribir el código. Remix resuelve los `import`
de OpenZeppelin sin instalar nada.

**POR VERIFICAR** en Remix: fijar la versión escribiendo `@openzeppelin/contracts@5.6.1/...` en el
`import`, y qué versión toma Remix cuando el `import` no la lleva. La más reciente en npm el
2026-10-15 es 5.6.1.

ERC-20 (puntos, recompensas):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Puntos is ERC20 {
    constructor() ERC20("Puntos", "PTS") {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}
```

ERC-721 no transferible (constancias). En OZ 5 la transferencia se bloquea sobrescribiendo
`_update`; ya no existe `_beforeTokenTransfer` de OZ 4:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Constancia is ERC721, Ownable {
    error NoTransferible();

    uint256 private siguiente;

    constructor() ERC721("Constancia", "CNST") Ownable(msg.sender) {}

    function emitir(address to) external onlyOwner returns (uint256 id) {
        id = ++siguiente;
        _safeMint(to, id);
    }

    // Solo se permite acuñar (from == 0); cualquier transferencia revierte.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address from) {
        from = super._update(to, tokenId, auth);
        if (from != address(0)) revert NoTransferible();
    }
}
```

Los dos ejemplos compilan con solc 0.8.28 y OZ 5.6.1 (comprobado 2026-10-15). Un ERC-20 y un ERC-721
no transferible con OZ 5.6.1 se desplegaron y funcionaron en el devnet según el capítulo 3 del
bootcamp; el despliegue de estos dos archivos exactos queda **POR VERIFICAR**.

Diferencias de OZ 5 que confunden a las IAs entrenadas con OZ 4:

- `Ownable(msg.sender)` recibe el dueño en el constructor.
- Los errores son personalizados: `OwnableUnauthorizedAccount(address)`, no `"Ownable: caller is not the owner"`.
- Hooks: `_update` en ERC-20 y ERC-721.

Documentación: [OpenZeppelin Contracts 5.x](https://docs.openzeppelin.com/contracts/5.x),
código: [v5.6.1](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/v5.6.1).

## Cuentas y `msg.sender`

| Cuenta | Formato | Para qué |
|---|---|---|
| MetaMask | `0x…` (H160, secp256k1) | Desplegar desde Remix |
| Cuenta raíz en la Polkadot App | SS58 (`5…`) | Identidad del usuario |
| Cuenta del Product (derivada por app) | SS58 **y** `0x…` | Firmar lo que hace la app; es el `msg.sender` |

Las tres son cuentas distintas y **no comparten saldo**. Quien despliega (MetaMask) y quien usa la
app (cuenta del Product) son `msg.sender` distintos.

Conversión de direcciones (fuente:
[Accounts, docs.polkadot.com](https://docs.polkadot.com/smart-contracts/for-eth-devs/accounts/)):

- **`0x…` → SS58:** se agregan doce bytes `0xEE` al final de los 20 bytes. Es reversible; es la
  misma cuenta con el mismo saldo.
- **SS58 nativa → `0x…`:** Keccak-256 de la clave pública, últimos 20 bytes. Para usarla con
  herramientas de Ethereum hay que registrar el mapeo con `map_account` (deja un depósito).
- MetaMask no necesita `map_account`.
- Decimales: la cadena maneja PAS con 10 decimales; la capa EVM los muestra con 18.

## Gas

- Desplegar desde Remix: PAS de MetaMask.
- Llamadas desde la app: **PGAS** de la cuenta del Product, que el Host asigna con
  `SmartContractAllowance`. El usuario no necesita PAS. Ver `app-sdk.md`.

## Seguridad mínima

- Cualquiera puede llamar cualquier función pública, desde la app, Remix o un script. La app no
  protege nada; el contrato decide qué se permite.
- Usar `msg.sender` para identificar al usuario; nunca recibir "la cuenta del usuario" como parámetro
  para decidir permisos.
- Contratos con `payable`: primero actualizar el estado y después mandar el dinero (patrón
  checks-effects-interactions) para evitar *reentrancy*.
- Un contrato no puede verificar lo que pasa fuera de la cadena (p. ej. que alguien "jugó de verdad").
