import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EmailIcon,
  NoteIcon,
  PinIcon,
  TruckIcon
} from '@/components/shared/Icons';
import { SelectModal } from '@/components/shared/SelectModal';
import { UserHeader } from '@/components/shared/UserHeader';
import { dataStore, SupplierAddress } from '@/stores/DataStore';
import { useAppTheme } from '@/themes/colors';
import { withLoading } from '@/utils/toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

interface FormState {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  cnpj: string;
  isActive: boolean;
  notes: string;
  address: SupplierAddress;
}

const initialFormState: FormState = {
  name: '',
  contactName: '',
  phone: '',
  email: '',
  cnpj: '',
  isActive: true,
  notes: '',
  address: {
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    complement: '',
  },
};

const formatCnpj = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const formatCep = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

const hasAnyAddressField = (a: SupplierAddress) => {
  return !!(
    a.street || a.number || a.neighborhood || a.city ||
    a.state || a.zipCode || a.complement
  );
};

const buildPayload = (form: FormState) => {
  const payload: any = {
    name: form.name.trim(),
    isActive: form.isActive,
  };

  if (form.contactName.trim()) payload.contactName = form.contactName.trim();
  if (form.phone.trim()) payload.phone = form.phone.replace(/\D/g, '');
  if (form.email.trim()) payload.email = form.email.trim().toLowerCase();
  if (form.cnpj.trim()) payload.cnpj = form.cnpj.replace(/\D/g, '');
  if (form.notes.trim()) payload.notes = form.notes.trim();

  if (hasAnyAddressField(form.address)) {
    const a: any = {
      street: form.address.street.trim(),
      number: form.address.number.trim(),
      city: form.address.city.trim(),
      state: form.address.state.trim().toUpperCase(),
    };
    if (form.address.neighborhood?.trim()) a.neighborhood = form.address.neighborhood.trim();
    if (form.address.zipCode?.trim()) a.zipCode = form.address.zipCode.replace(/\D/g, '');
    if (form.address.complement?.trim()) a.complement = form.address.complement.trim();
    payload.address = a;
  }

  return payload;
};

