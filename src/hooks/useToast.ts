import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { addToast } from '../store/slices/uiSlice';

export const useToast = () => {
  const dispatch = useAppDispatch();

  const toast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 5000) => {
      dispatch(addToast({ type, message, duration }));
    },
    [dispatch]
  );

  const success = useCallback(
    (message: string, title?: string, duration: number = 5000) => {
      dispatch(addToast({ type: 'success', message, title, duration }));
    },
    [dispatch]
  );

  const error = useCallback(
    (message: string, title?: string, duration: number = 5000) => {
      dispatch(addToast({ type: 'error', message, title, duration }));
    },
    [dispatch]
  );

  const info = useCallback(
    (message: string, title?: string, duration: number = 5000) => {
      dispatch(addToast({ type: 'info', message, title, duration }));
    },
    [dispatch]
  );

  const warning = useCallback(
    (message: string, title?: string, duration: number = 5000) => {
      dispatch(addToast({ type: 'warning', message, title, duration }));
    },
    [dispatch]
  );

  return { toast, success, error, info, warning };
};

