import { useAppTheme } from '@/themes/colors';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { MenuCard, MenuItem } from '../menu/MenuCard';
import { UserHeader } from '../shared/UserHeader';

const MOCK_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Canoa Sushi Grande',
    description: '30 Unidades de sushi contendo 6 camarões crocantes, 6 niguiri de salmão, 6 urama...',
    price: 140.00,
  },
  {
    id: '2',
    name: 'Temaki Salmão Especial',
    description: 'Salmão fresco em cubos, cebolinha, cream cheese e arroz envoltos em alga crocante.',
    price: 32.90,
  },
  {
    id: '3',
    name: 'Uramaki Philadelphia',
    description: '8 unidades de uramaki com salmão e cream cheese, coberto com gergelim.',
    price: 28.00,
  }
];

export function CardapioView() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const styles = makeStyles(theme, isWeb);

  return (
    <View style={styles.container}>
      {/* User Header Component - Apenas Mobile */}
      {!isWeb && <UserHeader userName="GABRIEL MAGINA" />}

      {/* Top Bar / Search Row */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nome do prato"
            placeholderTextColor={theme.text + '80'}
          />
        </View>
        <View style={styles.actionsRight}>
          {isWeb ? (
            <TouchableOpacity style={styles.createBtn} activeOpacity={0.8}>
              <Text style={styles.createBtnText}>Novo Item</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.plusBtn} activeOpacity={0.8}>
              <Text style={styles.plusBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={isWeb ? styles.webListContainer : { flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Section Divider */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionText}>Pratos Principais</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Grid of Cards */}
          <View style={styles.grid}>
            {MOCK_ITEMS.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <MenuCard {...item} />
              </View>
            ))}
          </View>
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
  });
}
