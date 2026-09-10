<?php
namespace Controllers;

use Core\Controller;
use Core\Request;
use Models\Category;

class CategoryController extends Controller
{
    public function index(Request $request): void
    {
        $categories = Category::getAllWithSubmenus();
        $this->json($categories, 200, 3600); // 1 hour HTTP cache
    }

    public function store(Request $request): void
    {
        $body = $request->allBody();
        $this->validate($body, [
            'name' => 'required'
        ]);

        $saved = Category::saveCategory($body);
        $this->success($saved, 'Category created successfully', 201);
    }

    public function update(Request $request, string $id): void
    {
        $body = $request->allBody();
        $body['id'] = $id;
        $saved = Category::saveCategory($body);
        $this->success($saved, 'Category updated successfully');
    }

    public function destroy(Request $request, string $id): void
    {
        $deleted = Category::delete($id);
        if ($deleted) {
            $this->success(['id' => $id], 'Category deleted successfully');
        } else {
            $this->error('Category not found or already deleted', 404);
        }
    }
}
