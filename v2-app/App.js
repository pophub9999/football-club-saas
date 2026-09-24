import '@expo/metro-runtime';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, Platform, useWindowDimensions, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';

const LOGO_URL='https://raw.githubusercontent.com/pophub9999/football-club-saas/v2-visual-first/v2-app/assets/torreense-logo.svg';
const SUPABASE_URL='https://vcvnmcewoocoizjljmbc.supabase.co';
const SUPABASE_KEY='sb_publishable_TyM24TpRzq3_ijZsFRTVGg_bWM2WOky';
const SB_HEADERS={apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Cache-Control':'no-cache','Pragma':'no-cache'};
async function sb(path){
 const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{headers:SB_HEADERS,cache:'no-store'});
 if(!r.ok)throw new Error('Supabase '+r.status);
 return r.json();
}

function RemoteLogo({uri,style,alt}) {
 if(!uri)return null;
 return Platform.OS==='web'?React.createElement('img',{src:uri,style:{...style,objectFit:'contain'},alt}):<Image source={{uri}} style={style} resizeMode="contain"/>;
}
function TeamLogo({name,uri,style}){
 const finalUri=uri||(name==='SCU Torreense'?LOGO_URL:null);
 if(finalUri)return <RemoteLogo uri={finalUri} style={style} alt={name||'Equipa'}/>;
 const initials=(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
 return <View style={[style,s.teamLogoFallback]}><Text style={s.teamLogoFallbackText}>{initials}</Text></View>;
}
function PlayerPhoto({player}){
 if(player?.photo_url)return <Image source={{uri:player.photo_url}} style={s.playerPhoto} resizeMode="cover"/>;
 return <View style={[s.playerPhoto,s.playerPhotoFallback]}><TeamLogo name="SCU Torreense" style={s.playerPhotoLogo}/></View>;
}
function ShortcutIcon({type}) {
 const gold='#f1b94f';
 if(Platform.OS==='web'){
  const paths={
   calendar:'<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 3v6M16 3v6M4 10h16"/>',
   news:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h4v4H7zM14 9h4M14 12h4M7 16h11"/>',
   shop:'<path d="M6 8h12l1 12H5L6 8zM9 9V7a3 3 0 0 1 6 0v2"/>',
   members:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M16 6a3 3 0 0 1 0 6M17 14c2.5.4 4 2.3 4 5"/>',
   star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3z"/>'
  };
  return React.createElement('svg',{width:27,height:27,viewBox:'0 0 24 24',fill:'none',stroke:gold,strokeWidth:1.35,strokeLinecap:'round',strokeLinejoin:'round',dangerouslySetInnerHTML:{__html:paths[type]}});
 }
 const glyph={calendar:'▣',news:'▤',shop:'♧',members:'♙',star:'☆'}[type];
 return <Text style={s.quickIconFallback}>{glyph}</Text>;
}
function fmtDate(iso){
 if(!iso)return '';
 const d=new Date(iso);
 return new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Lisbon'}).format(d).replace(',',' ·').toUpperCase();
}
function fmtGameDate(ev){
 const iso=ev?.strTimestamp||ev?.starts_at;
 if(!iso)return '';
 const d=new Date(iso);
 if(ev?._timeConfirmed===false){
  return new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'short',year:'numeric',timeZone:'Europe/Lisbon'}).format(d).toUpperCase();
 }
 return fmtDate(iso);
}
function cleanHtml(v=''){return v.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}
function toDate(ev){return ev?.strTimestamp||(ev?.dateEvent?ev.dateEvent+'T'+(ev.strTime||'00:00:00'):null);}
function cleanNewsTitle(v=''){return v.replace(/\s*\|\s*(?:Site Oficial do )?Torreense\s*$/i,'').trim();}
function cleanNewsText(v=''){
 let x=cleanHtml(v||'');
 const share=x.toLowerCase().lastIndexOf('partilhar notícia:');
 if(share>=0)x=x.slice(share+'partilhar notícia:'.length).trim();
 const latest=x.toLowerCase().indexOf('últimas notícias');
 if(latest>=0)x=x.slice(0,latest).trim();
 return x.replace(/^(?:facebook|twitter|linkedin|x)\b[\s:|•-]*/i,'').trim();
}
function ArticleImage({uri,hero=false}){
 const {width,height}=useWindowDimensions();
 const [loaded,setLoaded]=useState(false);
 const [failed,setFailed]=useState(false);
 if(!uri||failed)return null;

 const isPrice=/prices\.png|Captura/i.test(uri);
 const isMap=/map\.jpg|MapaEstadio/i.test(uri);
 const canvasWidth=Math.min(width,height/2);
 const imageWidth=Math.max(120,canvasWidth*.89-28);
 const targetHeight=isPrice
   ? imageWidth/(1000/170)
   : isMap
     ? imageWidth/(1000/920)
     : imageWidth/1.8;

 const frameStyle={
  width:'100%',
  height:loaded?targetHeight:0,
  alignSelf:'center',
  marginTop:loaded?(hero?0:10):0,
  marginBottom:loaded?(hero?16:10):0,
  overflow:'hidden',
  borderRadius:hero?12:10
 };

 if(Platform.OS==='web'){
  return <View style={frameStyle}>
   {React.createElement('img',{
    src:uri,
    alt:'',
    onLoad:()=>setLoaded(true),
    onError:()=>setFailed(true),
    style:{
     position:'absolute',left:0,top:0,
     width:'100%',height:'100%',
     objectFit:'contain',display:'block'
    }
   })}
  </View>;
 }

 return <View style={frameStyle}>
  <Image
   source={{uri}}
   resizeMode="contain"
   onLoad={()=>setLoaded(true)}
   onError={()=>setFailed(true)}
   style={StyleSheet.absoluteFillObject}
  />
 </View>;
}

