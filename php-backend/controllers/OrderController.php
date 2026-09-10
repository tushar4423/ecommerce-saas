<?php
namespace Controllers;

use Core\Controller;
use Core\Request;
use Models\Order;

class OrderController extends Controller
{
    public function index(Request $request): void
    {
        $userId = $request->getQuery('userId');
        $orders = Order::getOrdersByUser($userId);
        $this->json($orders);
    }

    public function show(Request $request, string $id): void
    {
        $orders = Order::getOrdersByUser();
        $found = null;
        foreach ($orders as $o) {
            if ($o['id'] === $id || ($o['orderNumber'] ?? '') === $id) {
                $found = $o;
                break;
            }
        }

        if ($found) {
            $this->json($found);
        } else {
            $this->error('Order not found', 404);
        }
    }

    public function store(Request $request): void
    {
        $body = $request->allBody();
        $this->validate($body, [
            'grandTotal' => 'required|numeric',
            'items'      => 'required'
        ]);

        $order = Order::createOrder($body);
        $this->success($order, 'Order placed successfully', 201);
    }

    public function updateStatus(Request $request, string $id): void
    {
        $body = $request->allBody();
        $status = $body['status'] ?? 'Shipped';
        $comment = $body['comment'] ?? 'Status updated by store manager';

        \Core\Database::query(
            "UPDATE orders SET order_status = ? WHERE id = ?",
            [$status, $id]
        );

        \Core\Database::query(
            "INSERT INTO order_status_history (id, order_id, status, comment) VALUES (?, ?, ?, ?)",
            ['hist-' . uniqid(), $id, $status, $comment]
        );

        $this->success(['id' => $id, 'status' => $status], 'Order status updated');
    }
}
