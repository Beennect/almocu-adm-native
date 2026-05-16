import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { useAppTheme } from '@/themes/colors';
import {
  AlmocuIcon,
  EmailIcon,
  KeyIcon,
  UserIcon,
  ShieldCheckIcon,
} from '@/components/shared/Icons';
import { toastStore } from '@/stores/ToastStore';
import { authStore } from '@/stores/AuthStore';

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const { background, foreground, contrast, text } = theme;
  const isWeb = width >= 768;
  const router = useRouter();

  // Seleção de Tipo de Conta: 'client' | 'business'
  const [accountType, setAccountType] = useState<'client' | 'business'>('business');

  // Campos de Usuário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const styles = makeStyles(background, foreground, contrast, text, isWeb);

  const validate = () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      toastStore.show('Por favor, preencha todos os campos.', 'error');
      return false;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      toastStore.show('Por favor, insira um e-mail válido.', 'error');
      return false;
    }
    if (senha.length < 6) {
      toastStore.show('A senha deve conter ao menos 6 caracteres.', 'error');
      return false;
    }
    if (senha !== confirmarSenha) {
      toastStore.show('As senhas não coincidem.', 'error');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await authStore.register(email, senha, nome, accountType);
      await authStore.login(email, senha);

      toastStore.show('Conta criada com sucesso!', 'success');
      router.replace('/(auth)/dashboard' as any);
    } catch (err: any) {
      toastStore.show(err.message || 'Erro ao efetuar cadastro.', 'error');
    }
  };

  return (
    <View style={styles.root}>
      {/* Design blobs for Web Layout */}
      {isWeb && (
        <>
          <LinearGradient colors={['transparent', contrast]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={[styles.blob, styles.blobTopRight]} />
          <LinearGradient colors={['transparent', contrast]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.blob, styles.blobBottomLeft]} />
        </>
      )}

      {/* Web Header */}
      {isWeb && (
        <View style={styles.webHeader}>
          <AlmocuIcon color={contrast} size={128} />
          <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8} onPress={() => router.push('/login' as any)}>
            <Text style={styles.loginBtnText}>Já tenho uma conta</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!isWeb && (
          <View style={styles.mobileHeader}>
            <AlmocuIcon color={contrast} size={90} />
          </View>
        )}

        <View style={[styles.card, { backgroundColor: foreground }]}>
          <View style={styles.headingBlock}>
            <Text style={styles.subtitle}>Comece agora mesmo</Text>
            <Text style={styles.title}>CRIE SUA CONTA NO ALMOCU</Text>
            <Text style={styles.description}>Escolha o tipo de conta ideal e preencha os dados abaixo.</Text>
          </View>

          {/* Abas Simples para Seleção de Tipo de Conta */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                accountType === 'business' && styles.tabBtnActive,
                { borderBottomColor: accountType === 'business' ? contrast : 'transparent' }
              ]}
              onPress={() => setAccountType('business')}
            >
              <Text style={[styles.tabText, { color: text }, accountType === 'business' && { color: contrast, fontWeight: '700' }]}>
                Conta Business
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                accountType === 'client' && styles.tabBtnActive,
                { borderBottomColor: accountType === 'client' ? contrast : 'transparent' }
              ]}
              onPress={() => setAccountType('client')}
            >
              <Text style={[styles.tabText, { color: text }, accountType === 'client' && { color: contrast, fontWeight: '700' }]}>
                Conta Cliente
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputBlock}>
            <FormInput Icon={UserIcon} placeholder="Seu Nome Completo" value={nome} onChangeText={setNome} />
            <FormInput Icon={EmailIcon} placeholder="Seu Melhor E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <FormInput Icon={KeyIcon} placeholder="Senha de Acesso" secureTextEntry value={senha} onChangeText={setSenha} />
            <FormInput Icon={ShieldCheckIcon} placeholder="Confirmar Senha" secureTextEntry value={confirmarSenha} onChangeText={setConfirmarSenha} />
          </View>

          <FormButton 
            title={accountType === 'business' ? "CRIAR CONTA BUSINESS" : "CRIAR CONTA CLIENTE"} 
            variant="primary" 
            onPress={handleRegister} 
          />
        </View>

        {/* Mobile footer links */}
        {!isWeb && (
          <View style={styles.mobileFooter}>
            <Text style={{ color: text, opacity: 0.6, fontSize: 14 }}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.push('/login' as any)}>
              <Text style={{ color: contrast, fontFamily: 'Jost_700Bold', fontSize: 14 }}>Faça Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(background: string, foreground: string, contrast: string, text: string, isWeb: boolean) {
  const isMobile = !isWeb;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: background,
      minHeight: Platform.OS === 'web' ? '100vh' : '100%' as any,
    },
    blob: {
      position: 'absolute',
      width: 1000,
      height: 860,
      borderRadius: 500,
      opacity: 0.15,
    },
    blobTopRight: {
      top: -480,
      right: -500,
    },
    blobBottomLeft: {
      bottom: -480,
      left: -500,
    },
    webHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 40,
      paddingTop: 32,
      paddingBottom: 8,
      zIndex: 10,
    },
    loginBtn: {
      backgroundColor: contrast,
      borderRadius: 50,
      paddingHorizontal: 28,
      paddingVertical: 12,
    },
    loginBtnText: {
      fontFamily: 'Jost_700Bold',
      color: '#FFFFFF',
      fontSize: 15,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isWeb ? 40 : 20,
      paddingVertical: 40,
    },
    mobileHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    card: {
      borderRadius: 30,
      borderWidth: 1,
      borderColor: background,
      paddingVertical: 40,
      paddingHorizontal: isWeb ? 36 : 24,
      width: '100%',
      maxWidth: 500,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 25,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
      zIndex: 10,
    },
    headingBlock: {
      alignItems: 'center',
      marginBottom: 24,
    },
    subtitle: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 14,
      color: text,
      opacity: 0.6,
      marginBottom: 4,
    },
    title: {
      fontFamily: 'Khand_700Bold',
      fontSize: isMobile ? 26 : 30,
      fontWeight: '700',
      color: text,
      textAlign: 'center',
      textTransform: 'uppercase',
      lineHeight: isMobile ? 26 : 30,
      marginBottom: 6,
    },
    description: {
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: text,
      opacity: 0.6,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: text + '15',
      marginBottom: 24,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
    },
    tabBtnActive: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 15,
    },
    inputBlock: {
      marginBottom: 24,
    },
    mobileFooter: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
  });
}