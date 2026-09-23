import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View, Text, Pressable, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';

const C={bg:'#021522',panel:'#092943',panel2:'#0b2e4b',line:'#31516a',white:'#f8fafc',muted:'#9fb2c7',gold:'#efb957',red:'#a31f3d',red2:'#7d142d'};
const actions=[['⌁','BILHETES'],['▣','TORRES PASS'],['♙','SÓCIO'],['♢','LOJA'],['☆','VANTAGENS']];
const news=[['EQUIPA PRINCIPAL','Convocatória para o jogo com o Tondela'],['CLUBE','Informações úteis para os adeptos'],['FORMAÇÃO','Juniores somam nova vitória']];

function Crest({small=false}){return <View style={[s.crest,{width:small?64:84,height:small?88:116}]}><View style={s.crown}><Text style={[s.crownText,{fontSize:small?19:24}]}>♛♛♛</Text></View><View style={s.shield}><Text style={[s.scut,{fontSize:small?17:22}]}>S C U T</Text><View style={s.castle}><Text style={{color:'#efb957',fontSize:small?25:34}}>♜</Text></View></View></View>}
function TeamTondela(){return <View style={s.team}><View style={s.tondela}><Text style={s.cdt}>CDT</Text><View style={s.stripes}><Text style={s.stripeText}>▮ ▮ ▮</Text></View></View><Text style={s.teamName}>CD TONDELA</Text></View>}
function TeamTorres(){return <View style={s.team}><Crest small/><Text style={s.teamName}>SCU TORREENSE</Text></View>}
function Icon({children}){return <Text style={s.icon}>{children}</Text>}

