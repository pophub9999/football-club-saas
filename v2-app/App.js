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

      <View style={styles.phoneCanvas} pointerEvents="none">
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
  phoneCanvas: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    aspectRatio: 0.5,
    alignSelf: 'center',
  },
  logo: {
    position: 'absolute',
    top: '4.2%',
    left: '5.8%',
    width: '13.5%',
    height: '11%',
  },
});
