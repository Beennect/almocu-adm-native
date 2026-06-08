import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon, TrashIcon, TruckIcon, FileTextIcon, CheckIcon, AlertIcon } from '@/components/shared/Icons';
import { SelectModal } from '@/components/shared/SelectModal';
import { UserHeader } from '@/components/shared/UserHeader';
import { dataStore } from '@/stores/DataStore';
import { permissionStore } from '@/stores/PermissionStore';
import { authStore } from '@/stores/AuthStore';
import { useAppTheme } from '@/themes/colors';
import { computeStockDelta, parseAmountInput, sanitizeAmountInput } from '@/utils/stock-helpers';
import { withLoading } from '@/utils/toast';
import { apiNfeService } from '@/services/api-nfe-service';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';

const Pagination = ({ currentPage, totalPages, onPrev, onNext, theme, styles }: any) => (
  <View style={styles.paginationContainer}>
    <TouchableOpacity
      style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
      onPress={onPrev}
      disabled={currentPage === 1}
    >
      <ChevronLeftIcon color={theme.text} size={20} />
    </TouchableOpacity>

    <View style={styles.pageIndicator}>
      <Text style={styles.pageIndicatorText}>{currentPage} / {totalPages}</Text>
    </View>

    <TouchableOpacity
      style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
      onPress={onNext}
      disabled={currentPage === totalPages}
    >
      <ChevronRightIcon color={theme.text} size={20} />
    </TouchableOpacity>
  </View>
);

const isUnitInteger = (unit?: string) => !unit || unit === 'Unidades';
const formatQty = (qty: number, unit?: string) => {
  if (isUnitInteger(unit)) return Math.round(qty).toString();
  return (Math.round(qty * 100) / 100).toString().replace('.', ',');
};

