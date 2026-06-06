import { useAppTheme } from '@/themes/colors';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  AddEnderecoIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  FinalizarPedidoIcon,
  InfoAdicionaisIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
} from '../../../components/shared/Icons';
import { SelectModal } from '../../../components/shared/SelectModal';

import { dataStore } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Address {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  semNumero?: boolean;
}

const emptyAddress: Address = {
  cep: '',
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  complemento: '',
  semNumero: false,
};

export default observer(function AddPedidoScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { editOrderId } = useLocalSearchParams();
  const styles = makeStyles(theme, isWeb);

  const [cliente, setCliente] = useState<string>('');
  const [mesa, setMesa] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mesaModalVisible, setMesaModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);

  // Address
  const [addressVisible, setAddressVisible] = useState(false);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  // Info Adicionais
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoText, setInfoText] = useState('');

  const mesaOptions = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
  const itemOptions = (dataStore.menuItems || []).map((item) => item.name);

  const total = useMemo(() => {
    if (!cart || cart.length === 0) return 0;
    return cart.reduce((sum, item) => {
      const price = parseFloat(String(item.price)) || 0;
      const qty = parseInt(String(item.quantity), 10) || 0;
      return sum + price * qty;
    }, 0);
  }, [cart]);

  // Preload order if in editing mode
  useEffect(() => {
    if (editOrderId) {
      const order = dataStore.orders.find((o) => o.id === editOrderId);
      if (order) {
        setCliente(order.clientName);
        setMesa(order.table === 'DELIVERY' ? '' : order.table);
        setCart((order.items || []).map((i) => ({ id: i.id, name: i.name, price: parseFloat(String(i.price)) || 0, quantity: i.quantity || 1 })));
        if (order.address) {
          setAddressVisible(true);
          setAddress(order.address);
        }
        if (order.additionalInfo) {
          setInfoVisible(true);
          setInfoText(order.additionalInfo);
        }
      }
    }
  }, [editOrderId]);

  // Auto-fetch CEP
  useEffect(() => {
    const clean = address.cep.replace(/\D/g, '');
    if (clean.length === 8) {
      handleFetchCep(clean);
    } else {
      setCepError('');
    }
  }, [address.cep]);

  const handleFetchCep = async (cleanCep: string) => {
    setCepLoading(true);
    setCepError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
      } else {
        setAddress((a) => ({
          ...a,
          rua: data.logradouro || a.rua,
          bairro: data.bairro || a.bairro,
          cidade: data.localidade || a.cidade,
          estado: data.uf || a.estado,
        }));
      }
    } catch {
      setCepError('Erro ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleSelectItem = (itemName: string) => {
    const found = dataStore.menuItems.find((i) => i.name === itemName);
    if (!found) return;
    setItemModalVisible(false);

    setCart((prev) => {
      const existing = prev.find((c) => c.id === found.id);
      if (existing) {
        return prev.map((c) =>
          c.id === found.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { id: found.id, name: found.name, price: parseFloat(String(found.price)) || 0, quantity: 1 }];
    });
  };

  const handleQtyChange = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleFinalize = async () => {
    if (!cliente) {
      Toast.show({ type: 'error', text1: 'Preencha o nome do cliente.' });
      return;
    }
    if (!mesa && !addressVisible) {
      Toast.show({ type: 'error', text1: 'Selecione a mesa.' });
      return;
    }
    if (cart.length === 0) {
      Toast.show({ type: 'error', text1: 'Adicione pelo menos um item ao pedido.' });
      return;
    }

    if (addressVisible) {
      const { rua, numero, bairro, cidade, estado, semNumero } = address;
      if (!rua || (!numero && !semNumero) || !bairro || !cidade || !estado) {
        Toast.show({ type: 'error', text1: 'Preencha os campos obrigatórios do endereço (Rua, Nº, Bairro, Cidade, UF).' });
        return;
      }
    }

    Toast.show({ type: 'info', text1: 'Salvando pedido...' });
    try {
      if (editOrderId) {
        dataStore.updateOrder(editOrderId as string, {
          clientName: cliente,
          table: addressVisible ? 'DELIVERY' : mesa,
          items: cart.map((c) => ({ id: c.id, name: c.name, price: c.price, quantity: c.quantity })),
          address: addressVisible ? address : undefined,
          additionalInfo: infoText || undefined,
        });
        Toast.show({ type: 'success', text1: 'Pedido atualizado com sucesso!' });
      } else {
        await dataStore.addOrder({
          clientName: cliente,
          table: addressVisible ? 'DELIVERY' : mesa,
          items: cart.map((c) => ({ id: c.id, name: c.name, price: c.price, quantity: c.quantity })),
          address: addressVisible ? address : undefined,
          additionalInfo: infoText || undefined,
        } as any);
        Toast.show({ type: 'success', text1: 'Pedido criado com sucesso!' });
      }
      router.back();
    } catch (err: any) {
      console.error('Order finalize failed:', err);
      const message = err?.response?.data?.message || err?.message || 'Erro ao salvar alterações do pedido.';
      if (Array.isArray(message)) {
        Toast.show({ type: 'error', text1: message.join(', ') });
      } else {
        Toast.show({ type: 'error', text1: message });
      }
    }
  };

  return (
    <ProtectedRoute abilities={['orders:create', 'orders:edit-items']} requireAll={false} redirect>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header with Back Arrow */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ChevronLeftIcon color={theme.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{editOrderId ? 'Editar Pedido' : 'Sobre o pedido'}</Text>
            <View style={styles.headerLine} />
          </View>

          {/* Cliente + Mesa */}
          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Nome do cliente"
                placeholderTextColor={theme.text + '80'}
                value={cliente}
                onChangeText={setCliente}
                onSubmitEditing={handleFinalize}
              />
            </View>
            {!addressVisible && (
              <TouchableOpacity
                style={styles.pickerContainer}
                activeOpacity={0.7}
                onPress={() => setMesaModalVisible(true)}
              >
                <Text style={styles.pickerText}>{mesa || 'Mesa'}</Text>
                <ChevronDownIcon color={theme.text} size={20} />
              </TouchableOpacity>
            )}
          </View>

          {/* Cart Items */}
          {cart.length > 0 && (
            <View style={styles.cartSection}>
              <Text style={styles.cartSectionTitle}>Itens do pedido</Text>
              {cart.map((item, index) => (
                <View key={item.id} style={[styles.cartItem, index === cart.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      R$ {( (parseFloat(String(item.price)) || 0) * (parseInt(String(item.quantity), 10) || 0) ).toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                  <View style={styles.cartItemControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQtyChange(item.id, -1)}>
                      {item.quantity === 1 ? (
                        <TrashIcon color={theme.contrast} size={14} />
                      ) : (
                        <MinusIcon color={theme.text} size={14} />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity.toString().padStart(2, '0')}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQtyChange(item.id, 1)}>
                      <PlusIcon color={theme.text} size={14} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>
          )}

          {/* Add Item Button */}
          <TouchableOpacity
            style={styles.addMoreContainer}
            activeOpacity={0.7}
            onPress={() => setItemModalVisible(true)}
          >
            <Text style={styles.addMoreText}>
              {cart.length === 0 ? 'Selecione um item do cardápio' : '+ Adicionar outro item'}
            </Text>
            <ChevronDownIcon color={theme.text} opacity={0.5} size={20} />
          </TouchableOpacity>

          {/* Address Section */}
          {addressVisible && (
            <View style={styles.addressSection}>
              <Text style={styles.sectionTitle}>Endereço de Entrega (Delivery)</Text>

              <View style={styles.cepRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="CEP (opcional)"
                  placeholderTextColor={theme.text + '80'}
                  value={address.cep}
                  onChangeText={(v) => setAddress(a => ({ ...a, cep: v }))}
                  keyboardType="numeric"
                  maxLength={9}
                />
                {cepLoading && <ActivityIndicator color={theme.contrast} style={{ marginLeft: 8 }} />}
              </View>
              {cepError ? <Text style={styles.errorText}>{cepError}</Text> : null}

              <TextInput
                style={[styles.input, { marginBottom: 10 }]}
                placeholder="Rua / Logradouro *"
                placeholderTextColor={theme.text + '80'}
                value={address.rua}
                onChangeText={(v) => setAddress((a) => ({ ...a, rua: v }))}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, opacity: address.semNumero ? 0.4 : 1 }]}
                  placeholder="Número *"
                  placeholderTextColor={theme.text + '80'}
                  value={address.numero}
                  onChangeText={(v) => setAddress((a) => ({ ...a, numero: v }))}
                  keyboardType="numeric"
                  editable={!address.semNumero}
                />
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAddress(a => ({ ...a, semNumero: !a.semNumero, numero: !a.semNumero ? '' : a.numero }))}
                >
                  <View style={[styles.checkbox, address.semNumero && styles.checkboxChecked]}>
                    {address.semNumero && <CheckIcon color="#FFF" size={14} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Sem Nº</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { marginBottom: 10 }]}
                placeholder="Complemento"
                placeholderTextColor={theme.text + '80'}
                value={address.complemento}
                onChangeText={(v) => setAddress((a) => ({ ...a, complemento: v }))}
              />

              <TextInput
                style={[styles.input, { marginBottom: 10 }]}
                placeholder="Bairro *"
                placeholderTextColor={theme.text + '80'}
                value={address.bairro}
                onChangeText={(v) => setAddress((a) => ({ ...a, bairro: v }))}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Cidade *"
                  placeholderTextColor={theme.text + '80'}
                  value={address.cidade}
                  onChangeText={(v) => setAddress((a) => ({ ...a, cidade: v }))}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="UF *"
                  placeholderTextColor={theme.text + '80'}
                  value={address.estado}
                  onChangeText={(v) => setAddress((a) => ({ ...a, estado: v }))}
                  maxLength={2}
                  autoCapitalize="characters"
                  onSubmitEditing={handleFinalize}
                />
              </View>
            </View>
          )}

          {/* Info Adicionais Section */}
          {infoVisible && (
            <View style={styles.addressSection}>
              <Text style={styles.sectionTitle}>Informações Adicionais</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                placeholder="Observações, preferências, alergias..."
                placeholderTextColor={theme.text + '80'}
                value={infoText}
                onChangeText={setInfoText}
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          <View style={styles.footerLine} />

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, addressVisible && styles.buttonActive]}
              onPress={() => setAddressVisible((v) => !v)}
            >
              <AddEnderecoIcon color={addressVisible ? theme.contrast : theme.text} size={16} />
              <Text style={[styles.buttonText, addressVisible && { color: theme.contrast }]}>
                {addressVisible ? 'Remover Endereço' : 'Adicionar Endereço'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, infoVisible && styles.buttonActive]}
              onPress={() => setInfoVisible((v) => !v)}
            >
              <InfoAdicionaisIcon color={infoVisible ? theme.contrast : theme.text} size={16} />
              <Text style={[styles.buttonText, infoVisible && { color: theme.contrast }]}>
                {infoVisible ? 'Remover Info' : 'Informações Adicionais'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleFinalize}>
              <FinalizarPedidoIcon color={theme.text} size={16} />
              <Text style={styles.buttonText}>{editOrderId ? 'Salvar Alterações' : 'Finalizar Pedido'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <SelectModal
          visible={mesaModalVisible}
          onClose={() => setMesaModalVisible(false)}
          onSelect={setMesa}
          options={mesaOptions}
          title="Selecione a Mesa"
        />

        <SelectModal
          visible={itemModalVisible}
          onClose={() => setItemModalVisible(false)}
          onSelect={handleSelectItem}
          options={itemOptions}
          title="Adicionar Item"
        />
      </View>
    </ProtectedRoute>
  );
});

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: isWeb ? 32 : 20,
      paddingHorizontal: isWeb ? 32 : 16,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    backBtn: {
      marginRight: 12,
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.foreground,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
      marginRight: 12,
    },
    headerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.foreground,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      marginBottom: 10,
    },
    inputWrapper: {
      flex: 1,
    },
    input: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      outlineStyle: 'none',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    } as any,
    pickerContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    pickerText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
    },
    // Cart
    cartSection: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cartSectionTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.5,
      marginBottom: 12,
    },
    cartItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.background,
    },
    cartItemInfo: {
      flex: 1,
    },
    cartItemName: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
      color: theme.text,
    },
    cartItemPrice: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: theme.text,
      opacity: 0.6,
      marginTop: 2,
    },
    cartItemControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    qtyBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      borderRadius: 10,
    },
    qtyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
      minWidth: 24,
      textAlign: 'center',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.background,
    },
    totalLabel: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: theme.contrast,
    },
    totalValue: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: theme.contrast,
    },
    addMoreContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
      marginTop: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    addMoreText: {
      flex: 1,
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
      color: theme.text,
      opacity: 0.5,
    },
    // Address
    addressSection: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      gap: 10,
    },
    sectionTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.5,
      marginBottom: 4,
    },
    cepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    errorText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: '#EF4444',
      marginTop: -4,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 4,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.contrast,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.contrast,
    },
    checkboxLabel: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      color: theme.text,
    },
    footerLine: {
      height: 1,
      backgroundColor: theme.foreground,
      marginVertical: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
    },
    button: {
      flex: 1,
      minWidth: 130,
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    buttonActive: {
      borderWidth: 1.5,
      borderColor: theme.contrast,
    },
    buttonText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_600SemiBold',
    },
    primaryButton: {
      backgroundColor: theme.contrast,
    },
  });
}
