import React,{useState}from'react';
import{StatusBar}from'expo-status-bar';
import{SafeAreaView,View,Text,Pressable,StyleSheet,ScrollView,TextInput,Image,ImageBackground,Linking}from'react-native';

const C={bg:'#031523',panel:'#08253d',panel2:'#0a2a45',line:'#2a4862',wine:'#981f3d',wine2:'#b32749',gold:'#e0b05b',white:'#ffffff',muted:'#9fb1c2'};
const TORREENSE='https://cdn.freebiesupply.com/logos/large/2x/sc-uniao-torreense-logo-png-transparent.png';
const TONDELA='https://cdtondela.pt/assets/img/logo@2x.png';
const CASTLE='https://commons.wikimedia.org/wiki/Special:Redirect/file/Castelo%20de%20Torres%20Vedras%20-%20Portugal%20%288704876877%29.jpg';
const NIMG=[
 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=82',
 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=600&q=82',
 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=600&q=82',
 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=82'
];
const stories=[
 {id:1,cat:'EQUIPA PRINCIPAL',date:'21 SET 2026',title:'Estreia de sonho na Liga Europa',lead:'O Torreense entrou com o pé direito na Liga Europa, com uma exibição de grande nível e o apoio dos nossos adeptos.',img:NIMG[0],url:'https://www.torreense.com/blog/estreialigaeuropa'},
 {id:2,cat:'EQUIPA PRINCIPAL',date:'18 SET 2026',title:'Convocatória para o próximo jogo',lead:'Informação da equipa principal.',img:NIMG[1],url:'https://www.torreense.com/blog'},
 {id:3,cat:'CLUBE',date:'17 SET 2026',title:'Informações úteis para os adeptos',lead:'Tudo o que precisas de saber.',img:NIMG[2],url:'https://www.torreense.com/blog'},
 {id:4,cat:'FORMAÇÃO',date:'11 SET 2026',title:'Notícias da formação Torreense',lead:'Acompanhe as equipas de formação.',img:NIMG[3],url:'https://www.torreense.com/blog'}
];

