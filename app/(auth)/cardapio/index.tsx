import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View, RefreshControl } from 'react-native';
import { MenuCard, MenuItem } from '../../../components/menu/MenuCard';
import { UserHeader } from '../../../components/shared/UserHeader';
import { productService, Product } from '../../../services/api-product-service';

export default function CardapioScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const styles = makeStyles(theme, isWeb);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productService.getProducts();
      const mappedProducts = data.map(productService.mapProductFromBackend);
      setProducts(mappedProducts);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const filteredItems = products
    .filter(p => p.name.toLowerCase().includes(searchName.toLowerCase()))
    .map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
    }));

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.contrast} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isWeb && <UserHeader userName="GABRIEL MAGINA" />}

      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nome do prato"
            placeholderTextColor={theme.text + '80'}
            value={searchName}
            onChangeText={setSearchName}
          />
        </View>
        <View style={styles.actionsRight}>
          {isWeb ? (
            <TouchableOpacity
              style={styles.createBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/cardapio/addItem')}
            >
              <Text style={styles.createBtnText}>Novo Item</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.plusBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/cardapio/addItem')}
            >
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={isWeb ? styles.webListContainer : { flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionText}>Cardápio</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.grid}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <MenuCard {...item} />
              </View>
            ))}
          </View>

          {filteredItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum item encontrado</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWeb ? 0 : 20,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
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
    actionsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    createBtn: {
      backgroundColor: theme.contrast,
      borderRadius: 20,
      paddingHorizontal: 32,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FFFFFF',
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
    webListContainer: {
      flex: 1,
    },
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    sectionText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
      marginRight: 12,
    },
    fallbackBadge: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 10,
      color: theme.foreground,
      backgroundColor: theme.contrast,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      overflow: 'hidden',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.background,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -10,
    },
    gridItem: {
      width: isWeb ? '50%' : '100%',
      paddingHorizontal: 10,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: theme.text,
      opacity: 0.6,
    },
  });
}