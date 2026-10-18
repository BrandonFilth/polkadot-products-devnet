# Errores comunes

Formato: **síntoma → causa → solución**. Si un síntoma no está aquí, buscar en `fuentes.md` y decir
"no verificado" antes de proponer una causa.

## Entorno e instalación

| Síntoma | Causa | Solución |
|---|---|---|
| `pnpm` no se reconoce después de instalarlo | La terminal tiene el PATH viejo | Cerrar y abrir el editor, o en PowerShell: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')` |
| `pnpm --version` dice 10.x | Hay otro pnpm antes en el PATH | `where.exe pnpm` y quitar el de `%APPDATA%\npm` |
| `EBADDEVENGINES` | Se usó npm o yarn en un proyecto con `devEngines` de pnpm | Usar solo pnpm |
| `ERR_PNPM_NO_PKG_MANIFEST` | El comando se corrió fuera de la carpeta del proyecto | `cd` a la carpeta que tiene `package.json` |
| `pnpm dlx` pregunta qué compilar o dice `not a terminal` | Faltó `--ignore-scripts` | `pnpm dlx --ignore-scripts <paquete>@<versión> …` |
| Errores raros de rutas en Windows | Ruta con espacios o muy larga | Trabajar en `C:\dev\mi-app`; `git config --global core.longpaths true` |
| Scripts de PowerShell bloqueados | Política `Restricted` | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `node scripts/verificar-entorno.mjs` marca Node | Node < 22.19 | Instalar Node 24 LTS |

## Versiones del SDK y el Host

| Síntoma | Causa | Solución |
|---|---|---|
| En el log del Desktop, pares `Transport error` + `unsupported frame (0, 0)` sin parar | La app usa `@parity/product-sdk` ≥ 0.28 o `@parity/truapi` ≥ 0.16, que Desktop 0.1.3 no entiende | Fijar SDK 0.27.0, descriptors 0.11.0 y el override de truapi 0.13.1 (`versiones.md`). Cerrar la pestaña del Product |
| La app se queda esperando al conectar en Desktop | `getChainAPI()` o `getProductContext()` sin respuesta en Desktop 0.1.3 | Usar `createChainClient` con `devnet_asset_hub`; poner timeout a `getProductContext()` |
| `Host provider unavailable for chain 0x…` | El código corre fuera de un Host (navegador normal o Node) | Abrir la app dentro de Polkadot Desktop o la Polkadot App; para scripts, leer por ETH-RPC con viem |
| La IA propone `getChainAPI('paseo')` o `paseo_asset_hub` | Ejemplos de las skills de Parity, que apuntan a Paseo Next v2 | Usar `devnet_asset_hub` (`red-devnet.md`) |
| `readonly … cannot be assigned to the mutable type 'AbiEntry[]'` | ABI escrita como literal `as const` | Importar la ABI como JSON y castear `as AbiEntry[]` |
| Pantalla en blanco al abrir el `.dot` (síntoma **POR VERIFICAR**) | Vite sin `base: './'`: el bundle pide `/assets/…` desde la raíz y no desde el CID | `base: './'` en `vite.config` y volver a publicar |

## Contratos y Remix

| Síntoma | Causa | Solución |
|---|---|---|
| Remix muestra "Paseo PassetHub (420420422)" | Red vieja que ya no existe | Agregar Polkadot Hub TestNet (420420417) a MetaMask a mano |
| MetaMask con saldo 0 después del faucet | Se eligió otra cadena en el faucet (p. ej. *Asset Hub Next 1500*) | Faucet → Paseo → **Asset Hub (1000)** |
| El despliegue falla por tamaño | Runtime > 24,576 bytes | Dividir el contrato, usar `error` personalizados, o activar el optimizador y medir |
| La IA cambia el pragma o instala Hardhat/Foundry/`resolc` | Indicaciones de skills externas | Mantener `pragma solidity 0.8.28;` y Remix + MetaMask (`contratos.md`) |
| Errores de OpenZeppelin con `_beforeTokenTransfer` o `Ownable()` sin argumento | Código de OZ 4 | En OZ 5: `_update` y `Ownable(msg.sender)` |
| `AccountNotMapped` o una cuenta nativa no puede usar herramientas EVM | La cuenta SS58 no tiene mapeo a `0x…` | Registrar el mapeo con `map_account` (deja depósito). MetaMask no lo necesita |
| La app y Remix muestran récords distintos para "el mismo usuario" | MetaMask y la cuenta del Product son `msg.sender` distintos | Es esperado; ver tabla de cuentas en `contratos.md` |

## Firmas desde la app

