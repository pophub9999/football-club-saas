import '@expo/metro-runtime';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, Platform, useWindowDimensions, Text, Pressable, ActivityIndicator, ScrollView, Linking, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const LOGO_URL='https://raw.githubusercontent.com/pophub9999/football-club-saas/v2-visual-first/v2-app/assets/torreense-logo.svg';
const SUPABASE_URL='https://vcvnmcewoocoizjljmbc.supabase.co';
const SUPABASE_KEY='sb_publishable_TyM24TpRzq3_ijZsFRTVGg_bWM2WOky';
const SB_HEADERS={apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Cache-Control':'no-cache','Pragma':'no-cache'};
async function sb(path){
 const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{headers:SB_HEADERS,cache:'no-store'});
 if(!r.ok)throw new Error('Supabase '+r.status);
 return r.json();
}
async function edge(name,options={}){
 const r=await fetch(SUPABASE_URL+'/functions/v1/'+name,{
  ...options,
  headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json',...(options.headers||{})}
 });
 const data=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error(data?.error||'Erro no serviço.');e.data=data;throw e}
 return data;
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
function Page({children}){
 const {width,height}=useWindowDimensions();
 const canvasWidth=Math.min(width,height/2),canvasHeight=canvasWidth*2,canvasLeft=(width-canvasWidth)/2,canvasTop=(height-canvasHeight)/2;
 const logoStyle={position:'absolute',left:canvasLeft+canvasWidth*.055,top:canvasTop+canvasHeight*.025,width:canvasWidth*.13,height:canvasHeight*.085};
 const headerStyle={position:'absolute',left:canvasLeft+canvasWidth*.205,top:canvasTop+canvasHeight*.043};
 const contentStyle={position:'absolute',left:canvasLeft+canvasWidth*.055,top:canvasTop+canvasHeight*.145,width:canvasWidth*.89,height:canvasHeight*.80};
 return <View style={s.root}>
  <StatusBar hidden/>
  <Image source={require('./assets/home-background.png')} style={s.background} resizeMode="contain"/>
  <RemoteLogo uri={LOGO_URL} style={logoStyle} alt="SCU Torreense"/>
  <View style={headerStyle}><Text style={s.clubLine}><Text style={s.clubLight}>SCU </Text>TORREENSE</Text></View>
  <View style={contentStyle}><ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView></View>
 </View>;
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


function playerPositionRank(position=''){
 const p=String(position).toLowerCase();
 if(p.includes('guarda'))return 1;
 if(p.includes('defesa'))return 2;
 if(p.includes('fixo'))return 2;
 if(p.includes('médio')||p.includes('medio'))return 3;
 if(p.includes('ala'))return 3;
 if(p.includes('avançado')||p.includes('avancado'))return 4;
 if(p.includes('pivô')||p.includes('pivo'))return 4;
 return 9;
}
function squadTeamRank(team={}){
 const sport=String(team.sports?.name||'').toLowerCase();
 const gender=String(team.gender||'M').toUpperCase();
 const isFootball=sport.includes('futebol')&&!sport.includes('futsal');
 const isFutsal=sport.includes('futsal');
 if(isFootball&&gender!=='F')return 10;
 if(isFootball&&gender==='F')return 20;
 if(isFutsal&&gender!=='F')return 30;
 if(isFutsal&&gender==='F')return 40;
 return 90;
}
function squadSubRank(team={}){
 const age=String(team.age_group||'').toLowerCase();
 if(!age||age==='seniores')return 0;
 const m=age.match(/(\d+)/);
 return m?100-Number(m[1]):50;
}
function benefitDiscountLabel(benefit={}){
 const pct=Number(benefit.discount_pct);
 if(Number.isFinite(pct)&&pct>0)return '−'+pct+'%';
 const label=String(benefit.discount_label||'').trim();
 const match=label.match(/(\d+(?:[.,]\d+)?)\s*%/);
 if(match)return '−'+match[1].replace(',','.')+'%';
 return label?label.toUpperCase():'VANTAGEM';
}
const EMPTY_MEMBER_FORM={firstName:'',lastName:'',birthDate:'',nif:'',email:'',phone:'',address:'',postalCode:'',city:'',guardianName:'',guardianEmail:''};
function memberAgeFromBirthDate(value=''){
 const m=String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(!m)return null;
 const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]);
 const born=new Date(y,mo-1,d);
 if(born.getFullYear()!==y||born.getMonth()!==mo-1||born.getDate()!==d)return null;
 const now=new Date();
 if(born>now)return null;
 let age=now.getFullYear()-y;
 const beforeBirthday=(now.getMonth()<mo-1)||(now.getMonth()===mo-1&&now.getDate()<d);
 if(beforeBirthday)age--;
 return age>=0?age:null;
}
function memberCategoryFromBirthDate(value=''){
 const age=memberAgeFromBirthDate(value);
 if(age==null)return null;
 if(age<=3)return 'Sócio Infantil';
 if(age<=14)return 'Sócio Juvenil';
 if(age<=70)return 'Sócio Efetivo';
 return 'Sócio +70';
}
function memberFee(category=''){
 const fees={
  'Sócio Infantil':{monthly:'0€',annual:'0€'},
  'Sócio Juvenil':{monthly:'3€',annual:'36€'},
  'Sócio Efetivo':{monthly:'6€',annual:'72€'},
  'Sócio +70':{monthly:'3€',annual:'36€'}
 };
 return fees[category]||null;
}
function memberFeeAmount(category='',plan='annual'){
 const monthly={'Sócio Infantil':0,'Sócio Juvenil':3,'Sócio Efetivo':6,'Sócio +70':3}[category];
 if(monthly==null)return 0;
 return plan==='annual'?monthly*12:monthly;
}
export default function App(){
 const [screen,setScreen]=useState('home'),[previousScreen,setPreviousScreen]=useState('home');
 const [game,setGame]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [gameInfo,setGameInfo]=useState({event:null,stats:[],lineup:[],timeline:[],results:[]}),[gameLoading,setGameLoading]=useState(false),[gameTab,setGameTab]=useState('RESUMO');
 const [news,setNews]=useState([]),[selectedNews,setSelectedNews]=useState(null),[articleLoading,setArticleLoading]=useState(false);
 const [calendar,setCalendar]=useState([]),[sport,setSport]=useState('FUTEBOL'),[calendarLoading,setCalendarLoading]=useState(false),[calendarTab,setCalendarTab]=useState('CALENDÁRIO');
 const [players,setPlayers]=useState([]),[squadTeam,setSquadTeam]=useState(''),[standings,setStandings]=useState([]);
 const [benefits,setBenefits]=useState([]),[benefitCategory,setBenefitCategory]=useState('TODAS'),[benefitSearch,setBenefitSearch]=useState(''),[selectedBenefit,setSelectedBenefit]=useState(null);
 const [memberForm,setMemberForm]=useState({...EMPTY_MEMBER_FORM}),[memberPrivacy,setMemberPrivacy]=useState(false),[memberSubmitting,setMemberSubmitting]=useState(false),[memberMessage,setMemberMessage]=useState('');
 const [memberPhoto,setMemberPhoto]=useState(null),[memberPaymentPlan,setMemberPaymentPlan]=useState('annual'),[memberPaymentMethod,setMemberPaymentMethod]=useState('MBWAY');
 const [storeCategories,setStoreCategories]=useState([]),[storeProducts,setStoreProducts]=useState([]),[storeCategory,setStoreCategory]=useState('TODOS');
 const [selectedProduct,setSelectedProduct]=useState(null),[productChoices,setProductChoices]=useState({});
 const [shippingOptions,setShippingOptions]=useState([]),[checkoutInfo,setCheckoutInfo]=useState(null),[checkoutLoading,setCheckoutLoading]=useState(false),[checkoutMessage,setCheckoutMessage]=useState('');
 const [checkoutForm,setCheckoutForm]=useState({name:'',email:'',phone:'',nif:'',shippingMethod:'home',street:'',number:'',postalCode:'',city:''});
 const [cart,setCart]=useState(()=>{try{return Platform.OS==='web'&&typeof window!=='undefined'?JSON.parse(window.localStorage.getItem('scut_cart')||'[]'):[]}catch{return []}});
 const [syncVersion,setSyncVersion]=useState(null);

 useEffect(()=>{let live=true;(async()=>{try{
  setLoading(true);
  const [v,n,m,p,st,sc,sp,sh,bf]=await Promise.all([
   sb('app_sync?select=version,updated_at&id=eq.1'),
   sb('news?select=id,title,category,published_at,url,hero_image_url,excerpt,content_text,content_html&active=eq.true&order=published_at.desc.nullslast&limit=100'),
   sb('matches?select=id,event_type,round,starts_at,status,venue,city,home_score,away_score,raw_data,competitions(name),sports(name),home:teams!matches_home_team_id_fkey(name,short_name,logo_url),away:teams!matches_away_team_id_fkey(name,short_name,logo_url)&order=starts_at.asc&limit=200'),
   sb('players?select=id,name,short_name,shirt_number,position,birth_date,nationality,height_cm,photo_url,team:teams!players_team_id_fkey(id,name,short_name,age_group,gender,sports(name))&active=eq.true&order=shirt_number.asc&limit=500'),
   sb('standings?select=id,competition_id,position,played,wins,draws,losses,goals_for,goals_against,goal_difference,points,form,competition:competitions(name),team:teams!standings_team_id_fkey(id,name,short_name,logo_url,gender,sports(name))&order=position.asc&limit=50'),
   sb('store_categories?select=id,name,sort_order&active=eq.true&order=sort_order.asc'),
   sb('store_products?select=id,source_id,category_id,name,url,description_text,price,currency,stock_status,in_stock,image_url,images,options,raw_data&active=eq.true&order=name.asc&limit=250'),
   sb('store_shipping_options?select=code,name,description,price,sort_order&active=eq.true&order=sort_order.asc'),
   sb('member_benefits?select=id,source_id,business_name,category,discount_pct,discount_label,discount_conditions,address,locality,latitude,longitude,maps_url,source_url&active=eq.true&order=business_name.asc&limit=500')
  ]);
  if(!live)return;
  setSyncVersion(v?.[0]?.version||1);
  setNews((n||[]).map(x=>({id:x.id,title:x.title,category:x.category||'TORREENSE',date:x.published_at?new Date(x.published_at).toLocaleDateString('pt-PT'):'',url:x.url,body:x.content_text||'',html:x.content_html||'',hero:x.hero_image_url,excerpt:x.excerpt})));
  setPlayers(p||[]);setStandings(st||[]);
  setStoreCategories(sc||[]);setStoreProducts(sp||[]);setShippingOptions(sh||[]);setBenefits(bf||[]);
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
    strHomeTeam:x.home?.short_name||x.home?.name||'',
    strAwayTeam:x.away?.short_name||x.away?.name||'',
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
      sport:(x.raw_data?.modality||x.sports?.name||'Futebol').toUpperCase(),
      type:(x.event_type||'JOGO').toUpperCase(),
      date:x.starts_at?new Date(x.starts_at).toLocaleDateString('pt-PT',{timeZone:'Europe/Lisbon'}):'',
      round:x.round||'',
      title:(x.home?.short_name||x.home?.name||'')+' × '+(x.away?.short_name||x.away?.name||''),
      time:timeConfirmed&&x.starts_at?new Date(x.starts_at).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Lisbon'}):'Hora a confirmar',
      startsAt:x.starts_at,
      status:x.status,
      competition:x.competitions?.name||'COMPETIÇÃO',
      venue:x.venue||'Local a confirmar',
      city:x.city||'',
      homeName:x.home?.short_name||x.home?.name||'',
      awayName:x.away?.short_name||x.away?.name||'',
      homeFullName:x.home?.name||x.home?.short_name||'',
      awayFullName:x.away?.name||x.away?.short_name||'',
      homeLogo:x.home?.logo_url||null,
      awayLogo:x.away?.logo_url||null,
      homeScore:x.home_score,
      awayScore:x.away_score,
      timeConfirmed,
      ev
    }
   };
  });
  setCalendar(mapped.map(x=>x.cal));

  const now=Date.now();
  const primary=mapped.filter(x=>x.cal.sport==='FUTEBOL');
  const next=primary.find(x=>x.raw.status!=='finished' && x.raw.starts_at && new Date(x.raw.starts_at).getTime()>=now)
    || primary.find(x=>x.raw.status!=='finished')
    || primary[primary.length-1];
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
  setCalendarTab('CALENDÁRIO');
  setScreen('calendar');
  setCalendarLoading(false);
 }
 function openCalendarGame(item){
  if(!item?.ev)return;
  setGame(item.ev);setGameTab('RESUMO');
  setGameInfo({event:item.ev,stats:[],lineup:[],timeline:[],results:[]});
  setScreen('game');
 }
 function saveCart(next){
  setCart(next);
  if(Platform.OS==='web'&&typeof window!=='undefined'){try{window.localStorage.setItem('scut_cart',JSON.stringify(next))}catch{}}
 }
 function cartKey(product,choices={}){
  const suffix=Object.entries(choices).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+String(v?.value||v||'')).join('&');
  return String(product.id)+(suffix?'|'+suffix:'');
 }
 function addToCart(product,choices={}){
  if(product?.in_stock===false)return;
  const key=cartKey(product,choices);
  const selectedLabels=Object.entries(choices).map(([field,v])=>({field,label:v?.label||String(v||''),value:v?.value||v}));
  const found=cart.find(x=>x.key===key);
  saveCart(found?cart.map(x=>x.key===key?{...x,qty:x.qty+1}:x):[...cart,{...product,key,selectedOptions:selectedLabels,qty:1}]);
 }
 function changeCartQty(key,delta){
  saveCart(cart.map(x=>x.key===key?{...x,qty:Math.max(0,x.qty+delta)}:x).filter(x=>x.qty>0));
 }
 function openProduct(product){
  setSelectedProduct(product);
  const defaults={};
  (product.options||[]).forEach(g=>{if(g.values?.length===1)defaults[g.field]=g.values[0]});
  setProductChoices(defaults);
  setScreen('product');
 }
 function productReady(product){
  return (product?.options||[]).every(g=>!g.required||productChoices[g.field]);
 }
 function moneyEUR(value){
  return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(Number(value||0));
 }
 async function openOfficialStore(url='https://www.torreense.com/loja/'){
  if(Platform.OS==='web'&&typeof window!=='undefined')window.open(url,'_blank');
  else await Linking.openURL(url);
 }
 async function openCheckout(){
  setScreen('checkout');setCheckoutMessage('');setCheckoutLoading(true);
  try{setCheckoutInfo(await edge('store-checkout',{method:'GET'}))}
  catch(e){setCheckoutInfo({enabled:false});setCheckoutMessage(e.message||'Não foi possível validar o pagamento.')}
  finally{setCheckoutLoading(false)}
 }
 async function submitCheckout(){
  setCheckoutMessage('');
  if(!checkoutInfo?.enabled){setCheckoutMessage('O MB WAY ainda não está configurado para pagamentos reais.');return}
  setCheckoutLoading(true);
  try{
   const result=await edge('store-checkout',{
    method:'POST',
    body:JSON.stringify({
     cart:cart.map(x=>({id:x.id,qty:x.qty,selectedOptions:x.selectedOptions||[],customization:x.customization||{}})),
     customer:{name:checkoutForm.name,email:checkoutForm.email,phone:checkoutForm.phone,nif:checkoutForm.nif},
     shippingMethod:checkoutForm.shippingMethod,
     shippingAddress:checkoutForm.shippingMethod==='home'?{street:checkoutForm.street,number:checkoutForm.number,postalCode:checkoutForm.postalCode,city:checkoutForm.city,country:'PT'}:{},
     paymentMethod:'MBWAY'
    })
   });
   setCheckoutMessage('Encomenda #'+result.orderNumber+' preparada.');
  }catch(e){setCheckoutMessage(e.message||'Não foi possível finalizar a compra.')}
  finally{setCheckoutLoading(false)}
 }
 async function pickMemberPhoto(source='library'){
  setMemberMessage('');
  try{
   if(source==='camera'){
    const permission=await ImagePicker.requestCameraPermissionsAsync();
    if(!permission.granted){setMemberMessage('É necessário permitir o acesso à câmara.');return}
   }
   const result=source==='camera'
    ?await ImagePicker.launchCameraAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.82})
    :await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.82});
   if(!result.canceled&&result.assets?.[0])setMemberPhoto(result.assets[0]);
  }catch(e){setMemberMessage('Não foi possível selecionar a fotografia.')}
 }
 async function submitMemberApplication(){
  setMemberMessage('');
  const f=memberForm,age=memberAgeFromBirthDate(f.birthDate),category=memberCategoryFromBirthDate(f.birthDate);
  if(!f.firstName.trim()||!f.lastName.trim()||!f.email.trim()||!f.phone.trim()||!f.birthDate.trim()||!f.nif.trim()||!f.address.trim()||!f.postalCode.trim()||!f.city.trim()){
   setMemberMessage('Preenche todos os campos obrigatórios.');return;
  }
  if(age==null||!category){setMemberMessage('Indica a data de nascimento no formato AAAA-MM-DD.');return}
  if(!/^\d{9}$/.test(f.nif.trim())){setMemberMessage('O NIF deve ter 9 dígitos.');return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())){setMemberMessage('Indica um email válido.');return}
  if(age<16&&(!f.guardianName.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.guardianEmail.trim()))){
   setMemberMessage('Para menores de 16 anos indica o nome e email do responsável.');return;
  }
  if(!memberPhoto){setMemberMessage('Adiciona a fotografia de sócio.');return}
  if(!memberPrivacy){setMemberMessage('É necessário aceitar a Política de Privacidade para enviar o pedido.');return}
  const amount=memberFeeAmount(category,memberPaymentPlan);
  if(amount>0&&!['MBWAY','CARD'].includes(memberPaymentMethod)){setMemberMessage('Seleciona um método de pagamento.');return}
  setMemberSubmitting(true);
  try{
   const form=new FormData();
   form.append('application',JSON.stringify({
    ...f,privacyAccepted:true,paymentPlan:memberPaymentPlan,paymentMethod:amount>0?memberPaymentMethod:null
   }));
   if(Platform.OS==='web'){
    let file=memberPhoto.file;
    if(!file){
     const blob=await (await fetch(memberPhoto.uri)).blob();
     file=new File([blob],memberPhoto.fileName||'foto-socio.jpg',{type:memberPhoto.mimeType||blob.type||'image/jpeg'});
    }
    form.append('photo',file,memberPhoto.fileName||file.name||'foto-socio.jpg');
   }else{
    form.append('photo',{uri:memberPhoto.uri,name:memberPhoto.fileName||'foto-socio.jpg',type:memberPhoto.mimeType||'image/jpeg'});
   }
   const r=await fetch(SUPABASE_URL+'/functions/v1/member-application',{
    method:'POST',
    headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY},
    body:form
   });
   const data=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(data?.error||'Não foi possível enviar o pedido.');
   setMemberForm({...EMPTY_MEMBER_FORM});setMemberPrivacy(false);setMemberPhoto(null);
   if(Number(data.amount||0)===0){
    setMemberMessage('Adesão enviada com sucesso. Esta categoria não tem quota a pagar.');
   }else if(data.paymentReady){
    setMemberMessage('Pedido criado. O pagamento de '+moneyEUR(data.amount)+' ficou preparado para '+(data.paymentMethod==='CARD'?'cartão':'MB WAY')+'.');
   }else{
    setMemberMessage('Pedido e fotografia guardados. O pagamento de '+moneyEUR(data.amount)+' ainda não pode ser cobrado porque o gateway SIBS está em configuração.');
   }
  }catch(e){setMemberMessage(e.message||'Não foi possível enviar o pedido de adesão.')}
  finally{setMemberSubmitting(false)}
 }
 const officialNews=news;
 const sports=['FUTEBOL','FUTEBOL FEMININO','FUTSAL MASCULINO','FUTSAL FEMININO','FORMAÇÃO','TODAS'];
 const filtered=calendar.filter(x=>sport==='TODAS'||x.sport===sport);
 const calendarNow=Date.now();
 const calendarIsPast=x=>{
  const ts=x.startsAt?new Date(x.startsAt).getTime():0;
  return x.status==='finished'||(x.homeScore!=null&&x.awayScore!=null&&ts>0&&ts<calendarNow);
 };
 const pastMatches=filtered.filter(calendarIsPast).sort((a,b)=>new Date(b.startsAt||0)-new Date(a.startsAt||0));
 const futureMatches=filtered.filter(x=>!calendarIsPast(x)).sort((a,b)=>new Date(a.startsAt||'2999-12-31')-new Date(b.startsAt||'2999-12-31'));
 const lastCalendarMatch=pastMatches[0]||null;
 const nextCalendarMatch=futureMatches[0]||null;
 const upcomingCalendarMatches=futureMatches.slice(1,5);
 const laterCalendarMatches=futureMatches.slice(5);
 const olderCalendarMatches=pastMatches.slice(1);
 const torreenseStanding=standings.find(x=>/torreense/i.test(x.team?.name||''))||null;
 const recentTorreenseMatches=pastMatches.filter(x=>/torreense/i.test((x.homeFullName||'')+' '+(x.awayFullName||''))).slice(0,5);
 const recentForm=recentTorreenseMatches.map(x=>{
  const home=/torreense/i.test(x.homeFullName||x.homeName||'');
  const gf=home?Number(x.homeScore):Number(x.awayScore),ga=home?Number(x.awayScore):Number(x.homeScore);
  return gf>ga?'V':gf<ga?'D':'E';
 });
 const benefitCategories=[...new Set(benefits.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt'));
 const benefitNeedle=benefitSearch.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const filteredBenefits=benefits.filter(x=>{
  if(benefitCategory!=='TODAS'&&x.category!==benefitCategory)return false;
  if(!benefitNeedle)return true;
  const hay=[x.business_name,x.category,x.discount_conditions,x.address,x.locality].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return hay.includes(benefitNeedle);
 });
 const squadTeams=[...new Map(players.filter(x=>x.team).map(x=>[x.team.id,x.team])).values()]
  .sort((a,b)=>squadTeamRank(a)-squadTeamRank(b)||squadSubRank(a)-squadSubRank(b)||(a.name||'').localeCompare(b.name||'','pt'));
 const activeSquadId=squadTeam||String(squadTeams[0]?.id||'');
 const squadPlayers=players
  .filter(x=>String(x.team?.id||'')===activeSquadId)
  .sort((a,b)=>playerPositionRank(a.position)-playerPositionRank(b.position)||(a.shirt_number??999)-(b.shirt_number??999)||(a.name||'').localeCompare(b.name||'','pt'));
 const filteredStore=storeProducts.filter(x=>storeCategory==='TODOS'||String(x.category_id)===String(storeCategory));
 const cartCount=cart.reduce((n,x)=>n+x.qty,0);
 const cartTotal=cart.reduce((n,x)=>n+Number(x.price||0)*x.qty,0);
 const selectedShipping=shippingOptions.find(x=>x.code===checkoutForm.shippingMethod)||{price:0};
 const checkoutTotal=cartTotal+Number(selectedShipping.price||0);
 const memberAge=memberAgeFromBirthDate(memberForm.birthDate);
 const memberCategory=memberCategoryFromBirthDate(memberForm.birthDate);
 const memberCurrentFee=memberFee(memberCategory);
 const memberPaymentAmount=memberFeeAmount(memberCategory,memberPaymentPlan);
 const memberNeedsGuardian=memberAge!=null&&memberAge<16;

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
 if(screen==='members')return <Page><Back title="SÓCIOS"/>
  <View style={s.memberHero}>
   <View style={s.memberHeroIcon}><ShortcutIcon type="members"/></View>
   <View style={s.memberHeroText}><Text style={s.memberHeroTitle}>FAZ-TE SÓCIO</Text><Text style={s.memberHeroSub}>Junta-te à família Torreense e usufrui das vantagens de sócio.</Text></View>
  </View>
  <View style={s.memberFees}>
   {[
    ['Sócio Infantil','0–3','0€','0€'],
    ['Sócio Juvenil','4–14','3€','36€'],
    ['Sócio Efetivo','15–70','6€','72€'],
    ['Sócio +70','>70','3€','36€']
   ].map(x=><View key={x[0]} style={s.memberFeeRow}><View style={s.memberFeeMain}><Text style={s.memberFeeName}>{x[0]}</Text><Text style={s.memberFeeAge}>{x[1]} anos</Text></View><Text style={s.memberFeeValue}>{x[2]} / mês</Text><Text style={s.memberFeeAnnual}>{x[3]} / ano</Text></View>)}
  </View>
  <View style={s.memberFormCard}>
   <Text style={s.memberSectionTitle}>FOTOGRAFIA DE SÓCIO</Text>
   <View style={s.memberPhotoRow}>
    <View style={s.memberPhotoFrame}>{memberPhoto?<Image source={{uri:memberPhoto.uri}} style={s.memberPhotoImage} resizeMode="cover"/>:<View style={s.memberPhotoEmpty}><ShortcutIcon type="members"/><Text style={s.memberPhotoEmptyText}>SEM FOTO</Text></View>}</View>
    <View style={s.memberPhotoActions}>
     <Pressable onPress={()=>pickMemberPhoto('library')} style={s.memberPhotoBtn}><Text style={s.memberPhotoBtnText}>ESCOLHER FOTO</Text></Pressable>
     <Pressable onPress={()=>pickMemberPhoto('camera')} style={s.memberPhotoBtn}><Text style={s.memberPhotoBtnText}>TIRAR FOTO</Text></Pressable>
     <Text style={s.memberPhotoHint}>Foto frontal, bem iluminada e com o rosto visível. Máx. 5 MB.</Text>
    </View>
   </View>

   <Text style={s.memberSectionTitle}>DADOS PESSOAIS</Text>
   <View style={s.memberInputRow}>
    <TextInput value={memberForm.firstName} onChangeText={v=>setMemberForm({...memberForm,firstName:v})} placeholder="Nome *" placeholderTextColor="#7892a7" style={[s.memberInput,s.memberInputHalf]}/>
    <TextInput value={memberForm.lastName} onChangeText={v=>setMemberForm({...memberForm,lastName:v})} placeholder="Apelido *" placeholderTextColor="#7892a7" style={[s.memberInput,s.memberInputHalf]}/>
   </View>
   <TextInput value={memberForm.birthDate} onChangeText={v=>setMemberForm({...memberForm,birthDate:v})} placeholder="Data de nascimento * (AAAA-MM-DD)" placeholderTextColor="#7892a7" style={s.memberInput}/>
   <TextInput value={memberForm.nif} onChangeText={v=>setMemberForm({...memberForm,nif:v.replace(/\D/g,'').slice(0,9)})} placeholder="NIF *" placeholderTextColor="#7892a7" keyboardType="number-pad" style={s.memberInput}/>
   {memberCategory?<View style={s.memberCategoryBox}><View><Text style={s.memberCategoryLabel}>CATEGORIA</Text><Text style={s.memberCategoryName}>{memberCategory}</Text></View>{memberCurrentFee?<View style={s.memberCategoryPrice}><Text style={s.memberCategoryMonthly}>{memberCurrentFee.monthly}/mês</Text><Text style={s.memberCategoryAnnual}>{memberCurrentFee.annual}/ano</Text></View>:null}</View>:null}

   <Text style={s.memberSectionTitle}>CONTACTOS</Text>
   <TextInput value={memberForm.email} onChangeText={v=>setMemberForm({...memberForm,email:v})} placeholder="Email *" placeholderTextColor="#7892a7" keyboardType="email-address" autoCapitalize="none" style={s.memberInput}/>
   <TextInput value={memberForm.phone} onChangeText={v=>setMemberForm({...memberForm,phone:v})} placeholder="Telemóvel *" placeholderTextColor="#7892a7" keyboardType="phone-pad" style={s.memberInput}/>

   <Text style={s.memberSectionTitle}>MORADA</Text>
   <TextInput value={memberForm.address} onChangeText={v=>setMemberForm({...memberForm,address:v})} placeholder="Morada *" placeholderTextColor="#7892a7" style={s.memberInput}/>
   <View style={s.memberInputRow}>
    <TextInput value={memberForm.postalCode} onChangeText={v=>setMemberForm({...memberForm,postalCode:v})} placeholder="Código postal *" placeholderTextColor="#7892a7" style={[s.memberInput,s.memberInputHalf]}/>
    <TextInput value={memberForm.city} onChangeText={v=>setMemberForm({...memberForm,city:v})} placeholder="Localidade *" placeholderTextColor="#7892a7" style={[s.memberInput,s.memberInputHalf]}/>
   </View>

   {memberNeedsGuardian?<>
    <Text style={s.memberSectionTitle}>RESPONSÁVEL LEGAL</Text>
    <Text style={s.memberGuardianNote}>Necessário para menores de 16 anos.</Text>
    <TextInput value={memberForm.guardianName} onChangeText={v=>setMemberForm({...memberForm,guardianName:v})} placeholder="Nome do responsável *" placeholderTextColor="#7892a7" style={s.memberInput}/>
    <TextInput value={memberForm.guardianEmail} onChangeText={v=>setMemberForm({...memberForm,guardianEmail:v})} placeholder="Email do responsável *" placeholderTextColor="#7892a7" keyboardType="email-address" autoCapitalize="none" style={s.memberInput}/>
   </>:null}

   <Text style={s.memberSectionTitle}>PAGAMENTO DA QUOTA</Text>
   {memberCategory?<View style={s.memberPaymentBox}>
    <Text style={s.memberPaymentLabel}>PERIODICIDADE</Text>
    <View style={s.memberPaymentOptions}>
     <Pressable onPress={()=>setMemberPaymentPlan('monthly')} style={[s.memberPaymentOption,memberPaymentPlan==='monthly'&&s.memberPaymentOptionOn]}><Text style={[s.memberPaymentOptionText,memberPaymentPlan==='monthly'&&s.memberPaymentOptionTextOn]}>MENSAL · {memberCurrentFee?.monthly||'—'}</Text></Pressable>
     <Pressable onPress={()=>setMemberPaymentPlan('annual')} style={[s.memberPaymentOption,memberPaymentPlan==='annual'&&s.memberPaymentOptionOn]}><Text style={[s.memberPaymentOptionText,memberPaymentPlan==='annual'&&s.memberPaymentOptionTextOn]}>ANUAL · {memberCurrentFee?.annual||'—'}</Text></Pressable>
    </View>
    {memberPaymentAmount>0?<>
     <Text style={s.memberPaymentLabel}>MÉTODO DE PAGAMENTO</Text>
     <View style={s.memberPaymentOptions}>
      <Pressable onPress={()=>setMemberPaymentMethod('MBWAY')} style={[s.memberPaymentMethod,memberPaymentMethod==='MBWAY'&&s.memberPaymentOptionOn]}><Text style={[s.memberPaymentMethodText,memberPaymentMethod==='MBWAY'&&s.memberPaymentOptionTextOn]}>MB WAY</Text></Pressable>
      <Pressable onPress={()=>setMemberPaymentMethod('CARD')} style={[s.memberPaymentMethod,memberPaymentMethod==='CARD'&&s.memberPaymentOptionOn]}><Text style={[s.memberPaymentMethodText,memberPaymentMethod==='CARD'&&s.memberPaymentOptionTextOn]}>CARTÃO</Text></Pressable>
     </View>
     <View style={s.memberPaymentTotal}><Text style={s.memberPaymentTotalLabel}>VALOR A PAGAR</Text><Text style={s.memberPaymentTotalValue}>{moneyEUR(memberPaymentAmount)}</Text></View>
     <Text style={s.memberPaymentNote}>O pagamento é processado por gateway seguro. No preview, a cobrança só fica ativa quando as credenciais SIBS forem configuradas.</Text>
    </>:<View style={s.memberFreeBox}><Text style={s.memberFreeText}>Esta categoria não tem quota a pagar.</Text></View>}
   </View>:<Text style={s.memberGuardianNote}>Indica primeiro a data de nascimento para calcular a quota.</Text>}

   <Pressable onPress={()=>setMemberPrivacy(!memberPrivacy)} style={s.memberConsent}>
    <View style={[s.memberCheck,memberPrivacy&&s.memberCheckOn]}>{memberPrivacy?<Text style={s.memberCheckMark}>✓</Text>:null}</View>
    <Text style={s.memberConsentText}>Li e aceito a Política de Privacidade e autorizo o tratamento dos dados para este pedido de adesão.</Text>
   </Pressable>
   {memberSubmitting?<ActivityIndicator style={{marginTop:10}}/>:<Pressable onPress={submitMemberApplication} style={s.memberSubmit}><Text style={s.memberSubmitText}>{memberPaymentAmount>0?'CONTINUAR PARA PAGAMENTO':'ENVIAR ADESÃO'}</Text></Pressable>}
   {memberMessage?<Text style={s.memberMessage}>{memberMessage}</Text>:null}
   <Text style={s.memberFootnote}>O pedido, a fotografia e o estado do pagamento ficam registados na app e sujeitos à validação final pelo SCU Torreense.</Text>
  </View>
 </Page>;
 if(screen==='benefits')return <Page><Back title="VANTAGENS"/>
  <View style={s.benefitMiniHead}>
   <Text style={s.benefitMiniTitle}>BENEFÍCIOS EXCLUSIVOS PARA SÓCIOS</Text>
   <Text style={s.benefitMiniCount}>{benefits.length} parceiros disponíveis</Text>
  </View>
  <TextInput value={benefitSearch} onChangeText={setBenefitSearch} placeholder="Pesquisar parceiro ou benefício..." placeholderTextColor="#7892a7" style={s.benefitSearch}/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.benefitFilters} contentContainerStyle={s.filtersContent}>
   <Pressable onPress={()=>setBenefitCategory('TODAS')} style={[s.filter,benefitCategory==='TODAS'&&s.filterOn]}><Text style={[s.filterText,benefitCategory==='TODAS'&&s.filterTextOn]}>TODAS</Text></Pressable>
   {benefitCategories.map(cat=><Pressable key={cat} onPress={()=>setBenefitCategory(cat)} style={[s.filter,benefitCategory===cat&&s.filterOn]}><Text style={[s.filterText,benefitCategory===cat&&s.filterTextOn]}>{cat.toUpperCase()}</Text></Pressable>)}
  </ScrollView>
  <View style={s.benefitResultHead}><Text style={s.benefitResultCount}>{filteredBenefits.length} {filteredBenefits.length===1?'VANTAGEM':'VANTAGENS'}</Text><Pressable onPress={()=>openOfficialStore('https://mapa.torreense.com/mapa')}><Text style={s.benefitSource}>MAPA OFICIAL ›</Text></Pressable></View>
  {filteredBenefits.length?filteredBenefits.map(b=><Pressable key={b.id} style={s.benefitRow} onPress={()=>{setSelectedBenefit(b);setScreen('benefitDetail')}}>
   <View style={s.benefitAvatar}><Text style={s.benefitAvatarText}>{(b.business_name||'V').trim().charAt(0).toUpperCase()}</Text></View>
   <View style={s.benefitRowBody}>
    <Text style={s.benefitName} numberOfLines={1}>{b.business_name}</Text>
    <Text style={s.benefitRowMeta} numberOfLines={1}>{b.discount_conditions||b.category||b.locality||'Vantagem para sócios'}</Text>
   </View>
   <View style={s.benefitDiscountCompact}><Text style={s.benefitDiscountCompactText}>{benefitDiscountLabel(b)}</Text></View>
   <Text style={s.benefitRowArrow}>›</Text>
  </Pressable>):<View style={s.infoCard}><Text style={s.muted}>Não foram encontrados parceiros com estes filtros.</Text></View>}
 </Page>;
 if(screen==='benefitDetail')return <Page><Back title="VANTAGEM" to="benefits"/>
  {selectedBenefit?<View style={s.benefitDetailCard}>
   <View style={s.benefitDetailTop}>
    <View style={s.benefitDetailAvatar}><Text style={s.benefitDetailAvatarText}>{(selectedBenefit.business_name||'V').trim().charAt(0).toUpperCase()}</Text></View>
    <View style={s.benefitDetailNameWrap}><Text style={s.benefitDetailName}>{selectedBenefit.business_name}</Text><Text style={s.benefitDetailCategory}>{selectedBenefit.category||'Parceiro SCU Torreense'}</Text></View>
    <View style={s.benefitDiscount}><Text style={s.benefitDiscountText}>{benefitDiscountLabel(selectedBenefit)}</Text></View>
   </View>
   {selectedBenefit.discount_conditions?<><Text style={s.benefitDetailLabel}>CONDIÇÕES</Text><Text style={s.benefitDetailText}>{selectedBenefit.discount_conditions}</Text></>:null}
   {(selectedBenefit.address||selectedBenefit.locality)?<><Text style={s.benefitDetailLabel}>LOCALIZAÇÃO</Text><Text style={s.benefitDetailText}>⌖ {selectedBenefit.address||selectedBenefit.locality}</Text></>:null}
   {selectedBenefit.maps_url?<Pressable onPress={()=>openOfficialStore(selectedBenefit.maps_url)} style={s.benefitAction}><Text style={s.benefitActionText}>ABRIR NO MAPA</Text><Text style={s.benefitActionArrow}>›</Text></Pressable>:null}
   {selectedBenefit.source_url?<Pressable onPress={()=>openOfficialStore(selectedBenefit.source_url)} style={s.benefitAction}><Text style={s.benefitActionText}>VER NO SITE OFICIAL</Text><Text style={s.benefitActionArrow}>›</Text></Pressable>:null}
  </View>:<View style={s.infoCard}><Text style={s.muted}>Vantagem indisponível.</Text></View>}
 </Page>;
 if(screen==='store')return <Page><Back title="LOJA"/>
  <Pressable style={s.cartTopButton} onPress={()=>setScreen('cart')}><ShortcutIcon type="shop"/><Text style={s.cartTopText}>CARRINHO</Text><View style={s.cartBadge}><Text style={s.cartBadgeText}>{cartCount}</Text></View><Text style={s.cartTopArrow}>›</Text></Pressable>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={s.filtersContent}>
   <Pressable onPress={()=>setStoreCategory('TODOS')} style={[s.filter,storeCategory==='TODOS'&&s.filterOn]}><Text style={[s.filterText,storeCategory==='TODOS'&&s.filterTextOn]}>TODOS</Text></Pressable>
   {storeCategories.map(cat=><Pressable key={cat.id} onPress={()=>setStoreCategory(String(cat.id))} style={[s.filter,String(storeCategory)===String(cat.id)&&s.filterOn]}><Text style={[s.filterText,String(storeCategory)===String(cat.id)&&s.filterTextOn]}>{cat.name}</Text></Pressable>)}
  </ScrollView>
  {filteredStore.length?<View style={s.storeGrid}>{filteredStore.map(p=><View key={p.id} style={s.storeCard}>
   <Pressable onPress={()=>openProduct(p)}>{p.image_url?<Image source={{uri:p.image_url}} style={s.storeImage} resizeMode="contain"/>:<View style={[s.storeImage,s.storeImageFallback]}><ShortcutIcon type="shop"/></View>}</Pressable>
   <Pressable onPress={()=>openProduct(p)}><Text style={s.storeName}>{p.name}</Text></Pressable>
   <Text style={s.storePrice}>{Number(p.price)>0?moneyEUR(p.price):'Preço a confirmar'}</Text>
   <Text style={[s.storeStock,p.in_stock===false&&s.storeStockOut]}>{p.in_stock===false?'ESGOTADO':(p.stock_status||'DISPONÍVEL').toUpperCase()}</Text>
   <Pressable disabled={p.in_stock===false} onPress={()=>((p.options||[]).length?openProduct(p):addToCart(p))} style={[s.storeAdd,p.in_stock===false&&s.storeAddOff]}><Text style={s.storeAddText}>{p.in_stock===false?'INDISPONÍVEL':((p.options||[]).length?'ESCOLHER':'ADICIONAR')}</Text></Pressable>
   <Pressable onPress={()=>openOfficialStore(p.url)}><Text style={s.storeOfficial}>VER ARTIGO ›</Text></Pressable>
  </View>)}</View>:<View style={s.infoCard}><Text style={s.muted}>A loja está a sincronizar os artigos oficiais.</Text></View>}
 </Page>;
 if(screen==='product')return <Page><Back title="ARTIGO" to="store"/>
  {selectedProduct?<View style={s.productDetail}>
   {selectedProduct.image_url?<Image source={{uri:selectedProduct.image_url}} style={s.productHero} resizeMode="contain"/>:null}
   <Text style={s.productName}>{selectedProduct.name}</Text>
   <Text style={s.productPrice}>{Number(selectedProduct.price)>0?moneyEUR(selectedProduct.price):'Preço a confirmar'}</Text>
   {selectedProduct.description_text?<Text style={s.productDescription}>{selectedProduct.description_text}</Text>:null}
   {(selectedProduct.options||[]).map(g=><View key={g.field} style={s.optionGroup}>
    <Text style={s.optionTitle}>{g.name||'Opção'}{g.required?' *':''}</Text>
    <View style={s.optionValues}>{(g.values||[]).map(v=><Pressable key={String(v.value)} onPress={()=>setProductChoices({...productChoices,[g.field]:v})} style={[s.optionChip,productChoices[g.field]?.value===v.value&&s.optionChipOn]}><Text style={[s.optionChipText,productChoices[g.field]?.value===v.value&&s.optionChipTextOn]}>{v.label}</Text></Pressable>)}</View>
   </View>)}
   <Pressable disabled={selectedProduct.in_stock===false||!productReady(selectedProduct)} onPress={()=>{addToCart(selectedProduct,productChoices);setScreen('cart')}} style={[s.productAdd,(selectedProduct.in_stock===false||!productReady(selectedProduct))&&s.storeAddOff]}><Text style={s.productAddText}>{selectedProduct.in_stock===false?'INDISPONÍVEL':productReady(selectedProduct)?'ADICIONAR AO CARRINHO':'ESCOLHE AS OPÇÕES'}</Text></Pressable>
   <Pressable onPress={()=>openOfficialStore(selectedProduct.url)}><Text style={s.productOfficial}>VER NO SITE OFICIAL ›</Text></Pressable>
  </View>:null}
 </Page>;
 if(screen==='cart')return <Page><Back title="CARRINHO" to="store"/>
  {cart.length?<>
   {cart.map(item=><View key={item.key||item.id} style={s.cartItem}>
    {item.image_url?<Image source={{uri:item.image_url}} style={s.cartImage} resizeMode="contain"/>:null}
    <View style={s.cartBody}><Text style={s.cartName}>{item.name}</Text>{item.selectedOptions?.length?<Text style={s.cartOptions}>{item.selectedOptions.map(x=>x.label).join(' · ')}</Text>:null}<Text style={s.cartPrice}>{Number(item.price)>0?moneyEUR(item.price):'Preço a confirmar'}</Text><View style={s.qtyRow}><Pressable onPress={()=>changeCartQty(item.key||String(item.id),-1)} style={s.qtyBtn}><Text style={s.qtyText}>−</Text></Pressable><Text style={s.qtyValue}>{item.qty}</Text><Pressable onPress={()=>changeCartQty(item.key||String(item.id),1)} style={s.qtyBtn}><Text style={s.qtyText}>+</Text></Pressable></View></View>
   </View>)}
   <View style={s.cartTotalRow}><Text style={s.cartTotalLabel}>TOTAL</Text><Text style={s.cartTotalValue}>{moneyEUR(cartTotal)}</Text></View>
   <Pressable style={s.checkoutBtn} onPress={openCheckout}><Text style={s.checkoutText}>FINALIZAR COMPRA</Text></Pressable>
   <Text style={s.checkoutNote}>A compra é finalizada dentro da app.</Text>
  </>:<View style={s.infoCard}><Text style={s.muted}>O carrinho está vazio.</Text></View>}
 </Page>;
 if(screen==='checkout')return <Page><Back title="CHECKOUT" to="cart"/>
  <View style={s.checkoutCard}>
   <Text style={s.checkoutSectionTitle}>DADOS DO CLIENTE</Text>
   <TextInput value={checkoutForm.name} onChangeText={v=>setCheckoutForm({...checkoutForm,name:v})} placeholder="Nome completo" placeholderTextColor="#7892a7" style={s.checkoutInput}/>
   <TextInput value={checkoutForm.email} onChangeText={v=>setCheckoutForm({...checkoutForm,email:v})} placeholder="Email" placeholderTextColor="#7892a7" keyboardType="email-address" autoCapitalize="none" style={s.checkoutInput}/>
   <TextInput value={checkoutForm.phone} onChangeText={v=>setCheckoutForm({...checkoutForm,phone:v})} placeholder="Telemóvel / MB WAY" placeholderTextColor="#7892a7" keyboardType="phone-pad" style={s.checkoutInput}/>
   <TextInput value={checkoutForm.nif} onChangeText={v=>setCheckoutForm({...checkoutForm,nif:v})} placeholder="NIF (opcional)" placeholderTextColor="#7892a7" keyboardType="number-pad" style={s.checkoutInput}/>

   <Text style={s.checkoutSectionTitle}>ENTREGA</Text>
   <View style={s.deliveryChoices}>{shippingOptions.map(x=><Pressable key={x.code} onPress={()=>setCheckoutForm({...checkoutForm,shippingMethod:x.code})} style={[s.deliveryChoice,checkoutForm.shippingMethod===x.code&&s.deliveryChoiceOn]}><Text style={[s.deliveryChoiceText,checkoutForm.shippingMethod===x.code&&s.deliveryChoiceTextOn]}>{x.name}</Text></Pressable>)}</View>
   {checkoutForm.shippingMethod==='home'?<>
    <TextInput value={checkoutForm.street} onChangeText={v=>setCheckoutForm({...checkoutForm,street:v})} placeholder="Rua" placeholderTextColor="#7892a7" style={s.checkoutInput}/>
    <View style={s.checkoutInputRow}><TextInput value={checkoutForm.number} onChangeText={v=>setCheckoutForm({...checkoutForm,number:v})} placeholder="Porta" placeholderTextColor="#7892a7" style={[s.checkoutInput,s.checkoutInputSmall]}/><TextInput value={checkoutForm.postalCode} onChangeText={v=>setCheckoutForm({...checkoutForm,postalCode:v})} placeholder="Código postal" placeholderTextColor="#7892a7" style={[s.checkoutInput,s.checkoutInputWide]}/></View>
    <TextInput value={checkoutForm.city} onChangeText={v=>setCheckoutForm({...checkoutForm,city:v})} placeholder="Localidade" placeholderTextColor="#7892a7" style={s.checkoutInput}/>
   </>:null}

   <Text style={s.checkoutSectionTitle}>PAGAMENTO</Text>
   <View style={s.mbwayChoice}><Text style={s.mbwayTitle}>MB WAY</Text><Text style={s.mbwayText}>O pedido de pagamento será enviado para o número indicado acima.</Text></View>

   <View style={s.checkoutSummaryRow}><Text style={s.checkoutSummaryLabel}>Artigos</Text><Text style={s.checkoutSummaryValue}>{moneyEUR(cartTotal)}</Text></View>
   <View style={s.checkoutSummaryRow}><Text style={s.checkoutSummaryLabel}>Entrega</Text><Text style={s.checkoutSummaryValue}>{Number(selectedShipping.price)>0?moneyEUR(selectedShipping.price):'Grátis'}</Text></View>
   <View style={[s.checkoutSummaryRow,s.checkoutSummaryTotal]}><Text style={s.checkoutTotalLabel}>TOTAL</Text><Text style={s.checkoutTotalValue}>{moneyEUR(checkoutTotal)}</Text></View>

   {checkoutLoading?<ActivityIndicator style={{marginTop:10}}/>:<Pressable disabled={!checkoutInfo?.enabled} onPress={submitCheckout} style={[s.checkoutBtn,!checkoutInfo?.enabled&&s.checkoutBtnOff]}><Text style={s.checkoutText}>{checkoutInfo?.enabled?'PAGAR COM MB WAY':'MB WAY EM CONFIGURAÇÃO'}</Text></Pressable>}
   {checkoutMessage?<Text style={s.checkoutMessage}>{checkoutMessage}</Text>:null}
   {!checkoutInfo?.enabled&&!checkoutLoading?<Text style={s.checkoutNote}>O checkout já fica dentro da app. A ativação do pagamento real depende das credenciais do fornecedor MB WAY.</Text>:null}
  </View>
 </Page>;
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
 if(screen==='calendar')return <Page><Back title="CALENDÁRIO"/>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.calendarTabs} contentContainerStyle={s.calendarTabsContent}>
   {['CALENDÁRIO','CLASSIFICAÇÃO','PLANTEL','ESTATÍSTICAS'].map(tab=><Pressable key={tab} onPress={()=>setCalendarTab(tab)} style={[s.calendarTopTab,calendarTab===tab&&s.calendarTopTabOn]}><Text style={[s.calendarTopTabText,calendarTab===tab&&s.calendarTopTabTextOn]}>{tab}</Text></Pressable>)}
  </ScrollView>

  {calendarTab==='CALENDÁRIO'?<>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={s.filtersContent}>{sports.map(x=><Pressable key={x} onPress={()=>setSport(x)} style={[s.filter,sport===x&&s.filterOn]}><Text style={[s.filterText,sport===x&&s.filterTextOn]}>{x}</Text></Pressable>)}</ScrollView>
   {calendarLoading?<ActivityIndicator/>:<>
    {lastCalendarMatch?<Pressable style={s.calendarLastCard} onPress={()=>openCalendarGame(lastCalendarMatch)}>
     <Text style={s.calendarCardCompetition}>{lastCalendarMatch.competition}{lastCalendarMatch.round?' · '+lastCalendarMatch.round:''}</Text>
     <View style={s.calendarLastRow}>
      <View style={s.calendarLastTeam}><Text style={s.calendarLastTeamName}>{lastCalendarMatch.homeName}</Text><TeamLogo name={lastCalendarMatch.homeFullName} uri={lastCalendarMatch.homeLogo} style={s.calendarLastLogo}/></View>
      <View style={s.calendarLastScoreBox}><Text style={s.calendarLastScore}>{lastCalendarMatch.homeScore} - {lastCalendarMatch.awayScore}</Text><Text style={s.calendarLastDate}>{lastCalendarMatch.date}</Text></View>
      <View style={[s.calendarLastTeam,{justifyContent:'flex-start'}]}><TeamLogo name={lastCalendarMatch.awayFullName} uri={lastCalendarMatch.awayLogo} style={s.calendarLastLogo}/><Text style={[s.calendarLastTeamName,{textAlign:'left'}]}>{lastCalendarMatch.awayName}</Text></View>
     </View>
    </Pressable>:null}

    {nextCalendarMatch?<Pressable style={s.calendarNextCard} onPress={()=>openCalendarGame(nextCalendarMatch)}>
     <Text style={s.calendarNextCompetition}>{nextCalendarMatch.competition}{nextCalendarMatch.round?' · '+nextCalendarMatch.round:''}</Text>
     <View style={s.calendarNextTeams}>
      <View style={s.calendarNextTeam}><TeamLogo name={nextCalendarMatch.homeFullName} uri={nextCalendarMatch.homeLogo} style={s.calendarNextLogo}/><Text style={s.calendarNextTeamCode}>{nextCalendarMatch.homeName}</Text></View>
      <View style={s.calendarNextCenter}><Text style={s.calendarNextDate}>{nextCalendarMatch.startsAt?new Date(nextCalendarMatch.startsAt).toLocaleDateString('pt-PT',{day:'2-digit',month:'short',timeZone:'Europe/Lisbon'}).toUpperCase():nextCalendarMatch.date}</Text><Text style={s.calendarNextTime}>{nextCalendarMatch.time}</Text><Text style={s.calendarNextVenue}>{nextCalendarMatch.venue}</Text></View>
      <View style={s.calendarNextTeam}><TeamLogo name={nextCalendarMatch.awayFullName} uri={nextCalendarMatch.awayLogo} style={s.calendarNextLogo}/><Text style={s.calendarNextTeamCode}>{nextCalendarMatch.awayName}</Text></View>
     </View>
     <Text style={s.calendarNextMatchup}>{nextCalendarMatch.homeName}{'\n'}{nextCalendarMatch.awayName}</Text>
    </Pressable>:<View style={s.infoCard}><Text style={s.muted}>Não existem próximos jogos publicados para esta modalidade.</Text></View>}

    {upcomingCalendarMatches.length?<><Text style={s.calendarSectionTitle}>PRÓXIMOS JOGOS</Text>{upcomingCalendarMatches.map(x=><Pressable key={x.id} style={s.calendarUpcomingCard} onPress={()=>openCalendarGame(x)}>
     <View style={s.calendarUpcomingDate}><Text style={s.calendarUpcomingDay}>{x.startsAt?new Date(x.startsAt).toLocaleDateString('pt-PT',{day:'2-digit',month:'short',timeZone:'Europe/Lisbon'}).toUpperCase():x.date}</Text><Text style={s.calendarUpcomingTime}>{x.time}</Text></View>
     <View style={s.calendarUpcomingBody}><Text style={s.calendarUpcomingCompetition}>{x.competition}{x.round?' · '+x.round:''}</Text><View style={s.calendarUpcomingTeams}><TeamLogo name={x.homeFullName} uri={x.homeLogo} style={s.calendarUpcomingLogo}/><Text style={s.calendarUpcomingTitle}>{x.homeName}  ×  {x.awayName}</Text><TeamLogo name={x.awayFullName} uri={x.awayLogo} style={s.calendarUpcomingLogo}/></View><Text style={s.calendarUpcomingVenue}>{x.venue}</Text></View>
    </Pressable>)}</>:null}

    {olderCalendarMatches.length?<><Text style={s.calendarSectionTitle}>JOGOS ANTERIORES</Text>{olderCalendarMatches.map(x=><Pressable key={x.id} style={s.calendarHistoryCard} onPress={()=>openCalendarGame(x)}>
     <View style={s.calendarHistoryMeta}><Text style={s.calendarHistoryDate}>{x.date}</Text><Text style={s.calendarHistoryCompetition}>{x.competition}{x.round?' · '+x.round:''}</Text></View>
     <View style={s.calendarHistoryScoreRow}><Text style={s.calendarHistoryTeam}>{x.homeName}</Text><TeamLogo name={x.homeFullName} uri={x.homeLogo} style={s.calendarHistoryLogo}/><Text style={s.calendarHistoryScore}>{x.homeScore!=null?x.homeScore:'–'} - {x.awayScore!=null?x.awayScore:'–'}</Text><TeamLogo name={x.awayFullName} uri={x.awayLogo} style={s.calendarHistoryLogo}/><Text style={[s.calendarHistoryTeam,{textAlign:'left'}]}>{x.awayName}</Text></View>
    </Pressable>)}</>:null}

    {laterCalendarMatches.length?<><Text style={s.calendarSectionTitle}>RESTO DA ÉPOCA</Text>{laterCalendarMatches.map(x=><Pressable key={x.id} style={s.calendarUpcomingCard} onPress={()=>openCalendarGame(x)}>
     <View style={s.calendarUpcomingDate}><Text style={s.calendarUpcomingDay}>{x.startsAt?new Date(x.startsAt).toLocaleDateString('pt-PT',{day:'2-digit',month:'short',timeZone:'Europe/Lisbon'}).toUpperCase():x.date}</Text><Text style={s.calendarUpcomingTime}>{x.time}</Text></View>
     <View style={s.calendarUpcomingBody}><Text style={s.calendarUpcomingCompetition}>{x.competition}{x.round?' · '+x.round:''}</Text><View style={s.calendarUpcomingTeams}><TeamLogo name={x.homeFullName} uri={x.homeLogo} style={s.calendarUpcomingLogo}/><Text style={s.calendarUpcomingTitle}>{x.homeName}  ×  {x.awayName}</Text><TeamLogo name={x.awayFullName} uri={x.awayLogo} style={s.calendarUpcomingLogo}/></View><Text style={s.calendarUpcomingVenue}>{x.venue}</Text></View>
    </Pressable>)}</>:null}
   </>}
  </>:null}

  {calendarTab==='CLASSIFICAÇÃO'?<>
   {standings.length?<View style={s.standingsCard}>
    <View style={s.standingsHead}><Text style={[s.standingsCell,s.standingsPos]}>#</Text><Text style={[s.standingsCell,s.standingsTeam]}>EQUIPA</Text><Text style={s.standingsCell}>J</Text><Text style={s.standingsCell}>DG</Text><Text style={[s.standingsCell,s.standingsPts]}>PTS</Text></View>
    {standings.map(x=><View key={x.id||x.team?.id} style={[s.standingsRow,/torreense/i.test(x.team?.name||'')&&s.standingsRowClub]}>
     <Text style={[s.standingsCell,s.standingsPos]}>{x.position}</Text>
     <View style={s.standingsTeamWrap}><TeamLogo name={x.team?.name} uri={x.team?.logo_url} style={s.standingsLogo}/><Text style={s.standingsTeamName} numberOfLines={1}>{x.team?.short_name||x.team?.name}</Text></View>
     <Text style={s.standingsCell}>{x.played}</Text><Text style={s.standingsCell}>{x.goal_difference!=null?(x.goal_difference>0?'+':'')+x.goal_difference:(Number(x.goals_for||0)-Number(x.goals_against||0))}</Text><Text style={[s.standingsCell,s.standingsPts]}>{x.points}</Text>
    </View>)}
   </View>:<View style={s.infoCard}><Text style={s.muted}>Ainda não existe classificação disponível.</Text></View>}
  </>:null}

  {calendarTab==='PLANTEL'?<>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={s.filtersContent}>
    {squadTeams.map(t=><Pressable key={t.id} onPress={()=>setSquadTeam(String(t.id))} style={[s.filter,activeSquadId===String(t.id)&&s.filterOn]}><Text style={[s.filterText,activeSquadId===String(t.id)&&s.filterTextOn]}>{t.short_name||t.name}</Text></Pressable>)}
   </ScrollView>
   {squadPlayers.length?<View style={s.playerGrid}>{squadPlayers.map(p=><View key={p.id} style={s.playerCard}>
    <PlayerPhoto player={p}/><View style={s.playerNumberBadge}><Text style={s.playerNumber}>{p.shirt_number??'—'}</Text></View><Text style={s.playerName}>{p.short_name||p.name}</Text><Text style={s.playerPosition}>{p.position||'Jogador'}</Text>{p.nationality?<Text style={s.playerMeta}>{p.nationality}</Text>:null}
   </View>)}</View>:<View style={s.infoCard}><Text style={s.muted}>Ainda não temos jogadores publicados para este plantel.</Text></View>}
  </>:null}

  {calendarTab==='ESTATÍSTICAS'?<>
   {torreenseStanding?<>
    <View style={s.statsHero}><Text style={s.statsHeroPosition}>{torreenseStanding.position}.º</Text><View><Text style={s.statsHeroTitle}>{torreenseStanding.team?.name||'SCU Torreense'}</Text><Text style={s.statsHeroSub}>{torreenseStanding.competition?.name||'Época atual'}</Text></View><Text style={s.statsHeroPoints}>{torreenseStanding.points} pts</Text></View>
    <View style={s.statsGrid}>
     {[['JOGOS',torreenseStanding.played],['VITÓRIAS',torreenseStanding.wins],['EMPATES',torreenseStanding.draws],['DERROTAS',torreenseStanding.losses],['GOLOS',torreenseStanding.goals_for],['SOFRIDOS',torreenseStanding.goals_against]].map(x=><View key={x[0]} style={s.statsBox}><Text style={s.statsValue}>{x[1]??0}</Text><Text style={s.statsLabel}>{x[0]}</Text></View>)}
    </View>
    <View style={s.statsWide}><View><Text style={s.statsWideLabel}>SALDO DE GOLOS</Text><Text style={s.statsWideValue}>{torreenseStanding.goal_difference!=null?(torreenseStanding.goal_difference>0?'+':'')+torreenseStanding.goal_difference:(Number(torreenseStanding.goals_for||0)-Number(torreenseStanding.goals_against||0))}</Text></View><View><Text style={s.statsWideLabel}>MÉDIA DE PONTOS</Text><Text style={s.statsWideValue}>{torreenseStanding.played?((Number(torreenseStanding.points||0)/Number(torreenseStanding.played)).toFixed(2)):'0.00'}</Text></View></View>
    <Text style={s.calendarSectionTitle}>FORMA RECENTE</Text>
    <View style={s.formRow}>{(recentForm.length?recentForm:['—']).map((x,i)=><View key={i} style={[s.formBadge,x==='V'?s.formWin:x==='D'?s.formLoss:x==='E'?s.formDraw:null]}><Text style={s.formBadgeText}>{x}</Text></View>)}</View>
   </>:<View style={s.infoCard}><Text style={s.muted}>As estatísticas da classificação ainda não estão disponíveis para esta modalidade.</Text></View>}
  </>:null}
 </Page>;

 const home={name:game?.strHomeTeam,logo:game?.strHomeTeamBadge||game?.strHomeTeamLogo},away={name:game?.strAwayTeam,logo:game?.strAwayTeamBadge||game?.strAwayTeamLogo};
 return <Page>
  <Pressable style={s.card} onPress={openGame}>{loading?<View style={s.loading}><ActivityIndicator/></View>:error?<Text style={s.muted}>Não foi possível atualizar o jogo.</Text>:<><View style={s.header}><View><Text style={s.competition}>{game?.strLeague||'COMPETIÇÃO'}</Text><Text style={s.round}>{game?.intRound?'Jornada '+game.intRound:'Próximo jogo'}</Text></View><Text style={s.date}>{fmtGameDate(game)}</Text></View><View style={s.teams}><View style={s.team}><TeamLogo name={home.name} uri={home.logo} style={s.teamLogo}/><Text style={s.teamName}>{home.name}</Text>{game?._homeStanding&&<Text style={s.teamStanding}>{game._homeStanding.position}.º · {game._homeStanding.points} pts</Text>}</View><Text style={s.vs}>VS</Text><View style={s.team}><TeamLogo name={away.name} uri={away.logo} style={s.teamLogo}/><Text style={s.teamName}>{away.name}</Text>{game?._awayStanding&&<Text style={s.teamStanding}>{game._awayStanding.position}.º · {game._awayStanding.points} pts</Text>}</View></View><Text style={s.stadium}>⌖ {game?.strVenue||'Local a confirmar'}</Text><Text style={s.detailsArrow}>›</Text></>}</Pressable>
  <View style={s.quickSection}><View style={s.quickRow}>
   <Pressable style={s.quickCard} onPress={openCalendar}><ShortcutIcon type="calendar"/><Text style={s.quickText}>CALENDÁRIO</Text></Pressable>
   <Pressable style={s.quickCard} onPress={()=>setScreen('news')}><ShortcutIcon type="news"/><Text style={s.quickText}>NOTÍCIAS</Text></Pressable>
   <Pressable style={s.quickCard} onPress={()=>setScreen('store')}><ShortcutIcon type="shop"/><Text style={s.quickText}>LOJA</Text></Pressable>
   <Pressable style={s.quickCard} onPress={()=>{setMemberMessage('');setScreen('members')}}><ShortcutIcon type="members"/><Text style={s.quickText}>SÓCIOS</Text></Pressable>
   <Pressable style={s.quickCard} onPress={()=>setScreen('benefits')}><ShortcutIcon type="star"/><Text style={s.quickText}>VANTAGENS</Text></Pressable>
  </View></View>
  <View style={s.newsSection}><View style={s.newsHeader}><Text style={s.newsHeading}>ÚLTIMAS NOTÍCIAS</Text><Text style={s.newsMore}>VER TODAS ›</Text></View>{officialNews.slice(0,3).map((item,i)=><Pressable key={i} style={s.newsCard} onPress={()=>openArticle(item)}><View style={s.newsAccent}/><View style={s.newsBody}><Text style={s.newsMeta}>{item.category}</Text><Text style={s.newsTitle}>{item.title}</Text></View><Text style={s.newsArrow}>›</Text></Pressable>)}</View>
 </Page>
}

