import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { EditIcon, TrashIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  ingredients?: any[];
  available?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function formatIngredient(ing: any): string {
  const qty = ing.quantity ? String(ing.quantity).replace('.', ',') : '';
  const unit = ing.unit;
  const name = ing.name || 'Ingrediente';
  if (!qty) return name;
  if (!unit || unit === 'Unidades') return `${qty} ${name}`;
  return `${qty} ${unit.toLowerCase()} de ${name}`;
}

export function MenuCard({ name, description, price, image, ingredients, available = true, onPress, onEdit, onDelete }: MenuItem) {
  const theme = useAppTheme();
  const styles = makeStyles(theme);
  const isOutOfStock = available === false;

  return (
    <View style={[styles.card, isOutOfStock && { opacity: 0.6 }]}>
      {/* Left + Middle: tappable for detail view */}
      <TouchableOpacity
        style={styles.touchableArea}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!onPress}
      >
        {/* Left: Image & Price */}
        <View style={styles.leftCol}>
          <View style={styles.imageContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.placeholderImage} />
            )}
          </View>
          <Text style={styles.price}>R$ {price.toFixed(2).replace('.', ',')}</Text>
        </View>

        {/* Middle: Content */}
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.name}>{name}</Text>
            {isOutOfStock && (
              <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontFamily: 'Jost_700Bold', color: '#FFF', fontSize: 11 }}>ESGOTADO</Text>
              </View>
            )}
          </View>

          <Text style={styles.description} numberOfLines={2}>{description}</Text>

          {ingredients && ingredients.length > 0 && (
            <View style={styles.ingredientsContainer}>
              <Text style={styles.ingredientsHeader}>Ingredientes</Text>
              <Text style={styles.ingredientItemText}>
                {ingredients.map(formatIngredient).join('  •  ')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Vertical Divider */}
      <View style={styles.verticalDivider} />

      {/* Right: Actions */}
      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onEdit}>
            <EditIcon color={theme.text} opacity={0.7} size={20} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onDelete}>
            <TrashIcon color={theme.contrast} opacity={0.7} size={20} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.foreground,
      borderRadius: 24,
      padding: 16,
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
      gap: 12,
    },
    imageContainer: {
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: 12,
      backgroundColor: theme.background,
    },
    placeholderImage: {
      width: 80,
      height: 80,
      borderRadius: 12,
      backgroundColor: theme.background,
    },
    price: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
    },
    content: {
      flex: 1,
      paddingRight: 8,
    },
    name: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
      flex: 1,
      marginBottom: 2,
    },
    description: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      color: theme.text,
      opacity: 0.6,
      marginBottom: 8,
    },
    ingredientsContainer: {
      marginBottom: 12,
    },
    ingredientsHeader: {
      fontFamily: 'Jost_700Bold',
      fontSize: 12,
      color: theme.text,
      opacity: 0.8,
      marginBottom: 4,
    },
    ingredientItemText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      color: theme.text,
      opacity: 0.6,
      marginBottom: 2,
    },
    verticalDivider: {
      width: 1,
      alignSelf: 'stretch',
      borderLeftWidth: 1,
      borderColor: theme.background,
      borderStyle: 'dashed',
      marginHorizontal: 24,
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
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
