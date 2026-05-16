import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import { toastStore } from '@/stores/ToastStore';

interface SelfCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default observer(function AutoatendimentoScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { restaurantId, table } = useLocalSearchParams();

  const [cart, setCart] = useState<SelfCartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Initialize workspace data based on query restaurantId
  useEffect(() => {
    dataStore.init();
  }, []);

  const activeTable = (table as string) || 'Mesa 01';
  const restName = dataStore.restaurantDetails?.name || 'Restaurante Almocu';

  // Filter only items that are available (KDS emergency panel handles this!)
  const availableItems = dataStore.menuItems.filter((i) => i.available !== false);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Find active orders placed by this specific table
  const tableOrders = dataStore.orders.filter(
    (o) => o.table === activeTable && o.status !== 'CONCLUIDO' && o.status !== 'CANCELADO'
  );

  const handleAddToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    toastStore.show(`${item.name} adicionado!`, 'success');
  };

  const handleQtyChange = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleSendOrder = () => {
    if (!clientName.trim()) {
      toastStore.show('Por favor, informe seu nome para identificação.', 'error');
      return;
    }
    if (cart.length === 0) {
      toastStore.show('Seu carrinho está vazio.', 'error');
      return;
    }

    try {
      dataStore.addOrder({
        clientName: clientName,
        table: activeTable,
        total: cartTotal,
        items: cart.map((c) => ({ id: c.id, name: c.name, price: c.price, quantity: c.quantity })),
      } as any);

      setCart([]);
      toastStore.show('Pedido enviado com sucesso para a cozinha!', 'success');
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Erro ao enviar pedido.';
      if (Array.isArray(message)) {
        toastStore.show(message.join(', '), 'error');
      } else {
        toastStore.show(message, 'error');
      }
    }
  };

  const handleSubmitSatisfaction = () => {
    // Add review rating globally to average score of the workspace
    dataStore.accumulateRating(rating);
    setFeedbackSubmitted(true);
    toastStore.show('Obrigado pela sua avaliação! Volte sempre.', 'success');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}>
      
      {/* Top Welcome Banner */}
      <View style={[styles.welcomeBanner, { backgroundColor: theme.foreground }]}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>🍽️</Text>
        <Text style={[styles.welcomeTitle, { color: theme.text }]}>{restName}</Text>
        <View style={[styles.tableBadge, { backgroundColor: theme.contrast }]}>
          <Text style={styles.tableBadgeText}>{activeTable} • Cardápio Digital</Text>
        </View>
        <Text style={[styles.welcomeSub, { color: theme.text, opacity: 0.6, marginTop: 10 }]}>
          Faça seus pedidos pelo celular com acompanhamento em tempo real!
        </Text>
      </View>

      {/* Real-time Order prep tracker */}
      {tableOrders.length > 0 && (
        <View style={[styles.trackerCard, { backgroundColor: theme.foreground, borderColor: theme.contrast }]}>
          <Text style={[styles.trackerTitle, { color: theme.text }]}>⏱️ Acompanhe seu Pedido</Text>
          {tableOrders.map((order) => (
            <View key={order.id} style={styles.trackerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trackerOrderNum, { color: theme.text }]}>Pedido #{order.id.slice(-4).toUpperCase()}</Text>
                <Text style={[styles.trackerStatus, { color: theme.contrast }]}>
                  Status: {order.status === 'PENDENTE' ? 'Fila de Espera' : order.status === 'PREPARANDO' ? 'No Fogo (Preparo)' : order.status}
                </Text>
              </View>
              <View style={[styles.trackerProgress, { backgroundColor: order.status === 'PREPARANDO' ? '#3B82F6' : theme.contrast }]} />
            </View>
          ))}
        </View>
      )}

      {/* Grid of Menu Items */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Seleção do Chefe</Text>
      <View style={styles.menuGrid}>
        {availableItems.length === 0 ? (
          <Text style={[styles.noItems, { color: theme.text, opacity: 0.5 }]}>Nenhum item disponível no momento.</Text>
        ) : (
          availableItems.map((item) => (
            <View key={item.id} style={[styles.menuItemCard, { backgroundColor: theme.foreground }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.itemDesc, { color: theme.text, opacity: 0.5 }]}>{item.description || 'Delicioso prato preparado na hora.'}</Text>
                <Text style={[styles.itemPrice, { color: theme.contrast }]}>
                  R$ {item.price.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: theme.contrast }]}
                onPress={() => handleAddToCart(item)}
              >
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Customer Identification */}
      <View style={[styles.cartCard, { backgroundColor: theme.foreground }]}>
        <Text style={[styles.cartTitle, { color: theme.text }]}>Identificação</Text>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          placeholder="Seu Nome *"
          placeholderTextColor={theme.text + '80'}
          value={clientName}
          onChangeText={setClientName}
        />
      </View>

      {/* Shopping Cart Summary */}
      <View style={[styles.cartCard, { backgroundColor: theme.foreground }]}>
        <Text style={[styles.cartTitle, { color: theme.text }]}>Meu Carrinho</Text>
        
        {cart.length === 0 ? (
          <Text style={[styles.emptyCart, { color: theme.text, opacity: 0.4 }]}>Nenhum prato selecionado.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {cart.map((item) => (
              <View key={item.id} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cartItemName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.cartItemPrice, { color: theme.text, opacity: 0.5 }]}>
                    R$ {item.price.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity 
                    style={[styles.qtyBtn, { backgroundColor: theme.background }]}
                    onPress={() => handleQtyChange(item.id, -1)}
                  >
                    <Text style={{ color: theme.text, fontWeight: '700' }}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: theme.text }]}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={[styles.qtyBtn, { backgroundColor: theme.background }]}
                    onPress={() => handleQtyChange(item.id, 1)}
                  >
                    <Text style={{ color: theme.text, fontWeight: '700' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>Total do Pedido</Text>
              <Text style={[styles.totalValue, { color: theme.contrast }]}>
                R$ {cartTotal.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.checkoutBtn, { backgroundColor: theme.contrast }]}
              onPress={handleSendOrder}
            >
              <Text style={styles.checkoutBtnText}>Enviar para Cozinha</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Table Checkout & Satisfaction Rating */}
      <View style={[styles.cartCard, { backgroundColor: theme.foreground }]}>
        <Text style={[styles.cartTitle, { color: theme.text }]}>Encerrar mesa & Avaliar</Text>
        <Text style={[styles.cartSub, { color: theme.text, opacity: 0.5 }]}>
          Gostou do nosso atendimento? Avalie sua experiência para nos ajudar a melhorar!
        </Text>

        {feedbackSubmitted ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontSize: 32 }}>💖</Text>
            <Text style={{ fontFamily: 'Jost_700Bold', color: '#10B981', marginTop: 6 }}>Obrigado por nos avaliar!</Text>
          </View>
        ) : (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 12 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={{ fontSize: 32, color: star <= rating ? '#FBBF24' : theme.text + '33' }}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, { backgroundColor: '#10B981' }]}
              onPress={handleSubmitSatisfaction}
            >
              <Text style={styles.checkoutBtnText}>Enviar Avaliação Geral</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  welcomeBanner: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 22,
  },
  tableBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
    marginTop: 6,
  },
  tableBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Jost_700Bold',
    fontSize: 12,
  },
  welcomeSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  trackerCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 20,
  },
  trackerTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
  },
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  trackerOrderNum: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
  },
  trackerStatus: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    marginTop: 2,
  },
  trackerProgress: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  sectionTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuGrid: {
    gap: 10,
    marginBottom: 20,
  },
  noItems: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  itemName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  itemDesc: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
    marginTop: 6,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
  cartCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cartTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
    marginBottom: 12,
  },
  cartSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Jost_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyCart: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cartItemName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
  },
  cartItemPrice: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
    width: 16,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  totalValue: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
  },
  checkoutBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
  },
});
