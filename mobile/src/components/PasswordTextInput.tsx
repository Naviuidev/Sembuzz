import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOOLBAR_ICON_SIZE } from '../navigation/tabBarMetrics';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  /** Styles for the bordered field container (e.g. `styles.modalInput`). */
  inputStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export function PasswordTextInput({
  inputStyle,
  containerStyle,
  style,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.shell, inputStyle, containerStyle]}>
      <TextInput
        {...rest}
        secureTextEntry={!visible}
        style={[styles.inner, style]}
      />
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        style={styles.toggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={TOOLBAR_ICON_SIZE} color="#6c757d" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  inner: {
    flex: 1,
    paddingVertical: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    minHeight: 22,
  },
  toggle: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
