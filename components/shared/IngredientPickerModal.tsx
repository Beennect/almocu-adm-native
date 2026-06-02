import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAppTheme } from '@/themes/colors';
import { IngredientItem } from '@/stores/DataStore';
import { CheckIcon, CloseIcon, SearchIcon } from './Icons';

interface IngredientPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  ingredients: IngredientItem[];
  initialSelectedIds: string[];
  title?: string;
}

export const IngredientPickerModal: React.FC<IngredientPickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  ingredients,
  initialSelectedIds,
  title = 'Selecionar Ingredientes',
}) => {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [visible, initialSelectedIds]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return ingredients;
    return ingredients.filter((ing) => {
      const name = ing.name?.toLowerCase() ?? '';
      const brand = ing.brand?.toLowerCase() ?? '';
      return name.includes(query) || brand.includes(query);
    });
  }, [ingredients, searchQuery]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearAll = () => setSelectedIds(new Set());

  const hasGlobalIngredients = ingredients.length > 0;
  const hasFilteredResults = filtered.length > 0;
  const selectedCount = selectedIds.size;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, { backgroundColor: theme.foreground }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <TouchableOpacity
                  style={styles.closeIconBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <CloseIcon color={theme.text} size={20} />
                </TouchableOpacity>
                <View style={[styles.headerLine, { backgroundColor: theme.text + '20' }]} />
              </View>

              {hasGlobalIngredients && (
                <View style={[styles.searchWrapper, { backgroundColor: theme.background, borderColor: 'rgba(255,255,255,0.08)' }]}>
                  <SearchIcon color={theme.text + '80'} size={18} style={styles.searchIcon} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Buscar ingrediente..."
                    placeholderTextColor={theme.text + '60'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <CloseIcon color={theme.text + '80'} size={16} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, { color: theme.text }]}>
                  {selectedCount === 0
                    ? 'Nenhum selecionado'
                    : `${selectedCount} selecionado${selectedCount > 1 ? 's' : ''}`}
                </Text>
                {selectedCount > 0 && (
                  <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
                    <Text style={[styles.clearText, { color: theme.contrast }]}>Limpar tudo</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {!hasGlobalIngredients ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.text }]}>Nenhum ingrediente cadastrado</Text>
                    <Text style={[styles.emptySubtext, { color: theme.text }]}>
                      Cadastre itens de estoque antes de criar uma receita.
                    </Text>
                  </View>
                ) : !hasFilteredResults ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.text }]}>Nada encontrado</Text>
                    <Text style={[styles.emptySubtext, { color: theme.text }]}>
                      Nenhum ingrediente corresponde a &quot;{searchQuery}&quot;.
                    </Text>
                  </View>
                ) : (
                  filtered.map((ing) => {
                    const isSelected = selectedIds.has(ing.id);
                    return (
                      <TouchableOpacity
                        key={ing.id}
                        style={[
                          styles.option,
                          {
                            borderColor: isSelected ? theme.contrast : theme.text + '20',
                            backgroundColor: isSelected ? theme.contrast + '12' : 'transparent',
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => toggle(ing.id)}
                      >
                        <View style={styles.optionContent}>
                          <Text
                            style={[styles.optionName, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {ing.name}
                          </Text>
                          {ing.brand ? (
                            <Text
                              style={[styles.optionBrand, { color: theme.text }]}
                              numberOfLines={1}
                            >
                              {ing.brand}
                            </Text>
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: isSelected ? theme.contrast : theme.text + '40',
                              backgroundColor: isSelected ? theme.contrast : 'transparent',
                            },
                          ]}
                        >
                          {isSelected && <CheckIcon color="#FFFFFF" size={14} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: theme.background }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelText, { color: theme.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      backgroundColor: selectedCount > 0 ? theme.contrast : theme.contrast + '40',
                    },
                  ]}
                  onPress={() => onConfirm(Array.from(selectedIds))}
                  activeOpacity={0.7}
                  disabled={selectedCount === 0}
                >
                  <Text style={styles.confirmText}>
                    {selectedCount > 0 ? `Confirmar (${selectedCount})` : 'Confirmar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    paddingRight: 28,
  },
  closeIconBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  headerLine: {
    height: 1,
    width: '100%',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    paddingVertical: 6,
    outlineStyle: 'none',
  } as any,
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryText: {
    fontFamily: 'Jost_500Medium',
    fontSize: 13,
    opacity: 0.7,
  },
  clearText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 13,
  },
  list: {
    maxHeight: 380,
  },
  listContent: {
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 15,
  },
  optionBrand: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 15,
  },
  confirmText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  emptyText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtext: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.6,
  },
});
