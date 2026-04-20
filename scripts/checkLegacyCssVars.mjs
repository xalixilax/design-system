import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ROOT_DIR = process.cwd();
const ALLOWED_EXTENSIONS = new Set([".css", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "coverage", "storybook-static", "build"]);

const LEGACY_VARS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "radius",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
];

const TARGET_ROOTS = ["clients", "packages", "servers"];

function collectFiles(dir) {
  const entries = readdirSync(dir);
  let files = [];

  for (const entry of entries) {
    const absolutePath = join(dir, entry);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      if (IGNORED_DIRS.has(entry)) {
        continue;
      }
      files = files.concat(collectFiles(absolutePath));
      continue;
    }

    if (ALLOWED_EXTENSIONS.has(extname(entry))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function lineAndColumn(text, index) {
  const textBefore = text.slice(0, index);
  const lines = textBefore.split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

const legacyPattern = new RegExp(
  String.raw`(?:(?<!--(?:color|radius|spacing)-)--|var\(--)(?:${LEGACY_VARS.join("|")})(?![\w-])`,
  "g",
);

const offenders = [];

for (const root of TARGET_ROOTS) {
  const rootPath = join(ROOT_DIR, root);

  try {
    const files = collectFiles(rootPath);

    for (const filePath of files) {
      const content = readFileSync(filePath, "utf8");
      let match;

      while ((match = legacyPattern.exec(content)) !== null) {
        const { line, column } = lineAndColumn(content, match.index);
        offenders.push({
          filePath: filePath.replace(`${ROOT_DIR}/`, ""),
          line,
          column,
          match: match[0],
        });
      }
    }
  } catch {
    // Ignore missing roots in case the workspace shape changes.
  }
}

if (offenders.length > 0) {
  console.error("Legacy design tokens were found. Use DS-prefixed variables instead.");
  for (const offender of offenders) {
    console.error(`- ${offender.filePath}:${offender.line}:${offender.column} -> ${offender.match}`);
  }
  process.exit(1);
}

console.log("No legacy CSS variables found.");
