import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoinstepHeroArtwork } from '../../components/CoinstepHeroArtwork';
import { Button, FeatureRow, colors } from '../../components/ui';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  // Staggered entrance animations
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(24));
  const [actionsSlideAnim] = useState(() => new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(actionsSlideAnim, {
        toValue: 0,
        duration: 700,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, actionsSlideAnim]);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Top 3D Hero Artwork (Pure SVG & Animated Views, No Images) */}
        <Animated.View style={[s.heroContainer, { opacity: fadeAnim }]}>
          <CoinstepHeroArtwork />
        </Animated.View>

        {/* Text Section: Title & Subtitle */}
        <Animated.View
          style={[
            s.textSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={s.title}>
            Create your <Text style={s.titleHighlight}>wallet</Text>
          </Text>
          <Text style={s.subtitle}>
            Set up a secure Coinstep wallet in minutes{'\n'}or continue with an existing one.
          </Text>
        </Animated.View>

        {/* Action Buttons Section */}
        <Animated.View
          style={[
            s.actionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: actionsSlideAnim }],
            },
          ]}
        >
          {/* Primary Create Wallet Button */}
          <Button
            title="Create Wallet"
            size="lg"
            pill
            rightIcon={<Ionicons name="arrow-forward" size={22} color="#FFFFFF" />}
            onPress={() => router.push({ pathname: '/onboarding/pin', params: { next: 'create' } })}
          />

          {/* Secondary I Already Have a Wallet Button */}
          <Button
            title="I Already Have a Wallet"
            variant="secondary"
            size="lg"
            pill
            onPress={() => router.push({ pathname: '/onboarding/pin', params: { next: 'import' } })}
          />
        </Animated.View>

        {/* Bottom Feature Highlights: Secure | Simple | Fast */}
        <Animated.View style={[s.featuresContainer, { opacity: fadeAnim }]}>
          <FeatureRow
            items={[
              {
                icon: <Ionicons name="shield-checkmark" size={17} color={colors.accent} />,
                text: 'Secure',
              },
              {
                icon: <Ionicons name="flash" size={17} color={colors.accent} />,
                text: 'Simple',
              },
              {
                icon: <Ionicons name="trending-up" size={17} color={colors.accent} />,
                text: 'Fast',
              },
            ]}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
    minHeight: SCREEN_HEIGHT - 60,
    ...(Platform.OS === 'web' ? { maxWidth: 480, width: '100%', alignSelf: 'center' as const } : {}),
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  textSection: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: colors.accent,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '400',
  },
  actionsSection: {
    width: '100%',
    gap: 14,
    marginTop: 24,
    marginBottom: 16,
  },
  featuresContainer: {
    marginTop: 'auto',
    paddingTop: 8,
    paddingBottom: 4,
  },
});
