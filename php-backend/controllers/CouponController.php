<?php
namespace Controllers;

use Core\Controller;
use Core\Request;
use Models\Coupon;

class CouponController extends Controller
{
    public function index(Request $request): void
    {
        $coupons = Coupon::getActiveCoupons();
        $this->json($coupons, 200, 1800);
    }

    public function validateCode(Request $request): void
    {
        $code = $request->getQuery('code') ?? $request->getBody('code');
        $subtotal = (float)($request->getQuery('subtotal') ?? $request->getBody('subtotal') ?? 0);

        if (!$code) {
            $this->error('Coupon code is required', 422);
            return;
        }

        $result = Coupon::validate($code, $subtotal);
        if ($result['valid']) {
            $this->json($result);
        } else {
            $this->json($result, 400);
        }
    }
}
