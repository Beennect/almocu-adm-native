import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore, ModuleItem } from '@/stores/DataStore';
import { toastStore } from '@/stores/ToastStore';
import { ChevronLeftIcon } from '@/components/shared/Icons';

// Mapping icons by name
const MODULE_ICONS: Record<string, string> = {
  DashboardIcon: '📊',
  CardapioIcon: '🍔',
  BagIcon: '🛍️',
  ClocheIcon: '📦',
  FileTextIcon: '💵',
  ShieldCheckIcon: '🛡️',
  PinIcon: '📍',
  FoodStoreIcon: '🌐',
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
      toastStore.show('Módulos principais não podem ser ocultados da navegação.', 'error');
      return;
    }

    dataStore.toggleModuleNavbar(module.id, value);
    toastStore.show(
      value 
        ? `Atalho "${module.name}" adicionado à barra de navegação!` 
        : `Atalho "${module.name}" removido da barra de navegação!`, 
      'success'
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(auth)/modulos' as any)}>
          <ChevronLeftIcon color={theme.text} size={24} />
          <Text style={[styles.backText, { color: theme.text }]}>Módulos</Text>
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
            const icon = MODULE_ICONS[module.icon] || '🧩';
            const isCore = ['dashboard', 'cardapio', 'pedidos'].includes(module.id);

            return (
              <View key={module.id} style={[styles.itemCard, { backgroundColor: theme.foreground }]}>
                <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                  <Text style={styles.iconText}>{icon}</Text>
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
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
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