| Síntoma | Causa | Solución |
|---|---|---|
| `Invalid.Payment` y PGAS bajo | La cuenta del Product no tiene gas | `requestResourceAllocation` con `SmartContractAllowance` y reintentar una vez |
| `Invalid.Payment` aunque hay PGAS | El Host armó mal la comisión | Reconectar (cadena + `SignerManager`) y reintentar; si se repite, actualizar la Polkadot App |
| `Invalid.Stale`, `Future` o errores de `nonce` | La sesión de firma se desfasó | Reconectar y reintentar |
| Una firma nunca llega al teléfono | Otra firma sigue pendiente; el Host atiende una a la vez | Esperar a que termine la anterior; no firmar en segundo plano |
| `timeout` al firmar | El usuario no aprobó a tiempo; la tx pudo entrar | Leer el estado del contrato antes de reintentar |
| El revert solo aparece al firmar | Se llamó `.tx()` sin simular | Llamar `.query()` antes y mostrar el motivo del revert |
| "Conectar" o la firma no hacen nada en `localhost` | Ni Desktop ni la Polkadot App se conectan a `localhost`; la conexión y las firmas necesitan la app publicada | Publicar en tu `.dot` y probar desde ahí (`app-sdk.md`, *Dónde probar*) |
| Direcciones distintas en dos dominios `.dot` | La cuenta del Product se deriva del dominio | Configurar admins y dueños desde el dominio final |

## Publicación

| Síntoma | Causa | Solución |
|---|---|---|
| `pad` sube a otra red | Faltó `--env devnet` (por defecto: `paseo-next-v2`) | `--env devnet` o `$env:PAD_ENV = "devnet"` |
| `pad` pide el binario Kubo | Faltó `--js-merkle` | Agregar `--js-merkle` |
| `pool account N … is not authorized (or its authorization expired)` | Esa cuenta del *pool* venció en Bulletin | Correr otra vez la misma línea `pad`: elige al azar una de las 10 cuentas sin revisar su autorización. La organización mantiene autorizadas las 10 durante el evento |
| `pad login`: `did not return the product account key within 25s` y luego `Allocation request timed out after 60s` | Fallo conocido del login móvil en Products Devnet (BUG-007): no llegan la cuenta del Product ni los recursos | No usar `pad login`: subir con el *pool* a un nombre temporal y pegar el CID en tu nombre desde `dotns.dot` (`publicar.md`, sección 2) |
| No aparece `Storage signer: pool fallback (no session)` o pide aprobar en el teléfono | Hay una sesión de `pad` guardada (alguien corrió `pad login`) | `pad logout` y repetir |
| `Name has 14 trailing digits; DotNS allows exactly 0 or 2 trailing digits` | El nombre termina en números (marca de tiempo) | Convertir los dígitos a letras: `tmpcacgbabiaebjec.dot` (`publicar.md`, sección 2) |
| El nombre temporal ya tiene dueño | Otro intento usó el mismo nombre | Generar otro `$tmp` (segunda línea) y repetir |
| `pad` falla por propietario con tu propio nombre | Le pasaste a `pad` el nombre que es de tu teléfono; `pad` firma con su worker | Nunca pasar a `pad` el nombre del teléfono: darle el nombre temporal y pegar el CID a mano en el tuyo |
| `pad` registró un nombre que no es el tuyo | Con el *pool*, el nombre que le pasas queda a nombre de una cuenta compartida | Usar siempre un nombre temporal (`tmp` + fecha en letras) y solo copiar el CID |
| `Previous deploy did not exit cleanly. Continuing.` / `Previous deploy was interrupted` | Quedó marca de un intento anterior | Inofensivo |
| `A newer version of polkadot-app-deploy is available (0.16.7 → 0.20.0)` | Aviso de `pad` sobre otro paquete | Ignorarlo; no actualizar (versión fija 0.16.7) |
| `Update and retry? [Y/n]` tras un fallo | Faltó `PAD_UPDATE_CHECK=0` | Responder `n` y usar el atajo de `publicar.md`, sección 2 |
| No deja cambiar el `contenthash` | La cuenta no es dueña del nombre; la delegación no se respeta | Hacerlo con la cuenta dueña o desde `dotns.dot` → Profile → Edit |
| Icono en blanco | Icono subido como UnixFS (`bafybei…`) | Subirlo con `pad` (blob crudo blake2b, `bafk2bza…`) |
| La tarjeta aparece pero la app no abre | Hay `manifest` pero falta `app.<nombre>.dot` con `contenthash` y `executable` | Con el método del taller se agregan a mano (**POR VERIFICAR**, `publicar.md`, sección 4) |
| La app publicada dejó de cargar tras unos días | Bulletin borra el contenido a los ~14 días | Volver a publicar bundle e icono |

Fuentes: app de referencia del equipo, pruebas del equipo (2026-09-23 a 2026-10-03), `pad --help` 0.16.7, las pruebas
del 2026-10-15 (`versiones.md`) y las pruebas del 2026-10-18.
