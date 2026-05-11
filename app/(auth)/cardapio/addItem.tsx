import { useAppTheme } from '@/themes/colors';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  CameraIcon,
  ChevronDownIcon,
  ClocheIcon,
  FileTextIcon,
  FoodStoreIcon,
  MapPointIcon
} from '../../../components/shared/Icons';

interface AddItemFormData {
  name: string;
  category: string;
  value: string;
  serves: string;
  additionalInfo: string;
  hasRemovals: boolean;
  hasAdditionals: boolean;
  photo: boolean;
}

export default function AddItemScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const styles = makeStyles(theme, isWeb);

  const [formData, setFormData] = useState<AddItemFormData>({
    name: '',
    category: '',
    value: '',
    serves: '',
    additionalInfo: '',
    hasRemovals: false,
    hasAdditionals: false,
    photo: false,
  });

  const handleAddItem = () => {
    console.log('Item adicionado:', formData);
    // TODO: Integrar com API
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Adicionar Item</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Row 1: Name and Category */}
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
            >
              <Text style={styles.pickerText}>
                {formData.category || 'Categoria'}
              </Text>
              <View style={styles.pickerIconContainer}>
                <ChevronDownIcon color={theme.text} size={20} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2: Value and Serves */}
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
            {/* Photo Button */}
            <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => setFormData(prev => ({ ...prev, photo: !prev.photo }))}
            >
                <CameraIcon style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Adicionar Foto</Text>
            </TouchableOpacity>
          </View>

          {/* Add Ingredient Button */}
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
          >
            <ClocheIcon style={styles.buttonIcon}/>
            <Text style={styles.buttonText}>Adicionar Ingrediente</Text>
          </TouchableOpacity>

          {/* Additional Info */}
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

          {/* Divider */}
          <View style={styles.divider} />
        </View>

        {/* Footer Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              formData.hasRemovals && styles.buttonActive,
            ]}
            activeOpacity={0.7}
            onPress={() => toggleFeature('hasRemovals')}
          >
            <MapPointIcon style={styles.buttonIcon}/>
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
            <FileTextIcon style={styles.buttonIcon}/>
            <Text style={styles.buttonText}>Habilitar Adicionais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{...styles.button, ...styles.primaryButton}}
            activeOpacity={0.8}
            onPress={handleAddItem}
          >
            <FoodStoreIcon style={styles.primaryButtonIcon}/>
            <Text style={styles.primaryButtonText}>Adicionar Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    },
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
      backgroundColor: theme.contrast + '20',
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