function articleBlocks(html='',fallback='',url=''){
 if(!html)return fallback?cleanNewsText(fallback).split(/\n\s*\n/).filter(Boolean).map(text=>({type:'p',text})):[];
 let body=html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi,' ');
 const blocks=[];
 const re=/<(h1|h2|h3|p|li|img)\b([^>]*)>([\s\S]*?)<\/\1>|<img\b([^>]*)\/?>/gi;
 let m;
 while((m=re.exec(body))){
  const tag=(m[1]||'img').toLowerCase(),attrs=m[2]||m[4]||'',inside=m[3]||'';
  if(tag==='img'){
   const sm=attrs.match(/(?:src|data-src)=["']([^"']+)["']/i);
   if(sm?.[1]&&!/logo|icon/i.test(sm[1]))blocks.push({type:'img',src:sm[1]});
  }else{
   const text=cleanNewsText(inside);
   if(text&&text.length>1)blocks.push({type:tag==='li'?'li':tag[0]==='h'?'h':'p',text});
  }
 }
 let out=blocks.length?blocks:(fallback?[{type:'p',text:cleanNewsText(fallback)}]:[]);
 if(/\/blog\/bilhetesjornada2ligaeuropa\/?$/i.test(url||'')){
  const price='https://vcvnmcewoocoizjljmbc.supabase.co/storage/v1/object/public/news/torreense/bilhetesjornada2ligaeuropa/prices.png';
  const map='https://vcvnmcewoocoizjljmbc.supabase.co/storage/v1/object/public/news/torreense/bilhetesjornada2ligaeuropa/map.jpg';
  out=out.filter(b=>b.type!=='img');
  const withImgs=[];
  for(const b of out){
   withImgs.push(b);
   if(/Os preços são os seguintes:/i.test(b.text||''))withImgs.push({type:'img',src:price});
   if(/consulte o mapa:/i.test(b.text||''))withImgs.push({type:'img',src:map});
  }
  out=withImgs;
 }
 return out;
}


