import { useAppTheme } from '@/themes/colors';
import React, { useState } from 'react';
import {
  ScrollView,
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
} from '../../components/shared/Icons';

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
    <View 
      className="flex-1"
      style={{ 
        backgroundColor: theme.background,
        paddingTop: isWeb ? 8 : 5,
        paddingHorizontal: isWeb ? 8 : 4,
      }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-8">
          <Text 
            className="font-jost-semibold text-sm mr-3"
            style={{ color: theme.text, opacity: 0.6 }}
          >
            Adicionar Item
          </Text>
          <View 
            className="flex-1 h-px"
            style={{ backgroundColor: theme.background }}
          />
        </View>

        {/* Form Section */}
        <View className="mb-6 gap-4">
          {/* Row 1: Name and Category */}
          <View className="flex-row gap-3 items-center flex-wrap">
            <View className="flex-1 min-w-[140px]">
              <TextInput
                className="rounded-2xl px-4 py-3.5 text-sm font-jost"
                style={{ 
                  backgroundColor: theme.foreground,
                  color: theme.text,
                  outlineStyle: 'none'
                }}
                placeholder="Nome do item"
                placeholderTextColor={theme.text + '80'}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, name: text }))
                }
              />
            </View>

            <TouchableOpacity
              className="rounded-2xl px-4 py-3.5 flex-row items-center justify-between min-w-[100px]"
              style={{ backgroundColor: theme.foreground }}
              activeOpacity={0.7}
            >
              <Text className="text-sm font-jost mr-2" style={{ color: theme.text }}>
                {formData.category || 'Categoria'}
              </Text>
              <View className="ml-1">
                <ChevronDownIcon color={theme.text} size={20} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2: Value and Serves */}
          <View className="flex-row gap-3 items-center flex-wrap">
            <View className="flex-1 min-w-[140px]">
              <TextInput
                className="rounded-2xl px-4 py-3.5 text-sm font-jost"
                style={{ 
                  backgroundColor: theme.foreground,
                  color: theme.text,
                  outlineStyle: 'none'
                }}
                placeholder="Valor do item"
                placeholderTextColor={theme.text + '80'}
                keyboardType="decimal-pad"
                value={formData.value}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, value: text }))
                }
              />
            </View>

            <View className="flex-1 min-w-[140px]">
              <TextInput
                className="rounded-2xl px-4 py-3.5 text-sm font-jost"
                style={{ 
                  backgroundColor: theme.foreground,
                  color: theme.text,
                  outlineStyle: 'none'
                }}
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
                className={`flex-1 grow min-w-[140px] rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 border ${
                  isWeb ? '' : ''
                }`}
                style={{ 
                  backgroundColor: theme.foreground,
                  borderColor: 'transparent'
                }}
                activeOpacity={0.7}
                onPress={() => setFormData(prev => ({ ...prev, photo: !prev.photo }))}
            >
                <CameraIcon style={{ fontSize: 18, color: theme.text }} />
                <Text className="text-xs font-jost font-[500]" style={{ color: theme.text }}>
                  Adicionar Foto
                </Text>
            </TouchableOpacity>
          </View>

          {/* Add Ingredient Button */}
          <TouchableOpacity
            className={`flex-1 grow min-w-[140px] rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 border ${
              isWeb ? '' : ''
            }`}
            style={{ 
              backgroundColor: theme.foreground,
              borderColor: 'transparent'
            }}
            activeOpacity={0.7}
          >
            <ClocheIcon style={{ fontSize: 18, color: theme.text }}/>
            <Text className="text-xs font-jost font-[500]" style={{ color: theme.text }}>
              Adicionar Ingrediente
            </Text>
          </TouchableOpacity>

          {/* Additional Info */}
          <TextInput
            className="rounded-2xl px-4 py-3.5 text-sm font-jost"
            style={{ 
              backgroundColor: theme.foreground,
              color: theme.text,
              outlineStyle: 'none',
              minHeight: 120,
              textAlignVertical: 'top'
            }}
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
          <View 
            className="h-px my-2"
            style={{ backgroundColor: theme.text + '20' }}
          />
        </View>

        {/* Footer Buttons */}
        <View className="flex-row gap-3 flex-wrap">
          <TouchableOpacity
            className={`flex-1 grow min-w-[140px] rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 border`}
            style={{
              backgroundColor: formData.hasRemovals ? (theme.contrast + '20') : theme.foreground,
              borderColor: formData.hasRemovals ? theme.contrast : 'transparent'
            }}
            activeOpacity={0.7}
            onPress={() => toggleFeature('hasRemovals')}
          >
            <MapPointIcon style={{ fontSize: 18, color: theme.text }}/>
            <Text className="text-xs font-jost font-[500]" style={{ color: theme.text }}>
              Habilitar Remoções
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 grow min-w-[140px] rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 border`}
            style={{
              backgroundColor: formData.hasAdditionals ? (theme.contrast + '20') : theme.foreground,
              borderColor: formData.hasAdditionals ? theme.contrast : 'transparent'
            }}
            activeOpacity={0.7}
            onPress={() => toggleFeature('hasAdditionals')}
          >
            <FileTextIcon style={{ fontSize: 18, color: theme.text }}/>
            <Text className="text-xs font-jost font-[500]" style={{ color: theme.text }}>
              Habilitar Adicionais
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 grow min-w-[140px] rounded-xl px-4 py-3 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: theme.contrast }}
            activeOpacity={0.8}
            onPress={handleAddItem}
          >
            <FoodStoreIcon style={{ fontSize: 16, color: theme.foreground }}/>
            <Text className="text-xs font-jost font-[600] text-white">
              Adicionar Item
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}