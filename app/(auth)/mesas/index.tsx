import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';
import {
  ChevronLeftIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  PinIcon,
} from '@/components/shared/Icons';

export default observer(function GerenciarMesasScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<{ id: string; number: string; capacity: string } | null>(null);
  const [formNumber, setFormNumber] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ visible: boolean; id: string; number: string }>({ visible: false, id: '', number: '' });

  useEffect(() => {
    dataStore.fetchTables();
  }, []);

  useRealtimeChannel('table:changed', () => {
    Toast.show({ type: 'info', text1: 'Mesas atualizadas em tempo real' });
  });

  const tables = dataStore.tables.filter((t) => t.isActive);
  const hasFeature = dataStore.hasTablesFeature;

  const handleActivate = async () => {
    setLoading(true);
    try {
      await dataStore.enableTablesFeature(true);
      Toast.show({ type: 'success', text1: 'Sistema de Mesas ativado!' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao ativar sistema de mesas.';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await dataStore.enableTablesFeature(false);
      Toast.show({ type: 'success', text1: 'Sistema de Mesas desativado.' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao desativar sistema de mesas.';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTable(null);
    setFormNumber('');
    setFormCapacity('');
    setShowAddModal(true);
  };

  const openEditModal = (table: typeof dataStore.tables[0]) => {
    setEditingTable({ id: table.id, number: table.number, capacity: String(table.capacity) });
    setFormNumber(table.number);
    setFormCapacity(String(table.capacity));
    setShowAddModal(true);
  };

  const handleSaveTable = async () => {
    if (!formNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Informe o número da mesa.' });
      return;
    }
    const capacity = parseInt(formCapacity, 10);
    if (!capacity || capacity < 1) {
      Toast.show({ type: 'error', text1: 'A capacidade deve ser no mínimo 1.' });
      return;
    }

    setLoading(true);
    try {
      if (editingTable) {
        await dataStore.updateTable(editingTable.id, { number: formNumber.trim(), capacity });
        Toast.show({ type: 'success', text1: `Mesa ${formNumber.trim()} atualizada!` });
      } else {
        await dataStore.createTable(formNumber.trim(), capacity);
        Toast.show({ type: 'success', text1: `Mesa ${formNumber.trim()} cadastrada!` });
      }
      setShowAddModal(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao salvar mesa.';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    const { id, number } = deleteConfirm;
    try {
      await dataStore.deleteTable(id);
      Toast.show({ type: 'success', text1: `Mesa ${number} removida.` });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao remover mesa.';
      Toast.show({ type: 'error', text1: msg });
    }
    setDeleteConfirm({ visible: false, id: '', number: '' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeftIcon color={theme.text} size={24} />
          <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Mesas</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: 40 },
          isWeb && { maxWidth: 600, width: '100%', alignSelf: 'center' },
        ]}
      >
        {/* Status Card */}
        {!hasFeature ? (
          <View style={[styles.statusCard, { backgroundColor: theme.foreground }]}>
            <View style={[styles.statusIconBox, { backgroundColor: theme.background }]}>
              <PinIcon color={theme.text} size={24} />
            </View>
            <Text style={[styles.statusTitle, { color: theme.text }]}>Sistema de Mesas</Text>
            <Text style={[styles.statusDesc, { color: theme.text }]}>
              Ative o sistema de mesas para começar a cadastrar e gerenciar as mesas do seu restaurante.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.contrast }]}
              onPress={handleActivate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Ativar Sistema de Mesas</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.statusCard, { backgroundColor: theme.foreground }]}>
            <View style={styles.activeRow}>
              <View style={styles.activeInfo}>
                <View style={[styles.activeBadge, { backgroundColor: theme.contrast + '20' }]}>
                  <CheckIcon color={theme.contrast} size={14} />
                  <Text style={[styles.activeBadgeText, { color: theme.contrast }]}>Ativo</Text>
                </View>
                <Text style={[styles.statusTitle, { color: theme.text, marginTop: 8 }]}>
                  Sistema de Mesas
                </Text>
                <Text style={[styles.statusDesc, { color: theme.text }]}>
                  O sistema de mesas está ativo. {tables.length} mesa{tables.length !== 1 ? 's' : ''} cadastrada{tables.length !== 1 ? 's' : ''}.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.deactivateBtn, { borderColor: theme.text + '20' }]}
                onPress={handleDeactivate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.text} size="small" />
                ) : (
                  <Text style={[styles.deactivateBtnText, { color: theme.text }]}>Desativar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Table List */}
        {hasFeature && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mesas Cadastradas</Text>

            {tables.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.foreground }]}>
                <PinIcon color={theme.text} size={32} style={{ opacity: 0.3 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma mesa cadastrada</Text>
                <Text style={[styles.emptyDesc, { color: theme.text }]}>
                  Clique em "Adicionar Mesa" para começar.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {tables.map((table) => (
                  <View key={table.id} style={[styles.tableCard, { backgroundColor: theme.foreground }]}>
                    <View style={[styles.tableIconBox, { backgroundColor: theme.background }]}>
                      <PinIcon color={theme.contrast} size={20} />
                    </View>
                    <View style={styles.tableInfo}>
                      <Text style={[styles.tableNumber, { color: theme.text }]}>
                        Mesa {table.number}
                      </Text>
                      <Text style={[styles.tableCapacity, { color: theme.text }]}>
                        Capacidade: {table.capacity} {table.capacity === 1 ? 'pessoa' : 'pessoas'}
                      </Text>
                    </View>
                    <View style={styles.tableActions}>
                      <TouchableOpacity
                        style={[styles.tableActionBtn, { backgroundColor: theme.background }]}
                        onPress={() => openEditModal(table)}
                      >
                        <EditIcon color={theme.text} size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tableActionBtn, { backgroundColor: '#EF444415' }]}
                        onPress={() => setDeleteConfirm({ visible: true, id: table.id, number: table.number })}
                      >
                        <TrashIcon color="#EF4444" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Add Button */}
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.foreground, borderColor: theme.contrast + '30' }]}
              onPress={openAddModal}
              activeOpacity={0.7}
            >
              <PlusIcon color={theme.contrast} size={20} />
              <Text style={[styles.addBtnText, { color: theme.contrast }]}>Adicionar Mesa</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        transparent
        visible={showAddModal}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {editingTable ? 'Editar Mesa' : 'Nova Mesa'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <CloseIcon color={theme.text} size={22} style={{ opacity: 0.6 }} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Número da Mesa</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                    placeholder="Ex: 01, A2, Balcão"
                    placeholderTextColor={theme.text + '80'}
                    value={formNumber}
                    onChangeText={setFormNumber}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Capacidade</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                    placeholder="Ex: 4"
                    placeholderTextColor={theme.text + '80'}
                    value={formCapacity}
                    onChangeText={setFormCapacity}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: theme.contrast }]}
                    onPress={handleSaveTable}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.modalBtnText}>
                        {editingTable ? 'Salvar' : 'Cadastrar'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.text + '20' }]}
                    onPress={() => setShowAddModal(false)}
                  >
                    <Text style={[styles.modalBtnTextSecondary, { color: theme.text }]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={deleteConfirm.visible}
        onClose={() => setDeleteConfirm({ visible: false, id: '', number: '' })}
        onConfirm={handleDeleteTable}
        title="Remover Mesa"
        message={`Tem certeza que deseja remover a Mesa ${deleteConfirm.number}?`}
        confirmText="Remover"
        cancelText="Cancelar"
      />
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

  // Status Card
  statusCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9CA3AF15',
  },
  statusIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  statusDesc: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Active state
  activeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
  },
  activeInfo: {
    flex: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  activeBadgeText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 12,
  },
  deactivateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  deactivateBtnText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 13,
    opacity: 0.6,
  },

  // Section
  section: {
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    opacity: 0.45,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Empty
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#9CA3AF10',
  },
  emptyTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    marginTop: 8,
  },
  emptyDesc: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
  },

  // List
  list: {
    gap: 10,
    marginBottom: 16,
  },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#9CA3AF15',
  },
  tableIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableInfo: {
    flex: 1,
  },
  tableNumber: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
  },
  tableCapacity: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    opacity: 0.55,
    marginTop: 2,
  },
  tableActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tableActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    opacity: 0.7,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalActions: {
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  modalBtnTextSecondary: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
});
