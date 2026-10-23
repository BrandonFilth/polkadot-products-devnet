#!/usr/bin/env node
// Revisa la computadora y el proyecto contra las versiones probadas para Products Devnet.
// Solo lee: no instala nada, no escribe archivos y no hace llamadas de red.
//
//   node verificar-entorno.mjs                 revisa la carpeta actual
//   node verificar-entorno.mjs ruta/al/proyecto
//
// Código de salida: 0 si no hay errores (✘), 1 si hay al menos uno.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

// Versiones probadas (ver references/versiones.md).
const NODE_MIN = [22, 19, 0];
const PNPM = '12.6.0';
const FIJAS = {
  '@parity/product-sdk': '0.39.0',
  'polkadot-api': '3.2.1',
  '@parity/product-sdk-descriptors': 'npm:@polkadot-community-foundation/product-sdk-descriptors@0.14.0-pcf.1',
};
const TRUAPI = '0.25.0';
const POLKADOT_API = '3.2.1';
// Paquete real detrás del alias @parity/product-sdk-descriptors.
const PCF = { name: '@polkadot-community-foundation/product-sdk-descriptors', version: '0.14.0-pcf.1' };
// Dependencias que solo se fijan con overrides acotados (padre@versión>hijo), nunca globales.
const SIN_GLOBAL = ['@parity/truapi', 'polkadot-api', '@parity/product-sdk-descriptors'];

const proyecto = resolve(process.argv[2] ?? process.cwd());
const windows = process.platform === 'win32';
const resultados = [];
const anotar = (estado, nombre, detalle, arreglo) => resultados.push({ estado, nombre, detalle, arreglo });

