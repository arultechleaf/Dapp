import { Image, StyleSheet, View } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require('../../../assets/logo.png');

/** Coinstep logo on a white rounded tile, so the dark-blue mark stays visible on the dark app background. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <View style={[s.tile, { width: size, height: size, borderRadius: size * 0.26, padding: size * 0.12 }]}>
      <Image source={LOGO} style={s.image} resizeMode="contain" accessibilityLabel="Coinstep logo" />
    </View>
  );
}

const s = StyleSheet.create({
  tile: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
