import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform, useWindowDimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  useSharedValue 
} from 'react-native-reanimated';
import { observer } from 'mobx-react-lite';
import { toastStore } from '@/stores/ToastStore';
import { useAppTheme } from '@/themes/colors';
import { CheckIcon, InfoIcon, ShieldCheckIcon } from './Icons';

export const Toast = observer(() => {
  const { visible, message, type } = toastStore;
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(Platform.OS === 'web' ? 20 : 60, { damping: 15 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-100, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!message && !visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return theme.contrast;
    }
  };

  const getIcon = () => {
    const color = '#fff';
    const size = 20;
    switch (type) {
      case 'success': return <ShieldCheckIcon color={color} size={size} />;
      case 'error': return <InfoIcon color={color} size={size} />;
      default: return <InfoIcon color={color} size={size} />;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        animatedStyle, 
        { 
          backgroundColor: getBackgroundColor(),
          left: width > 768 ? (width - 400) / 2 : 20,
          right: width > 768 ? (width - 400) / 2 : 20,
          width: width > 768 ? 400 : width - 40,
          zIndex: 999999,
          ...(Platform.OS === 'web' ? { position: 'fixed' as any } : {}),
        }
      ]}
    >
      <View style={styles.content}>
        {getIcon()}
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    zIndex: 9999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Jost_600SemiBold',
    flex: 1,
  },
});
