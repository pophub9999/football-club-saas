import React,{useState}from'react';
import{StatusBar}from'expo-status-bar';
import{SafeAreaView,View,Text,Pressable,StyleSheet,ScrollView,TextInput,Image,ImageBackground,Linking}from'react-native';

const C={bg:'#031523',bg2:'#041a2b',card:'#0a2742',card2:'#0d2b47',line:'#2a4862',wine:'#981f3d',wine2:'#b12b49',gold:'#e2b25b',white:'#fff',muted:'#9cafc0'};
const TORREENSE='data:image/png;base64,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';
const TONDELA='https://cdtondela.pt/assets/img/logo@2x.png';
const HEADER_BG='https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80';
const NEWS_IMG=[
 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=84',
 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=600&q=84',
 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=600&q=84',
 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=84'
];
const stories=[
 {id:1,cat:'EQUIPA PRINCIPAL',date:'21 SET 2026',title:'Estreia de sonho na Liga Europa',lead:'O Torreense entrou com o pé direito na Liga Europa, com uma exibição de grande nível e o apoio incrível dos nossos adeptos.',img:NEWS_IMG[0],url:'https://www.torreense.com/blog/estreialigaeuropa'},
 {id:2,cat:'EQUIPA PRINCIPAL',date:'19 SET 2026',title:'Convocatória para o jogo com o Tondela',lead:'Informação da equipa principal.',img:NEWS_IMG[1],url:'https://www.torreense.com/blog'},
 {id:3,cat:'CLUBE',date:'18 SET 2026',title:'Informações úteis para os adeptos',lead:'Tudo o que precisas de saber.',img:NEWS_IMG[2],url:'https://www.torreense.com/blog'},
 {id:4,cat:'FORMAÇÃO',date:'17 SET 2026',title:'Juniores somam nova vitória',lead:'A formação azul-grená em destaque.',img:NEWS_IMG[3],url:'https://www.torreense.com/blog'}
];

const Crest=({size=78})=><Image source={{uri:TORREENSE}} style={{width:size,height:size}} resizeMode="contain"/>;

function Header({onLogin}){
 return <ImageBackground source={{uri:HEADER_BG}} style={s.headerBg} imageStyle={s.headerBgImg}>
   <View style={s.headerBlue}/><View style={s.headerWine}/>
   <View style={s.header}>
     <Crest size={90}/>
     <View style={s.brandWrap}>
       <Text style={s.brandThin}>SPORT CLUBE</Text>
       <Text style={s.brandBold}>UNIÃO TORREENSE</Text>
       <Text style={s.brandSince}>DESDE 1917</Text>
     </View>
     <View style={s.headerActions}>
       <Text style={s.searchIcon}>⌕</Text>
       <View style={s.profileIcon}><Text style={s.profileText}>♙</Text></View>
       <Pressable onPress={onLogin}><Text style={s.enter}>ENTRAR</Text></Pressable>
     </View>
   </View>
 </ImageBackground>
}

function MatchCard({go}){
 return <View style={s.matchCard}>
   <View style={s.matchTop}>
     <View><Text style={s.comp}>LIGA PORTUGAL MEU SUPER</Text><Text style={s.round}>Jornada 7</Text></View>
     <View style={s.dateWrap}><Text style={s.calendar}>□</Text><Text style={s.when}>10 OUT 2026 · 15:30</Text></View>
   </View>
   <View style={s.teams}>
     <View style={s.team}><Image source={{uri:TONDELA}} style={s.teamLogo} resizeMode="contain"/><Text style={s.teamName}>CD TONDELA</Text></View>
     <Text style={s.vs}>VS</Text>
     <View style={s.team}><Crest size={86}/><Text style={s.teamName}>SCU TORREENSE</Text></View>
   </View>
   <Text style={s.stadium}>⌖  Estádio João Cardoso</Text>
   <Pressable style={s.gameBtn} onPress={()=>go('Jogos')}><Text style={s.ticket}>◇</Text><Text style={s.gameBtnText}>VER JOGO</Text></Pressable>
 </View>
}

function Shortcut({icon,label}){return <Pressable style={s.shortcut}><Text style={s.shortcutIcon}>{icon}</Text><Text style={s.shortcutLabel}>{label}</Text></Pressable>}
function Shortcuts(){return <View style={s.shortcuts}>
 <Shortcut icon="◇" label="BILHETES"/><Shortcut icon="▣" label="TORRES PASS"/><Shortcut icon="♙" label="SÓCIO"/><Shortcut icon="▱" label="LOJA"/><Shortcut icon="☆" label="VANTAGENS"/>
 </View>}

