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

  const buttonClass = `flex-grow ${isWeb ? 'flex-1 min-w-0' : 'min-w-[140px]'} bg-foreground rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 border border-transparent`;
  const activeBtnClass = "bg-contrast/20 border-contrast";

  return (
    <View className={`flex-1 bg-background ${isWeb ? 'pt-8 px-8' : 'pt-5 px-4'}`}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-8">
          <Text className="font-[Jost_600SemiBold] text-sm text-text opacity-60 mr-3">Adicionar Item</Text>
          <View className="flex-1 h-[1px] bg-background" />
        </View>

        {/* Form Section */}
        <View className="mb-6 gap-4">
          {/* Row 1: Name and Category */}
          <View className="flex-row gap-3 items-center flex-wrap">
            <View className="flex-1 min-w-[140px]">
              <TextInput
                className="bg-foreground rounded-[16px] px-4 py-3.5 text-text text-sm font-[Jost_400Regular] outline-none"
                placeholder="Nome do item"
                placeholderTextColor={theme.text + '80'}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, name: text }))
                }
              />
            </View>

            <TouchableOpacity
              className="bg-foreground rounded-[16px] px-4 py-3.5 flex-row items-center justify-between min-w-[100px]"
              activeOpacity={0.7}
            >
              <Text className="text-text text-sm font-[Jost_400Regular] mr-2">
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
                className="bg-foreground rounded-[16px] px-4 py-3.5 text-text text-sm font-[Jost_400Regular] outline-none"
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
                className="bg-foreground rounded-[16px] px-4 py-3.5 text-text text-sm font-[Jost_400Regular] outline-none"
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
                className={buttonClass}
                activeOpacity={0.7}
                onPress={() => setFormData(prev => ({ ...prev, photo: !prev.photo }))}
            >
                <CameraIcon color={theme.text} size={18} />
                <Text className="text-text text-sm font-[Jost_400Regular] font-medium">Adicionar Foto</Text>
            </TouchableOpacity>
          </View>

          {/* Add Ingredient Button */}
          <TouchableOpacity
            className={buttonClass}
            activeOpacity={0.7}
          >
            <ClocheIcon color={theme.text} size={18} />
            <Text className="text-text text-sm font-[Jost_400Regular] font-medium">Adicionar Ingrediente</Text>
          </TouchableOpacity>

          {/* Additional Info */}
          <TextInput
            className="bg-foreground rounded-[16px] px-4 py-3.5 text-text text-sm font-[Jost_400Regular] min-h-[120px]"
            style={{ textAlignVertical: 'top' }}
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
          <View className="h-[1px] bg-text/20 my-2" />
        </View>

        {/* Footer Buttons */}
        <View className="flex-row gap-3 mt-6 flex-wrap">
          <TouchableOpacity
            className={`${buttonClass} ${formData.hasRemovals ? activeBtnClass : ""}`}
            activeOpacity={0.7}
            onPress={() => toggleFeature('hasRemovals')}
          >
            <MapPointIcon color={theme.text} size={18} />
            <Text className="text-text text-sm font-[Jost_400Regular] font-medium">Habilitar Remoções</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`${buttonClass} ${formData.hasAdditionals ? activeBtnClass : ""}`}
            activeOpacity={0.7}
            onPress={() => toggleFeature('hasAdditionals')}
          >
            <FileTextIcon color={theme.text} size={18} />
            <Text className="text-text text-sm font-[Jost_400Regular] font-medium">Habilitar Adicionais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`${buttonClass} bg-contrast`}
            activeOpacity={0.8}
            onPress={handleAddItem}
          >
            <FoodStoreIcon color={theme.foreground} size={16} />
            <Text className="text-foreground text-[12px] font-[Jost_400Regular] font-semibold">Adicionar Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}