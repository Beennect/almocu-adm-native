import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { ChevronLeftIcon, FoodStoreIcon, PinIcon } from '@/components/shared/Icons';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';

export default observer(function RestauranteScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();

  const details = dataStore.restaurantDetails;

  // Form states loaded from DataStore
  const [nome, setNome] = useState(details?.name || '');
  const [cnpj, setCnpj] = useState(details?.cnpj || '');
  const [telefone, setTelefone] = useState(details?.phone || '');
  const [categoria, setCategoria] = useState(details?.category || '');
  const [endereco, setEndereco] = useState(details?.address || '');
  const [taxaEntrega, setTaxaEntrega] = useState(details?.deliveryFee?.toString() || '0.00');
  const [funcionamento, setFuncionamento] = useState(details?.operatingHours || '');

  const [loading, setLoading] = useState(false);

  const maskCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const handleCnpjChange = (value: string) => {
    setCnpj(maskCnpj(value));
  };

  const handleSave = () => {
    if (!nome || !cnpj || !telefone || !categoria || !endereco || !funcionamento) {
      Toast.show({ type: 'error', text1: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!cnpjRegex.test(cnpj)) {
      Toast.show({ type: 'error', text1: 'CNPJ inválido. Use o formato: 00.000.000/0000-00' });
      return;
    }

    const parsedFee = parseFloat(taxaEntrega.replace(',', '.'));
    if (isNaN(parsedFee)) {
      Toast.show({ type: 'error', text1: 'Insira um valor de taxa de entrega válido.' });
      return;
    }

    Toast.show({ type: 'info', text1: 'Salvando...' });
    setLoading(true);

    try {
      dataStore.updateRestaurantDetails({
        name: nome,
        cnpj,
        phone: telefone,
        category: categoria,
        address: endereco,
        deliveryFee: parsedFee,
        operatingHours: funcionamento,
      });

      Toast.show({ type: 'success', text1: 'Informações do restaurante salvas com sucesso!' });
      router.push('/(auth)/config' as any);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Erro ao salvar as informações.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeftIcon color={theme.text} size={24} />
          <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Meu Restaurante</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        { paddingBottom: 40 },
        isWeb && { maxWidth: 550, width: '100%', alignSelf: 'center' }
      ]}>

        {/* Media Block (Banner and Logo dummy representation) */}
        <View style={[styles.mediaCard, { backgroundColor: theme.foreground }]}>
          <View style={[styles.bannerDummy, { backgroundColor: theme.contrast + '20' }]}>
            <Text style={[styles.cameraText, { color: theme.contrast }]}>📷 Alterar Banner de Fundo</Text>
          </View>
          <View style={styles.logoRow}>
            <View style={[styles.logoDummy, { backgroundColor: theme.contrast, borderColor: theme.foreground }]}>
              <Text style={styles.logoDummyText}>🍽️</Text>
            </View>
            <TouchableOpacity style={styles.logoBtn}>
              <Text style={[styles.logoBtnText, { color: theme.text }]}>Alterar Logotipo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Basic Details */}
        <View style={[styles.card, { backgroundColor: theme.foreground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Identidade da Marca</Text>
          <Text style={[styles.cardDesc, { color: theme.text }]}>Dados que serão apresentados aos seus clientes no cardápio online.</Text>
          
          <View style={styles.inputGroup}>
            <FormInput
              Icon={FoodStoreIcon}
              placeholder="Nome Fantasia do Restaurante"
              value={nome}
              onChangeText={setNome}
            />
            <FormInput
              Icon={FoodStoreIcon}
              placeholder="Categoria (ex: Pizzaria, Hamburgueria, Italiana)"
              value={categoria}
              onChangeText={setCategoria}
            />
          </View>
        </View>

        {/* Register Details */}
        <View style={[styles.card, { backgroundColor: theme.foreground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Dados de Cadastro & Contato</Text>
          
          <View style={styles.inputGroup}>
            <FormInput
              placeholder="CNPJ do Estabelecimento (00.000.000/0000-00)"
              keyboardType="numeric"
              maxLength={18}
              value={cnpj}
              onChangeText={handleCnpjChange}
            />
            <FormInput
              placeholder="Telefone Comercial / WhatsApp"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={setTelefone}
            />
            <FormInput
              Icon={PinIcon}
              placeholder="Endereço Comercial Completo"
              value={endereco}
              onChangeText={setEndereco}
            />
          </View>
        </View>

        {/* Operations Details */}
        <View style={[styles.card, { backgroundColor: theme.foreground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Operação & Entrega</Text>
          <Text style={[styles.cardDesc, { color: theme.text }]}>Configure as regras de atendimento padrão e taxas.</Text>
          
          <View style={styles.inputGroup}>
            <FormInput
              placeholder="Taxa de Entrega padrão (R$)"
              keyboardType="numeric"
              value={taxaEntrega}
              onChangeText={setTaxaEntrega}
            />
            <FormInput
              placeholder="Horário de Funcionamento (ex: Terça a Domingo: 18h às 23h)"
              value={funcionamento}
              onChangeText={setFuncionamento}
            />
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <FormButton
            title={loading ? 'SALVANDO...' : 'SALVAR INFORMAÇÕES'}
            variant="primary"
            onPress={handleSave}
            disabled={loading}
          />
        </View>

      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  backText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 15,
  },
  headerTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  mediaCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerDummy: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    marginTop: -30,
  },
  logoDummy: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDummyText: {
    fontSize: 28,
  },
  logoBtn: {
    alignSelf: 'flex-end',
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#9CA3AF22',
    borderRadius: 10,
  },
  logoBtnText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 12,
    opacity: 0.8,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    opacity: 0.5,
    marginBottom: 16,
  },
  inputGroup: {
    gap: 2,
  },
});
