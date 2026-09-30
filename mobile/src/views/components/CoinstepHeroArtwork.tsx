import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { colors } from './ui';

export function CoinstepHeroArtwork() {
  // Floating animation for wallet & coins
  const [floatAnim] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(0));
  const [rotateAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Gentle floating loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for glow and shield
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow subtle rotation for orbital ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, [floatAnim, pulseAnim, rotateAnim]);

  const walletTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const btcTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 6],
  });

  const ethTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [5, -7],
  });

  const solTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 5],
  });

  const bnbTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, -5],
  });

  const shieldScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.03],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Brand Header: Logo + Coinstep Text */}
      <View style={styles.brandRow}>
        <View style={styles.logoIconContainer}>
          <Svg width={36} height={36} viewBox="0 0 44 44">
            <Defs>
              <LinearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" />
                <Stop offset="100%" stopColor="#0066FF" />
              </LinearGradient>
            </Defs>
            {/* Outer circular badge */}
            <Circle cx="22" cy="22" r="20" stroke="url(#logoGrad)" strokeWidth="3" fill="none" opacity="0.9" />
            {/* Stylized S / lightning crypto insignia */}
            <Path
              d="M22 6 L26 14 L21 14 L25 22 L17 22 L22 14 L18 14 Z"
              fill="url(#logoGrad)"
              opacity="0.35"
            />
            <Path
              d="M26 13 C23 10 17 11 16 15 C15 20 28 19 27 26 C26 31 19 32 15 29 M21 9 L21 33"
              stroke="#00E5FF"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </View>
        <Text style={styles.brandText}>Coinstep</Text>
      </View>

      {/* Main 3D Artwork Scene */}
      <View style={styles.sceneContainer}>
        {/* Ambient Cosmic Background Glow */}
        <Animated.View style={[styles.cosmicGlow, { opacity: glowOpacity }]} />

        {/* Orbiting Neon Cyan Rings (SVG) */}
        <View style={styles.ringsOverlay} pointerEvents="none">
          <Svg width={340} height={260} viewBox="0 0 340 260">
            <Defs>
              <LinearGradient id="neonRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.95" />
                <Stop offset="50%" stopColor="#0077FF" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#00F0FF" stopOpacity="0.95" />
              </LinearGradient>
              <LinearGradient id="pedestalGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#00D2FF" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#021028" stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Orbiting perspective rings */}
            <Ellipse
              cx="170"
              cy="165"
              rx="135"
              ry="42"
              stroke="url(#neonRing)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="14 6"
              opacity="0.85"
            />
            <Ellipse
              cx="170"
              cy="165"
              rx="148"
              ry="48"
              stroke="#00E5FF"
              strokeWidth="1"
              fill="none"
              opacity="0.35"
            />

            {/* Pedestal Rock Platform */}
            <G transform="translate(0, 140)">
              {/* Pedestal top rim glow */}
              <Ellipse cx="170" cy="48" rx="100" ry="24" fill="url(#pedestalGlow)" opacity="0.6" />
              <Ellipse cx="170" cy="48" rx="92" ry="20" fill="#061226" stroke="#00E5FF" strokeWidth="2" />
              {/* Rock facets */}
              <Polygon points="78,48 110,95 170,105 170,48" fill="#040C1A" opacity="0.9" />
              <Polygon points="170,48 170,105 230,95 262,48" fill="#07152E" opacity="0.9" />
              <Polygon points="110,95 170,105 230,95 240,118 100,118" fill="#020814" />
              {/* Glowing rim accent lines */}
              <Path d="M78 48 Q170 70 262 48" stroke="#00F2FF" strokeWidth="2.5" fill="none" opacity="0.9" />
            </G>
          </Svg>
        </View>

        {/* Central 3D Leather Wallet (Floating) */}
        <Animated.View style={[styles.walletWrapper, { transform: [{ translateY: walletTranslateY }] }]}>
          <Svg width={180} height={160} viewBox="0 0 180 160">
            <Defs>
              {/* Wallet Leather Gradient */}
              <LinearGradient id="walletBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#1E88E5" />
                <Stop offset="30%" stopColor="#0D47A1" />
                <Stop offset="70%" stopColor="#0B3C8A" />
                <Stop offset="100%" stopColor="#072B66" />
              </LinearGradient>
              {/* Wallet Flap Gradient */}
              <LinearGradient id="walletFlap" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#29B6F6" />
                <Stop offset="100%" stopColor="#0277BD" />
              </LinearGradient>
              {/* Metallic Clasp Button */}
              <RadialGradient id="metallicButton" cx="40%" cy="40%" r="60%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="50%" stopColor="#B0BEC5" />
                <Stop offset="100%" stopColor="#546E7A" />
              </RadialGradient>
              {/* Inner Wallet Shadow */}
              <LinearGradient id="innerShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#041838" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#041838" stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Back Fold / Pocket of Wallet */}
            <Rect x="28" y="24" width="124" height="96" rx="18" fill="#06224D" />

            {/* Main Front Body of Wallet */}
            <Rect
              x="22"
              y="32"
              width="136"
              height="100"
              rx="18"
              fill="url(#walletBlue)"
              stroke="#42A5F5"
              strokeWidth="1.2"
            />

            {/* Stitching Line Accents */}
            <Rect
              x="27"
              y="37"
              width="126"
              height="90"
              rx="14"
              stroke="#64B5F6"
              strokeWidth="0.9"
              strokeDasharray="4 3"
              fill="none"
              opacity="0.7"
            />

            {/* Center Fold Line */}
            <Path d="M85 34 L85 130" stroke="#041D40" strokeWidth="3" opacity="0.6" />
            <Path d="M87 34 L87 130" stroke="#64B5F6" strokeWidth="0.8" opacity="0.4" />

            {/* Right Snap Clasp Flap */}
            <Path
              d="M110 66 L154 66 C162 66 168 72 168 80 C168 88 162 94 154 94 L110 94 Z"
              fill="url(#walletFlap)"
              stroke="#81D4FA"
              strokeWidth="1"
            />
            {/* Clasp stitch line */}
            <Path
              d="M114 70 L152 70 C158 70 163 74 163 80 C163 86 158 90 152 90 L114 90"
              stroke="#E1F5FE"
              strokeWidth="0.8"
              strokeDasharray="3 2"
              fill="none"
              opacity="0.8"
            />

            {/* Silver Metal Snap Button */}
            <Circle cx="150" cy="80" r="8" fill="url(#metallicButton)" stroke="#ECEFF1" strokeWidth="1" />
            <Circle cx="150" cy="80" r="4" fill="#37474F" opacity="0.4" />
          </Svg>
        </Animated.View>

        {/* Floating Bitcoin Coin (Top-Left) */}
        <Animated.View
          style={[styles.coinBtc, { transform: [{ translateY: btcTranslateY }] }]}
        >
          <Svg width={54} height={54} viewBox="0 0 54 54">
            <Defs>
              <RadialGradient id="btcGold" cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#FFE082" />
                <Stop offset="50%" stopColor="#FFA000" />
                <Stop offset="100%" stopColor="#FF6F00" />
              </RadialGradient>
            </Defs>
            {/* 3D Coin Rim */}
            <Circle cx="27" cy="27" r="25" fill="#C47D00" />
            <Circle cx="27" cy="26" r="23" fill="url(#btcGold)" stroke="#FFF8E1" strokeWidth="1.5" />
            <Circle cx="27" cy="26" r="19" stroke="#FFD54F" strokeWidth="1" strokeDasharray="3 2" fill="none" />
            {/* BTC Symbol ₿ */}
            <Path
              d="M25 15 L25 18 M28 15 L28 18 M25 34 L25 37 M28 34 L28 37 M22 18 L29 18 C31.5 18 33 19.5 33 22 C33 24 31.5 25.5 29 25.5 C32 25.5 33.5 27 33.5 29.5 C33.5 32 31.5 34 28.5 34 L22 34 Z M25 18 L25 34 M25 25.5 L28.5 25.5"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>

        {/* Floating Ethereum Coin (Middle-Right) */}
        <Animated.View
          style={[styles.coinEth, { transform: [{ translateY: ethTranslateY }] }]}
        >
          <Svg width={52} height={52} viewBox="0 0 52 52">
            <Defs>
              <RadialGradient id="ethBlue" cx="40%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#82B1FF" />
                <Stop offset="50%" stopColor="#448AFF" />
                <Stop offset="100%" stopColor="#2979FF" />
              </RadialGradient>
            </Defs>
            {/* Coin Rim */}
            <Circle cx="26" cy="26" r="24" fill="#1565C0" />
            <Circle cx="26" cy="25" r="22" fill="url(#ethBlue)" stroke="#E3F2FD" strokeWidth="1.2" />
            {/* Ethereum Diamond Facets */}
            <Polygon points="26,13 34,25 26,29 18,25" fill="#FFFFFF" opacity="0.9" />
            <Polygon points="26,13 18,25 26,29" fill="#BBDEFB" opacity="0.75" />
            <Polygon points="26,30.5 34,26.5 26,38" fill="#FFFFFF" opacity="0.85" />
            <Polygon points="26,30.5 18,26.5 26,38" fill="#BBDEFB" opacity="0.6" />
          </Svg>
        </Animated.View>

        {/* Floating Solana Coin (Bottom-Left) */}
        <Animated.View
          style={[styles.coinSol, { transform: [{ translateY: solTranslateY }] }]}
        >
          <Svg width={46} height={46} viewBox="0 0 46 46">
            <Defs>
              <LinearGradient id="solGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00FFA3" />
                <Stop offset="50%" stopColor="#03E1FF" />
                <Stop offset="100%" stopColor="#DC1FFF" />
              </LinearGradient>
            </Defs>
            <Circle cx="23" cy="23" r="21" fill="#0A162C" stroke="#1E3863" strokeWidth="1.5" />
            <Circle cx="23" cy="23" r="18" fill="#050E1D" />
            {/* Solana 3 Gradient Slanted Bars */}
            <Path d="M14 17 L29 17 L32 14 L17 14 Z" fill="url(#solGrad)" />
            <Path d="M17 24 L32 24 L29 21 L14 21 Z" fill="url(#solGrad)" />
            <Path d="M14 31 L29 31 L32 28 L17 28 Z" fill="url(#solGrad)" />
          </Svg>
        </Animated.View>

        {/* Floating BNB Coin (Bottom-Right) */}
        <Animated.View
          style={[styles.coinBnb, { transform: [{ translateY: bnbTranslateY }] }]}
        >
          <Svg width={46} height={46} viewBox="0 0 46 46">
            <Defs>
              <RadialGradient id="bnbGold" cx="35%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#FFE082" />
                <Stop offset="100%" stopColor="#F57C00" />
              </RadialGradient>
            </Defs>
            <Circle cx="23" cy="23" r="21" fill="#0A162C" stroke="#1E3863" strokeWidth="1.5" />
            <Circle cx="23" cy="23" r="18" fill="#0B1322" />
            {/* BNB diamond icon */}
            <Polygon points="23,14 27,18 23,22 19,18" fill="#F3BA2F" />
            <Polygon points="23,24 27,28 23,32 19,28" fill="#F3BA2F" />
            <Polygon points="16,21 19,24 16,27 13,24" fill="#F3BA2F" />
            <Polygon points="30,21 33,24 30,27 27,24" fill="#F3BA2F" />
          </Svg>
        </Animated.View>

        {/* Holographic Security Shield (Front-Center) */}
        <Animated.View
          style={[
            styles.shieldWrapper,
            {
              transform: [
                { translateY: walletTranslateY },
                { scale: shieldScale },
              ],
            },
          ]}
        >
          <Svg width={96} height={108} viewBox="0 0 96 108">
            <Defs>
              <LinearGradient id="shieldCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#00F5FF" stopOpacity="0.5" />
                <Stop offset="50%" stopColor="#0099FF" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#0044CC" stopOpacity="0.6" />
              </LinearGradient>
              <LinearGradient id="shieldBorder" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#00FFFF" />
                <Stop offset="50%" stopColor="#38BDF8" />
                <Stop offset="100%" stopColor="#0084FF" />
              </LinearGradient>
            </Defs>

            {/* Glowing Holographic Shield Outline & Body */}
            <Path
              d="M48 6 C68 6 86 16 86 34 C86 70 56 94 48 100 C40 94 10 70 10 34 C10 16 28 6 48 6 Z"
              fill="url(#shieldCyan)"
              stroke="url(#shieldBorder)"
              strokeWidth="2.5"
            />
            {/* Inner Sheen Line */}
            <Path
              d="M48 12 C64 12 78 20 78 36 C78 65 52 86 48 91"
              stroke="#E0F7FA"
              strokeWidth="1.2"
              fill="none"
              opacity="0.6"
            />

            {/* Padlock Icon Inside Shield */}
            {/* Shackle */}
            <Path
              d="M40 50 L40 42 C40 37 43 33 48 33 C53 33 56 37 56 42 L56 50"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Lock Body */}
            <Rect x="35" y="50" width="26" height="20" rx="5" fill="#FFFFFF" />
            {/* Keyhole */}
            <Circle cx="48" cy="58" r="2.5" fill="#0066CC" />
            <Path d="M48 60 L48 65" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  logoIconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sceneContainer: {
    width: 340,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
  },
  cosmicGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0077FF',
    opacity: 0.18,
    transform: [{ scaleX: 1.3 }],
  },
  ringsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletWrapper: {
    position: 'absolute',
    top: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  shieldWrapper: {
    position: 'absolute',
    top: 96,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#00F5FF',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  coinBtc: {
    position: 'absolute',
    top: 18,
    left: 14,
    zIndex: 4,
    shadowColor: '#FF9900',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  coinEth: {
    position: 'absolute',
    top: 48,
    right: 18,
    zIndex: 4,
    shadowColor: '#0077FF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  coinSol: {
    position: 'absolute',
    top: 122,
    left: 20,
    zIndex: 4,
  },
  coinBnb: {
    position: 'absolute',
    top: 124,
    right: 22,
    zIndex: 4,
  },
});
