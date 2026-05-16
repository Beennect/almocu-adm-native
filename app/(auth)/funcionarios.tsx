import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { authStore } from '@/stores/AuthStore';
import { dataStore } from '@/stores/DataStore';
import { toastStore } from '@/stores/ToastStore';
import { ChevronLeftIcon, TrashIcon } from '@/components/shared/Icons';

export default observer(function FuncionariosScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'PENDENTES' | 'GARCOM' | 'COZINHA' | 'GERENTE'>('PENDENTES');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState(dataStore.restaurantDetails?.inviteCode || '');
  const [expiresIn, setExpiresIn] = useState('');

  const activeRole = authStore.activeRole;
  if (activeRole !== 'GERENTE') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 44 }}>🚫</Text>
        <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 18, color: theme.text, marginTop: 12 }}>Acesso Negado</Text>
        <Text style={{ fontFamily: 'Jost_400Regular', fontSize: 14, color: theme.text, opacity: 0.6, marginTop: 6, textAlign: 'center' }}>
          Esta página é restrita apenas para Gerentes do restaurante.
        </Text>
      </View>
    );
  }

  // Update invite expiration countdown
  useEffect(() => {
    const details = dataStore.restaurantDetails;
    if (details?.inviteCode && details?.inviteCodeExpires) {
      setInviteCode(details.inviteCode);
      
      const interval = setInterval(() => {
        const diff = new Date(details.inviteCodeExpires!).getTime() - Date.now();
        if (diff <= 0) {
          setExpiresIn('Expirado');
          setInviteCode('');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setExpiresIn(`${minutes}m ${seconds}s`);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setExpiresIn('');
      setInviteCode('');
    }
  }, [dataStore.restaurantDetails?.inviteCode, dataStore.restaurantDetails?.inviteCodeExpires]);

  const handleGenerateCode = () => {
    setLoading(true);
    try {
      const code = dataStore.generateInviteCode();
      setInviteCode(code);
      toastStore.show('Novo código de convite gerado com sucesso!', 'success');
    } catch (e: any) {
      toastStore.show('Erro ao gerar código de convite.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = (email: string, role: 'GERENTE' | 'GARCOM' | 'COZINHA') => {
    dataStore.assignStaffRole(email, role);
    toastStore.show(`Cargo atribuído com sucesso!`, 'success');
  };

  const handleRemoveMember = (email: string) => {
    dataStore.removeStaffMember(email);
    toastStore.show('Colaborador removido da equipe.', 'success');
  };

  const staffFiltered = dataStore.staff.filter(s => s.role === activeTab);

  // Spotlight employee
  const highlightEmployee = dataStore.staff.find(s => s.role === 'GARCOM' || s.role === 'COZINHA');

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Gerenciamento de Equipe</Text>
        <Text style={[styles.headerSub, { color: theme.text, opacity: 0.6 }]}>
          Controle permissões de cargos, gere convites e analise o desempenho individual dos colaboradores.
        </Text>
      </View>

      {/* Invite Code Generator Card */}
      <View style={[styles.inviteCard, { backgroundColor: theme.foreground }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Convidar Colaborador</Text>
          <Text style={[styles.cardSub, { color: theme.text, opacity: 0.5, marginTop: 4 }]}>
            Gere um código de convite temporário estilo Google Classroom. Colaboradores entram na tela de ajustes com cargo INDEFINIDO.
          </Text>

          {inviteCode ? (
            <View style={styles.codeRow}>
              <View style={[styles.codeDisplay, { backgroundColor: theme.background }]}>
                <Text style={[styles.codeText, { color: theme.contrast }]}>{inviteCode}</Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.countdownLabel, { color: theme.text, opacity: 0.5 }]}>Expira em:</Text>
                <Text style={[styles.countdownTimer, { color: theme.contrast }]}>{expiresIn}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.noCodeText, { color: theme.text, opacity: 0.4 }]}>Nenhum código ativo no momento.</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.inviteBtn, { backgroundColor: theme.contrast }]}
          onPress={handleGenerateCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.inviteBtnText}>{inviteCode ? 'Rotacionar Código' : 'Gerar Convite'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Spotlight highlight */}
      {highlightEmployee && (
        <View style={[styles.spotlightCard, { backgroundColor: theme.contrast + '15', borderColor: theme.contrast }]}>
          <Text style={{ fontSize: 24 }}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.spotlightTitle, { color: theme.text }]}>Colaborador em Destaque</Text>
            <Text style={[styles.spotlightSub, { color: theme.text, opacity: 0.7, marginTop: 2 }]}>
              {highlightEmployee.name} está com nota média de ★ {highlightEmployee.performanceStats?.ratingAverage || '5.0'} este mês!
            </Text>
          </View>
        </View>
      )}

      {/* Segmented Navigation Tabs */}
      <View style={styles.tabContainer}>
        {['PENDENTES', 'GARCOM', 'COZINHA', 'GERENTE'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabBtn,
              activeTab === tab && { borderBottomColor: theme.contrast, borderBottomWidth: 3 }
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              { color: theme.text },
              activeTab === tab && { fontWeight: '700', color: theme.contrast }
            ]}>
              {tab === 'PENDENTES' ? 'Sem Cargo' : tab === 'GARCOM' ? 'Garçons' : tab === 'COZINHA' ? 'Cozinha' : 'Gerentes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Staff List Grid */}
      <View style={styles.staffGrid}>
        {staffFiltered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.foreground }]}>
            <Text style={{ fontSize: 32 }}>👥</Text>
            <Text style={[styles.emptyTitle, { color: theme.text, opacity: 0.6, marginTop: 8 }]}>
              Nenhum colaborador nesta categoria.
            </Text>
          </View>
        ) : (
          staffFiltered.map((member) => (
            <View key={member.userId} style={[styles.memberCard, { backgroundColor: theme.foreground }]}>
              <View style={styles.memberInfo}>
                <View style={[styles.avatar, { backgroundColor: theme.contrast + '22' }]}>
                  <Text style={[styles.avatarText, { color: theme.contrast }]}>{member.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                  <Text style={[styles.memberEmail, { color: theme.text, opacity: 0.5 }]}>{member.email}</Text>
                </View>
              </View>

              {/* Action Rows */}
              {activeTab === 'PENDENTES' ? (
                <View style={styles.roleActionRow}>
                  <TouchableOpacity
                    style={[styles.roleBtn, { backgroundColor: theme.background }]}
                    onPress={() => handleAssignRole(member.email, 'GARCOM')}
                  >
                    <Text style={[styles.roleBtnText, { color: theme.text }]}>Garçom</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleBtn, { backgroundColor: theme.background }]}
                    onPress={() => handleAssignRole(member.email, 'COZINHA')}
                  >
                    <Text style={[styles.roleBtnText, { color: theme.text }]}>Cozinha</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleBtn, { backgroundColor: theme.background }]}
                    onPress={() => handleAssignRole(member.email, 'GERENTE')}
                  >
                    <Text style={[styles.roleBtnText, { color: theme.text }]}>Gerente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => handleRemoveMember(member.email)}
                  >
                    <TrashIcon color="#EF4444" size={16} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.statsActionRow}>
                  {member.email !== authStore.user?.email && (
                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={() => handleRemoveMember(member.email)}
                    >
                      <TrashIcon color="#EF4444" size={16} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.viewDetailsBtn, { backgroundColor: theme.contrast }]}
                    onPress={() => router.push(`/(auth)/funcionarios/${member.email}` as any)}
                  >
                    <Text style={styles.viewDetailsBtnText}>Ver Desempenho</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
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
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 24,
  },
  headerSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  inviteCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
  },
  cardSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  codeDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  codeText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    letterSpacing: 2,
  },
  countdownLabel: {
    fontFamily: 'Jost_400Regular',
    fontSize: 11,
  },
  countdownTimer: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 13,
    marginTop: 2,
  },
  noCodeText: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    marginTop: 16,
  },
  inviteBtn: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minWidth: 150,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
  },
  spotlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 24,
  },
  spotlightTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
  },
  spotlightSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 13,
  },
  staffGrid: {
    gap: 12,
  },
  emptyCard: {
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  memberCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
  memberName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
  },
  memberEmail: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
  },
  roleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBtnText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
  },
  statsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsBtn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Jost_700Bold',
    fontSize: 12,
  },
});
