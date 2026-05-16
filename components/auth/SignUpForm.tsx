import { EmailIcon, KeyIcon, ShieldCheckIcon, UserIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FormButton } from '../shared/FormButton';
import { FormInput } from '../shared/FormInput';
import { authStore } from '../../stores/AuthStore';
import { useRouter } from 'expo-router';

import { toastStore } from '@/stores/ToastStore';

export function SignUpForm({ onToggleForm }: { onToggleForm: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const theme = useAppTheme();
  const router = useRouter();

  const styles = makeStyles(theme.text);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validatePassword = (pass: string) => {
    // Letters, numbers, and symbols
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pass);
    return hasLetters && hasNumbers && hasSymbols;
  };

  const handleRegister = () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      toastStore.show('Por favor, preencha todos os campos.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      toastStore.show('Por favor, insira um e-mail válido.', 'error');
      return;
    }

    if (!validatePassword(senha)) {
      toastStore.show('A senha deve conter letras, números e símbolos.', 'error');
      return;
    }

    if (senha !== confirmarSenha) {
      toastStore.show('As senhas não coincidem.', 'error');
      return;
    }

    try {
      authStore.register(email, senha, nome);
      toastStore.show('Conta criada com sucesso! Faça login para continuar.', 'success');
      onToggleForm();
    } catch (err: any) {
      toastStore.show(err.message || 'Erro ao realizar cadastro.', 'error');
    }
  };

  return (
    <View style={styles.container}>
      {/* Heading */}
      <View style={styles.headingBlock}>
        <Text style={styles.subtitle}>Junte-se à nós</Text>
        <Text style={styles.title}>GERENCIE, ANALISE E CRESÇA</Text>
      </View>

      {/* Inputs */}
      <View style={styles.inputBlock}>
        <FormInput
          Icon={UserIcon}
          placeholder="Nome"
          value={nome}
          onChangeText={setNome}
        />
        <FormInput
          Icon={EmailIcon}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <FormInput
          Icon={KeyIcon}
          placeholder="Senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />
        <FormInput
          Icon={ShieldCheckIcon}
          placeholder="Confirmar senha"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          onSubmitEditing={handleRegister}
        />
      </View>

      {/* Primary CTA */}
      <FormButton title="CRIE A SUA CONTA" variant="primary" onPress={handleRegister} />

      {/* Link para Login */}
      <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={onToggleForm}>
        <Text style={styles.linkText}>Entrar na conta</Text>
      </TouchableOpacity>

      {/* Social buttons */}
      <View style={styles.socialRow}>
        <FormButton variant="social" socialIcon="facebook-f" style={styles.socialCircle} />
        <FormButton variant="social" socialIcon="google" style={styles.socialCircle} />
      </View>
    </View>
  );
}

function makeStyles(textColor: string) {
  const isMobile = Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth < 768);

  return StyleSheet.create({
    container: {
      width: '100%',
      alignSelf: 'center',
    },
    errorContainer: {
      backgroundColor: '#fee2e2',
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#fecaca',
    },
    errorText: {
      color: '#dc2626',
      fontSize: 14,
      fontFamily: 'Jost_600SemiBold',
      textAlign: 'center',
    },
    headingBlock: {
      alignItems: 'center',
      marginBottom: 28,
    },
    subtitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      color: textColor,
      marginBottom: 4,
    },
    title: {
      fontFamily: 'Khand_700Bold',
      fontSize: isMobile ? 36 : 42,
      fontWeight: '700',
      color: textColor,
      textAlign: 'center',
      textTransform: 'uppercase',
      lineHeight: isMobile ? 36 : 42,
    },
    inputBlock: {
      marginBottom: 4,
    },
    linkRow: {
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 20,
    },
    linkText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: textColor,
      textDecorationLine: 'underline',
    },
    socialRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    socialCircle: {
      width: 48,
      paddingHorizontal: 0,
      marginBottom: 0,
    },
  });
}