const IngredientCard = observer(({ item, onRemove, onEdit, onPress, theme, styles, canEdit, canDelete }: any) => {
  const [amount, setAmount] = useState('1');
  const parsedAmount = parseAmountInput(amount);
  const canDecrease = (item.stock ?? 0) > 0 && (Number.isFinite(parsedAmount) ? parsedAmount > 0 : false) && (item.stock ?? 0) >= parsedAmount;

  const handleUpdate = async (sign: 1 | -1) => {
    const val = parseAmountInput(amount);
    const { delta, error } = computeStockDelta(item.stock ?? 0, sign, val, {
      name: item.name,
      unit: item.unit,
    });

    if (error || delta === 0) {
      Toast.show({ type: 'error', text1: error || 'Não foi possível ajustar o estoque.' });
      return;
    }

    await withLoading(
      () => dataStore.updateIngredientStock(item.id, delta),
      { loading: 'Ajustando estoque...', success: 'Estoque ajustado!', error: 'Erro ao ajustar estoque' }
    );
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!onPress}
      >
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>{formatQty(item.stock, item.unit)} {item.unit}</Text>
        {item.supplierName ? (
          <View style={styles.supplierRow}>
            <TruckIcon color={theme.text} opacity={0.4} size={11} />
            <Text style={styles.supplierName} numberOfLines={1}>{item.supplierName}</Text>
          </View>
        ) : null}
        <View style={styles.badgePlaceholder}>
          {item.stock <= 3 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Estoque Baixo</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {canEdit && (
        <View style={styles.cardActions}>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={[styles.qtyBtn, !canDecrease && styles.qtyBtnDisabled]}
              onPress={() => handleUpdate(-1)}
              disabled={!canDecrease}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.qtyInput}
              value={amount}
              onChangeText={(text) => setAmount(sanitizeAmountInput(text))}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.text + '40'}
            />

            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => handleUpdate(1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={onEdit}>
              <View style={{ opacity: 0.6 }}>
                <EditIcon color={theme.text} size={18} />
              </View>
            </TouchableOpacity>
            {canDelete && (
              <TouchableOpacity onPress={onRemove}>
                <TrashIcon color={theme.contrast} size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
});

type FilterMode = 'todos' | 'alfabetica' | 'estoque_baixo' | 'apenas_kg' | 'apenas_litros' | 'apenas_unidades' | 'recentes' | 'antigos';

const FILTER_LABELS: Record<FilterMode, string> = {
  todos: 'Todos',
  alfabetica: 'A-Z ↓',
  estoque_baixo: 'Estoque Baixo ↓',
  apenas_kg: 'Apenas Kg',
  apenas_litros: 'Apenas Litros',
  apenas_unidades: 'Apenas Unidades',
  recentes: 'Mais Recentes ↓',
  antigos: 'Mais Antigos ↑',
};

const getGridColumns = (width: number) => {
  if (width >= 1440) return 3;
  if (width >= 1024) return 2;
  return 1;
};

export default observer(function EstoqueScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const gridColumns = getGridColumns(width);
  const styles = makeStyles(theme, isWeb, gridColumns);
  const router = useRouter();

  // Redirect if user doesn't have stock:view permission
  useEffect(() => {
    if (!permissionStore.can('stock:view')) {
      router.replace('/(auth)');
    }
  }, []);

  const canEditStock = permissionStore.can('stock:edit');
  const canCreateStock = permissionStore.can('stock:create');
  const canDeleteStock = permissionStore.can('stock:delete');
  const isGerente = authStore.activeRole === 'GERENTE';

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [nfeModalVisible, setNfeModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [nfeResult, setNfeResult] = useState<{ created: number; updated: number; errors: string[]; supplierName?: string } | null>(null);

  useEffect(() => {
    dataStore.refreshSuppliers();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isWeb ? 12 : 6;

  // Filter and Sort logic
  const processIngredients = () => {
    let list = [...dataStore.ingredients];

    // Search
    if (searchTerm) {
      list = list.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by unit
    if (filterMode === 'apenas_kg') list = list.filter(i => i.unit === 'Kg');
    if (filterMode === 'apenas_litros') list = list.filter(i => i.unit === 'Litros');
    if (filterMode === 'apenas_unidades') list = list.filter(i => i.unit === 'Unidades');

    // Sort or specific filters
    if (filterMode === 'alfabetica') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterMode === 'estoque_baixo') {
      list = list.filter(i => i.stock <= 3);
      list.sort((a, b) => a.stock - b.stock);
    } else if (filterMode === 'recentes') {
      list.reverse(); // Assuming original order is chronological
    } else if (filterMode === 'antigos') {
      // already sorted by oldest if added at end
    }

    return list;
  };

  const processedIngredients = processIngredients();
  const totalPages = Math.ceil(processedIngredients.length / itemsPerPage);
  const paginatedIngredients = processedIngredients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const scrollRef = useRef<ScrollView>(null);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [searchTerm, filterMode]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const removeIngredient = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId) {
      await withLoading(
        async () => {
          await dataStore.removeIngredient(confirmDeleteId);
          setConfirmDeleteId(null);
        },
        { loading: 'Removendo ingrediente...', success: 'Ingrediente removido', error: 'Erro ao remover ingrediente' }
      );
    }
  };

  return (
    <View style={styles.container}>
      {!isWeb && <UserHeader />}

      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor={theme.text + '80'}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterBtnText}>{FILTER_LABELS[filterMode]}</Text>
          </TouchableOpacity>

          {isGerente && (
            <TouchableOpacity
              style={styles.importXmlBtn}
              activeOpacity={0.8}
              onPress={() => { setNfeModalVisible(true); setSelectedFile(null); setNfeResult(null); }}
            >
              <FileTextIcon color={theme.contrast} size={22} />
            </TouchableOpacity>
          )}

          {canCreateStock && (
            <TouchableOpacity
              style={styles.plusBtn}
              activeOpacity={0.8}
              onPress={() => router.push('estoque/addItem')}
            >
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionText}>Estoque Atual</Text>
          <View style={styles.dividerLine} />
          <Text style={styles.sectionCount}>{processedIngredients.length} item{processedIngredients.length !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.grid}>
          {paginatedIngredients.length > 0 ? (
            paginatedIngredients.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <IngredientCard
                  item={item}
                  onRemove={() => removeIngredient(item.id)}
                  onEdit={() => router.push({ pathname: 'estoque/addItem', params: { id: item.id } })}
                  onPress={() => router.push(`estoque/${item.id}` as any)}
                  theme={theme}
                  styles={styles}
                  canEdit={canEditStock}
                  canDelete={canDeleteStock}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchTerm || filterMode !== 'todos' ? 'Nenhum ingrediente encontrado.' : 'Estoque vazio.'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchTerm || filterMode !== 'todos' ? 'Tente ajustar os filtros ou a busca.' : 'Adicione ingredientes para começar!'}
              </Text>
            </View>
          )}
        </View>

        {/* Pagination inside Scroll for Mobile */}
        {!isWeb && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
            onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            theme={theme}
            styles={styles}
          />
        )}
      </ScrollView>

      {/* Fixed Pagination for Web */}
      {isWeb && totalPages > 1 && (
        <View style={styles.fixedPagination}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
            onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            theme={theme}
            styles={styles}
          />
        </View>
      )}

      <SelectModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onSelect={(val: any) => {
          // find key from label
          const key = (Object.keys(FILTER_LABELS) as FilterMode[]).find(k => FILTER_LABELS[k] === val);
          if (key) setFilterMode(key);
          setFilterModalVisible(false);
        }}
        options={Object.values(FILTER_LABELS)}
        title="Filtrar Por"
      />

      <ConfirmModal
        visible={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Ingrediente"
        message="Tem certeza que deseja excluir este ingrediente do estoque?"
        confirmText="Excluir"
      />

      {/* Modal de Importação XML NF-e */}
      <Modal
        visible={nfeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNfeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Importar XML</Text>
              <TouchableOpacity onPress={() => setNfeModalVisible(false)}>
                <Text style={[styles.modalClose, { color: theme.text, opacity: 0.5 }]}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.text, opacity: 0.5 }]}>
              Selecione o XML de uma Nota Fiscal Eletrônica para atualizar o estoque automaticamente.
            </Text>

            <TouchableOpacity
              style={[styles.dropZone, { borderColor: theme.contrast + '40', backgroundColor: theme.foreground }]}
              onPress={async () => {
                try {
                  const docResult = await DocumentPicker.getDocumentAsync({
                    type: 'text/xml',
                    copyToCacheDirectory: true,
                  });
                  if (docResult.canceled) return;
                  const file = docResult.assets?.[0];
                  if (!file) return;
                  if (!file.name.toLowerCase().endsWith('.xml')) {
                    Toast.show({ type: 'error', text1: 'Selecione um arquivo XML.' });
                    return;
                  }
                  if (file.size && file.size > 10 * 1024 * 1024) {
                    Toast.show({ type: 'error', text1: 'O arquivo excede o limite de 10 MB.' });
                    return;
                  }
                  setSelectedFile({ name: file.name, uri: file.uri, size: file.size || 0 });
                  setNfeResult(null);
                } catch {
                  Toast.show({ type: 'error', text1: 'Erro ao selecionar arquivo.' });
                }
              }}
              activeOpacity={0.7}
            >
              <FileTextIcon color={theme.contrast} size={32} />
              <Text style={[styles.dropZoneText, { color: theme.text }]}>
                {selectedFile ? selectedFile.name : 'Toque para selecionar o XML'}
              </Text>
              {selectedFile && (
                <Text style={[styles.dropZoneSize, { color: theme.text, opacity: 0.4 }]}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadBtn,
                {
                  backgroundColor: selectedFile && !uploading ? theme.contrast : theme.foreground,
                  opacity: selectedFile && !uploading ? 1 : 0.5,
                },
              ]}
              onPress={async () => {
                if (!selectedFile) return;
                setUploading(true);
                setNfeResult(null);
                try {
                  const result = await apiNfeService.uploadXmlFile(
                    selectedFile.uri,
                    selectedFile.name,
                  );
                  setNfeResult({
                    created: result.summary.created,
                    updated: result.summary.updated,
                    errors: result.summary.errors,
                    supplierName: result.supplier?.name,
                  });
                  await dataStore.refreshStock();
                  Toast.show({ type: 'success', text1: 'Estoque atualizado com sucesso!' });
                } catch (err: any) {
                  const msg = err?.message || 'Erro ao importar NF-e.';
                  Toast.show({ type: 'error', text1: msg });
                } finally {
                  setUploading(false);
                }
              }}
              disabled={!selectedFile || uploading}
              activeOpacity={0.8}
            >
              <Text style={[styles.uploadBtnText, { color: selectedFile && !uploading ? '#FFFFFF' : theme.text }]}>
                {uploading ? 'Importando...' : 'Importar Nota Fiscal'}
              </Text>
            </TouchableOpacity>

            {nfeResult && (
              <View style={[styles.resultCard, { backgroundColor: theme.foreground }]}>
                <View style={styles.resultHeader}>
                  <CheckIcon color="#4CAF50" size={18} />
                  <Text style={[styles.resultTitle, { color: theme.text }]}>Importado com sucesso</Text>
                </View>
                {nfeResult.supplierName && (
                  <View style={styles.resultRow}>
                    <TruckIcon color={theme.text} size={14} opacity={0.5} />
                    <Text style={[styles.resultText, { color: theme.text }]}>Fornecedor: {nfeResult.supplierName}</Text>
                  </View>
                )}
                <Text style={[styles.resultSummary, { color: theme.text, opacity: 0.6 }]}>
                  {nfeResult.created} item(ns) criado(s), {nfeResult.updated} atualizado(s)
                </Text>
                {nfeResult.errors.length > 0 && (
                  <View style={styles.errorsSection}>
                    <Text style={[styles.errorsTitle, { color: '#FF5252' }]}>{nfeResult.errors.length} erro(s):</Text>
                    {nfeResult.errors.map((err, idx) => (
                      <View key={idx} style={styles.errorRow}>
                        <AlertIcon color="#FF5252" size={12} />
                        <Text style={[styles.errorText, { color: '#FF5252' }]}>{err}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
});

function makeStyles(theme: any, isWeb: boolean, gridColumns: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWeb ? 0 : 20,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      gap: 16,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.foreground,
      borderRadius: 20,
      paddingHorizontal: 16,
      height: 56,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: theme.text,
      outlineStyle: 'none',
    } as any,
    topBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    filterBtn: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      paddingHorizontal: 16,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
      borderWidth: 1,
      borderColor: theme.background,
    },
    filterBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
    },
    plusBtn: {
      backgroundColor: theme.contrast,
      borderRadius: 20,
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plusBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 24,
      color: '#FFFFFF',
      marginTop: -2,
    },
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    sectionText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.foreground,
      opacity: 0.3,
    },
    sectionCount: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: theme.text,
      opacity: 0.4,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -10,
    },
    gridItem: {
      width: `${100 / gridColumns}%`,
      paddingHorizontal: 10,
      marginBottom: 16,
    },
    card: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
      minHeight: 110,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    cardSubtitle: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
    },
    badgePlaceholder: {
      height: 20,
      justifyContent: 'center',
      alignItems: 'flex-start',
      marginTop: 6,
    },
    lowStockBadge: {
      backgroundColor: '#FF525220',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    lowStockText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 10,
      color: '#FF5252',
      textTransform: 'uppercase',
    },
    supplierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    supplierName: {
      fontFamily: 'Jost_400Regular',
      fontSize: 11,
      color: theme.text,
      opacity: 0.5,
      flex: 1,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    qtyControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 2,
      borderWidth: 1,
      borderColor: theme.text + '10',
    },
    qtyInput: {
      width: 40,
      height: 32,
      textAlign: 'center',
      color: theme.text,
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      padding: 0,
    },
    qtyBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyBtnDisabled: {
      opacity: 0.3,
    },
    qtyBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
    },
    emptyContainer: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      opacity: 0.5,
    },
    emptyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      textAlign: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      gap: 16,
    },
    fixedPagination: {
      position: 'absolute',
      bottom: 24,
      left: 0,
      right: 0,
      alignItems: 'center',
      pointerEvents: 'box-none',
    },
    pageBtn: {
      backgroundColor: theme.foreground,
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.text + '10',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    pageBtnDisabled: {
      opacity: 0.3,
    },
    pageIndicator: {
      backgroundColor: theme.foreground,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.text + '10',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    pageIndicatorText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
    },
    importXmlBtn: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.contrast + '30',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    modalTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 20,
    },
    modalClose: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
    },
    modalSubtitle: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 20,
    },
    dropZone: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 16,
      padding: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    dropZoneText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      marginTop: 10,
      textAlign: 'center',
    },
    dropZoneSize: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      marginTop: 4,
    },
    uploadBtn: {
      borderRadius: 14,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    uploadBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
    },
    resultCard: {
      borderRadius: 16,
      padding: 16,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    resultTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 15,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    resultText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
    },
    resultSummary: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
    },
    errorsSection: {
      marginTop: 10,
      padding: 10,
      backgroundColor: 'rgba(255,82,82,0.08)',
      borderRadius: 10,
    },
    errorsTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 12,
      marginBottom: 6,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 5,
      marginBottom: 3,
    },
    errorText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      flex: 1,
    },
  });
}
