import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View, Text, Pressable, StyleSheet, ScrollView, Platform, TextInput } from 'react-native';

const club = { name: 'SCUT', full: 'Sport Clube União Torreense', primary: '#b51f2e', dark: '#151515' };
const games = [
  { id: 1, comp: 'Liga', home: 'Torreense', away: 'Académico', date: 'Sáb · 19:00', place: 'Estádio Manuel Marques' },
  { id: 2, comp: 'Liga', home: 'Leixões', away: 'Torreense', date: 'Dom · 15:30', place: 'Estádio do Mar' }
];

function Login({ enterGuest, login }) {
  return <ScrollView contentContainerStyle={s.loginPage}>
    <View style={s.loginBrand}>
      <View style={s.loginLogo}><Text style={s.loginLogoText}>T</Text></View>
      <Text style={s.loginClub}>{club.full}</Text>
      <Text style={s.loginClaim}>O teu clube. Sempre contigo.</Text>
    </View>
    <View style={s.loginPanel}>
      <Text style={s.loginTitle}>Bem-vindo</Text>
      <Text style={s.loginText}>Inicia sessão para aceder à tua área de adepto, bilhetes e carteira.</Text>
      <TextInput placeholder="Email ou nº de sócio" placeholderTextColor="#999" style={s.input}/>
      <TextInput placeholder="Palavra-passe" placeholderTextColor="#999" secureTextEntry style={s.input}/>
      <Pressable style={s.primaryBtn} onPress={login}><Text style={s.primaryBtnText}>Iniciar sessão</Text></Pressable>
      <Pressable style={s.createBtn}><Text style={s.createBtnText}>Criar conta</Text></Pressable>
      <View style={s.orRow}><View style={s.orLine}/><Text style={s.orText}>ou</Text><View style={s.orLine}/></View>
      <Pressable style={s.guestBtn} onPress={enterGuest}>
        <Text style={s.guestTitle}>Continuar sem iniciar sessão</Text>
        <Text style={s.guestSub}>Ver notícias, jogos, resultados e informação do clube</Text>
      </Pressable>
    </View>
  </ScrollView>
}
function Header({ title, subtitle, guest, openLogin }) {
  return <View style={s.header}><View style={s.logo}><Text style={s.logoText}>T</Text></View><View style={{flex:1}}><Text style={s.headerTitle}>{title}</Text><Text style={s.headerSub}>{subtitle}</Text></View>{guest?<Pressable style={s.loginChip} onPress={openLogin}><Text style={s.loginChipText}>Entrar</Text></Pressable>:<View style={s.avatar}><Text>RS</Text></View>}</View>
}
function Card({ children, style }) { return <View style={[s.card, style]}>{children}</View> }
function Home({ go, guest, openLogin }) {
  return <ScrollView contentContainerStyle={s.content}>
    <Header title={guest?'Torreense':'Olá, Ricardo'} subtitle={club.full} guest={guest} openLogin={openLogin}/>
    {guest&&<Card style={s.guestBanner}><View style={{flex:1}}><Text style={s.guestBannerTitle}>Faz parte do clube</Text><Text style={s.guestBannerText}>Entra ou cria conta para teres bilhetes, carteira e benefícios.</Text></View><Pressable onPress={openLogin}><Text style={s.guestBannerLink}>Entrar →</Text></Pressable></Card>}
    <Card style={s.hero}><Text style={s.kicker}>PRÓXIMO JOGO</Text><Text style={s.heroTeams}>TOR  ·  ACA</Text><Text style={s.heroScore}>—  :  —</Text><Text style={s.heroMeta}>Sábado · 19:00 · Manuel Marques</Text><Pressable style={s.whiteBtn} onPress={()=>go('Jogos')}><Text style={s.whiteBtnText}>Ver jogo</Text></Pressable></Card>
    <Text style={s.section}>{guest?'Explorar':'A tua área'}</Text>
    <View style={s.grid}>
      {(guest?[['📰','Notícias'],['⚽','Jogos'],['🏆','Classificação'],['👥','Plantel']]:[['🎟️','Bilhetes'],['💳','Carteira'],['⭐','Rewards'],['👤','Sócio']]).map(([i,t])=><Pressable key={t} style={s.quick} onPress={()=>guest?(t==='Jogos'?go('Jogos'):null):go(t==='Bilhetes'?'Bilhete':t)}><Text style={s.quickIcon}>{i}</Text><Text style={s.quickText}>{t}</Text></Pressable>)}
    </View>
    <Text style={s.section}>Em destaque</Text>
    <Card><Text style={s.newsTag}>CLUBE</Text><Text style={s.newsTitle}>Tudo o que importa, num só lugar.</Text><Text style={s.muted}>Notícias, jogos, resultados e toda a atualidade do teu clube.</Text></Card>
  </ScrollView>
}
function Games({ go, guest, openLogin }) {
  return <ScrollView contentContainerStyle={s.content}><Header title="Jogos" subtitle="Calendário e resultados" guest={guest} openLogin={openLogin}/>{games.map(g=><Pressable key={g.id} onPress={()=>guest?null:go('Bilhete')}><Card style={{marginBottom:12}}><Text style={s.newsTag}>{g.comp}</Text><Text style={s.game}>{g.home}  vs  {g.away}</Text><Text style={s.muted}>{g.date}</Text><Text style={s.muted}>{g.place}</Text></Card></Pressable>)}</ScrollView>
}
function Ticket({guest,openLogin}) {
  if(guest) return <Locked title="Bilhetes" text="Inicia sessão para comprares, guardares e apresentares os teus bilhetes." openLogin={openLogin}/>;
  return <ScrollView contentContainerStyle={s.content}><Header title="Bilhete" subtitle="Matchday" /><Card style={s.ticket}><Text style={s.kickerDark}>LIGA · SÁB 19:00</Text><Text style={s.ticketTeams}>TORREENSE</Text><Text style={s.vs}>VS</Text><Text style={s.ticketTeams}>ACADÉMICO</Text><View style={s.qr}><Text style={{fontSize:54}}>▦</Text></View><Text style={s.ticketName}>Ricardo Silva</Text><Text style={s.muted}>Bancada Central · Porta 2 · Lugar 18</Text><Text style={s.secure}>QR dinâmico · atualiza automaticamente</Text></Card></ScrollView>
}
function Locked({title,text,openLogin}) { return <View style={s.content}><Header title={title} subtitle="Área reservada" guest openLogin={openLogin}/><Card style={s.locked}><Text style={s.lockIcon}>🔒</Text><Text style={s.newsTitle}>Área de adepto</Text><Text style={[s.muted,{textAlign:'center'}]}>{text}</Text><Pressable style={[s.primaryBtn,{width:'100%',marginTop:20}]} onPress={openLogin}><Text style={s.primaryBtnText}>Iniciar sessão</Text></Pressable></Card></View> }
function Placeholder({name,guest,openLogin}) { if(guest&&(name==='Carteira'||name==='Perfil')) return <Locked title={name} text={'Inicia sessão para acederes à tua '+name.toLowerCase()+'.'} openLogin={openLogin}/>; return <View style={s.content}><Header title={name} subtitle="Módulo em construção" guest={guest} openLogin={openLogin}/><Card><Text style={s.newsTitle}>{name}</Text><Text style={s.muted}>Este ecrã será desenvolvido na próxima iteração visual.</Text></Card></View> }

