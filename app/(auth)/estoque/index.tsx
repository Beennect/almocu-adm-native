import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { StockDeactivateModal } from '@/components/shared/StockDeactivateModal';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, TrashIcon, TruckIcon, FileTextIcon } from '@/components/shared/Icons';
import { SelectModal } from '@/components/shared/SelectModal';
import { UserHeader } from '@/components/shared/UserHeader';
import { dataStore } from '@/stores/DataStore';
import { permissionStore } from '@/stores/PermissionStore';
import { authStore } from '@/stores/AuthStore';
import { useAppTheme } from '@/themes/colors';
import { computeStockDelta, parseAmountInput, sanitizeAmountInput } from '@/utils/stock-helpers';
import { withLoading } from '@/utils/toast';
import { apiNfeService, NfeParseItem } from '@/services/api-nfe-service';
import { getCategoryFromNcm } from '@/utils/ncmCategories';
import * as FileSystem from 'expo-file-system';
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
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';

const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  if (current > 3) pages.push('ellipsis')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)
  return pages
}

const Pagination = ({ currentPage, totalPages, onPrev, onNext, onGoTo, isWeb, theme, styles }: any) => (
  <View style={[styles.paginationContainer, isWeb && styles.paginationContainerWeb]}>
    <TouchableOpacity
      style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
      onPress={onPrev}
      disabled={currentPage === 1}
    >
      <ChevronLeftIcon color={theme.text} size={20} />
    </TouchableOpacity>

    {isWeb ? (
      <View style={styles.pageNumbersRow}>
        {getPageNumbers(currentPage, totalPages).map((page, idx) =>
          page === 'ellipsis' ? (
            <Text key={`e-${idx}`} style={[styles.pageEllipsis, { color: theme.text, opacity: 0.4 }]}>...</Text>
          ) : (
            <TouchableOpacity
              key={page}
              style={[styles.pageNumberBtn, currentPage === page && { backgroundColor: theme.contrast }]}
              onPress={() => onGoTo(page)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pageNumberText,
                  { color: currentPage === page ? '#FFFFFF' : theme.text },
                ]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    ) : (
      <View style={styles.pageIndicator}>
        <Text style={styles.pageIndicatorText}>{currentPage} / {totalPages}</Text>
      </View>
    )}

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
        <Text style={styles.cardCategory}>{item.category}</Text>
        <Text style={styles.cardSubtitle}>{formatQty(item.stock, item.unit)} {item.unit}</Text>
        {item.unitPrice ? (
          <Text style={styles.cardUnitPrice}>R$ {item.unitPrice.toFixed(2).replace('.', ',')}</Text>
        ) : null}
        {item.supplierName ? (
          <View style={styles.supplierRow}>
            <TruckIcon color={theme.text} opacity={0.4} size={11} />
            <Text style={styles.supplierName} numberOfLines={1}>{item.supplierName}</Text>
          </View>
        ) : null}
        <View style={styles.badgePlaceholder}>
          {item.minQuantity > 0 && item.stock <= item.minQuantity && (
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

const UNIT_OPTIONS = ['Kg', 'Litros', 'Unidades'];

const UNIT_NORMALIZE_MAP: Record<string, string> = {
  'KG': 'Kg', 'L': 'Litros', 'LT': 'Litros',
  'UN': 'Unidades', 'MT': 'Unidades', 'PC': 'Unidades', 'MIL': 'Unidades',
  'CX': 'Unidades', 'DZ': 'Unidades', 'PAC': 'Unidades', 'PT': 'Unidades',
  'FD': 'Unidades', 'BD': 'Unidades',
};

function normalizeUnit(u: string): string {
  return UNIT_NORMALIZE_MAP[u.trim().toUpperCase()] || 'Unidades';
}

const CATEGORY_OPTIONS = ['Grãos', 'Laticínios', 'Carnes', 'Massa', 'Conservas', 'Óleos', 'Bebidas', 'Temperos', 'Caixa', 'Outra...'];

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

  useRealtimeChannel('stock:changed', () => {
    Toast.show({ type: 'info', text1: 'Estoque atualizado em tempo real' });
  });

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
  const [nfeStep, setNfeStep] = useState<'select' | 'review'>('select');
  const [nfeParsedItems, setNfeParsedItems] = useState<EditableNfeItem[]>([]);
  const [nfeImporting, setNfeImporting] = useState(false);
  const [nfeXmlText, setNfeXmlText] = useState('');
  const [categoryPickerTarget, setCategoryPickerTarget] = useState<string | null>(null);
  const [unitPickerTarget, setUnitPickerTarget] = useState<string | null>(null);
  const [customCategoryItems, setCustomCategoryItems] = useState<Set<string>>(new Set());
  const [nfeAccessKey, setNfeAccessKey] = useState<string | null>(null);
  const [nfeSupplierName, setNfeSupplierName] = useState<string | undefined>();
  const [nfeSupplierCnpj, setNfeSupplierCnpj] = useState<string | undefined>();
  const [nfeDuplicateWarning, setNfeDuplicateWarning] = useState<{ visible: boolean; importedAt?: string; userName?: string; itemCount?: number }>({ visible: false });
  const [nfeReviewPage, setNfeReviewPage] = useState(1);
  const NFE_ITEMS_PER_PAGE = 5;

  interface EditableNfeItem {
    id: string;
    name: string;
    ncm?: string;
    unit: string;
    quantity: string;
    unitPrice: string;
    category: string;
    xmlUnit: string;
    xmlQty: number;
    xmlUnitPrice: number;
  }

  useEffect(() => {
    dataStore.refreshSuppliers();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

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
      list = list.filter(i => i.minQuantity > 0 && i.stock <= i.minQuantity);
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

  const [deactivatingStockId, setDeactivatingStockId] = useState<string | null>(null);
  const [deactivatingStockName, setDeactivatingStockName] = useState('');
  const [affectedProducts, setAffectedProducts] = useState<any[]>([]);
  const [showAffectedModal, setShowAffectedModal] = useState(false);

  const removeIngredient = async (id: string) => {
    setDeactivatingStockId(id);
    const item = dataStore.ingredients.find(i => i.id === id);
    setDeactivatingStockName(item?.name || '');

    let products: any[] = [];

    // 1. Tenta buscar via API os produtos que usam este ingrediente
    try {
      const apiProducts = await dataStore.fetchAffectedProducts(id);
      if (Array.isArray(apiProducts) && apiProducts.length > 0) {
        products = apiProducts;
      }
    } catch (e) {
      console.error('fetchAffectedProducts via API falhou:', e);
    }

    // 2. Fallback: busca local nos menuItems se a API não retornou nada
    if (products.length === 0) {
      products = dataStore.menuItems
        .filter(m => {
          if (!Array.isArray(m.ingredients)) return false;
          return m.ingredients.some(ing => {
            const ingId = (ing as any).stockProductId || (ing as any).id;
            return ingId === id;
          });
        })
        .map(m => ({
          _id: m.id,
          name: m.name,
          category: (m as any).category,
          ingredients: Array.isArray(m.ingredients)
            ? m.ingredients.map(ing => ({
                stockProductId: (ing as any).stockProductId || (ing as any).id || '',
                quantity: parseFloat((ing as any).quantity) || 1,
              }))
            : [],
        }));
    }

    setAffectedProducts(products);
    setShowAffectedModal(true);
  };

  const handleDeactivateConfirm = async (
    deactivateProductIds: string[],
    unlinkOnlyProductIds: string[],
  ) => {
    setShowAffectedModal(false);

    await withLoading(
      async () => {
        // Desativa o item de estoque primeiro
        if (deactivatingStockId) {
          await dataStore.deactivateIngredient(deactivatingStockId);
        }

        // Desativa os produtos selecionados
        for (const productId of deactivateProductIds) {
          await dataStore.removeItem(productId);
        }

        // Remove o ingrediente dos produtos selecionados (unlink)
        for (const productId of unlinkOnlyProductIds) {
          if (deactivatingStockId) {
            await dataStore.removeIngredientFromProduct(productId, deactivatingStockId);
          }
        }
      },
      { loading: 'Aplicando alterações...', success: 'Alterações aplicadas', error: 'Erro ao aplicar alterações' },
    );

    setDeactivatingStockId(null);
    setAffectedProducts([]);
  };

  const handleNfeSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets?.length) return

      const uri = result.assets[0].uri
      let rawXml: string
      try {
        rawXml = await FileSystem.readAsStringAsync(uri)
      } catch {
        const resp = await fetch(uri)
        rawXml = await resp.text()
      }

      if (!rawXml.trim().startsWith('<')) {
        Toast.show({ type: 'error', text1: 'O arquivo não parece ser um XML válido.' })
        return
      }

      const resultData = await apiNfeService.parseXml(rawXml)

      if (!resultData.items || resultData.items.length === 0) {
        Toast.show({ type: 'error', text1: 'Nenhum item encontrado no XML.' })
        return
      }

      const editable: EditableNfeItem[] = resultData.items.map((item, idx) => {
        const suggested = getCategoryFromNcm(item.ncm)
        return {
          id: `nfe-item-${idx + 1}`,
          name: item.name,
          ncm: item.ncm,
          unit: normalizeUnit(item.unit),
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toFixed(2),
          category: suggested || '',
          xmlUnit: item.unit,
          xmlQty: item.quantity,
          xmlUnitPrice: item.unitPrice,
        }
      })

      setNfeParsedItems(editable)
      setNfeAccessKey(resultData.accessKey ?? null)
      setNfeSupplierName(resultData.supplierName)
      setNfeSupplierCnpj(resultData.supplierCnpj)

      if (resultData.duplicate) {
        setNfeDuplicateWarning({
          visible: true,
          importedAt: resultData.duplicate.importedAt,
          userName: resultData.duplicate.userName,
          itemCount: resultData.duplicate.itemCount,
        })
      }

      setNfeReviewPage(1)
      setNfeStep('review')
    } catch (e: any) {
      console.error('NF-e parse error:', e)
      Toast.show({ type: 'error', text1: e?.message || 'Erro ao processar o XML.' })
    }
  }

  const handleNfeItemChange = (id: string, field: keyof EditableNfeItem, value: string) => {
    setNfeParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const handleNfeRemoveItem = (id: string) => {
    setNfeParsedItems((prev) => {
      const next = prev.filter((item) => item.id !== id).map((item, idx) => ({
        ...item,
        id: `nfe-item-${idx + 1}`,
      }))
      const maxPage = Math.ceil(next.length / NFE_ITEMS_PER_PAGE) || 1
      if (nfeReviewPage > maxPage) {
        setNfeReviewPage(maxPage)
      }
      return next
    })
  }

  const handleNfeClose = () => {
    setNfeModalVisible(false)
    setNfeStep('select')
    setNfeParsedItems([])
    setNfeXmlText('')
    setNfeAccessKey(null)
    setNfeSupplierName(undefined)
    setNfeSupplierCnpj(undefined)
    setNfeDuplicateWarning({ visible: false })
    setNfeReviewPage(1)
  }

  const handleNfeImportAll = async () => {
    if (nfeParsedItems.length === 0) return
    setNfeImporting(true)

    try {
      const result = await apiNfeService.importNfe({
        items: nfeParsedItems.map((item) => {
          const qty = parseFloat(item.quantity.replace(',', '.'))
          const up = parseFloat(item.unitPrice.replace(',', '.'))
          return {
            name: item.name.trim(),
            unit: normalizeUnit(item.unit),
            quantity: isNaN(qty) ? 0 : qty,
            unitPrice: isNaN(up) || up <= 0 ? undefined : up,
            category: item.category.trim() || 'Outra',
          }
        }),
        supplierName: nfeSupplierName,
        supplierCnpj: nfeSupplierCnpj,
        accessKey: nfeAccessKey ?? undefined,
      })

      const { summary, supplier } = result

      await dataStore.refreshStock()

      Toast.show({
        type: summary.created > 0 || summary.updated > 0 ? 'success' : 'error',
        text1: `${summary.created} criado(s), ${summary.updated} atualizado(s)${summary.errors.length > 0 ? `, ${summary.errors.length} erro(s)` : ''}${supplier ? `\nFornecedor: ${supplier.name}` : ''}`,
      })
    } catch (e: any) {
      console.error('Erro ao importar NF-e:', e)
      Toast.show({
        type: 'error',
        text1: e?.message || 'Erro ao importar NF-e em lote.',
      })
    } finally {
      setNfeModalVisible(false)
      setNfeStep('select')
      setNfeParsedItems([])
      setNfeXmlText('')
      setNfeAccessKey(null)
      setNfeSupplierName(undefined)
      setNfeSupplierCnpj(undefined)
      setNfeDuplicateWarning({ visible: false })
      setNfeImporting(false)
      setNfeReviewPage(1)
      setCurrentPage(1)
    }
  }

  return (
    <View style={styles.container}>
      {!isWeb && <UserHeader />}

      <View style={styles.headerTabRow}>
        <View style={styles.tabButtons}>
          <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, styles.tabBtnTextActive]}>Ativos</Text>
          </TouchableOpacity>
          {canDeleteStock && (
            <TouchableOpacity style={styles.tabBtn} onPress={() => router.push('estoque/inativos' as any)}>
              <Text style={styles.tabBtnText}>Inativos</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
              onPress={() => { setNfeModalVisible(true); setNfeStep('select'); setNfeParsedItems([]); setNfeXmlText(''); }}
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
            onGoTo={(p: number) => setCurrentPage(p)}
            isWeb={false}
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
            onGoTo={(p: number) => setCurrentPage(p)}
            isWeb={true}
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

      <StockDeactivateModal
        visible={showAffectedModal}
        stockItemName={deactivatingStockName}
        affectedProducts={affectedProducts}
        onClose={() => {
          setShowAffectedModal(false);
          setDeactivatingStockId(null);
          setAffectedProducts([]);
        }}
        onConfirm={handleDeactivateConfirm}
      />

      {/* Modal de Importação XML NF-e */}
      <Modal
        visible={nfeModalVisible}
        transparent
        animationType={isWeb ? "fade" : "slide"}
        onRequestClose={handleNfeClose}
      >
        <View style={[styles.modalOverlay, isWeb && styles.modalOverlayWeb]}>
          <View style={[styles.modalContent, isWeb && styles.modalContentWeb, nfeStep === 'review' && styles.modalContentReview, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Importar Nota Fiscal</Text>
              <TouchableOpacity onPress={handleNfeClose}>
                <Text style={[styles.modalClose, { color: theme.text, opacity: 0.5 }]}>Fechar</Text>
              </TouchableOpacity>
            </View>

            {nfeStep === 'select' && (
              <>
                <Text style={[styles.modalSubtitle, { color: theme.text, opacity: 0.5 }]}>
                  Selecione o XML de uma Nota Fiscal Eletrônica. Os itens serão listados para revisão antes de importar.
                </Text>

                <TouchableOpacity
                  style={[styles.dropZone, { borderColor: theme.contrast + '40', backgroundColor: theme.foreground }]}
                  onPress={handleNfeSelectFile}
                  activeOpacity={0.7}
                >
                  <FileTextIcon color={theme.contrast} size={32} />
                  <Text style={[styles.dropZoneText, { color: theme.text }]}>
                    Toque para selecionar o XML
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {nfeStep === 'review' && (() => {
              const totalReviewPages = Math.ceil(nfeParsedItems.length / NFE_ITEMS_PER_PAGE);
              const reviewStart = (nfeReviewPage - 1) * NFE_ITEMS_PER_PAGE;
              const reviewPageItems = nfeParsedItems.slice(reviewStart, reviewStart + NFE_ITEMS_PER_PAGE);
              return (
                <>
                <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
                  {reviewPageItems.map((item) => (
                    <View key={item.id} style={[styles.nfeItemCard, { backgroundColor: theme.foreground }]}>
                      <View style={styles.nfeItemHeader}>
                        <Text style={[styles.nfeItemNumber, { color: theme.text, opacity: 0.4 }]}>
                          #{item.id.split('-')[2]!}
                        </Text>
                        <TouchableOpacity onPress={() => handleNfeRemoveItem(item.id)} style={styles.nfeRemoveBtn}>
                          <Text style={[styles.nfeRemoveBtnText, { color: theme.contrast }]}>Remover</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.nfeFieldLabel, { color: theme.text }]}>Nome *</Text>
                      <TextInput
                        style={[styles.nfeFieldInput, { backgroundColor: theme.background, color: theme.text }]}
                        value={item.name}
                        onChangeText={(v) => handleNfeItemChange(item.id, 'name', v)}
                      />

                      <View style={styles.nfeFieldRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.nfeFieldLabel, { color: theme.text }]}>Medida</Text>
                          <TouchableOpacity
                            style={[styles.nfeFieldInput, { backgroundColor: theme.background, flexDirection: 'row', alignItems: 'center' }]}
                            onPress={() => setUnitPickerTarget(item.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: theme.text, fontSize: 14, flex: 1 }}>{item.unit}</Text>
                            <ChevronDownIcon color={theme.text} size={18} opacity={0.5} />
                          </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.nfeFieldLabel, { color: theme.text }]}>Quantidade</Text>
                          <TextInput
                            style={[styles.nfeFieldInput, { backgroundColor: theme.background, color: theme.text }]}
                            value={item.quantity}
                            onChangeText={(v) => handleNfeItemChange(item.id, 'quantity', v.replace(/[^0-9.,]/g, ''))}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>

                      <View style={styles.nfeFieldRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.nfeFieldLabel, { color: theme.text }]}>Valor Unitário (R$)</Text>
                          <TextInput
                            style={[styles.nfeFieldInput, { backgroundColor: theme.background, color: theme.text }]}
                            value={item.unitPrice}
                            onChangeText={(v) => handleNfeItemChange(item.id, 'unitPrice', v.replace(/[^0-9.,]/g, ''))}
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.nfeFieldLabel, { color: theme.text }]}>Categoria</Text>
                          {customCategoryItems.has(item.id) ? (
                            <TextInput
                              style={[styles.nfeFieldInput, { backgroundColor: theme.background, color: theme.text }]}
                              value={item.category}
                              onChangeText={(v) => handleNfeItemChange(item.id, 'category', v)}
                              placeholder="Digite a categoria..."
                              placeholderTextColor={theme.text + '40'}
                            />
                          ) : (
                            <TouchableOpacity
                              style={[styles.nfeFieldInput, { backgroundColor: theme.background, flexDirection: 'row', alignItems: 'center' }]}
                              onPress={() => setCategoryPickerTarget(item.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={{ color: item.category ? theme.text : theme.text + '60', fontSize: 14, flex: 1 }} numberOfLines={1}>
                                {item.category || 'Selecione...'}
                              </Text>
                              <ChevronDownIcon color={theme.text} size={18} opacity={0.5} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {item.xmlUnit !== item.unit && (
                        <Text style={[styles.nfeXmlHint, { color: theme.text, opacity: 0.4 }]}>
                          Original: {item.xmlQty} {item.xmlUnit} a R$ {item.xmlUnitPrice.toFixed(2)}/{item.xmlUnit}
                        </Text>
                      )}
                    </View>
                  ))}
                </ScrollView>

                <View style={{ height: 1, backgroundColor: theme.text + '10', marginVertical: 4 }} />

                <TouchableOpacity
                  style={[styles.nfeImportBtn, { backgroundColor: theme.contrast, opacity: nfeImporting ? 0.6 : 1 }]}
                  onPress={handleNfeImportAll}
                  disabled={nfeImporting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nfeImportBtnText}>
                    {nfeImporting ? 'Importando...' : `Adicionar Todos (${nfeParsedItems.length})`}
                  </Text>
                </TouchableOpacity>

                {totalReviewPages > 1 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 16 }}>
                    <TouchableOpacity
                      style={[styles.pageBtn, nfeReviewPage === 1 && styles.pageBtnDisabled]}
                      onPress={() => setNfeReviewPage(p => Math.max(1, p - 1))}
                      disabled={nfeReviewPage === 1}
                    >
                      <ChevronLeftIcon color={theme.text} size={20} />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 14, color: theme.text }}>
                      {nfeReviewPage} / {totalReviewPages}
                    </Text>
                    <TouchableOpacity
                      style={[styles.pageBtn, nfeReviewPage === totalReviewPages && styles.pageBtnDisabled]}
                      onPress={() => setNfeReviewPage(p => Math.min(totalReviewPages, p + 1))}
                      disabled={nfeReviewPage === totalReviewPages}
                    >
                      <ChevronRightIcon color={theme.text} size={20} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            );
          })()}
          </View>
        </View>
      </Modal>

      <Modal
        visible={nfeDuplicateWarning.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setNfeDuplicateWarning({ visible: false })}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background, maxWidth: 400, borderRadius: 24 }]}>
            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 12 }]}>
              Esta NF-e já foi importada
            </Text>
            <Text style={[{ color: theme.text, opacity: 0.7, lineHeight: 20, marginBottom: 16 }]}>
              Esta NF-e já foi importada em{' '}
              {nfeDuplicateWarning.importedAt ? new Date(nfeDuplicateWarning.importedAt).toLocaleDateString('pt-BR') : ''}
              {' '}
              {'\n\n'}
              Deseja continuar mesmo assim?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: theme.foreground }]}
                onPress={() => {
                  setNfeDuplicateWarning({ visible: false })
                  handleNfeClose()
                }}
              >
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: theme.contrast }]}
                onPress={() => setNfeDuplicateWarning({ visible: false })}
              >
                <Text style={[styles.confirmBtnText, { color: '#fff' }]}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SelectModal
        visible={unitPickerTarget !== null}
        onClose={() => setUnitPickerTarget(null)}
        onSelect={(val: string) => {
          if (!unitPickerTarget) return
          handleNfeItemChange(unitPickerTarget, 'unit', val)
          setUnitPickerTarget(null)
        }}
        options={UNIT_OPTIONS}
        title="Selecione a Medida"
      />

      <SelectModal
        visible={categoryPickerTarget !== null}
        onClose={() => setCategoryPickerTarget(null)}
        onSelect={(val: string) => {
          if (!categoryPickerTarget) return
          if (val === 'Outra...') {
            setCustomCategoryItems((prev) => new Set(prev).add(categoryPickerTarget))
            handleNfeItemChange(categoryPickerTarget, 'category', '')
          } else {
            setCustomCategoryItems((prev) => {
              const next = new Set(prev)
              next.delete(categoryPickerTarget)
              return next
            })
            handleNfeItemChange(categoryPickerTarget, 'category', val)
          }
          setCategoryPickerTarget(null)
        }}
        options={CATEGORY_OPTIONS}
        title="Selecione a Categoria"
      />
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
      justifyContent: 'space-between',
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
      transition: 'border-color 0.2s ease',
      ':hover': {
        borderColor: theme.text + '20',
      },
    } as any,
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
      transition: 'opacity 0.2s ease',
      ':hover': {
        opacity: 0.85,
      },
    } as any,
    plusBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 24,
      color: '#FFFFFF',
      marginTop: -2,
    },
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isWeb ? 24 : 20,
      gap: 12,
    },
    sectionText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: isWeb ? 15 : 14,
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
      fontSize: isWeb ? 14 : 13,
      color: theme.text,
      opacity: 0.4,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: isWeb ? -12 : -10,
    },
    gridItem: {
      width: `${100 / gridColumns}%`,
      paddingHorizontal: isWeb ? 12 : 10,
      marginBottom: isWeb ? 24 : 16,
    },
    card: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      padding: isWeb ? 20 : 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
      minHeight: 160,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer',
      ':hover': {
        transform: 'scale(1.01)',
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
      },
    } as any,
    cardContent: {
      flex: 1,
      justifyContent: 'center',
    },
    cardTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    cardCategory: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 11,
      color: theme.contrast,
      textTransform: 'uppercase' as any,
      marginTop: 2,
    },
    cardUnitPrice: {
      fontFamily: 'Jost_700Bold',
      fontSize: 13,
      color: theme.text,
      opacity: 0.7,
      marginTop: 2,
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
      paddingVertical: isWeb ? 80 : 60,
      opacity: 0.5,
    },
    emptyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: isWeb ? 20 : 18,
      color: theme.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontFamily: 'Jost_400Regular',
      fontSize: isWeb ? 15 : 14,
      color: theme.text,
      textAlign: 'center',
    },
    paginationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      gap: 12,
    },
    paginationContainerWeb: {
      gap: 8,
      paddingVertical: 16,
    },
    pageNumbersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    pageNumberBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageNumberText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 13,
    },
    pageEllipsis: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      width: 24,
      textAlign: 'center',
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
      transition: 'border-color 0.2s ease, opacity 0.2s ease',
      ':hover': {
        borderColor: theme.text + '30',
      },
    } as any,
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
    headerTabRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    tabButtons: {
      flexDirection: 'row',
      backgroundColor: theme.foreground,
      borderRadius: 16,
      padding: 4,
    },
    tabBtn: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: 12,
    },
    tabBtnActive: {
      backgroundColor: theme.background,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    tabBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.5,
    },
    tabBtnTextActive: {
      opacity: 1,
    },
    importXmlBtn: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: theme.contrast + '30',
      transition: 'border-color 0.2s ease',
      ':hover': {
        borderColor: theme.contrast,
      },
    } as any,
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalOverlayWeb: {
      justifyContent: 'center',
      padding: 40,
    },
    modalContent: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '90%',
    },
    modalContentWeb: {
      borderRadius: 24,
      maxWidth: 640,
      maxHeight: '85%',
      alignSelf: 'center',
      width: '100%',
    },
    modalContentReview: {
      paddingBottom: 12,
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

    // NF-e editable items
    nfeItemCard: {
      borderRadius: 16,
      padding: 14,
      gap: 8,
    },
    nfeItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    nfeItemNumber: {
      fontFamily: 'Jost_700Bold',
      fontSize: 12,
    },
    nfeRemoveBtn: {
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    nfeRemoveBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
    },
    nfeFieldLabel: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 12,
      marginBottom: 4,
    },
    nfeFieldInput: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      outlineStyle: 'none',
    } as any,
    nfeFieldRow: {
      flexDirection: 'row',
      gap: 10,
    },
    nfeXmlHint: {
      fontFamily: 'Jost_400Regular',
      fontSize: 11,
      marginTop: 2,
    },
    nfeImportBtn: {
      marginTop: 16,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nfeImportBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FFFFFF',
    },
    cancelBtn: {
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
    },
    confirmBtn: {
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
    },
  });
}
