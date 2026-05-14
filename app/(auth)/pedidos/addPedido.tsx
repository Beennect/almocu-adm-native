import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  useWindowDimensions, 
  View,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  ChevronDownIcon, 
  FinalizarPedidoIcon, 
  MinusIcon, 
  PlusIcon,
  TrashIcon
} from '../../../components/shared/Icons';
import { SelectModal } from '../../../components/shared/SelectModal';
import { productService, Product } from '../../../services/api-product-service';
import { orderService } from '../../../services/api-order-service';

interface CartItem {
  product: Product;
  quantity: number;
}

const mesaOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];

export default function AddPedidoScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const styles = makeStyles(theme, isWeb);

  const [customerName, setCustomerName] = useState('');
  const [mesa, setMesa] = useState<string>('');
  const [observations, setObservations] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [mesaModalVisible, setMesaModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productService.getProducts();
      const mappedProducts = data.map(productService.mapProductFromBackend);
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddItem = (productName: string) => {
    const product = products.find(p => p.name === productName);
    if (product) {
      const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
      if (existingIndex >= 0) {
        const newCart = [...cartItems];
        newCart[existingIndex].quantity += 1;
        setCartItems(newCart);
      } else {
        setCartItems([...cartItems, { product, quantity: 1 }]);
      }
    }
    setItemModalVisible(false);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const newCart = [...cartItems];
    const newQty = newCart[index].quantity + delta;
    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].quantity = newQty;
    }
    setCartItems(newCart);
  };

  const handleFinishOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um item ao pedido');
      return;
    }

    setSubmitting(true);
    try {
      const items = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      await orderService.createOrder({
        items,
        origin: mesa ? `Mesa ${mesa}` : 'Balcão',
        observations: observations || undefined,
        customer: customerName || undefined,
      });

      Alert.alert('Sucesso', 'Pedido criado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Falha ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const totalValue = cartItems.reduce(
    (sum, item) => sum + (item.product.price * item.quantity), 
    0
  );

  const productNames = products.map(p => p.name);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.contrast} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sobre o pedido</Text>
          <View style={styles.headerLine} />
        </View>

        <View style={styles.row}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Nome do cliente"
              placeholderTextColor={theme.text + '80'}
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          <TouchableOpacity 
            style={styles.pickerContainer} 
            activeOpacity={0.7}
            onPress={() => setMesaModalVisible(true)}
          >
            <Text style={styles.pickerText}>{mesa || 'Mesa'}</Text>
            <View style={styles.pickerIconContainer}>
              <ChevronDownIcon color={theme.text} size={20} />
            </View>
          </TouchableOpacity>
        </View>

        {cartItems.length === 0 ? (
          <TouchableOpacity 
            style={styles.emptyCart}
            activeOpacity={0.7}
            onPress={() => setItemModalVisible(true)}
          >
            <Text style={styles.emptyCartText}>Adicionar item ao pedido</Text>
            <ChevronDownIcon color={theme.text} opacity={0.5} size={20} />
          </TouchableOpacity>
        ) : (
          <>
            {cartItems.map((item, index) => (
              <View key={item.product.id} style={styles.itemCard}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.product.description || 'Descrição não disponível'}
                  </Text>
                  <Text style={styles.itemPrice}>
                    R$ {item.product.price.toFixed(2).replace('.', ',')}
                  </Text>
                </View>

                <View style={styles.quantityDivider} />

                <View style={styles.quantitySelector}>
                  <TouchableOpacity 
                    style={styles.qtyBtn} 
                    onPress={() => handleUpdateQuantity(index, -1)}
                  >
                    <MinusIcon color={theme.text} size={16} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>
                    {item.quantity.toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity 
                    style={styles.qtyBtn} 
                    onPress={() => handleUpdateQuantity(index, 1)}
                  >
                    <PlusIcon color={theme.text} size={16} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.removeBtn}
                  onPress={() => handleRemoveItem(index)}
                >
                  <TrashIcon color="#EF4444" size={20} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addMoreContainer} 
              activeOpacity={0.7}
              onPress={() => setItemModalVisible(true)}
            >
              <Text style={styles.addMoreText}>Adicionar mais itens</Text>
              <View style={styles.pickerDivider} />
              <ChevronDownIcon color={theme.text} opacity={0.5} size={20} />
            </TouchableOpacity>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total do Pedido</Text>
              <Text style={styles.totalValue}>
                R$ {totalValue.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </>
        )}

        <View style={styles.footerLine} />

        <View style={styles.observationsContainer}>
          <TextInput
            style={styles.observationsInput}
            placeholder="Observações adicionais (opcional)"
            placeholderTextColor={theme.text + '60'}
            value={observations}
            onChangeText={setObservations}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={{...styles.button, ...styles.primaryButton}}
            onPress={handleFinishOrder}
            disabled={submitting || cartItems.length === 0}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={theme.foreground} />
            ) : (
              <>
                <FinalizarPedidoIcon color={theme.foreground} style={styles.primaryButtonIcon} />
                <Text style={styles.primaryButtonText}>Finalizar Pedido</Text>
              </>
            )}
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
        onSelect={handleAddItem}
        options={productNames}
        title="Adicionar Item"
      />
    </View>
  );
}

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: isWeb ? 32 : 20,
      paddingHorizontal: isWeb ? 32 : 16,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
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
      backgroundColor: theme.background,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    inputWrapper: {
      flex: 1,
      minWidth: 140,
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
    } as any,
    pickerContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 100,
    },
    pickerText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      marginRight: 8,
    },
    pickerIconContainer: {
      marginLeft: 4,
      color: theme.text,
    },
    pickerDivider: {
      width: 1,
      height: '40%',
      borderLeftWidth: 1,
      borderColor: theme.background,
      marginHorizontal: 12,
      borderStyle: 'dashed',
    },
    emptyCart: {
      backgroundColor: theme.foreground,
      borderRadius: 24,
      height: 120,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 24,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.background,
    },
    emptyCartText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: theme.text,
      opacity: 0.5,
    },
    itemCard: {
      backgroundColor: theme.foreground,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    itemContent: {
      flex: 1,
      paddingRight: 8,
    },
    itemName: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    itemDesc: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      color: theme.text,
      opacity: 0.6,
      marginVertical: 6,
      lineHeight: 18,
    },
    itemPrice: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    quantityDivider: {
      width: 1,
      height: '60%',
      borderLeftWidth: 1,
      borderColor: theme.background,
      borderStyle: 'dashed',
    },
    quantitySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      gap: 12,
    },
    qtyBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
      minWidth: 24,
      textAlign: 'center',
    },
    removeBtn: {
      padding: 8,
      marginLeft: 8,
    },
    addMoreContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    addMoreText: {
      flex: 1,
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: theme.text,
      opacity: 0.5,
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.foreground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    totalLabel: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    totalValue: {
      fontFamily: 'Jost_700Bold',
      fontSize: 24,
      color: theme.contrast,
    },
    footerLine: {
      height: 1,
      backgroundColor: theme.background,
      marginBottom: 24,
    },
    observationsContainer: {
      marginBottom: 24,
    },
    observationsInput: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      minHeight: 80,
      textAlignVertical: 'top',
      outlineStyle: 'none',
    } as any,
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      flexWrap: 'wrap',
    },
    button: {
      flex: isWeb ? 1 : undefined,
      flexGrow: 1,
      minWidth: isWeb ? 'auto' : 140,
      backgroundColor: theme.foreground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    buttonIcon: {
      fontSize: 18,
      color: theme.text,
    },
    buttonText: {
      color: theme.text,
      fontSize: 12,
      fontFamily: 'Jost_400Regular',
      fontWeight: '500',
    },
    primaryButton: {
      backgroundColor: theme.contrast,
    },
    primaryButtonIcon: {
      fontSize: 16,
      color: theme.foreground,
    },
    primaryButtonText: {
      color: theme.foreground,
      fontSize: 12,
      fontFamily: 'Jost_400Regular',
      fontWeight: '600',
    },
  });
}