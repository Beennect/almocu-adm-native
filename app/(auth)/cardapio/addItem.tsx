import { useAppTheme } from '@/themes/colors';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  CameraIcon,
  ChevronDownIcon,
  ClocheIcon,
  FileTextIcon,
  FoodStoreIcon,
  MapPointIcon,
  TrashIcon
} from '../../../components/shared/Icons';
import { SelectModal } from '../../../components/shared/SelectModal';
import { useToast } from '../../../components/shared/Toast';
import { productService } from '../../../services/api-product-service';

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  info?: string;
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

export default function AddItemScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { showToast } = useToast();
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
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = ["Entradas", "Pratos Principais", "Sobremesas", "Bebidas", "Combos"];
  const ingredientOptions = ["Camarões", "Salmão", "Arroz", "Nori", "Cream Cheese", "Atum", "Shoyu", "Niguiri de salmão"];

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled) {
        setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
      }
    } catch (error) {
      showToast({ message: 'Erro ao selecionar imagem', type: 'error' });
    }
  };

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.quantity) {
      showToast({ message: 'Selecione um ingrediente e informe a quantidade', type: 'error' });
      return;
    }

    const ingredient: Ingredient = {
      id: Date.now().toString(),
      name: newIngredient.name,
      quantity: newIngredient.quantity,
      info: newIngredient.info
    };

    setIngredients(prev => [...prev, ingredient]);
    setNewIngredient({ name: '', quantity: '', info: '' });
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = async () => {
    if (!formData.name.trim()) {
      showToast({ message: 'Informe o nome do item', type: 'error' });
      return;
    }

    if (!formData.value.trim()) {
      showToast({ message: 'Informe o valor do item', type: 'error' });
      return;
    }

    const price = parseFloat(formData.value.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      showToast({ message: 'Valor inválido', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await productService.createProduct({
        name: formData.name.trim(),
        price,
        description: formData.additionalInfo.trim() || undefined,
      });

      showToast({ message: 'Item adicionado ao cardápio!', type: 'success' });
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      showToast({ message: error.response?.data?.message || 'Falha ao criar item', type: 'error' });
    } finally {
      setSubmitting(false);
    }
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
          <Text style={styles.headerTitle}>Adicionar Item</Text>
          <View style={styles.headerLine} />
        </View>

        <View style={styles.formSection}>
          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Nome do item"
                placeholderTextColor={theme.text + '80'}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, name: text }))
                }
              />
            </View>

            <TouchableOpacity
              style={styles.pickerContainer}
              activeOpacity={0.7}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text style={styles.pickerText}>
                {formData.category || 'Categoria'}
              </Text>
              <View style={styles.pickerIconContainer}>
                <ChevronDownIcon color={theme.text} size={20} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Valor do item"
                placeholderTextColor={theme.text + '80'}
                keyboardType="decimal-pad"
                value={formData.value}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, value: text }))
                }
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Serve quantas pessoas"
                placeholderTextColor={theme.text + '80'}
                keyboardType="number-pad"
                value={formData.serves}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, serves: text }))
                }
              />
            </View>

            <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={handlePickImage}
            >
                <CameraIcon style={styles.buttonIcon} color={formData.photo ? theme.contrast : theme.text} />
                <Text style={styles.buttonText}>{formData.photo ? "Foto Adicionada" : "Adicionar Foto"}</Text>
            </TouchableOpacity>
          </View>

          {/* Ingredient List */}
          {ingredients.map((item) => (
            <View key={item.id} style={styles.ingredientItem}>
              <View style={styles.ingredientQtyWrapper}>
                <Text style={styles.ingredientQtyText}>{item.quantity}</Text>
                <View style={styles.ingredientDivider} />
              </View>
              <View style={styles.ingredientContent}>
                <Text style={styles.ingredientNameText}>
                  {item.name} {item.info ? <Text style={styles.ingredientInfoText}>{item.info}</Text> : null}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeIngredient(item.id)}>
                <TrashIcon color={theme.contrast} size={20} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Ingredient Form */}
          <View style={styles.ingredientForm}>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.pickerContainer, { flex: 1.5 }]}
                activeOpacity={0.7}
                onPress={() => setIngredientModalVisible(true)}
              >
                <Text style={styles.pickerText}>
                  {newIngredient.name || 'Ingrediente'}
                </Text>
                <View style={styles.pickerIconContainer}>
                  <ChevronDownIcon color={theme.text} size={20} />
                </View>
              </TouchableOpacity>

              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Quantidade"
                  placeholderTextColor={theme.text + '80'}
                  value={newIngredient.quantity}
                  onChangeText={(text) =>
                    setNewIngredient(prev => ({ ...prev, quantity: text }))
                  }
                />
              </View>
            </View>

            <TextInput
              style={[styles.input, styles.ingredientInfoInput]}
              placeholder="Informações adicionais sobre o ingrediente"
              placeholderTextColor={theme.text + '80'}
              value={newIngredient.info}
              onChangeText={(text) =>
                setNewIngredient(prev => ({ ...prev, info: text }))
              }
            />

            <TouchableOpacity
              style={styles.addIngredientBtn}
              activeOpacity={0.7}
              onPress={handleAddIngredient}
            >
              <ClocheIcon color={theme.foreground} size={20} style={{ marginRight: 8 }} />
              <Text style={styles.addIngredientBtnText}>Adicionar Ingrediente</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Informações adicionais"
            placeholderTextColor={theme.text + '80'}
            multiline
            numberOfLines={4}
            value={formData.additionalInfo}
            onChangeText={(text) =>
              setFormData(prev => ({ ...prev, additionalInfo: text }))
            }
          />

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
            <MapPointIcon style={styles.buttonIcon} color={formData.hasRemovals ? theme.contrast : theme.text} />
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
            <FileTextIcon style={styles.buttonIcon} color={formData.hasAdditionals ? theme.contrast : theme.text} />
            <Text style={styles.buttonText}>Habilitar Adicionais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{...styles.button, ...styles.primaryButton}}
            activeOpacity={0.8}
            onPress={handleAddItem}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={theme.foreground} />
            ) : (
              <>
                <FoodStoreIcon style={styles.primaryButtonIcon}/>
                <Text style={styles.primaryButtonText}>Adicionar Item</Text>
              </>
            )}
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
    </View>
  );
}

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
    } as any,
    pickerContainer: {
      backgroundColor: theme.foreground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 100,
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
      color: theme.foreground,
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
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
      fontSize: 16,
      color: theme.foreground,
    },
    primaryButtonText: {
      color: theme.foreground,
      fontSize: 12,
      fontFamily: 'Jost_400Regular',
      fontWeight: '600',
    },
  });
}