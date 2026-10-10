import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

/** @description Source root independent of the shell working directory. */
const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
/** @description FSD layers ordered from lowest to highest. */
const layers = ["shared", "entities", "features", "widgets", "pages", "app"];
const violations = [];
let fileCount = 0;

/**
 * @description Walk source files and inspect static imports, exports and dynamic imports.
 * @param {string} directory Absolute directory under src.
 * @returns {void} Accumulates invalid dependency edges.
 */
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) { inspect(filename); continue; }
    if (!/\.tsx?$/.test(entry.name)) continue;
    fileCount++;
    const source = ts.createSourceFile(filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
    const [originLayer, originSlice] = path.relative(sourceRoot, filename).split(path.sep);

    /** @description Inspect a syntax node and then its children. @param {import("typescript").Node} node Syntax node. @returns {void} */
    function visit(node) {
      let specifier;
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) specifier = node.arguments[0];
      if (specifier && ts.isStringLiteral(specifier)) {
        const name = specifier.text;
        const target = name.startsWith("@/") ? path.join(sourceRoot, name.slice(2))
          : name.startsWith(".") ? path.resolve(path.dirname(filename), name) : null;
        if (target) {
          const [targetLayer, targetSlice] = path.relative(sourceRoot, target).split(path.sep);
          const upward = layers.indexOf(targetLayer) > layers.indexOf(originLayer);
          const crossFeature = originLayer === "features" && targetLayer === "features" && originSlice !== targetSlice;
          if (upward || crossFeature) {
            const { line } = source.getLineAndCharacterOfPosition(specifier.getStart(source));
            violations.push(`${path.relative(sourceRoot, filename)}:${line + 1} -> ${name}`);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}

inspect(sourceRoot);
if (violations.length) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`FSD: ${fileCount} files checked, no upward or cross-feature imports.`);
}
