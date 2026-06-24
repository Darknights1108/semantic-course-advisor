import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const templatePath = path.resolve(
  projectRoot,
  "..",
  "template",
  "Semantic Career Advisor (standalone).html",
);
const outputDir = path.join(projectRoot, "app", "assets", "fonts");

const html = await readFile(templatePath, "utf8");
const manifestMatch = html.match(
  /<script type="__bundler\/manifest">\s*([\s\S]*?)\s*<\/script>/,
);

if (!manifestMatch) {
  throw new Error(`Unable to find bundled assets in ${templatePath}`);
}

const manifest = JSON.parse(manifestMatch[1]);
const fontMap = {
  "36883484-9bbe-49c7-a6a7-1e817462e5c4": "plus-jakarta-cyrillic-ext.woff2",
  "f97aa357-1d31-4cf6-8569-6282632bae7a": "plus-jakarta-vietnamese.woff2",
  "9616d3d1-0479-4df7-9b2c-73071a45e8fc": "plus-jakarta-latin-ext.woff2",
  "b33689c7-5acb-420c-8bd4-b476e53c31d3": "plus-jakarta-latin.woff2",
  "a61bec0d-4dcb-467f-bdea-c2b10a60ee87": "jetbrains-cyrillic-ext.woff2",
  "a5300c3a-deb8-4175-bb17-75fa601964ee": "jetbrains-cyrillic.woff2",
  "4aacb8f0-1a7a-477b-b84b-1a2f66dd9644": "jetbrains-greek.woff2",
  "d44781cd-1727-4550-8a43-c6286bad269d": "jetbrains-vietnamese.woff2",
  "3ab9a846-1fbd-40a2-9c88-97cd5b5efa1c": "jetbrains-latin-ext.woff2",
  "80df3b2c-349e-40e6-914e-01b3e334024f": "jetbrains-latin.woff2",
};

await mkdir(outputDir, { recursive: true });

for (const [assetId, filename] of Object.entries(fontMap)) {
  const asset = manifest[assetId];
  if (!asset?.data) {
    throw new Error(`Font asset ${assetId} is missing from the template bundle`);
  }
  if (asset.compressed) {
    throw new Error(`Font asset ${assetId} is unexpectedly compressed`);
  }
  await writeFile(path.join(outputDir, filename), Buffer.from(asset.data, "base64"));
}

console.log(`Extracted ${Object.keys(fontMap).length} template fonts to ${outputDir}`);
