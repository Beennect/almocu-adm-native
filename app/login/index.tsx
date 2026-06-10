import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { LogoPotIcon, SacIcon } from '@/components/shared/Icons';
import { useAppTheme } from '@/themes/colors';
import { AlmocuIcon } from '@/components/shared/Icons';



export default function Login() {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const { background, foreground, contrast, text } = theme;
  const isWebLayout = width >= 768;
  const [isLogin, setIsLogin] = useState(true);

  const styles = makeStyles(background, foreground, contrast, text, isWebLayout);

  const toggleForm = () => setIsLogin(!isLogin);

  if (isWebLayout) {
    return (
      <View style={styles.webRoot}>
        {/* Blobs */}
        <LinearGradient
          colors={['transparent', contrast]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[styles.blob, styles.blobTopRight]}
        />
        <LinearGradient
          colors={['transparent', contrast]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.blob, styles.blobBottomLeft]}
        />

        {/* Header */}
        <View style={styles.webHeader}>
          <View style={styles.logoRow}>
            <AlmocuIcon color={contrast} size={128} />
          </View>
        </View>

        {/* Card centralizado */}
        <View style={styles.webCenter}>
          <View style={styles.webCard}>
            {isLogin ? (
              <LoginForm onToggleForm={toggleForm} />
            ) : (
              <SignUpForm onToggleForm={toggleForm} />
            )}
          </View>
        </View>

        {/* Rodapé SAC */}
        <View style={styles.webFooter}>
          <SacIcon color={contrast} size={22} />
          <Text style={styles.sacText}>SAC</Text>
        </View>
      </View>
    );
  }

  // ── Mobile ──────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mobileContent}>
        <View style={styles.mobileLogoRow}>
          <AlmocuIcon color={contrast} size={128} />
        </View>

        <View style={styles.formContainer}>
          {isLogin ? (
            <LoginForm onToggleForm={toggleForm} />
          ) : (
            <SignUpForm onToggleForm={toggleForm} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(background: string, foreground: string, contrast: string, text: string, isWeb: boolean) {
  return StyleSheet.create({
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
      opacity: 0.15, // Reduced opacity for cleaner look in dark mode
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
      paddingHorizontal: 32,
      paddingTop: 24,
      paddingBottom: 8,
      zIndex: 10,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoText: {
      fontFamily: 'Jost_700Bold',
      color: contrast,
      fontSize: 20,
      marginLeft: 8,
    },
    webCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      paddingHorizontal: 20,
    },
    webCard: {
      backgroundColor: foreground,
      borderRadius: 30,
      borderWidth: 1, // Subtle border instead of thick foreground border
      borderColor: background,
      paddingVertical: 40,
      paddingHorizontal: 36,
      width: '100%',
      maxWidth: 440,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5,
    },
    webFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: 32,
      paddingBottom: 24,
      gap: 6,
      zIndex: 10,
    },
    sacText: {
      fontFamily: 'Jost_700Bold',
      color: contrast,
      fontSize: 14,
    },
    safe: {
      flex: 1,
      backgroundColor: background,
      paddingHorizontal: 24,
      paddingTop: 20,
    },
    mobileContent: {
      flex: 1,
    },
    mobileLogoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 60,
    },
    formContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: 80,
    },
  });
}
