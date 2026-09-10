<?php
namespace Controllers;

use Core\Controller;
use Core\Request;
use Models\Banner;

class BannerController extends Controller
{
    public function index(Request $request): void
    {
        $banners = Banner::getActiveBanners();
        $this->json($banners, 200, 1800); // 30 min cache
    }

    public function store(Request $request): void
    {
        $body = $request->allBody();
        $this->validate($body, ['title' => 'required']);
        $saved = Banner::saveBanner($body);
        $this->success($saved, 'Banner created successfully', 201);
    }

    public function update(Request $request, string $id): void
    {
        $body = $request->allBody();
        $body['id'] = $id;
        $saved = Banner::saveBanner($body);
        $this->success($saved, 'Banner updated successfully');
    }

    public function destroy(Request $request, string $id): void
    {
        Banner::delete($id);
        $this->success(['id' => $id], 'Banner removed');
    }
}
