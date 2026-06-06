import { ConfirmModal } from '@/components/shared/ConfirmModal';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon
} from '@/components/shared/Icons';
import { SelectModal } from '@/components/shared/SelectModal';
import { UserHeader } from '@/components/shared/UserHeader';
import { dataStore, SupplierItem } from '@/stores/DataStore';
import { permissionStore } from '@/stores/PermissionStore';
import { useAppTheme } from '@/themes/colors';
import { withLoading } from '@/utils/toast';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

type FilterMode =
  | 'todos'
  | 'alfabetica'
  | 'ativos'
  | 'inativos'
  | 'com_cnpj'
  | 'pessoa_fisica'
  | 'recentes'
  | 'antigos'
  | 'com_estoque';

const MAIN_FILTER_LABELS: Record<string, string> = {
  todos: 'Todos',
  alfabetica: 'A-Z ↓',
  ativos: 'Apenas Ativos',
  inativos: 'Apenas Inativos',
  com_cnpj: 'Com CNPJ',
  pessoa_fisica: 'Pessoa Física',
  recentes: 'Mais Recentes ↓',
  antigos: 'Mais Antigos ↑',
  com_estoque: 'Vinculados a Estoque',
};

const MAIN_FILTER_KEYS = Object.keys(MAIN_FILTER_LABELS);

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

