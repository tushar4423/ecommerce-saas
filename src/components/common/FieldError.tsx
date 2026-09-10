import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  id?: string;
  error?: string | null;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ id, error, className = '' }) => {
  if (!error) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`flex items-center gap-1.5 mt-1.5 text-xs text-rose-600 font-medium ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
};
