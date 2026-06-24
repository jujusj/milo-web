const fs = require("fs");
const path = require("path");

const root = process.cwd();
const mode = process.argv[2] || "check";
const requiredFiles = [
  "index.html",
  "accessibilite/index.html",
  "confidentialite/index.html",
  "mentions-legales/index.html",
  "merci/index.html",
  "styles.css",
  "script.js",
  "content.js",
  "api/preinscription.js",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
  "README.md"
];

const htmlFiles = requiredFiles.filter((file) => file.endsWith(".html"));
const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Fichier manquant: ${file}`);
  }
}

for (const file of htmlFiles) {
  const source = read(file);
  const h1Count = count(source, /<h1[\s>]/gi);
  if (h1Count !== 1) errors.push(`${file}: ${h1Count} h1 détecté(s), attendu: 1`);
  if (!source.includes('lang="fr"')) errors.push(`${file}: attribut lang="fr" manquant`);
  if (!source.includes("Aller au contenu")) errors.push(`${file}: lien d'évitement manquant`);
  if (/lorem ipsum/i.test(source)) errors.push(`${file}: lorem ipsum détecté`);

  const imgTags = source.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imgTags) {
    if (!/\salt=/.test(tag)) errors.push(`${file}: image sans attribut alt: ${tag}`);
    if (!/\swidth=/.test(tag) || !/\sheight=/.test(tag)) errors.push(`${file}: image sans dimensions explicites: ${tag}`);
  }
}

const index = read("index.html");
[
  'role="tablist"',
  'role="tab"',
  'role="tabpanel"',
  'aria-expanded',
  'aria-controls',
  'id="launch-form"',
  'id="display-preferences"'
].forEach((needle) => {
  if (!index.includes(needle)) errors.push(`index.html: marqueur accessibilité manquant: ${needle}`);
});

const css = read("styles.css");
[
  "--color-pink",
  "--color-red",
  "--color-green",
  "--color-blue",
  "--color-orange",
  "prefers-reduced-motion",
  ":focus-visible"
].forEach((needle) => {
  if (!css.includes(needle)) errors.push(`styles.css: token ou règle manquante: ${needle}`);
});

const content = read("content.js");
if (!content.includes("targetAgeRange")) errors.push("content.js: targetAgeRange manquant");
if (!content.includes("learningCategories")) errors.push("content.js: learningCategories manquant");
if (!content.includes("releaseStatus")) errors.push("content.js: releaseStatus manquant");

if (errors.length) {
  console.error(`Échec ${mode}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`OK ${mode}: structure, contenus critiques, images et marqueurs d'accessibilité vérifiés.`);

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function count(source, regex) {
  return (source.match(regex) || []).length;
}