function Crest({size=74}){return <Image source={{uri:TORREENSE}} style={{width:size,height:size}} resizeMode="contain"/>}
function Header({onLogin}){
 return <ImageBackground source={{uri:CASTLE}} style={s.headerBg} imageStyle={s.headerImg}>
  <View style={s.blueShade}/><View style={s.wineShade}/>
  <View style={s.header}>
   <Crest size={92}/>
   <View style={s.brandBox}><Text style={s.brandThin}>SPORT CLUBE</Text><Text style={s.brandBold}>UNIÃO TORREENSE</Text></View>
   <View style={s.headerActions}><Text style={s.search}>⌕</Text><View style={s.userIcon}><Text style={s.userGlyph}>♙</Text></View><Pressable onPress={onLogin}><Text style={s.enter}>ENTRAR</Text></Pressable></View>
  </View>
 </ImageBackground>
}
function MatchCard({go}){
 return <View style={s.matchCard}>
  <View style={s.matchHead}>
   <View><Text style={s.comp}>LIGA PORTUGAL MEU SUPER</Text><Text style={s.round}>Jornada 7</Text></View>
   <View style={s.whenWrap}><Text style={s.calendar}>□</Text><Text style={s.when}>10 OUT · 15:30</Text></View>
  </View>
  <View style={s.teams}>
   <View style={s.team}><Image source={{uri:TONDELA}} style={s.clubLogo} resizeMode="contain"/><Text style={s.teamName}>CD TONDELA</Text></View>
   <Text style={s.vs}>VS</Text>
   <View style={s.team}><Crest size={86}/><Text style={s.teamName}>SCU TORREENSE</Text></View>
  </View>
  <Text style={s.stadium}>⌖  Estádio João Cardoso</Text>
  <Pressable style={s.gameBtn} onPress={()=>go('Jogos')}><Text style={s.ticket}>◇</Text><Text style={s.gameBtnText}>VER JOGO</Text></Pressable>
 </View>
}
function Shortcuts(){
 const items=[['◇','BILHETES'],['▣','TORRES PASS'],['♙','SÓCIO'],['▱','LOJA'],['☆','VANTAGENS']];
 return <View style={s.shortcuts}>{items.map(([i,t])=><Pressable key={t} style={s.short}><Text style={s.shortIcon}>{i}</Text><Text style={s.shortText}>{t}</Text></Pressable>)}</View>
}
function News({open}){
 return <View>
  <View style={s.newsHead}><Text style={s.newsHeading}>Últimas notícias</Text><Text style={s.all}>VER TODAS  ›</Text></View>
  <View style={s.newsGrid}>
   <Pressable style={s.lead} onPress={()=>open(stories[0])}>
    <Image source={{uri:stories[0].img}} style={s.leadImage}/>
    <View style={s.leadOverlay}/>
    <View style={s.leadTextBox}><Text style={s.pill}>{stories[0].cat}</Text><Text style={s.newsDate}>{stories[0].date}</Text><Text style={s.leadTitle}>{stories[0].title}</Text><Text style={s.leadDesc}>{stories[0].lead}</Text><Text style={s.chevBottom}>›</Text></View>
   </Pressable>
   <View style={s.sideCol}>{stories.slice(1).map(n=><Pressable key={n.id} style={s.sideCard} onPress={()=>open(n)}>
    <Image source={{uri:n.img}} style={s.thumb}/><View style={s.sideText}><Text style={s.pill}>{n.cat}</Text><Text style={s.newsDate}>{n.date}</Text><Text style={s.sideTitle}>{n.title}</Text></View><Text style={s.sideArrow}>›</Text>
   </Pressable>)}</View>
  </View>
 </View>
}
function Home({onLogin,go,open}){return <ScrollView contentContainerStyle={s.homeContent}><Header onLogin={onLogin}/><View style={s.body}><MatchCard go={go}/><Shortcuts/><News open={open}/></View></ScrollView>}
function Article({item,back}){
 return <ScrollView contentContainerStyle={s.articlePage}><Pressable onPress={back}><Text style={s.back}>‹ VOLTAR</Text></Pressable><Image source={{uri:item.img}} style={s.articleImg}/><Text style={s.pill}>{item.cat}</Text><Text style={s.articleDate}>{item.date}</Text><Text style={s.articleTitle}>{item.title}</Text><Text style={s.articleLead}>{item.lead}</Text><Text style={s.articleBody}>Esta notícia é lida dentro da aplicação. Na integração editorial, o conteúdo completo será sincronizado e apresentado aqui, mantendo no final a ligação para a publicação original do clube.</Text><Pressable style={s.original} onPress={()=>Linking.openURL(item.url)}><Text style={s.originalText}>VER NOTÍCIA ORIGINAL EM TORREENSE.COM ↗</Text></Pressable></ScrollView>
}
function Games({onLogin}){return <ScrollView contentContainerStyle={s.homeContent}><Header onLogin={onLogin}/><View style={s.body}><Text style={s.pageTitle}>Jogos</Text>{[['11 SET','SCU Torreense','0 - 0','Leixões SC'],['10 OUT','CD Tondela','15:30','SCU Torreense'],['26 OUT','SCU Torreense','—','Amarante F.C.']].map(g=><View style={s.fixture} key={g[0]}><Text style={s.fixtureDate}>{g[0]}</Text><View style={{flex:1}}><Text style={s.fixtureTeam}>{g[1]}</Text><Text style={s.fixtureTeam}>{g[3]}</Text></View><Text style={s.fixtureScore}>{g[2]}</Text></View>)}</View></ScrollView>}
function Login({guest,enter}){return <ImageBackground source={{uri:CASTLE}} style={s.loginPage} imageStyle={s.loginBg}><View style={s.loginTint}/><Crest size={118}/><Text style={s.loginThin}>SPORT CLUBE</Text><Text style={s.loginBold}>UNIÃO TORREENSE</Text><View style={s.loginCard}><Text style={s.loginTitle}>Bem-vindo</Text><TextInput placeholder="Email ou nº de sócio" placeholderTextColor="#8195a8" style={s.input}/><TextInput placeholder="Palavra-passe" placeholderTextColor="#8195a8" secureTextEntry style={s.input}/><Pressable style={s.loginBtn} onPress={enter}><Text style={s.loginBtnText}>ENTRAR</Text></Pressable><Pressable style={s.guestBtn} onPress={guest}><Text style={s.guestText}>CONTINUAR COMO ADEPTO</Text></Pressable></View></ImageBackground>}

