import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useAppTheme } from '@/themes/colors';
import { dataStore, OrderStatus, StatusHistoryEntry } from '@/stores/DataStore';
import { authStore } from '@/stores/AuthStore';
import { useRouter } from 'expo-router';

interface OrderItem {
  id: string;
  quantity: number;
  name: string;
  price: number;
}

interface OrderCardProps {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  elapsedTime: string;
  items?: OrderItem[];
  createdAt: string;
  table?: string;
  address?: any;
  statusHistory: StatusHistoryEntry[];
  additionalInfo?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  PREPARANDO: 'Preparando',
  SAIU_PARA_ENTREGA: 'Saiu para Entrega',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: '#F59E0B',
  PREPARANDO: '#3B82F6',
  SAIU_PARA_ENTREGA: '#8B5CF6',
  CONCLUIDO: '#10B981',
  CANCELADO: '#EF4444',
};

const NEXT_STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Aceitar →',
  PREPARANDO: 'Finalizar →',
  SAIU_PARA_ENTREGA: 'Entregar →',
  CONCLUIDO: 'Concluído ✓',
  CANCELADO: 'Cancelado',
};

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function useStageTimer(statusHistory: StatusHistoryEntry[], isFinal: boolean, createdAt: string) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    const update = () => {
      if (isFinal) {
        // Show total duration: terminal status timestamp - creation timestamp
        const start = new Date(createdAt).getTime();
        const end = new Date(statusHistory[statusHistory.length - 1].timestamp).getTime();
        setElapsed(formatDuration(end - start));
        return;
      }

      // Show current stage duration: now - current status timestamp
      const currentEntry = statusHistory[statusHistory.length - 1];
      if (!currentEntry) return;

      const diffMs = Date.now() - new Date(currentEntry.timestamp).getTime();
      setElapsed(formatDuration(diffMs));
    };

    update();
    if (isFinal) return;

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [statusHistory, isFinal, createdAt]);

  return elapsed;
}

