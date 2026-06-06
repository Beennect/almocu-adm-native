import { useAppTheme } from '@/themes/colors';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  CameraIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  FoodStoreIcon,
  TrashIcon,
  PlusIcon
} from '../../../components/shared/Icons';
import { SelectModal } from '../../../components/shared/SelectModal';
import { ConfirmModal } from '../../../components/shared/ConfirmModal';
import { IngredientPickerModal } from '../../../components/shared/IngredientPickerModal';

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  info?: string;
  unit?: string;
}

interface AddItemFormData {
  name: string;
  category: string;
  value: string;
  additionalInfo: string;
  photo: string | null;
}

import { dataStore, IngredientItem } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { withLoading } from '@/utils/toast';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { compressImageForUpload, readFileAsBase64, formatBytes, IMAGE_UPLOAD_MAX_BYTES } from '@/utils/image-compression';

export default observer(function AddItemScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  const styles = makeStyles(theme, isWeb);

  const [formData, setFormData] = useState<AddItemFormData>({
    name: '',
    category: '',
    value: '',
    additionalInfo: '',
    photo: null,
  });
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoOriginalSize, setPhotoOriginalSize] = useState<number | null>(null);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [ingredientPickerVisible, setIngredientPickerVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categoryOptions = ["Entradas", "Pratos Principais", "Sobremesas", "Bebidas", "Combos"];

  // Carregar dados se estiver editando
  useEffect(() => {
    if (isEditing) {
      const item = dataStore.menuItems.find(i => i.id === params.id);
      if (item) {
        setFormData({
          name: item.name,
          category: item.category || '',
          value: sanitizePrice(item.price.toString()),
          additionalInfo: item.description,
          photo: item.image || null,
        });
        setImageBase64(null);
        if (item.ingredients) {
          setIngredients(item.ingredients);
        }
      }
    }
  }, [params.id]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const originalUri = result.assets[0].uri;
    setIsCompressingPhoto(true);
    try {
      const compressed = await compressImageForUpload(originalUri);
      setImageBase64(compressed.base64 || null);
      setPhotoOriginalSize(compressed.size);
      setFormData(prev => ({ ...prev, photo: compressed.uri }));
      if (compressed.size > IMAGE_UPLOAD_MAX_BYTES) {
        Toast.show({
          type: 'warning',
          text1: 'Imagem grande',
          text2: `Após compressão: ${formatBytes(compressed.size)}. Limite: ${formatBytes(IMAGE_UPLOAD_MAX_BYTES)}.`,
        });
      }
    } catch (err) {
      console.warn('Falha ao comprimir imagem:', err);
      // Tenta ler base64 da original mesmo sem compressão
      readFileAsBase64(originalUri)
        .then(base64 => setImageBase64(base64))
        .catch(() => {});
      setFormData(prev => ({ ...prev, photo: originalUri }));
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const isUnitInteger = (unit?: string) => !unit || unit === 'Unidades';
  const getStepForUnit = (unit?: string) => isUnitInteger(unit) ? 1 : 0.1;
  const getMinForUnit = (unit?: string) => isUnitInteger(unit) ? 1 : 0.01;
  const formatQty = (qty: number, unit?: string) => {
    if (isUnitInteger(unit)) return Math.round(qty).toString();
    return (Math.round(qty * 100) / 100).toString().replace('.', ',');
  };

  const sanitizePrice = (text: string) => {
    let sanitized = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    const firstDot = sanitized.indexOf('.');
    if (firstDot !== -1) {
      sanitized = sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, '');
      const [intPart, decPart] = sanitized.split('.');
      sanitized = intPart + ',' + decPart.slice(0, 2);
    }
    if (sanitized.startsWith(',')) sanitized = '0' + sanitized;
    return sanitized;
  };

  const removeIngredient = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      setIngredients(prev => prev.filter(item => item.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  const handleConfirmIngredients = (selectedIds: string[]) => {
    setIngredients(prev => {
      const next: Ingredient[] = [];
      const prevById = new Map(prev.map(i => [i.id, i]));

      for (const id of selectedIds) {
        const existing = prevById.get(id);
        if (existing) {
          next.push(existing);
          continue;
        }
        const stockIng = dataStore.ingredients.find((i: IngredientItem) => i.id === id);
        if (!stockIng) continue;
        const defaultQty = isUnitInteger(stockIng.unit) ? 1 : 0.1;
        next.push({
          id: stockIng.id,
          name: stockIng.name,
          quantity: formatQty(defaultQty, stockIng.unit),
          unit: stockIng.unit || 'Unidades',
        });
      }
      return next;
    });
    setIngredientPickerVisible(false);
  };

  const adjustQty = (id: string, delta: number) => {
    setIngredients(prev => prev.map(item => {
      if (item.id === id) {
        const isInt = isUnitInteger(item.unit);
        const currentQty = isInt ? (parseInt(item.quantity, 10) || 0) : (parseFloat(item.quantity.replace(',', '.')) || 0);
        const newQty = Math.max(getMinForUnit(item.unit), currentQty + delta);
        return { ...item, quantity: formatQty(newQty, item.unit) };
      }
      return item;
    }));
  };

  const updateIngredientQty = (id: string, text: string, isInt: boolean) => {
    let sanitized = text.replace(',', '.');
    sanitized = isInt ? sanitized.replace(/[^0-9]/g, '') : sanitized.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    if (!isInt && sanitized.startsWith('.')) sanitized = '0' + sanitized;

    setIngredients(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: sanitized };
      }
      return item;
    }));
  };

  const handleAddItem = async () => {
    if (!formData.name || !formData.value || !formData.category) {
      Toast.show({ type: 'error', text1: "Por favor, preencha o nome, valor e categoria." });
      return;
    }

    if (ingredients.length === 0) {
      Toast.show({ type: 'error', text1: "Adicionar pelo menos um ingrediente ao item." });
      return;
    }

    const hasInvalidQty = ingredients.some(item => {
      const isInt = isUnitInteger(item.unit);
      const qty = isInt ? parseInt(item.quantity, 10) : parseFloat(item.quantity.replace(',', '.'));
      return isNaN(qty) || qty < getMinForUnit(item.unit);
    });
    if (hasInvalidQty) {
      Toast.show({ type: 'error', text1: "Existem ingredientes com quantidade inválida." });
      return;
    }

    const itemData: any = {
      name: formData.name,
      description: formData.additionalInfo || '',
      price: parseFloat(formData.value.replace(',', '.')),
      category: formData.category,
      ingredients: ingredients,
    };
    if (imageBase64) {
      itemData.imageBase64 = imageBase64;
    }

    await withLoading(
      async () => {
        if (isEditing) {
          await dataStore.updateItem(params.id as string, itemData);
        } else {
          await dataStore.addItem(itemData);
        }
        router.back();
      },
      { loading: 'Salvando item...', success: isEditing ? "Item atualizado com sucesso!" : "Item adicionado ao cardápio!", error: "Erro ao processar item." }
    );
  };

  return (
    <ProtectedRoute abilities={['menu:create', 'menu:edit']} requireAll={false} redirect>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon color={theme.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'EDITAR ITEM' : 'ADICIONAR ITEM'}</Text>
          <View style={styles.headerLine} />
        </View>

        <View style={styles.formSection}>
          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Nome do Produto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Bolo de Chocolate"
                placeholderTextColor={theme.text + '80'}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, name: text }))
                }
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Categoria</Text>
              <TouchableOpacity
                style={styles.pickerContainer}
                activeOpacity={0.7}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={styles.pickerText}>
                  {formData.category || 'Selecione...'}
                </Text>
                <View style={styles.pickerIconContainer}>
                  <ChevronDownIcon color={theme.text} size={20} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Valor</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 25,00"
                placeholderTextColor={theme.text + '80'}
                keyboardType="decimal-pad"
                value={formData.value}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, value: sanitizePrice(text) }))
                }
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Foto do Produto</Text>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <TouchableOpacity
                    style={[styles.button, { height: 54, flex: 1 }]}
                    activeOpacity={0.7}
                    onPress={handlePickImage}
                    disabled={isCompressingPhoto}
                >
                    <CameraIcon style={styles.buttonIcon} color={formData.photo ? theme.contrast : theme.text} />
                    <Text style={styles.buttonText}>
                      {isCompressingPhoto ? 'Comprimindo...' : formData.photo ? 'Trocar Foto' : 'Adicionar Foto'}
                    </Text>
                </TouchableOpacity>
                {formData.photo && (
                  <Image source={{ uri: formData.photo }} style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: theme.foreground }} />
                )}
              </View>
              {photoOriginalSize != null && (
                <Text style={[styles.ingredientInfoText, { marginTop: 6, marginLeft: 4 }]}>
                  Foto otimizada: {formatBytes(photoOriginalSize)}
                </Text>
              )}
            </View>
          </View>

          {/* Ingredient List */}
          {ingredients.length > 0 && (
            <Text style={styles.label}>Ingredientes</Text>
          )}

          {ingredients.length === 0 && (
            <View style={styles.ingredientEmptyState}>
              <Text style={[styles.ingredientEmptyTitle, { color: theme.text }]}>Nenhum ingrediente adicionado</Text>
              <Text style={[styles.ingredientEmptySubtitle, { color: theme.text }]}>
                Toque em &quot;Adicionar Ingredientes&quot; para escolher os itens que compõem a receita.
              </Text>
            </View>
          )}

          {ingredients.map((item, index) => {
            const itemIsInt = isUnitInteger(item.unit);
            const step = getStepForUnit(item.unit);
            return (
              <View key={`${item.id}-${index}`} style={{ marginBottom: 12 }}>
                <View style={styles.ingredientItem}>
                  <View style={styles.ingredientQtyWrapper}>
                    <TouchableOpacity onPress={() => adjustQty(item.id, -step)} style={styles.ingredientStepBtn}>
                      <Text style={styles.ingredientStepBtnText}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.ingredientQtyInput}
                      value={item.quantity}
                      keyboardType={itemIsInt ? 'number-pad' : 'decimal-pad'}
                      selectTextOnFocus
                      onChangeText={(text) => updateIngredientQty(item.id, text, itemIsInt)}
                    />
                    <TouchableOpacity onPress={() => adjustQty(item.id, step)} style={styles.ingredientStepBtn}>
                      <Text style={styles.ingredientStepBtnText}>+</Text>
                    </TouchableOpacity>
                    <View style={styles.ingredientDivider} />
                  </View>
                  <View style={styles.ingredientContent}>
                    <Text style={styles.ingredientNameText}>
                      {item.name} {item.unit ? <Text style={styles.ingredientInfoText}>· {item.unit}</Text> : null}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeIngredient(item.id)}>
                    <TrashIcon color={theme.contrast} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Add Ingredient Button */}
          <TouchableOpacity
            style={styles.addIngredientBtn}
            onPress={() => setIngredientPickerVisible(true)}
            activeOpacity={0.7}
          >
            <PlusIcon size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addIngredientBtnText}>
              {ingredients.length > 0 ? 'Adicionar mais ingredientes' : 'Adicionar Ingredientes'}
            </Text>
          </TouchableOpacity>

          <View>
            <Text style={styles.label}>Descrição do Produto</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: Delicioso bolo de chocolate com cobertura de morango..."
              placeholderTextColor={theme.text + '80'}
              multiline
              numberOfLines={4}
              value={formData.additionalInfo}
              onChangeText={(text) =>
                setFormData(prev => ({ ...prev, additionalInfo: text }))
              }
            />
          </View>

          <View style={styles.divider} />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={{...styles.button, ...styles.primaryButton}}
            activeOpacity={0.8}
            onPress={handleAddItem}
          >
            <FoodStoreIcon style={styles.primaryButtonIcon} size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{isEditing ? 'Salvar Alterações' : 'Adicionar Item'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SelectModal 
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        onSelect={(val) => setFormData(prev => ({ ...prev, category: val }))}
        options={categoryOptions}
        title="Selecione a Categoria"
      />

      <IngredientPickerModal
        visible={ingredientPickerVisible}
        onClose={() => setIngredientPickerVisible(false)}
        onConfirm={handleConfirmIngredients}
        ingredients={dataStore.ingredients}
        initialSelectedIds={ingredients.map(i => i.id)}
      />

      <ConfirmModal
        visible={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="Remover Ingrediente"
        message="Tem certeza que deseja remover este ingrediente da receita?"
        confirmText="Remover"
      />
      </View>
    </ProtectedRoute>
  );
});

