import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

export default function PaymentSuccessScreen() {
  const { session_id } = useLocalSearchParams();

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.opener) {
        window.close();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.title}>Pagamento confirmado!</Text>
      <Text style={styles.subtitle}>Sua sessão será fechada em instantes...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
