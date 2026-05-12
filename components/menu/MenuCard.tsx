import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { EditIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export function MenuCard({ name, description, price, image }: MenuItem) {
  const theme = useAppTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.card}>
      {/* Left: Image Placeholder */}
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
      </View>

      {/* Middle: Content */}
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
        <Text style={styles.price}>R$ {price.toFixed(2).replace('.', ',')}</Text>
      </View>

      {/* Vertical Divider */}
      <View style={styles.verticalDivider} />

      {/* Right: Edit Action */}
      <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
        <EditIcon color={theme.text} opacity={0.7} size={24} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: theme.foreground,
      borderRadius: 24,
      padding: 12,
      marginBottom: 16,
      alignItems: 'center',
    },
    imageContainer: {
      marginRight: 16,
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
    content: {
      flex: 1,
      paddingRight: 8,
    },
    name: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
      marginBottom: 4,
    },
    description: {
      fontFamily: 'Jost_400Regular',
      fontSize: 13,
      color: theme.text,
      opacity: 0.6,
      marginBottom: 8,
      lineHeight: 18,
    },
    price: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
    },
    verticalDivider: {
      width: 1,
      height: '60%',
      borderLeftWidth: 1,
      borderColor: theme.background,
      borderStyle: 'dashed',
      marginHorizontal: 12,
    },
    editBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
