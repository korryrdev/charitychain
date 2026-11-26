import { useCallback, useState } from 'react';
import type { AsyncState } from '@/types';

export interface UseAsyncActionResult<TArgs extends unknown[], TResult> extends AsyncState<TResult> {
  execute: (...args: TArgs) => Promise<TResult>;
  reset: () => void;
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): UseAsyncActionResult<TArgs, TResult> {
  const [state, setState] = useState<AsyncState<TResult>>({
    pending: false,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      setState({ pending: true, error: null, data: null });
      try {
        const data = await action(...args);
        setState({ pending: false, error: null, data });
        return data;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Request failed.');
        setState({ pending: false, error: err, data: null });
        throw error;
      }
    },
    [action]
  );

  return {
    ...state,
    execute,
    reset: () => setState({ pending: false, error: null, data: null }),
  };
}
