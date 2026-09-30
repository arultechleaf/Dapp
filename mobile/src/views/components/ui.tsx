import type { ReactNode } from 'react';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { Status } from '../../models/types';

export const colors = {
  bg: '#030816',
  surface: '#050D1A',
  card: '#0A152B',
  cardHighlight: '#0F1F3D',
  border: '#122544',
  borderLight: '#1E365E',
  text: '#FFFFFF',
  muted: '#8496AC',
  textSecondary: '#8496AC',
  primary: '#0077E6',
  primaryDark: '#005CB0',
  primaryLight: '#38BDF8',
  accent: '#00A3FF',
  accentCyan: '#38BDF8',
  secondaryBg: '#050D1A',
  secondaryBorder: '#0E2749',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

export function Screen({
  children,
  refreshing,
  onRefresh,
  contentStyle,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function Card({
  title,
  subtitle,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
  rightIcon,
  pill = true,
  size = 'md',
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  icon?: ReactNode;
  rightIcon?: ReactNode;
  pill?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const inactive = disabled || loading;
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 35,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={inactive}
        style={({ pressed }) => [
          styles.button,
          size === 'sm' && styles.buttonSm,
          size === 'lg' && styles.buttonLg,
          pill && styles.buttonPill,
          variant === 'primary' && styles.buttonPrimary,
          variant === 'secondary' && styles.buttonSecondary,
          variant === 'outline' && styles.buttonOutline,
          variant === 'danger' && styles.buttonDanger,
          variant === 'ghost' && styles.buttonGhost,
          (pressed || inactive) && { opacity: inactive ? 0.5 : 0.88 },
          Platform.OS === 'web' ? ({ cursor: inactive ? 'not-allowed' : 'pointer' } as any) : null,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.text} />
        ) : (
          <View style={styles.buttonContent}>
            {icon ? <View style={styles.buttonIconLeft}>{icon}</View> : null}
            <Text
              style={[
                styles.buttonText,
                size === 'sm' && styles.buttonTextSm,
                size === 'lg' && styles.buttonTextLg,
                variant === 'outline' && { color: colors.primary },
                variant === 'secondary' && { color: colors.text },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {rightIcon ? <View style={styles.buttonIconRight}>{rightIcon}</View> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error ? styles.inputError : undefined,
          props.style,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Row({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, mono && styles.mono]} selectable>
        {value}
      </Text>
    </View>
  );
}

export type { Status };

export function StatusMessage({ status }: { status: Status }) {
  if (!status) return null;
  const color =
    status.kind === 'success' ? colors.success : status.kind === 'error' ? colors.danger : colors.muted;
  return (
    <Text style={[styles.status, { color }]} selectable>
      {status.text}
    </Text>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function FeatureRow({
  items,
}: {
  items: Array<{ icon: ReactNode; text: string }>;
}) {
  return (
    <View style={styles.featureRow}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <View style={styles.featureItem}>
            {item.icon}
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
          {index < items.length - 1 ? <View style={styles.featureDivider} /> : null}
        </React.Fragment>
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
    ...(Platform.OS === 'web' ? { maxWidth: 480, width: '100%', alignSelf: 'center' as const } : {}),
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  cardHeader: { gap: 4 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  cardSubtitle: { color: colors.muted, fontSize: 13 },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: 14,
  },
  buttonPill: {
    borderRadius: 28,
  },
  buttonSm: {
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonLg: {
    minHeight: 58,
    paddingVertical: 16,
    paddingHorizontal: 26,
    borderRadius: 30,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonSecondary: {
    backgroundColor: colors.secondaryBg,
    borderColor: colors.secondaryBorder,
    borderWidth: 1.5,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  buttonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  buttonTextSm: {
    fontSize: 14,
  },
  buttonTextLg: {
    fontSize: 17,
  },
  buttonIconLeft: {
    marginRight: 8,
  },
  buttonIconRight: {
    marginLeft: 8,
    position: 'absolute',
    right: 4,
  },
  label: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  value: { color: colors.text, fontSize: 15, flexShrink: 1, textAlign: 'right' },
  mono: { fontFamily: 'monospace', fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  status: { fontSize: 14, lineHeight: 20 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
  },
  featureText: {
    color: colors.accentCyan,
    fontSize: 14,
    fontWeight: '600',
  },
  featureDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
  },
});
