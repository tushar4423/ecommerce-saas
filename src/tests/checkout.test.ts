/**
 * Unit Tests: Checkout Rules, Pincode Lookup, COD & Address Validation
 */
import { validateAddressForm } from '../utils/validators';

export function runCheckoutTests(assert: (desc: string, passed: boolean, details?: any) => void) {
  console.log('\n--- 5. Running Checkout & Address Validation Tests ---');

  // Test 1: Valid Indian Address
  const validAddr = {
    fullName: 'Ananya Sharma',
    phone: '9876543210',
    addressLine1: 'Flat 402, Lotus Residency, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
  };
  const resValid = validateAddressForm(validAddr);
  assert('Valid Indian address with 10-digit mobile & 6-digit PIN passes validation', resValid.isValid, resValid.errors);

  // Test 2: Invalid Phone (9 digits)
  const invalidPhoneAddr = { ...validAddr, phone: '987654321' };
  const resBadPhone = validateAddressForm(invalidPhoneAddr);
  assert('Rejects invalid phone with under 10 digits', !resBadPhone.isValid && !!resBadPhone.errors.phone, resBadPhone.errors);

  // Test 3: Invalid Pincode (letters or wrong length)
  const badPinAddr = { ...validAddr, pincode: '56003' };
  const resBadPin = validateAddressForm(badPinAddr);
  assert('Rejects invalid 5-digit PIN code', !resBadPin.isValid && !!resBadPin.errors.pincode, resBadPin.errors);

  // Test 4: COD Availability Constraints
  const checkCodEligibility = (
    subtotal: number,
    isStoreCodEnabled: boolean,
    minCod: number,
    maxCod: number,
    pincode: string,
    blockedPincodes: string[]
  ) => {
    if (!isStoreCodEnabled) return { allowed: false, reason: 'COD is disabled by store' };
    if (subtotal < minCod) return { allowed: false, reason: `Minimum order for COD is ₹${minCod}` };
    if (subtotal > maxCod) return { allowed: false, reason: `Maximum order for COD is ₹${maxCod}` };
    if (blockedPincodes.includes(pincode)) return { allowed: false, reason: 'PIN code not serviceable for COD' };
    return { allowed: true };
  };

  const codEligible = checkCodEligibility(2500, true, 299, 15000, '560038', ['110001']);
  assert('COD eligible for valid cart total ₹2500 in unblocked PIN 560038', codEligible.allowed, codEligible);

  const codBlockedPin = checkCodEligibility(2500, true, 299, 15000, '110001', ['110001']);
  assert('COD blocked for blacklisted PIN code 110001', !codBlockedPin.allowed, codBlockedPin);

  const codHighAmount = checkCodEligibility(20000, true, 299, 15000, '560038', []);
  assert('COD blocked for cart value (₹20,000) exceeding max ₹15,000 threshold', !codHighAmount.allowed, codHighAmount);
}
