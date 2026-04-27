import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const isProduction = process.argv.includes('production');

const builtinModules = [
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
  'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
  'module', 'net', 'os', 'path', 'punycode', 'querystring', 'readline',
  'repl', 'stream', 'string_decoder', 'sys', 'timers', 'tls', 'trace_events',
  'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib'
];

await esbuild.build({
  entryPoints: ['main.ts'],
  bundle: true,
  external: ['obsidian', ...builtinModules],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  outfile: 'main.js',
  sourcemap: !isProduction,
  minify: isProduction,
  logLevel: 'info',
});

console.log('Build complete!');