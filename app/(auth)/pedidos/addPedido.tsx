import { useAppTheme } from '@/themes/colors';
import React from 'react';
import { Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { 
  AddEnderecoIcon, 
  ChevronDownIcon, 
  FinalizarPedidoIcon, 
  InfoAdicionaisIcon, 
  MinusIcon, 
  PlusIcon 
} from '../../../components/shared/Icons';

export default function AddPedidoScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();

  return (
    <View className={`flex-1 bg-background ${isWeb ? 'pt-8 px-8' : 'pt-5 px-4'}`}>
      <View className="flex-row items-center mb-8">
        <Text className="font-[Jost_600SemiBold] text-sm text-text opacity-60 mr-3">Sobre o pedido</Text>
        <View className="flex-1 h-[1px] bg-background" />
      </View>

      <View className="flex-row gap-3 items-center flex-wrap mb-4">
        <View className="flex-1 min-w-[140px]">
          <TextInput
            className="bg-foreground rounded-[16px] px-4 py-3.5 text-text text-sm font-[Jost_400Regular] outline-none"
            placeholder="Nome do cliente"
            placeholderTextColor={theme.text + '80'}
          />
        </View>

        <TouchableOpacity className="bg-foreground rounded-[16px] px-4 py-3.5 flex-row items-center justify-between min-w-[100px]" activeOpacity={0.7}>
          <Text className="text-text text-sm font-[Jost_400Regular] mr-2">Mesa</Text>
          <View className="ml-1">
            <ChevronDownIcon color={theme.text} size={20} />
          </View>
        </TouchableOpacity>
      </View>

      <View className="bg-foreground rounded-[24px] flex-row items-center p-4 mb-6 shadow-sm elevation-2">
        <View className="flex-1 pr-3">
          <Text className="font-[Jost_700Bold] text-base text-text">Canoa Sushi Grande</Text>
          <Text className="font-[Jost_600SemiBold] text-[13px] text-text opacity-60 my-1.5 leading-[18px]" numberOfLines={2}>
            30 Unidades de sushi contendo 6 camarões crocantes, 6 niguiri de salmão, 6 urama...
          </Text>
          <Text className="font-[Jost_700Bold] text-base text-text">R$ 140,00</Text>
        </View>

        <View 
          className="w-[1px] h-3/5" 
          style={{ borderLeftWidth: 1, borderColor: theme.background, borderStyle: 'dashed' }} 
        />

        <View className="flex-row items-center px-4 gap-4">
          <TouchableOpacity className="w-7 h-7 items-center justify-center">
            <MinusIcon color={theme.contrast} size={16} />
          </TouchableOpacity>
          <Text className="font-[Jost_700Bold] text-lg text-text min-w-[24px] text-center">01</Text>
          <TouchableOpacity className="w-7 h-7 items-center justify-center">
            <PlusIcon color={theme.text} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity className="bg-foreground rounded-[16px] h-16 flex-row items-center px-6 mb-10" activeOpacity={0.7}>
        <Text className="flex-1 font-[Jost_600SemiBold] text-base text-text opacity-50">Adicionar item ao pedido</Text>
        <View 
          className="w-[1px] h-2/5 mx-3" 
          style={{ borderLeftWidth: 1, borderColor: theme.background, borderStyle: 'dashed' }} 
        />
        <ChevronDownIcon color={theme.text} opacity={0.5} size={20} />
      </TouchableOpacity>

      <View className="h-[1px] bg-background mb-10" />

      <View className="flex-row gap-3 mt-6 flex-wrap">
        <TouchableOpacity className={`flex-grow ${isWeb ? 'flex-1 min-w-0' : 'min-w-[140px]'} bg-foreground rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 border border-transparent`}>
          <AddEnderecoIcon color={theme.text} size={18} />
          <Text className="text-text text-[12px] font-[Jost_400Regular] font-medium">Adicionar Endereço</Text>
        </TouchableOpacity>

        <TouchableOpacity className={`flex-grow ${isWeb ? 'flex-1 min-w-0' : 'min-w-[140px]'} bg-foreground rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 border border-transparent`}>
          <InfoAdicionaisIcon color={theme.text} size={18} />
          <Text className="text-text text-[12px] font-[Jost_400Regular] font-medium">Informações Adicionais</Text>
        </TouchableOpacity>

        <TouchableOpacity className={`flex-grow ${isWeb ? 'flex-1 min-w-0' : 'min-w-[140px]'} bg-contrast rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 border border-transparent`}>
          <FinalizarPedidoIcon color={theme.foreground} size={16} />
          <Text className="text-foreground text-[12px] font-[Jost_400Regular] font-semibold">Finalizar Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
