/**
 * Unit Tests: Server-Authoritative Security & Anti-Spoofing
 */

interface DBProduct {
  id: string;
  name: string;
  sellingPrice: number;
}

export function verifyOrderPayload(
  dbProducts: DBProduct[],
  incomingItems: { productId: string; clientPrice: number; quantity: number }[]
): { verifiedSubtotal: number; wasTampered: boolean } {
  let verifiedSubtotal = 0;
  let wasTampered = false;

  for (const item of incomingItems) {
    const product = dbProducts.find(p => p.id === item.productId);
    if (!product) continue;

    if (item.clientPrice !== product.sellingPrice) {
      wasTampered = true;
    }

    // Always use authoritative DB product selling price
    verifiedSubtotal += product.sellingPrice * item.quantity;
  }

  return { verifiedSubtotal, wasTampered };
}

export function runSecurityTests(assert: (desc: string, passed: boolean, details?: any) => void) {
  console.log('\n--- 4. Running Security & Server Authority Tests ---');

  const productsDB: DBProduct[] = [
    { id: 'p1', name: 'Silk Kurta', sellingPrice: 2499 },
    { id: 'p2', name: 'Cotton Dupatta', sellingPrice: 799 },
  ];

  // Test 1: Price Spoofing Detection
  const clientPayloadSpoofed = [
    { productId: 'p1', clientPrice: 1, quantity: 1 }, // Hacker attempts to buy ₹2499 item for ₹1
    { productId: 'p2', clientPrice: 799, quantity: 1 },
  ];

  const result = verifyOrderPayload(productsDB, clientPayloadSpoofed);
  assert('Server overrides hacked client price (₹1) with authoritative DB price (₹2499)', result.verifiedSubtotal === 3298, result);
  assert('Price tampering correctly flagged by security verification', result.wasTampered === true, result);

  // Test 2: Admin Session Token Validation
  const validSessions: Record<string, { role: string; expiresAt: number }> = {
    'valid_adm_tok_123': { role: 'admin', expiresAt: Date.now() + 100000 },
    'expired_adm_tok_456': { role: 'admin', expiresAt: Date.now() - 100000 },
  };

  const validateAdminSession = (token?: string) => {
    if (!token) return { ok: false, status: 401, error: 'Token missing' };
    const session = validSessions[token];
    if (!session) return { ok: false, status: 401, error: 'Invalid token' };
    if (session.expiresAt < Date.now()) return { ok: false, status: 401, error: 'Session expired' };
    return { ok: true, role: session.role };
  };

  assert('Valid admin token authenticates successfully', validateAdminSession('valid_adm_tok_123').ok);
  assert('Expired admin token is rejected', !validateAdminSession('expired_adm_tok_456').ok);
  assert('Missing or forged token is rejected', !validateAdminSession('forged_token').ok);
}
