import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, Platform, useWindowDimensions, Text, Pressable } from 'react-native';

const LOGO_URL =
  'https://raw.githubusercontent.com/pophub9999/football-club-saas/v2-visual-first/v2-app/assets/torreense-logo.svg';

export default function App() {
  const { width, height } = useWindowDimensions();

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

  const contentStyle = {
    position: 'absolute',
    left: canvasLeft + canvasWidth * 0.055,
    top: canvasTop + canvasHeight * 0.185,
    width: canvasWidth * 0.89,
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
        <Image source={{ uri: LOGO_URL }} style={logoStyle} resizeMode="contain" />
      )}

      <View style={contentStyle}>
        <View style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <View>
              <Text style={styles.competition}>LIGA PORTUGAL MEU SUPER</Text>
              <Text style={styles.round}>Próximo jogo</Text>
            </View>
            <Text style={styles.date}>DATA · HORA</Text>
          </View>

          <View style={styles.teams}>
            <View style={styles.team}>
              <View style={styles.teamBadge}><Text style={styles.badgeText}>CASA</Text></View>
              <Text style={styles.teamName}>ADVERSÁRIO</Text>
            </View>

            <Text style={styles.vs}>VS</Text>

            <View style={styles.team}>
              {Platform.OS === 'web' ? (
                React.createElement('img', {
                  src: LOGO_URL,
                  style: { width: 54, height: 72, objectFit: 'contain' },
                  alt: 'SCU Torreense',
                })
              ) : (
                <Image source={{ uri: LOGO_URL }} style={styles.teamLogo} resizeMode="contain" />
              )}
              <Text style={styles.teamName}>SCU TORREENSE</Text>
            </View>
          </View>

          <Text style={styles.stadium}>⌖  Estádio / Local</Text>

          <Pressable style={styles.matchButton}>
            <Text style={styles.matchButtonText}>VER JOGO</Text>
          </Pressable>
        </View>
      </View>
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
  matchCard: {
    width: '100%',
    backgroundColor: 'rgba(8, 43, 72, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(120, 164, 197, 0.34)',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  competition: {
    color: '#b7cee2',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  round: {
    color: '#fff',
    fontSize: 9,
    marginTop: 4,
  },
  date: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 13,
  },
  team: {
    width: '36%',
    alignItems: 'center',
  },
  teamBadge: {
    width: 58,
    height: 66,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d6ad55',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#102f4b',
  },
  badgeText: {
    color: '#d6ad55',
    fontSize: 10,
    fontWeight: '900',
  },
  teamLogo: {
    width: 54,
    height: 72,
  },
  teamName: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  vs: {
    color: '#93abc1',
    fontSize: 13,
    fontWeight: '800',
  },
  stadium: {
    color: '#b8c8d8',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 10,
  },
  matchButton: {
    marginTop: 14,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#9b1e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
