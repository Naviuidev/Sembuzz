import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TOOLBAR_ICON_SIZE } from '../navigation/tabBarMetrics';

type IconComponent = React.ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
}>;

type Props = {
  Icon: IconComponent;
  fill: string;
};

/** Bootstrap SVGs default to 16×16 — fixed slot matches bottom tab icon size. */
export function BootstrapToolbarIcon({ Icon, fill }: Props) {
  return (
    <View style={styles.slot} pointerEvents="none">
      <Icon width={TOOLBAR_ICON_SIZE} height={TOOLBAR_ICON_SIZE} fill={fill} />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: TOOLBAR_ICON_SIZE,
    height: TOOLBAR_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
