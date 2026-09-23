import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, Platform, useWindowDimensions, Text, Pressable, ActivityIndicator } from 'react-native';

const LOGO_URL='https://raw.githubusercontent.com/pophub9999/football-club-saas/v2-visual-first/v2-app/assets/torreense-logo.svg';
const SPORTS_DB='https://www.thesportsdb.com/api/v1/json/123';
const TORREENSE_ID='143720';

function RemoteLogo({uri,style,alt}) {
  if (!uri) return null;
  return Platform.OS==='web'
    ? React.createElement('img',{src:uri,style:{...style,objectFit:'contain'},alt})
    : <Image source={{uri}} style={style} resizeMode="contain"/>;
}
function ShortcutIcon({type}) {
  const gold='#f1b94f';
  if (Platform.OS==='web') {
    const paths={
      calendar:'<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 3v6M16 3v6M4 10h16"/>',
      news:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h4v4H7zM14 9h4M14 12h4M7 16h11"/>',
      shop:'<path d="M6 8h12l1 12H5L6 8zM9 9V7a3 3 0 0 1 6 0v2"/>',
      members:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M16 6a3 3 0 0 1 0 6M17 14c2.5.4 4 2.3 4 5"/>',
      star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3z"/>'
    };
    return React.createElement('svg',{
      width:28,height:28,viewBox:'0 0 24 24',fill:'none',stroke:gold,
      strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round',
      dangerouslySetInnerHTML:{__html:paths[type]}
    });
  }

  // Native fallback keeps the same gold outline language without external assets.
  const glyph={calendar:'▣',news:'▤',shop:'♧',members:'♙',star:'☆'}[type];
  return <Text style={s.quickIconFallback}>{glyph}</Text>;
}

function fmtDate(iso){
  if(!iso)return '';
  const d=new Date(iso);
  return new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Lisbon'}).format(d).replace(',',' ·').toUpperCase();
}

export default function App(){
 const {width,height}=useWindowDimensions();
 const [game,setGame]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');

 const canvasWidth=Math.min(width,height/2), canvasHeight=canvasWidth*2;
 const canvasLeft=(width-canvasWidth)/2, canvasTop=(height-canvasHeight)/2;
 const logoStyle={position:'absolute',left:canvasLeft+canvasWidth*.055,top:canvasTop+canvasHeight*.025,width:canvasWidth*.13,height:canvasHeight*.085};
 const headerStyle={position:'absolute',left:canvasLeft+canvasWidth*.205,top:canvasTop+canvasHeight*.043};
 const contentStyle={position:'absolute',left:canvasLeft+canvasWidth*.055,top:canvasTop+canvasHeight*.145,width:canvasWidth*.89};

 useEffect(()=>{
  let live=true;
  async function load(){
   try{
    setLoading(true); setError('');
    const r=await fetch(SPORTS_DB+'/eventsnext.php?id='+TORREENSE_ID);
    if(!r.ok) throw new Error('TheSportsDB HTTP '+r.status);
    const j=await r.json();
    const ev=j.events?.[0];
    if(!ev) throw new Error('TheSportsDB não devolveu próximo jogo');

    const dateTime=ev.strTimestamp || (ev.dateEvent ? ev.dateEvent+'T'+(ev.strTime||'00:00:00') : null);
    const normalized={
      fixture:{
        date:dateTime,
        venue:{name:ev.strVenue||'',city:ev.strCity||''}
      },
      league:{name:ev.strLeague||'Liga Portugal',round:ev.intRound ? 'Jornada '+ev.intRound : 'Próximo jogo'},
      teams:{
        home:{name:ev.strHomeTeam,logo:ev.strHomeTeamBadge||ev.strHomeTeamLogo||null},
        away:{name:ev.strAwayTeam,logo:ev.strAwayTeamBadge||ev.strAwayTeamLogo||null}
      }
    };
    if(live)setGame(normalized);
   }catch(e){if(live)setError(e.message||'Erro ao obter jogo');}
   finally{if(live)setLoading(false);}
  }
  load(); return()=>{live=false};
 },[]);

 const home=game?.teams?.home, away=game?.teams?.away;
 return <View style={s.root}>
  <StatusBar hidden/>
  <Image source={require('./assets/home-background.png')} style={s.background} resizeMode="contain"/>
  <RemoteLogo uri={LOGO_URL} style={logoStyle} alt="SCU Torreense"/>
  <View style={headerStyle} pointerEvents="none">
   <Text style={s.clubLine}><Text style={s.clubLight}>SCU </Text>TORREENSE</Text>
  </View>

  <View style={contentStyle}>
   <View style={s.card}>
    {loading ? <View style={s.loading}><ActivityIndicator/><Text style={s.loadingText}>A obter próximo jogo…</Text></View> :
    error ? <View style={s.loading}><Text style={s.error}>Não foi possível atualizar o jogo.</Text><Text style={s.errorSmall}>{error}</Text></View> :
    <>
     <View style={s.header}>
      <View style={s.headerLeft}><Text style={s.competition} numberOfLines={1}>{game.league?.name||'COMPETIÇÃO'}</Text><Text style={s.round}>{game.league?.round||'Próximo jogo'}</Text></View>
      <Text style={s.date}>{fmtDate(game.fixture?.date)}</Text>
     </View>

     <View style={s.teams}>
      <View style={s.team}><RemoteLogo uri={home?.logo} style={s.teamLogo} alt={home?.name}/><Text style={s.teamName} numberOfLines={2}>{home?.name}</Text></View>
      <Text style={s.vs}>VS</Text>
      <View style={s.team}><RemoteLogo uri={away?.logo} style={s.teamLogo} alt={away?.name}/><Text style={s.teamName} numberOfLines={2}>{away?.name}</Text></View>
     </View>

     <Text style={s.stadium} numberOfLines={1}>⌖  {game.fixture?.venue?.name||game.fixture?.venue?.city||'Local a confirmar'}</Text>
     <Text style={s.detailsArrow}>›</Text>
    </>}
   </View>

   <View style={s.quickSection}>
    <View style={s.quickRow}>
     <Pressable style={s.quickCard}><ShortcutIcon type="calendar"/><Text style={s.quickText}>CALENDÁRIO</Text></Pressable>
     <Pressable style={s.quickCard}><ShortcutIcon type="news"/><Text style={s.quickText}>NOTÍCIAS</Text></Pressable>
     <Pressable style={s.quickCard}><ShortcutIcon type="shop"/><Text style={s.quickText}>LOJA</Text></Pressable>
     <Pressable style={s.quickCard}><ShortcutIcon type="members"/><Text style={s.quickText}>SÓCIOS</Text></Pressable>
     <Pressable style={s.quickCard}><ShortcutIcon type="star"/><Text style={s.quickText}>VANTAGENS</Text></Pressable>
    </View>
   </View>
  </View>
 </View>
}

