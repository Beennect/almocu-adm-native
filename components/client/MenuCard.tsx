import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EditIcon } from '../shared/Icons';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface MenuCardProps extends MenuItem {
  onEdit?: () => void;
}

export function MenuCard({ name, description, price, onEdit }: MenuCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder} />
      
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        <Text style={styles.price}>R$ {price.toFixed(2).replace('.', ',')}</Text>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity 
        style={styles.editButton} 
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <EditIcon color="#374151" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  content: {
    flex: 1,
    marginLeft: 16,
    paddingRight: 8,
  },
  name: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  price: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
    color: '#111827',
  },
  divider: {
    width: 0,
    height: '60%',
    borderLeftWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },
  editButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
