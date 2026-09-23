import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, Text, Pressable } from 'react-native';

export default function App() {
  // Mais tarde este valor virá da autenticação.
  const user = null;

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <Image
        source={require('./assets/home-background.png')}
        style={styles.background}
        resizeMode="contain"
      />

      <View style={styles.screen}>
        <View style={styles.topBar}>
          <View style={styles.userArea}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>♙</Text>
            </View>

            <View>
              <Text style={styles.welcome}>
                {user ? 'BEM-VINDO' : 'ÁREA DE ADEPTO'}
              </Text>
              <Text style={styles.userName}>
                {user ? user.name : 'Inicia sessão'}
              </Text>
            </View>
          </View>

          <Pressable style={styles.loginButton}>
            <Text style={styles.loginText}>
              {user ? 'PERFIL' : 'ENTRAR'}
            </Text>
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
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  background: {
    width: '100%',
    height: '100%',
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: '3.5%',
    width: '88%',
    maxWidth: 760,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  userArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(5,24,48,0.28)',
  },
  avatarIcon: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 27,
  },
  welcome: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  loginButton: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.28)',
    paddingLeft: 16,
    minHeight: 38,
    justifyContent: 'center',
  },
  loginText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
