import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { authStore } from '@/stores/AuthStore';
import { dataStore } from '@/stores/DataStore';
import { apiOrderService } from '@/services/api-order-service';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingIcon,
  PinIcon,
  PlusIcon,
  TrashIcon,
} from '@/components/shared/Icons';

const PLANS = [
  { key: 'BASIC' as const, label: 'BASIC', limit: '3 filiais', desc: 'Para pequenos restaurantes' },
  { key: 'PROFESSIONAL' as const, label: 'PROFESSIONAL', limit: '6 filiais', desc: 'Para redes em crescimento' },
  { key: 'NETWORK' as const, label: 'NETWORK', limit: '10 filiais', desc: 'Para redes consolidadas' },
  { key: 'PREMIUM' as const, label: 'PREMIUM', limit: 'Ilimitado', desc: 'Para grandes operações' },
];

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function validateCnpj(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  let sum = 0;
  let multiplier = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i], 10) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleaned[12], 10) !== digit1) return false;

  sum = 0;
  multiplier = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i], 10) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cleaned[13], 10) !== digit2) return false;

  return true;
}

const PLAN_PRICES: Record<string, number> = {
  BASIC: 0,
  PROFESSIONAL: 49.9,
  NETWORK: 99.9,
  PREMIUM: 199.9,
};

