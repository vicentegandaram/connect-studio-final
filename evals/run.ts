import { reviewTexts } from "../src/lib/ethics";
import { CASES } from "./cases";

let fails = 0;
const rows: string[] = [];

for (const c of CASES) {
  const r = reviewTexts({ texto: c.text });
  const failed = new Set(r.failed);
  const expErr = c.errors ?? [];
  const expWarn = c.warnings ?? [];
  const missing = [...expErr, ...expWarn].filter((id) => !failed.has(id));
  const extra = [...failed].filter((id) => ![...expErr, ...expWarn].includes(id));
  const ok = missing.length === 0 && extra.length === 0;
  if (!ok) {
    fails++;
    rows.push(`✗ ${c.id}${c.note ? ` (${c.note})` : ""}\n    «${c.text}»\n    ${missing.length ? `NO detectó: ${missing.join(", ")}` : ""}${missing.length && extra.length ? " · " : ""}${extra.length ? `detectó de más: ${extra.join(", ")}` : ""}`);
  }
}
const total = CASES.length;
console.log(rows.join("\n"));
console.log(`\n${total - fails}/${total} casos correctos · ${fails} fallos`);
process.exit(fails ? 1 : 0);
