/**
 * 构建脚本：产出 DSH 可加载的 lib/ 产物。
 *  - lib/index.js   —— Host 半（ESM，直接来自 src/host.js）
 *  - lib/client.js  —— Client 半（ModuleLoader bundle 格式：
 *    window.__ModuleLoader__.load({ id, factory: (require) => ... })）
 *  - lib/types/*.d.ts —— 最小类型声明
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

mkdirSync(join(root, 'lib'), { recursive: true })
mkdirSync(join(root, 'lib', 'types'), { recursive: true })
mkdirSync(join(root, 'lib', 'types', 'client'), { recursive: true })

// ---------- Host 半 ----------
writeFileSync(join(root, 'lib', 'index.js'), readFileSync(join(root, 'src', 'host.js'), 'utf8'))

// ---------- Client 半（ModuleLoader bundle） ----------
const clientSrc = readFileSync(join(root, 'src', 'client.js'), 'utf8')
const bundle = `window.__ModuleLoader__.load({
	id: ${JSON.stringify(pkg.name)},
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");
${clientSrc}
		exports.apply = apply;
		if (typeof inject !== "undefined") exports.inject = inject;
		return module.exports;
	}
});
`
writeFileSync(join(root, 'lib', 'client.js'), bundle)

// ---------- 类型声明 ----------
writeFileSync(join(root, 'lib', 'types', 'index.d.ts'), `export declare const name: string
export declare const inject: string[]
export declare function apply(ctx: import('@deepseek-ai/cordis').Context): void
`)
writeFileSync(join(root, 'lib', 'types', 'client', 'index.d.ts'), `export declare const inject: string[]
export declare function apply(ctx: unknown): void
`)

console.log(`✓ built ${pkg.name} v${pkg.version}`)
console.log('  lib/index.js   (host, ' + readFileSync(join(root, 'lib', 'index.js'), 'utf8').length + ' B)')
console.log('  lib/client.js  (client bundle, ' + bundle.length + ' B)')
