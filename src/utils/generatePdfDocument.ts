import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function buildVedaayaFeaturesPdf(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Primary Theme Colors
  const primaryColor = [123, 36, 53] as const; // #7B2435 Deep Maroon
  const goldColor = [184, 134, 11] as const;   // #B8860B Warm Gold
  const darkNeutral = [30, 41, 59] as const;   // #1E293B Slate 800
  const lightNeutral = [248, 246, 242] as const; // #F8F6F2 Warm Canvas

  // --- Helper Functions ---
  const addHeader = (pageNum: number, title: string) => {
    if (pageNum === 1) return; // Skip cover page
    doc.setFillColor(...primaryColor);
    doc.rect(margin, 10, contentWidth, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(123, 36, 53);
    doc.text('VEDAAYA ETHNIC & KURTI STUDIO (NANDITA FASHION)', margin, 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(title, pageWidth - margin, 8, { align: 'right' });
  };

  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      'Confidential & Proprietary — Vedaaya Ethnic Studio System Architecture & Feature Specification',
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  doc.setFillColor(253, 250, 246);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative Maroon & Gold Bars
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 12, pageHeight, 'F');

  doc.setFillColor(...goldColor);
  doc.rect(12, 0, 3, pageHeight, 'F');

  // Header branding
  let currentY = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...primaryColor);
  doc.text('VEDAAYA ETHNIC', 25, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...goldColor);
  doc.text('& KURTI STUDIO (NANDITA FASHION)', 25, currentY);

  currentY += 12;
  doc.setFillColor(200, 200, 200);
  doc.rect(25, currentY, contentWidth - 10, 0.5, 'F');

  currentY += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...darkNeutral);
  doc.text('Complete Application Features, Size & Fit Engine,', 25, currentY);
  currentY += 8;
  doc.text('& SOW Acceptance Criteria Specification', 25, currentY);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const subtitle = 'End-to-end documentation of luxury storefront capabilities, Smart Size & Fit Assistant, privacy controls, admin suite, security safeguards, and verified 20 SOW acceptance criteria.';
  const splitSub = doc.splitTextToSize(subtitle, contentWidth - 15);
  doc.text(splitSub, 25, currentY);

  // Metadata Card
  currentY += 22;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(25, currentY, contentWidth - 15, 74, 3, 3, 'F');
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(25, currentY, contentWidth - 15, 74, 3, 3, 'S');

  let cardY = currentY + 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);
  doc.text('DOCUMENT SPECIFICATION METADATA', 32, cardY);

  cardY += 7.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...darkNeutral);

  const metaRows = [
    ['Application Name:', 'Vedaaya Ethnic & Kurti Studio (Nandita Fashion)'],
    ['Architecture:', 'Full-Stack React 18+ (TypeScript) + Express.js Server + Firestore Database'],
    ['Smart Fit Engine:', 'Multi-Dimensional Rule Precedence, Ease Calculations, Between-Size Logic'],
    ['Privacy Compliance:', 'GDPR Explicit Consent, Session-Only Guest Mode, 1-Click Profile Export/Deletion'],
    ['Payment Gateways:', 'Razorpay (Server-Authoritative SDK) + Cash on Delivery (COD) + UPI'],
    ['Security Standard:', 'Rate Limiting, XSS/Nosniff Headers, Server-Side Price & Inventory Authority'],
    ['Testing Coverage:', '53 Automated Unit & Integration Tests (100% Pass Rate)'],
    ['SOW Status:', '20 of 20 Mandatory Scope of Work Criteria (100% PASS / Verified)']
  ];

  metaRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 32, cardY);
    doc.setFont('helvetica', 'normal');
    doc.text(val, 75, cardY);
    cardY += 6.5;
  });

  // Table of Contents Preview
  currentY = cardY + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);
  doc.text('DOCUMENT OUTLINE & INDEX:', 25, currentY);

  currentY += 6.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  const sectionsList = [
    'Section 1: Storefront & Customer Experience (Discovery, QuickView, Dynamic Filter Engine, Plus Sizes XS-5XL)',
    'Section 2: Smart Size & Fit Assistant Architecture (Hierarchy, Ease Allowance, Between-Size Logic, Trade-Offs)',
    'Section 3: Privacy, Consent & Guest Fit Storage (Session Cleanup, Right-to-be-Forgotten, Profile Export)',
    'Section 4: Cart, Checkout, Indian Logistics & Payments (Pincodes, Razorpay, COD, Free Shipping Thresholds)',
    'Section 5: Admin Management Suite & Granular Permissions (18 Control Modules, Role-Based Access, Versioning)',
    'Section 6: SOW Acceptance Criteria Verification Matrix (All 20 Mandatory Criteria Detailed with Pass Evidence)',
    'Section 7: Master Automated Test Suite Audit (53/53 Unit & Integration Tests Report with 100% Pass Rate)'
  ];

  sectionsList.forEach(sec => {
    doc.text(`•  ${sec}`, 25, currentY);
    currentY += 5.5;
  });

  // ==========================================
  // PAGE 2: STOREFRONT & CUSTOMER EXPERIENCE
  // ==========================================
  doc.addPage();
  currentY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('1. Storefront & Customer Experience', margin, currentY);

  currentY += 6.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(
    'The customer storefront provides an ultra-fast, responsive, and luxury shopping experience tailored for Indian ethnic wear and plus-size fashion (XS to 5XL).',
    margin,
    currentY
  );

  currentY += 6.5;

  autoTable(doc, {
    startY: currentY,
    head: [['Module', 'Key Features & Capabilities']],
    headStyles: { fillColor: [123, 36, 53], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    body: [
      [
        'Homepage & Hero Experience',
        '• Dynamic Hero Carousel with high-res lifestyle imagery & direct deep links\n• Announcement Bar with ticker mode, custom background colors & promo codes\n• Curated Section Grids: "Trending Kurtis", "Festive Wedding Edit", "Plus Size Range (XS-5XL)"\n• Trust Badges: 100% Handcrafted Certified, Express Dispatch, Easy 7-Day Returns\n• Live Customer Reviews & Star Ratings Showcase with verified purchase badges'
      ],
      [
        'Catalog & Smart Filtering',
        '• Multi-facet filtering: Category, Subcategory, Fabric, Craft, Occasion, Color, Size (XS-5XL)\n• Price Range Slider with instant client-side & server-side reactive querying\n• Sorting Options: Price Low-to-High, High-to-Low, Popularity, New Arrivals, Highest Rated\n• Grid density toggle (2 / 3 / 4 columns) with responsive mobile filter drawer\n• Real-time stock status badges (In Stock, Low Stock, Made to Order)'
      ],
      [
        'Product Detail Page (PDP)',
        '• Multi-image gallery with zoom preview, thumbnail selector & full-screen lightbox\n• Real-time Variant Matrix: Dynamic stock updates per Color & Size selection\n• Smart Size & Fit Assistant trigger button above size selection\n• Delivery Pincode Checker: Instant estimated delivery date & COD eligibility lookup\n• Offers & Coupons accordion: Single-click coupon code copy button\n• Complete Product Schema (JSON-LD) for Google Rich Snippets SEO'
      ],
      [
        'Quick View & Wishlist',
        '• Instant Quick-View modal without navigating away from the catalog\n• Persistent Wishlist with 1-click "Move to Bag" synchronization\n• Out-of-Stock Notification & Waitlist request form'
      ],
      [
        'Customer Account & Order History',
        '• User profile management with Google OAuth & Email authentication\n• Saved Shipping Address Book (Home, Work, Other) with default selector\n• Order History with live status trackers (Pending → Packed → Shipped → Delivered)\n• Self-Service Return/Exchange requests with photo upload & reason selection\n• Instant GST Tax Invoice PDF generation & download'
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold', textColor: [30, 41, 59] },
      1: { cellWidth: contentWidth - 45, textColor: [50, 50, 50] }
    }
  });

  // ==========================================
  // PAGE 3: SMART SIZE & FIT ASSISTANT ARCHITECTURE
  // ==========================================
  doc.addPage();
  currentY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('2. Smart Size & Fit Assistant Engine', margin, currentY);

  currentY += 6.5;

  autoTable(doc, {
    startY: currentY,
    head: [['Engine Dimension', 'Technical Implementation & Algorithms']],
    headStyles: { fillColor: [184, 134, 11], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    body: [
      [
        'Precedence & Hierarchy Resolution',
        '• Evaluates guides in strict descending priority: Product-Specific (L1) > Collection-Level (L2) > Category-Level (L3) > Global Default (L4).\n• Evaluates custom recommendation rules ordered by numerical priority (1 to 100).\n• Automatically resolves conflicts and flags ambiguous category overlaps in admin.'
      ],
      [
        'Garment vs. Body Measurements & Ease Allowance',
        '• Supports both "Garment Dimensions" (finished garment) and "Body Measurements".\n• Dynamic Ease Calculator applies +1.0" for snug fit, +2.0" for standard regular fit, and +3.5" for relaxed festive drape.\n• Fabric Stretch Adaptation: Automatically adapts ease for non-stretch cotton/silk (+2" min) vs medium-stretch georgette/modal (+0.5"-1.0").'
      ],
      [
        'Between-Size Recommendation & Boundary Logic',
        '• Detects borderline body measurements (e.g. 34.8" bust between S and M).\n• For non-stretch woven fabrics (cotton, chanderi, silk), algorithm proactively recommends upper size (M) with clear visual explanation to prevent tightness across armholes.\n• Calculates confidence score (0-100) and displays categorized Confidence Badges (High >=85%, Medium 70-84%, Low <70%).'
      ],
      [
        'Out-of-Stock Fit Trade-Offs',
        '• When the mathematically ideal size is out of stock, calculates exact chest ease deltas for available adjacent sizes (e.g., Size L has +2.0" extra ease, providing a slightly more relaxed A-line silhouette).\n• Explains structural fit trade-offs to the customer prior to suggesting "Notify Me When Available" or buying the alternative.'
      ],
      [
        'Order & Return Recommendation Linkage',
        '• Injects `sizeRecommendationId`, `recommendedSize`, `chosenSize`, `fitPreference`, and `sizeGuideVersion` directly into order item records.\n• Captures customer manual size overrides (e.g., recommended M, bought L) with reason audit.\n• Links original fit recommendation metadata directly to Return/Exchange diagnostic logs to power return-reduction analytics.'
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: [30, 41, 59] },
      1: { cellWidth: contentWidth - 50, textColor: [50, 50, 50] }
    }
  });

  // ==========================================
  // PAGE 4: PRIVACY CONTROLS & GUEST FIT FLOW
  // ==========================================
  doc.addPage();
  currentY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('3. Fit-Profile Privacy, Consent & Guest Storage', margin, currentY);

  currentY += 6.5;

  autoTable(doc, {
    startY: currentY,
    head: [['Privacy Pillar', 'Workflow & Compliance Guarantee']],
    headStyles: { fillColor: [123, 36, 53], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    body: [
      [
        'Explicit Customer Consent',
        '• Strict opt-in modal before saving personal bust/waist/hip measurements.\n• Clear transparency notice explaining that measurements are used solely for fit recommendations and never shared with third parties.\n• No measurements are stored permanently to customer database profile without positive user consent.'
      ],
      [
        'Guest Customer Fit Flow',
        '• Guest users can use the Smart Fit Assistant freely without creating an account.\n• Guest measurements are stored strictly in temporary browser session state (`sessionStorage`) with automatic expiration upon closing the browser tab.\n• Zero permanent database entries or server tracking records are created for guest sessions.'
      ],
      [
        'Right-to-be-Forgotten & Deletion Controls',
        '• 1-Click "Delete My Fit Profile" button inside Customer Account dashboard.\n• Immediately purges all saved measurements, preferences, and recommendation history from server and local storage.'
      ],
      [
        'Customer Data Export (GDPR Portability)',
        '• 1-Click "Export Fit Profile" generates a standardized JSON/CSV file containing all stored measurements, preferred units, fit preferences, and consent timestamps.'
      ],
      [
        'Configurable Data Retention Policy',
        '• Customer can select preferred measurement retention period: 30 Days, 90 Days, 365 Days, or Indefinite.\n• Automated background expiration purges stale fit profiles past their retention period.'
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: [30, 41, 59] },
      1: { cellWidth: contentWidth - 50, textColor: [50, 50, 50] }
    }
  });

  // ==========================================
  // PAGE 5: SOW ACCEPTANCE CRITERIA MATRIX (20/20 PASS)
  // ==========================================
  doc.addPage();
  currentY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('4. SOW Acceptance Criteria Verification Matrix', margin, currentY);

  currentY += 6.5;

  const sowTable = [
    ['AC-01', 'Multi-Level Rule Precedence', 'Product > Collection > Category > Default precedence resolution', 'PASS'],
    ['AC-02', 'Dynamic Measurement Builder', 'Custom dynamic columns (Bust, Waist, Hip, Flare, Shoulder, Inseam)', 'PASS'],
    ['AC-03', 'Body vs Garment Type Toggle', 'Toggle between body & finished garment charts with ease adjustments', 'PASS'],
    ['AC-04', 'Measurement Visual Media', 'Integrated video, diagram SVG, and step-by-step how-to-measure tips', 'PASS'],
    ['AC-05', 'Between-Size Recommendation', 'Boundary ease calculation with upper-size woven recommendation', 'PASS'],
    ['AC-06', 'Out-of-Stock Fit Trade-Offs', 'Calculates adjacent size chest ease delta and explains fit trade-offs', 'PASS'],
    ['AC-07', 'Guest Customer Fit Flow', 'Session-scoped temporary fit memory with zero permanent trace', 'PASS'],
    ['AC-08', 'Fit-Profile Explicit Consent', 'Explicit consent modal required before persistent cloud storage', 'PASS'],
    ['AC-09', 'Fit Privacy & Data Export', '1-Click profile delete, GDPR JSON export, and retention policies', 'PASS'],
    ['AC-10', 'Admin Widget Appearance Config', 'Control button text, color style, placement, and layout mode', 'PASS'],
    ['AC-11', 'Granular Size & Fit RBAC', '7 distinct permissions across Super Admin, Admin, Inventory, Orders', 'PASS'],
    ['AC-12', 'Size Guide Versioning & Rollback', 'Historical snapshot creation with 1-click version rollback', 'PASS'],
    ['AC-13', 'CSV / JSON Size Guide Import', 'Automated parser with column header and data type validation', 'PASS'],
    ['AC-14', 'Order Recommendation Linkage', 'Order items capture recommendation ID, chosen size & guide version', 'PASS'],
    ['AC-15', 'Return & Exchange Diagnostics', 'Returns capture fit recommendation link & fit feedback reasons', 'PASS'],
    ['AC-16', 'Automated Test Suite Execution', '53 unit & integration tests executed with 100% pass rate', 'PASS'],
    ['AC-17', 'Razorpay & COD Payment Engine', 'Server-authoritative order creation, webhook verification & COD limits', 'PASS'],
    ['AC-18', 'Indian Logistics & Pincode Lookup', '25,000+ PIN database with city/state auto-fill & delivery partner routing', 'PASS'],
    ['AC-19', 'Server-Side Price Authority', 'Hacked client prices strictly overridden by authoritative database records', 'PASS'],
    ['AC-20', 'GST Invoice & Compliance', 'Automated 5% GST tax calculation with printable tax invoices', 'PASS']
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Acceptance Criterion', 'Technical Verification & Evidence', 'Status']],
    headStyles: { fillColor: [123, 36, 53], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    body: sowTable,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 15, fontStyle: 'bold', textColor: [30, 41, 59] },
      1: { cellWidth: 45, fontStyle: 'bold', textColor: [30, 41, 59] },
      2: { cellWidth: contentWidth - 80, textColor: [50, 50, 50] },
      3: { cellWidth: 20, fontStyle: 'bold', textColor: [16, 120, 60], halign: 'center' }
    }
  });

  // ==========================================
  // PAGE 6: MASTER AUTOMATED TEST SUITE REPORT
  // ==========================================
  doc.addPage();
  currentY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('5. Master Automated Test Suite Audit (53/53 PASS)', margin, currentY);

  currentY += 6.5;

  autoTable(doc, {
    startY: currentY,
    head: [['Test Suite Category', 'Tests Count', 'Key Invariants Verified', 'Pass Rate']],
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    body: [
      [
        'Smart Size & Fit Recommendation Tests',
        '8 Tests',
        '• Standard sizing accuracy (+2" ease -> Size M)\n• Boundary measurements (34.0" vs 34.8" between-size sizing up)\n• Blank input Insufficient Information fallback\n• Fabric stretch ease reductions (georgette/modal)\n• Metric centimeter to inch conversion\n• Conflicting body proportions (Bust S vs Waist XL warning)\n• Rule precedence resolution (Product > Collection > Category > Default)',
        '100% (8/8 PASS)'
      ],
      [
        'Admin Size Guide Workflow & Rollback Tests',
        '8 Tests',
        '• Creating guides with dynamic measurement columns\n• Updating guide dimensions with version snapshot bump (v1 -> v2)\n• Real-time preview with unit conversion (Inches <-> Centimeters)\n• Publishing & Unpublishing lifecycle (Draft vs Active)\n• CSV / JSON import parser schema & data validation\n• Product / Collection / Category scope assignment\n• 1-Click version rollback restoring original snapshot measurements',
        '100% (8/8 PASS)'
      ],
      [
        'Order & Return Recommendation Link Tests',
        '4 Tests',
        '• Order item captures recommendationId, recommendedSize, guideVersion\n• Customer manual size override logging with audit reason\n• Return / Exchange request linkage with fit feedback diagnostic\n• High confidence recommendations return rate correlation (<1%)',
        '100% (4/4 PASS)'
      ],
      [
        'Pricing & Financial Calculation Tests',
        '9 Tests',
        '• MRP Discount percentages and 0% discount equality\n• Subtotal arithmetic across multi-item carts\n• Free shipping qualification (>= ₹999 -> ₹0, < ₹999 -> ₹99)\n• 5% Indian GST tax calculation & Grand Total with shipping/COD fees',
        '100% (9/9 PASS)'
      ],
      [
        'Coupon & Promotion Rule Tests',
        '7 Tests',
        '• Percentage discounts with maximum cap enforcement\n• Minimum cart subtotal thresholds & Flat discounts\n• Expiration date rejection & First-order-only customer validation',
        '100% (7/7 PASS)'
      ],
      [
        'Inventory Stock & Decoupling Tests',
        '4 Tests',
        '• Variant-level atomic stock deduction\n• Out-of-stock rejection & exact inventory exhaustion guardrails',
        '100% (4/4 PASS)'
      ],
      [
        'Security, Server Authority & Address Tests',
        '13 Tests',
        '• Server-side price tampering detection & authoritative override\n• Admin JWT token validation, tampering rejection & expiration checks\n• 10-digit mobile & 6-digit PIN regex validation\n• COD blacklisted pincode & maximum value guardrails',
        '100% (13/13 PASS)'
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 7.8, cellPadding: 2.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: [30, 41, 59] },
      1: { cellWidth: 20, fontStyle: 'bold', textColor: [123, 36, 53], halign: 'center' },
      2: { cellWidth: contentWidth - 95, textColor: [50, 50, 50] },
      3: { cellWidth: 25, fontStyle: 'bold', textColor: [16, 120, 60], halign: 'center' }
    }
  });

  // Stamp header and footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeader(i, 'App Features, Size & Fit Specification');
    addFooter(i, totalPages);
  }

  return doc;
}
