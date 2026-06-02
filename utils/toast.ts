import Toast from 'react-native-toast-message';

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (!err || typeof err !== 'object') {
    return fallback;
  }

  const anyErr = err as { response?: { data?: { message?: unknown } } };

  if (typeof anyErr.response?.data?.message === 'string') {
    return anyErr.response.data.message;
  }

  if (Array.isArray(anyErr.response?.data?.message) && anyErr.response.data.message.length > 0) {
    const first = anyErr.response.data.message[0];
    if (typeof first === 'string') return first;
  }

  if (err instanceof Error && err.message && !err.message.startsWith('Request failed')) {
    return err.message;
  }

  return fallback;
};

export async function withLoading<T>(
  operation: () => Promise<T>,
  messages: { loading: string; success: string; error: string }
): Promise<T> {
  Toast.show({ type: 'info', text1: messages.loading });
  try {
    const result = await operation();
    Toast.show({ type: 'success', text1: messages.success });
    return result;
  } catch (err) {
    const text1 = extractErrorMessage(err, messages.error);
    Toast.show({ type: 'error', text1 });
    throw err;
  }
}
