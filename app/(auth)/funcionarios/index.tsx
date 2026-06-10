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
import { permissionStore } from '@/stores/PermissionStore';
import { dataStore, StaffMember } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { withLoading } from '@/utils/toast';
import { AlertIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, StarIcon, TrashIcon, UsersIcon } from '@/components/shared/Icons';
import { InlineAlert } from '@/components/shared/InlineAlert';

export default observer(function FuncionariosScreen() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'COMUM' | 'GARCOM' | 'COZINHA' | 'ENTREGADOR' | 'GERENTE'>('COMUM');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [roleModalMember, setRoleModalMember] = useState<StaffMember | null>(null);
  const [roleModalMessage, setRoleModalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [removingMember, setRemovingMember] = useState<StaffMember | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const inviteCode = dataStore.inviteCodeInfo?.code || dataStore.restaurantDetails?.inviteCode || '';

  const roleLabels: Record<string, string> = {
    GERENTE: 'Gerente',
    GARCOM: 'Garçom',
    COZINHA: 'Cozinha',
    ENTREGADOR: 'Entregador',
    COMUM: 'Sem Cargo',
    INDEFINIDO: 'Indefinido',
  };

  const assignableRoles: Array<'GARCOM' | 'COZINHA' | 'ENTREGADOR' | 'GERENTE'> = [
    'GARCOM', 'COZINHA', 'ENTREGADOR', 'GERENTE',
  ];

  if (!permissionStore.can('staff:view')) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <AlertIcon color={theme.contrast} size={44} />
        <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 18, color: theme.text, marginTop: 12 }}>Acesso Negado</Text>
        <Text style={{ fontFamily: 'Jost_400Regular', fontSize: 14, color: theme.text, opacity: 0.6, marginTop: 6, textAlign: 'center' }}>
          Você não tem permissão para gerenciar a equipe.
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

  // ── Resetar página ao trocar de aba ──
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      Toast.show({ type: 'success', text1: 'Código copiado para a área de transferência!' });
    } catch {
      Toast.show({ type: 'info', text1: 'Clique no código para copiá-lo manualmente.' });
    }
  };

  const handleRoleChange = async (email: string, role: 'GARCOM' | 'COZINHA' | 'ENTREGADOR' | 'GERENTE') => {
    try {
      await dataStore.assignStaffRole(email, role);
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

  const handleRemoveMember = (targetMember: StaffMember) => {
    setRemovingMember(targetMember);
  };

  const confirmRemoveMember = async () => {
    if (!removingMember) return;
    await withLoading(
      async () => {
        await dataStore.removeStaffMember(removingMember.email);
        setRemovingMember(null);
      },
      { loading: 'Removendo funcionário...', success: `${removingMember.name} removido da equipe.`, error: 'Erro ao remover funcionário.' },
    );
  };

  const itemsPerPage = 5;
  const staffFiltered = dataStore.staff.filter(s => s.role === activeTab);
  const totalPages = Math.max(1, Math.ceil(staffFiltered.length / itemsPerPage));
  const paginatedStaff = staffFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Spotlight employee
  const highlightEmployee = dataStore.staff.find(s => s.role === 'GARCOM' || s.role === 'COZINHA' || s.role === 'ENTREGADOR');

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
      {/*highlightEmployee && (
        <View style={[styles.spotlightCard, { backgroundColor: theme.contrast + '15', borderColor: theme.contrast }]}>
          <StarIcon color={theme.contrast} size={24} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.spotlightTitle, { color: theme.text }]}>Colaborador em Destaque</Text>
            <Text style={[styles.spotlightSub, { color: theme.text, opacity: 0.7, marginTop: 2 }]}>
              {highlightEmployee.name} está com nota média de {highlightEmployee.performanceStats?.ratingAverage || '5.0'} este mês!
            </Text>
          </View>
        </View>
      )*/}

      {/* Segmented Navigation Tabs */}
      <View style={styles.tabContainer}>
        {(['COMUM', 'GARCOM', 'COZINHA', 'ENTREGADOR', 'GERENTE'] as const).map((tab) => (
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
              {tab === 'COMUM' ? 'Sem Cargo' : tab === 'GARCOM' ? 'Garçons' : tab === 'COZINHA' ? 'Cozinha' : tab === 'ENTREGADOR' ? 'Entregadores' : 'Gerentes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Staff List Grid */}
      <View style={styles.staffGrid}>
        {staffFiltered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.foreground }]}>
            <UsersIcon color={theme.contrast} size={32} />
            <Text style={[styles.emptyTitle, { color: theme.text, opacity: 0.6, marginTop: 8 }]}>
              Nenhum colaborador nesta categoria.
            </Text>
          </View>
        ) : (
          paginatedStaff.map((member) => (
            <View
              key={member.userId}
              style={[styles.memberCard, { backgroundColor: theme.foreground }]}
            >
              <View style={styles.memberInfo}>
                <TouchableOpacity
                  style={styles.memberInfoLeft}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/(auth)/funcionarios/${member.userId}` as any)}
                >
                  <View style={[styles.avatar, { backgroundColor: theme.contrast + '22' }]}>
                    <Text style={[styles.avatarText, { color: theme.contrast }]}>{member.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                    <Text style={[styles.memberEmail, { color: theme.text, opacity: 0.5 }]}>{member.email}</Text>
                  </View>
                </TouchableOpacity>

                {/* OWNER pode remover qualquer um; MANAGER não pode remover outro MANAGER */}
                {member.email !== authStore.user?.email && permissionStore.can('staff:remove') && (authStore.isOwner || member.role !== 'GERENTE') && (
                  <TouchableOpacity
                    style={styles.trashBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => handleRemoveMember(member)}
                  >
                    <TrashIcon color="#EF4444" size={16} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Role selector badge */}
              <View style={styles.roleRow}>
                <Text style={[styles.roleLabel, { color: theme.text, opacity: 0.5 }]}>Cargo:</Text>
                {/* MANAGER não pode alterar cargo de outro MANAGER (só OWNER pode) */}
                {member.email !== authStore.user?.email && (authStore.isOwner || member.role !== 'GERENTE') ? (
                  <TouchableOpacity
                    style={[styles.roleBadge, { backgroundColor: theme.contrast + '18' }]}
                    onPress={() => {
                      setRoleModalMessage(null);
                      setRoleModalMember(member);
                    }}
                  >
                    <Text style={[styles.roleBadgeText, { color: theme.contrast }]}>
                      {roleLabels[member.role] || member.role}
                    </Text>
                    <ChevronDownIcon color={theme.contrast} size={12} style={styles.roleArrow} />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.roleBadge, { backgroundColor: theme.contrast + '18' }]}>
                    <Text style={[styles.roleBadgeText, { color: theme.contrast }]}>
                      {roleLabels[member.role] || member.role}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.pageBtn, { backgroundColor: theme.foreground, borderColor: theme.text + '10' }, currentPage === 1 && styles.pageBtnDisabled]}
            onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon color={theme.text} size={20} />
          </TouchableOpacity>

          <View style={[styles.pageIndicator, { backgroundColor: theme.foreground, borderColor: theme.text + '10' }]}>
            <Text style={[styles.pageIndicatorText, { color: theme.text }]}>{currentPage} / {totalPages}</Text>
          </View>

          <TouchableOpacity
            style={[styles.pageBtn, { backgroundColor: theme.foreground, borderColor: theme.text + '10' }, currentPage === totalPages && styles.pageBtnDisabled]}
            onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRightIcon color={theme.text} size={20} />
          </TouchableOpacity>
        </View>
      )}

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
                    <CheckIcon color={theme.contrast} size={16} />
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

      <ConfirmModal
        visible={!!removingMember}
        onClose={() => setRemovingMember(null)}
        onConfirm={confirmRemoveMember}
        title="Remover Funcionário"
        message={removingMember ? `Tem certeza que deseja remover "${removingMember.name}" da equipe? Ele perderá acesso ao restaurante.` : ''}
        confirmText="Remover"
      />
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
  memberInfoLeft: {
    flex: 1,
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
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  pageBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pageBtnDisabled: {
    opacity: 0.3,
  },
  pageIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pageIndicatorText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
});
