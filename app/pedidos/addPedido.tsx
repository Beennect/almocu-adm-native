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
} from '../../components/shared/Icons';

export default function AddPedidoScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();

  return (
    <View 
      className="flex-1"
      style={{ 
        backgroundColor: theme.background,
        paddingTop: isWeb ? 8 : 5,
        paddingHorizontal: isWeb ? 8 : 4,
      }}
    >
      <View className="flex-row items-center mb-8">
        <Text 
          className="font-jost-semibold text-sm mr-3"
          style={{ color: theme.text, opacity: 0.6 }}
        >
          Sobre o pedido
        </Text>
        <View 
          className="flex-1 h-px"
          style={{ backgroundColor: theme.background }}
        />
      </View>

      <View className="flex-row gap-3 items-center flex-wrap mb-4">
        <View className="flex-1 min-w-[140px]">
          <TextInput
            className="rounded-2xl px-4 py-3.5 text-sm font-jost"
            style={{ 
              backgroundColor: theme.foreground,
              color: theme.text,
              outlineStyle: 'none'
            }}
            placeholder="Nome do cliente"
            placeholderTextColor={theme.text + '80'}
          />
        </View>

        <TouchableOpacity 
          className="rounded-2xl px-4 py-3.5 flex-row items-center justify-between min-w-[100px]"
          style={{ backgroundColor: theme.foreground }}
          activeOpacity={0.7}
        >
          <Text className="text-sm font-jost" style={{ color: theme.text, marginRight: 2 }}>
            Mesa
          </Text>
          <View className="ml-1">
            <ChevronDownIcon color={theme.text} size={20} />
          </View>
        </TouchableOpacity>
      </View>

      <View 
        className="flex-row items-center rounded-3xl p-4 mb-6 shadow-sm"
        style={{ backgroundColor: theme.foreground }}
      >
        <View className="flex-1 pr-3">
          <Text className="font-jost-bold text-base mb-1" style={{ color: theme.text }}>
            Canoa Sushi Grande
          </Text>
          <Text 
            className="font-jost text-sm mb-2 leading-[18px]"
            numberOfLines={2}
            style={{ color: theme.text, opacity: 0.6 }}
          >
            30 Unidades de sushi contendo 6 camarões crocantes, 6 niguiri de salmão, 6 urama...
          </Text>
          <Text className="font-jost-bold text-base" style={{ color: theme.text }}>
            R$ 140,00
          </Text>
        </View>

        <View 
          className="w-px h-3/5"
          style={{ 
            borderLeftWidth: 1,
            borderColor: theme.background,
            borderStyle: 'dashed'
          }}
        />

        <View className="flex-row items-center gap-4 px-4">
          <TouchableOpacity className="w-7 h-7 items-center justify-center">
            <MinusIcon color={theme.contrast} size={16} />
          </TouchableOpacity>
          <Text className="font-jost-bold text-lg text-center w-6" style={{ color: theme.text }}>
            01
          </Text>
          <TouchableOpacity className="w-7 h-7 items-center justify-center">
            <PlusIcon color={theme.text} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        className="flex-row items-center rounded-2xl h-16 px-6 mb-10"
        style={{ backgroundColor: theme.foreground }}
        activeOpacity={0.7}
      >
        <Text 
          className="flex-1 font-jost-semibold text-base"
          style={{ color: theme.text, opacity: 0.5 }}
        >
          Adicionar item ao pedido
        </Text>
        <View 
          className="w-px h-2/5 mx-3"
          style={{ 
            borderLeftWidth: 1,
            borderColor: theme.background,
            borderStyle: 'dashed'
          }}
        />
        <ChevronDownIcon color={theme.text} opacity={0.5} size={20} />
      </TouchableOpacity>

      <View 
        className="h-px mb-10"
        style={{ backgroundColor: theme.background }}
      />

      <View className="flex-row gap-3 flex-wrap">
        <TouchableOpacity 
          className="flex-1 grow min-w-[140px] rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2 border"
          style={{ 
            backgroundColor: theme.foreground,
            borderColor: 'transparent'
          }}
        >
          <AddEnderecoIcon color={theme.text} style={{ fontSize: 18 }} />
          <Text className="text-xs font-jost font-[500]" style={{ color: theme.text }}>
            Adicionar Endereço
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-1 grow min-w-[140px] rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2 border"
          style={{ 
            backgroundColor: theme.foreground,
            borderColor: 'transparent'
          }}
        >
          <InfoAdicionaisIcon color={theme.text} style={{ fontSize: 18 }} />
          <Text className="text-xs font-jost font-[500]" style={{ color: theme.text }}>
            Informações Adicionais
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-1 grow min-w-[140px] rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2"
          style={{ backgroundColor: theme.contrast }}
        >
          <FinalizarPedidoIcon color={theme.foreground} style={{ fontSize: 16 }} />
          <Text className="text-xs font-jost font-[600] text-white">
            Finalizar Pedido
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
