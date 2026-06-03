import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useAppTheme } from '@/themes/colors';
import { permissionStore, Ability } from '@/stores/PermissionStore';
import { FormButton } from './FormButton';
import { AlertIcon } from './Icons';

interface ProtectedRouteProps {
  /** Ability(s) necessária(s) para acessar o conteúdo. */
  abilities: Ability | Ability[];
  /** Se true, todas as abilities devem estar presentes (AND). Se false (padrão), qualquer uma (OR). */
  requireAll?: boolean;
  /** Fallback opcional em vez do padrão "Acesso Negado". */
  fallback?: React.ReactNode;
  /** Se true, redireciona para o dashboard em vez de mostrar tela de erro. */
  redirect?: boolean;
  children: React.ReactNode;
}

/**
 * Componente que protege partes da UI baseado em abilities do PermissionStore.
 *
 * Uso:
 * ```tsx
 * <ProtectedRoute abilities="staff:view">
 *   <StaffList />
 * </ProtectedRoute>
 *
 * <ProtectedRoute abilities={['menu:create', 'menu:edit']}>
 *   <ProductForm />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute = observer(function ProtectedRoute({
  abilities,
  requireAll = false,
  fallback,
  redirect = false,
  children,
}: ProtectedRouteProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const abilityList = Array.isArray(abilities) ? abilities : [abilities];

  const hasAccess = requireAll
    ? permissionStore.canAll(...abilityList)
    : permissionStore.canAny(...abilityList);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (redirect) {
    router.replace('/(auth)/dashboard');
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AlertIcon color={theme.contrast} size={48} />
      <Text style={[styles.title, { color: theme.text }]}>Acesso Negado</Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Você não tem permissão para acessar esta funcionalidade.
      </Text>
      <FormButton
        title="Voltar ao início"
        onPress={() => router.replace('/(auth)/dashboard')}
        style={styles.button}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
    minWidth: 180,
  },
});
