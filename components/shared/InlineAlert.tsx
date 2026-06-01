import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/themes/colors';

export type InlineAlertType = 'error' | 'success' | 'info';

interface InlineAlertProps {
  type?: InlineAlertType;
  message: string;
}

const TYPE_PRESETS: Record<InlineAlertType, { bg: string; border: string; text: string; icon: string }> = {
  error:   { bg: 'rgba(239, 68, 68, 0.10)',  border: 'rgba(239, 68, 68, 0.40)',  text: '#EF4444', icon: '⚠' },
  success: { bg: 'rgba(16, 185, 129, 0.10)', border: 'rgba(16, 185, 129, 0.40)', text: '#10B981', icon: '✓' },
  info:    { bg: 'rgba(255, 95, 47, 0.10)',  border: 'rgba(255, 95, 47, 0.40)',  text: '#FF5F2F', icon: 'ⓘ' },
};

export function InlineAlert({ type = 'error', message }: InlineAlertProps) {
  const theme = useAppTheme();
  const preset = TYPE_PRESETS[type];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: preset.bg, borderColor: preset.border },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Text style={[styles.icon, { color: preset.text }]}>{preset.icon}</Text>
      <Text style={[styles.message, { color: theme.text }]} numberOfLines={3}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  icon: {
    fontFamily: 'Jost_700Bold',
    fontSize: 16,
    lineHeight: 18,
  },
  message: {
    flex: 1,
    fontFamily: 'Jost_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
});
