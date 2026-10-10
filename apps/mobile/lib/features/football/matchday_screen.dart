import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../tickets/tickets_screen.dart';
import 'football_repository.dart';
import 'player_screen.dart';

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
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    repository = FootballRepository(widget.api);
    _load();
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_isLive && mounted) _load(silent: true);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  bool get _isLive {
    final status = (detail?.fixture.status ?? widget.fixture.status).toUpperCase();
    return status == 'LIVE' || status == '1H' || status == '2H' || status == 'HT' || status == 'ET' || status == 'PEN';
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() { loading = true; error = null; });
    try {
      final result = await repository.detail(widget.accessToken, widget.fixture.id);
      if (mounted) setState(() { detail = result; error = null; });
    } catch (exception) {
      if (mounted && !silent) setState(() => error = exception);
    } finally {
      if (mounted && !silent) setState(() => loading = false);
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
            if (loading && detail == null)
              const Padding(padding: EdgeInsets.all(30), child: Center(child: CircularProgressIndicator()))
            else if (error != null && detail == null)
              _errorCard(b)
            else ...[
              if (_isLive) _liveIndicator(b),
              _eventsSection(detail?.events ?? const [], b),
              _lineupsSection(detail?.lineups ?? const [], fixture, b),
              _statsSection(detail?.stats ?? const [], fixture, b),
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

  Widget _liveIndicator(ClubBranding b) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(color: b.primaryColor.withValues(alpha: .10), borderRadius: BorderRadius.circular(14)),
    child: Row(children: [Icon(Icons.circle, size: 10, color: b.primaryColor), const SizedBox(width: 8), Text('Em direto · atualização automática a cada 30 s', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700))]),
  );

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

  Widget _eventsSection(List<Map<String, dynamic>> items, ClubBranding b) {
    if (items.isEmpty) return _emptySection('Eventos', Icons.timeline, b);
    return _cardSection('Eventos', Icons.timeline, b, items.map((item) {
      final minute = _eventMinute(item);
      final type = _string(item['type']?['name']) ?? _string(item['type_name']) ?? _string(item['type']) ?? 'Evento';
      final player = _playerName(item['player']);
      final related = _playerName(item['related_player']);
      final detailText = [if (player != null) player, if (related != null) '↔ $related', if (_string(item['result']) != null) _string(item['result'])!].join(' · ');
      return ListTile(
        contentPadding: EdgeInsets.zero,
        leading: SizedBox(width: 48, child: Text(minute == null ? '—' : '$minute\'', textAlign: TextAlign.center, style: TextStyle(color: b.primaryColor, fontWeight: FontWeight.w900))),
        title: Text(type, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)),
        subtitle: detailText.isEmpty ? null : Text(detailText, style: TextStyle(color: b.mutedTextColor)),
      );
    }).toList());
  }

  Widget _lineupsSection(List<Map<String, dynamic>> items, FixtureSummary fixture, ClubBranding b) {
    if (items.isEmpty) return _emptySection('Equipas', Icons.groups_outlined, b);
    final homeId = fixture.homeTeam['externalId']?.toString();
    final awayId = fixture.awayTeam['externalId']?.toString();
    final home = items.where((item) => _teamId(item) == homeId).toList();
    final away = items.where((item) => _teamId(item) == awayId).toList();
    final unknown = items.where((item) => _teamId(item) != homeId && _teamId(item) != awayId).toList();
    return Card(color: b.surfaceColor, margin: const EdgeInsets.only(bottom: 10), child: Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 8), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _sectionTitle('Equipas', Icons.groups_outlined, b),
      if (home.isNotEmpty) _lineupTeam(fixture.homeName, home, b),
      if (away.isNotEmpty) _lineupTeam(fixture.awayName, away, b),
      if (unknown.isNotEmpty) _lineupTeam('Jogadores', unknown, b),
    ])));
  }

  Widget _lineupTeam(String team, List<Map<String, dynamic>> players, ClubBranding b) {
    final starters = players.where((p) => _isStarter(p)).toList();
    final subs = players.where((p) => !_isStarter(p)).toList();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SizedBox(height: 8),
      Text(team, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w900)),
      if (starters.isNotEmpty) ...[_lineupLabel('Titulares', b), ...starters.map((p) => _playerTile(p, b))],
      if (subs.isNotEmpty) ...[_lineupLabel('Suplentes', b), ...subs.map((p) => _playerTile(p, b))],
    ]);
  }

  Widget _playerTile(Map<String, dynamic> item, ClubBranding b) {
    final player = _playerName(item['player']) ?? _string(item['player_name']) ?? 'Jogador';
    final playerId = item['player'] is Map ? item['player']['id']?.toString() : item['player_id']?.toString();
    final jersey = item['jersey_number']?.toString() ?? item['jersey']?.toString();
    final position = _string(item['formation_position']) ?? _string(item['position']);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      leading: CircleAvatar(radius: 18, backgroundColor: b.primaryColor.withValues(alpha: .12), child: Text(jersey ?? '•', style: TextStyle(color: b.primaryColor, fontWeight: FontWeight.w800))),
      title: Text(player, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)),
      subtitle: position == null ? null : Text(position, style: TextStyle(color: b.mutedTextColor)),
      trailing: playerId == null ? null : Icon(Icons.chevron_right, color: b.mutedTextColor),
      onTap: playerId == null ? null : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => PlayerScreen(branding: b, api: widget.api, accessToken: widget.accessToken, playerId: playerId))),
    );
  }

  Widget _statsSection(List<Map<String, dynamic>> items, FixtureSummary fixture, ClubBranding b) {
    if (items.isEmpty) return _emptySection('Estatísticas', Icons.bar_chart_outlined, b);
    final homeId = fixture.homeTeam['externalId']?.toString();
    final awayId = fixture.awayTeam['externalId']?.toString();
    final grouped = <String, Map<String, dynamic>>{};
    for (final item in items) {
      final name = _statName(item);
      final team = _teamId(item);
      final key = '$name|${team ?? 'unknown'}';
      grouped[key] = item;
    }
    final names = grouped.values.map(_statName).whereType<String>().toSet().toList();
    return Card(color: b.surfaceColor, margin: const EdgeInsets.only(bottom: 10), child: Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 12), child: Column(children: [
      _sectionTitle('Estatísticas', Icons.bar_chart_outlined, b),
      ...names.map((name) {
        final home = _statValue(grouped['$name|$homeId']);
        final away = _statValue(grouped['$name|$awayId']);
        return Padding(padding: const EdgeInsets.symmetric(vertical: 7), child: Row(children: [
          Expanded(child: Text(home ?? '—', textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800))),
          Expanded(flex: 2, child: Text(name, textAlign: TextAlign.center, style: TextStyle(color: b.mutedTextColor, fontSize: 12, fontWeight: FontWeight.w700))),
          Expanded(child: Text(away ?? '—', textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800))),
        ]));
      }),
    ])));
  }

  Widget _cardSection(String title, IconData icon, ClubBranding b, List<Widget> children) => Card(color: b.surfaceColor, margin: const EdgeInsets.only(bottom: 10), child: Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 8), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_sectionTitle(title, icon, b), ...children])));
  Widget _sectionTitle(String title, IconData icon, ClubBranding b) => Row(children: [Icon(icon, color: b.primaryColor), const SizedBox(width: 10), Text(title, style: TextStyle(color: b.textColor, fontSize: 17, fontWeight: FontWeight.w900))]);
  Widget _lineupLabel(String title, ClubBranding b) => Padding(padding: const EdgeInsets.only(top: 8, bottom: 2), child: Text(title, style: TextStyle(color: b.mutedTextColor, fontSize: 12, fontWeight: FontWeight.w800)));
  Widget _emptySection(String title, IconData icon, ClubBranding b) => Card(color: b.surfaceColor, margin: const EdgeInsets.only(bottom: 10), child: ListTile(leading: Icon(icon, color: b.primaryColor), title: Text(title, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)), subtitle: Text('Dados ainda não disponibilizados pelo fornecedor.', style: TextStyle(color: b.mutedTextColor))));
  Widget _infoCard(IconData icon, String title, String subtitle, ClubBranding b) => Card(color: b.surfaceColor, margin: EdgeInsets.zero, child: ListTile(leading: Icon(icon, color: b.primaryColor), title: Text(title, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)), subtitle: Text(subtitle, style: TextStyle(color: b.mutedTextColor))));
  Widget _errorCard(ClubBranding b) => Card(color: b.surfaceColor, child: ListTile(leading: Icon(Icons.error_outline, color: b.primaryColor), title: Text('Não foi possível carregar o jogo.', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), trailing: TextButton(onPressed: _load, child: const Text('Tentar'))));

  String? _eventMinute(Map<String, dynamic> item) {
    final minute = item['minute'] ?? item['time']?['minute'];
    final extra = item['extra_minute'] ?? item['time']?['extra_minute'];
    if (minute == null) return null;
    return extra == null ? minute.toString() : '${minute}+${extra}';
  }

  String? _teamId(Map<String, dynamic> item) => item['participant_id']?.toString() ?? item['team_id']?.toString();
  String? _statName(Map<String, dynamic> item) => _string(item['type']?['name']) ?? _string(item['type_name']) ?? _string(item['name']);
  String? _statValue(Map<String, dynamic>? item) {
    if (item == null) return null;
    final value = item['data']?['value'] ?? item['value'] ?? item['result'];
    return value?.toString();
  }
  String? _playerName(dynamic player) => player is Map ? _string(player['display_name']) ?? _string(player['name']) ?? _string(player['common_name']) : player?.toString();
  String? _string(dynamic value) => value == null || value.toString().trim().isEmpty ? null : value.toString();
  bool _isStarter(Map<String, dynamic> item) => item['starter'] == true || item['formation_field'] != null || item['formation_position'] != null;
}
