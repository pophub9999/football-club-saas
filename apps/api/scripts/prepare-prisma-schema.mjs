import fs from 'node:fs';
import path from 'node:path';

const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
const source = fs.readFileSync(schemaPath, 'utf8');

const normalized = source.replace(
  /enum\s+(\w+)\s*\{\s*([^{}\n]+?)\s*\}/g,
  (_, name, values) => `enum ${name} {\n${values.trim().split(/\s+/).map((value) => `  ${value}`).join('\n')}\n}`,
);

if (normalized !== source) {
  fs.writeFileSync(schemaPath, normalized);
  console.log(`Normalized Prisma enums in ${schemaPath}`);
}
