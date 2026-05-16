import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Alert } from 'react-native';
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
  hasRemovals?: boolean;
  hasAdditionals?: boolean;
  serves?: string | number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MenuCard({ name, description, price, image, ingredients, hasRemovals, hasAdditionals, serves, onEdit, onDelete }: MenuItem) {
  const theme = useAppTheme();
  const styles = makeStyles(theme);

  const renderBadge = (text: string, color: string, bgColor: string, tooltip: string) => {
    const handlePress = () => {
      if (Platform.OS !== 'web') {
        Alert.alert('Funcionalidade', tooltip);
      }
    };

    const badgeView = (
      <TouchableOpacity 
        style={[styles.badge, { backgroundColor: bgColor }]} 
        onPress={handlePress}
        activeOpacity={Platform.OS === 'web' ? 1 : 0.7}
      >
        <Text style={[styles.badgeText, { color }]}>{text}</Text>
      </TouchableOpacity>
    );

    if (Platform.OS === 'web') {
      return (
        // @ts-ignore
        <div title={tooltip} style={{ cursor: 'default', display: 'flex' }}>
          {badgeView}
        </div>
      );
    }
    return badgeView;
  };

  return (
    <View style={styles.card}>
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
        <View style={styles.headerRow}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.featureBadges}>
            {hasRemovals && renderBadge('R', '#FF5252', '#FF525220', 'Permite Remoção')}
            {hasAdditionals && renderBadge('A', '#4CAF50', '#4CAF5020', 'Permite Adicionais')}
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
        
        {ingredients && ingredients.length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsHeader}>Ingredientes</Text>
            <Text style={styles.ingredientItemText}>
              {ingredients.map(i => (i.unit === 'Unidades' || (!i.unit && i.quantity)) && i.quantity ? `${i.quantity} ${i.name}` : i.name).join('  •  ')}
            </Text>
          </View>
        )}

        {serves ? (
          <Text style={styles.servesText}>Serve até {serves} pessoa{serves == 1 ? '' : 's'}</Text>
        ) : null}
      </View>

      {/* Vertical Divider */}
      <View style={styles.verticalDivider} />

      {/* Right: Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onEdit}>
          <EditIcon color={theme.text} opacity={0.7} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onDelete}>
          <TrashIcon color={theme.contrast} opacity={0.7} size={20} />
        </TouchableOpacity>
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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    featureBadges: {
      flexDirection: 'row',
      gap: 4,
    },
    badge: {
      width: 20,
      height: 20,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 11,
    },
    name: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
      flex: 1,
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
    servesText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 12,
      color: theme.text,
      opacity: 0.7,
      marginBottom: 4,
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
