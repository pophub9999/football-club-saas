import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../tickets/tickets_screen.dart';
import 'football_repository.dart';

class MatchdayScreen extends StatefulWidget {
  const MatchdayScreen({super.key, required this.branding, required this.api, required this.accessToken, required this.fixture});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  final FixtureSummary fixture;

  @override
  State<MatchdayScreen> createState() => _MatchdayScreenState();
}

class _MatchdayScreenState extends State<MatchdayScreen> {
  late final FootballRepository repository;
  FixtureDetail? detail;
  Object? error;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    repository = FootballRepository(widget.api);
    _load();
  }

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final result = await repository.detail(widget.accessToken, widget.fixture.id);
      if (mounted) setState(() => detail = result);
    } catch (exception) {
      if (mounted) setState(() => error = exception);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    final fixture = detail?.fixture ?? widget.fixture;
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(title: const Text('Match Centre'), backgroundColor: b.surfaceColor, foregroundColor: b.textColor),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          children: [
            _hero(fixture, b),
            const SizedBox(height: 16),
            if (loading && detail == null) const Padding(padding: EdgeInsets.all(30), child: Center(child: CircularProgressIndicator()))
            else if (error != null && detail == null) _errorCard(b)
            else ...[
              _dataSection('Eventos', detail?.events ?? const [], Icons.timeline, b),
              _dataSection('Equipas', detail?.lineups ?? const [], Icons.groups_outlined, b),
              _dataSection('Estatísticas', detail?.stats ?? const [], Icons.bar_chart_outlined, b),
              const SizedBox(height: 6),
              Card(color: b.surfaceColor, margin: EdgeInsets.zero, child: ListTile(
                leading: CircleAvatar(backgroundColor: b.primaryColor.withValues(alpha: .14), child: Icon(Icons.confirmation_number_outlined, color: b.primaryColor)),
                title: Text('Os meus bilhetes', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)),
                subtitle: Text('Abrir bilhetes e QR de entrada', style: TextStyle(color: b.mutedTextColor)),
                trailing: Icon(Icons.chevron_right, color: b.mutedTextColor),
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => TicketsScreen(branding: b, api: widget.api, accessToken: widget.accessToken))),
              )),
              const SizedBox(height: 10),
              _infoCard(Icons.login_outlined, 'Entradas', 'Informação de portas e acessos será configurada pelo clube.', b),
              const SizedBox(height: 10),
              _infoCard(Icons.local_parking_outlined, 'Estacionamento', 'Parques, acessos e recomendações serão configurados pelo clube.', b),
              const SizedBox(height: 10),
              _infoCard(Icons.directions_outlined, 'Como chegar', fixture.venueName == null ? 'Localização ainda não definida.' : '${fixture.venueName}${fixture.venueCity == null ? '' : ' · ${fixture.venueCity}'}', b),
            ],
          ],
        ),
      ),
    );
  }

  Widget _hero(FixtureSummary f, ClubBranding b) {
    final d = f.kickoffAt;
    final date = '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    final time = '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    final score = f.homeScore != null && f.awayScore != null ? '${f.homeScore}  -  ${f.awayScore}' : 'VS';
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(gradient: LinearGradient(colors: [b.primaryColor, b.secondaryColor]), borderRadius: BorderRadius.circular(26)),
      child: Column(children: [
        Text(f.competitionName ?? 'Jogo', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: _team(f.homeName, f.homeTeam['logoUrl'] as String?)),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 10), child: Text(score, style: const TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w900))),
          Expanded(child: _team(f.awayName, f.awayTeam['logoUrl'] as String?, right: true)),
        ]),
        const SizedBox(height: 16),
        Text(f.status, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text('$date · $time', style: const TextStyle(color: Colors.white70)),
        if (f.venueName != null) ...[const SizedBox(height: 5), Text('${f.venueName}${f.venueCity == null ? '' : ' · ${f.venueCity}'}', style: const TextStyle(color: Colors.white70))],
      ]),
    );
  }

  Widget _team(String name, String? logoUrl, {bool right = false}) => Column(crossAxisAlignment: right ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
    Container(width: 58, height: 58, decoration: BoxDecoration(color: Colors.white.withValues(alpha: .14), shape: BoxShape.circle), child: logoUrl == null ? const Icon(Icons.shield_outlined, color: Colors.white) : ClipOval(child: Image.network(logoUrl, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.shield_outlined, color: Colors.white)))),
    const SizedBox(height: 8),
    Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: right ? TextAlign.right : TextAlign.left, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
  ]);

  Widget _dataSection(String title, List<Map<String, dynamic>> items, IconData icon, ClubBranding b) {
    if (items.isEmpty) return Card(color: b.surfaceColor, margin: const EdgeInsets.only(bottom: 10), child: ListTile(leading: Icon(icon, color: b.primaryColor), title: Text(title, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)), subtitle: Text('Dados ainda não disponibilizados pelo fornecedor.', style: TextStyle(color: b.mutedTextColor))));
    return Card(color: b.surfaceColor, margin: const EdgeInsets.only(bottom: 10), child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: TextStyle(color: b.textColor, fontSize: 17, fontWeight: FontWeight.w800)), const SizedBox(height: 8), ...items.map((item) => ListTile(contentPadding: EdgeInsets.zero, leading: Icon(icon, color: b.primaryColor), title: Text('${item['name'] ?? item['type'] ?? item['player'] ?? 'Informação'}', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), subtitle: Text('${item['minute'] ?? item['team'] ?? item['label'] ?? ''}', style: TextStyle(color: b.mutedTextColor))))])));
  }

  Widget _infoCard(IconData icon, String title, String subtitle, ClubBranding b) => Card(color: b.surfaceColor, margin: EdgeInsets.zero, child: ListTile(leading: Icon(icon, color: b.primaryColor), title: Text(title, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)), subtitle: Text(subtitle, style: TextStyle(color: b.mutedTextColor))));
  Widget _errorCard(ClubBranding b) => Card(color: b.surfaceColor, child: ListTile(leading: Icon(Icons.error_outline, color: b.primaryColor), title: Text('Não foi possível carregar o jogo.', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), trailing: TextButton(onPressed: _load, child: const Text('Tentar'))));
}
