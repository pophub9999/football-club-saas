import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, Platform, useWindowDimensions } from 'react-native';

const LOGO_URL =
  'https://raw.githubusercontent.com/pophub9999/football-club-saas/v2-visual-first/v2-app/assets/torreense-logo.svg';

export default function App() {
  const { width, height } = useWindowDimensions();

  // A imagem aprovada tem proporção vertical 1:2.
  // Calculamos a área real que ela ocupa quando está em "contain".
  const canvasWidth = Math.min(width, height / 2);
  const canvasHeight = canvasWidth * 2;
  const canvasLeft = (width - canvasWidth) / 2;
  const canvasTop = (height - canvasHeight) / 2;

  const logoStyle = {
    position: 'absolute',
    left: canvasLeft + canvasWidth * 0.055,
    top: canvasTop + canvasHeight * 0.04,
    width: canvasWidth * 0.135,
    height: canvasHeight * 0.105,
    objectFit: 'contain',
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <Image
        source={require('./assets/home-background.png')}
        style={styles.background}
        resizeMode="contain"
      />

      {Platform.OS === 'web' ? (
        React.createElement('img', {
          src: LOGO_URL,
          style: logoStyle,
          alt: 'SCU Torreense',
        })
      ) : (
        <Image
          source={{ uri: LOGO_URL }}
          style={logoStyle}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#00142c',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  background: {
    width: '100%',
    height: '100%',
  },
});
