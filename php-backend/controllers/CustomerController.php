<?php
namespace Controllers;

use Core\Controller;
use Core\Request;
use Models\Customer;

class CustomerController extends Controller
{
    public function index(Request $request): void
    {
        $users = Customer::all();
        $this->json(array_map([Customer::class, 'formatUser'], $users));
    }

    public function store(Request $request): void
    {
        $body = $request->allBody();
        $saved = Customer::saveCustomer($body);
        $this->success($saved, 'Customer saved successfully');
    }
}
