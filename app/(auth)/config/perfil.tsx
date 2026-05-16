import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { authStore } from '@/stores/AuthStore';
import { dataStore } from '@/stores/DataStore';
import { ChevronLeftIcon, UserIcon } from '@/components/shared/Icons';

export default observer(function PerfilScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();

  const userName = authStore.user?.name || 'Administrador';
  const userEmail = authStore.user?.email || 'admin@almocu.com.br';

  const activeBranchName = dataStore.branches[0]?.name || 'Filial Principal';
  
  // Simulated subscription statistics
  const menuLimit = 50;
  const currentMenuItems = dataStore.menuItems.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(auth)/config' as any)}>
          <ChevronLeftIcon color={theme.text} size={24} />
          <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Meu Perfil</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        { paddingBottom: 40 },
        isWeb && { maxWidth: 600, width: '100%', alignSelf: 'center' }
      ]}>
        
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.foreground }]}>
          <View style={[styles.avatar, { backgroundColor: theme.contrast }]}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: theme.text }]}>{userName}</Text>
            <Text style={[styles.profileEmail, { color: theme.text }]}>{userEmail}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.contrast + '20' }]}>
            <Text style={[styles.badgeText, { color: theme.contrast }]}>Proprietário</Text>
          </View>
        </View>

        {/* Subscription / Plan Card */}
        <Text style={styles.sectionTitle}>Plano & Limites</Text>
        <View style={[styles.planCard, { backgroundColor: theme.foreground }]}>
          <View style={styles.planHeader}>
            <View>
              <Text style={[styles.planSub, { color: theme.text }]}>Plano Ativo</Text>
              <Text style={[styles.planName, { color: theme.contrast }]}>PROFISSIONAL ADM</Text>
            </View>
            <Text style={[styles.planPrice, { color: theme.text }]}>R$ 89,90/mês</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.limitRow}>
            <View style={styles.limitInfo}>
              <Text style={[styles.limitLabel, { color: theme.text }]}>Itens de Cardápio</Text>
              <Text style={[styles.limitVal, { color: theme.text }]}>{currentMenuItems} / {menuLimit}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { backgroundColor: theme.contrast, width: `${(currentMenuItems/menuLimit)*100}%` }]} />
            </View>
          </View>

          <View style={styles.limitRow}>
            <View style={styles.limitInfo}>
              <Text style={[styles.limitLabel, { color: theme.text }]}>Filiais Cadastradas</Text>
              <Text style={[styles.limitVal, { color: theme.text }]}>{dataStore.branches.length} / 5</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { backgroundColor: theme.contrast, width: `${(dataStore.branches.length/5)*100}%` }]} />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.upgradeBtn, { backgroundColor: theme.contrast }]} 
            onPress={() => router.push('/(auth)/modulos' as any)}
          >
            <Text style={styles.upgradeBtnText}>Fazer Upgrade de Plano</Text>
          </TouchableOpacity>
        </View>

        {/* Info & Security Logs */}
        <Text style={styles.sectionTitle}>Segurança & Auditoria</Text>
        <View style={[styles.logsCard, { backgroundColor: theme.foreground }]}>
          <View style={styles.logItem}>
            <Text style={[styles.logDot, { backgroundColor: '#10B981' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.logText, { color: theme.text }]}>Sessão de login iniciada com sucesso</Text>
              <Text style={[styles.logTime, { color: theme.text }]}>Hoje às 11:32 • IP 179.189.45.2</Text>
            </View>
          </View>
          
          <View style={styles.logDivider} />

          <View style={styles.logItem}>
            <Text style={[styles.logDot, { backgroundColor: theme.contrast }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.logText, { color: theme.text }]}>Filial atual alterada para: {activeBranchName}</Text>
              <Text style={[styles.logTime, { color: theme.text }]}>Ontem às 18:45 • Almocu Web</Text>
            </View>
          </View>

          <View style={styles.logDivider} />

          <View style={styles.logItem}>
            <Text style={[styles.logDot, { backgroundColor: '#3B82F6' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.logText, { color: theme.text }]}>Módulo "Ingredientes" ativado via Painel ADM</Text>
              <Text style={[styles.logTime, { color: theme.text }]}>Há 3 dias às 09:12 • Almocu Web</Text>
            </View>
          </View>
        </View>

        {/* CTA buttons */}
        <TouchableOpacity 
          style={[styles.editBtn, { borderColor: theme.contrast }]}
          onPress={() => router.push('/(auth)/config/edit-perfil' as any)}
        >
          <Text style={[styles.editBtnText, { color: theme.contrast }]}>Editar Dados do Perfil</Text>
        </TouchableOpacity>

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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  profileName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
  profileEmail: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    opacity: 0.55,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 24,
    marginLeft: 4,
  },
  planCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 10,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planSub: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    opacity: 0.5,
  },
  planName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
    marginTop: 2,
  },
  planPrice: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: '#9CA3AF33',
    marginVertical: 16,
  },
  limitRow: {
    marginBottom: 16,
  },
  limitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  limitLabel: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
    opacity: 0.7,
  },
  limitVal: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#9CA3AF22',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  upgradeBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  upgradeBtnText: {
    fontFamily: 'Jost_700Bold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  logsCard: {
    borderRadius: 24,
    padding: 20,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  logTime: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 1,
  },
  logDivider: {
    height: 1,
    backgroundColor: '#9CA3AF22',
    marginVertical: 14,
  },
  editBtn: {
    borderWidth: 2,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  editBtnText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
  },
});
