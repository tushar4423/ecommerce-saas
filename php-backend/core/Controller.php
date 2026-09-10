<?php
namespace Core;

/**
 * Base Controller
 */
abstract class Controller
{
    protected function json(mixed $data, int $statusCode = 200, int $cacheSeconds = 0): void
    {
        Response::json($data, $statusCode, [], $cacheSeconds);
    }

    protected function success(mixed $data, string $message = 'Success', int $statusCode = 200, int $cacheSeconds = 0): void
    {
        Response::success($data, $message, $statusCode, $cacheSeconds);
    }

    protected function error(string $message, int $statusCode = 400, array $errors = []): void
    {
        Response::error($message, $statusCode, $errors);
    }

    protected function validate(array $data, array $rules): array
    {
        $errors = [];
        foreach ($rules as $field => $ruleString) {
            $rulesList = explode('|', $ruleString);
            $val = $data[$field] ?? null;

            foreach ($rulesList as $rule) {
                if ($rule === 'required' && ($val === null || $val === '')) {
                    $errors[$field][] = "$field is required.";
                }
                if ($rule === 'numeric' && $val !== null && !is_numeric($val)) {
                    $errors[$field][] = "$field must be numeric.";
                }
                if ($rule === 'email' && $val !== null && !filter_var($val, FILTER_VALIDATE_EMAIL)) {
                    $errors[$field][] = "$field must be a valid email address.";
                }
            }
        }

        if (!empty($errors)) {
            $this->error('Validation failed', 422, $errors);
        }

        return $data;
    }
}
