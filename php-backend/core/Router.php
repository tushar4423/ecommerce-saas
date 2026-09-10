<?php
namespace Core;

/**
 * High-Performance Regex URL Router
 */
class Router
{
    private array $routes = [];
    private string $prefix = '';

    public function group(string $prefix, callable $callback): void
    {
        $previousPrefix = $this->prefix;
        $this->prefix = $previousPrefix . '/' . trim($prefix, '/');
        $callback($this);
        $this->prefix = $previousPrefix;
    }

    public function get(string $path, array|callable $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, array|callable $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, array|callable $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, array|callable $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, array|callable $handler): void
    {
        $fullPath = '/' . trim($this->prefix . '/' . trim($path, '/'), '/');
        
        // Convert route format /api/products/:id or /api/products/{id} to regex
        $pattern = preg_replace('/:[a-zA-Z0-9_]+|\{[a-zA-Z0-9_]+\}/', '([^/]+)', $fullPath);
        $pattern = '#^' . $pattern . '$#';

        $this->routes[] = [
            'method'  => $method,
            'pattern' => $pattern,
            'handler' => $handler,
            'path'    => $fullPath
        ];
    }

    public function dispatch(Request $request): void
    {
        $method = $request->getMethod();
        $uri = $request->getUri();

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $uri, $matches)) {
                array_shift($matches); // Remove entire match

                $handler = $route['handler'];

                if (is_callable($handler)) {
                    call_user_func_array($handler, array_merge([$request], $matches));
                    return;
                }

                if (is_array($handler) && count($handler) === 2) {
                    [$class, $action] = $handler;
                    $controller = new $class();
                    call_user_func_array([$controller, $action], array_merge([$request], $matches));
                    return;
                }
            }
        }

        // 404 Route Not Found
        Response::error("Endpoint '$uri' not found on this server.", 404);
    }
}
