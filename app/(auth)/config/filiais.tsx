import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import Toast from 'react-native-toast-message';
import { ChevronLeftIcon, CloseIcon, PinIcon } from '@/components/shared/Icons';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { InlineAlert } from '@/components/shared/InlineAlert';

export default observer(function FiliaisScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();

  // Active Branch Simulation
  const [activeBranchId, setActiveBranchId] = useState('1');

  // Modal control
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');

  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');

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

  const handleAddBranch = () => {
    if (!nome || !cnpj || !telefone || !endereco) {
      setModalError('Por favor, preencha todos os campos.');
      return;
    }

    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!cnpjRegex.test(cnpj)) {
      setModalError('CNPJ inválido. Use o formato: 00.000.000/0000-00');
      return;
    }

    setModalError('');
    setLoading(true);

    try {
      try {
        const newBranch = dataStore.addBranch({
          name: nome,
          cnpj,
          phone: telefone,
          address: endereco,
        });

        // Reset form
        setNome('');
        setCnpj('');
        setTelefone('');
        setEndereco('');
        setModalError('');

        setModalVisible(false);
        Toast.show({ type: 'success', text1: `Filial "${newBranch.name}" adicionada com sucesso!` });
      } catch (e: any) {
        setModalError(e?.response?.data?.message || e?.message || 'Erro ao adicionar filial.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectActive = (branchId: string, branchName: string) => {
    setActiveBranchId(branchId);
    Toast.show({ type: 'success', text1: `Você mudou para a filial: ${branchName}` });
  };

  const handleRemove = (branchId: string) => {
    if (branchId === activeBranchId) {
      Toast.show({ type: 'error', text1: 'Você não pode remover a filial ativa no momento.' });
      return;
    }
    Toast.show({ type: 'info', text1: 'Removendo filial...' });
    dataStore.removeBranch(branchId);
    Toast.show({ type: 'success', text1: 'Filial removida com sucesso!' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(auth)/config' as any)}>
          <ChevronLeftIcon color={theme.text} size={24} />
          <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Gerenciar Filiais</Text>
        <TouchableOpacity 
          style={[styles.addBtnHeader, { backgroundColor: theme.contrast }]} 
          onPress={() => { setModalError(''); setModalVisible(true); }}
        >
          <Text style={styles.addBtnHeaderText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        { paddingBottom: 40 },
        isWeb && { maxWidth: 650, width: '100%', alignSelf: 'center' }
      ]}>

        <Text style={styles.sectionTitle}>Filiais Cadastradas ({dataStore.branches.length})</Text>

        {dataStore.branches.length > 0 ? (
          <View style={styles.grid}>
            {dataStore.branches.map((branch) => {
              const isActive = branch.id === activeBranchId;
              return (
                <View key={branch.id} style={[styles.branchCard, { backgroundColor: theme.foreground }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.branchName, { color: theme.text }]}>{branch.name}</Text>
                      <Text style={[styles.branchCnpj, { color: theme.text }]}>CNPJ: {branch.cnpj}</Text>
                    </View>
                    {isActive ? (
                      <View style={[styles.activeBadge, { backgroundColor: theme.contrast + '20' }]}>
                        <Text style={[styles.activeBadgeText, { color: theme.contrast }]}>Ativa</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.switchBtn} 
                        onPress={() => handleSelectActive(branch.id, branch.name)}
                      >
                        <Text style={[styles.switchBtnText, { color: theme.text }]}>Alternar</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardInfoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>Telefone</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{branch.phone}</Text>
                  </View>

                  <View style={styles.cardInfoRow}>
                    <Text style={[styles.infoLabel, { color: theme.text }]}>Endereço</Text>
                    <Text style={[styles.infoValue, { color: theme.text, flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                      {branch.address}
                    </Text>
                  </View>

                  {!isActive && (
                    <TouchableOpacity 
                      style={styles.deleteLink} 
                      onPress={() => handleRemove(branch.id)}
                    >
                      <Text style={styles.deleteLinkText}>Excluir filial</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text }]}>Nenhuma filial cadastrada.</Text>
            <Text style={[styles.emptySub, { color: theme.text }]}>Adicione filiais para expandir seu negócio no sistema!</Text>
          </View>
        )}

      </ScrollView>

      {/* Add Branch Modal Form */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => { setModalError(''); setModalVisible(false); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.foreground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Cadastrar Nova Filial</Text>
              <TouchableOpacity onPress={() => { setModalError(''); setModalVisible(false); }}>
                <CloseIcon color={theme.text} size={24} style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            </View>

            {modalError ? <InlineAlert type="error" message={modalError} /> : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalDesc, { color: theme.text }]}>Insira os dados cadastrais da nova filial do seu restaurante.</Text>
              
              <View style={styles.inputGroup}>
                <FormInput
                  placeholder="Nome Comercial da Filial"
                  value={nome}
                  onChangeText={setNome}
                />
                <FormInput
                  placeholder="CNPJ da Filial (00.000.000/0000-00)"
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
                  placeholder="Endereço Comercial Completo (CEP, Rua, Número...)"
                  value={endereco}
                  onChangeText={setEndereco}
                />
              </View>

              <View style={{ marginTop: 24, gap: 10 }}>
                <FormButton
                  title={loading ? 'SALVANDO...' : 'CADASTRAR FILIAL'}
                  variant="primary"
                  onPress={handleAddBranch}
                  disabled={loading}
                />
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setModalError(''); setModalVisible(false); }}>
                  <Text style={[styles.modalCancelBtnText, { color: theme.text }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
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
  addBtnHeader: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnHeaderText: {
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
    marginLeft: 4,
  },
  grid: {
    gap: 16,
  },
  branchCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#9CA3AF22',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  branchName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
  },
  branchCnpj: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 11,
  },
  switchBtn: {
    backgroundColor: '#9CA3AF22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  switchBtnText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 11,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: '#9CA3AF22',
    marginVertical: 14,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 13,
    opacity: 0.6,
  },
  infoValue: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
  },
  deleteLink: {
    alignSelf: 'flex-end',
    marginTop: 10,
    padding: 4,
  },
  deleteLinkText: {
    fontFamily: 'Jost_600SemiBold',
    color: '#EF4444',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
  modalDesc: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 2,
  },
  modalCancelBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9CA3AF15',
  },
  modalCancelBtnText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
    opacity: 0.8,
  },
});
