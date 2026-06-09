import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { UserHeader } from '../../../components/shared/UserHeader';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { observer } from 'mobx-react-lite';
import { dataStore } from '@/stores/DataStore';
import { apiSupplierService } from '@/services/api-supplier-service';
import Toast from 'react-native-toast-message';
import { withLoading } from '@/utils/toast';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/shared/Icons';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';

export default observer(function InativosFornecedoresScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const styles = makeStyles(theme, isWeb);

  const [inactiveItems, setInactiveItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactivateId, setReactivateId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInactive = async (p: number) => {
    setLoading(true);
    try {
      const result = await apiSupplierService.getInactiveSuppliers(p, 50);
      setInactiveItems(result.items || result.data || []);
      setTotalPages(result.pages || result.totalPages || 1);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar fornecedores inativos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInactive(page);
  }, [page]);

  useRealtimeChannel('stock:changed', () => {
    fetchInactive(page);
  });

  const handleReactivate = async () => {
    if (!reactivateId) return;
    await withLoading(
      async () => {
        await dataStore.reactivateSupplier(reactivateId);
        setReactivateId(null);
        fetchInactive(page);
      },
      { loading: 'Reativando fornecedor...', success: 'Fornecedor reativado com sucesso!', error: 'Erro ao reativar fornecedor' },
    );
  };

  return (
    <View style={styles.container}>
      {!isWeb && <UserHeader />}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Fornecedores Inativos</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {loading ? (
          <Text style={styles.loadingText}>Carregando...</Text>
        ) : inactiveItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum fornecedor inativo</Text>
            <Text style={styles.emptySubtext}>Fornecedores desativados aparecerão aqui.</Text>
          </View>
        ) : (
          inactiveItems.map((item: any) => (
            <View key={item._id || item.id} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.contactName && (
                  <Text style={styles.cardSubtitle}>{item.contactName}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.reactivateBtn}
                onPress={() => setReactivateId(item._id || item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.reactivateBtnText}>Reativar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeftIcon color={theme.text} size={20} />
            </TouchableOpacity>
            <Text style={styles.pageText}>{page} / {totalPages}</Text>
            <TouchableOpacity
              style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRightIcon color={theme.text} size={20} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!reactivateId}
        onClose={() => setReactivateId(null)}
        onConfirm={handleReactivate}
        title="Reativar Fornecedor"
        message="Tem certeza que deseja reativar este fornecedor?"
        confirmText="Reativar"
      />
    </View>
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
      marginBottom: 24,
      gap: 12,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.foreground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: 'Jost_700Bold',
      fontSize: 20,
      color: theme.text,
    },
    loadingText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: theme.text,
      opacity: 0.5,
      textAlign: 'center',
      paddingVertical: 40,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.foreground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      opacity: 0.8,
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
      fontSize: 13,
      color: theme.text,
      opacity: 0.6,
      marginTop: 2,
    },
    reactivateBtn: {
      backgroundColor: theme.contrast,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    reactivateBtnText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: '#FFFFFF',
    },
    emptyContainer: {
      alignItems: 'center',
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
    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      gap: 16,
    },
    pageBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.foreground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageBtnDisabled: {
      opacity: 0.3,
    },
    pageText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
    },
  });
}