export default function App(){
 const {width,height}=useWindowDimensions();
 const [screen,setScreen]=useState('home'),[previousScreen,setPreviousScreen]=useState('home');
 const [game,setGame]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [gameInfo,setGameInfo]=useState({event:null,stats:[],lineup:[],timeline:[],results:[]}),[gameLoading,setGameLoading]=useState(false),[gameTab,setGameTab]=useState('RESUMO');
 const [news,setNews]=useState([]),[selectedNews,setSelectedNews]=useState(null),[articleLoading,setArticleLoading]=useState(false);
 const [calendar,setCalendar]=useState([]),[sport,setSport]=useState('TODAS'),[calendarLoading,setCalendarLoading]=useState(false);
 const [players,setPlayers]=useState([]),[squadTeam,setSquadTeam]=useState('');
 const [syncVersion,setSyncVersion]=useState(null);

 const canvasWidth=Math.min(width,height/2),canvasHeight=canvasWidth*2,canvasLeft=(width-canvasWidth)/2,canvasTop=(height-canvasHeight)/2;
 const logoStyle={position:'absolute',left:canvasLeft+canvasWidth*.055,top:canvasTop+canvasHeight*.025,width:canvasWidth*.13,height:canvasHeight*.085};
 const headerStyle={position:'absolute',left:canvasLeft+canvasWidth*.205,top:canvasTop+canvasHeight*.043};
 const contentStyle={position:'absolute',left:canvasLeft+canvasWidth*.055,top:canvasTop+canvasHeight*.145,width:canvasWidth*.89,height:canvasHeight*.80};

 useEffect(()=>{let live=true;(async()=>{try{
  setLoading(true);
  const [v,n,m,p,st]=await Promise.all([
   sb('app_sync?select=version,updated_at&id=eq.1'),
   sb('news?select=id,title,category,published_at,url,hero_image_url,excerpt,content_text,content_html&active=eq.true&order=published_at.desc.nullslast&limit=100'),
   sb('matches?select=id,event_type,round,starts_at,status,venue,city,home_score,away_score,raw_data,competitions(name),sports(name),home:teams!matches_home_team_id_fkey(name,logo_url),away:teams!matches_away_team_id_fkey(name,logo_url)&order=starts_at.asc&limit=200'),
   sb('players?select=id,name,short_name,shirt_number,position,birth_date,nationality,height_cm,photo_url,team:teams!players_team_id_fkey(id,name,short_name,age_group,gender,sports(name))&active=eq.true&order=shirt_number.asc&limit=500'),
   sb('standings?select=position,played,wins,draws,losses,goals_for,goals_against,points,team:teams!standings_team_id_fkey(name)&order=position.asc&limit=50')
  ]);
  if(!live)return;
  setSyncVersion(v?.[0]?.version||1);
  setNews((n||[]).map(x=>({id:x.id,title:x.title,category:x.category||'TORREENSE',date:x.published_at?new Date(x.published_at).toLocaleDateString('pt-PT'):'',url:x.url,body:x.content_text||'',html:x.content_html||'',hero:x.hero_image_url,excerpt:x.excerpt})));
  setPlayers(p||[]);
  const positions={};(st||[]).forEach(x=>{if(x.team?.name)positions[x.team.name]=x;});

  const mapped=(m||[]).map(x=>{
   const timeConfirmed=x.raw_data?.time_confirmed!==false;
   const ev={
    idEvent:String(x.id),
    dbId:x.id,
    strLeague:x.competitions?.name||'COMPETIÇÃO',
    intRound:(x.round||'').replace(/^J/i,''),
    strTimestamp:x.starts_at,
    starts_at:x.starts_at,
    _timeConfirmed:timeConfirmed,
    strHomeTeam:x.home?.name||'',
    strAwayTeam:x.away?.name||'',
    strHomeTeamBadge:x.home?.logo_url||null,
    strAwayTeamBadge:x.away?.logo_url||null,
    intHomeScore:x.home_score,
    intAwayScore:x.away_score,
    strVenue:x.venue||'Local a confirmar',
    strStatus:x.status,
    _homeStanding:positions[x.home?.name]||null,
    _awayStanding:positions[x.away?.name]||null,
    raw:x
   };
   return {
    raw:x,
    ev,
    cal:{
      id:String(x.id),
      sport:(x.sports?.name||'Futebol').toUpperCase(),
      type:(x.event_type||'JOGO').toUpperCase(),
      date:x.starts_at?new Date(x.starts_at).toLocaleDateString('pt-PT',{timeZone:'Europe/Lisbon'}):'',
      round:x.round||'',
      title:(x.home?.name||'')+' × '+(x.away?.name||''),
      time:timeConfirmed&&x.starts_at?new Date(x.starts_at).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Lisbon'}):'Hora a confirmar'
    }
   };
  });
  setCalendar(mapped.map(x=>x.cal));

  const now=Date.now();
  const next=mapped.find(x=>x.raw.status!=='finished' && x.raw.starts_at && new Date(x.raw.starts_at).getTime()>=now)
    || mapped.find(x=>x.raw.status!=='finished')
    || mapped[mapped.length-1];
  if(next)setGame(next.ev);
  else setError('Sem jogos em cache.');
 }catch(e){
  if(live)setError('Não foi possível ler os dados em cache.');
 }finally{
  if(live)setLoading(false);
 }})();return()=>{live=false}},[]);

 async function openGame(){
  setScreen('game');setGameTab('RESUMO');
  setGameInfo({event:game,stats:[],lineup:[],timeline:[],results:[]});
  setGameLoading(false);
 }
 async function openArticle(item){
  setPreviousScreen(screen);setSelectedNews(item);setScreen('article');
  setArticleLoading(true);
  try{
   const rows=await sb('news?select=id,title,category,published_at,url,hero_image_url,excerpt,content_text,content_html&id=eq.'+encodeURIComponent(item.id)+'&limit=1');
   const x=rows?.[0];
   if(x)setSelectedNews({...item,body:x.content_text||'',html:x.content_html||'',hero:x.hero_image_url||item.hero,excerpt:x.excerpt||item.excerpt});
  }catch(e){setSelectedNews({...item,body:'Não foi possível carregar o conteúdo desta notícia.'})}
  finally{setArticleLoading(false)}
 }
 async function openCalendar(){
  setScreen('calendar');
  setCalendarLoading(false);
 }
 const officialNews=news;
 const sports=['TODAS','FUTEBOL','FUTSAL','FUTEBOL FEMININO','FORMAÇÃO'];
 const filtered=calendar.filter(x=>sport==='TODAS'||x.sport===sport);
 const squadTeams=[...new Map(players.filter(x=>x.team).map(x=>[x.team.id,x.team])).values()];
 const activeSquadId=squadTeam||String(squadTeams[0]?.id||'');
 const squadPlayers=players.filter(x=>String(x.team?.id||'')===activeSquadId);

 function Header(){return <><RemoteLogo uri={LOGO_URL} style={logoStyle} alt="SCU Torreense"/><View style={headerStyle}><Text style={s.clubLine}><Text style={s.clubLight}>SCU </Text>TORREENSE</Text></View></>}
 function Page({children}){return <View style={s.root}><StatusBar hidden/><Image source={require('./assets/home-background.png')} style={s.background} resizeMode="contain"/><Header/><View style={contentStyle}><ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView></View></View>}
 function Back({title,to='home'}){return <View style={s.pageHead}><Pressable onPress={()=>setScreen(to)}><Text style={s.back}>‹</Text></Pressable><Text style={s.pageTitle}>{title}</Text></View>}

 if(screen==='game'){
  const ev=gameInfo.event||game,home={name:ev?.strHomeTeam,logo:ev?.strHomeTeamBadge||ev?.strHomeTeamLogo},away={name:ev?.strAwayTeam,logo:ev?.strAwayTeamBadge||ev?.strAwayTeamLogo};
  return <Page><Back title="JOGO"/>{gameLoading?<ActivityIndicator/>:<>
   <View style={s.detailCard}><Text style={s.kicker}>{ev?.strLeague||'COMPETIÇÃO'} · {ev?.intRound?'JORNADA '+ev.intRound:''}</Text><Text style={s.detailDate}>{fmtGameDate(ev)}</Text><View style={s.teams}><View style={s.team}><TeamLogo name={home.name} uri={home.logo} style={s.bigLogo}/><Text style={s.teamName}>{home.name}</Text>{ev?._homeStanding&&<Text style={s.teamStanding}>{ev._homeStanding.position}.º · {ev._homeStanding.points} pts</Text>}</View><Text style={s.score}>{ev?.intHomeScore!=null?ev.intHomeScore+' - '+ev.intAwayScore:'VS'}</Text><View style={s.team}><TeamLogo name={away.name} uri={away.logo} style={s.bigLogo}/><Text style={s.teamName}>{away.name}</Text>{ev?._awayStanding&&<Text style={s.teamStanding}>{ev._awayStanding.position}.º · {ev._awayStanding.points} pts</Text>}</View></View><Text style={s.stadium}>⌖ {ev?.strVenue||'Local a confirmar'}{ev?.raw?.city?' · '+ev.raw.city:''}</Text><Text style={s.gameStatus}>{ev?.strStatus==='scheduled'?'Agendado':ev?.strStatus==='finished'?'Terminado':ev?.strStatus||''}</Text></View>
   <View style={s.gameTabs}>{['RESUMO','ESTATÍSTICAS','ONZE'].map(t=><Pressable key={t} onPress={()=>setGameTab(t)} style={[s.gameTab,gameTab===t&&s.gameTabOn]}><Text style={[s.gameTabText,gameTab===t&&s.gameTabTextOn]}>{t}</Text></Pressable>)}</View>
   {gameTab==='RESUMO'&&<View style={s.infoCard}><Text style={s.body}>{ev?.strDescriptionEN||('Jogo da '+(ev?.intRound?'jornada '+ev.intRound:'competição')+' entre '+(ev?.strHomeTeam||'')+' e '+(ev?.strAwayTeam||'')+'.')}</Text>{ev?._homeStanding&&ev?._awayStanding&&<Text style={[s.muted,{marginTop:8}]}>Classificação atual: {ev.strHomeTeam} {ev._homeStanding.position}.º ({ev._homeStanding.points} pts) · {ev.strAwayTeam} {ev._awayStanding.position}.º ({ev._awayStanding.points} pts)</Text>}{gameInfo.timeline.length>0&&<View style={s.timeline}>{gameInfo.timeline.map((x,i)=><Text key={i} style={s.body}>{x.strTimeline||x.strEvent||x.strPlayer||''}</Text>)}</View>}</View>}
   {gameTab==='ESTATÍSTICAS'&&<View style={s.infoCard}>{gameInfo.stats.length?gameInfo.stats.map((x,i)=><View key={i} style={s.statRow}><Text style={s.body}>{x.strStat||x.strStatType||'Estatística'}</Text><Text style={s.body}>{x.intHome||x.strHome||''}  {x.intAway||x.strAway||''}</Text></View>):<Text style={s.muted}>As estatísticas aparecem aqui quando forem disponibilizadas pela fonte.</Text>}</View>}
   {gameTab==='ONZE'&&<View style={s.infoCard}>{gameInfo.lineup.length?gameInfo.lineup.map((x,i)=><Text key={i} style={s.body}>{x.strPlayer||x.strPlayerName||x.strHomeTeam||''}</Text>):<Text style={s.muted}>O onze aparece aqui quando for disponibilizado pela fonte.</Text>}</View>}
  </>}</Page>
 }
 if(screen==='news')return <Page><Back title="NOTÍCIAS"/>{officialNews.map((item,i)=><Pressable key={i} style={s.newsCard} onPress={()=>openArticle(item)}><View style={s.newsAccent}/><View style={s.newsBody}><Text style={s.newsMeta}>{item.category}{item.date?' · '+item.date:''}</Text><Text style={s.newsTitle}>{item.title}</Text></View><Text style={s.newsArrow}>›</Text></Pressable>)}</Page>;
 if(screen==='article')return <Page><Back title="NOTÍCIAS" to={previousScreen==='news'?'news':'home'}/><View style={s.articleCard}><Text style={s.newsMeta}>{selectedNews?.category}</Text><Text style={s.articleTitle}>{cleanNewsTitle(selectedNews?.title||'')}</Text>{selectedNews?.hero?<ArticleImage uri={selectedNews.hero} hero version={syncVersion}/>:null}{articleLoading?<ActivityIndicator/>:<><View>{articleBlocks(selectedNews?.html,selectedNews?.body,selectedNews?.url).map((b,i)=>b.type==='img'?<ArticleImage key={i} uri={b.src} version={syncVersion}/>:<Text key={i} style={b.type==='h'?[s.articleParagraph,{fontSize:18,fontWeight:'700',marginTop:12}]:b.type==='li'?[s.articleParagraph,{paddingLeft:10}]:s.articleParagraph}>{b.type==='li'?'• '+b.text:b.text}</Text>)}</View><Pressable style={s.sourceButton} onPress={()=>Platform.OS==='web'&&window.open(selectedNews?.url,'_blank')}><Text style={s.sourceButtonText}>VER NO SITE OFICIAL</Text></Pressable></>}</View></Page>;
 if(screen==='squads')return <Page><Back title="PLANTÉIS"/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={s.filtersContent}>
   {squadTeams.map(t=><Pressable key={t.id} onPress={()=>setSquadTeam(String(t.id))} style={[s.filter,activeSquadId===String(t.id)&&s.filterOn]}><Text style={[s.filterText,activeSquadId===String(t.id)&&s.filterTextOn]}>{t.short_name||t.name}</Text></Pressable>)}
  </ScrollView>
  {squadPlayers.length?<View style={s.playerGrid}>{squadPlayers.map(p=><View key={p.id} style={s.playerCard}>
   <PlayerPhoto player={p}/>
   <View style={s.playerNumberBadge}><Text style={s.playerNumber}>{p.shirt_number??'—'}</Text></View>
   <Text style={s.playerName}>{p.short_name||p.name}</Text>
   <Text style={s.playerPosition}>{p.position||'Jogador'}</Text>
   {p.nationality?<Text style={s.playerMeta}>{p.nationality}</Text>:null}
   {p.birth_date?<Text style={s.playerMeta}>{new Date(p.birth_date+'T00:00:00').toLocaleDateString('pt-PT')}</Text>:null}
   {p.height_cm?<Text style={s.playerMeta}>{p.height_cm} cm</Text>:null}
  </View>)}</View>:<View style={s.infoCard}><Text style={s.muted}>Ainda não temos jogadores publicados para este plantel.</Text></View>}
 </Page>;
 if(screen==='calendar')return <Page><Back title="CALENDÁRIO"/><Pressable style={s.squadTopButton} onPress={()=>setScreen('squads')}><ShortcutIcon type="members"/><Text style={s.squadTopButtonText}>PLANTÉIS</Text><Text style={s.squadTopArrow}>›</Text></Pressable><ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={s.filtersContent}>{sports.map(x=><Pressable key={x} onPress={()=>setSport(x)} style={[s.filter,sport===x&&s.filterOn]}><Text style={[s.filterText,sport===x&&s.filterTextOn]}>{x}</Text></Pressable>)}</ScrollView>{calendarLoading?<ActivityIndicator/>:filtered.length?filtered.map(x=><View key={x.id} style={s.eventCard}><View style={s.dateBox}><Text style={s.dateBoxText}>{x.date}</Text><Text style={s.eventType}>{x.type}</Text></View><View style={s.eventBody}><Text style={s.eventSport}>{x.sport} · {x.round}</Text><Text style={s.eventTitle}>{x.title}</Text><Text style={s.muted}>{x.time}</Text></View></View>):<View style={s.infoCard}><Text style={s.muted}>Ainda não existem eventos publicados para esta modalidade.</Text></View>}</Page>;

 const home={name:game?.strHomeTeam,logo:game?.strHomeTeamBadge||game?.strHomeTeamLogo},away={name:game?.strAwayTeam,logo:game?.strAwayTeamBadge||game?.strAwayTeamLogo};
 return <Page>
  <Pressable style={s.card} onPress={openGame}>{loading?<View style={s.loading}><ActivityIndicator/></View>:error?<Text style={s.muted}>Não foi possível atualizar o jogo.</Text>:<><View style={s.header}><View><Text style={s.competition}>{game?.strLeague||'COMPETIÇÃO'}</Text><Text style={s.round}>{game?.intRound?'Jornada '+game.intRound:'Próximo jogo'}</Text></View><Text style={s.date}>{fmtGameDate(game)}</Text></View><View style={s.teams}><View style={s.team}><TeamLogo name={home.name} uri={home.logo} style={s.teamLogo}/><Text style={s.teamName}>{home.name}</Text>{game?._homeStanding&&<Text style={s.teamStanding}>{game._homeStanding.position}.º · {game._homeStanding.points} pts</Text>}</View><Text style={s.vs}>VS</Text><View style={s.team}><TeamLogo name={away.name} uri={away.logo} style={s.teamLogo}/><Text style={s.teamName}>{away.name}</Text>{game?._awayStanding&&<Text style={s.teamStanding}>{game._awayStanding.position}.º · {game._awayStanding.points} pts</Text>}</View></View><Text style={s.stadium}>⌖ {game?.strVenue||'Local a confirmar'}</Text><Text style={s.detailsArrow}>›</Text></>}</Pressable>
  <View style={s.quickSection}><View style={s.quickRow}>
   <Pressable style={s.quickCard} onPress={openCalendar}><ShortcutIcon type="calendar"/><Text style={s.quickText}>CALENDÁRIO</Text></Pressable>
   <Pressable style={s.quickCard} onPress={()=>setScreen('news')}><ShortcutIcon type="news"/><Text style={s.quickText}>NOTÍCIAS</Text></Pressable>
   <Pressable style={s.quickCard}><ShortcutIcon type="shop"/><Text style={s.quickText}>LOJA</Text></Pressable>
   <Pressable style={s.quickCard}><ShortcutIcon type="members"/><Text style={s.quickText}>SÓCIOS</Text></Pressable>
   <Pressable style={s.quickCard}><ShortcutIcon type="star"/><Text style={s.quickText}>VANTAGENS</Text></Pressable>
  </View><Pressable style={s.squadShortcut} onPress={()=>setScreen('squads')}><ShortcutIcon type="members"/><Text style={s.squadShortcutText}>PLANTÉIS</Text><Text style={s.squadShortcutArrow}>›</Text></Pressable></View>
  <View style={s.newsSection}><View style={s.newsHeader}><Text style={s.newsHeading}>ÚLTIMAS NOTÍCIAS</Text><Text style={s.newsMore}>VER TODAS ›</Text></View>{officialNews.slice(0,3).map((item,i)=><Pressable key={i} style={s.newsCard} onPress={()=>openArticle(item)}><View style={s.newsAccent}/><View style={s.newsBody}><Text style={s.newsMeta}>{item.category}</Text><Text style={s.newsTitle}>{item.title}</Text></View><Text style={s.newsArrow}>›</Text></Pressable>)}</View>
 </Page>
}

