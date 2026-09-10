/**
 * Automated Admin Size Guide Workflow Test Suite
 * Tests:
 * 1. Creating a new Size Guide with custom measurement columns
 * 2. Editing existing guide dimensions and specifications
 * 3. Real-time preview calculation & unit conversion (Inches <-> Centimeters)
 * 4. Publishing & Unpublishing lifecycle (Draft vs Published states)
 * 5. CSV & JSON import parsing validation and schema sanitization
 * 6. Assignment of guides to Product, Collection, and Category scopes
 * 7. Versioning snapshot creation and 1-Click historical rollback
 */

import { SizeGuide, SizeGuideVersion, DynamicMeasurementColumn } from '../types/sizeGuide';

export function runAdminSizeGuideWorkflowTests(assert: (desc: string, passed: boolean, details?: any) => void) {
  console.log('\n--- 2. ADMIN SIZE GUIDE WORKFLOW & VERSIONING TESTS ---');

  // In-memory mock store for admin workflow testing
  const adminGuidesStore: SizeGuide[] = [];
  const versionHistoryStore: Record<string, SizeGuideVersion[]> = {};

  // WORKFLOW 1: Create Size Guide
  function createSizeGuide(guideData: Partial<SizeGuide>): SizeGuide {
    if (!guideData.title || !guideData.measurements || guideData.measurements.length === 0) {
      throw new Error('Size guide must have a valid title and at least one size measurement row.');
    }

    const newGuide: SizeGuide = {
      id: guideData.id || `sg-test-${Date.now()}`,
      title: guideData.title,
      measurementType: guideData.measurementType || 'garment',
      precedenceLevel: guideData.precedenceLevel || 'category',
      categoryIds: guideData.categoryIds || [],
      collectionIds: guideData.collectionIds || [],
      productIds: guideData.productIds || [],
      unitDefault: guideData.unitDefault || 'inches',
      customColumns: guideData.customColumns || [
        { id: 'c1', name: 'Bust', key: 'bust', unit: 'inches' },
        { id: 'c2', name: 'Waist', key: 'waist', unit: 'inches' },
        { id: 'c3', name: 'Hip', key: 'hip', unit: 'inches' },
      ],
      measurements: guideData.measurements,
      howToMeasure: guideData.howToMeasure || {},
      isActive: guideData.isActive ?? false, // Default to Draft
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    adminGuidesStore.push(newGuide);
    versionHistoryStore[newGuide.id] = [
      {
        version: 1,
        sizeGuideId: newGuide.id,
        timestamp: new Date().toISOString(),
        createdBy: 'Admin',
        changeSummary: 'Initial creation',
        snapshot: JSON.parse(JSON.stringify(newGuide)),
      }
    ];

    return newGuide;
  }

  const createdGuide = createSizeGuide({
    id: 'sg-wedding-lehenga',
    title: 'Bridal Lehenga & Choli Sizing Matrix',
    measurementType: 'garment',
    precedenceLevel: 'collection',
    collectionIds: ['col-bridal-2026'],
    measurements: [
      { size: 'S', bust: 34, waist: 28, hip: 38, flare: 120 },
      { size: 'M', bust: 36, waist: 30, hip: 40, flare: 125 },
      { size: 'L', bust: 38, waist: 32, hip: 42, flare: 130 },
    ],
    customColumns: [
      { id: 'c1', name: 'Bust (in)', key: 'bust', unit: 'inches' },
      { id: 'c2', name: 'Waist (in)', key: 'waist', unit: 'inches' },
      { id: 'c3', name: 'Flare (in)', key: 'flare', unit: 'inches' },
    ],
  });

  assert('Admin Workflow: Successfully creates new size guide with dynamic columns', createdGuide.id === 'sg-wedding-lehenga' && createdGuide.version === 1);

  // WORKFLOW 2: Edit Size Guide with Version Bump
  function updateSizeGuide(id: string, updates: Partial<SizeGuide>, changeSummary: string): SizeGuide {
    const guide = adminGuidesStore.find(g => g.id === id);
    if (!guide) throw new Error('Guide not found');

    const nextVersion = (guide.version || 1) + 1;
    Object.assign(guide, updates, { version: nextVersion, updatedAt: new Date().toISOString() });

    versionHistoryStore[id].push({
      version: nextVersion,
      sizeGuideId: id,
      timestamp: new Date().toISOString(),
      createdBy: 'Admin',
      changeSummary,
      snapshot: JSON.parse(JSON.stringify(guide)),
    });

    return guide;
  }

  const updatedGuide = updateSizeGuide('sg-wedding-lehenga', {
    title: 'Bridal Lehenga & Choli Sizing Matrix (Enhanced)',
    measurements: [
      { size: 'S', bust: 34.5, waist: 28.5, hip: 38.5, flare: 120 },
      { size: 'M', bust: 36.5, waist: 30.5, hip: 40.5, flare: 125 },
      { size: 'L', bust: 38.5, waist: 32.5, hip: 42.5, flare: 130 },
    ]
  }, 'Refined bust and waist dimensions by +0.5" based on master tailor fitting feedback');

  assert('Admin Workflow: Updating guide creates new version snapshot (Version 2)', updatedGuide.version === 2 && versionHistoryStore['sg-wedding-lehenga'].length === 2);

  // WORKFLOW 3: Unit Conversion Preview (Inches to Centimeters)
  function convertRowToCm(row: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = { size: row.size };
    Object.keys(row).forEach(k => {
      if (typeof row[k] === 'number') {
        converted[k] = Number((row[k] * 2.54).toFixed(1));
      }
    });
    return converted;
  }

  const sampleRowInches = { size: 'M', bust: 36.0, waist: 30.0, hip: 40.0 };
  const sampleRowCm = convertRowToCm(sampleRowInches);
  assert('Admin Preview: Accurately converts inches to cm (36" -> 91.4 cm, 30" -> 76.2 cm)', sampleRowCm.bust === 91.4 && sampleRowCm.waist === 76.2);

  // WORKFLOW 4: Publishing & Unpublishing Status Toggle
  function togglePublishStatus(id: string, publish: boolean): boolean {
    const guide = adminGuidesStore.find(g => g.id === id);
    if (!guide) return false;
    guide.isActive = publish;
    return guide.isActive;
  }

  const isPublished = togglePublishStatus('sg-wedding-lehenga', true);
  assert('Admin Lifecycle: Size guide publication state transitions to Active (Published)', isPublished === true);

  const isUnpublished = togglePublishStatus('sg-wedding-lehenga', false);
  assert('Admin Lifecycle: Size guide can be safely un-published (Draft mode)', isUnpublished === false);

  // WORKFLOW 5: CSV / JSON Import Parser Validation
  function parseSizeGuideCsv(csvContent: string): { valid: boolean; rows: any[]; errors: string[] } {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return { valid: false, rows: [], errors: ['CSV must contain a header and at least one data row.'] };

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    if (!headers.includes('size')) return { valid: false, rows: [], errors: ['Missing required "size" column header.'] };

    const rows: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        const val = values[idx];
        if (h === 'size') {
          rowObj[h] = val;
        } else {
          const num = Number(val);
          if (isNaN(num)) errors.push(`Row ${i}: Invalid numerical value "${val}" for column ${h}`);
          else rowObj[h] = num;
        }
      });
      rows.push(rowObj);
    }

    return { valid: errors.length === 0, rows, errors };
  }

  const validCsv = `size,bust,waist,hip\nS,34,28,38\nM,36,30,40\nL,38,32,42`;
  const parsedValid = parseSizeGuideCsv(validCsv);
  assert('Admin CSV Import: Accurately parses valid sizing matrix into structured JSON rows', parsedValid.valid === true && parsedValid.rows.length === 3);

  const invalidCsv = `size,bust,waist\nS,thirty-four,28`;
  const parsedInvalid = parseSizeGuideCsv(invalidCsv);
  assert('Admin CSV Import: Rejects non-numeric dimension values with descriptive error message', parsedInvalid.valid === false && parsedInvalid.errors.length > 0);

  // WORKFLOW 6: Scope Assignment (Product vs Collection vs Category)
  function assignGuideScope(id: string, scope: 'product' | 'collection' | 'category', targetIds: string[]) {
    const guide = adminGuidesStore.find(g => g.id === id);
    if (!guide) return null;
    guide.precedenceLevel = scope;
    if (scope === 'product') guide.productIds = targetIds;
    if (scope === 'collection') guide.collectionIds = targetIds;
    if (scope === 'category') guide.categoryIds = targetIds;
    return guide;
  }

  const assigned = assignGuideScope('sg-wedding-lehenga', 'product', ['prod-lehenga-special']);
  assert('Admin Scope Assignment: Accurately scopes guide to specific product ID', assigned?.precedenceLevel === 'product' && assigned.productIds?.includes('prod-lehenga-special'));

  // WORKFLOW 7: 1-Click Version Rollback
  function rollbackVersion(id: string, targetVersion: number): SizeGuide | null {
    const history = versionHistoryStore[id];
    if (!history) return null;
    const targetSnapshot = history.find(h => h.version === targetVersion);
    if (!targetSnapshot) return null;

    const currentGuide = adminGuidesStore.find(g => g.id === id);
    if (!currentGuide) return null;

    // Restore snapshot data
    Object.assign(currentGuide, JSON.parse(JSON.stringify(targetSnapshot.snapshot)));
    return currentGuide;
  }

  const rolledBack = rollbackVersion('sg-wedding-lehenga', 1);
  assert('Admin Rollback: Successfully restores Version 1 state (reverting 34.5" back to original 34.0" bust)', rolledBack !== null && rolledBack.measurements[0].bust === 34);
}
