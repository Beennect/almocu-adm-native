import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore, ModuleItem } from '@/stores/DataStore';
import { permissionStore } from '@/stores/PermissionStore';
import Toast from 'react-native-toast-message';
import {
  BagIcon,
  CardapioIcon,
  ChevronLeftIcon,
  ClocheIcon,
  DashboardIcon,
  ModulesIcon,
  FileTextIcon,
  FoodStoreIcon,
  TruckIcon,
  UsersIcon,
} from '@/components/shared/Icons';

const MODULE_ICONS: Record<string, React.FC<any>> = {
  DashboardIcon,
  CardapioIcon,
  BagIcon,
  ClocheIcon,
  FileTextIcon,
  FoodStoreIcon,
  TruckIcon,
  UsersIcon,
};

export default observer(function ModulosGerenciarScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();

  const allModules = dataStore.modules || [];
  const acquiredModules = allModules.filter(m => m.acquired);

  const handleToggle = (module: ModuleItem, value: boolean) => {
    // Prevent hiding core pages to keep layout stable
    if (['dashboard', 'cardapio', 'pedidos'].includes(module.id)) {
      Toast.show({ type: 'error', text1: 'Módulos principais não podem ser ocultados da navegação.' });
      return;
    }

    Toast.show({ type: 'info', text1: 'Salvando...' });
    dataStore.toggleModuleNavbar(module.id, value);
    Toast.show({
      type: 'success',
      text1: value
        ? `Atalho "${module.name}" adicionado!`
        : `Atalho "${module.name}" removido!`
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(auth)/config' as any)}>
          <ChevronLeftIcon color={theme.text} size={24} />
          <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Gerenciar Abas</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        { paddingBottom: 40 },
        isWeb && { maxWidth: 600, width: '100%', alignSelf: 'center' }
      ]}>

        <Text style={[styles.title, { color: theme.text }]}>Personalizar Atalhos</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Escolha quais ferramentas ativas aparecerão como guias principais no seu painel ou barra inferior do celular.
        </Text>

        <View style={styles.list}>
          {acquiredModules.map((module) => {
            const Icon = MODULE_ICONS[module.icon] || ModulesIcon;
            const isCore = ['dashboard', 'cardapio', 'pedidos'].includes(module.id);

            return (
              <View key={module.id} style={[styles.itemCard, { backgroundColor: theme.foreground }]}>
                <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                  <Icon color={theme.text} size={20} />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{module.name}</Text>
                  <Text style={[styles.desc, { color: theme.text }]}>
                    {isCore ? 'Item obrigatório do sistema' : 'Exibir na barra de navegação'}
                  </Text>
                </View>

                <Switch
                  value={module.showInNavbar}
                  disabled={isCore}
                  onValueChange={(val) => handleToggle(module, val)}
                  trackColor={{ false: theme.background, true: theme.contrast }}
                  thumbColor="#FFFFFF"
                />
              </View>
            );
          })}
        </View>

          {/* Link para loja de módulos — apenas GERENTE */}
          {permissionStore.can('modules-store:view') && (
            <TouchableOpacity
              style={[styles.storeLink, { backgroundColor: theme.foreground }]}
              onPress={() => router.push('/(auth)/modulos' as any)}
            >
              <ModulesIcon color={theme.contrast} size={20} />
              <Text style={[styles.storeLinkText, { color: theme.contrast }]}>
                Ver todos os módulos disponíveis
              </Text>
            </TouchableOpacity>
          )}
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
    marginBottom: 24,
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
  title: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    opacity: 0.55,
    lineHeight: 20,
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#9CA3AF15',
  },
  storeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#9CA3AF15',
  },
  storeLinkText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
  },
  desc: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 1,
  },
});
