// Syntax-checks every inline <script> in the given HTML files (no execution).
import { readFileSync } from "node:fs";
import vm from "node:vm";

let failed = false;
for (const file of process.argv.slice(2)) {
  const html = readFileSync(file, "utf8");
  const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let m, n = 0;
  while ((m = re.exec(html))) {
    if (/type\s*=\s*["'](?!module|text\/javascript)/i.test(m[1])) continue;
    n++;
    try {
      new vm.Script(m[2], { filename: `${file}#script${n}` });
    } catch (e) {
      failed = true;
      console.error(`${file} script ${n}: ${e.message}`);
    }
  }
  console.log(`${file}: checked ${n} inline script(s)`);
}
process.exit(failed ? 1 : 0);
