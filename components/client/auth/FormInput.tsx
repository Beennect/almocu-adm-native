import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useAppTheme } from '@/themes/colors';

interface FormInputProps extends TextInputProps {
  Icon?: React.FC<{ color: string; size: number }>;
}

export function FormInput({ Icon, ...rest }: FormInputProps) {
  const theme = useAppTheme();
  const styles = makeStyles(theme.text, theme.foreground);

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

function makeStyles(textColor: string, foreground: string) {
  return StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: foreground,
      borderRadius: 50,
      height: 48,
      paddingHorizontal: 16,
      marginBottom: 12,
      // shadow
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
      color: textColor,
      marginLeft: 10,
      outlineStyle: 'none',
    } as any,
  });
}
