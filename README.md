# polkadot-products-devnet

Agent Skill para crear y publicar **Polkadot Products** en **Products Devnet** con cualquier agente de
IA compatible con skills (Kiro, Claude Code, Cursor, GitHub Copilot, Codex y otros). Preparada por
Polkadot México para el Bootcamp + Hackathon en la UANL (29–31 de octubre de 2026).

La skill reúne en un solo lugar la red, las versiones probadas, el flujo de contratos Solidity con
Remix + MetaMask, el uso del Product SDK y la publicación con `pad` y `dotns`. Responde primero con sus
propias referencias, después solo con las fuentes de su registro curado, y marca como "no verificado"
lo que no encuentra.

## Instalación

Dentro de la carpeta de tu proyecto:

```sh
npx skills@1.7.2 add https://github.com/BrandonFilth/polkadot-products-devnet --skill polkadot-products-devnet
```

El CLI muestra un menú para elegir en qué agentes instalarla, el alcance y si copiar o enlazar los
archivos. En **Installation scope** elegir **Project** (solo este proyecto).

Usar la versión fija `skills@1.7.2`: sin versión, `npx` puede usar una más vieja que tenga en caché
(por ejemplo 1.5.18, que no instala en Kiro aunque se elija en el menú).
El paquete `skills` 1.7.2 declara Node ≥ 22.20.0; con Node 22.18 solo muestra un aviso
`EBADENGINE` y funciona. Recomendado: Node 24 LTS.

Para elegir el agente desde el comando (sin menú de agentes):

```sh
# Kiro
npx skills@1.7.2 add https://github.com/BrandonFilth/polkadot-products-devnet --skill polkadot-products-devnet -a kiro-cli
# Claude Code
npx skills@1.7.2 add https://github.com/BrandonFilth/polkadot-products-devnet --skill polkadot-products-devnet -a claude-code
# Cursor, GitHub Copilot, Codex (todos leen .agents/skills/)
npx skills@1.7.2 add https://github.com/BrandonFilth/polkadot-products-devnet --skill polkadot-products-devnet -a cursor
```

- En Windows, agregar `--copy` si los enlaces simbólicos fallan (copia los archivos en vez de enlazarlos).
- **No usar `-y` ni `--all`**: saltan las confirmaciones y la tabla de seguridad que el CLI muestra
  antes de instalar.
- **No usar `-g`**: instala para todos los proyectos del usuario. Esta skill está pensada por proyecto.
- Para ver qué contiene el repositorio sin instalar nada:
  `npx skills@1.7.2 add https://github.com/BrandonFilth/polkadot-products-devnet --list`.
- Instalación manual: copiar la carpeta `skills/polkadot-products-devnet/` a la carpeta de skills de
  tu agente (p. ej. `.kiro/skills/`, `.claude/skills/` o `.agents/skills/`).

Lee el `SKILL.md` y las referencias antes de instalar, como con cualquier skill.

## Contenido

```
skills/polkadot-products-devnet/
  SKILL.md                    cuándo usarla, reglas y qué ignorar de las skills de Parity
  references/
    red-devnet.md             RPCs, chainId, Blockscout, Bulletin, faucet, MetaMask, PGAS
    versiones.md              versiones fijas y resultado de la última prueba
    contratos.md              Solidity/REVM, Remix + MetaMask, ABI, OpenZeppelin, cuentas
    app-sdk.md                Product SDK: sandbox, createContract, .query() → .tx(), gas
    publicar.md               probar y publicar (pool + contenthash), pad, dotns, manifest e icono
    errores-comunes.md        síntoma → causa → solución
    fuentes.md                registro curado de fuentes
  scripts/
    verificar-entorno.mjs     revisión del entorno (solo lectura)
```

## Script de verificación

```sh
node .kiro/skills/polkadot-products-devnet/scripts/verificar-entorno.mjs
node .kiro/skills/polkadot-products-devnet/scripts/verificar-entorno.mjs ruta/del/proyecto
```

La ruta depende del agente: `.kiro/skills/` (Kiro), `.claude/skills/` (Claude Code) o
`.agents/skills/` (Cursor, Copilot, Codex).

Revisa Node (mínimo 22.19), pnpm 12.6.0, Git, Polkadot Desktop y, si hay un proyecto: las versiones
exactas, que `@parity/truapi` y `polkadot-api` estén instalados una sola vez, los descriptores de PCF,
los overrides acotados sin globales, `minimumReleaseAgeExclude`, `devEngines`, lockfiles de npm/yarn y
`base: './'` en Vite.

Es **solo lectura**: no instala nada, no escribe archivos y no hace llamadas de red. Solo ejecuta
`pnpm --version`, `git --version` y, en Windows, `Get-ExecutionPolicy`.

## Versiones

Probadas el 2026-10-23: `@parity/product-sdk` 0.39.0, `polkadot-api` 3.2.1, `@parity/truapi` 0.25.0
(overrides acotados), descriptores de PCF 0.14.0-pcf.1, pnpm 12.6.0, solc 0.8.28, OpenZeppelin 5.6.1,
`pad` 0.22.1, `dotns` 1.0.0. Detalle y pendientes en
[`references/versiones.md`](skills/polkadot-products-devnet/references/versiones.md).

## Créditos

Las skills oficiales de Parity ([paritytech/product-sdk](https://github.com/paritytech/product-sdk/tree/941edee26951744174030b3351692cec2a754d53/product-sdk/skills),
Apache-2.0) se enlazan como referencia fijada a un commit; esta skill no copia su contenido.

## Licencia

[Apache-2.0](./LICENSE).
