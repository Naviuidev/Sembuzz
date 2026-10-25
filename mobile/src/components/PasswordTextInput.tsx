import React, { useMemo, useState } from 'react';
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

/** Applied to the TextInput — Android ignores `color` on the wrapper View for secureTextEntry. */
const DEFAULT_PASSWORD_TEXT: TextStyle = {
  color: '#1a1f2e',
  fontSize: 16,
};

const TEXT_STYLE_KEYS = new Set([
  'color',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textAlignVertical',
  'includeFontPadding',
  'writingDirection',
]);

function splitFieldStyles(style: StyleProp<ViewStyle>): {
  container: ViewStyle;
  text: TextStyle;
} {
  const flat = StyleSheet.flatten(style) ?? {};
  const container: ViewStyle = {};
  const text: TextStyle = {};
  for (const key of Object.keys(flat) as (keyof typeof flat)[]) {
    const value = flat[key];
    if (value === undefined) continue;
    if (TEXT_STYLE_KEYS.has(key) || key.startsWith('font')) {
      (text as Record<string, unknown>)[key] = value;
    } else {
      (container as Record<string, unknown>)[key] = value;
    }
  }
  return { container, text };
}

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  /** Border/background/padding (e.g. `styles.modalInput`). Text color is applied to the input. */
  inputStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export function PasswordTextInput({
  inputStyle,
  containerStyle,
  style,
  placeholderTextColor = '#8e8e8e',
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);

  const { container, text } = useMemo(() => splitFieldStyles(inputStyle), [inputStyle]);

  return (
    <View style={[styles.shell, container, containerStyle]}>
      <TextInput
        {...rest}
        secureTextEntry={!visible}
        placeholderTextColor={placeholderTextColor}
        style={[styles.inner, DEFAULT_PASSWORD_TEXT, text, style]}
        underlineColorAndroid="transparent"
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