const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#00142c',alignItems:'center',justifyContent:'center',overflow:'hidden'},background:{width:'100%',height:'100%'},
 card:{width:'100%',backgroundColor:'rgba(8,43,72,.90)',borderWidth:1,borderColor:'rgba(120,164,197,.34)',borderRadius:14,paddingHorizontal:13,paddingVertical:9},
 loading:{height:120,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',justifyContent:'space-between'},competition:{color:'#b7cee2',fontSize:8,letterSpacing:.55},round:{color:'#fff',fontSize:8.5,marginTop:3},date:{color:'#fff',fontSize:8},
 teams:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',marginTop:7},team:{width:'38%',alignItems:'center'},teamLogo:{width:39,height:43},bigLogo:{width:52,height:58},teamLogoFallback:{borderRadius:999,backgroundColor:'rgba(255,255,255,.08)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.18)'},teamLogoFallbackText:{color:'#dce7ef',fontSize:8,fontWeight:'700'},teamName:{color:'#fff',fontSize:8,marginTop:3,textAlign:'center',minHeight:16},teamStanding:{color:'#91abc0',fontSize:6,marginTop:1},vs:{color:'#93abc1',fontSize:12},score:{color:'#fff',fontSize:19},stadium:{color:'#b8c8d8',fontSize:8,textAlign:'center',marginTop:4},gameStatus:{color:'#f1b94f',fontSize:6,textAlign:'center',marginTop:3},detailsArrow:{position:'absolute',right:10,top:'48%',color:'#b7c9d9',fontSize:24},
 clubLine:{color:'#fff',fontSize:15,letterSpacing:.2},clubLight:{color:'#b9cadb'},quickSection:{marginTop:11,padding:7,borderRadius:14,backgroundColor:'rgba(5,35,62,.72)',borderWidth:1,borderColor:'rgba(120,164,197,.30)'},quickRow:{flexDirection:'row',justifyContent:'space-between'},quickCard:{width:'18.4%',height:61,borderRadius:10,backgroundColor:'rgba(8,43,72,.86)',borderWidth:1,borderColor:'rgba(79,139,181,.42)',alignItems:'center',justifyContent:'center',paddingHorizontal:2},quickIconFallback:{color:'#f1b94f',fontSize:22,lineHeight:26},quickText:{color:'#fff',fontSize:5.9,letterSpacing:.18,marginTop:5,textAlign:'center'},squadShortcut:{height:33,marginTop:7,borderRadius:9,borderWidth:1,borderColor:'rgba(241,185,79,.50)',backgroundColor:'rgba(8,43,72,.86)',flexDirection:'row',alignItems:'center',paddingHorizontal:10},squadShortcutText:{color:'#fff',fontSize:7,letterSpacing:.6,marginLeft:8,flex:1},squadShortcutArrow:{color:'#f1b94f',fontSize:18},
 newsSection:{marginTop:12},newsHeader:{flexDirection:'row',justifyContent:'space-between',marginBottom:7},newsHeading:{color:'#fff',fontSize:8.5,letterSpacing:.65},newsMore:{color:'#f1b94f',fontSize:6.5},newsCard:{minHeight:49,marginBottom:6,borderRadius:10,backgroundColor:'rgba(8,43,72,.84)',borderWidth:1,borderColor:'rgba(120,164,197,.25)',flexDirection:'row',alignItems:'center',overflow:'hidden'},newsAccent:{width:3,alignSelf:'stretch',backgroundColor:'#a91f42'},newsBody:{flex:1,paddingHorizontal:10,paddingVertical:7},newsMeta:{color:'#f1b94f',fontSize:5.8,letterSpacing:.45,marginBottom:3},newsTitle:{color:'#fff',fontSize:8,lineHeight:11},newsArrow:{color:'#9eb6c9',fontSize:18,paddingHorizontal:10},
 pageHead:{flexDirection:'row',alignItems:'center',marginBottom:14},back:{color:'#fff',fontSize:30,lineHeight:30,paddingRight:12},pageTitle:{color:'#fff',fontSize:14,letterSpacing:.8},detailCard:{backgroundColor:'rgba(8,43,72,.90)',borderRadius:14,padding:14,borderWidth:1,borderColor:'rgba(120,164,197,.3)'},kicker:{color:'#f1b94f',fontSize:7,letterSpacing:.5},detailDate:{color:'#fff',fontSize:9,marginTop:4,textAlign:'right'},blockTitle:{color:'#f1b94f',fontSize:7.5,letterSpacing:.7,marginTop:14,marginBottom:6},infoCard:{backgroundColor:'rgba(8,43,72,.82)',borderRadius:10,padding:11,borderWidth:1,borderColor:'rgba(120,164,197,.22)'},body:{color:'#fff',fontSize:8,lineHeight:13},muted:{color:'#a9bdcd',fontSize:8,lineHeight:12},statRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:4,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.08)'},
 articleCard:{backgroundColor:'rgba(8,43,72,.90)',borderRadius:14,padding:14,borderWidth:1,borderColor:'rgba(120,164,197,.3)'},articleTitle:{color:'#fff',fontSize:14,lineHeight:19,marginBottom:12},articleBody:{color:'#dce7ef',fontSize:8.5,lineHeight:14},articleParagraph:{color:'#dce7ef',fontSize:8.5,lineHeight:14,marginBottom:9},articleHeroImage:{width:'100%',height:190,borderRadius:12,marginBottom:16},articleInlineImage:{width:'100%',height:210,borderRadius:10,marginVertical:10},
 squadTopButton:{height:34,marginBottom:10,borderRadius:10,borderWidth:1,borderColor:'rgba(241,185,79,.55)',backgroundColor:'rgba(8,43,72,.82)',flexDirection:'row',alignItems:'center',paddingHorizontal:11},squadTopButtonText:{color:'#fff',fontSize:7.5,letterSpacing:.6,marginLeft:9,flex:1},squadTopArrow:{color:'#f1b94f',fontSize:18},playerGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},playerCard:{width:'48.5%',marginBottom:8,borderRadius:10,backgroundColor:'rgba(8,43,72,.86)',borderWidth:1,borderColor:'rgba(120,164,197,.25)',padding:7,position:'relative'},playerPhoto:{width:'100%',aspectRatio:.86,borderRadius:8,backgroundColor:'rgba(255,255,255,.05)'},playerPhotoFallback:{alignItems:'center',justifyContent:'center'},playerPhotoLogo:{width:52,height:64},playerNumberBadge:{position:'absolute',top:12,right:12,minWidth:22,height:22,borderRadius:11,backgroundColor:'#f1b94f',alignItems:'center',justifyContent:'center'},playerNumber:{color:'#082b48',fontSize:7,fontWeight:'700'},playerName:{color:'#fff',fontSize:7.4,lineHeight:10,marginTop:6,fontWeight:'600'},playerPosition:{color:'#f1b94f',fontSize:6.2,marginTop:2},playerMeta:{color:'#9fb5c7',fontSize:5.8,marginTop:2},filters:{marginBottom:12},filtersContent:{paddingRight:24},filter:{height:27,paddingHorizontal:10,marginRight:6,borderRadius:14,borderWidth:1,borderColor:'rgba(120,164,197,.35)',justifyContent:'center',backgroundColor:'rgba(8,43,72,.72)'},filterOn:{borderColor:'#f1b94f',backgroundColor:'rgba(241,185,79,.12)'},filterText:{color:'#b7c9d9',fontSize:6.5},filterTextOn:{color:'#f1b94f'},gameTabs:{flexDirection:'row',marginTop:10,marginBottom:8,borderRadius:10,backgroundColor:'rgba(4,28,51,.60)',padding:3},gameTab:{flex:1,height:29,alignItems:'center',justifyContent:'center',borderRadius:8},gameTabOn:{backgroundColor:'rgba(241,185,79,.14)',borderWidth:1,borderColor:'#f1b94f'},gameTabText:{color:'#aebfce',fontSize:7,letterSpacing:.3},gameTabTextOn:{color:'#f1b94f'},timeline:{marginTop:10,paddingTop:8,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.08)'},sourceButton:{marginTop:16,height:32,borderRadius:8,borderWidth:1,borderColor:'#f1b94f',alignItems:'center',justifyContent:'center'},sourceButtonText:{color:'#f1b94f',fontSize:7,letterSpacing:.4},eventCard:{flexDirection:'row',marginBottom:7,borderRadius:10,backgroundColor:'rgba(8,43,72,.84)',borderWidth:1,borderColor:'rgba(120,164,197,.25)',overflow:'hidden'},dateBox:{width:72,padding:9,justifyContent:'center',backgroundColor:'rgba(4,28,51,.55)'},dateBoxText:{color:'#fff',fontSize:8},eventType:{color:'#f1b94f',fontSize:5.8,marginTop:4},eventBody:{flex:1,padding:9},eventSport:{color:'#9eb6c9',fontSize:6},eventTitle:{color:'#fff',fontSize:8.5,marginVertical:3}
});