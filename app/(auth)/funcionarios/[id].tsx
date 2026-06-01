import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import {
  AlertIcon,
  ChevronLeftIcon,
  ClockIcon,
  FoodStoreIcon,
  LogoPotIcon,
  MoneyIcon,
  NoteIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
} from '@/components/shared/Icons';

export default observer(function FuncionarioPerformanceScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { id: employeeEmail } = useLocalSearchParams();

  // Refresh staff data when screen mounts
  useEffect(() => {
    dataStore.refreshStaff();
  }, []);

  // Find the employee in active restaurant staff list
  const employee = dataStore.staff.find(
    (s) => s.email.toLowerCase() === (employeeEmail as string).toLowerCase()
  );

  if (!employee) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <UsersIcon color={theme.contrast} size={44} />
        <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 18, color: theme.text, marginTop: 12 }}>Colaborador não encontrado</Text>
        <TouchableOpacity style={[styles.backBtn, { marginTop: 16 }]} onPress={() => router.back()}>
          <Text style={{ color: theme.text, fontFamily: 'Jost_600SemiBold' }}>Voltar para Lista</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const role = employee.role;
  const stats = employee.performanceStats || {};

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}>
      
      {/* Back Arrow & Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backArrowBtn, { backgroundColor: theme.foreground }]} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{employee.name}</Text>
          <Text style={[styles.headerSub, { color: theme.text, opacity: 0.6 }]}>{employee.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: theme.contrast + '22' }]}>
          <Text style={[styles.roleBadgeText, { color: theme.contrast }]}>
            {role === 'GERENTE' ? 'Gerente' : role === 'GARCOM' ? 'Garçom' : role === 'COZINHA' ? 'Cozinha' : 'Indefinido'}
          </Text>
        </View>
      </View>

      <View style={styles.contentLayout}>
        {/* Performance Cards Row */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Indicadores de Desempenho (Este Mês)</Text>
        <View style={styles.statsRow}>
          
          {role === 'GARCOM' && (
            <>
              <View style={[styles.statCard, { backgroundColor: theme.foreground }]}>
                <FoodStoreIcon color={theme.contrast} size={32} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.tablesServed || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Mesas Atendidas</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.foreground }]}>
                <StarIcon color={theme.contrast} size={32} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.ratingAverage || '5.0'}</Text>
                <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Média de Avaliação</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.foreground }]}>
                <MoneyIcon color={theme.contrast} size={32} />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  R$ {(stats.revenueGenerated || 0).toFixed(2).replace('.', ',')}
                </Text>
                <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Faturamento Fechado</Text>
              </View>
            </>
          )}

          {role === 'COZINHA' && (
            <>
              <View style={[styles.statCard, { backgroundColor: theme.foreground }]}>
                <LogoPotIcon color={theme.contrast} size={32} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.dishesPrepared || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Pratos Preparados</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.foreground }]}>
                <ClockIcon color={theme.contrast} size={32} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.speedAverageMinutes || 0} min</Text>
                <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Tempo Médio de Preparo</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.foreground }]}>
                <StarIcon color={theme.contrast} size={32} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.ratingAverage || '5.0'}</Text>
                <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Média de Satisfação</Text>
              </View>
            </>
          )}

          {role === 'GERENTE' && (
            <>
              <View style={[styles.statCard, { backgroundColor: theme.foreground }]}>
                <ShieldCheckIcon color={theme.contrast} size={32} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.tablesServed || 12}</Text>
                <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Ações de Gestão</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.foreground }]}>
                <UsersIcon color={theme.contrast} size={32} />
                <Text style={[styles.statValue, { color: theme.text }]}>{dataStore.staff.length}</Text>
                <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Equipe Contratada</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: theme.foreground }]}>
                <StarIcon color={theme.contrast} size={32} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.ratingAverage || '4.9'}</Text>
                <Text style={[styles.statLabel, { color: theme.text, opacity: 0.5 }]}>Nota Geral da Loja</Text>
              </View>
            </>
          )}

        </View>

        {/* Detailed Timeline list */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 28 }]}>Histórico de Atividades Recentes</Text>
        <View style={styles.historyList}>
          
          {role === 'GARCOM' && (
            <>
              <View style={[styles.historyItem, { backgroundColor: theme.foreground }]}>
                <MoneyIcon color={theme.contrast} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>Fechamento de Conta - Mesa 05</Text>
                  <Text style={[styles.itemSub, { color: theme.text, opacity: 0.5 }]}>Hoje, 11:15 • Pagamento em PIX</Text>
                </View>
                <Text style={[styles.itemBadge, { color: theme.contrast }]}>R$ 180,00</Text>
              </View>

              <View style={[styles.historyItem, { backgroundColor: theme.foreground }]}>
                <NoteIcon color={theme.contrast} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>Registro de Pedido - Mesa 02</Text>
                  <Text style={[styles.itemSub, { color: theme.text, opacity: 0.5 }]}>Hoje, 10:45 • Lasagna Bolognese</Text>
                </View>
                <Text style={[styles.itemBadge, { color: theme.text }]}>R$ 75,00</Text>
              </View>

              <View style={[styles.historyItem, { backgroundColor: theme.foreground }]}>
                <StarIcon color={theme.contrast} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>Avaliação 5 Estrelas Recebida</Text>
                  <Text style={[styles.itemSub, { color: theme.text, opacity: 0.5 }]}>Ontem, 20:30 • Atendimento Geral</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <StarIcon key={s} color="#FBBF24" size={12} />
                  ))}
                </View>
              </View>
            </>
          )}

          {role === 'COZINHA' && (
            <>
              <View style={[styles.historyItem, { backgroundColor: theme.foreground }]}>
                <LogoPotIcon color={theme.contrast} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>Prato Preparado: Risotto ai Funghi</Text>
                  <Text style={[styles.itemSub, { color: theme.text, opacity: 0.5 }]}>Hoje, 11:24 • Tempo de preparo: 12 min</Text>
                </View>
                <Text style={[styles.itemBadge, { color: '#10B981' }]}>Eficiente</Text>
              </View>

              <View style={[styles.historyItem, { backgroundColor: theme.foreground }]}>
                <LogoPotIcon color={theme.contrast} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>Prato Preparado: Fettuccine Alfredo</Text>
                  <Text style={[styles.itemSub, { color: theme.text, opacity: 0.5 }]}>Hoje, 10:55 • Tempo de preparo: 15 min</Text>
                </View>
                <Text style={[styles.itemBadge, { color: '#10B981' }]}>No Prazo</Text>
              </View>

              <View style={[styles.historyItem, { backgroundColor: theme.foreground }]}>
                <AlertIcon color={theme.contrast} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>Alerta de Cardápio Ativado</Text>
                  <Text style={[styles.itemSub, { color: theme.text, opacity: 0.5 }]}>Ontem, 19:40 • Tocou produto como Esgotado</Text>
                </View>
                <Text style={[styles.itemBadge, { color: '#EF4444' }]}>Esgotado</Text>
              </View>
            </>
          )}

          {role === 'GERENTE' && (
            <>
              <View style={[styles.historyItem, { backgroundColor: theme.foreground }]}>
                <UsersIcon color={theme.contrast} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>Atribuição de Cargo Realizada</Text>
                  <Text style={[styles.itemSub, { color: theme.text, opacity: 0.5 }]}>Hoje, 09:30 • Atribuiu Garçom a colaborador</Text>
                </View>
                <Text style={[styles.itemBadge, { color: theme.contrast }]}>Ativo</Text>
              </View>

              <View style={[styles.historyItem, { backgroundColor: theme.foreground }]}>
                <FoodStoreIcon color={theme.contrast} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>Criação do Restaurante Workspace</Text>
                  <Text style={[styles.itemSub, { color: theme.text, opacity: 0.5 }]}>15 de Janeiro de 2026 • Registro inicial</Text>
                </View>
                <Text style={[styles.itemBadge, { color: theme.contrast }]}>Criado</Text>
              </View>
            </>
          )}

        </View>
      </View>

    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
  },
  headerSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
  },
  backBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  contentLayout: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statValue: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  itemSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  itemBadge: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
  },
});
