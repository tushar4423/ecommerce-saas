<?php
namespace Controllers;

use Core\Controller;
use Core\Request;
use Models\Product;

class ProductController extends Controller
{
    public function index(Request $request): void
    {
        $filters = [
            'category'       => $request->getQuery('category'),
            'subcategory'    => $request->getQuery('subcategory'),
            'search'         => $request->getQuery('search') ?? $request->getQuery('q'),
            'min_price'      => $request->getQuery('min_price'),
            'max_price'      => $request->getQuery('max_price'),
            'is_bestseller'  => $request->getQuery('is_bestseller'),
            'is_new_arrival' => $request->getQuery('is_new_arrival'),
            'sort'           => $request->getQuery('sort', 'recommended'),
            'limit'          => $request->getQuery('limit', 50),
            'offset'         => $request->getQuery('offset', 0),
        ];

        $products = Product::getList($filters);
        $this->json($products, 200, 300); // 5-minute HTTP cache for high performance
    }

    public function show(Request $request, string $slugOrId): void
    {
        $product = Product::findBySlugOrId($slugOrId);
        if (!$product) {
            $this->error("Product '$slugOrId' not found", 404);
            return;
        }

        $this->json($product, 200, 600); // 10-minute HTTP cache
    }

    public function store(Request $request): void
    {
        $body = $request->allBody();
        $this->validate($body, [
            'name' => 'required',
            'mrp'  => 'required|numeric'
        ]);

        $saved = Product::saveProduct($body);
        $this->success($saved, 'Product created successfully', 201);
    }

    public function update(Request $request, string $id): void
    {
        $body = $request->allBody();
        $body['id'] = $id;
        $saved = Product::saveProduct($body);
        $this->success($saved, 'Product updated successfully');
    }

    public function destroy(Request $request, string $id): void
    {
        $deleted = Product::delete($id);
        if ($deleted) {
            $this->success(['id' => $id], 'Product deleted successfully');
        } else {
            $this->error('Product not found or already deleted', 404);
        }
    }
}
