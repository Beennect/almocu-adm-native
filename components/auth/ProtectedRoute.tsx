import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import React, { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E6E6E6" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
});