export default function App(){
 const {width}=useWindowDimensions(); const w=Math.min(width,560); const [modal,setModal]=useState(null);
 return <SafeAreaView style={s.safe}><StatusBar style="light"/><View style={[s.phone,{width:w}]}>
  <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
   <View style={s.hero}>
    <View style={s.blueGlow}/><View style={s.redGlow}/>
    <View style={s.castleBg}><Text style={s.castleBgText}>♜ ♜ ♜</Text></View>
    <View style={s.header}>
      <View style={s.brand}><Crest/><View style={s.brandText}><Text style={s.sport}>SPORT CLUBE</Text><Text style={s.uniao}>UNIÃO TORREENSE</Text><Text style={s.since}>DESDE 1917</Text></View></View>
      <View style={s.headerActions}><Pressable onPress={()=>setModal('Pesquisa')}><Text style={s.search}>⌕</Text></Pressable><View style={s.sep}/><Pressable style={s.login} onPress={()=>setModal('Entrar')}><Text style={s.userIcon}>♙</Text><Text style={s.loginText}>ENTRAR</Text></Pressable></View>
    </View>
   </View>

   <View style={s.match}>
    <View style={s.matchTop}><View><Text style={s.league}>LIGA PORTUGAL MEU SUPER</Text><Text style={s.round}>Jornada 7</Text></View><Text style={s.date}>▣  10 OUT 2025 · 15:30</Text></View>
    <View style={s.teams}><TeamTondela/><Text style={s.vs}>VS</Text><TeamTorres/><Text style={s.chev}>›</Text></View>
    <Text style={s.stadium}>⌖  Estádio João Cardoso</Text>
    <Pressable style={s.gameBtn} onPress={()=>setModal('Jogo')}><Text style={s.gameBtnText}>⌁   VER JOGO</Text></Pressable>
   </View>

   <View style={s.actions}>{actions.map(([ic,t])=><Pressable key={t} style={s.action} onPress={()=>setModal(t)}><Icon>{ic}</Icon><Text style={s.actionText}>{t}</Text></Pressable>)}</View>

   <View style={s.newsHeader}><Text style={s.newsTitle}>Últimas notícias</Text><Pressable onPress={()=>setModal('Notícias')}><Text style={s.all}>VER TODAS  ›</Text></Pressable></View>
   <View style={s.newsGrid}>
    <Pressable style={s.mainNews} onPress={()=>setModal('Estreia de sonho na Liga Europa')}>
      <View style={s.photoMock}><View style={s.player1}/><View style={s.player2}/><View style={s.player3}/><Crest small/></View>
      <View style={s.mainCopy}><Text style={s.tag}>EQUIPA PRINCIPAL</Text><Text style={s.newsDate}>21 SET 2025</Text><Text style={s.mainTitle}>Estreia de sonho na Liga Europa</Text><Text style={s.desc}>O Torreense entrou com o pé direito na Liga Europa, com uma exibição de grande nível e o apoio incrível dos nossos adeptos.</Text></View>
    </Pressable>
    <View style={s.sideNews}>{news.map(([tag,title],i)=><Pressable key={title} style={s.newsRow} onPress={()=>setModal(title)}><View style={s.thumb}><Text style={s.thumbIcon}>{i===1?'⚑':'●'}</Text></View><View style={s.rowCopy}><Text style={s.tag}>{tag}</Text><Text style={s.newsDate}>{19-i} SET 2025</Text><Text style={s.rowTitle}>{title}</Text></View><Text style={s.rowChev}>›</Text></Pressable>)}</View>
   </View>
  </ScrollView>

  <View style={s.nav}>{[['⌂','Início'],['◉','Jogos'],['⌁','Bilhetes'],['♙','Sócio'],['☰','Mais']].map(([ic,t],i)=><Pressable key={t} style={s.navItem} onPress={()=>i||setModal(t)}><Text style={[s.navIcon,i===0&&s.active]}>{ic}</Text><Text style={[s.navText,i===0&&s.active]}>{t}</Text>{i===0&&<View style={s.activeLine}/>}</Pressable>)}</View>

  {modal&&<View style={s.overlay}><Pressable style={StyleSheet.absoluteFill} onPress={()=>setModal(null)}/><View style={s.sheet}><Pressable onPress={()=>setModal(null)}><Text style={s.back}>‹ VOLTAR</Text></Pressable><Text style={s.sheetTitle}>{modal}</Text><Text style={s.sheetText}>Ecrã funcional preparado para ligação aos dados reais numa fase seguinte.</Text></View></View>}
 </View></SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#000b13'},phone:{flex:1,alignSelf:'center',backgroundColor:C.bg,overflow:'hidden'},scroll:{paddingBottom:112},
 hero:{height:190,overflow:'hidden',position:'relative',borderTopLeftRadius:38,borderTopRightRadius:38},
 blueGlow:{position:'absolute',left:-80,top:-100,width:390,height:320,borderRadius:220,backgroundColor:'#062b62',opacity:.8},
 redGlow:{position:'absolute',right:-80,top:-110,width:370,height:330,borderRadius:220,backgroundColor:'#65172d',opacity:.82},
 castleBg:{position:'absolute',right:20,top:52,opacity:.13},castleBgText:{fontSize:86,color:'#000'},
 header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:26,paddingTop:20},
 brand:{flexDirection:'row',alignItems:'center',gap:16},brandText:{paddingTop:5},sport:{color:C.white,fontSize:17,letterSpacing:2.4,fontWeight:'400'},uniao:{color:C.white,fontSize:20,fontWeight:'900',letterSpacing:.4},since:{color:C.gold,fontSize:10,letterSpacing:3,marginTop:6,fontWeight:'700'},
 crest:{alignItems:'center',justifyContent:'flex-end'},crown:{height:24,justifyContent:'center'},crownText:{color:C.gold,letterSpacing:-7},shield:{flex:1,width:'78%',borderWidth:2,borderColor:C.gold,borderBottomLeftRadius:28,borderBottomRightRadius:28,backgroundColor:'#711a2e',alignItems:'center',paddingTop:9,overflow:'hidden'},scut:{color:C.gold,fontWeight:'900',letterSpacing:3},castle:{marginTop:6},
 headerActions:{flexDirection:'row',alignItems:'center',gap:12},search:{fontSize:37,color:'#fff'},sep:{width:1,height:38,backgroundColor:'rgba(255,255,255,.25)'},login:{flexDirection:'row',alignItems:'center',gap:8},userIcon:{fontSize:31,color:'#fff'},loginText:{fontSize:13,fontWeight:'900',color:'#fff'},
 match:{marginHorizontal:20,marginTop:-2,padding:20,borderRadius:22,backgroundColor:'rgba(8,42,70,.92)',borderWidth:1,borderColor:C.line},
 matchTop:{flexDirection:'row',justifyContent:'space-between'},league:{color:'#b8c9da',fontSize:12,fontWeight:'800',letterSpacing:1.2},round:{color:C.white,fontSize:13,marginTop:7},date:{color:C.white,fontSize:12,fontWeight:'800'},
 teams:{height:150,flexDirection:'row',alignItems:'center',justifyContent:'space-around',position:'relative'},team:{alignItems:'center',width:135},teamName:{color:C.white,fontWeight:'900',fontSize:12,marginTop:8},vs:{color:C.muted,fontWeight:'900',fontSize:20},chev:{position:'absolute',right:0,color:C.muted,fontSize:34},
 tondela:{width:76,height:92,backgroundColor:'#fff',borderColor:'#198244',borderWidth:4,borderBottomLeftRadius:35,borderBottomRightRadius:35,alignItems:'center',overflow:'hidden'},cdt:{fontWeight:'900',fontSize:17,color:'#13231a',marginTop:6},stripes:{flex:1,justifyContent:'center'},stripeText:{color:'#e3c238',fontSize:22,fontWeight:'900',backgroundColor:'#198244'},
 stadium:{textAlign:'center',color:'#b9c8d8',fontSize:13,marginTop:-2,marginBottom:14},gameBtn:{height:54,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:C.red},gameBtnText:{color:'#fff',fontWeight:'900',fontSize:16},
 actions:{flexDirection:'row',gap:9,paddingHorizontal:20,paddingTop:16},action:{flex:1,height:100,borderRadius:16,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,alignItems:'center',justifyContent:'center'},icon:{fontSize:27,color:C.gold},actionText:{fontSize:9.5,color:C.white,fontWeight:'900',marginTop:10,textAlign:'center'},
 newsHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:22,marginTop:27,marginBottom:12},newsTitle:{color:'#fff',fontSize:30,fontWeight:'900'},all:{color:'#fff',fontSize:11,fontWeight:'900'},
 newsGrid:{paddingHorizontal:20,gap:10},mainNews:{borderRadius:18,overflow:'hidden',backgroundColor:C.panel,borderWidth:1,borderColor:C.line},photoMock:{height:190,backgroundColor:'#173f5b',position:'relative',flexDirection:'row',alignItems:'flex-end',justifyContent:'center',gap:6,paddingBottom:15},player1:{width:54,height:92,borderRadius:25,backgroundColor:'#65182e'},player2:{width:60,height:120,borderRadius:28,backgroundColor:'#7d2037'},player3:{width:52,height:86,borderRadius:24,backgroundColor:'#561225'},mainCopy:{padding:18},tag:{alignSelf:'flex-start',backgroundColor:C.red,borderRadius:7,paddingHorizontal:8,paddingVertical:5,color:'#fff',fontSize:9,fontWeight:'900'},newsDate:{color:'#aebfd0',fontSize:10,marginTop:9},mainTitle:{color:'#fff',fontSize:23,fontWeight:'900',marginTop:7},desc:{color:'#d0d9e2',fontSize:13,lineHeight:20,marginTop:8},
 sideNews:{gap:9,marginTop:0},newsRow:{minHeight:112,borderRadius:16,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,padding:10,flexDirection:'row',alignItems:'center'},thumb:{width:88,height:88,borderRadius:10,backgroundColor:'#173d58',alignItems:'center',justifyContent:'center'},thumbIcon:{fontSize:30,color:C.gold},rowCopy:{flex:1,paddingHorizontal:12},rowTitle:{color:'#fff',fontWeight:'800',fontSize:14,lineHeight:18,marginTop:5},rowChev:{color:C.muted,fontSize:28},
 nav:{height:92,position:'absolute',left:0,right:0,bottom:0,backgroundColor:'rgba(2,21,34,.98)',borderTopWidth:1,borderTopColor:C.line,flexDirection:'row'},navItem:{flex:1,alignItems:'center',justifyContent:'center'},navIcon:{color:'#91a5bc',fontSize:27},navText:{color:'#91a5bc',fontSize:11,marginTop:4},active:{color:'#d82b46',fontWeight:'900'},activeLine:{width:30,height:3,borderRadius:2,backgroundColor:'#d82b46',marginTop:7},
 overlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,8,16,.72)',alignItems:'center',justifyContent:'center',zIndex:20},sheet:{width:'84%',padding:24,borderRadius:22,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line},back:{color:C.gold,fontWeight:'900',fontSize:12},sheetTitle:{color:'#fff',fontSize:26,fontWeight:'900',marginTop:18},sheetText:{color:'#c5d2de',fontSize:14,lineHeight:21,marginTop:12}
});