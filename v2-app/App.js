import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, Platform, useWindowDimensions, Text, Pressable, ActivityIndicator } from 'react-native';

const LOGO_URL='https://raw.githubusercontent.com/pophub9999/football-club-saas/v2-visual-first/v2-app/assets/torreense-logo.svg';
const API='https://v3.football.api-sports.io';
const API_KEY='983501ee4a4a6f41ea11b88ae30c3c92';

function RemoteLogo({uri,style,alt}) {
  if (!uri) return null;
  return Platform.OS==='web'
    ? React.createElement('img',{src:uri,style:{...style,objectFit:'contain'},alt})
    : <Image source={{uri}} style={style} resizeMode="contain"/>;
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
 const logoStyle={position:'absolute',left:canvasLeft+canvasWidth*.055,top:canvasTop+canvasHeight*.04,width:canvasWidth*.135,height:canvasHeight*.105};
 const contentStyle={position:'absolute',left:canvasLeft+canvasWidth*.055,top:canvasTop+canvasHeight*.185,width:canvasWidth*.89};

 useEffect(()=>{
  let live=true;
  async function load(){
   try{
    setLoading(true); setError('');
    const headers={'x-apisports-key':API_KEY};
    const tr=await fetch(API+'/teams?search=Torreense',{headers});
    const tj=await tr.json();
    if (tj.errors && Object.keys(tj.errors).length) throw new Error(JSON.stringify(tj.errors));
    const candidates=(tj.response||[]).filter(x=>/torreense/i.test(x.team?.name||''));
    if(!candidates.length) throw new Error('Torreense não encontrado na API');

    let nextGame=null;
    for (const candidate of candidates) {
      const fr=await fetch(API+'/fixtures?team='+candidate.team.id+'&next=10',{headers});
      const fj=await fr.json();
      if (fj.errors && Object.keys(fj.errors).length) throw new Error(JSON.stringify(fj.errors));
      const future=(fj.response||[])
        .filter(x=>new Date(x.fixture?.date).getTime()>Date.now())
        .sort((a,b)=>new Date(a.fixture.date)-new Date(b.fixture.date));
      if(future.length && (!nextGame || new Date(future[0].fixture.date)<new Date(nextGame.fixture.date))) {
        nextGame=future[0];
      }
    }
    if(!nextGame) throw new Error('A API-Football não devolveu fixtures futuras para o Torreense');
    if(live)setGame(nextGame);
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
     <Pressable style={s.button}><Text style={s.buttonText}>VER JOGO</Text></Pressable>
    </>}
   </View>
  </View>
 </View>
}

const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#00142c',alignItems:'center',justifyContent:'center',overflow:'hidden'},
 background:{width:'100%',height:'100%'},
 card:{width:'100%',backgroundColor:'rgba(8,43,72,.90)',borderWidth:1,borderColor:'rgba(120,164,197,.34)',borderRadius:16,paddingHorizontal:14,paddingTop:12,paddingBottom:11,shadowColor:'#000',shadowOpacity:.25,shadowRadius:16,shadowOffset:{width:0,height:7}},
 loading:{height:205,alignItems:'center',justifyContent:'center'},
 loadingText:{color:'#b7cee2',fontSize:9,marginTop:9},error:{color:'#fff',fontSize:10,fontWeight:'800'},errorSmall:{color:'#9fb5c8',fontSize:8,marginTop:5},
 header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},headerLeft:{maxWidth:'58%'},
 competition:{color:'#b7cee2',fontSize:8,fontWeight:'800',letterSpacing:.65},round:{color:'#fff',fontSize:8.5,marginTop:3},date:{color:'#fff',fontSize:8,fontWeight:'800'},
 teams:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',marginTop:11},
 team:{width:'38%',alignItems:'center'},teamLogo:{width:47,height:52},teamName:{color:'#fff',fontSize:8,fontWeight:'800',marginTop:5,textAlign:'center',minHeight:20},vs:{color:'#93abc1',fontSize:12,fontWeight:'800'},
 stadium:{color:'#b8c8d8',fontSize:8,textAlign:'center',marginTop:7},
 button:{marginTop:9,height:32,borderRadius:9,backgroundColor:'#9b1e3b',alignItems:'center',justifyContent:'center'},buttonText:{color:'#fff',fontSize:9,fontWeight:'900',letterSpacing:.35}
});