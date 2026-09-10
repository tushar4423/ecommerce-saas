import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');

function evaluateDataFile(relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  let source = fs.readFileSync(sourcePath, 'utf8');
  const firstExport = source.indexOf('export const ');
  if (firstExport < 0) {
    throw new Error(`No exported constants found in ${relativePath}`);
  }
  source = source.slice(firstExport);
  source = source.replace(/export const (\w+)(?::[^=]+)?\s*=/g, 'globalThis.$1 =');
  source = source.replace(/\s+as const/g, '');

  const context = { Date, console };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: relativePath, timeout: 5000 });
  return context;
}

const mock = evaluateDataFile('src/data/mockData.ts');
const gini = evaluateDataFile('src/data/giniDefaults.ts');

const seed = {
  settings: mock.INITIAL_SETTINGS,
  categories: mock.INITIAL_CATEGORIES,
  collections: mock.INITIAL_COLLECTIONS,
  banners: mock.INITIAL_HERO_BANNERS,
  products: mock.INITIAL_PRODUCTS,
  users: mock.INITIAL_CUSTOMERS,
  coupons: mock.INITIAL_COUPONS,
  announcements: mock.INITIAL_ANNOUNCEMENTS,
  navigationMenu: mock.INITIAL_MEGA_MENU,
  homepageSections: mock.INITIAL_HOMEPAGE_SECTIONS,
  attributes: mock.INITIAL_ATTRIBUTE_GROUPS,
  sizeGroups: mock.INITIAL_SIZE_GROUPS,
  colors: mock.INITIAL_STORE_COLORS,
  sizeGuides: mock.INITIAL_SIZE_GUIDES,
  giniSettings: gini.INITIAL_GINI_SETTINGS,
  giniTestFixtures: gini.INITIAL_GINI_TEST_FIXTURES,
};

const outputPath = path.join(projectRoot, 'php-backend', 'seed-data.json');
fs.writeFileSync(outputPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
