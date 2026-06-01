import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { authStore } from '@/stores/AuthStore';
import { dataStore, StaffMember } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { TrashIcon } from '@/components/shared/Icons';
import { InlineAlert } from '@/components/shared/InlineAlert';

export default observer(function FuncionariosScreen() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'COMUM' | 'GARCOM' | 'COZINHA' | 'CAIXA' | 'GERENTE'>('COMUM');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [roleModalMember, setRoleModalMember] = useState<StaffMember | null>(null);
  const [roleModalMessage, setRoleModalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const inviteCode = dataStore.inviteCodeInfo?.code || dataStore.restaurantDetails?.inviteCode || '';

  const roleLabels: Record<string, string> = {
    GERENTE: 'Gerente',
    GARCOM: 'Garçom',
    COZINHA: 'Cozinha',
    CAIXA: 'Caixa',
    COMUM: 'Sem Cargo',
    INDEFINIDO: 'Indefinido',
  };

  const assignableRoles: Array<'GARCOM' | 'COZINHA' | 'CAIXA' | 'GERENTE'> = ['GARCOM', 'COZINHA', 'CAIXA', 'GERENTE'];

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

  // ── Contagem regressiva com auto-refresh ──
  // Lê o expiresAt direto do observable a cada tick (evita stale closure)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      const expiresAt = dataStore.inviteCodeInfo?.expiresAt;
      if (!expiresAt) {
        setTimeLeft('');
        return;
      }
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expirado');
        if (!dataStore.isRefreshingInviteCode) {
          dataStore.refreshInviteCode();
        }
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    tick();
    interval = setInterval(tick, 1000);
    return () => { if (interval) clearInterval(interval); };
  }, [dataStore.inviteCodeInfo]); // ← reage à mudança do observable

  // ── Forçar refresh ao montar se ainda não temos o código ──
  useEffect(() => {
    if (!dataStore.inviteCodeInfo && !dataStore.isRefreshingInviteCode) {
      dataStore.refreshInviteCode();
    }
  }, []);

  // ── Forçar refresh da equipe ao montar ──
  useEffect(() => {
    dataStore.refreshStaff();
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      Toast.show({ type: 'success', text1: 'Código copiado para a área de transferência!' });
    } catch {
      Toast.show({ type: 'info', text1: 'Clique no código para copiá-lo manualmente.' });
    }
  };

  const handleRoleChange = (email: string, role: 'GARCOM' | 'COZINHA' | 'CAIXA' | 'GERENTE') => {
    try {
      dataStore.assignStaffRole(email, role);
      Toast.show({ type: 'success', text1: `Cargo alterado para ${roleLabels[role]}` });
      setRoleModalMessage(null);
      setRoleModalMember(null);
    } catch (err: any) {
      setRoleModalMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Erro ao alterar cargo.',
      });
    }
  };

  const handleRemoveMember = (email: string) => {
    dataStore.removeStaffMember(email);
    Toast.show({ type: 'success', text1: 'Colaborador removido da equipe.' });
  };

  const staffFiltered = dataStore.staff.filter(s => s.role === activeTab);

  // Spotlight employee
  const highlightEmployee = dataStore.staff.find(s => s.role === 'GARCOM' || s.role === 'COZINHA' || s.role === 'CAIXA');

  return (
    <>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Gerenciamento de Equipe</Text>
        <Text style={[styles.headerSub, { color: theme.text, opacity: 0.6 }]}>
          Controle permissões de cargos, gere convites e analise o desempenho individual dos colaboradores.
        </Text>
      </View>

      {/* Invite Code Card */}
      <View style={[styles.inviteCard, { backgroundColor: theme.foreground }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Convidar Colaborador</Text>
          <Text style={[styles.cardSub, { color: theme.text, opacity: 0.5, marginTop: 4 }]}>
            Compartilhe o código abaixo com os colaboradores para eles entrarem no restaurante.
          </Text>

          {inviteCode ? (
            <View style={styles.codeSection}>
              <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7} style={styles.codeRow}>
                <View style={[styles.codeDisplay, { backgroundColor: theme.background }]}>
                  <Text style={[styles.codeText, { color: theme.contrast }]}>{inviteCode}</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.expiresSection}>
                {dataStore.inviteCodeInfo?.expiresAt ? (
                  <>
                    <Text style={[styles.expiresLabel, { color: theme.text, opacity: 0.5 }]}>
                      {timeLeft === 'Expirado'
                        ? 'Código expirado — renovando...'
                        : 'Expira em:'}
                    </Text>
                    <Text style={[
                      styles.expiresTimer,
                      { color: timeLeft === 'Expirado' ? '#EF4444' : theme.contrast }
                    ]}>
                      {timeLeft || '—'}
                    </Text>
                  </>
                ) : dataStore.isRefreshingInviteCode || !dataStore.inviteCodeInfo ? (
                  <Text style={[styles.expiresLabel, { color: theme.text, opacity: 0.5 }]}>
                    Buscando tempo de expiração...
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.expiresLabel, { color: theme.text, opacity: 0.4 }]}>
                      Expira em:
                    </Text>
                    <Text style={[styles.expiresTimer, { color: theme.contrast }]}>
                      {timeLeft || '—'}
                    </Text>
                  </>
                )}
              </View>
            </View>
          ) : dataStore.isRefreshingInviteCode ? (
            <Text style={[styles.noCodeText, { color: theme.text, opacity: 0.4 }]}>
              Buscando código de convite...
            </Text>
          ) : (
            <Text style={[styles.noCodeText, { color: theme.text, opacity: 0.4 }]}>
              Carregando código de convite...
            </Text>
          )}
        </View>
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
        {(['COMUM', 'GARCOM', 'COZINHA', 'CAIXA', 'GERENTE'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabBtn,
              activeTab === tab && { borderBottomColor: theme.contrast, borderBottomWidth: 3 }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              { color: theme.text },
              activeTab === tab && { fontWeight: '700', color: theme.contrast }
            ]}>
              {tab === 'COMUM' ? 'Sem Cargo' : tab === 'GARCOM' ? 'Garçons' : tab === 'COZINHA' ? 'Cozinha' : tab === 'CAIXA' ? 'Caixa' : 'Gerentes'}
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
            <TouchableOpacity
              key={member.userId}
              style={[styles.memberCard, { backgroundColor: theme.foreground }]}
              activeOpacity={0.7}
              onPress={() => router.push(`/(auth)/funcionarios/${member.email}` as any)}
            >
              <View style={styles.memberInfo}>
                <View style={[styles.avatar, { backgroundColor: theme.contrast + '22' }]}>
                  <Text style={[styles.avatarText, { color: theme.contrast }]}>{member.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                  <Text style={[styles.memberEmail, { color: theme.text, opacity: 0.5 }]}>{member.email}</Text>
                </View>

                {member.email !== authStore.user?.email && (
                  <TouchableOpacity
                    style={styles.trashBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleRemoveMember(member.email);
                    }}
                  >
                    <TrashIcon color="#EF4444" size={16} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Role selector badge */}
              <View style={styles.roleRow}>
                <Text style={[styles.roleLabel, { color: theme.text, opacity: 0.5 }]}>Cargo:</Text>
                {member.email !== authStore.user?.email ? (
                  <TouchableOpacity
                    style={[styles.roleBadge, { backgroundColor: theme.contrast + '18' }]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      setRoleModalMessage(null);
                      setRoleModalMember(member);
                    }}
                  >
                    <Text style={[styles.roleBadgeText, { color: theme.contrast }]}>
                      {roleLabels[member.role] || member.role}
                    </Text>
                    <Text style={[styles.roleArrow, { color: theme.contrast }]}>▼</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.roleBadge, { backgroundColor: theme.contrast + '18' }]}>
                    <Text style={[styles.roleBadgeText, { color: theme.contrast }]}>
                      {roleLabels[member.role] || member.role}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

    </ScrollView>

      {/* Role selection modal */}
      <Modal transparent visible={!!roleModalMember} animationType="fade" onRequestClose={() => { setRoleModalMessage(null); setRoleModalMember(null); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setRoleModalMessage(null); setRoleModalMember(null); }}>
          <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Alterar Cargo</Text>
            <Text style={[styles.modalSubtitle, { color: theme.text, opacity: 0.5 }]}>
              {roleModalMember?.name || 'Funcionário'}
            </Text>

            {roleModalMessage ? (
              <View style={{ paddingHorizontal: 16 }}>
                <InlineAlert type={roleModalMessage.type} message={roleModalMessage.text} />
              </View>
            ) : null}

            <View style={styles.modalOptions}>
              {assignableRoles.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.modalOption,
                    roleModalMember?.role === role && { backgroundColor: theme.contrast + '18' },
                  ]}
                  onPress={() => roleModalMember && handleRoleChange(roleModalMember.email, role)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    { color: theme.text },
                    roleModalMember?.role === role && { color: theme.contrast, fontFamily: 'Jost_700Bold' },
                  ]}>
                    {roleLabels[role]}
                  </Text>
                  {roleModalMember?.role === role && (
                    <Text style={[styles.modalCheck, { color: theme.contrast }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalCancel, { borderTopColor: theme.text + '15' }]}
              onPress={() => { setRoleModalMessage(null); setRoleModalMember(null); }}
            >
              <Text style={[styles.modalCancelText, { color: theme.text, opacity: 0.6 }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
  codeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiresSection: {
    alignItems: 'flex-start',
  },
  expiresLabel: {
    fontFamily: 'Jost_400Regular',
    fontSize: 11,
  },
  expiresTimer: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
    marginTop: 2,
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
  noCodeText: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    marginTop: 16,
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
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleLabel: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  roleBadgeText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
  },
  roleArrow: {
    fontSize: 8,
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 17,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalSubtitle: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  modalOptions: {
    paddingHorizontal: 12,
    gap: 4,
    paddingBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalOptionText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  modalCheck: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
  },
  modalCancel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  modalCancelText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
});