const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#00142c',alignItems:'center',justifyContent:'center',overflow:'hidden'},background:{width:'100%',height:'100%'},
 card:{width:'100%',backgroundColor:'rgba(8,43,72,.90)',borderWidth:1,borderColor:'rgba(120,164,197,.34)',borderRadius:14,paddingHorizontal:13,paddingVertical:9},
 loading:{height:120,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',justifyContent:'space-between'},competition:{color:'#b7cee2',fontSize:8,letterSpacing:.55},round:{color:'#fff',fontSize:8.5,marginTop:3},date:{color:'#fff',fontSize:8},
 teams:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',marginTop:7},team:{width:'38%',alignItems:'center'},teamLogo:{width:39,height:43},bigLogo:{width:52,height:58},teamLogoFallback:{borderRadius:999,backgroundColor:'rgba(255,255,255,.08)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.18)'},teamLogoFallbackText:{color:'#dce7ef',fontSize:8,fontWeight:'700'},teamName:{color:'#fff',fontSize:8,marginTop:3,textAlign:'center',minHeight:16},teamStanding:{color:'#91abc0',fontSize:6,marginTop:1},vs:{color:'#93abc1',fontSize:12},score:{color:'#fff',fontSize:19},stadium:{color:'#b8c8d8',fontSize:8,textAlign:'center',marginTop:4},gameStatus:{color:'#f1b94f',fontSize:6,textAlign:'center',marginTop:3},detailsArrow:{position:'absolute',right:10,top:'48%',color:'#b7c9d9',fontSize:24},
 clubLine:{color:'#fff',fontSize:15,letterSpacing:.2},clubLight:{color:'#b9cadb'},quickSection:{marginTop:11,padding:7,borderRadius:14,backgroundColor:'rgba(5,35,62,.72)',borderWidth:1,borderColor:'rgba(120,164,197,.30)'},quickRow:{flexDirection:'row',justifyContent:'space-between'},quickCard:{width:'18.4%',height:61,borderRadius:10,backgroundColor:'rgba(8,43,72,.86)',borderWidth:1,borderColor:'rgba(79,139,181,.42)',alignItems:'center',justifyContent:'center',paddingHorizontal:2},quickIconFallback:{color:'#f1b94f',fontSize:22,lineHeight:26},quickText:{color:'#fff',fontSize:5.9,letterSpacing:.18,marginTop:5,textAlign:'center'},squadShortcut:{height:33,marginTop:7,borderRadius:9,borderWidth:1,borderColor:'rgba(241,185,79,.50)',backgroundColor:'rgba(8,43,72,.86)',flexDirection:'row',alignItems:'center',paddingHorizontal:10},squadShortcutText:{color:'#fff',fontSize:7,letterSpacing:.6,marginLeft:8,flex:1},squadShortcutArrow:{color:'#f1b94f',fontSize:18},
 memberHero:{flexDirection:'row',alignItems:'center',padding:10,borderRadius:12,backgroundColor:'rgba(8,43,72,.90)',borderWidth:1,borderColor:'rgba(241,185,79,.28)',marginBottom:8},memberHeroIcon:{width:36,height:36,borderRadius:10,backgroundColor:'rgba(241,185,79,.10)',alignItems:'center',justifyContent:'center'},memberHeroText:{flex:1,paddingLeft:9},memberHeroTitle:{color:'#fff',fontSize:9.5,fontWeight:'700',letterSpacing:.55},memberHeroSub:{color:'#9fb5c7',fontSize:6.3,lineHeight:9,marginTop:2},
 memberFees:{borderRadius:10,overflow:'hidden',borderWidth:1,borderColor:'rgba(120,164,197,.24)',marginBottom:8},memberFeeRow:{minHeight:32,flexDirection:'row',alignItems:'center',paddingHorizontal:8,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.07)',backgroundColor:'rgba(8,43,72,.76)'},memberFeeMain:{flex:1},memberFeeName:{color:'#fff',fontSize:6.7,fontWeight:'600'},memberFeeAge:{color:'#8fa9bc',fontSize:5.4,marginTop:1},memberFeeValue:{width:58,color:'#f1b94f',fontSize:6.1,textAlign:'right'},memberFeeAnnual:{width:58,color:'#b8c8d8',fontSize:5.8,textAlign:'right'},
 memberFormCard:{padding:10,borderRadius:12,backgroundColor:'rgba(8,43,72,.88)',borderWidth:1,borderColor:'rgba(120,164,197,.25)'},memberSectionTitle:{color:'#f1b94f',fontSize:6.4,letterSpacing:.6,marginTop:5,marginBottom:6},memberInput:{height:32,borderRadius:8,borderWidth:1,borderColor:'rgba(120,164,197,.32)',backgroundColor:'rgba(1,23,43,.58)',color:'#fff',fontSize:6.9,paddingHorizontal:9,marginBottom:6},memberInputRow:{flexDirection:'row',justifyContent:'space-between'},memberInputHalf:{width:'49%'},memberCategoryBox:{minHeight:40,borderRadius:9,borderWidth:1,borderColor:'rgba(241,185,79,.38)',backgroundColor:'rgba(241,185,79,.08)',paddingHorizontal:9,paddingVertical:6,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:7},memberCategoryLabel:{color:'#9fb5c7',fontSize:5.3,letterSpacing:.4},memberCategoryName:{color:'#fff',fontSize:7.4,fontWeight:'700',marginTop:2},memberCategoryPrice:{alignItems:'flex-end'},memberCategoryMonthly:{color:'#f1b94f',fontSize:7.4,fontWeight:'700'},memberCategoryAnnual:{color:'#9fb5c7',fontSize:5.7,marginTop:1},memberGuardianNote:{color:'#9fb5c7',fontSize:5.8,marginTop:-3,marginBottom:6},
 memberPhotoRow:{flexDirection:'row',alignItems:'center',marginBottom:8},memberPhotoFrame:{width:72,height:72,borderRadius:12,overflow:'hidden',borderWidth:1,borderColor:'rgba(241,185,79,.45)',backgroundColor:'rgba(1,23,43,.62)'},memberPhotoImage:{width:'100%',height:'100%'},memberPhotoEmpty:{flex:1,alignItems:'center',justifyContent:'center'},memberPhotoEmptyText:{color:'#7892a7',fontSize:5.4,marginTop:4},memberPhotoActions:{flex:1,paddingLeft:9},memberPhotoBtn:{height:28,borderRadius:7,borderWidth:1,borderColor:'rgba(241,185,79,.48)',alignItems:'center',justifyContent:'center',marginBottom:5},memberPhotoBtnText:{color:'#f1b94f',fontSize:5.9,fontWeight:'700',letterSpacing:.3},memberPhotoHint:{color:'#7892a7',fontSize:5.2,lineHeight:7.5},
 memberPaymentBox:{borderRadius:10,borderWidth:1,borderColor:'rgba(120,164,197,.24)',backgroundColor:'rgba(1,23,43,.38)',padding:8,marginBottom:6},memberPaymentLabel:{color:'#9fb5c7',fontSize:5.4,letterSpacing:.45,marginBottom:5},memberPaymentOptions:{flexDirection:'row',justifyContent:'space-between',marginBottom:8},memberPaymentOption:{width:'49%',height:29,borderRadius:8,borderWidth:1,borderColor:'rgba(120,164,197,.34)',alignItems:'center',justifyContent:'center'},memberPaymentMethod:{width:'49%',height:31,borderRadius:8,borderWidth:1,borderColor:'rgba(120,164,197,.34)',alignItems:'center',justifyContent:'center'},memberPaymentOptionOn:{backgroundColor:'#f1b94f',borderColor:'#f1b94f'},memberPaymentOptionText:{color:'#b7c9d9',fontSize:5.9},memberPaymentMethodText:{color:'#b7c9d9',fontSize:6.4,fontWeight:'700'},memberPaymentOptionTextOn:{color:'#082b48',fontWeight:'800'},memberPaymentTotal:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:7,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.08)'},memberPaymentTotalLabel:{color:'#fff',fontSize:6},memberPaymentTotalValue:{color:'#f1b94f',fontSize:10,fontWeight:'800'},memberPaymentNote:{color:'#7892a7',fontSize:5.2,lineHeight:7.5,marginTop:5},memberFreeBox:{padding:8,borderRadius:8,backgroundColor:'rgba(241,185,79,.08)'},memberFreeText:{color:'#f1b94f',fontSize:6.2,textAlign:'center'},
 memberConsent:{flexDirection:'row',alignItems:'flex-start',marginTop:8},memberCheck:{width:17,height:17,borderRadius:4,borderWidth:1,borderColor:'rgba(241,185,79,.60)',alignItems:'center',justifyContent:'center',marginRight:7,marginTop:1},memberCheckOn:{backgroundColor:'#f1b94f'},memberCheckMark:{color:'#082b48',fontSize:10,fontWeight:'800'},memberConsentText:{flex:1,color:'#afc0ce',fontSize:5.8,lineHeight:9},memberSubmit:{height:34,borderRadius:9,backgroundColor:'#f1b94f',alignItems:'center',justifyContent:'center',marginTop:10},memberSubmitText:{color:'#082b48',fontSize:6.8,fontWeight:'800',letterSpacing:.45},memberMessage:{color:'#fff',fontSize:6.3,lineHeight:9.5,textAlign:'center',marginTop:8},memberFootnote:{color:'#7892a7',fontSize:5.4,lineHeight:8,textAlign:'center',marginTop:7},
 benefitMiniHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:7,paddingHorizontal:1},benefitMiniTitle:{color:'#fff',fontSize:6.8,letterSpacing:.45},benefitMiniCount:{color:'#f1b94f',fontSize:6.1},
 benefitSearch:{height:30,borderRadius:8,borderWidth:1,borderColor:'rgba(120,164,197,.34)',backgroundColor:'rgba(1,23,43,.62)',color:'#fff',fontSize:6.8,paddingHorizontal:9,marginBottom:7},benefitFilters:{marginBottom:8},benefitResultHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:-1,marginBottom:5},benefitResultCount:{color:'#9fb5c7',fontSize:5.9,letterSpacing:.35},benefitSource:{color:'#f1b94f',fontSize:5.9,letterSpacing:.25},
 benefitRow:{minHeight:48,marginBottom:5,borderRadius:9,backgroundColor:'rgba(8,43,72,.86)',borderWidth:1,borderColor:'rgba(120,164,197,.23)',flexDirection:'row',alignItems:'center',paddingHorizontal:7,paddingVertical:5},benefitAvatar:{width:31,height:31,borderRadius:8,backgroundColor:'rgba(241,185,79,.13)',borderWidth:1,borderColor:'rgba(241,185,79,.32)',alignItems:'center',justifyContent:'center'},benefitAvatarText:{color:'#f1b94f',fontSize:11,fontWeight:'800'},benefitRowBody:{flex:1,paddingLeft:8,paddingRight:6},benefitName:{color:'#fff',fontSize:7.8,lineHeight:10.5,fontWeight:'600'},benefitRowMeta:{color:'#92aabd',fontSize:5.8,lineHeight:8,marginTop:2},benefitDiscountCompact:{maxWidth:72,minWidth:38,minHeight:23,paddingHorizontal:6,borderRadius:7,backgroundColor:'#f1b94f',alignItems:'center',justifyContent:'center'},benefitDiscountCompactText:{color:'#082b48',fontSize:6.8,fontWeight:'800',textAlign:'center'},benefitRowArrow:{color:'#8fa9bc',fontSize:16,lineHeight:18,marginLeft:5},
 benefitDetailCard:{padding:12,borderRadius:12,backgroundColor:'rgba(8,43,72,.90)',borderWidth:1,borderColor:'rgba(120,164,197,.28)'},benefitDetailTop:{flexDirection:'row',alignItems:'center',marginBottom:12},benefitDetailAvatar:{width:42,height:42,borderRadius:11,backgroundColor:'rgba(241,185,79,.13)',borderWidth:1,borderColor:'rgba(241,185,79,.35)',alignItems:'center',justifyContent:'center'},benefitDetailAvatarText:{color:'#f1b94f',fontSize:15,fontWeight:'800'},benefitDetailNameWrap:{flex:1,paddingHorizontal:9},benefitDetailName:{color:'#fff',fontSize:10.5,lineHeight:14,fontWeight:'700'},benefitDetailCategory:{color:'#91aabd',fontSize:6.2,marginTop:2},benefitDiscount:{minWidth:44,minHeight:28,paddingHorizontal:7,borderRadius:8,backgroundColor:'#f1b94f',alignItems:'center',justifyContent:'center'},benefitDiscountText:{color:'#082b48',fontSize:8.1,fontWeight:'800',textAlign:'center'},benefitDetailLabel:{color:'#f1b94f',fontSize:6,letterSpacing:.55,marginTop:8,marginBottom:4},benefitDetailText:{color:'#d7e1e9',fontSize:7.2,lineHeight:11},benefitAction:{height:31,borderRadius:8,borderWidth:1,borderColor:'rgba(241,185,79,.43)',marginTop:9,paddingHorizontal:10,flexDirection:'row',alignItems:'center'},benefitActionText:{color:'#f1b94f',fontSize:6.4,letterSpacing:.35,flex:1},benefitActionArrow:{color:'#f1b94f',fontSize:17},
  cartTopButton:{height:34,marginBottom:10,borderRadius:10,borderWidth:1,borderColor:'rgba(241,185,79,.55)',backgroundColor:'rgba(8,43,72,.86)',flexDirection:'row',alignItems:'center',paddingHorizontal:10},cartTopText:{color:'#fff',fontSize:7.5,letterSpacing:.6,marginLeft:8,flex:1},cartBadge:{minWidth:21,height:21,borderRadius:11,backgroundColor:'#f1b94f',alignItems:'center',justifyContent:'center'},cartBadgeText:{color:'#082b48',fontSize:7,fontWeight:'700'},cartTopArrow:{color:'#f1b94f',fontSize:18,marginLeft:6},
 storeGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},storeCard:{width:'48.5%',marginBottom:9,padding:7,borderRadius:11,backgroundColor:'rgba(8,43,72,.88)',borderWidth:1,borderColor:'rgba(120,164,197,.25)'},storeImage:{width:'100%',aspectRatio:.9,borderRadius:8,backgroundColor:'#fff'},storeImageFallback:{alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.06)'},storeName:{color:'#fff',fontSize:7.4,lineHeight:10,minHeight:22,marginTop:6},storePrice:{color:'#f1b94f',fontSize:8.5,fontWeight:'700',marginTop:3},storeStock:{color:'#9bd2ad',fontSize:5.6,marginTop:2},storeStockOut:{color:'#e6a4aa'},storeAdd:{height:26,borderRadius:7,backgroundColor:'#f1b94f',alignItems:'center',justifyContent:'center',marginTop:6},storeAddOff:{opacity:.4},storeAddText:{color:'#082b48',fontSize:6.2,fontWeight:'700',letterSpacing:.25},storeOfficial:{color:'#b8c8d8',fontSize:5.8,textAlign:'center',marginTop:6},
 productDetail:{padding:10,borderRadius:12,backgroundColor:'rgba(8,43,72,.90)',borderWidth:1,borderColor:'rgba(120,164,197,.28)'},productHero:{width:'100%',aspectRatio:1,borderRadius:10,backgroundColor:'#fff'},productName:{color:'#fff',fontSize:12,lineHeight:16,marginTop:10},productPrice:{color:'#f1b94f',fontSize:13,fontWeight:'700',marginTop:4},productDescription:{color:'#c9d8e4',fontSize:7,lineHeight:11,marginTop:8},optionGroup:{marginTop:11},optionTitle:{color:'#fff',fontSize:7.3,marginBottom:6},optionValues:{flexDirection:'row',flexWrap:'wrap'},optionChip:{paddingHorizontal:10,height:27,borderRadius:14,borderWidth:1,borderColor:'rgba(241,185,79,.45)',alignItems:'center',justifyContent:'center',marginRight:6,marginBottom:6},optionChipOn:{backgroundColor:'#f1b94f'},optionChipText:{color:'#f1b94f',fontSize:6.5},optionChipTextOn:{color:'#082b48',fontWeight:'700'},productAdd:{height:36,borderRadius:9,backgroundColor:'#f1b94f',alignItems:'center',justifyContent:'center',marginTop:10},productAddText:{color:'#082b48',fontSize:7,fontWeight:'700',letterSpacing:.4},productOfficial:{color:'#b8c8d8',fontSize:6.2,textAlign:'center',marginTop:9},
  checkoutCard:{padding:11,borderRadius:12,backgroundColor:'rgba(8,43,72,.90)',borderWidth:1,borderColor:'rgba(120,164,197,.28)'},checkoutSectionTitle:{color:'#f1b94f',fontSize:7.2,letterSpacing:.65,marginTop:6,marginBottom:7},checkoutInput:{height:34,borderRadius:8,borderWidth:1,borderColor:'rgba(120,164,197,.32)',backgroundColor:'rgba(1,23,43,.58)',color:'#fff',fontSize:7.5,paddingHorizontal:10,marginBottom:7},checkoutInputRow:{flexDirection:'row',justifyContent:'space-between'},checkoutInputSmall:{width:'31%'},checkoutInputWide:{width:'66%'},deliveryChoices:{flexDirection:'row',flexWrap:'wrap',marginBottom:8},deliveryChoice:{height:29,paddingHorizontal:10,borderRadius:15,borderWidth:1,borderColor:'rgba(241,185,79,.45)',alignItems:'center',justifyContent:'center',marginRight:6,marginBottom:5},deliveryChoiceOn:{backgroundColor:'#f1b94f'},deliveryChoiceText:{color:'#f1b94f',fontSize:6.5},deliveryChoiceTextOn:{color:'#082b48',fontWeight:'700'},mbwayChoice:{padding:9,borderRadius:9,borderWidth:1,borderColor:'rgba(241,185,79,.45)',backgroundColor:'rgba(1,23,43,.45)',marginBottom:9},mbwayTitle:{color:'#fff',fontSize:8.5,fontWeight:'700'},mbwayText:{color:'#9fb5c7',fontSize:6.2,lineHeight:9,marginTop:3},checkoutSummaryRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:4},checkoutSummaryLabel:{color:'#a9bdcd',fontSize:7},checkoutSummaryValue:{color:'#fff',fontSize:7},checkoutSummaryTotal:{borderTopWidth:1,borderTopColor:'rgba(255,255,255,.15)',marginTop:4,paddingTop:8},checkoutTotalLabel:{color:'#fff',fontSize:8,fontWeight:'700'},checkoutTotalValue:{color:'#f1b94f',fontSize:11,fontWeight:'700'},checkoutBtnOff:{opacity:.38},checkoutMessage:{color:'#fff',fontSize:6.6,lineHeight:10,textAlign:'center',marginTop:8},
  cartItem:{flexDirection:'row',padding:8,marginBottom:7,borderRadius:10,backgroundColor:'rgba(8,43,72,.86)',borderWidth:1,borderColor:'rgba(120,164,197,.25)'},cartImage:{width:62,height:72,borderRadius:7,backgroundColor:'#fff'},cartBody:{flex:1,paddingLeft:9},cartName:{color:'#fff',fontSize:8,lineHeight:11},cartOptions:{color:'#9fb5c7',fontSize:6.2,marginTop:2},cartPrice:{color:'#f1b94f',fontSize:8,marginTop:3},qtyRow:{flexDirection:'row',alignItems:'center',marginTop:8},qtyBtn:{width:24,height:22,borderRadius:6,borderWidth:1,borderColor:'rgba(241,185,79,.55)',alignItems:'center',justifyContent:'center'},qtyText:{color:'#f1b94f',fontSize:13,lineHeight:16},qtyValue:{color:'#fff',fontSize:8,minWidth:28,textAlign:'center'},cartTotalRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:10,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.15)'},cartTotalLabel:{color:'#fff',fontSize:8,letterSpacing:.6},cartTotalValue:{color:'#f1b94f',fontSize:11,fontWeight:'700'},checkoutBtn:{height:36,borderRadius:9,backgroundColor:'#f1b94f',alignItems:'center',justifyContent:'center'},checkoutText:{color:'#082b48',fontSize:7,fontWeight:'700',letterSpacing:.45},checkoutNote:{color:'#8fa8ba',fontSize:5.8,lineHeight:9,marginTop:7,textAlign:'center'},
 newsSection:{marginTop:12},newsHeader:{flexDirection:'row',justifyContent:'space-between',marginBottom:7},newsHeading:{color:'#fff',fontSize:8.5,letterSpacing:.65},newsMore:{color:'#f1b94f',fontSize:6.5},newsCard:{minHeight:49,marginBottom:6,borderRadius:10,backgroundColor:'rgba(8,43,72,.84)',borderWidth:1,borderColor:'rgba(120,164,197,.25)',flexDirection:'row',alignItems:'center',overflow:'hidden'},newsAccent:{width:3,alignSelf:'stretch',backgroundColor:'#a91f42'},newsBody:{flex:1,paddingHorizontal:10,paddingVertical:7},newsMeta:{color:'#f1b94f',fontSize:5.8,letterSpacing:.45,marginBottom:3},newsTitle:{color:'#fff',fontSize:8,lineHeight:11},newsArrow:{color:'#9eb6c9',fontSize:18,paddingHorizontal:10},
 pageHead:{flexDirection:'row',alignItems:'center',marginBottom:14},back:{color:'#fff',fontSize:30,lineHeight:30,paddingRight:12},pageTitle:{color:'#fff',fontSize:14,letterSpacing:.8},detailCard:{backgroundColor:'rgba(8,43,72,.90)',borderRadius:14,padding:14,borderWidth:1,borderColor:'rgba(120,164,197,.3)'},kicker:{color:'#f1b94f',fontSize:7,letterSpacing:.5},detailDate:{color:'#fff',fontSize:9,marginTop:4,textAlign:'right'},blockTitle:{color:'#f1b94f',fontSize:7.5,letterSpacing:.7,marginTop:14,marginBottom:6},infoCard:{backgroundColor:'rgba(8,43,72,.82)',borderRadius:10,padding:11,borderWidth:1,borderColor:'rgba(120,164,197,.22)'},body:{color:'#fff',fontSize:8,lineHeight:13},muted:{color:'#a9bdcd',fontSize:8,lineHeight:12},statRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:4,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.08)'},
 articleCard:{backgroundColor:'rgba(8,43,72,.90)',borderRadius:14,padding:14,borderWidth:1,borderColor:'rgba(120,164,197,.3)'},articleTitle:{color:'#fff',fontSize:14,lineHeight:19,marginBottom:12},articleBody:{color:'#dce7ef',fontSize:8.5,lineHeight:14},articleParagraph:{color:'#dce7ef',fontSize:8.5,lineHeight:14,marginBottom:9},articleHeroImage:{width:'100%',height:190,borderRadius:12,marginBottom:16},articleInlineImage:{width:'100%',height:210,borderRadius:10,marginVertical:10},
 calendarTabs:{marginBottom:10,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.10)'},calendarTabsContent:{paddingRight:18},calendarTopTab:{height:31,justifyContent:'center',marginRight:18,borderBottomWidth:2,borderBottomColor:'transparent'},calendarTopTabOn:{borderBottomColor:'#f1b94f'},calendarTopTabText:{color:'#849bad',fontSize:6.8,fontWeight:'700',letterSpacing:.55},calendarTopTabTextOn:{color:'#fff'},
 calendarLastCard:{padding:9,borderRadius:10,backgroundColor:'rgba(255,255,255,.96)',marginBottom:8},calendarCardCompetition:{color:'#7e8790',fontSize:6.1,fontWeight:'700',textAlign:'center',marginBottom:5},calendarLastRow:{flexDirection:'row',alignItems:'center',justifyContent:'center'},calendarLastTeam:{width:'34%',flexDirection:'row',alignItems:'center',justifyContent:'flex-end'},calendarLastTeamName:{color:'#6f7880',fontSize:7.5,fontWeight:'700',textAlign:'right',flexShrink:1},calendarLastLogo:{width:28,height:32,marginHorizontal:5},calendarLastScoreBox:{width:'25%',alignItems:'center'},calendarLastScore:{color:'#313a42',fontSize:13,fontWeight:'800'},calendarLastDate:{color:'#7e8790',fontSize:6.2,fontWeight:'700',marginTop:1},
 calendarNextCard:{padding:12,borderRadius:12,backgroundColor:'rgba(255,255,255,.98)',marginBottom:10},calendarNextCompetition:{color:'#17212a',fontSize:8.3,fontWeight:'800',textAlign:'center',marginBottom:10},calendarNextTeams:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},calendarNextTeam:{width:'27%',alignItems:'center'},calendarNextLogo:{width:58,height:64},calendarNextTeamCode:{color:'#17212a',fontSize:7.5,fontWeight:'800',marginTop:4},calendarNextCenter:{width:'40%',alignItems:'center'},calendarNextDate:{color:'#111',fontSize:14,fontWeight:'900'},calendarNextTime:{color:'#111',fontSize:8,fontWeight:'700',marginTop:1},calendarNextVenue:{color:'#4b545b',fontSize:5.7,lineHeight:8,textAlign:'center',marginTop:3},calendarNextMatchup:{color:'#111',fontSize:16,lineHeight:19,fontWeight:'900',textAlign:'center',marginTop:12},
 calendarSectionTitle:{color:'#fff',fontSize:7.2,fontWeight:'800',letterSpacing:.6,marginTop:10,marginBottom:6},calendarUpcomingCard:{flexDirection:'row',borderRadius:10,backgroundColor:'rgba(8,43,72,.86)',borderWidth:1,borderColor:'rgba(120,164,197,.25)',marginBottom:6,overflow:'hidden'},calendarUpcomingDate:{width:61,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(1,23,43,.55)',padding:7},calendarUpcomingDay:{color:'#fff',fontSize:7,fontWeight:'800'},calendarUpcomingTime:{color:'#f1b94f',fontSize:6.3,marginTop:2},calendarUpcomingBody:{flex:1,padding:7},calendarUpcomingCompetition:{color:'#8fa9bc',fontSize:5.7,marginBottom:4},calendarUpcomingTeams:{flexDirection:'row',alignItems:'center'},calendarUpcomingLogo:{width:22,height:24},calendarUpcomingTitle:{flex:1,color:'#fff',fontSize:7.3,fontWeight:'700',textAlign:'center'},calendarUpcomingVenue:{color:'#7892a7',fontSize:5.3,textAlign:'center',marginTop:4},
 calendarHistoryCard:{padding:8,borderRadius:9,backgroundColor:'rgba(8,43,72,.70)',borderWidth:1,borderColor:'rgba(120,164,197,.18)',marginBottom:5},calendarHistoryMeta:{flexDirection:'row',justifyContent:'space-between',marginBottom:5},calendarHistoryDate:{color:'#f1b94f',fontSize:5.6},calendarHistoryCompetition:{color:'#7892a7',fontSize:5.3},calendarHistoryScoreRow:{flexDirection:'row',alignItems:'center'},calendarHistoryTeam:{width:'25%',color:'#fff',fontSize:6.4,fontWeight:'600',textAlign:'right'},calendarHistoryLogo:{width:21,height:23,marginHorizontal:5},calendarHistoryScore:{width:48,color:'#fff',fontSize:8.5,fontWeight:'800',textAlign:'center'},
 standingsCard:{borderRadius:10,overflow:'hidden',borderWidth:1,borderColor:'rgba(120,164,197,.24)'},standingsHead:{height:28,flexDirection:'row',alignItems:'center',backgroundColor:'rgba(1,23,43,.72)',paddingHorizontal:6},standingsRow:{minHeight:34,flexDirection:'row',alignItems:'center',backgroundColor:'rgba(8,43,72,.78)',borderTopWidth:1,borderTopColor:'rgba(255,255,255,.06)',paddingHorizontal:6},standingsRowClub:{backgroundColor:'rgba(241,185,79,.11)'},standingsCell:{width:28,color:'#a9bdcd',fontSize:6.2,textAlign:'center'},standingsPos:{width:23},standingsTeam:{flex:1,textAlign:'left'},standingsPts:{color:'#fff',fontWeight:'800'},standingsTeamWrap:{flex:1,flexDirection:'row',alignItems:'center'},standingsLogo:{width:22,height:24,marginRight:6},standingsTeamName:{flex:1,color:'#fff',fontSize:6.6,fontWeight:'600'},
 statsHero:{flexDirection:'row',alignItems:'center',padding:11,borderRadius:11,backgroundColor:'rgba(8,43,72,.88)',borderWidth:1,borderColor:'rgba(241,185,79,.30)',marginBottom:8},statsHeroPosition:{color:'#f1b94f',fontSize:18,fontWeight:'900',marginRight:11},statsHeroTitle:{color:'#fff',fontSize:8.2,fontWeight:'800'},statsHeroSub:{color:'#8fa9bc',fontSize:5.7,marginTop:2},statsHeroPoints:{marginLeft:'auto',color:'#fff',fontSize:9,fontWeight:'800'},statsGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},statsBox:{width:'32%',paddingVertical:9,alignItems:'center',borderRadius:9,backgroundColor:'rgba(8,43,72,.82)',borderWidth:1,borderColor:'rgba(120,164,197,.22)',marginBottom:6},statsValue:{color:'#fff',fontSize:13,fontWeight:'900'},statsLabel:{color:'#8fa9bc',fontSize:5.2,marginTop:2},statsWide:{flexDirection:'row',justifyContent:'space-around',padding:10,borderRadius:9,backgroundColor:'rgba(1,23,43,.55)',marginTop:2},statsWideLabel:{color:'#8fa9bc',fontSize:5.4,textAlign:'center'},statsWideValue:{color:'#f1b94f',fontSize:10,fontWeight:'800',textAlign:'center',marginTop:2},formRow:{flexDirection:'row'},formBadge:{width:28,height:28,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(120,164,197,.30)',marginRight:6},formWin:{backgroundColor:'rgba(53,160,95,.75)'},formDraw:{backgroundColor:'rgba(204,151,38,.75)'},formLoss:{backgroundColor:'rgba(180,52,67,.75)'},formBadgeText:{color:'#fff',fontSize:7,fontWeight:'800'},
  squadTopButton:{height:34,marginBottom:10,borderRadius:10,borderWidth:1,borderColor:'rgba(241,185,79,.55)',backgroundColor:'rgba(8,43,72,.82)',flexDirection:'row',alignItems:'center',paddingHorizontal:11},squadTopButtonText:{color:'#fff',fontSize:7.5,letterSpacing:.6,marginLeft:9,flex:1},squadTopArrow:{color:'#f1b94f',fontSize:18},playerGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},playerCard:{width:'48.5%',marginBottom:8,borderRadius:10,backgroundColor:'rgba(8,43,72,.86)',borderWidth:1,borderColor:'rgba(120,164,197,.25)',padding:7,position:'relative'},playerPhoto:{width:'100%',aspectRatio:.86,borderRadius:8,backgroundColor:'rgba(255,255,255,.05)'},playerPhotoFallback:{alignItems:'center',justifyContent:'center'},playerPhotoLogo:{width:52,height:64},playerNumberBadge:{position:'absolute',top:12,right:12,minWidth:22,height:22,borderRadius:11,backgroundColor:'#f1b94f',alignItems:'center',justifyContent:'center'},playerNumber:{color:'#082b48',fontSize:7,fontWeight:'700'},playerName:{color:'#fff',fontSize:7.4,lineHeight:10,marginTop:6,fontWeight:'600'},playerPosition:{color:'#f1b94f',fontSize:6.2,marginTop:2},playerMeta:{color:'#9fb5c7',fontSize:5.8,marginTop:2},filters:{marginBottom:12},filtersContent:{paddingRight:24},filter:{height:27,paddingHorizontal:10,marginRight:6,borderRadius:14,borderWidth:1,borderColor:'rgba(120,164,197,.35)',justifyContent:'center',backgroundColor:'rgba(8,43,72,.72)'},filterOn:{borderColor:'#f1b94f',backgroundColor:'rgba(241,185,79,.12)'},filterText:{color:'#b7c9d9',fontSize:6.5},filterTextOn:{color:'#f1b94f'},gameTabs:{flexDirection:'row',marginTop:10,marginBottom:8,borderRadius:10,backgroundColor:'rgba(4,28,51,.60)',padding:3},gameTab:{flex:1,height:29,alignItems:'center',justifyContent:'center',borderRadius:8},gameTabOn:{backgroundColor:'rgba(241,185,79,.14)',borderWidth:1,borderColor:'#f1b94f'},gameTabText:{color:'#aebfce',fontSize:7,letterSpacing:.3},gameTabTextOn:{color:'#f1b94f'},timeline:{marginTop:10,paddingTop:8,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.08)'},sourceButton:{marginTop:16,height:32,borderRadius:8,borderWidth:1,borderColor:'#f1b94f',alignItems:'center',justifyContent:'center'},sourceButtonText:{color:'#f1b94f',fontSize:7,letterSpacing:.4},eventCard:{flexDirection:'row',marginBottom:7,borderRadius:10,backgroundColor:'rgba(8,43,72,.84)',borderWidth:1,borderColor:'rgba(120,164,197,.25)',overflow:'hidden'},dateBox:{width:72,padding:9,justifyContent:'center',backgroundColor:'rgba(4,28,51,.55)'},dateBoxText:{color:'#fff',fontSize:8},eventType:{color:'#f1b94f',fontSize:5.8,marginTop:4},eventBody:{flex:1,padding:9},eventSport:{color:'#9eb6c9',fontSize:6},eventTitle:{color:'#fff',fontSize:8.5,marginVertical:3}
});