export default observer(function CriarRestauranteScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const styles = makeStyles(theme, isWeb);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [plan, setPlan] = useState<'BASIC' | 'PROFESSIONAL' | 'NETWORK' | 'PREMIUM'>('BASIC');
  const [cnpjError, setCnpjError] = useState('');

  // Step 2
  const [enableMesas, setEnableMesas] = useState(false);
  const [mesas, setMesas] = useState<{ number: string; capacity: string }[]>([]);
  const [newMesaNumber, setNewMesaNumber] = useState('');
  const [newMesaCapacity, setNewMesaCapacity] = useState('');

  // Step 3

  const handleNext = () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o nome do restaurante.' });
      return;
    }
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) {
      setCnpjError('CNPJ deve ter 14 dígitos.');
      Toast.show({ type: 'error', text1: 'CNPJ inválido.' });
      return;
    }
    if (!validateCnpj(cnpj)) {
      setCnpjError('CNPJ com dígitos verificadores inválidos.');
      Toast.show({ type: 'error', text1: 'CNPJ inválido.' });
      return;
    }
    setCnpjError('');
    setStep(2);
  };

  const handleNextToStep3 = () => {
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleAddMesa = () => {
    if (!newMesaNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o número da mesa.' });
      return;
    }
    const cap = parseInt(newMesaCapacity, 10);
    if (!cap || cap < 1) {
      Toast.show({ type: 'error', text1: 'Capacidade deve ser no mínimo 1.' });
      return;
    }
    if (mesas.some((m) => m.number === newMesaNumber.trim())) {
      Toast.show({ type: 'error', text1: `Mesa ${newMesaNumber.trim()} já cadastrada.` });
      return;
    }
    setMesas((prev) => [...prev, { number: newMesaNumber.trim(), capacity: String(cap) }]);
    setNewMesaNumber('');
    setNewMesaCapacity('');
  };

  const handleRemoveMesa = (number: string) => {
    setMesas((prev) => prev.filter((m) => m.number !== number));
  };

  const handleFinalize = async () => {
    setSaving(true);
    try {
      const planPrice = PLAN_PRICES[plan] || 0;

      if (planPrice > 0) {
        const successUrl = isWeb
          ? `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/success`
          : 'almocu://payment/success';
        const cancelUrl = isWeb
          ? `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/cancel`
          : 'almocu://payment/cancel';

        const { url, sessionId } = await apiOrderService.createCheckoutSession(
          [{ name: `Plano ${plan}`, amount: Math.round(planPrice * 100), quantity: 1 }],
          { successUrl, cancelUrl },
        );

        const result = await WebBrowser.openAuthSessionAsync(url, successUrl);

        if (result.type !== 'success') {
          throw new Error('Pagamento cancelado ou não concluído.');
        }

        const { paymentStatus } = await apiOrderService.verifyPayment(sessionId);

        if (paymentStatus !== 'paid') {
          throw new Error('Pagamento não confirmado.');
        }
      }

      await authStore.createRestaurantWorkspace(name.trim(), cnpj, plan);

      const restId = authStore.user?.restaurantId;
      if (!restId) {
        Toast.show({ type: 'error', text1: 'Erro ao criar restaurante.' });
        router.push('/(auth)/config');
        return;
      }

      if (enableMesas) {
        try {
          await dataStore.enableTablesFeature(true);
        } catch {
          Toast.show({ type: 'warning', text1: 'Restaurante criado, mas falha ao ativar mesas.' });
        }

        for (const mesa of mesas) {
          try {
            await dataStore.createTable(mesa.number, parseInt(mesa.capacity, 10));
          } catch {
            Toast.show({ type: 'warning', text1: `Falha ao criar Mesa ${mesa.number}.` });
          }
        }
      }

      Toast.show({ type: 'success', text1: 'Restaurante criado com sucesso!' });
      router.push('/(auth)/config');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erro ao criar restaurante.';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setSaving(false);
    }
  };

  const planPrice = PLAN_PRICES[plan] || 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, isWeb && { maxWidth: 600, width: '100%', alignSelf: 'center' }]}
      >

          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(auth)/config')}>
              <ChevronLeftIcon color={theme.text} size={24} />
              <Text style={[styles.backText, { color: theme.text }]}>Config</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Criar Restaurante</Text>
            <View style={{ width: 80 }} />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepHeader}>
            <View style={styles.stepDotsRow}>
              <View style={styles.stepColumn}>
                <View style={[styles.stepDot, step >= 1 ? styles.stepDotActive : styles.stepDotInactive]}>
                  <Text style={[styles.stepDotText, step >= 1 ? styles.stepDotTextActive : styles.stepDotTextInactive]}>1</Text>
                </View>
                <Text style={[styles.stepLabel, step >= 1 ? styles.stepLabelActive : styles.stepLabelInactive]}>
                  Dados
                </Text>
              </View>
              <View style={[styles.stepDotLine, step >= 2 ? styles.stepDotLineActive : styles.stepDotLineInactive]} />
              <View style={styles.stepColumn}>
                <View style={[styles.stepDot, step >= 2 ? styles.stepDotActive : styles.stepDotInactive]}>
                  <Text style={[styles.stepDotText, step >= 2 ? styles.stepDotTextActive : styles.stepDotTextInactive]}>2</Text>
                </View>
                <Text style={[styles.stepLabel, step >= 2 ? styles.stepLabelActive : styles.stepLabelInactive]}>
                  Configuração
                </Text>
              </View>
              <View style={[styles.stepDotLine, step >= 3 ? styles.stepDotLineActive : styles.stepDotLineInactive]} />
              <View style={styles.stepColumn}>
                <View style={[styles.stepDot, step >= 3 ? styles.stepDotActive : styles.stepDotInactive]}>
                  <Text style={[styles.stepDotText, step >= 3 ? styles.stepDotTextActive : styles.stepDotTextInactive]}>3</Text>
                </View>
                <Text style={[styles.stepLabel, step >= 3 ? styles.stepLabelActive : styles.stepLabelInactive]}>
                  Pagamento
                </Text>
              </View>
            </View>
          </View>

        {step === 1 ? (
          <>
            {/* Step 1: Restaurant Data */}
            <View style={[styles.card, { backgroundColor: theme.foreground }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconBox, { backgroundColor: theme.contrast + '22' }]}>
                  <BuildingIcon color={theme.contrast} size={18} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Dados do Restaurante</Text>
              </View>

              <View>
                <Text style={[styles.label, { color: theme.text }]}>Nome do Restaurante *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                  placeholder="Ex: Cantina Bella Italia"
                  placeholderTextColor={theme.text + '60'}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View>
                <Text style={[styles.label, { color: theme.text }]}>CNPJ *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                  placeholder="00.000.000/0000-00"
                  placeholderTextColor={theme.text + '60'}
                  value={cnpj}
                  onChangeText={(v) => { setCnpj(formatCnpj(v)); setCnpjError(''); }}
                  keyboardType="numeric"
                  maxLength={18}
                />
                {cnpjError ? <Text style={[styles.errorText, { color: '#EF4444' }]}>{cnpjError}</Text> : null}
              </View>
            </View>

            {/* Plan Selection */}
            <View style={[styles.card, { backgroundColor: theme.foreground }]}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Plano</Text>
              {PLANS.map((p) => {
                const selected = plan === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.planCard, selected && styles.planCardSelected, { borderColor: selected ? theme.contrast : 'transparent', backgroundColor: theme.background }]}
                    onPress={() => setPlan(p.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radio, selected && { borderColor: theme.contrast }]}>
                      {selected && <View style={[styles.radioInner, { backgroundColor: theme.contrast }]} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planName, { color: theme.text }]}>{p.label}</Text>
                      <Text style={[styles.planDesc, { color: theme.text }]}>{p.desc}</Text>
                    </View>
                    <Text style={[styles.planLimit, { color: theme.text }]}>{p.limit}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : step === 2 ? (
          <>
            {/* Step 2: Initial Configuration */}
            <View style={[styles.card, { backgroundColor: theme.foreground }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconBox, { backgroundColor: theme.contrast + '22' }]}>
                  <PinIcon color={theme.contrast} size={18} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Sistema de Mesas</Text>
              </View>
              <Text style={[styles.description, { color: theme.text }]}>
                Ative o sistema de mesas para gerenciar mesas e vinculá-las aos pedidos.
              </Text>

              <TouchableOpacity
                style={[styles.toggleRow, { backgroundColor: theme.background }]}
                onPress={() => setEnableMesas(!enableMesas)}
                activeOpacity={0.7}
              >
                <View style={[styles.toggleTrack, enableMesas && { backgroundColor: theme.contrast }]}>
                  <View style={[styles.toggleThumb, enableMesas && { transform: [{ translateX: 20 }] }]} />
                </View>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>
                  {enableMesas ? 'Ativo' : 'Inativo'}
                </Text>
              </TouchableOpacity>
            </View>

            {enableMesas && (
              <>
                <View style={[styles.card, { backgroundColor: theme.foreground }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Adicionar Mesa</Text>
                  <View style={styles.mesaFormRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: theme.text }]}>Número</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                        placeholder="Ex: 01"
                        placeholderTextColor={theme.text + '60'}
                        value={newMesaNumber}
                        onChangeText={setNewMesaNumber}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: theme.text }]}>Capacidade</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                        placeholder="Ex: 4"
                        placeholderTextColor={theme.text + '60'}
                        value={newMesaCapacity}
                        onChangeText={setNewMesaCapacity}
                        keyboardType="numeric"
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.addMesaBtn, { backgroundColor: theme.contrast }]}
                      onPress={handleAddMesa}
                      activeOpacity={0.7}
                    >
                      <PlusIcon color="#FFFFFF" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>

                {mesas.length > 0 && (
                  <View style={[styles.card, { backgroundColor: theme.foreground }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>
                      Mesas Cadastradas ({mesas.length})
                    </Text>
                    {mesas.map((mesa) => (
                      <View key={mesa.number} style={[styles.mesaItem, { backgroundColor: theme.background }]}>
                        <PinIcon color={theme.contrast} size={18} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.mesaItemNumber, { color: theme.text }]}>Mesa {mesa.number}</Text>
                          <Text style={[styles.mesaItemCapacity, { color: theme.text }]}>
                            Capacidade: {mesa.capacity} {parseInt(mesa.capacity, 10) === 1 ? 'pessoa' : 'pessoas'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveMesa(mesa.number)} activeOpacity={0.7}>
                          <TrashIcon color="#EF4444" size={18} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {mesas.length === 0 && (
                  <Text style={[styles.hint, { color: theme.text }]}>
                    Nenhuma mesa cadastrada. Você poderá cadastrar depois em Mesas &gt; Gerenciar.
                  </Text>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* Step 3: Payment */}
            <View style={[styles.card, { backgroundColor: theme.foreground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Resumo do Pedido</Text>
              <View style={styles.summaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.moduleName, { color: theme.text }]}>Plano {plan}</Text>
                  <Text style={[styles.moduleSub, { color: theme.text }]}>Assinatura mensal</Text>
                </View>
                <Text style={[styles.modulePrice, { color: theme.contrast }]}>
                  {planPrice === 0 ? 'Grátis' : `R$ ${planPrice.toFixed(2).replace('.', ',')}`}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryTotalRow}>
                <Text style={[styles.totalLabel, { color: theme.text }]}>Total Mensal</Text>
                <Text style={[styles.totalValue, { color: theme.contrast }]}>
                  {planPrice === 0 ? 'Grátis' : `R$ ${planPrice.toFixed(2).replace('.', ',')}`}
                </Text>
              </View>
            </View>

            {planPrice > 0 && (
              <View style={[styles.card, { backgroundColor: theme.foreground }]}>
                <Text style={[styles.cardDesc, { color: theme.text, textAlign: 'center' }]}>
                  Você será redirecionado para o Stripe Checkout para realizar o pagamento com cartão de crédito, débito ou PIX.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={styles.actions}>
          {step === 1 ? (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.contrast }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Continuar</Text>
              <ChevronRightIcon color="#FFFFFF" size={20} />
            </TouchableOpacity>
          ) : step === 2 ? (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: theme.contrast }]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <ChevronLeftIcon color={theme.contrast} size={20} />
                <Text style={[styles.secondaryBtnText, { color: theme.contrast }]}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.contrast, flex: 1 }]}
                onPress={handleNextToStep3}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>Continuar</Text>
                <ChevronRightIcon color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: theme.contrast }]}
                onPress={handleBack}
                activeOpacity={0.7}
                disabled={saving}
              >
                <ChevronLeftIcon color={theme.contrast} size={20} />
                <Text style={[styles.secondaryBtnText, { color: theme.contrast }]}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.contrast, flex: 1 }]}
                onPress={handleFinalize}
                activeOpacity={0.8}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Criar Restaurante</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 20,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      width: 80,
    },
    backText: {
      fontFamily: 'Jost_500Medium',
      fontSize: 14,
    },
    headerTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      textAlign: 'center',
    },
    stepHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    stepDotsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 0,
      width: '100%',
      maxWidth: 320,
    },
    stepColumn: {
      alignItems: 'center',
      width: 90,
      gap: 6,
    },
    stepDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotActive: {
      backgroundColor: theme.contrast,
    },
    stepDotInactive: {
      backgroundColor: theme.foreground,
    },
    stepDotText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
    },
    stepDotTextActive: {
      color: '#FFFFFF',
    },
    stepDotTextInactive: {
      color: theme.text,
      opacity: 0.5,
    },
    stepDotLine: {
      flex: 1,
      height: 2,
      borderRadius: 1,
      marginTop: 15,
    },
    stepDotLineActive: {
      backgroundColor: theme.contrast,
    },
    stepDotLineInactive: {
      backgroundColor: theme.foreground,
    },
    stepLabel: {
      fontFamily: 'Jost_500Medium',
      fontSize: 11,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    stepLabelActive: {
      color: theme.contrast,
      opacity: 1,
      fontFamily: 'Jost_700Bold',
    },
    stepLabelInactive: {
      color: theme.text,
      opacity: 0.6,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    card: {
      borderRadius: 24,
      padding: 20,
      gap: 16,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      flex: 1,
    },
    label: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      marginBottom: 6,
      marginLeft: 4,
    },
    input: {
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      outlineStyle: 'none',
    } as any,
    errorText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },
    description: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      opacity: 0.6,
      lineHeight: 18,
    },
    hint: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      opacity: 0.5,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 16,
    },
    // Plan selector
    planCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1.5,
      marginBottom: 8,
    },
    planCardSelected: {
      borderWidth: 1.5,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.text + '30',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    planName: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
    },
    planDesc: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      opacity: 0.6,
      marginTop: 2,
    },
    planLimit: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 12,
      opacity: 0.5,
    },
    // Toggle
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 16,
    },
    toggleTrack: {
      width: 44,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.text + '30',
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
    },
    toggleLabel: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
    },
    // Mesa form
    mesaFormRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
    },
    addMesaBtn: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mesaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 14,
      marginBottom: 8,
    },
    mesaItemNumber: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
    },
    mesaItemCapacity: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      opacity: 0.6,
      marginTop: 2,
    },
    // Payment
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

    // Actions
    actions: {
      gap: 12,
      marginTop: 8,
    },
    btnRow: {
      flexDirection: 'row',
      gap: 12,
    },
    saveBtn: {
      paddingVertical: 18,
      borderRadius: 18,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      shadowColor: theme.contrast,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    saveBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 18,
      paddingHorizontal: 18,
      borderRadius: 18,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
    },
    secondaryBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      letterSpacing: 0.3,
    },
  });
}
