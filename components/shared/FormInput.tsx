import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useAppTheme } from '@/themes/colors';

interface FormInputProps extends TextInputProps {
  Icon?: React.FC<{ color: string; size: number }>;
}

export function FormInput({ Icon, ...rest }: FormInputProps) {
  const theme = useAppTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.wrapper}>
      {Icon && <Icon color={theme.text} size={20} />}
      <TextInput
        style={styles.input}
        placeholderTextColor="#AAAAAA"
        {...rest}
      />
    </View>
  );
}

function makeStyles(theme: any) {
  // In light mode, use a visible dark border; in dark mode a subtle white border
  const borderColor = theme.text === '#303030'
    ? 'rgba(0, 0, 0, 0.18)'
    : 'rgba(255, 255, 255, 0.15)';

  return StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.foreground,
      borderRadius: 50,
      height: 48,
      paddingHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    input: {
      flex: 1,
      fontFamily: 'Jost_400Regular',
      fontSize: 14,
      color: theme.text,
      marginLeft: 10,
      outlineStyle: 'none',
    } as any,
  });
}
