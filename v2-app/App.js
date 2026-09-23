import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet } from 'react-native';

const LOGO_URL =
  'https://raw.githubusercontent.com/pophub9999/football-club-saas/v2-visual-first/v2-app/assets/torreense-logo.svg';

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <Image
        source={require('./assets/home-background.png')}
        style={styles.background}
        resizeMode="contain"
      />

      <View style={styles.overlay} pointerEvents="none">
        <Image
          source={{ uri: LOGO_URL }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#00142c',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  background: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  logo: {
    position: 'absolute',
    top: '4.5%',
    left: '6%',
    width: '10%',
    maxWidth: 92,
    minWidth: 58,
    aspectRatio: 0.72,
  },
});