export default function App() {
 const [session,setSession]=useState('login');
 const [tab,setTab]=useState('Início');
 if(session==='login') return <SafeAreaView style={s.safe}><StatusBar style="dark"/><View style={s.phone}><Login enterGuest={()=>{setSession('guest');setTab('Início')}} login={()=>{setSession('user');setTab('Início')}}/></View></SafeAreaView>;
 const guest=session==='guest';
 const openLogin=()=>setSession('login');
 const body=tab==='Início'?<Home go={setTab} guest={guest} openLogin={openLogin}/>:tab==='Jogos'?<Games go={setTab} guest={guest} openLogin={openLogin}/>:tab==='Bilhete'?<Ticket guest={guest} openLogin={openLogin}/>:<Placeholder name={tab} guest={guest} openLogin={openLogin}/>;
 return <SafeAreaView style={s.safe}><StatusBar style="dark"/><View style={s.phone}>{body}<View style={s.nav}>{['Início','Jogos','Bilhete','Carteira','Perfil'].map(t=><Pressable key={t} style={s.navItem} onPress={()=>setTab(t)}><Text style={[s.navText,tab===t&&s.active]}>{t}</Text></Pressable>)}</View></View></SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#eef0f3',alignItems:'center'}, phone:{flex:1,width:'100%',maxWidth:520,backgroundColor:'#f7f7f8',...Platform.select({web:{boxShadow:'0 0 35px rgba(0,0,0,.12)'}})}, content:{padding:20,paddingBottom:105},
 loginPage:{flexGrow:1,justifyContent:'center',padding:24,paddingVertical:44},loginBrand:{alignItems:'center',marginBottom:30},loginLogo:{width:76,height:76,borderRadius:24,backgroundColor:club.primary,alignItems:'center',justifyContent:'center',marginBottom:16},loginLogoText:{fontSize:40,fontWeight:'900',color:'white'},loginClub:{fontSize:18,fontWeight:'800',textAlign:'center'},loginClaim:{color:'#777',marginTop:6},loginPanel:{backgroundColor:'white',padding:22,borderRadius:24,borderWidth:1,borderColor:'#e9e9eb'},loginTitle:{fontSize:28,fontWeight:'900'},loginText:{color:'#777',lineHeight:20,marginTop:8,marginBottom:20},input:{height:52,borderWidth:1,borderColor:'#dedee2',borderRadius:13,paddingHorizontal:15,fontSize:15,marginBottom:11,backgroundColor:'#fafafa'},primaryBtn:{height:52,borderRadius:13,backgroundColor:club.primary,alignItems:'center',justifyContent:'center'},primaryBtnText:{color:'white',fontWeight:'800',fontSize:15},createBtn:{height:48,alignItems:'center',justifyContent:'center'},createBtnText:{color:club.primary,fontWeight:'800'},orRow:{flexDirection:'row',alignItems:'center',gap:10,marginVertical:5},orLine:{height:1,backgroundColor:'#e4e4e7',flex:1},orText:{color:'#999',fontSize:12},guestBtn:{padding:14,borderRadius:13,backgroundColor:'#f5f5f6',alignItems:'center'},guestTitle:{fontWeight:'800',fontSize:14},guestSub:{fontSize:11,color:'#777',textAlign:'center',marginTop:5,lineHeight:16},
 header:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:22,marginTop:8}, logo:{width:46,height:46,borderRadius:14,backgroundColor:club.primary,alignItems:'center',justifyContent:'center'},logoText:{color:'white',fontWeight:'900',fontSize:24},headerTitle:{fontSize:22,fontWeight:'800',color:'#161616'},headerSub:{fontSize:12,color:'#777'},avatar:{width:38,height:38,borderRadius:19,backgroundColor:'#e6e6e8',alignItems:'center',justifyContent:'center'},loginChip:{paddingHorizontal:15,paddingVertical:9,borderRadius:20,backgroundColor:'#fff',borderWidth:1,borderColor:'#ddd'},loginChipText:{fontWeight:'800',color:club.primary,fontSize:12},
 card:{backgroundColor:'white',borderRadius:20,padding:18,borderWidth:1,borderColor:'#ececee'},guestBanner:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14},guestBannerTitle:{fontWeight:'800'},guestBannerText:{fontSize:11,color:'#777',marginTop:3,flexShrink:1},guestBannerLink:{color:club.primary,fontWeight:'800',fontSize:12},hero:{backgroundColor:club.primary,borderColor:club.primary,padding:22},kicker:{fontSize:11,fontWeight:'800',letterSpacing:1.5,color:'#ffd9de'},heroTeams:{fontSize:18,fontWeight:'900',color:'white',marginTop:18},heroScore:{fontSize:34,fontWeight:'900',color:'white',marginVertical:4},heroMeta:{color:'#ffe8eb'},whiteBtn:{marginTop:20,backgroundColor:'white',padding:13,borderRadius:12,alignItems:'center'},whiteBtnText:{fontWeight:'800',color:club.primary},
 section:{fontSize:18,fontWeight:'800',marginTop:24,marginBottom:12},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},quick:{width:'48%',backgroundColor:'white',padding:18,borderRadius:18,borderWidth:1,borderColor:'#ececee'},quickIcon:{fontSize:24},quickText:{fontWeight:'700',marginTop:10},newsTag:{fontSize:11,fontWeight:'900',color:club.primary,letterSpacing:1},newsTitle:{fontSize:20,fontWeight:'800',marginVertical:8},muted:{color:'#777',lineHeight:20},game:{fontSize:19,fontWeight:'800',marginVertical:8},
 ticket:{alignItems:'center',paddingVertical:28},kickerDark:{fontSize:11,fontWeight:'900',letterSpacing:1.2},ticketTeams:{fontSize:24,fontWeight:'900',marginTop:18},vs:{color:'#999',marginTop:10},qr:{width:150,height:150,marginVertical:24,borderWidth:8,borderColor:'#111',alignItems:'center',justifyContent:'center'},ticketName:{fontSize:18,fontWeight:'800'},secure:{fontSize:11,color:'#888',marginTop:18},locked:{alignItems:'center',marginTop:40,padding:28},lockIcon:{fontSize:38},
 nav:{position:'absolute',bottom:0,left:0,right:0,height:78,backgroundColor:'white',borderTopWidth:1,borderTopColor:'#e7e7e7',flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingBottom:8},navItem:{padding:10},navText:{fontSize:11,color:'#888',fontWeight:'700'},active:{color:club.primary}
});