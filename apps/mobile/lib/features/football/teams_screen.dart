import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'football_repository.dart';
import 'team_detail_screen.dart';

class TeamsScreen extends StatefulWidget {
  const TeamsScreen({super.key, required this.branding, required this.api, required this.accessToken});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;

  @override
  State<TeamsScreen> createState() => _TeamsScreenState();
}

class _TeamsScreenState extends State<TeamsScreen> {
  late final FootballRepository repository;
  List<FootballTeam> teams = const [];
  Object? error;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    repository = FootballRepository(widget.api);
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final result = await repository.teams(widget.accessToken);
      if (mounted) setState(() => teams = result);
    } catch (e) {
      if (mounted) setState(() => error = e);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    Widget body;
    if (loading && teams.isEmpty) {
      body = ListView(children: const [SizedBox(height: 260), Center(child: CircularProgressIndicator())]);
    } else if (error != null && teams.isEmpty) {
      body = ListView(children: [_message('Não foi possível carregar as equipas.', b)]);
    } else if (teams.isEmpty) {
      body = ListView(children: [_message('Ainda não existem equipas sincronizadas.', b)]);
    } else {
      body = ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        itemCount: teams.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, index) => _teamCard(teams[index], b),
      );
    }

    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(title: const Text('Equipas'), backgroundColor: b.backgroundColor, foregroundColor: b.textColor),
      body: RefreshIndicator(onRefresh: _load, child: body),
    );
  }

  Widget _teamCard(FootballTeam team, ClubBranding b) {
    return InkWell(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => TeamDetailScreen(branding: b, api: widget.api, accessToken: widget.accessToken, team: team))),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(18), border: Border.all(color: b.primaryColor.withValues(alpha: .12))),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: b.backgroundColor, shape: BoxShape.circle),
              child: team.logoUrl == null
                  ? Icon(Icons.shield_outlined, color: b.primaryColor, size: 30)
                  : ClipOval(child: Image.network(team.logoUrl!, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield_outlined, color: b.primaryColor, size: 30))),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(team.name, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800, fontSize: 16)),
                  if (team.shortName?.isNotEmpty == true) Text(team.shortName!, style: TextStyle(color: b.mutedTextColor, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text('Ver equipa e plantel', style: TextStyle(color: b.primaryColor, fontSize: 11, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: b.mutedTextColor),
          ],
        ),
      ),
    );
  }

  Widget _message(String text, ClubBranding b) {
    return Padding(padding: const EdgeInsets.all(28), child: Center(child: Text(text, textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700))));
  }
}
