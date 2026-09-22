import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, View, Image, StyleSheet, useWindowDimensions } from 'react-native';

const MASTER = require('./assets/home-master.jpg');

export default function App() {
  const { width } = useWindowDimensions();
  const canvasWidth = Math.min(width, 512);
  const scale = canvasWidth / 512;
  const canvasHeight = 768 * scale;

  const patch = (left, top, widthPx, heightPx, sourceY) => ({
    box: {
      position: 'absolute',
      left: left * scale,
      top: top * scale,
      width: widthPx * scale,
      height: heightPx * scale,
      overflow: 'hidden',
    },
    image: {
      position: 'absolute',
      left: -left * scale,
      top: -sourceY * scale,
      width: canvasWidth,
      height: canvasHeight,
    },
  });

  // Mantemos o mockup como master visual 1:1.
  // Estes dois pequenos patches retiram os textos que já tínhamos decidido não usar:
  // “Torres Vedras” e o slogan “Mais que um clube”.
  const removeLocation = patch(118, 79, 112, 14, 62);
  const removeSlogan = patch(377, 76, 111, 51, 24);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar hidden />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
          <Image source={MASTER} style={styles.master} resizeMode="stretch" />

          <View style={removeLocation.box} pointerEvents="none">
            <Image source={MASTER} style={removeLocation.image} resizeMode="stretch" />
          </View>

          <View style={removeSlogan.box} pointerEvents="none">
            <Image source={MASTER} style={removeSlogan.image} resizeMode="stretch" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#010b13',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#010b13',
  },
  scrollContent: {
    alignItems: 'center',
    backgroundColor: '#010b13',
  },
  canvas: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#031523',
  },
  master: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
