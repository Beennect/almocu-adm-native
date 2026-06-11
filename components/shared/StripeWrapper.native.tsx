import { View } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@/config/stripe';

export function StripeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} urlScheme="almocu">
      <View style={{ flex: 1 }}>{children}</View>
    </StripeProvider>
  );
}
