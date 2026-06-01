import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { themeStore } from '@/stores/ThemeStore';
import { authStore } from '@/stores/AuthStore';
import { dataStore } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { SelectModal } from '@/components/shared/SelectModal';
import { UserHeader } from '@/components/shared/UserHeader';
import { InlineAlert } from '@/components/shared/InlineAlert';
import {
  BellIcon,
  BriefcaseIcon,
  BuildingIcon,
  CardapioIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardIcon,
  FoodStoreIcon,
  LightbulbIcon,
  LinkIcon,
  LogOutIcon,
  ModulesIcon,
  MoonIcon,
  PlusIcon,
  SpoonIcon,
  SunIcon,
  TrashIcon,
  UserIcon,
} from '@/components/shared/Icons';

// ─── Row components ───────────────────────────────────────────────────────────

function SectionLabel({ label, theme }: { label: string; theme: any }) {
  return (
    <Text style={{
      fontFamily: 'Jost_700Bold',
      fontSize: 12,
      color: theme.text,
      opacity: 0.45,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 8,
      marginTop: 24,
      marginLeft: 4,
    }}>
      {label}
    </Text>
  );
}

function SettingRow({
  icon,
  label,
  sublabel,
  right,
  onPress,
  isFirst,
  isLast,
  theme,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  theme: any;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.foreground,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopLeftRadius: isFirst ? 20 : 0,
        borderTopRightRadius: isFirst ? 20 : 0,
        borderBottomLeftRadius: isLast ? 20 : 0,
        borderBottomRightRadius: isLast ? 20 : 0,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.background,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: danger ? '#EF444422' : theme.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: 'Jost_600SemiBold',
          fontSize: 15,
          color: danger ? '#EF4444' : theme.text,
        }}>
          {label}
        </Text>
        {sublabel && (
          <Text style={{
            fontFamily: 'Jost_400Regular',
            fontSize: 13,
            color: theme.text,
            opacity: 0.5,
            marginTop: 1,
          }}>
            {sublabel}
          </Text>
        )}
      </View>
      {right}
    </TouchableOpacity>
  );
}

// ─── CNPJ Mathematical Validation ──────────────────────────────────────────────

function isValidCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;

  // Reject if all digits are the same (e.g., 00.000.000/0000-00)
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const nums = digits.split('').map(Number);

  // Validate first check digit (13th position)
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += nums[i] * weights1[i];
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (nums[12] !== digit1) return false;

  // Validate second check digit (14th position)
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += nums[i] * weights2[i];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (nums[13] !== digit2) return false;

  return true;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default observer(function ConfigScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmClearOrders, setConfirmClearOrders] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<'my' | 'all'>('my');
  const [confirmRemoveWorkspace, setConfirmRemoveWorkspace] = useState(false);
  const [removingRestId, setRemovingRestId] = useState('');
  const [removingRestName, setRemovingRestName] = useState('');

  // Inline messages for modals (Toast fica atrás do modal no react-native-web)
  const [workspaceModalError, setWorkspaceModalError] = useState('');
  const [createModalError, setCreateModalError] = useState('');
  const [joinModalError, setJoinModalError] = useState('');

  // Refresh user profile/role from backend on mount
  useEffect(() => {
    authStore.refreshProfile();
  }, []);

  // Setup states
  const [setupTab, setSetupTab] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);

  // Form states
  const [restName, setRestName] = useState('');
  const [restCnpj, setRestCnpj] = useState('');
  const [restPhone, setRestPhone] = useState('');
  const [restCategory, setRestCategory] = useState('');
  const [restAddress, setRestAddress] = useState('');
  const [restHours, setRestHours] = useState('Segunda a Sábado: 11:30 às 22:00');
  const [restFee, setRestFee] = useState('7.00');
  const [inviteCode, setInviteCode] = useState('');

  const maskCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const handleCnpjChange = (value: string) => {
    setRestCnpj(maskCnpj(value));
  };

  const userName = authStore.user?.name || 'Usuário';
  const userEmail = authStore.user?.email || '';
  const activeRole = authStore.activeRole;
  const hasRestaurant = !!authStore.user?.restaurantId;

  const restaurantIds = Object.keys(authStore.user?.restaurantRoles || {});
  const userWorkspaces = restaurantIds.map(id => {
    return dataStore.restaurants.find(r => r.id === id) || { id, name: `Restaurante (${id})` };
  });

  const handleLogout = async () => {
    await authStore.logout();
    router.replace('/login');
  };

  const handleClearOrders = () => {
    dataStore.clearOrders();
    setConfirmClearOrders(false);
  };

  const handleClearAll = () => {
    dataStore.clear();
    dataStore.save();
    setConfirmClearAll(false);
  };

  const handleCreateRestaurant = async () => {
    if (!restName || !restCnpj || !restPhone || !restCategory || !restAddress) {
      setCreateModalError('Preencha todos os campos obrigatórios (*).');
      return;
    }
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!cnpjRegex.test(restCnpj)) {
      setCreateModalError('CNPJ inválido. Use o formato: 00.000.000/0000-00');
      return;
    }
    if (!isValidCNPJ(restCnpj)) {
      setCreateModalError('CNPJ inválido. Verifique os dígitos informados.');
      return;
    }
    setCreateModalError('');
    setLoading(true);
    try {
      try {
        await authStore.createRestaurantWorkspace(
          restName,
          restCnpj,
          restPhone,
          restCategory,
          restAddress,
          parseFloat(restFee) || 0,
          restHours
        );
        setShowCreateModal(false);
        setCreateModalError('');
        // Limpar campos
        setRestName('');
        setRestCnpj('');
        setRestPhone('');
        setRestCategory('');
        setRestAddress('');
        Toast.show({ type: 'success', text1: 'Restaurante cadastrado e cargo GERENTE atribuído!' });
      } catch (err: any) {
        setCreateModalError(err?.response?.data?.message || err?.message || 'Erro ao cadastrar restaurante.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRestaurant = async () => {
    if (!inviteCode.trim()) {
      setJoinModalError('Digite o código de convite.');
      return;
    }
    setJoinModalError('');
    setLoading(true);
    try {
      try {
        await authStore.joinRestaurantWorkspace(inviteCode);
        setShowJoinModal(false);
        setJoinModalError('');
        setInviteCode('');
        Toast.show({ type: 'success', text1: 'Ingresso realizado! Aguarde ativação pelo Gerente.' });
      } catch (err: any) {
        setJoinModalError(err?.response?.data?.message || err?.message || 'Código de convite inválido ou expirado.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRestaurant = () => {
    if (authStore.user?.email) {
      dataStore.removeStaffMember(authStore.user.email);
      Toast.show({ type: 'success', text1: 'Desvinculado com sucesso!' });
    }
  };

  const handleRemoveWorkspace = async () => {
    if (!removingRestId) return;
    setLoading(true);
    try {
      try {
        await authStore.removeRestaurantWorkspace(removingRestId);
        setConfirmRemoveWorkspace(false);
        setRemovingRestId('');
        setRemovingRestName('');
        Toast.show({ type: 'success', text1: `Restaurante "${removingRestName}" removido dos seus workspaces!` });
      } catch (err: any) {
        Toast.show({ type: 'error', text1: err?.response?.data?.message || err?.message || 'Erro ao remover workspace.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {!isWeb && <UserHeader />}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        { paddingBottom: 40 },
        isWeb && { maxWidth: 600, width: '100%', alignSelf: 'center' }
      ]}>
        
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.foreground }]}>
          <View style={[styles.avatar, { backgroundColor: theme.contrast }]}>
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: theme.text }]}>{userName}</Text>
            <Text style={[styles.profileEmail, { color: theme.text }]}>{userEmail}</Text>
          </View>
          <View style={[styles.planBadge, { backgroundColor: theme.contrast + '22' }]}>
            <Text style={[styles.planText, { color: theme.contrast }]}>
              {activeRole === 'GERENTE' ? 'Gerente' : activeRole === 'GARCOM' ? 'Garçom' : activeRole === 'COZINHA' ? 'Cozinha' : activeRole === 'CAIXA' ? 'Caixa' : activeRole === 'COMUM' ? 'Sem Cargo' : 'Indefinido'}
            </Text>
          </View>
        </View>

        {/* WORKSPACE SECTOR CARD */}
        <View style={[styles.workspaceCard, { backgroundColor: theme.foreground }]}>
          <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 12, color: theme.contrast, textTransform: 'uppercase', marginBottom: 4 }}>
            Workspace Atual
          </Text>
          
          <TouchableOpacity
            style={[styles.selectDropdown, { backgroundColor: theme.background, borderColor: theme.text + '15' }]}
            activeOpacity={0.7}
            onPress={() => { setWorkspaceModalError(''); setShowWorkspaceModal(true); }}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <BriefcaseIcon color={theme.contrast} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 15, color: theme.text }} numberOfLines={1}>
                  {dataStore.restaurantDetails?.name || 'Selecione ou Crie um Workspace'}
                </Text>
                <Text style={{ fontFamily: 'Jost_400Regular', fontSize: 12, color: theme.text, opacity: 0.6 }} numberOfLines={1}>
                  {dataStore.restaurantDetails?.category ? `${dataStore.restaurantDetails.category} • Cargo: ${activeRole === 'GERENTE' ? 'Gerente' : activeRole === 'GARCOM' ? 'Garçom' : activeRole === 'COZINHA' ? 'Cozinha' : activeRole === 'CAIXA' ? 'Caixa' : activeRole === 'COMUM' ? 'Sem Cargo' : activeRole}` : 'Nenhum estabelecimento ativo'}
                </Text>
              </View>
            </View>
            <ChevronDownIcon color={theme.text} size={16} style={{ opacity: 0.5, marginLeft: 8 }} />
          </TouchableOpacity>

          {!hasRestaurant && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
              <LightbulbIcon color={theme.text} size={14} style={{ opacity: 0.5, marginTop: 2 }} />
              <Text style={{ flex: 1, color: theme.text, opacity: 0.5, fontSize: 12, fontFamily: 'Jost_400Regular' }}>
                Você não possui um restaurante ativo. Clique acima para selecionar, cadastrar ou ingressar.
              </Text>
            </View>
          )}

          {hasRestaurant && activeRole === 'INDEFINIDO' && (
            <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444430' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <BellIcon color="#EF4444" size={14} />
                <Text style={{ fontFamily: 'Jost_600SemiBold', fontSize: 13, color: '#EF4444' }}>
                  Aguardando Ativação
                </Text>
              </View>
              <Text style={{ fontFamily: 'Jost_400Regular', fontSize: 11, color: theme.text, opacity: 0.7, textAlign: 'center', marginTop: 4 }}>
                Peça ao Gerente do restaurante "{dataStore.restaurantDetails?.name}" para ativar seu cargo.
              </Text>
              <TouchableOpacity
                style={{ alignSelf: 'center', marginTop: 8 }}
                onPress={handleLeaveRestaurant}
              >
                <Text style={{ fontFamily: 'Jost_700Bold', fontSize: 11, color: '#EF4444' }}>Sair do Restaurante</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* STANDARD CONFIGURATION OPTIONS - ONLY ACCESSIBLE IF USER HAS ROLE !== INDEFINIDO */}
        {hasRestaurant && activeRole !== 'INDEFINIDO' && (
          <>
            {/* Empresa & Perfil */}
            <SectionLabel label="Empresa & Perfil" theme={theme} />
            <View style={{ borderRadius: 20, overflow: 'hidden' }}>
              <SettingRow
                isFirst
                theme={theme}
                icon={<UserIcon color={theme.text} size={18} />}
                label="Meu Perfil"
                sublabel="Informações pessoais e plano de assinatura"
                onPress={() => router.push('/(auth)/config/perfil' as any)}
              />
              {activeRole === 'GERENTE' && (
                <>
                  <SettingRow
                    theme={theme}
                    icon={<FoodStoreIcon color={theme.text} size={18} />}
                    label="Informações do Restaurante"
                    sublabel="Endereço, telefone, taxa e horários"
                    onPress={() => router.push('/(auth)/config/restaurante' as any)}
                  />
                  <SettingRow
                    theme={theme}
                    icon={<BuildingIcon color={theme.text} size={18} />}
                    label="Gerenciar Filiais"
                    sublabel="Cadastrar e alternar entre filiais da rede"
                    onPress={() => router.push('/(auth)/config/filiais' as any)}
                  />
                </>
              )}
              <SettingRow
                isLast
                theme={theme}
                icon={<ModulesIcon color={theme.text} size={18} />}
                label="Gerenciar Módulos"
                sublabel="Ativar/desativar abas e atalhos na barra de navegação"
                onPress={() => router.push('/(auth)/modulos/gerenciar' as any)}
              />
            </View>

            {/* Aparência */}
            <SectionLabel label="Aparência" theme={theme} />
            <View style={{ borderRadius: 20, overflow: 'hidden' }}>
              <SettingRow
                isFirst
                isLast
                theme={theme}
                icon={themeStore.isDark
                  ? <MoonIcon color={theme.text} size={20} />
                  : <SunIcon color={theme.text} size={20} />
                }
                label={themeStore.isDark ? 'Modo Escuro' : 'Modo Claro'}
                sublabel="Alterne entre os temas"
                right={
                  <Switch
                    value={themeStore.isDark}
                    onValueChange={() => themeStore.toggle()}
                    trackColor={{ false: theme.background, true: theme.contrast }}
                    thumbColor="#FFFFFF"
                  />
                }
              />
            </View>

            {/* Dados */}
            <SectionLabel label="Dados" theme={theme} />
            <View style={{ borderRadius: 20, overflow: 'hidden' }}>
              <SettingRow
                isFirst
                theme={theme}
                icon={<ClipboardIcon color={theme.text} size={18} />}
                label="Total de Pedidos"
                sublabel={`${dataStore.orders.length} registrado${dataStore.orders.length !== 1 ? 's' : ''}`}
              />
              <SettingRow
                theme={theme}
                icon={<CardapioIcon color={theme.text} size={18} />}
                label="Itens no Cardápio"
                sublabel={`${dataStore.menuItems.length} item${dataStore.menuItems.length !== 1 ? 's' : ''}`}
              />
              <SettingRow
                isLast
                theme={theme}
                icon={<SpoonIcon color={theme.text} size={18} />}
                label="Ingredientes"
                sublabel={`${dataStore.ingredients.length} no estoque`}
              />
            </View>

            {/* Gerenciamento */}
            {activeRole === 'GERENTE' && (
              <>
                <SectionLabel label="Gerenciamento" theme={theme} />
                <View style={{ borderRadius: 20, overflow: 'hidden' }}>
                  <SettingRow
                    isFirst
                    theme={theme}
                    danger
                    icon={<TrashIcon color="#EF4444" size={18} />}
                    label="Apagar Pedidos"
                    sublabel="Remove todos os pedidos registrados"
                    onPress={() => setConfirmClearOrders(true)}
                  />
                  <SettingRow
                    isLast
                    theme={theme}
                    danger
                    icon={<TrashIcon color="#EF4444" size={18} />}
                    label="Limpar Tudo"
                    sublabel="Apaga pedidos, cardápio e ingredientes"
                    onPress={() => setConfirmClearAll(true)}
                  />
                </View>
              </>
            )}
          </>
        )}

        {/* Conta */}
        <SectionLabel label="Conta" theme={theme} />
        <View style={{ borderRadius: 20, overflow: 'hidden' }}>
          <SettingRow
            isFirst
            isLast
            theme={theme}
            danger
            icon={<LogOutIcon color="#EF4444" size={20} />}
            label="Sair da Conta"
            sublabel="Você precisará fazer login novamente"
            onPress={() => setConfirmLogout(true)}
          />
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: theme.text }]}>
          Almocu ADM • v1.0.0
        </Text>

      </ScrollView>

      <ConfirmModal
        visible={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Sair da Conta"
        message="Tem certeza que deseja encerrar sua sessão?"
        confirmText="Sair"
      />
      <ConfirmModal
        visible={confirmClearOrders}
        onClose={() => setConfirmClearOrders(false)}
        onConfirm={handleClearOrders}
        title="Apagar Pedidos"
        message="Todos os pedidos serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmText="Apagar"
      />
      <ConfirmModal
        visible={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={handleClearAll}
        title="Limpar Tudo"
        message="Cardápio, ingredientes e pedidos serão apagados permanentemente. Esta ação não pode ser desfeita."
        confirmText="Limpar Tudo"
      />
      <ConfirmModal
        visible={confirmRemoveWorkspace}
        onClose={() => {
          setConfirmRemoveWorkspace(false);
          setRemovingRestId('');
          setRemovingRestName('');
        }}
        onConfirm={handleRemoveWorkspace}
        title="Remover Workspace"
        message={`Tem certeza que deseja remover o restaurante "${removingRestName}" da sua lista de workspaces?`}
        confirmText="Remover"
      />
      {/* MODAL: ALTERNAR WORKSPACE (ESTILO SELECT DROP-DOWN COERENTE) */}
      <Modal
        transparent
        visible={showWorkspaceModal}
        animationType="fade"
        onRequestClose={() => setShowWorkspaceModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowWorkspaceModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
                <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 12 }]}>Seus Workspaces</Text>

                {workspaceModalError ? <InlineAlert type="error" message={workspaceModalError} /> : null}
                
                <ScrollView style={{ maxHeight: 300, marginTop: 8 }} showsVerticalScrollIndicator={false}>
                  {userWorkspaces.length > 0 ? (
                    userWorkspaces.map((item, index) => {
                      const isActive = authStore.user?.restaurantId === item.id;
                      return (
                        <View 
                          key={`my-${item.id}-${index}`}
                          style={[
                            styles.workspaceItem, 
                            { borderColor: theme.text + '15', backgroundColor: theme.background + '40', flexDirection: 'row', alignItems: 'center', padding: 0 },
                            isActive && { borderColor: theme.contrast, backgroundColor: theme.contrast + '08' }
                          ]}
                        >
                          <TouchableOpacity
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}
                            activeOpacity={0.7}
                            onPress={async () => {
                              setWorkspaceModalError('');
                              try {
                                await authStore.selectRestaurantWorkspace(item.id);
                                setShowWorkspaceModal(false);
                                Toast.show({ type: 'success', text1: `Alternado para o restaurante ${item.name}!` });
                              } catch (err: any) {
                                setWorkspaceModalError(err?.response?.data?.message || err?.message || 'Erro ao alternar workspace.');
                              }
                            }}
                          >
                            <FoodStoreIcon color={theme.text} size={20} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.workspaceItemText, { color: theme.text }, isActive && { fontWeight: '700', color: theme.contrast }]} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <Text style={{ fontSize: 11, color: theme.text, opacity: 0.5 }} numberOfLines={1}>
                                CNPJ: {(item as any).cnpj ? maskCnpj((item as any).cnpj) : '—'}
                              </Text>
                            </View>
                            {isActive && <CheckIcon color={theme.contrast} size={16} style={{ marginRight: 4 }} />}
                          </TouchableOpacity>
                          
                          {/* Remove button */}
                          <TouchableOpacity
                            style={{ paddingHorizontal: 16, paddingVertical: 14, borderLeftWidth: 1, borderLeftColor: theme.text + '08' }}
                            activeOpacity={0.7}
                            onPress={() => {
                              setShowWorkspaceModal(false);
                              setRemovingRestId(item.id);
                              setRemovingRestName(item.name);
                              setTimeout(() => setConfirmRemoveWorkspace(true), 300);
                            }}
                          >
                            <TrashIcon color="#EF4444" size={16} />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  ) : (
                    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                      <Text style={{ color: theme.text, opacity: 0.5, fontSize: 13 }}>Nenhum restaurante vinculado.</Text>
                    </View>
                  )}
                </ScrollView>

                {/* divider */}
                <View style={[styles.modalDivider, { backgroundColor: theme.text + '10' }]} />

                {/* Cohesive Action options inside modal */}
                <TouchableOpacity
                  style={[styles.modalActionRow, { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.text + '08' }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowWorkspaceModal(false);
                    setCreateModalError('');
                    setTimeout(() => setShowCreateModal(true), 300);
                  }}
                >
                  <PlusIcon color={theme.text} size={16} style={{ marginRight: 10 }} />
                  <Text style={{ fontFamily: 'Jost_600SemiBold', fontSize: 14, color: theme.text }}>
                    Criar Novo Restaurante
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionRow, { paddingVertical: 12 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowWorkspaceModal(false);
                    setJoinModalError('');
                    setTimeout(() => setShowJoinModal(true), 300);
                  }}
                >
                  <LinkIcon color={theme.text} size={16} style={{ marginRight: 10 }} />
                  <Text style={{ fontFamily: 'Jost_600SemiBold', fontSize: 14, color: theme.text }}>
                    Ingressar via Código
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: theme.background }]}
                  onPress={() => setShowWorkspaceModal(false)}
                >
                  <Text style={[styles.closeButtonText, { color: theme.text }]}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL: CRIAR NOVO RESTAURANTE */}
      <Modal
        transparent
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={() => { setCreateModalError(''); setShowCreateModal(false); }}
      >
        <TouchableWithoutFeedback onPress={() => { setCreateModalError(''); setShowCreateModal(false); }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Criar Novo Restaurante</Text>

                {createModalError ? <InlineAlert type="error" message={createModalError} /> : null}
                
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  style={{ maxHeight: 400 }}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 12 }]}
                    placeholder="Nome do Restaurante *"
                    placeholderTextColor={theme.text + '80'}
                    value={restName}
                    onChangeText={setRestName}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 12 }]}
                    placeholder="CNPJ do Restaurante * (ex: 11.444.777/0001-61)"
                    placeholderTextColor={theme.text + '80'}
                    value={restCnpj}
                    onChangeText={handleCnpjChange}
                    keyboardType="numeric"
                    maxLength={18}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 12 }]}
                    placeholder="Telefone do Restaurante *"
                    placeholderTextColor={theme.text + '80'}
                    value={restPhone}
                    onChangeText={setRestPhone}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 12 }]}
                    placeholder="Categoria (ex: Italiana, Fast Food) *"
                    placeholderTextColor={theme.text + '80'}
                    value={restCategory}
                    onChangeText={setRestCategory}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 12 }]}
                    placeholder="Endereço Completo *"
                    placeholderTextColor={theme.text + '80'}
                    value={restAddress}
                    onChangeText={setRestAddress}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 12 }]}
                    placeholder="Horários (ex: Segunda a Sábado: 11:30 às 22:00)"
                    placeholderTextColor={theme.text + '80'}
                    value={restHours}
                    onChangeText={setRestHours}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 12 }]}
                    placeholder="Taxa de Entrega padrão (ex: 7.00)"
                    placeholderTextColor={theme.text + '80'}
                    value={restFee}
                    onChangeText={setRestFee}
                    keyboardType="numeric"
                  />
                </ScrollView>

                <View style={{ gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.contrast }]}
                    onPress={handleCreateRestaurant}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Criar Restaurante (Gerente)</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.text + '30' }]}
                    onPress={() => { setCreateModalError(''); setShowCreateModal(false); }}
                  >
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL: INGRESSAR VIA CONVITE */}
      <Modal
        transparent
        visible={showJoinModal}
        animationType="slide"
        onRequestClose={() => { setJoinModalError(''); setShowJoinModal(false); }}
      >
        <TouchableWithoutFeedback onPress={() => { setJoinModalError(''); setShowJoinModal(false); }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Ingressar via Código</Text>

                {joinModalError ? <InlineAlert type="error" message={joinModalError} /> : null}

                <Text style={{ fontFamily: 'Jost_400Regular', color: theme.text, opacity: 0.6, fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                  Digite o código alfanumérico gerado pelo gerente para se vincular a outro restaurante.
                </Text>

                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.background, textAlign: 'center', fontSize: 16, fontFamily: 'Jost_600SemiBold', marginBottom: 12 }]}
                  placeholder="Digite o código alfanumérico"
                  placeholderTextColor={theme.text + '80'}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                />

                <View style={{ gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.contrast }]}
                    onPress={handleJoinRestaurant}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnText}>Ingressar no Workspace</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.text + '30' }]}
                    onPress={() => { setJoinModalError(''); setShowJoinModal(false); }}
                  >
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  profileName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 17,
  },
  profileEmail: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    opacity: 0.55,
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  planText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13,
  },
  workspaceCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
  },
  workspaceTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
  workspaceSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  formContainer: {
    gap: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Jost_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.3,
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  selectDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 10,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 13,
  },
  workspaceItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  workspaceItemText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  modalDivider: {
    height: 1,
    marginVertical: 14,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  closeButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
});