const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#00142c',alignItems:'center',justifyContent:'center',overflow:'hidden'},
 background:{width:'100%',height:'100%'},
 card:{width:'100%',backgroundColor:'rgba(8,43,72,.90)',borderWidth:1,borderColor:'rgba(120,164,197,.34)',borderRadius:14,paddingHorizontal:13,paddingTop:9,paddingBottom:8,shadowColor:'#000',shadowOpacity:.25,shadowRadius:16,shadowOffset:{width:0,height:7}},
 loading:{height:205,alignItems:'center',justifyContent:'center'},
 loadingText:{color:'#b7cee2',fontSize:9,marginTop:9},error:{color:'#fff',fontSize:10,fontWeight:'800'},errorSmall:{color:'#9fb5c8',fontSize:8,marginTop:5},
 header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},headerLeft:{maxWidth:'58%'},
 competition:{color:'#b7cee2',fontSize:8,fontWeight:'800',letterSpacing:.65},round:{color:'#fff',fontSize:8.5,marginTop:3},date:{color:'#fff',fontSize:8,fontWeight:'800'},
 teams:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',marginTop:7},
 team:{width:'38%',alignItems:'center'},teamLogo:{width:39,height:43},teamName:{color:'#fff',fontSize:8,fontWeight:'800',marginTop:3,textAlign:'center',minHeight:16},vs:{color:'#93abc1',fontSize:12,fontWeight:'800'},
 stadium:{color:'#b8c8d8',fontSize:8,textAlign:'center',marginTop:4},
 detailsArrow:{position:'absolute',right:10,top:'48%',color:'#b7c9d9',fontSize:24,fontWeight:'300'},
 clubLine:{color:'#fff',fontSize:15,fontWeight:'900',letterSpacing:.2},
 clubLight:{color:'#b9cadb',fontWeight:'400'},
 quickSection:{marginTop:11,padding:7,borderRadius:14,backgroundColor:'rgba(5,35,62,.72)',borderWidth:1,borderColor:'rgba(120,164,197,.30)'},
 quickRow:{flexDirection:'row',justifyContent:'space-between'},
 quickCard:{width:'18.4%',height:61,borderRadius:10,backgroundColor:'rgba(8,43,72,.86)',borderWidth:1,borderColor:'rgba(79,139,181,.42)',alignItems:'center',justifyContent:'center',paddingHorizontal:2},
 quickIconFallback:{color:'#f1b94f',fontSize:22,fontWeight:'400',lineHeight:26},
 quickText:{color:'#fff',fontSize:5.9,fontWeight:'900',letterSpacing:.18,marginTop:5,textAlign:'center'}
});