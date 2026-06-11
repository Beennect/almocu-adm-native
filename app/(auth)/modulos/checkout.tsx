import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import { apiOrderService } from '@/services/api-order-service';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeftIcon } from '@/components/shared/Icons';
import { FormButton } from '@/components/shared/FormButton';

export default observer(function CheckoutScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const allModules = dataStore.modules || [];
  const moduleItem = allModules.find(m => m.id === id);

  const [loading, setLoading] = useState(false);

  if (!moduleItem) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Módulo não encontrado.</Text>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Text style={{ color: theme.contrast }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const isWeb = width >= 768;
      const successUrl = isWeb
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/success`
        : 'almocu://payment/success';
      const cancelUrl = isWeb
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/cancel`
        : 'almocu://payment/cancel';

      const { url, sessionId } = await apiOrderService.createCheckoutSession(
        [{ name: moduleItem.name, amount: Math.round(moduleItem.price * 100), quantity: 1 }],
        { successUrl, cancelUrl },
      );

      const result = await WebBrowser.openAuthSessionAsync(url, successUrl);

      if (result.type !== 'success') {
        Toast.show({ type: 'error', text1: 'Pagamento cancelado ou não concluído.' });
        setLoading(false);
        return;
      }

      const { paymentStatus } = await apiOrderService.verifyPayment(sessionId);

      if (paymentStatus === 'paid') {
        await dataStore.purchaseModule(moduleItem.id);
        Toast.show({ type: 'success', text1: `"${moduleItem.name}" ativado com sucesso!` });
        router.push('/(auth)/modulos' as any);
      } else {
        Toast.show({ type: 'error', text1: 'Pagamento não confirmado. Tente novamente.' });
      }
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Erro ao processar pagamento.';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeftIcon color={theme.text} size={24} />
          <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Finalizar Compra</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        { paddingBottom: 40 },
        isWeb && { maxWidth: 500, width: '100%', alignSelf: 'center' }
      ]}>
        <View style={[styles.card, { backgroundColor: theme.foreground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Resumo do Pedido</Text>
          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.moduleName, { color: theme.text }]}>{moduleItem.name}</Text>
              <Text style={[styles.moduleSub, { color: theme.text }]}>Assinatura mensal adicional</Text>
            </View>
            <Text style={[styles.modulePrice, { color: theme.contrast }]}>
              R$ {moduleItem.price.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryTotalRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total Mensal</Text>
            <Text style={[styles.totalValue, { color: theme.contrast }]}>
              R$ {moduleItem.price.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <FormButton
            title={loading ? 'REDIRECIONANDO PARA PAGAMENTO...' : 'PAGAR COM STRIPE'}
            variant="primary"
            onPress={handlePurchase}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  backText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 15,
  },
  headerTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#9CA3AF15',
  },
  cardTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  moduleName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
  },
  moduleSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 1,
  },
  modulePrice: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#9CA3AF22',
    marginVertical: 14,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
  },
  totalValue: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
});
