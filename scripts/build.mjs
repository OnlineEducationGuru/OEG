/* OEG build — copy fonts from node_modules to assets/fonts/ */
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets", "fonts");
mkdirSync(out, { recursive: true });

const pkgs = [
  ["@fontsource-variable/noto-sans-gujarati", ["index.css", "files"]],
  ["@fontsource-variable/noto-sans-devanagari", ["index.css", "files"]],
  ["@fontsource-variable/inter", ["index.css", "files"]],
  ["@fontsource/baloo-bhai-2", ["gujarati-400.css", "gujarati-500.css", "gujarati-600.css", "gujarati-700.css", "gujarati-800.css", "files"]]
];

for (const [pkg, files] of pkgs) {
  const src = join(root, "node_modules", pkg);
  const dest = join(out, pkg.split("/").pop());
  mkdirSync(dest, { recursive: true });
  for (const f of files) {
    const s = join(src, f);
    if (existsSync(s)) cpSync(s, join(dest, f), { recursive: true });
    else console.warn("missing:", s);
  }
  console.log("copied:", pkg);
}
console.log("Build done → assets/fonts/");
