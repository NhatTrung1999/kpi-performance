// Sinh .d.ts cho bản thư viện (dist-lib/types) để /design-sync đọc được API của component.
// tsc không đổi alias `@/` trong .d.ts, nên ở đây đổi sang đường dẫn tương đối.
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const out = resolve('dist-lib/types');
rmSync(out, { recursive: true, force: true });
execSync('npx tsc -p tsconfig.lib.json', { stdio: 'inherit' });

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.d.ts') ? [join(dir, e.name)] : [],
  );
}
for (const file of walk(out)) {
  const src = readFileSync(file, 'utf8');
  const next = src.replace(/(from\s+|import\()(['"])@\/([^'"]+)\2/g, (_, pre, q, p) => {
    let rel = relative(dirname(file), join(out, p)).replaceAll(sep, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return `${pre}${q}${rel}${q}`;
  });
  if (next !== src) writeFileSync(file, next);
}
