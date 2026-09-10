/**
 * Master Automated Test Runner for Vedaaya Ethnic Studio
 * Executes all critical business, security, and Smart Size & Fit test suites:
 * 1. Pricing, GST Tax & Free Shipping Calculation Tests
 * 2. Coupon Validation & Maximum Cap Rule Tests
 * 3. Inventory Stock Decoupling & Atomic Exhaustion Tests
 * 4. Anti-Tampering & Security Header Verification Tests
 * 5. Indian Address Schema & Logistics Routing Tests
 * 6. Smart Size & Fit Recommendation Algorithm Tests
 * 7. Admin Size Guide Creation, Import & Version Rollback Tests
 * 8. Order & Return Recommendation-Link Integration Tests
 */
import { runPricingTests } from './pricing.test';
import { runCouponTests } from './coupons.test';
import { runInventoryTests } from './inventory.test';
import { runSecurityTests } from './security.test';
import { runCheckoutTests } from './checkout.test';
import { runSizeRecommendationTests } from './sizeRecommendation.test';
import { runAdminSizeGuideWorkflowTests } from './adminSizeGuideWorkflow.test';
import { runOrderRecommendationLinkTests } from './orderRecommendationLink.test';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

function assert(description: string, passed: boolean, details?: any) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${description}`);
  } else {
    failedTests++;
    console.log(`  \x1b[31m✖ FAIL\x1b[0m ${description}`);
    if (details) {
      console.log(`    \x1b[90mDetails:\x1b[0m`, details);
    }
    failures.push(description);
  }
}

console.log('================================================================');
console.log('   VEDAAYA ETHNIC STUDIO — MASTER AUTOMATED TEST SUITE        ');
console.log('================================================================');

runPricingTests(assert);
runCouponTests(assert);
runInventoryTests(assert);
runSecurityTests(assert);
runCheckoutTests(assert);
runSizeRecommendationTests(assert);
runAdminSizeGuideWorkflowTests(assert);
runOrderRecommendationLinkTests(assert);

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${totalTests} Total | \x1b[32m${passedTests} Passed\x1b[0m | \x1b[31m${failedTests} Failed\x1b[0m | Pass Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
console.log('================================================================');

if (failedTests > 0) {
  console.error(`\x1b[31m${failedTests} tests failed!\x1b[0m`);
  process.exit(1);
} else {
  console.log('\x1b[32mAll critical business, security, and Smart Fit tests passed successfully!\x1b[0m\n');
}
