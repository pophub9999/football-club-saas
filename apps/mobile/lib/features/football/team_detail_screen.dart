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
  List<FootballSquadPlayer> squad = const [];
  bool loading = true;
  Object? error;
  Object? squadError;
  @override void initState(){super.initState();repository=FootballRepository(widget.api);_load();}

  Future<void> _load() async {
    setState((){loading=true;error=null;squadError=null;});
    try {
      final results = await Future.wait([
        repository.upcoming(widget.accessToken,limit:50),
        repository.squad(widget.accessToken,widget.team.id),
      ]);
      final all=results[0] as List<FixtureSummary>;
      final players=results[1] as List<FootballSquadPlayer>;
      final id=widget.team.id; final ext=widget.team.externalId;
      final result=all.where((f)=>f.homeTeam['id']==id||f.awayTeam['id']==id||f.homeTeam['externalId']==ext||f.awayTeam['externalId']==ext).toList(growable:false);
      if(mounted)setState(()=>fixtures=result..sort((a,b)=>a.kickoffAt.compareTo(b.kickoffAt)));
      if(mounted)setState(()=>squad=players);
    } catch(e) {
      if(mounted) setState(()=>squadError=e);
      try {
        final all=await repository.upcoming(widget.accessToken,limit:50);
        final id=widget.team.id; final ext=widget.team.externalId;
        final result=all.where((f)=>f.homeTeam['id']==id||f.awayTeam['id']==id||f.homeTeam['externalId']==ext||f.awayTeam['externalId']==ext).toList(growable:false);
        if(mounted)setState(()=>fixtures=result..sort((a,b)=>a.kickoffAt.compareTo(b.kickoffAt)));
      } catch(inner){if(mounted)setState(()=>error=inner);}
    } finally{if(mounted)setState(()=>loading=false);}
  }

  @override Widget build(BuildContext context){
    final b=widget.branding;
    return Scaffold(backgroundColor:b.backgroundColor,appBar:AppBar(title:Text(widget.team.name),backgroundColor:b.backgroundColor,foregroundColor:b.textColor),body:RefreshIndicator(onRefresh:_load,child:ListView(padding:const EdgeInsets.fromLTRB(20,20,20,32),children:[_hero(b),const SizedBox(height:22),Text('Próximos jogos',style:TextStyle(color:b.textColor,fontSize:18,fontWeight:FontWeight.w800)),const SizedBox(height:10),if(loading&&fixtures.isEmpty)const Padding(padding:EdgeInsets.all(30),child:Center(child:CircularProgressIndicator())) else if(error!=null&&fixtures.isEmpty)_message('Não foi possível carregar os jogos.',b) else if(fixtures.isEmpty)_message('Ainda não existem jogos futuros para esta equipa.',b) else ...fixtures.map((f)=>_fixture(f,b)),const SizedBox(height:24),_squadHeader(b),const SizedBox(height:10),if(squadError!=null&&squad.isEmpty)_message('Não foi possível carregar o plantel.',b) else if(loading&&squad.isEmpty)const Padding(padding:EdgeInsets.all(30),child:Center(child:CircularProgressIndicator())) else if(squad.isEmpty)_message('Não existem jogadores disponíveis para esta equipa.',b) else ..._squadSections(b)]))));
  }

  Widget _hero(ClubBranding b)=>Container(padding:const EdgeInsets.all(22),decoration:BoxDecoration(color:b.surfaceColor,borderRadius:BorderRadius.circular(22)),child:Column(children:[Container(width:92,height:92,decoration:BoxDecoration(color:b.backgroundColor,shape:BoxShape.circle),child:widget.team.logoUrl==null?Icon(Icons.shield_outlined,size:52,color:b.primaryColor):ClipOval(child:Image.network(widget.team.logoUrl!,fit:BoxFit.contain,errorBuilder:(_,__,___)=>Icon(Icons.shield_outlined,size:52,color:b.primaryColor)))),const SizedBox(height:14),Text(widget.team.name,textAlign:TextAlign.center,style:TextStyle(color:b.textColor,fontSize:22,fontWeight:FontWeight.w900)),if(widget.team.shortName?.isNotEmpty==true)Text(widget.team.shortName!,style:TextStyle(color:b.mutedTextColor)),const SizedBox(height:6),Text(widget.team.provider??'football',style:TextStyle(color:b.mutedTextColor,fontSize:11))]));

  Widget _fixture(FixtureSummary f,ClubBranding b){final d=f.kickoffAt;final time='${d.day.toString().padLeft(2,'0')}/${d.month.toString().padLeft(2,'0')} · ${d.hour.toString().padLeft(2,'0')}:${d.minute.toString().padLeft(2,'0')}';return Container(margin:const EdgeInsets.only(bottom:10),padding:const EdgeInsets.all(14),decoration:BoxDecoration(color:b.surfaceColor,borderRadius:BorderRadius.circular(16)),child:Row(children:[Expanded(child:Text(f.homeName,style:TextStyle(color:b.textColor,fontWeight:FontWeight.w700))),Text('VS',style:TextStyle(color:b.mutedTextColor,fontWeight:FontWeight.w800)),Expanded(child:Text(f.awayName,textAlign:TextAlign.right,style:TextStyle(color:b.textColor,fontWeight:FontWeight.w700))),const SizedBox(width:10),Text(time,style:TextStyle(color:b.mutedTextColor,fontSize:11))]));}

  Widget _squadHeader(ClubBranding b)=>Row(children:[Expanded(child:Text('Plantel',style:TextStyle(color:b.textColor,fontSize:18,fontWeight:FontWeight.w800))),Text('${squad.length} jogadores',style:TextStyle(color:b.mutedTextColor,fontSize:12))]);

  List<Widget> _squadSections(ClubBranding b){
    final groups=<String,List<FootballSquadPlayer>>{};
    for(final player in squad){final key=player.position?.trim().isNotEmpty==true?player.position!:'Outros';groups.putIfAbsent(key,()=>[]).add(player);}
    final order=['Goalkeeper','Defender','Midfielder','Forward','Guarda-redes','Defesa','Médio','Avançado','Outros'];
    final keys=groups.keys.toList()..sort((a,c){final ai=order.indexOf(a);final ci=order.indexOf(c);if(ai==-1&&ci==-1)return a.compareTo(c);if(ai==-1)return 1;if(ci==-1)return -1;return ai.compareTo(ci);});
    return [for(final key in keys) ...[_positionTitle(key,b),const SizedBox(height:8),...groups[key]!.map((player)=>_playerCard(player,b)),const SizedBox(height:10)]];
  }

  Widget _positionTitle(String title,ClubBranding b)=>Text(title,style:TextStyle(color:b.primaryColor,fontSize:14,fontWeight:FontWeight.w900));

  Widget _playerCard(FootballSquadPlayer player,ClubBranding b)=>Card(color:b.surfaceColor,margin:const EdgeInsets.only(bottom:8),child:ListTile(onTap:player.externalId.isEmpty?null:()=>Navigator.of(context).push(MaterialPageRoute(builder:(_)=>PlayerScreen(branding:b,api:widget.api,accessToken:widget.accessToken,playerId:player.externalId))),contentPadding:const EdgeInsets.symmetric(horizontal:12,vertical:4),leading:CircleAvatar(radius:25,backgroundColor:b.backgroundColor,backgroundImage:player.imageUrl==null?null:NetworkImage(player.imageUrl!),child:player.imageUrl==null?Icon(Icons.person_outline,color:b.primaryColor):null),title:Row(children:[Expanded(child:Text(player.displayName??player.name,style:TextStyle(color:b.textColor,fontWeight:FontWeight.w800))),if(player.isCaptain==true)Icon(Icons.star_rounded,size:18,color:b.primaryColor)]),subtitle:Text([if(player.detailedPosition!=null)player.detailedPosition!,if(player.jerseyNumber!=null)'N.º ${player.jerseyNumber}'].join(' · '),style:TextStyle(color:b.mutedTextColor,fontSize:12)),trailing:Icon(Icons.chevron_right,color:b.mutedTextColor)));

  Widget _message(String text,ClubBranding b)=>Padding(padding:const EdgeInsets.symmetric(vertical:18),child:Text(text,textAlign:TextAlign.center,style:TextStyle(color:b.mutedTextColor)));
}
