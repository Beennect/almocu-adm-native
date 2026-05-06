import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, useWindowDimensions, TextInput, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/themes/colors';
import { UserHeader } from './UserHeader';
import { MenuCard, MenuItem } from './MenuCard';

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const CATEGORIES = ["Favoritos da casa", "Novidades"];

const MOCK_MENU: MenuSection[] = [
  {
    title: 'Favoritos da casa',
    items: [
      {
        id: '1',
        name: 'Canoa Sushi Grande',
        description: '30 Unidades de sushi contendo 6 camarões crocantes, 6 niguiri de salmão, 6 urama...',
        price: 140.00,
      },
      {
        id: '2',
        name: 'Canoa Sushi Grande',
        description: '30 Unidades de sushi contendo 6 camarões crocantes, 6 niguiri de salmão, 6 urama...',
        price: 140.00,
      },
    ]
  },
  {
    title: 'Novidades',
    items: [
      {
        id: '3',
        name: 'Canoa Sushi Grande',
        description: '30 Unidades de sushi contendo 6 camarões crocantes, 6 niguiri de salmão, 6 urama...',
        price: 140.00,
      },
      {
        id: '4',
        name: 'Canoa Sushi Grande',
        description: '30 Unidades de sushi contendo 6 camarões crocantes, 6 niguiri de salmão, 6 urama...',
        price: 140.00,
      },
    ]
  },
];

export function CardapioView() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const [activeCategory, setActiveCategory] = React.useState("Favoritos da casa");
  const theme = useAppTheme();
  const styles = makeStyles(theme.text, theme.foreground, theme.contrast, isWeb);

  return (
    <View style={styles.container}>
      {!isWeb && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ color: '#3B82F6', fontFamily: 'Jost_700Bold', fontSize: 14 }}>CARDAPIO</Text>
        </View>
      )}
      
      {/* Search and Header - Web Layout */}
      {isWeb && (
        <View style={styles.topBar}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Nome"
              placeholderTextColor="#6B7280"
            />
          </View>
          <TouchableOpacity style={styles.orderBtn} activeOpacity={0.7}>
            <Text style={styles.orderBtnText}>Ordem ↓</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category Selection Chips - Web Layout */}
      {isWeb && (
        <View style={styles.categoriesRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryChip, activeCategory === cat && styles.activeChip]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.activeChipText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isWeb && <UserHeader userName="GABRIEL MAGINA" />}

      <View style={isWeb ? styles.webListContainer : { flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {MOCK_MENU.map((section, sectionIdx) => (
            <React.Fragment key={sectionIdx}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.dividerLine} />
              </View>

              {section.items.map((item) => (
                <MenuCard key={item.id} {...item} />
              ))}
              
              <View style={{ height: 16 }} />
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      {/* Add Item Button - Web Layout */}
      {isWeb && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.addItemBtn} activeOpacity={0.8}>
            <Text style={styles.addItemBtnText}>Adicionar Item</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function makeStyles(textColor: string, foreground: string, contrast: string, isWeb: boolean) {
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
      backgroundColor: '#f5f5f5',
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 52,
      justifyContent: 'center',
    },
    searchInput: {
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      color: textColor,
      outlineStyle: 'none',
    } as any,
    orderBtn: {
      backgroundColor: '#f5f5f5',
      borderRadius: 16,
      paddingHorizontal: 24,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    orderBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: textColor,
    },
    categoriesRow: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 12,
    },
    categoryChip: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
    },
    activeChip: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    categoryText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: '#6B7280',
    },
    activeChipText: {
      color: '#111827',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    sectionTitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: '#6B7280',
      marginRight: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#E5E7EB',
    },
    webListContainer: {
      flex: 1,
      backgroundColor: 'transparent',
      borderRadius: 32,
      paddingRight: 16, // Espaço para o scroll
    },
    scrollContent: {
      paddingBottom: 100,
    },
    bottomActions: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      padding: 16,
    },
    addItemBtn: {
      backgroundColor: '#FF5F2F',
      paddingHorizontal: 32,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#FF5F2F',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    addItemBtnText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: '#FFFFFF',
    },
  });
}