// Corre un comando local de solo lectura (p. ej. "--version"). Se ejecuta en la carpeta temporal para
// que pnpm no lea un devEngines del proyecto e intente descargar otra versión de sí mismo, y con el
// aviso de actualizaciones apagado para que no consulte el registro.
function correr(comando) {
  const env = { ...process.env, npm_config_update_notifier: 'false' };
  const r = spawnSync(comando, { shell: true, encoding: 'utf8', timeout: 15_000, windowsHide: true, cwd: tmpdir(), env });
  return { ok: r.status === 0, salida: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
}

const version = (texto) => texto?.match(/(\d+)\.(\d+)\.(\d+)/)?.slice(1).map(Number) ?? null;
const alMenos = (v, min) => {
  for (let i = 0; i < 3; i++) if (v[i] !== min[i]) return v[i] > min[i];
  return true;
};
const leerJson = (ruta) => {
  try {
    return JSON.parse(readFileSync(ruta, 'utf8'));
  } catch {
    return null;
  }
};
// Primera carpeta, desde `desde` hacia arriba, que contiene `relativa`. Sirve para un paquete dentro de
// un workspace de pnpm: pnpm-workspace.yaml y node_modules/.pnpm están en la raíz del workspace.
const buscarArriba = (desde, relativa) => {
  for (let carpeta = desde; ; carpeta = dirname(carpeta)) {
    if (existsSync(join(carpeta, relativa))) return join(carpeta, relativa);
    if (dirname(carpeta) === carpeta) return null;
  }
};
// Líneas indentadas de un bloque de primer nivel del YAML (`nombre:`), sin comentarios.
const bloqueYaml = (lineas, nombre) => {
  const inicio = lineas.findIndex((l) => l.trimEnd() === `${nombre}:`);
  if (inicio < 0) return [];
  const fin = lineas.findIndex((l, i) => i > inicio && l.trim() !== '' && !/^\s/.test(l) && !l.startsWith('#'));
  return lineas.slice(inicio + 1, fin < 0 ? undefined : fin).filter((l) => /^\s/.test(l) && l.trim() !== '' && !l.trim().startsWith('#'));
};
const sinComillas = (texto) => texto.trim().replace(/^['"]|['"]$/g, '');

// ---------------------------------------------------------------- computadora

{
  const v = version(process.version);
  if (v && alMenos(v, NODE_MIN)) anotar('ok', 'Node.js', process.version);
  else anotar('mal', 'Node.js', process.version, `Se necesita Node ${NODE_MIN.join('.')} o superior (recomendado: Node 24 LTS).`);
}

{
  const r = correr('pnpm --version');
  const v = r.ok ? r.salida.split(/\r?\n/).pop() : null;
  if (!v) {
    // Cómo instalarlo en cada sistema; el devEngines del proyecto baja después la versión fija.
    const como = windows ? 'winget install -e --id pnpm.pnpm' : process.platform === 'darwin' ? 'brew install pnpm' : 'curl -fsSL https://get.pnpm.io/install.sh | sh -';
    anotar('mal', 'pnpm', 'no se encontró', `Instala pnpm con: ${como} y abre una terminal nueva. La versión probada es ${PNPM}.`);
  }
  else if (v === PNPM) anotar('ok', 'pnpm', v);
  else anotar('ojo', 'pnpm', v, `La versión probada es ${PNPM}. Si el proyecto tiene devEngines, pnpm usará esa.`);
}

{
  const r = correr('git --version');
  if (r.ok) anotar('ok', 'Git', r.salida.replace('git version ', ''));
  else anotar('mal', 'Git', 'no se encontró', 'Instala Git.');
}

if (windows) {
  const r = correr('powershell -NoProfile -Command "Get-ExecutionPolicy"');
  const politica = r.salida.split(/\r?\n/).pop() ?? '';
  if (/Restricted|AllSigned/i.test(politica)) {
    anotar('mal', 'PowerShell: política de scripts', politica, 'Corre: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned');
  } else anotar('ok', 'PowerShell: política de scripts', politica);
}

{
  // Ubicaciones conocidas del instalador. En macOS la app se llama "Polkadot Desktop.app" o
  // "Polkadot Desktop Dev.app" según la versión: se acepta cualquier "Polkadot Desktop*.app".
  // En Linux es un AppImage y no se puede detectar.
  const mac = process.platform === 'darwin';
  const enMac = () =>
    ['/Applications', join(process.env.HOME ?? '', 'Applications')].some((carpeta) => {
      try {
        return readdirSync(carpeta).some((n) => n.startsWith('Polkadot Desktop') && n.endsWith('.app'));
      } catch {
        return false;
      }
    });
  const encontrado = windows ? existsSync(join(process.env.LOCALAPPDATA ?? '', 'Programs', 'polkadot-desktop')) : mac && enMac();
  if (encontrado) anotar('ok', 'Polkadot Desktop', 'instalado (usa la versión de devnet más reciente)');
  else if (windows || mac) anotar('mal', 'Polkadot Desktop', 'no se encontró', 'Instala Polkadot Desktop (último release de devnet) y emparéjalo con tu teléfono.');
  else anotar('ojo', 'Polkadot Desktop', 'revísalo a mano', 'Abre el AppImage y confirma que está emparejado.');
}

// ---------------------------------------------------------------- proyecto

if (/\s/.test(proyecto)) anotar('ojo', 'Ruta del proyecto', proyecto, 'Tiene espacios: algunas herramientas fallan. Usa una ruta como C:\\dev\\mi-app.');

const pkg = leerJson(join(proyecto, 'package.json'));
if (!pkg) {
  anotar('ojo', 'Proyecto', `sin package.json en ${proyecto}`, 'Las revisiones del proyecto se omiten.');
} else {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Versiones exactas en package.json (sin ^ ni ~).
  for (const [nombre, fija] of Object.entries(FIJAS)) {
    const declarada = deps[nombre];
    if (!declarada) anotar('ojo', nombre, 'no declarado', `Si lo usas: pnpm add ${nombre}@${fija} --save-exact`);
    else if (declarada === fija) anotar('ok', nombre, declarada);
    else anotar('mal', nombre, declarada, `Debe ser exactamente ${fija} (ver references/versiones.md).`);
  }
  const rangos = Object.entries(deps).filter(([, v]) => /^[\^~><*]|^latest$|\.x/.test(String(v)));
  if (rangos.length) anotar('ojo', 'Rangos de versión', rangos.map(([n, v]) => `${n}@${v}`).join(', '), 'Fija versiones exactas (pnpm add <pkg>@<versión> --save-exact).');

  // pnpm fijado con devEngines.
  const motor = pkg.devEngines?.packageManager;
  if (motor?.name === 'pnpm' && motor.version === PNPM) anotar('ok', 'devEngines', `pnpm ${PNPM}`);
  else anotar('ojo', 'devEngines', motor ? `${motor.name} ${motor.version}` : 'sin definir', `Agrega devEngines.packageManager con pnpm ${PNPM}.`);

  // pnpm-workspace.yaml (en el proyecto o en la raíz del workspace): overrides acotados
  // (padre@versión>hijo) y la excepción de los descriptores en minimumReleaseAgeExclude.
  const ws = buscarArriba(proyecto, 'pnpm-workspace.yaml');
  if (!ws) {
    anotar('mal', 'pnpm-workspace.yaml', 'no existe', 'Copia el pnpm-workspace.yaml de references/versiones.md (overrides acotados y minimumReleaseAgeExclude).');
  } else {
    const lineas = readFileSync(ws, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
    const donde = dirname(ws) === proyecto ? '' : ` (${ws})`;
    const overrides = bloqueYaml(lineas, 'overrides')
      .map((l) => l.trim().match(/^(['"]?)(.+?)\1\s*:\s*(.*)$/))
      .filter(Boolean)
      .map((m) => ({ clave: m[2], valor: sinComillas(m[3]) }));
    const globales = overrides.filter((o) => SIN_GLOBAL.includes(o.clave));
    for (const o of globales) {
      anotar('mal', 'Overrides', `override global de ${o.clave}${donde}`, 'Usa solo overrides acotados (padre@versión>hijo): los globales rompen pnpm dlx de pad dentro del repo.');
    }
    const truapi = overrides.some((o) => o.clave.endsWith('>@parity/truapi') && o.valor === TRUAPI);
    if (!globales.length && truapi) anotar('ok', 'Overrides acotados', `@parity/truapi ${TRUAPI}${donde}`);
    else if (!globales.length) anotar('mal', 'Overrides acotados', `sin override de @parity/truapi ${TRUAPI}${donde}`, 'Copia el bloque overrides de references/versiones.md.');

    const excluidos = bloqueYaml(lineas, 'minimumReleaseAgeExclude').map((l) => sinComillas(l.trim().replace(/^-\s*/, '')));
    if (excluidos.includes(`${PCF.name}@${PCF.version}`)) anotar('ok', 'minimumReleaseAgeExclude', `${PCF.name}@${PCF.version}`);
    else anotar('mal', 'minimumReleaseAgeExclude', `sin ${PCF.name}@${PCF.version}${donde}`, 'Sin esto pnpm install se bloquea con los descriptores del devnet (references/versiones.md).');
  }

  // Otros gestores de paquetes.
  for (const archivo of ['package-lock.json', 'yarn.lock', 'bun.lockb']) {
    if (existsSync(join(proyecto, archivo))) anotar('mal', 'Lockfile', archivo, 'Este proyecto usa solo pnpm: borra ese archivo y corre pnpm install.');
  }

  // Lo que realmente quedó instalado.
  const modulos = join(proyecto, 'node_modules');
  if (!existsSync(modulos)) {
    anotar('ojo', 'node_modules', 'sin instalar', 'Corre pnpm install.');
  } else {
    const arreglo = 'Usa las versiones y los overrides de references/versiones.md y corre pnpm install.';
    // Dependencias directas: su package.json dentro de node_modules. Los descriptores son un alias:
    // se compara el paquete real (name y version), no el texto del alias.
    for (const [nombre, fija] of Object.entries(FIJAS)) {
      const instalado = leerJson(join(modulos, nombre, 'package.json'));
      if (!instalado) continue;
      const esperado = nombre === '@parity/product-sdk-descriptors' ? PCF : { name: nombre, version: fija };
      const real = instalado.name === nombre ? instalado.version : `${instalado.name}@${instalado.version}`;
      if (instalado.name === esperado.name && instalado.version === esperado.version) anotar('ok', `${nombre} (instalado)`, real);
      else anotar('mal', `${nombre} (instalado)`, real, `Debe ser ${esperado.name}@${esperado.version}. ${arreglo}`);
    }
    // Copias en node_modules/.pnpm (en el proyecto o en la raíz del workspace). Cada carpeta de .pnpm
    // tiene su propio node_modules con el paquete y enlaces a sus dependencias. Se lee el package.json
    // de cada paquete buscado (name y version reales): el nombre de la carpeta no sirve porque pnpm lo
    // acorta con un hash cuando es largo (pasa con el paquete de PCF en Windows).
    const virtual = buscarArriba(proyecto, join('node_modules', '.pnpm'));
    if (virtual) {
      const carpetas = readdirSync(virtual);
      const copias = (nombre) => {
        const vistas = new Set();
        for (const c of carpetas) {
          const p = leerJson(join(virtual, c, 'node_modules', ...nombre.split('/'), 'package.json'));
          if (p?.name && p.version) vistas.add(`${p.name}@${p.version}`);
        }
        return [...vistas].sort();
      };
      const unica = (titulo, vistas, esperada, motivo) => {
        if (vistas.length === 1 && vistas[0] === esperada) anotar('ok', `${titulo} (copias en .pnpm)`, esperada);
        else anotar('mal', `${titulo} (copias en .pnpm)`, vistas.length ? vistas.join(', ') : 'ninguna', `Debe ser solo ${esperada}${motivo}. ${arreglo}`);
      };
      unica('@parity/truapi', copias('@parity/truapi'), `@parity/truapi@${TRUAPI}`, ', la versión de TrUAPI de los Hosts');
      unica('polkadot-api', copias('polkadot-api'), `polkadot-api@${POLKADOT_API}`, '');
      // Los descriptores solo deben venir del paquete de PCF: ninguna copia de @parity/product-sdk-descriptors.
      const descriptores = [...new Set([...copias('@parity/product-sdk-descriptors'), ...copias(PCF.name)])].sort();
      unica('Descriptores', descriptores, `${PCF.name}@${PCF.version}`, '');
    }
  }

  // Vite: rutas relativas para servir el bundle desde un CID de Bulletin.
  const vite = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'].map((f) => join(proyecto, f)).find(existsSync);
  if (vite) {
    if (/base\s*:\s*['"]\.\/['"]/.test(readFileSync(vite, 'utf8'))) anotar('ok', 'Vite base', "'./'");
    else anotar('mal', 'Vite base', 'no es ./', "Agrega base: './' en la configuración de Vite.");
  }
}

anotar('ojo', 'A mano', 'Polkadot App en el teléfono y MetaMask con chainId 420420417', 'Ver references/red-devnet.md.');

// ---------------------------------------------------------------- reporte

const tty = process.stdout.isTTY;
const icono = { ok: tty ? '\x1b[32m✔\x1b[0m' : '✔', mal: tty ? '\x1b[31m✘\x1b[0m' : '✘', ojo: tty ? '\x1b[33m!\x1b[0m' : '!' };
console.log(`\nEntorno para Products Devnet (${proyecto})\n`);
for (const r of resultados) {
  console.log(`${icono[r.estado]} ${r.nombre.padEnd(46)} ${r.detalle}`);
  if (r.arreglo && r.estado !== 'ok') console.log(`  → ${r.arreglo}`);
}
const fallas = resultados.filter((r) => r.estado === 'mal').length;
console.log(fallas ? `\n${fallas} cosa(s) por arreglar.` : '\nSin errores en lo que se puede revisar desde aquí.');
process.exit(fallas ? 1 : 0);
