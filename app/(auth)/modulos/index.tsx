import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore, ModuleItem } from '@/stores/DataStore';
import { UserHeader } from '@/components/shared/UserHeader';

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

export default observer(function ModulosIndexScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();

  const allModules = dataStore.modules || [];

  // Split into active (acquired) and available
  const activeModules = allModules.filter(m => m.acquired);
  const availableModules = allModules.filter(m => !m.acquired);

  const handleModuleClick = (module: ModuleItem) => {
    router.push(`/(auth)/modulos/${module.id}` as any);
  };

  const renderModuleCard = (module: ModuleItem) => {
    const icon = MODULE_ICONS[module.icon] || '🧩';
    return (
      <TouchableOpacity 
        key={module.id} 
        style={[styles.moduleCard, { backgroundColor: theme.foreground }]}
        onPress={() => handleModuleClick(module)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
          {module.acquired ? (
            <View style={[styles.statusBadge, { backgroundColor: '#10B98122' }]}>
              <Text style={[styles.statusText, { color: '#10B981' }]}>Ativo</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: theme.contrast + '15' }]}>
              <Text style={[styles.statusText, { color: theme.contrast }]}>Adquirir</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.moduleName, { color: theme.text }]} numberOfLines={1}>{module.name}</Text>
          <Text style={[styles.moduleDesc, { color: theme.text }]} numberOfLines={2}>{module.description}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={[styles.priceLabel, { color: theme.text }]}>Mensalidade</Text>
          <Text style={[styles.priceValue, { color: theme.contrast }]}>
            {module.price === 0 ? 'Grátis' : `R$ ${module.price.toFixed(2).replace('.', ',')}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {!isWeb && <UserHeader />}

      {/* Header switches */}
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Módulos Almocu</Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>Turbine seu restaurante ativando ferramentas adicionais sob demanda.</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.gerenciarBtn, { backgroundColor: theme.contrast }]} 
          onPress={() => router.push('/(auth)/modulos/gerenciar' as any)}
        >
          <Text style={styles.gerenciarBtnText}>Gerenciar Abas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Active Modules */}
        <Text style={styles.sectionTitle}>Meus Módulos Ativos ({activeModules.length})</Text>
        <View style={styles.grid}>
          {activeModules.map(renderModuleCard)}
        </View>

        {/* Available Modules */}
        <Text style={styles.sectionTitle}>Módulos Disponíveis para Compra ({availableModules.length})</Text>
        {availableModules.length > 0 ? (
          <View style={styles.grid}>
            {availableModules.map(renderModuleCard)}
          </View>
        ) : (
          <View style={styles.congratsCard}>
            <Text style={styles.congratsEmoji}>🎉</Text>
            <Text style={[styles.congratsText, { color: theme.text }]}>Você possui todos os módulos disponíveis contratados!</Text>
          </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
  },
  subtitle: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  gerenciarBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  gerenciarBtnText: {
    fontFamily: 'Jost_700Bold',
    color: '#FFFFFF',
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
    marginTop: 16,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  moduleCard: {
    width: '100%',
    maxWidth: 290,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#9CA3AF15',
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  statusText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 11,
  },
  cardContent: {
    marginBottom: 16,
  },
  moduleName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  moduleDesc: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    opacity: 0.55,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#9CA3AF22',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    opacity: 0.5,
  },
  priceValue: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  congratsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#9CA3AF44',
    opacity: 0.8,
  },
  congratsEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  congratsText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
  },
});