function makeStyles(theme: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: isWeb ? 32 : 20,
      paddingHorizontal: isWeb ? 32 : 16,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    backBtn: {
      marginRight: 12,
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.foreground,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
      opacity: 0.6,
      marginRight: 12,
    },
    headerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.background,
    },
    formSection: {
      marginBottom: 24,
      gap: 16,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    inputWrapper: {
      flex: 1,
      minWidth: 140,
    },
    input: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      outlineStyle: 'none',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    } as any,
    label: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: theme.text,
      marginBottom: 6,
      marginLeft: 4,
    },
    pickerContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 100,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    pickerText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      marginRight: 8,
    },
    pickerIconContainer: {
      marginLeft: 4,
      color: theme.text,
    },
    ingredientItem: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 8,
      minHeight: 64,
    },
    ingredientQtyWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 12,
    },
    ingredientQtyText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 18,
      color: theme.text,
      minWidth: 24,
      textAlign: 'center',
    },
    ingredientQtyInput: {
      fontFamily: 'Jost_700Bold',
      fontSize: 16,
      color: theme.text,
      minWidth: 56,
      maxWidth: 80,
      paddingVertical: 4,
      paddingHorizontal: 4,
      textAlign: 'center',
      backgroundColor: theme.background,
      borderRadius: 8,
      outlineStyle: 'none',
    } as any,
    ingredientStepBtn: {
      padding: 4,
      width: 24,
      alignItems: 'center',
    },
    ingredientStepBtnText: {
      color: theme.text,
      fontSize: 18,
      fontFamily: 'Jost_700Bold',
    },
    ingredientDivider: {
      width: 1,
      height: 24,
      borderLeftWidth: 1,
      borderColor: theme.background,
      marginLeft: 12,
      borderStyle: 'dashed',
    },
    ingredientContent: {
      flex: 1,
    },
    ingredientNameText: {
      fontFamily: 'Jost_700Bold',
      fontSize: 14,
      color: theme.text,
    },
    ingredientInfoText: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      color: theme.text,
      opacity: 0.6,
    },
    ingredientEmptyState: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      borderStyle: 'dashed',
      paddingVertical: 24,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ingredientEmptyTitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      marginBottom: 6,
      textAlign: 'center',
    },
    ingredientEmptySubtitle: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      opacity: 0.6,
      textAlign: 'center',
    },
    addIngredientBtn: {
      backgroundColor: theme.contrast,
      borderRadius: 16,
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    addIngredientBtnText: {
      color: '#FFFFFF',
      fontFamily: 'Jost_400Regular',
      fontWeight: '500',
      fontSize: 14,
    },
    buttonIcon: {
      fontSize: 18,
      color: theme.text,
    },
    buttonText: {
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      fontWeight: '500',
    },
    textArea: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.text,
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      textAlignVertical: 'top',
      minHeight: 120,
      outlineStyle: 'none',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    } as any,
    divider: {
      height: 1,
      backgroundColor: theme.text + '20',
      marginVertical: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      flexWrap: 'wrap',
    },
    button: {
      flex: isWeb ? 1 : undefined,
      flexGrow: 1,
      minWidth: isWeb ? 'auto' : 140,
      backgroundColor: theme.foreground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    buttonActive: {
      backgroundColor: theme.contrast + '10',
      borderColor: theme.contrast,
    },
    primaryButton: {
      backgroundColor: theme.contrast,
    },
    primaryButtonIcon: {
      fontSize: 18,
      color: theme.foreground,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Jost_400Regular',
      fontWeight: '500',
    },
  });
}