function News({open}){
 return <View>
   <View style={s.newsTop}><Text style={s.newsTitle}>Últimas notícias</Text><Text style={s.all}>VER TODAS  ›</Text></View>
   <View style={s.newsGrid}>
     <Pressable style={s.leadCard} onPress={()=>open(stories[0])}>
       <Image source={{uri:stories[0].img}} style={s.leadImg}/>
       <View style={s.leadShade}/>
       <View style={s.leadContent}>
         <Text style={s.pill}>{stories[0].cat}</Text>
         <Text style={s.newsDate}>{stories[0].date}</Text>
         <Text style={s.leadTitle}>{stories[0].title}</Text>
         <Text style={s.leadText}>{stories[0].lead}</Text>
         <Text style={s.moreArrow}>›</Text>
       </View>
     </Pressable>
     <View style={s.sideCol}>
       {stories.slice(1).map(n=><Pressable key={n.id} style={s.sideCard} onPress={()=>open(n)}>
         <Image source={{uri:n.img}} style={s.thumb}/>
         <View style={s.sideText}><Text style={s.pill}>{n.cat}</Text><Text style={s.newsDate}>{n.date}</Text><Text style={s.sideTitle}>{n.title}</Text></View>
         <Text style={s.sideArrow}>›</Text>
       </Pressable>)}
     </View>
   </View>
 </View>
}

function Home({onLogin,go,open}){return <ScrollView style={s.scroll} contentContainerStyle={s.homeContent}><Header onLogin={onLogin}/><View style={s.body}><MatchCard go={go}/><Shortcuts/><News open={open}/></View></ScrollView>}

function Article({item,back}){return <ScrollView contentContainerStyle={s.articlePage}>
 <Pressable onPress={back}><Text style={s.back}>‹ VOLTAR</Text></Pressable>
 <Image source={{uri:item.img}} style={s.articleImg}/>
 <Text style={s.pill}>{item.cat}</Text><Text style={s.articleDate}>{item.date}</Text><Text style={s.articleTitle}>{item.title}</Text><Text style={s.articleLead}>{item.lead}</Text>
 <Text style={s.articleBody}>Esta notícia é apresentada dentro da app. Quando ligarmos a sincronização editorial, o conteúdo completo será mostrado aqui e a ligação original ficará apenas no final.</Text>
 <Pressable style={s.original} onPress={()=>Linking.openURL(item.url)}><Text style={s.originalText}>VER NOTÍCIA ORIGINAL EM TORREENSE.COM ↗</Text></Pressable>
 </ScrollView>}

function Games({onLogin}){return <ScrollView contentContainerStyle={s.homeContent}><Header onLogin={onLogin}/><View style={s.body}><Text style={s.pageTitle}>Jogos</Text>{[['11 SET','SCU Torreense','0 - 0','Leixões SC'],['10 OUT','CD Tondela','15:30','SCU Torreense'],['26 OUT','SCU Torreense','—','Amarante F.C.']].map(g=><View style={s.fixture} key={g[0]}><Text style={s.fixtureDate}>{g[0]}</Text><View style={{flex:1}}><Text style={s.fixtureTeam}>{g[1]}</Text><Text style={s.fixtureTeam}>{g[3]}</Text></View><Text style={s.fixtureScore}>{g[2]}</Text></View>)}</View></ScrollView>}

function Login({guest,enter}){return <ImageBackground source={{uri:HEADER_BG}} style={s.loginPage} imageStyle={s.loginBg}><View style={s.loginTint}/><Crest size={120}/><Text style={s.loginThin}>SPORT CLUBE</Text><Text style={s.loginBold}>UNIÃO TORREENSE</Text><View style={s.loginCard}><Text style={s.loginTitle}>Bem-vindo</Text><TextInput placeholder="Email ou nº de sócio" placeholderTextColor="#8195a8" style={s.input}/><TextInput placeholder="Palavra-passe" placeholderTextColor="#8195a8" secureTextEntry style={s.input}/><Pressable style={s.loginBtn} onPress={enter}><Text style={s.loginBtnText}>ENTRAR</Text></Pressable><Pressable style={s.guestBtn} onPress={guest}><Text style={s.guestText}>CONTINUAR COMO ADEPTO</Text></Pressable></View></ImageBackground>}