const getGridColumns = (width: number) => {
  if (width >= 1440) return 2;
  return 1;
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

export default observer(function FornecedoresScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const gridColumns = getGridColumns(width);
  const styles = makeStyles(theme, isWeb, gridColumns);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const itemsPerPage = isWeb ? 12 : 6;

  useEffect(() => {
    dataStore.refreshSuppliers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [searchTerm, filterMode]);

  if (!permissionStore.can('suppliers:view')) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <TruckIcon color={theme.contrast} size={44} />
        <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 18, color: theme.text, marginTop: 12 }}>Acesso Negado</Text>
        <Text style={{ fontFamily: 'Jost_400Regular', fontSize: 14, color: theme.text, opacity: 0.6, marginTop: 6, textAlign: 'center' }}>
          Você não tem permissão para visualizar fornecedores.
        </Text>
      </View>
    );
  }

  const filterLabel = (mode: FilterMode) =>
    MAIN_FILTER_LABELS[mode] || 'Todos';

  const processSuppliers = () => {
    let list = [...dataStore.suppliers];

    const term = searchTerm.toLowerCase().trim();
    if (term) {
      list = list.filter((s) => {
        const haystack = [
          s.name,
          s.contactName,
          s.email,
          s.phone,
          s.cnpj,
          s.address?.city,
          s.address?.state,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });
    }

    if (filterMode === 'ativos') {
      list = list.filter((s) => s.isActive);
    } else if (filterMode === 'inativos') {
      list = list.filter((s) => !s.isActive);
    } else if (filterMode === 'com_cnpj') {
      list = list.filter((s) => !!s.cnpj && s.cnpj.replace(/\D/g, '').length > 0);
    } else if (filterMode === 'pessoa_fisica') {
      list = list.filter((s) => !s.cnpj || s.cnpj.replace(/\D/g, '').length === 0);
    } else if (filterMode === 'com_estoque') {
      const ids = new Set(
        dataStore.ingredients
          .map((i) => i.supplierId)
          .filter((id): id is string => !!id),
      );
      list = list.filter((s) => ids.has(s.id));
    }
    if (filterMode === 'alfabetica') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterMode === 'recentes') {
      list.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    } else if (filterMode === 'antigos') {
      list.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return ta - tb;
      });
    }

    return list;
  };

  const processed = processSuppliers();
  const totalPages = Math.max(1, Math.ceil(processed.length / itemsPerPage));
  const paginated = processed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    const supplierName = dataStore.suppliers.find((s) => s.id === confirmDeleteId)?.name;
    try {
      await withLoading(
        async () => {
          await dataStore.removeSupplier(confirmDeleteId);
          setConfirmDeleteId(null);
        },
        {
          loading: 'Removendo fornecedor...',
          success: `Fornecedor "${supplierName || ''}" removido`,
          error: 'Erro ao remover fornecedor',
        },
      );
    } catch {
      // Erro já exibido via toast pelo withLoading — não propaga para error boundary
    }
  };

  const renderCard = (s: SupplierItem, onPress: () => void) => {
    const linkedCount = dataStore.ingredients.filter((i) => i.supplierId === s.id).length;
    return (
      <View key={s.id} style={styles.card}>
        {/* Left: Avatar + Status pill */}
        <TouchableOpacity
          style={styles.touchableArea}
          activeOpacity={0.7}
          onPress={onPress}
        >
          <View style={styles.leftCol}>
            <View style={styles.avatar}>
              <TruckIcon color={theme.contrast} size={26} />
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: s.isActive ? theme.contrast : '#EF4444' },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {s.isActive ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>

          {/* Middle: Content */}
          <View style={styles.content}>
            <Text style={styles.cardTitle} numberOfLines={1}>{s.name}</Text>
            {s.contactName ? (
              <Text style={styles.cardSubtitle} numberOfLines={1}>{s.contactName}</Text>
            ) : null}

            <View style={styles.metaRow}>
              {s.cnpj ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>CNPJ</Text>
                  <Text style={styles.metaValue}>{formatCnpj(s.cnpj)}</Text>
                </View>
              ) : (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Tipo</Text>
                  <Text style={styles.metaValue}>Pessoa Física</Text>
                </View>
              )}
              {s.phone ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Telefone</Text>
                  <View style={styles.metaValueRow}>
                    <PhoneIcon color={theme.text} opacity={0.5} size={12} />
                    <Text style={styles.metaValue}>{formatPhone(s.phone)}</Text>
                  </View>
                </View>
              ) : null}
              {s.address?.city ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Localização</Text>
                  <Text style={styles.metaValue}>
                    {s.address.city}{s.address.state ? `/${s.address.state.toUpperCase()}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>

            {linkedCount > 0 ? (
              <View style={styles.linkedBadge}>
                <View style={[styles.linkedDot, { backgroundColor: theme.contrast }]} />
                <Text style={styles.linkedText}>
                  {linkedCount} item{linkedCount !== 1 ? 's' : ''} de estoque
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Vertical Divider */}
        <View style={styles.verticalDivider} />

        {/* Right: Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => router.push(`/(auth)/fornecedores/addItem?id=${s.id}` as any)}
          >
            <EditIcon color={theme.text} opacity={0.7} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setConfirmDeleteId(s.id)}
          >
            <TrashIcon color={theme.contrast} opacity={0.7} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    );
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
            <Text style={styles.filterBtnText} numberOfLines={1}>{filterLabel(filterMode)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.plusBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/fornecedores/addItem' as any)}
          >
            <PlusIcon color="#FFFFFF" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionText}>Fornecedores Cadastrados</Text>
          <View style={styles.dividerLine} />
          <Text style={styles.sectionCount}>{processed.length} item{processed.length !== 1 ? 's' : ''}</Text>
        </View>

        {paginated.length > 0 ? (
          <View style={styles.grid}>
            {paginated.map((s) => (
              <View key={s.id} style={styles.gridItem}>
                {renderCard(s, () => router.push(`/(auth)/fornecedores/${s.id}` as any))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <TruckIcon color={theme.text} opacity={0.4} size={48} />
            <Text style={styles.emptyText}>
              {searchTerm || filterMode !== 'todos'
                ? 'Nenhum fornecedor encontrado.'
                : 'Nenhum fornecedor cadastrado.'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchTerm || filterMode !== 'todos'
                ? 'Tente ajustar os filtros ou a busca.'
                : 'Toque no + para adicionar o primeiro!'}
            </Text>
          </View>
        )}

        {!isWeb && totalPages > 1 ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            theme={theme}
            styles={styles}
          />
        ) : null}
      </ScrollView>

      {isWeb && totalPages > 1 ? (
        <View style={styles.fixedPagination}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            theme={theme}
            styles={styles}
          />
        </View>
      ) : null}

      <SelectModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onSelect={(label: string) => {
          const key = MAIN_FILTER_KEYS.find((k) => MAIN_FILTER_LABELS[k] === label);
          if (key) {
            setFilterMode(key as FilterMode);
            Toast.show({ type: 'info', text1: `Filtro: ${MAIN_FILTER_LABELS[key]}`, visibilityTime: 1500 });
          }
          setFilterModalVisible(false);
        }}
        options={MAIN_FILTER_KEYS.map((k) => MAIN_FILTER_LABELS[k])}
        title="Filtrar Por"
      />

      <ConfirmModal
        visible={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Fornecedor"
        message="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
        confirmText="Excluir"
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
      gap: 8,
      flexWrap: 'wrap',
    },
    filterBtn: {
      backgroundColor: theme.foreground,
      borderRadius: 20,
      paddingHorizontal: 16,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 90,
      borderWidth: 1,
      borderColor: theme.background,
    },
    filterBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
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
      width: '100%',
      flexDirection: 'row',
      backgroundColor: theme.foreground,
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
    },
    touchableArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    leftCol: {
      alignItems: 'center',
      marginRight: 16,
      gap: 10,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: theme.contrast + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 100,
    },
    statusBadgeText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 11,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    content: {
      flex: 1,
      paddingRight: 8,
    },
    cardTitle: {
      fontFamily: 'Jost_700Bold',
      fontSize: 17,
      color: theme.text,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: theme.text,
      opacity: 0.6,
      marginBottom: 12,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    metaItem: {
      gap: 2,
    },
    metaLabel: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 10,
      color: theme.text,
      opacity: 0.4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metaValue: {
      fontFamily: 'Jost_500Medium',
      fontSize: 13,
      color: theme.text,
    },
    metaValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    linkedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: theme.contrast + '15',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 100,
      marginTop: 10,
    },
    linkedDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    linkedText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 11,
      color: theme.contrast,
    },
    verticalDivider: {
      width: 1,
      alignSelf: 'stretch',
      borderLeftWidth: 1,
      borderColor: theme.background,
      borderStyle: 'dashed',
      marginHorizontal: 12,
    },
    actions: {
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    actionBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 8,
    },
    emptyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
    },
    emptySubtext: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      opacity: 0.5,
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
    },
    pageIndicatorText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
    },
  });
}
