import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { authStore } from '@/stores/AuthStore';
import { toastStore } from '@/stores/ToastStore';
import { ChevronLeftIcon, UserIcon, EmailIcon, KeyIcon } from '@/components/shared/Icons';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';

export default observer(function EditPerfilScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();

  // Initial values from Store
  const [nome, setNome] = useState(authStore.user?.name || '');
  const [email, setEmail] = useState(authStore.user?.email || '');
  
  // Credentials verification
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (!nome || !email) {
      toastStore.show('Preencha os campos Nome e E-mail.', 'error');
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      toastStore.show('Preencha um e-mail válido.', 'error');
      return;
    }

    // Se o usuário deseja mudar e-mail ou senha, precisamos validar a senha atual
    const emailChanged = email.toLowerCase().trim() !== authStore.user?.email;
    const passwordChanging = !!novaSenha;

    if (emailChanged || passwordChanging) {
      if (!senhaAtual) {
        toastStore.show('Digite sua senha atual para autorizar as alterações.', 'error');
        return;
      }

      // Validar senha atual
      const currentUserData = authStore.users.find(u => u.email === authStore.user?.email);
      if (currentUserData && currentUserData.password !== senhaAtual) {
        toastStore.show('Senha atual incorreta.', 'error');
        return;
      }
    }

    if (passwordChanging) {
      if (novaSenha.length < 6) {
        toastStore.show('A nova senha deve ter ao menos 6 caracteres.', 'error');
        return;
      }
      if (novaSenha !== confirmarSenha) {
        toastStore.show('As senhas não coincidem.', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      // Atualizar perfil
      authStore.updateProfile(nome, email, novaSenha || undefined);
      toastStore.show('Perfil atualizado com sucesso!', 'success');
      
      // Limpar campos de senha
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
      // Voltar
      router.push('/(auth)/config/perfil' as any);
    } catch (err: any) {
      toastStore.show(err.message || 'Erro ao salvar perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeftIcon color={theme.text} size={24} />
          <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Editar Perfil</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        { paddingBottom: 40 },
        isWeb && { maxWidth: 500, width: '100%', alignSelf: 'center' }
      ]}>

        <View style={[styles.card, { backgroundColor: theme.foreground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Dados Pessoais</Text>
          <Text style={[styles.cardDesc, { color: theme.text }]}>Edite as informações básicas da sua conta de acesso.</Text>
          
          <View style={styles.inputGroup}>
            <FormInput
              Icon={UserIcon}
              placeholder="Nome Completo"
              value={nome}
              onChangeText={setNome}
            />
            <FormInput
              Icon={EmailIcon}
              placeholder="E-mail principal"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.foreground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Alterar Senha</Text>
          <Text style={[styles.cardDesc, { color: theme.text }]}>Deixe em branco caso não queira alterar sua senha atual.</Text>
          
          <View style={styles.inputGroup}>
            <FormInput
              Icon={KeyIcon}
              placeholder="Nova Senha (min. 6 dígitos)"
              secureTextEntry
              value={novaSenha}
              onChangeText={setNovaSenha}
            />
            <FormInput
              Icon={KeyIcon}
              placeholder="Confirmar Nova Senha"
              secureTextEntry
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />
          </View>
        </View>

        {/* Re-auth confirmation required */}
        {(email.toLowerCase().trim() !== authStore.user?.email || !!novaSenha) && (
          <View style={[styles.card, { backgroundColor: theme.foreground, borderColor: theme.contrast + '30', borderWidth: 1 }]}>
            <Text style={[styles.cardTitle, { color: theme.contrast }]}>Autorização de Segurança</Text>
            <Text style={[styles.cardDesc, { color: theme.text }]}>Insira sua senha de acesso atual para confirmar as alterações importantes.</Text>
            
            <View style={styles.inputGroup}>
              <FormInput
                Icon={KeyIcon}
                placeholder="Senha de Acesso Atual"
                secureTextEntry
                value={senhaAtual}
                onChangeText={setSenhaAtual}
              />
            </View>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          <FormButton
            title={loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
            variant="primary"
            onPress={handleSave}
            disabled={loading}
          />
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
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    opacity: 0.5,
    marginBottom: 16,
  },
  inputGroup: {
    gap: 2,
  },
});