export default observer(function FornecedorFormScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const editingId = typeof params.id === 'string' ? params.id : null;
  const isEditing = !!editingId;
  const styles = makeStyles(theme, isWeb);

  const [form, setForm] = useState<FormState>(initialFormState);
  const [ufModalVisible, setUfModalVisible] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!editingId) return;
    const local = dataStore.suppliers.find((s) => s.id === editingId);
    if (local) {
      setForm({
        name: local.name,
        contactName: local.contactName || '',
        phone: local.phone || '',
        email: local.email || '',
        cnpj: local.cnpj || '',
        isActive: local.isActive,
        notes: local.notes || '',
        address: {
          street: local.address?.street || '',
          number: local.address?.number || '',
          neighborhood: local.address?.neighborhood || '',
          city: local.address?.city || '',
          state: local.address?.state || '',
          zipCode: local.address?.zipCode || '',
          complement: local.address?.complement || '',
        },
      });
      return;
    }

    setLoadingEdit(true);
    import('@/services/api-supplier-service')
      .then(({ apiSupplierService }) => apiSupplierService.getSupplier(editingId))
      .then((s: any) => {
        setForm({
          name: s.name || '',
          contactName: s.contactName || '',
          phone: s.phone || '',
          email: s.email || '',
          cnpj: s.cnpj || '',
          isActive: s.isActive !== false,
          notes: s.notes || '',
          address: {
            street: s.address?.street || '',
            number: s.address?.number || '',
            neighborhood: s.address?.neighborhood || '',
            city: s.address?.city || '',
            state: s.address?.state || '',
            zipCode: s.address?.zipCode || '',
            complement: s.address?.complement || '',
          },
        });
      })
      .catch((err) => {
        Toast.show({ type: 'error', text1: 'Erro ao carregar fornecedor' });
        console.warn('Erro ao carregar fornecedor:', err);
      })
      .finally(() => setLoadingEdit(false));
  }, [editingId]);

  const updateField = (field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: keyof SupplierAddress, value: string) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  useEffect(() => {
    const clean = (form.address.zipCode || '').replace(/\D/g, '');
    if (clean.length === 8) {
      handleFetchCep(clean);
    } else {
      setCepError('');
    }
  }, [form.address.zipCode]);

  const handleFetchCep = async (cleanCep: string) => {
    setCepLoading(true);
    setCepError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
      } else {
        setForm((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.logradouro || prev.address.street,
            neighborhood: data.bairro || prev.address.neighborhood,
            city: data.localidade || prev.address.city,
            state: data.uf || prev.address.state,
          },
        }));
      }
    } catch {
      setCepError('Erro ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleNext = () => {
    if (!form.name.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o nome do fornecedor.' });
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      Toast.show({ type: 'error', text1: 'E-mail inválido.' });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o nome do fornecedor.' });
      return;
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      Toast.show({ type: 'error', text1: 'E-mail inválido.' });
      return;
    }

    const payload = buildPayload(form);

    if (payload.address) {
      const a = payload.address;
      if (!a.street || !a.number || !a.city || !a.state) {
        Toast.show({ type: 'error', text1: 'Endereço incompleto. Preencha rua, número, cidade e UF.' });
        return;
      }
      if (a.state.length !== 2) {
        Toast.show({ type: 'error', text1: 'UF deve ter exatamente 2 letras.' });
        return;
      }
    }

    try {
      await withLoading(
        async () => {
          if (isEditing && editingId) {
            await dataStore.updateSupplier(editingId, payload);
          } else {
            await dataStore.addSupplier(payload);
          }
          router.back();
        },
        {
          loading: isEditing ? 'Atualizando fornecedor...' : 'Criando fornecedor...',
          success: isEditing ? 'Fornecedor atualizado!' : 'Fornecedor criado!',
          error: 'Erro ao salvar fornecedor',
        },
      );
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message;
      const text = Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg;
      Toast.show({
        type: 'error',
        text1: text || err?.message || 'Erro ao salvar fornecedor',
      });
    }
  };

  if (loadingEdit) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: 'Jost_400Regular', color: theme.text, opacity: 0.5 }}>
          Carregando fornecedor...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {!isWeb && <UserHeader />}

        {/* Top Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.foreground }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon color={theme.text} size={24} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </Text>
          </View>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepHeader}>
          <View style={styles.stepDotsRow}>
            <View style={styles.stepColumn}>
              <View
                style={[
                  styles.stepDot,
                  step >= 1 ? styles.stepDotActive : styles.stepDotInactive,
                ]}
              >
                <Text
                  style={[
                    styles.stepDotText,
                    step >= 1 ? styles.stepDotTextActive : styles.stepDotTextInactive,
                  ]}
                >
                  1
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  step >= 1 ? styles.stepLabelActive : styles.stepLabelInactive,
                ]}
              >
                Dados Básicos
              </Text>
            </View>
            <View
              style={[
                styles.stepDotLine,
                step >= 2 ? styles.stepDotLineActive : styles.stepDotLineInactive,
              ]}
            />
            <View style={styles.stepColumn}>
              <View
                style={[
                  styles.stepDot,
                  step >= 2 ? styles.stepDotActive : styles.stepDotInactive,
                ]}
              >
                <Text
                  style={[
                    styles.stepDotText,
                    step >= 2 ? styles.stepDotTextActive : styles.stepDotTextInactive,
                  ]}
                >
                  2
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  step >= 2 ? styles.stepLabelActive : styles.stepLabelInactive,
                ]}
              >
                Endereço
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {step === 1 ? (
            <>
              {/* Etapa 1: Dados Básicos */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBox, { backgroundColor: theme.contrast + '22' }]}>
                    <TruckIcon color={theme.contrast} size={18} />
                  </View>
                  <Text style={styles.sectionTitle}>Dados Básicos</Text>
                </View>

                <View>
                  <Text style={styles.label}>Nome / Razão Social *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder="Ex: Distribuidora de Alimentos LTDA"
                    placeholderTextColor={theme.text + '60'}
                    value={form.name}
                    onChangeText={(v) => updateField('name', v)}
                  />
                </View>

                <View>
                  <Text style={styles.label}>Nome de Contato</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder="Ex: Maria Silva"
                    placeholderTextColor={theme.text + '60'}
                    value={form.contactName}
                    onChangeText={(v) => updateField('contactName', v)}
                  />
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>CNPJ</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                      placeholder="00.000.000/0000-00"
                      placeholderTextColor={theme.text + '60'}
                      keyboardType="numeric"
                      value={formatCnpj(form.cnpj)}
                      onChangeText={(v) => updateField('cnpj', v.replace(/\D/g, ''))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Telefone</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                      placeholder="(11) 99999-8888"
                      placeholderTextColor={theme.text + '60'}
                      keyboardType="phone-pad"
                      value={formatPhone(form.phone)}
                      onChangeText={(v) => updateField('phone', v.replace(/\D/g, ''))}
                    />
                  </View>
                </View>

                <View>
                  <Text style={styles.label}>E-mail</Text>
                  <View style={styles.inputWrapper}>
                    <EmailIcon color={theme.text} opacity={0.4} size={16} />
                    <TextInput
                      style={[styles.inputFlex, { color: theme.text }]}
                      placeholder="contato@empresa.com"
                      placeholderTextColor={theme.text + '60'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={form.email}
                      onChangeText={(v) => updateField('email', v)}
                    />
                  </View>
                </View>
              </View>

              {/* Etapa 1: Observações */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBox, { backgroundColor: theme.contrast + '22' }]}>
                    <NoteIcon color={theme.contrast} size={18} />
                  </View>
                  <Text style={styles.sectionTitle}>Observações</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.textarea,
                    { backgroundColor: theme.background, color: theme.text },
                  ]}
                  placeholder="Prazos de entrega, condições de pagamento, etc."
                  placeholderTextColor={theme.text + '60'}
                  multiline
                  numberOfLines={4}
                  value={form.notes}
                  onChangeText={(v) => updateField('notes', v)}
                />
              </View>
            </>
          ) : (
            <>
              {/* Etapa 2: Endereço */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconBox, { backgroundColor: theme.contrast + '22' }]}>
                    <PinIcon color={theme.contrast} size={18} />
                  </View>
                  <Text style={styles.sectionTitle}>Endereço</Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalBadgeText}>Opcional</Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.cepField}>
                    <Text style={styles.label}>CEP</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.background }]}>
                      <TextInput
                        style={[styles.inputFlex, { color: theme.text }]}
                        placeholder="01001-000"
                        placeholderTextColor={theme.text + '60'}
                        keyboardType="numeric"
                        value={formatCep(form.address.zipCode || '')}
                        onChangeText={(v) => updateAddress('zipCode', v.replace(/\D/g, ''))}
                      />
                      {cepLoading ? (
                        <ActivityIndicator color={theme.contrast} size="small" />
                      ) : null}
                    </View>
                  </View>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.label}>Rua</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                      placeholder="Rua das Flores"
                      placeholderTextColor={theme.text + '60'}
                      value={form.address.street}
                      onChangeText={(v) => updateAddress('street', v)}
                    />
                  </View>
                </View>
                {cepError ? <Text style={styles.cepErrorText}>{cepError}</Text> : null}

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Número</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                      placeholder="123"
                      placeholderTextColor={theme.text + '60'}
                      value={form.address.number}
                      onChangeText={(v) => updateAddress('number', v)}
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.label}>Complemento</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                      placeholder="Galpão B"
                      placeholderTextColor={theme.text + '60'}
                      value={form.address.complement}
                      onChangeText={(v) => updateAddress('complement', v)}
                    />
                  </View>
                </View>

                <View>
                  <Text style={styles.label}>Bairro</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder="Centro"
                    placeholderTextColor={theme.text + '60'}
                    value={form.address.neighborhood}
                    onChangeText={(v) => updateAddress('neighborhood', v)}
                  />
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 3 }}>
                    <Text style={styles.label}>Cidade</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                      placeholder="São Paulo"
                      placeholderTextColor={theme.text + '60'}
                      value={form.address.city}
                      onChangeText={(v) => updateAddress('city', v)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>UF</Text>
                    <TouchableOpacity
                      style={[styles.pickerContainer, { backgroundColor: theme.background }]}
                      onPress={() => setUfModalVisible(true)}
                    >
                      <Text style={{ color: form.address.state ? theme.text : theme.text + '60', fontSize: 14, fontFamily: form.address.state ? 'Jost_600SemiBold' : 'Jost_400Regular' }}>
                        {form.address.state || '—'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
            ) : (
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
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Salvar Alterações' : 'Criar Fornecedor'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <SelectModal
          visible={ufModalVisible}
          onClose={() => setUfModalVisible(false)}
          onSelect={(uf: string) => {
            updateAddress('state', uf);
            setUfModalVisible(false);
          }}
          options={UF_OPTIONS}
          title="Selecione a UF"
        />
      </View>
    </KeyboardAvoidingView>
  );
});

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWeb ? 0 : 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    backBtn: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 24,
      color: theme.text,
    },
    scrollContent: {
      gap: 16,
      paddingBottom: 32,
    },
    stepHeader: {
      alignItems: 'center',
      marginBottom: 18,
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
      width: 110,
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
    card: {
      backgroundColor: theme.foreground,
      borderRadius: 24,
      padding: 20,
      gap: 16,
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
      color: theme.text,
      flex: 1,
    },
    optionalBadge: {
      backgroundColor: theme.text + '10',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 100,
    },
    optionalBadgeText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 10,
      color: theme.text,
      opacity: 0.5,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    label: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      color: theme.text,
      marginBottom: 6,
      marginLeft: 4,
    },
    helperText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      color: theme.text,
      opacity: 0.5,
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
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.background,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    inputFlex: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      paddingVertical: 10,
      outlineStyle: 'none',
    } as any,
    textarea: {
      minHeight: 110,
      textAlignVertical: 'top',
      paddingTop: 14,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    cepField: {
      flex: 1,
    },
    cepErrorText: {
      fontFamily: 'Jost_500Medium',
      fontSize: 12,
      color: '#EF4444',
      marginLeft: 4,
    },
    pickerContainer: {
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
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
