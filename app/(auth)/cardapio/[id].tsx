import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Image,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import {
  CardapioIcon,
  ChevronLeftIcon,
  EditIcon,
} from '@/components/shared/Icons';

function formatIngredientLine(ing: any): string {
  const qty = ing.quantity ? String(ing.quantity).replace('.', ',') : '';
  const unit = ing.unit;
  const name = ing.name || 'Ingrediente';
  if (!qty) return name;
  if (!unit || unit === 'Unidades') return `${qty} ${name}`;
  return `${qty} ${unit.toLowerCase()} de ${name}`;
}

function ImageWithFallback({ uri, style, placeholderStyle, theme }: {
  uri?: string | null;
  style: any;
  placeholderStyle: any;
  theme: any;
}) {
  const [hasError, setHasError] = React.useState(false);
  const showPlaceholder = !uri || hasError;

  if (showPlaceholder) {
    return (
      <View style={[style, placeholderStyle, { backgroundColor: theme.foreground }]}>
        <CardapioIcon color={theme.text} opacity={0.3} size={56} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      onError={() => setHasError(true)}
    />
  );
}

export default observer(function CardapioItemDetailScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  useEffect(() => {
    dataStore.refreshMenu();
  }, []);

  const item = dataStore.menuItems.find((m) => m.id === id);

  if (!item) {
    return (
      <View
        style={[
          styles.notFoundContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <CardapioIcon color={theme.contrast} size={48} />
        <Text style={[styles.notFoundTitle, { color: theme.text }]}>
          Item não encontrado
        </Text>
        <Text
          style={[styles.notFoundSub, { color: theme.text, opacity: 0.6 }]}
        >
          O item que você está tentando visualizar não existe ou foi removido.
        </Text>
        <TouchableOpacity
          style={[
            styles.notFoundBtn,
            { backgroundColor: theme.foreground },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon color={theme.text} size={20} />
          <Text style={[styles.notFoundBtnText, { color: theme.text }]}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ingredients = item.ingredients || [];
  const priceFormatted = `R$ ${(item.price ?? 0)
    .toFixed(2)
    .replace('.', ',')}`;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { backgroundColor: theme.background },
        isWeb && { maxWidth: 720, alignSelf: 'center', width: '100%' },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backArrowBtn, { backgroundColor: theme.foreground }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Visualização do Item do Cardápio
          </Text>
          <Text
            style={[styles.headerSub, { color: theme.text, opacity: 0.5 }]}
            numberOfLines={1}
          >
            Detalhes completos do produto
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: theme.foreground }]}
          onPress={() =>
            router.push({
              pathname: 'cardapio/addItem' as any,
              params: { id: item.id },
            })
          }
          activeOpacity={0.7}
        >
          <EditIcon color={theme.contrast} size={22} />
        </TouchableOpacity>
      </View>

      <View style={isWeb ? styles.heroRow : styles.heroColumn}>
        <ImageWithFallback
          uri={item.image}
          style={styles.heroImage}
          placeholderStyle={styles.heroImagePlaceholder}
          theme={theme}
        />

        <View style={isWeb ? styles.heroContent : styles.heroContentMobile}>
          {item.category ? (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: theme.contrast },
              ]}
            >
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
          ) : null}

          <Text style={[styles.itemName, { color: theme.text }]}>
            {item.name}
          </Text>

          <Text style={[styles.itemPrice, { color: theme.contrast }]}>
            {priceFormatted}
          </Text>

          {item.description ? (
            <Text
              style={[styles.itemDescription, { color: theme.text }]}
            >
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Ingredientes
      </Text>
      <View
        style={[styles.ingredientsCard, { backgroundColor: theme.foreground }]}
      >
        {ingredients.length > 0 ? (
          <View style={styles.ingredientsList}>
            {ingredients.map((ing: any, index: number) => {
              const ingKey = `${ing.id || ing.name || 'ing'}-${index}`;
              return (
                <TouchableOpacity
                  key={ingKey}
                  style={[
                    styles.ingredientItem,
                    { backgroundColor: theme.background },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (ing.id) {
                      router.push(`estoque/${ing.id}` as any);
                    }
                  }}
                  disabled={!ing.id}
                >
                  <View
                    style={[
                      styles.ingredientDot,
                      { backgroundColor: theme.contrast },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.ingredientText,
                        { color: theme.text },
                      ]}
                    >
                      {formatIngredientLine(ing)}
                    </Text>
                    {ing.info ? (
                      <Text
                        style={[
                          styles.ingredientInfo,
                          { color: theme.text },
                        ]}
                      >
                        {ing.info}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text
            style={[
              styles.emptyIngredients,
              { color: theme.text, opacity: 0.5 },
            ]}
          >
            Nenhum ingrediente cadastrado para este item.
          </Text>
        )}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
  headerSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 32,
  },
  heroColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    marginBottom: 32,
  },
  heroImage: {
    width: "100%",
    maxWidth: 200,
    aspectRatio: 1,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  heroImagePlaceholder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    flex: 1,
    gap: 10,
  },
  heroContentMobile: {
    width: '100%',
    gap: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  itemName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 22,
  },
  itemPrice: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
  },
  itemDescription: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
    opacity: 0.6,
    marginLeft: 4,
    marginBottom: 12,
  },
  ingredientsCard: {
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  ingredientsList: {
    gap: 6,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ingredientText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  ingredientInfo: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  emptyIngredients: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    marginTop: 16,
  },
  notFoundSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  notFoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notFoundBtnText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
});