export function OrderCard({ id, orderNumber, customerName, status, total, items, createdAt, table, address, statusHistory, additionalInfo }: OrderCardProps) {
  const theme = useAppTheme();
  const styles = makeStyles(theme, status);
  const router = useRouter();
  const activeRole = authStore.activeRole;

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO'>('PIX');
  const [rating, setRating] = useState(5);
  
  const isFinal = status === 'CONCLUIDO' || status === 'CANCELADO';
  const displayTimer = useStageTimer(statusHistory, isFinal, createdAt);

  const handleAdvanceStatus = () => {
    if (!isFinal) {
      dataStore.updateOrderStatus(id);
    }
  };

  const handleCancel = () => {
    dataStore.cancelOrder(id);
    setDetailsVisible(false);
  };

  // Status transitions for labels
  const getNextLabel = () => {
    if (status === 'PREPARANDO' && address) return 'Enviar →';
    return NEXT_STATUS_LABELS[status] ?? 'Status';
  };

  return (
    <>
      <View style={styles.card}>
        {/* Header Row */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orderNumber}>#{orderNumber}</Text>
            <Text style={styles.customerName}>{customerName}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{STATUS_LABELS[status] ?? status}</Text>
          </View>
        </View>

        {/* Items Summary */}
        {(items || []).length > 0 && (
          <View style={styles.itemsList}>
            {(items || []).slice(0, 2).map((item, idx) => (
              <View key={`${item.id}-${idx}`} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</Text>
              </View>
            ))}
            {(items || []).length > 2 && (
              <Text style={styles.moreItems}>+ {(items || []).length - 2} mais...</Text>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Total and Time */}
        <View style={styles.footerInfo}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={styles.dottedLine} />
            <Text style={styles.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
          </View>
          
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>{isFinal ? 'Tempo Gasto' : 'Tempo na etapa'}</Text>
            <Text style={styles.timeValue}>{displayTimer}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.detailsBtn} activeOpacity={0.7} onPress={() => setDetailsVisible(true)}>
            <Text style={styles.detailsBtnText}>Detalhes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusBtn, isFinal && styles.statusBtnDisabled]} 
            activeOpacity={0.7} 
            onPress={handleAdvanceStatus}
            disabled={isFinal}
          >
            <Text style={styles.statusBtnText}>{getNextLabel()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Details Modal */}
      <Modal visible={detailsVisible} transparent animationType="fade" onRequestClose={() => setDetailsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Pedido #{orderNumber}</Text>
              <View style={[styles.statusBadge, { marginTop: 0, backgroundColor: STATUS_COLORS[status] }]}>
                <Text style={styles.statusText}>{STATUS_LABELS[status] ?? status}</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalLabel, { color: theme.text }]}>Cliente</Text>
                <Text style={[styles.modalValue, { color: theme.text }]}>{customerName}</Text>
              </View>
              {table && !address && (
                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: theme.text }]}>Mesa</Text>
                  <Text style={[styles.modalValue, { color: theme.text }]}>{table}</Text>
                </View>
              )}
              {address && (
                <View style={[styles.modalInfoRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <Text style={[styles.modalLabel, { color: theme.text, marginBottom: 4 }]}>Endereço de Entrega</Text>
                  <Text style={[styles.modalValue, { color: theme.text, opacity: 0.8, fontSize: 13 }]}>
                    {address.rua}, {address.semNumero ? 'S/N' : address.numero}{address.complemento ? ` - ${address.complemento}` : ''}
                  </Text>
                  <Text style={[styles.modalValue, { color: theme.text, opacity: 0.8, fontSize: 13 }]}>
                    {address.bairro} - {address.cidade}/{address.estado}
                  </Text>
                </View>
              )}

              <View style={[styles.divider, { marginVertical: 16 }]} />

              {/* Status History / Durations */}
              <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Histórico de Tempos</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {statusHistory.map((entry, idx) => {
                  const nextEntry = statusHistory[idx + 1];
                  const startTime = new Date(entry.timestamp).getTime();
                  const endTime = nextEntry ? new Date(nextEntry.timestamp).getTime() : Date.now();
                  const duration = formatDuration(endTime - startTime);
                  
                  return (
                    <View key={idx} style={styles.modalInfoRow}>
                      <Text style={[styles.modalValue, { color: theme.text, opacity: 0.6 }]}>{STATUS_LABELS[entry.status]}</Text>
                      <Text style={[styles.modalValue, { color: theme.text, fontFamily: 'Jost_700Bold' }]}>
                        {idx === statusHistory.length - 1 && !isFinal ? `Em andamento (${duration})` : duration}
                      </Text>
                    </View>
                  );
                })}
                <View style={[styles.modalInfoRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: theme.background, paddingTop: 8 }]}>
                  <Text style={[styles.modalLabel, { color: theme.contrast, opacity: 1 }]}>Tempo Gasto</Text>
                  <Text style={[styles.modalValue, { color: theme.contrast, fontFamily: 'Jost_700Bold', fontSize: 16 }]}>
                    {formatDuration((isFinal ? new Date(statusHistory[statusHistory.length - 1]?.timestamp || createdAt).getTime() : Date.now()) - new Date(createdAt || Date.now()).getTime())}
                  </Text>
                </View>
              </View>

              {additionalInfo && (
                <View style={{ marginBottom: 16, marginTop: 8 }}>
                  <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Informações Adicionais</Text>
                  <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 12 }}>
                    <Text style={{ color: theme.text, opacity: 0.8, fontSize: 13, lineHeight: 18 }}>{additionalInfo}</Text>
                  </View>
                </View>
              )}

              <View style={[styles.divider, { marginVertical: 16, opacity: 0.3 }]} />

              <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Itens</Text>
              <View style={{ gap: 10 }}>
                {(items || []).map((item, idx) => (
                  <View key={`${item.id}-${idx}`} style={styles.modalItemRow}>
                    <Text style={[styles.modalItemQty, { color: theme.contrast }]}>{item.quantity}x</Text>
                    <Text style={[styles.modalItemName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.modalItemPrice, { color: theme.text }]}>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.divider, { marginVertical: 16 }]} />

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.contrast }]}>Total</Text>
                <View style={styles.dottedLine} />
                <Text style={[styles.totalValue, { color: theme.contrast }]}>R$ {total.toFixed(2).replace('.', ',')}</Text>
              </View>

              <View style={styles.modalActions}>
                {!isFinal && (activeRole === 'GARCOM' || activeRole === 'GERENTE') && (
                  <View style={{ gap: 10, marginBottom: 12 }}>
                    <TouchableOpacity 
                      style={[styles.modalCloseBtn, { backgroundColor: theme.contrast }]} 
                      onPress={() => {
                        setDetailsVisible(false);
                        router.push(`/(auth)/pedidos/addPedido?editOrderId=${id}` as any);
                      }}
                    >
                      <Text style={{ fontFamily: 'Jost_700Bold', color: '#FFF', fontSize: 15 }}>📝 Editar / Retirar Itens</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalCloseBtn, { backgroundColor: '#10B981' }]} 
                      onPress={() => setCheckoutVisible(true)}
                    >
                      <Text style={{ fontFamily: 'Jost_700Bold', color: '#FFF', fontSize: 15 }}>💰 Fechar Conta (Nota)</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!isFinal && (
                  <TouchableOpacity 
                    style={[styles.modalCancelBtn, { backgroundColor: '#EF4444' + '22', borderColor: '#EF4444' + '44' }]} 
                    onPress={handleCancel}
                  >
                    <Text style={{ fontFamily: 'Jost_700Bold', color: '#EF4444', fontSize: 15 }}>Cancelar Pedido</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailsVisible(false)}>
                  <Text style={styles.modalCloseBtnText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Checkout Bill Closure Modal */}
      <Modal visible={checkoutVisible} transparent animationType="slide" onRequestClose={() => setCheckoutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 12 }]}>Fechamento de Conta</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Receipt Breakdown */}
              <View style={{ gap: 8, marginBottom: 16 }}>
                <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Resumo Financeiro</Text>
                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: theme.text }]}>Subtotal</Text>
                  <Text style={[styles.modalValue, { color: theme.text, fontFamily: 'Jost_700Bold' }]}>
                    R$ {total.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
                
                {/* Splitting check row */}
                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalLabel, { color: theme.text }]}>Dividir Conta</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity 
                      style={styles.circleBtn}
                      onPress={() => setSplitCount(Math.max(1, splitCount - 1))}
                    >
                      <Text style={{ color: theme.text, fontFamily: 'Jost_700Bold', fontSize: 16 }}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.modalValue, { color: theme.text, fontFamily: 'Jost_700Bold' }]}>{splitCount}x</Text>
                    <TouchableOpacity 
                      style={styles.circleBtn}
                      onPress={() => setSplitCount(splitCount + 1)}
                    >
                      <Text style={{ color: theme.text, fontFamily: 'Jost_700Bold', fontSize: 16 }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {splitCount > 1 && (
                  <View style={[styles.modalInfoRow, { marginTop: 4 }]}>
                    <Text style={[styles.modalLabel, { color: theme.contrast }]}>Valor por Pessoa</Text>
                    <Text style={[styles.modalValue, { color: theme.contrast, fontFamily: 'Jost_700Bold', fontSize: 16 }]}>
                      R$ {(total / splitCount).toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.divider, { marginVertical: 12 }]} />

              {/* Payment Methods */}
              <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Método de Pagamento</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {(['PIX', 'CREDITO', 'DEBITO', 'DINHEIRO'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodBtn,
                      { backgroundColor: theme.background, borderColor: 'transparent', borderWidth: 2 },
                      paymentMethod === method && { borderColor: theme.contrast, backgroundColor: theme.contrast + '15' }
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text style={[styles.methodText, { color: theme.text }, paymentMethod === method && { color: theme.contrast, fontWeight: '700' }]}>
                      {method === 'CREDITO' ? 'Crédito' : method === 'DEBITO' ? 'Débito' : method === 'DINHEIRO' ? 'Dinheiro' : 'PIX'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Satisfaction Selector */}
              <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Avaliação Geral (Satisfação)</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Text style={{ fontSize: 32, color: star <= rating ? '#FBBF24' : theme.text + '33' }}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.divider, { marginVertical: 16 }]} />

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalCloseBtn, { backgroundColor: '#10B981' }]} 
                  onPress={() => {
                    dataStore.closeOrder(id, paymentMethod, rating);
                    setCheckoutVisible(false);
                    setDetailsVisible(false);
                  }}
                >
                  <Text style={{ fontFamily: 'Jost_700Bold', color: '#FFF', fontSize: 15 }}>Confirmar e Fechar Conta</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalCloseBtn} 
                  onPress={() => setCheckoutVisible(false)}
                >
                  <Text style={styles.modalCloseBtnText}>Voltar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(theme: any, status: string) {
  const statusColor = STATUS_COLORS[status] ?? '#3B82F6';

  return StyleSheet.create({
    card: {
      backgroundColor: theme.foreground,
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
      minHeight: 340,
      justifyContent: 'space-between',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    orderNumber: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
    },
    customerName: {
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: theme.text,
      opacity: 0.8,
    },
    statusBadge: {
      backgroundColor: statusColor,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 100,
      marginTop: 4,
    },
    statusText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      color: '#FFFFFF',
    },
    itemsList: {
      marginBottom: 12,
      minHeight: 60,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    itemQty: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.contrast,
      width: 28,
    },
    itemName: {
      flex: 1,
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      opacity: 0.9,
    },
    itemPrice: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
    },
    moreItems: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: theme.text,
      opacity: 0.5,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: theme.background,
      marginBottom: 16,
      opacity: 0.5,
    },
    footerInfo: {
      marginBottom: 20,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    totalLabel: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.contrast,
    },
    dottedLine: {
      flex: 1,
      height: 1,
      borderStyle: 'dotted',
      borderWidth: 1,
      borderColor: theme.contrast,
      opacity: 0.3,
      marginHorizontal: 10,
      marginTop: 6,
    },
    totalValue: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.contrast,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timeLabel: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
    },
    timeValue: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    detailsBtn: {
      flex: 1,
      backgroundColor: theme.background,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailsBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: theme.text,
    },
    statusBtn: {
      flex: 1,
      backgroundColor: theme.contrast,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusBtnDisabled: {
      opacity: 0.4,
    },
    statusBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: '#FFFFFF',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      width: '100%',
      maxWidth: 480,
      maxHeight: '90%',
      borderRadius: 28,
      padding: 28,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 20,
    },
    modalInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    modalLabel: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
      opacity: 0.6,
    },
    modalValue: {
      fontFamily: 'Jost_400Regular',
      fontSize: 15,
    },
    modalSectionTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      marginBottom: 12,
    },
    modalItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    modalItemQty: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      width: 32,
    },
    modalItemName: {
      flex: 1,
      fontFamily: 'Jost_400Regular',
      fontSize: 15,
    },
    modalItemPrice: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
    },
    modalActions: {
      gap: 12,
      marginTop: 20,
    },
    modalCancelBtn: {
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    modalCloseBtn: {
      backgroundColor: theme.background,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
      color: theme.text,
    },
    circleBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodBtn: {
      flex: 1,
      minWidth: 90,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
    },
  });
}
