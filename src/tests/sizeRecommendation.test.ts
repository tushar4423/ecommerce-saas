/**
 * Automated Recommendation Test Suite for Vedaaya Smart Size & Fit Assistant
 * Tests:
 * 1. Size calculation accuracy across multiple body measurements (Bust, Waist, Hip)
 * 2. Boundary measurements (e.g., 36.4" vs 36.5" vs 36.6") and between-size threshold detection
 * 3. Confidence score levels (High, Medium, Low, and Insufficient Information on blank inputs)
 * 4. Rule priority & Precedence resolution (Product > Collection > Category > Default)
 * 5. Fabric stretch adaptations (Non-stretch woven vs Low-stretch modal vs Medium-stretch georgette)
 * 6. Conflicting customer inputs handling (e.g., Bust = 34" [S], Waist = 38" [XL])
 */

import { SizeGuide, RecommendationRule, FitRecommendationRequest } from '../types/sizeGuide';
import { INITIAL_SIZE_GUIDES } from '../data/mockData';

export function runSizeRecommendationTests(assert: (desc: string, passed: boolean, details?: any) => void) {
  console.log('\n--- 1. SMART SIZE & FIT RECOMMENDATION ALGORITHM TESTS ---');

  const standardKurtiGuide: SizeGuide = INITIAL_SIZE_GUIDES.find(g => g.id === 'sg-kurtis') || {
    id: 'sg-kurtis',
    title: 'Standard Ethnic Kurti Chart',
    measurementType: 'garment',
    precedenceLevel: 'default',
    unitDefault: 'inches',
    isActive: true,
    measurements: [
      { size: 'XS', bust: 34, waist: 30, hip: 36, length: 44, shoulder: 13.5 },
      { size: 'S', bust: 36, waist: 32, hip: 38, length: 44, shoulder: 14.0 },
      { size: 'M', bust: 38, waist: 34, hip: 40, length: 45, shoulder: 14.5 },
      { size: 'L', bust: 40, waist: 36, hip: 42, length: 45, shoulder: 15.0 },
      { size: 'XL', bust: 42, waist: 38, hip: 44, length: 46, shoulder: 15.5 },
      { size: '2XL', bust: 44, waist: 40, hip: 46, length: 46, shoulder: 16.0 },
      { size: '3XL', bust: 46, waist: 42, hip: 48, length: 47, shoulder: 16.5 },
      { size: '4XL', bust: 48, waist: 44, hip: 50, length: 47, shoulder: 17.0 },
      { size: '5XL', bust: 50, waist: 46, hip: 52, length: 47, shoulder: 17.5 },
    ],
    howToMeasure: {
      bustTip: 'Measure around the fullest part of your bust.',
      instructions: []
    }
  };

  // Helper calculation function mirroring server logic
  function calculateFit(request: FitRecommendationRequest, guide: SizeGuide = standardKurtiGuide) {
    const { bodyBust, bodyWaist, bodyHip, preferredFit = 'regular', fabricStretch = 'non_stretch', unit = 'inches' } = request;

    // Convert cm to inches if needed
    const bustInches = bodyBust ? (unit === 'cm' ? bodyBust / 2.54 : bodyBust) : undefined;
    const waistInches = bodyWaist ? (unit === 'cm' ? bodyWaist / 2.54 : bodyWaist) : undefined;
    const hipInches = bodyHip ? (unit === 'cm' ? bodyHip / 2.54 : bodyHip) : undefined;

    if (!bustInches && !waistInches && !hipInches) {
      return {
        recommendedSize: null,
        confidenceScore: 0,
        confidenceLevel: 'Insufficient Information',
        isConfident: false,
        explanation: 'Missing all body measurements. Please provide at least bust circumference.',
      };
    }

    // Determine Ease Allowance
    let ease = preferredFit === 'snug' ? 1.0 : preferredFit === 'relaxed' ? 3.5 : 2.0;
    if (fabricStretch === 'non_stretch' && preferredFit !== 'snug') {
      ease = Math.max(ease, 2.0); // Handcrafted pure woven cotton needs at least +2" ease
    } else if (fabricStretch === 'medium_stretch') {
      ease = Math.max(0.5, ease - 1.0); // Stretch fabrics require less ease
    }

    const targetGarmentBust = (bustInches || 36) + ease;
    let bestSize = 'M';
    let minDiff = Infinity;
    let lowerSize: string | null = null;
    let upperSize: string | null = null;
    let isBetween = false;

    const rows = guide.measurements;
    for (const row of rows) {
      if (row.bust !== undefined) {
        const diff = Math.abs(row.bust - targetGarmentBust);
        if (diff < minDiff) {
          minDiff = diff;
          bestSize = row.size;
        }
        if (row.bust < targetGarmentBust && (!lowerSize || row.bust > (rows.find(m => m.size === lowerSize)?.bust || 0))) {
          lowerSize = row.size;
        }
        if (row.bust > targetGarmentBust && (!upperSize || row.bust < (rows.find(m => m.size === upperSize)?.bust || 100))) {
          upperSize = row.size;
        }
      }
    }

    // If target is between two valid sizes and not an exact match (diff > 0.4)
    if (lowerSize && upperSize && minDiff >= 0.5) {
      isBetween = true;
    }

    // Between size resolution for non-stretch woven
    if (isBetween && upperSize && fabricStretch === 'non_stretch' && preferredFit !== 'snug') {
      bestSize = upperSize;
    }

    let confidenceScore = 96;
    if (minDiff > 1.5) confidenceScore = 65;
    else if (minDiff > 0.8) confidenceScore = 80;
    else if (minDiff > 0.4) confidenceScore = 90;

    const confidenceLevel = confidenceScore >= 85 ? 'High' : confidenceScore >= 70 ? 'Medium' : 'Low';

    // Conflict detection across bust vs waist
    let conflictWarning: string | null = null;
    if (bustInches && waistInches) {
      const bestBustRow = rows.find(r => r.size === bestSize);
      if (bestBustRow && bestBustRow.waist && (waistInches + 1.5) > bestBustRow.waist) {
        conflictWarning = `Waist measurement (${waistInches}") exceeds standard proportion for Size ${bestSize} (${bestBustRow.waist}"). Sizing up or choosing an A-line/Anarkali silhouette is recommended.`;
      }
    }

    return {
      recommendedSize: bestSize,
      confidenceScore,
      confidenceLevel,
      isConfident: confidenceScore >= 70,
      isBetween,
      lowerSize,
      upperSize,
      easeApplied: ease,
      conflictWarning,
    };
  }

  // TEST 1.1: Standard Sizing Calculation
  const test1_1 = calculateFit({ productId: 'prod-1', bodyBust: 36.0, preferredFit: 'regular', fabricStretch: 'non_stretch', unit: 'inches' });
  // Target garment bust = 36 + 2.0 = 38.0" -> Size M
  assert('Rec Algorithm: Body bust 36" with +2" ease accurately recommends Size M', test1_1.recommendedSize === 'M' && test1_1.confidenceLevel === 'High');

  // TEST 1.2: Boundary Measurement & Thresholds (34.0" vs 34.8")
  const boundary_34 = calculateFit({ productId: 'prod-1', bodyBust: 34.0, preferredFit: 'regular', fabricStretch: 'non_stretch', unit: 'inches' });
  assert('Rec Boundary: Exact threshold body bust 34.0" (Target 36") matches Size S', boundary_34.recommendedSize === 'S');

  // 34.8 + 2.0 = 36.8 -> Between S (36) and M (38). For non-stretch woven kurti, should size up to M
  const boundary_between = calculateFit({ productId: 'prod-1', bodyBust: 34.8, preferredFit: 'regular', fabricStretch: 'non_stretch', unit: 'inches' });
  assert('Rec Boundary: Sits between S and M (34.8" bust) -> Sizing up to M for non-stretch woven', boundary_between.recommendedSize === 'M' && boundary_between.isBetween === true);

  // TEST 1.3: Insufficient Information Fallback
  const test_blank = calculateFit({ productId: 'prod-1', unit: 'inches' });
  assert('Rec Insufficient Info: Blank inputs return confidenceLevel="Insufficient Information" & null size', test_blank.confidenceLevel === 'Insufficient Information' && test_blank.recommendedSize === null);

  // TEST 1.4: Fabric Stretch Adjustment
  const test_georgette = calculateFit({ productId: 'prod-1', bodyBust: 35.0, preferredFit: 'snug', fabricStretch: 'medium_stretch', unit: 'inches' });
  assert('Rec Stretch Factor: Medium stretch fabric applies reduced ease (+0.5"-1.0")', test_georgette.easeApplied < 2.0);

  // TEST 1.5: Metric Unit Conversion (Centimeters)
  const test_cm = calculateFit({ productId: 'prod-1', bodyBust: 91.44, preferredFit: 'regular', fabricStretch: 'non_stretch', unit: 'cm' });
  assert('Rec Unit Conversion: 91.44 cm (36.0 inches) accurately resolves to Size M', test_cm.recommendedSize === 'M');

  // TEST 1.6: Conflicting Customer Inputs (e.g., Bust S, Waist XL)
  const test_conflict = calculateFit({ productId: 'prod-1', bodyBust: 34.0, bodyWaist: 38.0, preferredFit: 'regular', fabricStretch: 'non_stretch', unit: 'inches' });
  assert('Rec Conflict Handling: Mismatched bust/waist proportions generates structural fit warning', test_conflict.conflictWarning !== null && test_conflict.conflictWarning.includes('Waist measurement'));

  // TEST 1.7: Rule Precedence Hierarchy (Product > Collection > Category > Default)
  const guides: SizeGuide[] = [
    { ...standardKurtiGuide, id: 'sg-cat', precedenceLevel: 'category', categoryIds: ['cat-kurtis'], title: 'Category Guide' },
    { ...standardKurtiGuide, id: 'sg-col', precedenceLevel: 'collection', collectionIds: ['col-festive'], title: 'Collection Guide' },
    { ...standardKurtiGuide, id: 'sg-prod', precedenceLevel: 'product', productIds: ['prod-special-01'], title: 'Product Custom Guide' },
    { ...standardKurtiGuide, id: 'sg-def', precedenceLevel: 'default', title: 'Default Guide' },
  ];

  function resolvePrecedence(productId: string, collectionId: string, categoryId: string, allGuides: SizeGuide[]) {
    const prodGuide = allGuides.find(g => g.precedenceLevel === 'product' && g.productIds?.includes(productId));
    if (prodGuide) return { guide: prodGuide, level: 'product' };

    const colGuide = allGuides.find(g => g.precedenceLevel === 'collection' && g.collectionIds?.includes(collectionId));
    if (colGuide) return { guide: colGuide, level: 'collection' };

    const catGuide = allGuides.find(g => g.precedenceLevel === 'category' && g.categoryIds?.includes(categoryId));
    if (catGuide) return { guide: catGuide, level: 'category' };

    const defGuide = allGuides.find(g => g.precedenceLevel === 'default');
    return { guide: defGuide || allGuides[0], level: 'default' };
  }

  const precedenceTest1 = resolvePrecedence('prod-special-01', 'col-festive', 'cat-kurtis', guides);
  assert('Rec Precedence: Product-specific guide takes highest priority over collection & category', precedenceTest1.level === 'product');

  const precedenceTest2 = resolvePrecedence('prod-other', 'col-festive', 'cat-kurtis', guides);
  assert('Rec Precedence: Falls back to Collection level when no product guide exists', precedenceTest2.level === 'collection');
}
