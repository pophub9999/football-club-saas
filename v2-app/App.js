import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View, Text, Pressable, Image, StyleSheet, useWindowDimensions } from 'react-native';

const MASTER = require('./assets/home-master.jpg');

const BASE_W = 941;
const BASE_H = 1672;

const HOTSPOTS = [
  { id: 'search', label: 'Pesquisa', x: 620, y: 92, w: 72, h: 72 },
  { id: 'login', label: 'Entrar', x: 700, y: 84, w: 205, h: 84 },

  { id: 'game', label: 'Jogo', x: 82, y: 616, w: 777, h: 82 },

  { id: 'tickets', label: 'Bilhetes', x: 57, y: 731, w: 151, h: 136 },
  { id: 'pass', label: 'Torres Pass', x: 220, y: 731, w: 153, h: 136 },
  { id: 'member', label: 'Sócio', x: 388, y: 731, w: 153, h: 136 },
  { id: 'shop', label: 'Loja', x: 556, y: 731, w: 153, h: 136 },
  { id: 'benefits', label: 'Vantagens', x: 721, y: 731, w: 154, h: 136 },

  { id: 'news-all', label: 'Últimas notícias', x: 730, y: 900, w: 150, h: 58 },
  { id: 'news-main', label: 'Estreia de sonho na Liga Europa', x: 55, y: 955, w: 435, h: 462 },
  { id: 'news-1', label: 'Convocatória para o jogo com o Tondela', x: 502, y: 955, w: 372, h: 144 },
  { id: 'news-2', label: 'Informações úteis para os adeptos', x: 502, y: 1112, w: 372, h: 143 },
  { id: 'news-3', label: 'Juniores somam nova vitória', x: 502, y: 1265, w: 372, h: 145 },

  { id: 'home', label: 'Início', x: 55, y: 1455, w: 135, h: 170 },
  { id: 'games', label: 'Jogos', x: 205, y: 1455, w: 145, h: 170 },
  { id: 'nav-tickets', label: 'Bilhetes', x: 380, y: 1455, w: 145, h: 170 },
  { id: 'nav-member', label: 'Sócio', x: 555, y: 1455, w: 145, h: 170 },
  { id: 'more', label: 'Mais', x: 730, y: 1455, w: 150, h: 170 },
];

const COPY = {
  search: ['Pesquisa', 'A pesquisa será ligada aos conteúdos da app numa fase seguinte.'],
  login: ['Entrar', 'Aqui ficará o login do adepto/sócio.'],
  game: ['CD Tondela × SCU Torreense', 'A ficha do jogo ficará aqui, mantendo a Home exatamente com este visual.'],
  tickets: ['Bilhetes', 'Área de compra e gestão de bilhetes.'],
  pass: ['Torres Pass', 'Área do Torres Pass.'],
  member: ['Sócio', 'Área reservada ao sócio.'],
  shop: ['Loja', 'Ligação à loja do clube.'],
  benefits: ['Vantagens', 'Benefícios e vantagens para adeptos e sócios.'],
  'news-all': ['Últimas notícias', 'Lista completa das notícias.'],
  'news-main': ['Estreia de sonho na Liga Europa', 'A notícia abrirá dentro da app.'],
  'news-1': ['Convocatória para o jogo com o Tondela', 'A notícia abrirá dentro da app.'],
  'news-2': ['Informações úteis para os adeptos', 'A notícia abrirá dentro da app.'],
  'news-3': ['Juniores somam nova vitória', 'A notícia abrirá dentro da app.'],
  home: ['Início', 'Já estás na página inicial.'],
  games: ['Jogos', 'Calendário, resultados e ficha dos jogos.'],
  'nav-tickets': ['Bilhetes', 'Bilhetes e carteira.'],
  'nav-member': ['Sócio', 'Dados e serviços de sócio.'],
  more: ['Mais', 'Outras áreas da aplicação.'],
};

function InteractiveHome() {
  const { width, height } = useWindowDimensions();
  const canvasW = Math.min(width, 560);
  const scale = canvasW / BASE_W;
  const canvasH = BASE_H * scale;
  const [active, setActive] = useState(null);

  const hotspotStyles = useMemo(
    () =>
      Object.fromEntries(
        HOTSPOTS.map(h => [
          h.id,
          {
            position: 'absolute',
            left: h.x * scale,
            top: h.y * scale,
            width: h.w * scale,
            height: h.h * scale,
          },
        ])
      ),
    [scale]
  );

  const close = () => setActive(null);
  const [title, description] = active ? COPY[active] || ['Em desenvolvimento', ''] : ['', ''];

  return (
    <View style={[styles.stage, { width: canvasW, height: canvasH }]}>
      <Image source={MASTER} style={styles.master} resizeMode="stretch" />

      {HOTSPOTS.map(h => (
        <Pressable
          key={h.id}
          accessibilityRole="button"
          accessibilityLabel={h.label}
          onPress={() => setActive(h.id)}
          style={hotspotStyles[h.id]}
        />
      ))}

      {active && active !== 'home' && (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayCloseArea} onPress={close} />
          <View style={[styles.sheet, { width: Math.min(canvasW * 0.88, 470) }]}>
            <Pressable onPress={close} hitSlop={14}>
              <Text style={styles.back}>‹ VOLTAR</Text>
            </Pressable>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Text style={styles.sheetText}>{description}</Text>
            <Text style={styles.sheetHint}>
              Nesta fase estamos a preservar o visual aprovado da Home. A ligação aos dados reais vem a seguir.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar hidden />
      <View style={styles.page}>
        <InteractiveHome />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#010b13',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#010b13',
    overflow: 'hidden',
  },
  stage: {
    position: 'relative',
    backgroundColor: '#031523',
    overflow: 'hidden',
  },
  master: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1, 12, 24, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCloseArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: 'rgba(7, 31, 52, 0.98)',
    borderWidth: 1,
    borderColor: '#365a77',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.48,
    shadowRadius: 28,
    elevation: 12,
  },
  back: {
    color: '#e0b05b',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 18,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
    marginBottom: 12,
  },
  sheetText: {
    color: '#d5e0e9',
    fontSize: 15,
    lineHeight: 22,
  },
  sheetHint: {
    color: '#92a8bb',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#29475f',
  },
});