export default function App(){
 const[session,setSession]=useState('login'),[tab,setTab]=useState('Início'),[article,setArticle]=useState(null);
 if(session==='login')return <SafeAreaView style={s.safe}><StatusBar style="light"/><View style={s.phone}><Login guest={()=>setSession('guest')} enter={()=>setSession('user')}/></View></SafeAreaView>;
 const login=()=>setSession('login');
 let body=article?<Article item={article} back={()=>setArticle(null)}/>:tab==='Início'?<Home onLogin={login} go={setTab} open={setArticle}/>:tab==='Jogos'?<Games onLogin={login}/>:<View style={s.simple}><Text style={s.pageTitle}>{tab}</Text><Text style={s.simpleText}>Esta área será desenvolvida depois de aprovarmos a Home.</Text></View>;
 return <SafeAreaView style={s.safe}><StatusBar style="light"/><View style={s.phone}>{body}{!article&&<View style={s.nav}>{[['⌂','Início'],['◉','Jogos'],['◇','Bilhetes'],['♙','Sócio'],['☰','Mais']].map(([i,t])=><Pressable key={t} style={s.navItem} onPress={()=>setTab(t)}><Text style={[s.navIcon,tab===t&&s.active]}>{i}</Text><Text style={[s.navText,tab===t&&s.active]}>{t}</Text></Pressable>)}</View>}</View></SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#010b13',alignItems:'center'},
 phone:{flex:1,width:'100%',maxWidth:512,backgroundColor:C.bg,overflow:'hidden',borderRadius:34,borderWidth:1,borderColor:'#53677a'},
 scroll:{flex:1},
 homeContent:{paddingBottom:92,backgroundColor:C.bg},
 headerBg:{height:174,justifyContent:'center',overflow:'hidden'},headerBgImg:{opacity:.36},
 headerBlue:{position:'absolute',left:0,top:0,bottom:0,width:'65%',backgroundColor:'rgba(0,28,58,.88)'},
 headerWine:{position:'absolute',right:0,top:0,bottom:0,width:'52%',backgroundColor:'rgba(90,9,36,.70)'},
 header:{paddingHorizontal:26,flexDirection:'row',alignItems:'center',gap:15},
 brandWrap:{flex:1},brandThin:{color:'#fff',fontSize:15,letterSpacing:3.3},brandBold:{color:'#fff',fontSize:23,fontWeight:'900',letterSpacing:.15},brandSince:{color:C.gold,fontSize:9,letterSpacing:2.1,marginTop:5},
 headerActions:{flexDirection:'row',alignItems:'center',gap:9},searchIcon:{color:'#fff',fontSize:31,transform:[{rotate:'-15deg'}]},profileIcon:{width:34,height:34,borderWidth:1,borderColor:'rgba(255,255,255,.35)',borderRadius:7,alignItems:'center',justifyContent:'center'},profileText:{color:'#fff',fontSize:21},enter:{color:'#fff',fontWeight:'900',fontSize:12.5},
 body:{paddingHorizontal:18,marginTop:-18},
 matchCard:{backgroundColor:'rgba(8,37,61,.98)',borderRadius:22,borderWidth:1,borderColor:'#35556f',padding:19,shadowColor:'#000',shadowOpacity:.35,shadowRadius:18,elevation:7},
 matchTop:{flexDirection:'row',justifyContent:'space-between'},comp:{color:'#bbc9d5',fontSize:10.5,fontWeight:'800',letterSpacing:1.25},round:{color:'#fff',fontSize:11.5,marginTop:6},dateWrap:{flexDirection:'row',alignItems:'center',gap:7},calendar:{color:'#fff',fontSize:18},when:{color:'#fff',fontWeight:'900',fontSize:11.5},
 teams:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginVertical:18},team:{width:'39%',alignItems:'center'},teamLogo:{width:79,height:79},teamName:{color:'#fff',fontSize:10.8,fontWeight:'900',marginTop:8,textAlign:'center'},vs:{color:'#8ea4b7',fontSize:19,fontWeight:'900'},stadium:{color:'#c4d0d9',textAlign:'center',fontSize:10.8},
 gameBtn:{height:52,borderRadius:12,backgroundColor:C.wine,marginTop:14,flexDirection:'row',gap:10,alignItems:'center',justifyContent:'center'},ticket:{color:'#fff',fontSize:22},gameBtnText:{color:'#fff',fontSize:13,fontWeight:'900'},
 shortcuts:{flexDirection:'row',gap:8,marginTop:13},shortcut:{flex:1,height:82,borderRadius:14,backgroundColor:C.card,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'},shortcutIcon:{color:C.gold,fontSize:22},shortcutLabel:{color:'#fff',fontWeight:'800',fontSize:7.3,marginTop:7,textAlign:'center'},
 newsTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:30,marginBottom:12},newsTitle:{color:'#fff',fontSize:27,fontWeight:'900'},all:{color:'#fff',fontWeight:'900',fontSize:9},
 newsGrid:{flexDirection:'row',gap:9,alignItems:'stretch'},leadCard:{flex:1.08,height:360,borderRadius:16,overflow:'hidden',backgroundColor:C.card,borderWidth:1,borderColor:C.line},leadImg:{width:'100%',height:'100%'},leadShade:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(2,16,28,.18)'},leadContent:{position:'absolute',left:0,right:0,bottom:0,padding:14,backgroundColor:'rgba(2,17,29,.80)'},
 pill:{alignSelf:'flex-start',backgroundColor:C.wine2,color:'#fff',fontSize:7.2,fontWeight:'900',paddingHorizontal:7,paddingVertical:4,borderRadius:5,overflow:'hidden'},newsDate:{color:'#aebdca',fontSize:8,marginTop:7},leadTitle:{color:'#fff',fontSize:19,fontWeight:'900',lineHeight:22,marginTop:6},leadText:{color:'#d4dde4',fontSize:10.3,lineHeight:15.5,marginTop:6},moreArrow:{position:'absolute',right:12,bottom:9,color:'#fff',fontSize:23},
 sideCol:{flex:1,gap:8},sideCard:{flex:1,minHeight:114,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.card,borderRadius:14,borderWidth:1,borderColor:C.line,padding:8},thumb:{width:58,height:78,borderRadius:9,backgroundColor:'#112f47'},sideText:{flex:1},sideTitle:{color:'#fff',fontWeight:'900',fontSize:10.4,lineHeight:14,marginTop:5},sideArrow:{color:'#b8c6d2',fontSize:22},
 nav:{position:'absolute',left:0,right:0,bottom:0,height:82,backgroundColor:'#031522',borderTopWidth:1,borderTopColor:'#2b455b',flexDirection:'row',alignItems:'center',justifyContent:'space-around'},navItem:{alignItems:'center',minWidth:58},navIcon:{color:'#8ea2b4',fontSize:21},navText:{color:'#8ea2b4',fontSize:8.5,fontWeight:'800',marginTop:4},active:{color:'#c42d4b'},
 articlePage:{padding:20,paddingBottom:40,backgroundColor:C.bg},back:{color:C.gold,fontWeight:'900',marginVertical:8},articleImg:{width:'100%',height:255,borderRadius:18,marginBottom:15},articleDate:{color:C.muted,fontSize:9,marginTop:9},articleTitle:{color:'#fff',fontSize:30,fontWeight:'900',lineHeight:34,marginTop:9},articleLead:{color:'#d1dbe3',fontSize:16,lineHeight:24,marginTop:14},articleBody:{color:'#aebdca',fontSize:13,lineHeight:21,marginTop:16},original:{borderWidth:1,borderColor:C.gold,borderRadius:11,padding:14,marginTop:22},originalText:{color:C.gold,fontWeight:'900',fontSize:9,textAlign:'center'},
 pageTitle:{color:'#fff',fontSize:30,fontWeight:'900',marginTop:16,marginBottom:12},fixture:{flexDirection:'row',alignItems:'center',backgroundColor:C.card,borderRadius:13,borderWidth:1,borderColor:C.line,padding:15,marginBottom:9},fixtureDate:{color:C.gold,fontWeight:'900',fontSize:9,width:48},fixtureTeam:{color:'#fff',fontWeight:'800',fontSize:12,marginVertical:2},fixtureScore:{color:'#fff',fontWeight:'900'},
 loginPage:{flex:1,alignItems:'center',justifyContent:'center',padding:25},loginBg:{opacity:.8},loginTint:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(1,20,35,.83)'},loginThin:{color:'#fff',fontSize:17,letterSpacing:3,marginTop:10},loginBold:{color:'#fff',fontSize:29,fontWeight:'900'},loginCard:{width:'100%',backgroundColor:'rgba(8,37,61,.96)',borderRadius:18,borderWidth:1,borderColor:C.line,padding:20,marginTop:26},loginTitle:{color:'#fff',fontSize:26,fontWeight:'900',marginBottom:8},input:{height:50,borderRadius:10,backgroundColor:'#061d30',borderWidth:1,borderColor:C.line,color:'#fff',paddingHorizontal:13,marginTop:10},loginBtn:{height:52,borderRadius:11,backgroundColor:C.wine,alignItems:'center',justifyContent:'center',marginTop:15},loginBtnText:{color:'#fff',fontWeight:'900'},guestBtn:{padding:17,alignItems:'center'},guestText:{color:C.gold,fontWeight:'900',fontSize:10},
 simple:{flex:1,padding:24,backgroundColor:C.bg},simpleText:{color:C.muted}
});
