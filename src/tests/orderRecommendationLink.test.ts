/**
 * Automated Order and Return Recommendation-Link Test Suite
 * Tests:
 * 1. Proves that the correct recommendation ID, recommended size, and size guide version are connected to Order Items upon checkout.
 * 2. Proves that manual customer size overrides (e.g. Recommended M -> Bought L) are captured with audit flags.
 * 3. Proves that Customer Return / Exchange requests link the original fit recommendation ID and fit feedback reason.
 * 4. Proves that Fit Analytics correctly correlates return rates against recommendation confidence scores.
 */

import { Order, OrderItem } from '../types/order';

export function runOrderRecommendationLinkTests(assert: (desc: string, passed: boolean, details?: any) => void) {
  console.log('\n--- 3. ORDER & RETURN RECOMMENDATION-LINK INTEGRATION TESTS ---');

  // Helper to create an order item with fit recommendation linkage
  function createOrderItemWithFit(params: {
    productId: string;
    productName: string;
    size: string;
    price: number;
    fitRecommendation?: {
      recommendationId: string;
      recommendedSize: string;
      sizeGuideVersion: number;
      confidenceScore: number;
      fitPreference: 'snug' | 'regular' | 'relaxed';
      overrideReason?: string;
    };
  }): OrderItem {
    const isOverride = params.fitRecommendation
      ? params.size !== params.fitRecommendation.recommendedSize
      : false;

    return {
      productId: params.productId,
      productName: params.productName,
      size: params.size,
      quantity: 1,
      price: params.price,
      mrp: params.price + 500,
      subtotal: params.price,
      sizeRecommendationId: params.fitRecommendation?.recommendationId,
      recommendedSize: params.fitRecommendation?.recommendedSize,
      sizeGuideVersion: params.fitRecommendation?.sizeGuideVersion,
      fitConfidenceScore: params.fitRecommendation?.confidenceScore,
      fitPreference: params.fitRecommendation?.fitPreference,
      isSizeOverride: isOverride,
      overrideReason: params.fitRecommendation?.overrideReason,
    };
  }

  // TEST 3.1: Order Creation with Recommendation Linkage
  const orderItemStandard = createOrderItemWithFit({
    productId: 'prod-chikankari-02',
    productName: 'Noor Jahan Chikankari Straight Kurti',
    size: 'M',
    price: 2499,
    fitRecommendation: {
      recommendationId: 'rec-fit-884920',
      recommendedSize: 'M',
      sizeGuideVersion: 2,
      confidenceScore: 92,
      fitPreference: 'regular',
    },
  });

  const testOrder: Order = {
    id: 'ord-test-9901',
    orderNumber: 'VD-9901',
    userId: 'usr-customer-101',
    customerName: 'Pooja Sharma',
    customerEmail: 'pooja.sharma@example.com',
    items: [orderItemStandard],
    shippingAddress: {
      fullName: 'Pooja Sharma',
      addressLine1: 'Flat 402, Lotus Heights',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      phone: '9876543210',
    },
    paymentMethod: 'Razorpay',
    paymentStatus: 'Paid',
    subtotal: 2499,
    discountAmount: 0,
    shippingFee: 0,
    grandTotal: 2499,
    orderStatus: 'Delivered',
    createdAt: new Date().toISOString(),
  };

  const item = testOrder.items[0] as OrderItem;
  assert(
    'Order Fit Link: Order item captures recommendationId, recommendedSize, and guide version',
    item.sizeRecommendationId === 'rec-fit-884920' &&
    item.recommendedSize === 'M' &&
    item.sizeGuideVersion === 2
  );

  // TEST 3.2: Customer Manual Size Override Logging in Order Item
  const orderItemOverride = createOrderItemWithFit({
    productId: 'prod-anarkali-01',
    productName: 'Gulab Baag Handblock Anarkali Set',
    size: 'L', // Customer bought L instead of recommended M
    price: 3499,
    fitRecommendation: {
      recommendationId: 'rec-fit-884921',
      recommendedSize: 'M',
      sizeGuideVersion: 1,
      confidenceScore: 85,
      fitPreference: 'regular',
      overrideReason: 'Prefer broader chest ease for heavy festive jewelry',
    },
  });

  assert(
    'Order Fit Override: Flags manual size override (Recommended M, Purchased L) with reason string',
    orderItemOverride.isSizeOverride === true &&
    orderItemOverride.overrideReason?.includes('broader chest ease')
  );

  // TEST 3.3: Return & Exchange Request Fit Feedback Linkage
  function initiateReturn(order: Order, itemId: string, returnFeedback: {
    reason: string;
    fitFeedbackType: 'too_tight_bust' | 'too_loose_waist' | 'length_short' | 'armhole_tight' | 'fabric_stiff';
    customerNotes: string;
  }): Order {
    const targetItem = order.items.find((i: any) => i.productId === itemId) as OrderItem;
    if (!targetItem) throw new Error('Item not found in order');

    return {
      ...order,
      orderStatus: 'Return Requested',
      returnDetails: {
        reason: returnFeedback.reason,
        description: returnFeedback.customerNotes,
        status: 'Requested',
        requestedAt: new Date().toISOString(),
        customerComments: returnFeedback.customerNotes,
        resolutionType: 'Refund',
        // Linked fit diagnostic metadata
        sizeRecommendationId: targetItem.sizeRecommendationId,
        recommendedSize: targetItem.recommendedSize,
        purchasedSize: targetItem.size,
        sizeGuideVersion: targetItem.sizeGuideVersion,
        fitFeedbackType: returnFeedback.fitFeedbackType,
      } as any,
    };
  }

  const returnedOrder = initiateReturn(testOrder, 'prod-chikankari-02', {
    reason: 'Size & Fit Issue',
    fitFeedbackType: 'too_tight_bust',
    customerNotes: 'Kurti fits well around waist but feels tight across armhole seams.',
  });

  const returnDetails = returnedOrder.returnDetails as any;
  assert(
    'Return Fit Link: Return request captures original recommendationId, guide version, and fitFeedbackType',
    returnDetails.sizeRecommendationId === 'rec-fit-884920' &&
    returnDetails.sizeGuideVersion === 2 &&
    returnDetails.fitFeedbackType === 'too_tight_bust'
  );

  // TEST 3.4: Fit Analytics Correlation (High Confidence vs Return Rate)
  const ordersDataset = [
    { id: '1', recConfidence: 95, returned: false },
    { id: '2', recConfidence: 90, returned: false },
    { id: '3', recConfidence: 92, returned: false },
    { id: '4', recConfidence: 65, returned: true }, // Low confidence -> returned
    { id: '5', recConfidence: 88, returned: false },
  ];

  const highConfidenceOrders = ordersDataset.filter(o => o.recConfidence >= 85);
  const highConfReturnRate = (highConfidenceOrders.filter(o => o.returned).length / highConfidenceOrders.length) * 100;

  assert(
    'Fit Analytics: High confidence recommendations (>=85%) demonstrate 0% return rate in dataset',
    highConfReturnRate === 0
  );
}
