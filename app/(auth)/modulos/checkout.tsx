import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import { toastStore } from '@/stores/ToastStore';
import { ChevronLeftIcon, AlmocuIcon, UserIcon } from '@/components/shared/Icons';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';

export default observer(function CheckoutScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const allModules = dataStore.modules || [];
  const moduleItem = allModules.find(m => m.id === id);

  // Tabs for payment: Pix or Card
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');

  // Card form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Timer for simulated Pix
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paymentMethod !== 'pix') return;
    const interval = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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

  const handlePurchase = () => {
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
        toastStore.show('Por favor, preencha todos os campos do cartão.', 'error');
        return;
      }
    }

    setLoading(true);

    // Simulated network delay
    setTimeout(() => {
      try {
        dataStore.purchaseModule(moduleItem.id);
        toastStore.show(`Módulo "${moduleItem.name}" ativado com sucesso!`, 'success');
        setLoading(false);
        router.push('/(auth)/modulos' as any);
      } catch (err: any) {
        toastStore.show('Erro ao finalizar transação.', 'error');
        setLoading(false);
      }
    }, 1500);
  };

  const handleCopyPixKey = () => {
    toastStore.show('Chave Copia e Cola copiada para a área de transferência!', 'success');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
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

        {/* Order Summary */}
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

        {/* Payment Selector */}
        <View style={styles.paySelector}>
          <TouchableOpacity
            style={[styles.payMethodBtn, paymentMethod === 'card' && styles.payMethodBtnActive]}
            onPress={() => setPaymentMethod('card')}
          >
            <Text style={[styles.payMethodText, paymentMethod === 'card' && styles.payMethodTextActive, { color: theme.text }]}>Cartão de Crédito</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.payMethodBtn, paymentMethod === 'pix' && styles.payMethodBtnActive]}
            onPress={() => setPaymentMethod('pix')}
          >
            <Text style={[styles.payMethodText, paymentMethod === 'pix' && styles.payMethodTextActive, { color: theme.text }]}>Pix imediato</Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs based on payment method */}
        {paymentMethod === 'card' ? (
          <View style={[styles.card, { backgroundColor: theme.foreground }]}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 16 }]}>Dados do Cartão</Text>
            
            <View style={styles.inputGroup}>
              <FormInput
                Icon={UserIcon}
                placeholder="Número do Cartão"
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={setCardNumber}
              />
              <FormInput
                Icon={UserIcon}
                placeholder="Nome do Titular impresso no cartão"
                autoCapitalize="characters"
                value={cardHolder}
                onChangeText={setCardHolder}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    placeholder="Vencimento (MM/AA)"
                    keyboardType="number-pad"
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput
                    placeholder="CVV"
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={4}
                    value={cardCvv}
                    onChangeText={setCardCvv}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.foreground, alignItems: 'center' }]}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 8, alignSelf: 'flex-start' }]}>Pagamento Pix</Text>
            <Text style={[styles.cardDesc, { color: theme.text, alignSelf: 'flex-start', marginBottom: 20 }]}>
              Escaneie o QR Code abaixo com o app do seu banco ou use a chave Copia e Cola.
            </Text>

            <View style={[styles.qrCodeBox, { borderColor: theme.background }]}>
              {/* Almocu icon dummy representation in QR code */}
              <AlmocuIcon color={theme.contrast} size={80} />
              <Text style={styles.qrCodeBoxText}>QR CODE PIX DINÂMICO</Text>
            </View>

            <Text style={[styles.timerText, { color: theme.text }]}>
              O QR Code expira em: <Text style={{ fontFamily: 'Jost_700Bold', color: theme.contrast }}>{formatTimer(timeLeft)}</Text>
            </Text>

            <TouchableOpacity 
              style={[styles.copyKeyBtn, { borderColor: theme.contrast }]} 
              onPress={handleCopyPixKey}
            >
              <Text style={[styles.copyKeyBtnText, { color: theme.contrast }]}>Copiar Chave Pix Copia-e-Cola</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          <FormButton
            title={loading ? 'PROCESSANDO TRANSACAO...' : 'AUTORIZAR E PAGAR AGORA'}
            variant="primary"
            onPress={handlePurchase}
            disabled={loading || (paymentMethod === 'pix' && timeLeft === 0)}
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
  cardDesc: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    opacity: 0.5,
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
  paySelector: {
    flexDirection: 'row',
    backgroundColor: '#9CA3AF15',
    borderRadius: 30,
    padding: 4,
    marginBottom: 20,
  },
  payMethodBtn: {
    flex: 1,
    borderRadius: 26,
    paddingVertical: 10,
    alignItems: 'center',
  },
  payMethodBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  payMethodText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
    opacity: 0.5,
  },
  payMethodTextActive: {
    opacity: 1,
  },
  inputGroup: {
    gap: 2,
  },
  qrCodeBox: {
    width: 150,
    height: 150,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 10,
  },
  qrCodeBoxText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 9,
    opacity: 0.4,
    textAlign: 'center',
    marginTop: 8,
  },
  timerText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 13,
    marginBottom: 20,
  },
  copyKeyBtn: {
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  copyKeyBtnText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 12.5,
  },
});
