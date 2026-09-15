import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'football_repository.dart';
import 'player_screen.dart';

class TeamDetailScreen extends StatefulWidget {
  const TeamDetailScreen({super.key, required this.branding, required this.api, required this.accessToken, required this.team});
  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  final FootballTeam team;
  @override State<TeamDetailScreen> createState() => _TeamDetailScreenState();
}
class _TeamDetailScreenState extends State<TeamDetailScreen> {
  late final FootballRepository repository;
  List<FixtureSummary> fixtures = const [];
  bool loading = true;
  Object? error;
  @override void initState(){super.initState();repository=FootballRepository(widget.api);_load();}
  Future<void> _load() async { setState((){loading=true;error=null;}); try { final all=await repository.upcoming(widget.accessToken,limit:50); final id=widget.team.id; final ext=widget.team.externalId; final result=all.where((f)=>f.homeTeam['id']==id||f.awayTeam['id']==id||f.homeTeam['externalId']==ext||f.awayTeam['externalId']==ext).toList(growable:false); if(mounted)setState(()=>fixtures=result); } catch(e){if(mounted)setState(()=>error=e);} finally{if(mounted)setState(()=>loading=false);} }
  @override Widget build(BuildContext context){final b=widget.branding;return Scaffold(backgroundColor:b.backgroundColor,appBar:AppBar(title:Text(widget.team.name),backgroundColor:b.backgroundColor,foregroundColor:b.textColor),body:RefreshIndicator(onRefresh:_load,child:ListView(padding:const EdgeInsets.fromLTRB(20,20,20,32),children:[_hero(b),const SizedBox(height:22),Text('Próximos jogos',style:TextStyle(color:b.textColor,fontSize:18,fontWeight:FontWeight.w800)),const SizedBox(height:10),if(loading&&fixtures.isEmpty)const Padding(padding:EdgeInsets.all(30),child:Center(child:CircularProgressIndicator())) else if(error!=null&&fixtures.isEmpty)_message('Não foi possível carregar os jogos.',b) else if(fixtures.isEmpty)_message('Ainda não existem jogos futuros para esta equipa.',b) else ...fixtures.map((f)=>_fixture(f,b)),const SizedBox(height:24),Text('Plantel',style:TextStyle(color:b.textColor,fontSize:18,fontWeight:FontWeight.w800)),const SizedBox(height:8),_message('O plantel completo será carregado do fornecedor de futebol assim que a sincronização de plantéis estiver ativa.',b)])));}
  Widget _hero(ClubBranding b)=>Container(padding:const EdgeInsets.all(22),decoration:BoxDecoration(color:b.surfaceColor,borderRadius:BorderRadius.circular(22)),child:Column(children:[Container(width:92,height:92,decoration:BoxDecoration(color:b.backgroundColor,shape:BoxShape.circle),child:widget.team.logoUrl==null?Icon(Icons.shield_outlined,size:52,color:b.primaryColor):ClipOval(child:Image.network(widget.team.logoUrl!,fit:BoxFit.contain,errorBuilder:(_,__,___)=>Icon(Icons.shield_outlined,size:52,color:b.primaryColor)))),const SizedBox(height:14),Text(widget.team.name,textAlign:TextAlign.center,style:TextStyle(color:b.textColor,fontSize:22,fontWeight:FontWeight.w900)),if(widget.team.shortName?.isNotEmpty==true)Text(widget.team.shortName!,style:TextStyle(color:b.mutedTextColor)),const SizedBox(height:6),Text(widget.team.provider??'football',style:TextStyle(color:b.mutedTextColor,fontSize:11))]));
  Widget _fixture(FixtureSummary f,ClubBranding b){final d=f.kickoffAt;final time='${d.day.toString().padLeft(2,'0')}/${d.month.toString().padLeft(2,'0')} · ${d.hour.toString().padLeft(2,'0')}:${d.minute.toString().padLeft(2,'0')}';return Container(margin:const EdgeInsets.only(bottom:10),padding:const EdgeInsets.all(14),decoration:BoxDecoration(color:b.surfaceColor,borderRadius:BorderRadius.circular(16)),child:Row(children:[Expanded(child:Text(f.homeName,style:TextStyle(color:b.textColor,fontWeight:FontWeight.w700))),Text('VS',style:TextStyle(color:b.mutedTextColor,fontWeight:FontWeight.w800)),Expanded(child:Text(f.awayName,textAlign:TextAlign.right,style:TextStyle(color:b.textColor,fontWeight:FontWeight.w700))),const SizedBox(width:10),Text(time,style:TextStyle(color:b.mutedTextColor,fontSize:11))]));}
  Widget _message(String text,ClubBranding b)=>Padding(padding:const EdgeInsets.symmetric(vertical:18),child:Text(text,textAlign:TextAlign.center,style:TextStyle(color:b.mutedTextColor)));
}