export default function App(){
 const[session,setSession]=useState('login'),[tab,setTab]=useState('Início'),[article,setArticle]=useState(null);
 if(session==='login')return <SafeAreaView style={s.safe}><StatusBar style="light"/><View style={s.phone}><Login guest={()=>setSession('guest')} enter={()=>setSession('user')}/></View></SafeAreaView>;
 const onLogin=()=>setSession('login');
 let body=article?<Article item={article} back={()=>setArticle(null)}/>:tab==='Início'?<Home onLogin={onLogin} go={setTab} open={setArticle}/>:tab==='Jogos'?<Games onLogin={onLogin}/>:<View style={s.simple}><Text style={s.pageTitle}>{tab}</Text><Text style={s.simpleText}>Esta área será desenvolvida depois de aprovarmos a Home.</Text></View>;
 return <SafeAreaView style={s.safe}><StatusBar style="light"/><View style={s.phone}>{body}{!article&&<View style={s.nav}>{[['⌂','Início'],['◉','Jogos'],['◇','Bilhetes'],['♙','Sócio'],['☰','Mais']].map(([i,t])=><Pressable key={t} style={s.navItem} onPress={()=>setTab(t)}><Text style={[s.navIcon,tab===t&&s.active]}>{i}</Text><Text style={[s.navText,tab===t&&s.active]}>{t}</Text></Pressable>)}</View>}</View></SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#010b13',alignItems:'center'},phone:{flex:1,width:'100%',maxWidth:540,backgroundColor:C.bg,overflow:'hidden'},
 homeContent:{paddingBottom:112},headerBg:{height:176,justifyContent:'center',overflow:'hidden'},headerImg:{opacity:.38},blueShade:{position:'absolute',left:0,top:0,bottom:0,width:'62%',backgroundColor:'rgba(0,28,59,.88)'},wineShade:{position:'absolute',right:0,top:0,bottom:0,width:'50%',backgroundColor:'rgba(95,12,38,.70)'},
 header:{paddingHorizontal:26,flexDirection:'row',alignItems:'center',gap:14},brandBox:{flex:1},brandThin:{color:'#fff',fontSize:16,letterSpacing:3},brandBold:{color:'#fff',fontSize:24,fontWeight:'900',letterSpacing:.2},headerActions:{flexDirection:'row',alignItems:'center',gap:10},search:{color:'#fff',fontSize:31,transform:[{rotate:'-15deg'}]},userIcon:{width:36,height:36,borderWidth:1,borderColor:'rgba(255,255,255,.35)',borderRadius:8,alignItems:'center',justifyContent:'center'},userGlyph:{color:'#fff',fontSize:22},enter:{color:'#fff',fontWeight:'900',fontSize:13},
 body:{paddingHorizontal:18,marginTop:-18},matchCard:{backgroundColor:'rgba(8,37,61,.97)',borderRadius:22,borderWidth:1,borderColor:'#33536d',padding:19,shadowColor:'#000',shadowOpacity:.35,shadowRadius:18,elevation:6},matchHead:{flexDirection:'row',justifyContent:'space-between'},comp:{color:'#b8c9d7',fontSize:11,fontWeight:'800',letterSpacing:1.2},round:{color:'#fff',fontSize:12,marginTop:6},whenWrap:{flexDirection:'row',alignItems:'center',gap:7},calendar:{color:'#fff',fontSize:18},when:{color:'#fff',fontWeight:'900',fontSize:12},teams:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginVertical:18},team:{width:'39%',alignItems:'center'},clubLogo:{width:82,height:82},teamName:{color:'#fff',fontSize:11,fontWeight:'900',marginTop:7,textAlign:'center'},vs:{color:'#8da4b8',fontSize:20,fontWeight:'900'},stadium:{color:'#c0ced9',textAlign:'center',fontSize:11},gameBtn:{height:53,borderRadius:12,backgroundColor:C.wine,marginTop:15,flexDirection:'row',gap:10,alignItems:'center',justifyContent:'center'},ticket:{color:'#fff',fontSize:22},gameBtnText:{color:'#fff',fontSize:13,fontWeight:'900'},
 shortcuts:{flexDirection:'row',gap:8,marginTop:14},short:{flex:1,height:82,borderRadius:14,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'},shortIcon:{color:C.gold,fontSize:22},shortText:{color:'#fff',fontWeight:'800',fontSize:7.5,marginTop:6,textAlign:'center'},
 newsHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:30,marginBottom:12},newsHeading:{color:'#fff',fontSize:27,fontWeight:'900'},all:{color:'#fff',fontWeight:'900',fontSize:9},newsGrid:{flexDirection:'row',gap:9,alignItems:'stretch'},lead:{flex:1.12,minHeight:362,borderRadius:16,overflow:'hidden',backgroundColor:C.panel,borderWidth:1,borderColor:C.line},leadImage:{width:'100%',height:'100%'},leadOverlay:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(1,16,29,.25)'},leadTextBox:{position:'absolute',left:0,right:0,bottom:0,padding:14,backgroundColor:'rgba(2,17,29,.78)'},pill:{alignSelf:'flex-start',backgroundColor:C.wine2,color:'#fff',fontSize:7.5,fontWeight:'900',paddingHorizontal:7,paddingVertical:4,borderRadius:5,overflow:'hidden'},newsDate:{color:'#aebdca',fontSize:8,marginTop:7},leadTitle:{color:'#fff',fontSize:19,fontWeight:'900',lineHeight:22,marginTop:6},leadDesc:{color:'#d4dde4',fontSize:10.5,lineHeight:16,marginTop:6},chevBottom:{position:'absolute',right:12,bottom:10,color:'#fff',fontSize:24},sideCol:{flex:1,gap:8},sideCard:{flex:1,minHeight:114,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.panel,borderRadius:14,borderWidth:1,borderColor:C.line,padding:8},thumb:{width:58,height:78,borderRadius:9,backgroundColor:'#112f47'},sideText:{flex:1},sideTitle:{color:'#fff',fontWeight:'900',fontSize:10.5,lineHeight:14,marginTop:5},sideArrow:{color:'#b8c6d2',fontSize:22},
 articlePage:{padding:20,paddingBottom:40,backgroundColor:C.bg},back:{color:C.gold,fontWeight:'900',marginVertical:8},articleImg:{width:'100%',height:255,borderRadius:18,marginBottom:15},articleDate:{color:C.muted,fontSize:9,marginTop:9},articleTitle:{color:'#fff',fontSize:30,fontWeight:'900',lineHeight:34,marginTop:9},articleLead:{color:'#d1dbe3',fontSize:16,lineHeight:24,marginTop:14},articleBody:{color:'#aebdca',fontSize:13,lineHeight:21,marginTop:16},original:{borderWidth:1,borderColor:C.gold,borderRadius:11,padding:14,marginTop:22},originalText:{color:C.gold,fontWeight:'900',fontSize:9,textAlign:'center'},
 pageTitle:{color:'#fff',fontSize:30,fontWeight:'900',marginTop:16,marginBottom:12},fixture:{flexDirection:'row',alignItems:'center',backgroundColor:C.panel,borderRadius:13,borderWidth:1,borderColor:C.line,padding:15,marginBottom:9},fixtureDate:{color:C.gold,fontWeight:'900',fontSize:9,width:48},fixtureTeam:{color:'#fff',fontWeight:'800',fontSize:12,marginVertical:2},fixtureScore:{color:'#fff',fontWeight:'900'},
 nav:{position:'absolute',left:0,right:0,bottom:0,height:82,backgroundColor:'#031522',borderTopWidth:1,borderTopColor:'#2b455b',flexDirection:'row',alignItems:'center',justifyContent:'space-around'},navItem:{alignItems:'center',minWidth:58},navIcon:{color:'#8ea2b4',fontSize:21},navText:{color:'#8ea2b4',fontSize:8.5,fontWeight:'800',marginTop:4},active:{color:'#c42d4b'},
 loginPage:{flex:1,alignItems:'center',justifyContent:'center',padding:25},loginBg:{opacity:.8},loginTint:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(1,20,35,.82)'},loginThin:{color:'#fff',fontSize:17,letterSpacing:3,marginTop:10},loginBold:{color:'#fff',fontSize:29,fontWeight:'900'},loginCard:{width:'100%',backgroundColor:'rgba(8,37,61,.96)',borderRadius:18,borderWidth:1,borderColor:C.line,padding:20,marginTop:26},loginTitle:{color:'#fff',fontSize:26,fontWeight:'900',marginBottom:8},input:{height:50,borderRadius:10,backgroundColor:'#061d30',borderWidth:1,borderColor:C.line,color:'#fff',paddingHorizontal:13,marginTop:10},loginBtn:{height:52,borderRadius:11,backgroundColor:C.wine,alignItems:'center',justifyContent:'center',marginTop:15},loginBtnText:{color:'#fff',fontWeight:'900'},guestBtn:{padding:17,alignItems:'center'},guestText:{color:C.gold,fontWeight:'900',fontSize:10},
 simple:{flex:1,padding:24,backgroundColor:C.bg},simpleText:{color:C.muted}
});
