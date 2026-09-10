<?php
namespace Controllers;

use Core\Controller;
use Core\Request;
use Models\StoreSettings;

class SettingsController extends Controller
{
    public function show(Request $request): void
    {
        $settings = StoreSettings::getSettings();
        $this->json($settings, 200, 3600); // 1 hour caching
    }

    public function update(Request $request): void
    {
        $body = $request->allBody();
        $settings = StoreSettings::updateSettings($body);
        $this->success($settings, 'Settings saved successfully');
    }
}
