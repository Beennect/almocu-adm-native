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
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  CameraIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ClocheIcon,
  FileTextIcon,
  FoodStoreIcon,
  MapPointIcon,
  TrashIcon,
  PlusIcon
} from '../../../components/shared/Icons';
import { SelectModal } from '../../../components/shared/SelectModal';
import { ConfirmModal } from '../../../components/shared/ConfirmModal';
import * as FileSystem from 'expo-file-system';

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
  serves: string;
  additionalInfo: string;
  hasRemovals: boolean;
  hasAdditionals: boolean;
  photo: string | null;
}

import { dataStore } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { withLoading } from '@/utils/toast';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';

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
    serves: '',
    additionalInfo: '',
    hasRemovals: false,
    hasAdditionals: false,
    photo: null,
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: '',
    info: ''
  });

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [ingredientModalVisible, setIngredientModalVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categoryOptions = ["Entradas", "Pratos Principais", "Sobremesas", "Bebidas", "Combos"];
  const ingredientOptions = dataStore.ingredients.map(i => i.name);

  // Carregar dados se estiver editando
  useEffect(() => {
    if (isEditing) {
      const item = dataStore.menuItems.find(i => i.id === params.id);
      if (item) {
        setFormData({
          name: item.name,
          category: item.category || '',
          value: item.price.toString().replace('.', ','),
          serves: item.serves?.toString() || '', 
          additionalInfo: item.description,
          hasRemovals: item.hasRemovals || false,
          hasAdditionals: item.hasAdditionals || false,
          photo: item.image || null,
        });
        if (item.ingredients) {
          setIngredients(item.ingredients);
        }
      }
    }
  }, [params.id]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduce quality slightly to save base64 string size
        base64: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!result.canceled && result.assets[0].base64) {
        const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setFormData(prev => ({ ...prev, photo: imageUri }));
      }
    }
  };

  const handleAddIngredient = () => {
    const stockIng = dataStore.ingredients.find(i => i.name === newIngredient.name);

    if (!stockIng) {
      Toast.show({ type: 'error', text1: "Ingrediente não encontrado no estoque. Atualize a lista." });
      return;
    }

    const isUnidades = stockIng.unit === 'Unidades';

    if (!newIngredient.name || (isUnidades && !newIngredient.quantity)) {
      Toast.show({ type: 'error', text1: isUnidades ? "Selecione um ingrediente e informe a quantidade." : "Selecione um ingrediente." });
      return;
    }

    if (isUnidades) {
      const qty = parseInt(newIngredient.quantity);
      if (isNaN(qty) || qty <= 0) {
        Toast.show({ type: 'error', text1: "A quantidade deve ser maior que 0." });
        return;
      }
    }

    const ingredient: Ingredient = {
      id: stockIng.id,
      name: newIngredient.name,
      quantity: isUnidades ? newIngredient.quantity : '',
      info: newIngredient.info,
      unit: stockIng.unit || 'Unidades'
    };

    setIngredients(prev => [...prev, ingredient]);
    setNewIngredient({ name: '', quantity: '', info: '' });
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

  const adjustQty = (id: string, delta: number) => {
    setIngredients(prev => prev.map(item => {
      if (item.id === id) {
        const currentQty = parseInt(item.quantity) || 1;
        const newQty = Math.max(1, currentQty + delta);
        return { ...item, quantity: newQty.toString() };
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

    const servesVal = parseInt(formData.serves);
    if (isNaN(servesVal) || servesVal <= 0) {
      Toast.show({ type: 'error', text1: "A quantidade de pessoas deve ser maior que 0." });
      return;
    }

    const itemData = {
      name: formData.name,
      description: formData.additionalInfo || '',
      price: parseFloat(formData.value.replace(',', '.')),
      category: formData.category,
      ingredients: ingredients,
      hasRemovals: formData.hasRemovals,
      hasAdditionals: formData.hasAdditionals,
      serves: formData.serves || undefined,
      image: formData.photo,
    };

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

  const toggleFeature = (feature: 'hasRemovals' | 'hasAdditionals') => {
    setFormData(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  return (
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
                  setFormData(prev => ({ ...prev, value: text }))
                }
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Serve quantas pessoas?</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 2"
                placeholderTextColor={theme.text + '80'}
                keyboardType="number-pad"
                value={formData.serves}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, serves: text }))
                }
                onSubmitEditing={handleAddItem}
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
                >
                    <CameraIcon style={styles.buttonIcon} color={formData.photo ? theme.contrast : theme.text} />
                    <Text style={styles.buttonText}>{formData.photo ? "Trocar Foto" : "Adicionar Foto"}</Text>
                </TouchableOpacity>
                {formData.photo && (
                  <Image source={{ uri: formData.photo }} style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: theme.foreground }} />
                )}
              </View>
            </View>
          </View>

          {/* Ingredient List */}
          {ingredients.map((item, index) => (
            <View key={item.id} style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Ingrediente {index + 1}</Text>
              <View style={styles.ingredientItem}>
                {(!item.unit || item.unit === 'Unidades') && (
                  <View style={styles.ingredientQtyWrapper}>
                    <TouchableOpacity onPress={() => adjustQty(item.id, -1)} style={{ padding: 4, width: 24, alignItems: 'center' }}>
                      <Text style={{ color: theme.text, fontSize: 18, fontFamily: 'Jost_700Bold' }}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.ingredientQtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => adjustQty(item.id, 1)} style={{ padding: 4, width: 24, alignItems: 'center' }}>
                      <Text style={{ color: theme.text, fontSize: 18, fontFamily: 'Jost_700Bold' }}>+</Text>
                    </TouchableOpacity>
                    <View style={styles.ingredientDivider} />
                  </View>
                )}
                <View style={styles.ingredientContent}>
                  <Text style={styles.ingredientNameText}>
                    {item.name} {item.info ? <Text style={styles.ingredientInfoText}>{item.info}</Text> : null}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(item.id)}>
                  <TrashIcon color={theme.contrast} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add Ingredient Form */}
          <View style={styles.ingredientForm}>
            <View style={styles.row}>
              <View style={[styles.inputWrapper, { flex: 1.5 }]}>
                <Text style={styles.label}>Ingrediente</Text>
                <TouchableOpacity
                  style={[styles.pickerContainer, { flex: undefined }]}
                  activeOpacity={0.7}
                  onPress={() => setIngredientModalVisible(true)}
                >
                  <Text style={styles.pickerText}>
                    {newIngredient.name || 'Selecione...'}
                  </Text>
                  <View style={styles.pickerIconContainer}>
                    <ChevronDownIcon color={theme.text} size={20} />
                  </View>
                </TouchableOpacity>
              </View>

              {(!newIngredient.name || dataStore.ingredients.find(i => i.name === newIngredient.name)?.unit === 'Unidades') && (
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Text style={styles.label}>Quantidade</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 3"
                    placeholderTextColor={theme.text + '80'}
                    value={newIngredient.quantity}
                    onChangeText={(text) =>
                      setNewIngredient(prev => ({ ...prev, quantity: text }))
                    }
                    onSubmitEditing={handleAddIngredient}
                  />
                </View>
              )}
            </View>



            <TouchableOpacity 
              style={styles.addIngredientBtn} 
              onPress={handleAddIngredient}
              activeOpacity={0.7}
            >
              <PlusIcon size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.addIngredientBtnText}>Adicionar Ingrediente</Text>
            </TouchableOpacity>
          </View>

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
            style={[
              styles.button,
              formData.hasRemovals && styles.buttonActive,
            ]}
            activeOpacity={0.7}
            onPress={() => toggleFeature('hasRemovals')}
          >
            <MapPointIcon style={styles.buttonIcon} size={18} color={formData.hasRemovals ? theme.contrast : theme.text} />
            <Text style={styles.buttonText}>Habilitar Remoções</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              formData.hasAdditionals && styles.buttonActive,
            ]}
            activeOpacity={0.7}
            onPress={() => toggleFeature('hasAdditionals')}
          >
            <FileTextIcon style={styles.buttonIcon} size={18} color={formData.hasAdditionals ? theme.contrast : theme.text} />
            <Text style={styles.buttonText}>Habilitar Adicionais</Text>
          </TouchableOpacity>

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

      <SelectModal 
        visible={ingredientModalVisible}
        onClose={() => setIngredientModalVisible(false)}
        onSelect={(val) => setNewIngredient(prev => ({ ...prev, name: val }))}
        options={ingredientOptions}
        title="Selecione o Ingrediente"
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
    ingredientForm: {
      backgroundColor: theme.background + '80',
      borderRadius: 20,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.foreground,
    },
    ingredientInfoInput: {
      fontSize: 12,
      paddingVertical: 10,
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