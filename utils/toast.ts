import Toast from 'react-native-toast-message';

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
    Toast.show({ type: 'error', text1: messages.error });
    throw err;
  }
}
