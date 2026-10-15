# Versiones probadas

Regla: usar **exactamente** estas versiones (sin `^` ni `~`). Una versión más nueva solo entra después
de probarla dentro de Polkadot Desktop y la Polkadot App.

Fecha de la última prueba: **2026-10-15**, Windows 10, Node v22.18.0, pnpm 12.6.0.
Las versiones salen de la app de referencia del equipo.

## Tabla

| Pieza | Versión fija | Resultado 2026-10-15 | Más reciente en npm (no probada) |
|---|---|---|---|
| Node.js | ≥ 22.19 (recomendado 24 LTS) | mínimo de pnpm 12; no se probó una versión ≥ 22.19 en esta máquina | — |
| pnpm | 12.6.0 (`devEngines`) | ✅ instala y construye | 12.11.2 |
| `@parity/product-sdk` | 0.27.0 | ✅ instala, `tsc` y `vite build` pasan | 0.37.0 |
| `@parity/product-sdk-descriptors` | 0.11.0 | ✅ igual que arriba | 0.14.0 |
| `@parity/truapi` | 0.13.1 (override) | ✅ `pnpm why` resuelve solo 0.13.1 | 0.25.0 |
| `polkadot-api` | 2.2.2 | ✅ instala | 3.2.1 |
| `@polkadot-api/signer` | 0.3.3 | ✅ instala | no consultada |
| `viem` | 2.56.9 | ✅ lectura real por ETH-RPC | no consultada |
| `typescript` | 5.9.3 | ✅ | no consultada |
| `vite` | 8.3.1 | ✅ build con `base: './'` | no consultada |
| `solc` (solc-js) | 0.8.28, sin optimizador | ✅ compila `Leaderboard.sol` (5,686 B, igual al bytecode desplegado) | 0.8.37 |
| `@openzeppelin/contracts` | 5.6.1 | ✅ compila ERC-20 (3,554 B) y ERC-721 no transferible (8,510 B) | 5.6.1 |
| `pad` = `@polkadot-community-foundation/polkadot-app-deploy` | 0.16.7 | ✅ `--version` → `polkadot-app-deploy v0.16.7` | 0.16.7 |
| `dotns` = `@polkadot-community-foundation/dotns-cli` | 0.9.5 | ✅ `--version` → `0.9.5` | 0.10.1 |
| CLI `skills` (instalar skills) | 1.7.2 | ✅ `add <ruta> --list` y `add … -a kiro-cli/claude-code --copy`; declara Node ≥ 22.20.0 y con 22.18 solo avisa `EBADENGINE` | 1.7.2 |
| Polkadot Desktop | 0.1.3 | **POR VERIFICAR** hoy (probado por última vez el 2026-10-01) | — |
| Polkadot App (teléfono) | — | **POR VERIFICAR** (flujos de firma no probados hoy) | — |

## Por qué estas y no las más nuevas

- Polkadot Desktop 0.1.3, las apps móviles del devnet y `dot.li` hablan el formato de mensajes plano
  (codec 1). `@parity/truapi` 0.13.1 es la última versión que lo habla; desde 0.16.0 no negocia con
  esos Hosts (pruebas del equipo).
- `@parity/product-sdk` 0.27.0 es la última con ese formato. Con ≥ 0.28 el Desktop registra pares
  `Transport error` / `unsupported frame (0, 0)` sin parar (pruebas del equipo,
  medido el 2026-09-30).
- Desde `@parity/product-sdk` 0.36.0 el SDK depende de `polkadot-api` ^3.2.1 (0.35.0 todavía usaba
  ^2.1.6). El cambio coincide con el commit de Parity *"move the SDK to polkadot-api 3"*
  (`3388e40`, 2026-10-13). Los ejemplos de las skills de Parity en `main` siguen esa línea nueva.

## Archivos del proyecto

`package.json` (extracto):

```json
{
  "devEngines": {
    "packageManager": { "name": "pnpm", "version": "12.6.0", "onFail": "download" }
  },
  "dependencies": {
    "@parity/product-sdk": "0.27.0",
    "@parity/product-sdk-descriptors": "0.11.0",
    "@polkadot-api/signer": "0.3.3",
    "polkadot-api": "2.2.2",
    "viem": "2.56.9"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vite": "8.3.1"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
allowBuilds:
  esbuild: false

overrides:
  '@parity/truapi': 0.13.1
```

Agregar una dependencia nueva: `pnpm add <paquete>@<versión> --save-exact`.

## Cómo se probó (2026-10-15)

1. Proyecto mínimo pnpm + Vite + TypeScript con las dependencias de arriba, en una carpeta temporal.
   `pnpm install` ✅ (190 paquetes; la mayoría salió del store local de pnpm). `pnpm build`
   (`tsc --noEmit && vite build`) ✅, con los mismos imports que `useHub.ts`. El `index.html`
   generado usa rutas `./assets/…`.
2. Lectura real en el devnet del contrato `Leaderboard` de prueba
   `0xa2625aa8e8790a3322acd045b32f67fba1808542`:
   - Con el SDK desde Node: ❌ `Host provider unavailable for chain 0xd6ee…`. Es lo esperado: el SDK
     solo funciona dentro de un Host. **La ruta SDK + Host queda POR VERIFICAR** en esta fecha.
   - Con viem `readContract` por ETH-RPC: ✅ `chainId` 420420417, `playerCount()` = 1,
     `getScores(0,10)` = `[["0x42fb…53e1"], ["prueba_ok"], [1240]]`.
3. WebSockets: Asset Hub y Bulletin responden; génesis de Asset Hub igual al del descriptor.
4. `pnpm dlx --ignore-scripts <paquete>@<versión> --version` para `pad` y `dotns` ✅.
5. `pnpm view <paquete> version` para la columna «más reciente».
