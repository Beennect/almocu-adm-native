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
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { useAppTheme } from '@/themes/colors';
import {
  AlmocuIcon,
  EmailIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  UserIcon,
  ShieldCheckIcon,
} from '@/components/shared/Icons';
import Toast from 'react-native-toast-message';
import { withLoading } from '@/utils/toast';
import { authStore } from '@/stores/AuthStore';

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const { background, foreground, contrast, text } = theme;
  const isWeb = width >= 768;
  const router = useRouter();

  // Campos de Usuário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Visibilidade das senhas (default: escondidas)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const styles = makeStyles(background, foreground, contrast, text, isWeb);

  const validate = () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Toast.show({ type: 'error', text1: 'Por favor, preencha todos os campos.' });
      return false;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Toast.show({ type: 'error', text1: 'Por favor, insira um e-mail válido.' });
      return false;
    }
    if (senha.length < 6) {
      Toast.show({ type: 'error', text1: 'A senha deve conter ao menos 6 caracteres.' });
      return false;
    }
    if (senha !== confirmarSenha) {
      Toast.show({ type: 'error', text1: 'As senhas não coincidem.' });
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await withLoading(
        async () => {
          await authStore.register(email, senha, nome);
          await authStore.login(email, senha);
          router.replace('/(auth)/dashboard' as any);
        },
        { loading: 'Criando conta...', success: 'Conta criada com sucesso!', error: 'Erro ao efetuar cadastro.' }
      );
    } catch {
      // Erro já exibido pelo withLoading
    }
  };

  const formHeading = (
    <View style={styles.headingBlock}>
      <Text style={styles.subtitle}>Comece agora mesmo</Text>
      <Text style={styles.title}>CRIE SUA CONTA NO ALMOCU</Text>
      <Text style={styles.description}>Preencha os dados abaixo para criar sua conta empresarial.</Text>
    </View>
  );

  const formFields = (
    <View style={styles.inputBlock}>
      <FormInput Icon={UserIcon} placeholder="Seu Nome Completo" value={nome} onChangeText={setNome} />
      <FormInput Icon={EmailIcon} placeholder="Seu Melhor E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <FormInput
        Icon={KeyIcon}
        placeholder="Senha de Acesso"
        secureTextEntry={!showPassword}
        value={senha}
        onChangeText={setSenha}
        RightIcon={showPassword ? EyeOffIcon : EyeIcon}
        onRightIconPress={() => setShowPassword((prev) => !prev)}
      />
      <FormInput
        Icon={ShieldCheckIcon}
        placeholder="Confirmar Senha"
        secureTextEntry={!showConfirmPassword}
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        RightIcon={showConfirmPassword ? EyeOffIcon : EyeIcon}
        onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
      />
    </View>
  );

  // ── Web: layout com card centralizado e blobs decorativos ──────────────
  if (isWeb) {
    return (
      <View style={styles.webRoot}>
        <LinearGradient colors={['transparent', contrast]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={[styles.blob, styles.blobTopRight]} />
        <LinearGradient colors={['transparent', contrast]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.blob, styles.blobBottomLeft]} />

        <View style={styles.webHeader}>
          <AlmocuIcon color={contrast} size={128} />
          <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8} onPress={() => router.push('/login' as any)}>
            <Text style={styles.loginBtnText}>Já tenho uma conta</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={styles.webScrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.webCard, { backgroundColor: foreground }]}>
            {formHeading}
            {formFields}
            <FormButton
              title="CRIAR CONTA BUSINESS"
              variant="primary"
              onPress={handleRegister}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Mobile: layout full-screen, sem aparência de modal ─────────────────
  return (
    <SafeAreaView style={styles.mobileRoot}>
      <View style={styles.mobileHeader}>
        <AlmocuIcon color={contrast} size={90} />
      </View>

      <ScrollView
        contentContainerStyle={styles.mobileScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {formHeading}
        {formFields}
        <FormButton
          title="CRIAR CONTA BUSINESS"
          variant="primary"
          onPress={handleRegister}
        />
      </ScrollView>

      <View style={styles.mobileFooter}>
        <Text style={{ color: text, opacity: 0.6, fontSize: 14 }}>Já tem uma conta? </Text>
        <TouchableOpacity onPress={() => router.push('/login' as any)}>
          <Text style={{ color: contrast, fontFamily: 'Jost_700Bold', fontSize: 14 }}>Faça Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(background: string, foreground: string, contrast: string, text: string, isWeb: boolean) {
  const isMobile = !isWeb;
  return StyleSheet.create({
    // ── Web ──────────────────────────────────────────────────────────────
    webRoot: {
      flex: 1,
      backgroundColor: background,
      minHeight: Platform.OS === 'web' ? '100vh' : '100%' as any,
      overflow: 'hidden',
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
    webScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 40,
    },
    webCard: {
      borderRadius: 30,
      borderWidth: 1,
      borderColor: background,
      paddingVertical: 40,
      paddingHorizontal: 36,
      width: '100%',
      maxWidth: 500,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 25,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
      zIndex: 10,
    },
    // ── Mobile ───────────────────────────────────────────────────────────
    mobileRoot: {
      flex: 1,
      backgroundColor: background,
    },
    mobileHeader: {
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 16,
    },
    mobileScrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 24,
      justifyContent: 'center',
    },
    mobileFooter: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 16,
    },
    // ── Compartilhado (heading, inputs) ──────────────────────────────────
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
    inputBlock: {
      marginBottom: 24,
    },
  });
}
