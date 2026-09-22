import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';

const club = { name: 'SCUT', full: 'Sport Clube União Torreense', primary: '#b51f2e', dark: '#151515' };
const games = [
  { id: 1, comp: 'Liga', home: 'Torreense', away: 'Académico', date: 'Sáb · 19:00', place: 'Estádio Manuel Marques' },
  { id: 2, comp: 'Liga', home: 'Leixões', away: 'Torreense', date: 'Dom · 15:30', place: 'Estádio do Mar' }
];

function Header({ title, subtitle }) {
  return <View style={s.header}><View style={s.logo}><Text style={s.logoText}>T</Text></View><View style={{flex:1}}><Text style={s.headerTitle}>{title}</Text><Text style={s.headerSub}>{subtitle}</Text></View><View style={s.avatar}><Text>RS</Text></View></View>
}
function Card({ children, style }) { return <View style={[s.card, style]}>{children}</View> }
function Home({ go }) {
  return <ScrollView contentContainerStyle={s.content}>
    <Header title="Olá, Ricardo" subtitle={club.full} />
    <Card style={s.hero}><Text style={s.kicker}>PRÓXIMO JOGO</Text><Text style={s.heroTeams}>TOR  ·  ACA</Text><Text style={s.heroScore}>—  :  —</Text><Text style={s.heroMeta}>Sábado · 19:00 · Manuel Marques</Text><Pressable style={s.whiteBtn} onPress={()=>go('Jogos')}><Text style={s.whiteBtnText}>Ver jogo</Text></Pressable></Card>
    <Text style={s.section}>A tua área</Text>
    <View style={s.grid}>
      {[['🎟️','Bilhetes'],['💳','Carteira'],['⭐','Rewards'],['👤','Sócio']].map(([i,t])=><Pressable key={t} style={s.quick} onPress={()=>go(t==='Bilhetes'?'Bilhete':t)}><Text style={s.quickIcon}>{i}</Text><Text style={s.quickText}>{t}</Text></Pressable>)}
    </View>
    <Text style={s.section}>Em destaque</Text>
    <Card><Text style={s.newsTag}>CLUBE</Text><Text style={s.newsTitle}>Tudo o que importa, num só lugar.</Text><Text style={s.muted}>Notícias, jogos, bilhetes e benefícios do teu clube.</Text></Card>
  </ScrollView>
}
function Games({ go }) {
  return <ScrollView contentContainerStyle={s.content}><Header title="Jogos" subtitle="Calendário e bilhetes" />{games.map(g=><Pressable key={g.id} onPress={()=>go('Bilhete')}><Card style={{marginBottom:12}}><Text style={s.newsTag}>{g.comp}</Text><Text style={s.game}>{g.home}  vs  {g.away}</Text><Text style={s.muted}>{g.date}</Text><Text style={s.muted}>{g.place}</Text></Card></Pressable>)}</ScrollView>
}
function Ticket() {
  return <ScrollView contentContainerStyle={s.content}><Header title="Bilhete" subtitle="Matchday" /><Card style={s.ticket}><Text style={s.kickerDark}>LIGA · SÁB 19:00</Text><Text style={s.ticketTeams}>TORREENSE</Text><Text style={s.vs}>VS</Text><Text style={s.ticketTeams}>ACADÉMICO</Text><View style={s.qr}><Text style={{fontSize:54}}>▦</Text></View><Text style={s.ticketName}>Ricardo Silva</Text><Text style={s.muted}>Bancada Central · Porta 2 · Lugar 18</Text><Text style={s.secure}>QR dinâmico · atualiza automaticamente</Text></Card></ScrollView>
}
function Placeholder({name}) { return <View style={s.content}><Header title={name} subtitle="Módulo em construção" /><Card><Text style={s.newsTitle}>{name}</Text><Text style={s.muted}>Este ecrã será desenvolvido na próxima iteração visual.</Text></Card></View> }

export default function App() {
 const [tab,setTab]=useState('Início');
 const body=tab==='Início'?<Home go={setTab}/>:tab==='Jogos'?<Games go={setTab}/>:tab==='Bilhete'?<Ticket/>:<Placeholder name={tab}/>;
 return <SafeAreaView style={s.safe}><StatusBar style="dark"/><View style={s.phone}>{body}<View style={s.nav}>{['Início','Jogos','Bilhete','Carteira','Perfil'].map(t=><Pressable key={t} style={s.navItem} onPress={()=>setTab(t)}><Text style={[s.navText,tab===t&&s.active]}>{t}</Text></Pressable>)}</View></View></SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#eef0f3',alignItems:'center'}, phone:{flex:1,width:'100%',maxWidth:520,backgroundColor:'#f7f7f8',...Platform.select({web:{boxShadow:'0 0 35px rgba(0,0,0,.12)'}})}, content:{padding:20,paddingBottom:105}, header:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:22,marginTop:8}, logo:{width:46,height:46,borderRadius:14,backgroundColor:club.primary,alignItems:'center',justifyContent:'center'},logoText:{color:'white',fontWeight:'900',fontSize:24},headerTitle:{fontSize:22,fontWeight:'800',color:'#161616'},headerSub:{fontSize:12,color:'#777'},avatar:{width:38,height:38,borderRadius:19,backgroundColor:'#e6e6e8',alignItems:'center',justifyContent:'center'},
 card:{backgroundColor:'white',borderRadius:20,padding:18,borderWidth:1,borderColor:'#ececee'},hero:{backgroundColor:club.primary,borderColor:club.primary,padding:22},kicker:{fontSize:11,fontWeight:'800',letterSpacing:1.5,color:'#ffd9de'},heroTeams:{fontSize:18,fontWeight:'900',color:'white',marginTop:18},heroScore:{fontSize:34,fontWeight:'900',color:'white',marginVertical:4},heroMeta:{color:'#ffe8eb'},whiteBtn:{marginTop:20,backgroundColor:'white',padding:13,borderRadius:12,alignItems:'center'},whiteBtnText:{fontWeight:'800',color:club.primary},
 section:{fontSize:18,fontWeight:'800',marginTop:24,marginBottom:12},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},quick:{width:'48%',backgroundColor:'white',padding:18,borderRadius:18,borderWidth:1,borderColor:'#ececee'},quickIcon:{fontSize:24},quickText:{fontWeight:'700',marginTop:10},newsTag:{fontSize:11,fontWeight:'900',color:club.primary,letterSpacing:1},newsTitle:{fontSize:20,fontWeight:'800',marginVertical:8},muted:{color:'#777',lineHeight:20},game:{fontSize:19,fontWeight:'800',marginVertical:8},
 ticket:{alignItems:'center',paddingVertical:28},kickerDark:{fontSize:11,fontWeight:'900',letterSpacing:1.2},ticketTeams:{fontSize:24,fontWeight:'900',marginTop:18},vs:{color:'#999',marginTop:10},qr:{width:150,height:150,marginVertical:24,borderWidth:8,borderColor:'#111',alignItems:'center',justifyContent:'center'},ticketName:{fontSize:18,fontWeight:'800'},secure:{fontSize:11,color:'#888',marginTop:18},
 nav:{position:'absolute',bottom:0,left:0,right:0,height:78,backgroundColor:'white',borderTopWidth:1,borderTopColor:'#e7e7e7',flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingBottom:8},navItem:{padding:10},navText:{fontSize:11,color:'#888',fontWeight:'700'},active:{color:club.primary}
});