import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';

interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const showToast = useCallback((config: ToastConfig) => {
    setToast(config);
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [fadeAnim]);

  const getBackgroundColor = () => {
    if (!toast) return '#333';
    switch (toast.type) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View 
          style={[
            styles.container, 
            { 
              opacity: fadeAnim,
              bottom: isWeb ? 24 : 100,
              left: isWeb ? '50%' : 16,
              marginLeft: isWeb ? -100 : 0,
            }
          ]}
        >
          <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    width: 200,
  },
  toast: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});