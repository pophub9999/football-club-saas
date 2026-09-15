import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'football_repository.dart';

class PlayerScreen extends StatefulWidget {
  const PlayerScreen({super.key, required this.branding, required this.api, required this.accessToken, required this.playerId});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  final String playerId;

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  late final FootballRepository repository;
  FootballPlayer? player;
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
      final result = await repository.player(widget.accessToken, widget.playerId);
      if (mounted) setState(() => player = result);
    } catch (exception) {
      if (mounted) setState(() => error = exception);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    Widget body;
    if (loading && player == null) {
      body = ListView(children: const [SizedBox(height: 280), Center(child: CircularProgressIndicator())]);
    } else if (error != null && player == null) {
      body = ListView(children: [_message(b)]);
    } else {
      final p = player!;
      body = ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 30),
        children: [
          _profileCard(b, p),
          const SizedBox(height: 12),
          _teamsCard(b, p),
          const SizedBox(height: 12),
          _statsCard(b, p),
        ],
      );
    }

    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(
        title: const Text('Jogador'),
        backgroundColor: b.surfaceColor,
        foregroundColor: b.textColor,
        elevation: 0,
      ),
      body: RefreshIndicator(onRefresh: _load, child: body),
    );
  }

  Widget _profileCard(ClubBranding b, FootballPlayer p) {
    final labels = <String>[];
    if (p.position != null) labels.add(p.position!);
    if (p.detailedPosition != null && p.detailedPosition != p.position) labels.add(p.detailedPosition!);
    if (p.nationality != null) labels.add(p.nationality!);

    return Card(
      color: b.surfaceColor,
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            CircleAvatar(
              radius: 54,
              backgroundColor: b.primaryColor.withValues(alpha: .10),
              backgroundImage: p.imageUrl == null ? null : NetworkImage(p.imageUrl!),
              child: p.imageUrl == null ? Icon(Icons.person_outline, size: 52, color: b.primaryColor) : null,
            ),
            const SizedBox(height: 14),
            Text(p.displayName ?? p.name, textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontSize: 22, fontWeight: FontWeight.w900)),
            if (labels.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(labels.join(' · '), textAlign: TextAlign.center, style: TextStyle(color: b.mutedTextColor, fontWeight: FontWeight.w600)),
            ],
            const SizedBox(height: 14),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: [
                if (p.height != null) _chip(b, '${p.height} cm'),
                if (p.weight != null) _chip(b, '${p.weight} kg'),
                if (p.birthDate != null) _chip(b, p.birthDate!),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _teamsCard(ClubBranding b, FootballPlayer p) {
    final names = p.teams.map(_teamName).whereType<String>().toSet().toList();
    if (names.isEmpty) return _emptyCard(b, 'Equipas', 'Sem histórico de equipas disponível.');

    return Card(
      color: b.surfaceColor,
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _title(b, Icons.shield_outlined, 'Equipas'),
            const SizedBox(height: 8),
            for (final name in names)
              ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                leading: Icon(Icons.shield_outlined, color: b.primaryColor),
                title: Text(name, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _statsCard(ClubBranding b, FootballPlayer p) {
    if (p.statistics.isEmpty) return _emptyCard(b, 'Estatísticas', 'Sem estatísticas disponíveis para este jogador.');

    return Card(
      color: b.surfaceColor,
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _title(b, Icons.bar_chart_outlined, 'Estatísticas'),
            const SizedBox(height: 10),
            for (var i = 0; i < p.statistics.length; i++) _statBlock(b, i + 1, p.statistics[i]),
          ],
        ),
      ),
    );
  }

  Widget _statBlock(ClubBranding b, int index, Map<String, dynamic> stat) {
    final team = _teamName(stat['team']);
    final season = _seasonName(stat['season']);
    final league = _leagueName(stat['season']);
    final details = <Map<String, dynamic>>[];
    final rawDetails = stat['details'];
    if (rawDetails is List) {
      for (final item in rawDetails) {
        if (item is Map) details.add(Map<String, dynamic>.from(item));
      }
    }

    final titleParts = <String>[if (team != null) team, if (league != null) league, if (season != null) season];
    final visible = details.where((item) => item['value'] != null).toList();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(titleParts.isEmpty ? 'Registo $index' : titleParts.join(' · '), style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)),
          const SizedBox(height: 7),
          if (visible.isEmpty)
            Text('Sem métricas detalhadas disponíveis.', style: TextStyle(color: b.mutedTextColor, fontSize: 12))
          else
            Wrap(
              spacing: 7,
              runSpacing: 7,
              children: [for (final item in visible) _metricChip(b, _detailName(item), item['value'].toString())],
            ),
        ],
      ),
    );
  }

  Widget _metricChip(ClubBranding b, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(color: b.backgroundColor, borderRadius: BorderRadius.circular(12)),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(text: '$label\n', style: TextStyle(color: b.mutedTextColor, fontSize: 10, fontWeight: FontWeight.w600)),
            TextSpan(text: value, style: TextStyle(color: b.textColor, fontSize: 13, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }

  Widget _chip(ClubBranding b, String text) {
    return Chip(
      label: Text(text, style: TextStyle(color: b.textColor, fontSize: 11, fontWeight: FontWeight.w700)),
      backgroundColor: b.backgroundColor,
      side: BorderSide.none,
    );
  }

  Widget _title(ClubBranding b, IconData icon, String title) {
    return Row(children: [Icon(icon, color: b.primaryColor), const SizedBox(width: 9), Text(title, style: TextStyle(color: b.textColor, fontSize: 17, fontWeight: FontWeight.w900))]);
  }

  Widget _emptyCard(ClubBranding b, String title, String text) {
    return Card(
      color: b.surfaceColor,
      margin: EdgeInsets.zero,
      child: ListTile(
        leading: Icon(Icons.bar_chart_outlined, color: b.primaryColor),
        title: Text(title, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)),
        subtitle: Text(text, style: TextStyle(color: b.mutedTextColor)),
      ),
    );
  }

  Widget _message(ClubBranding b) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        children: [
          const SizedBox(height: 220),
          Icon(Icons.person_outline, size: 48, color: b.mutedTextColor),
          const SizedBox(height: 14),
          Text('Não foi possível carregar o perfil do jogador.', textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
        ],
      ),
    );
  }

  String? _teamName(dynamic value) {
    if (value is! Map) return null;
    final map = Map<String, dynamic>.from(value);
    final nested = map['team'];
    final team = nested is Map ? Map<String, dynamic>.from(nested) : map;
    final name = team['name'] ?? team['short_name'];
    return name?.toString();
  }

  String? _seasonName(dynamic value) {
    if (value is! Map) return null;
    return (value['name'])?.toString();
  }

  String? _leagueName(dynamic value) {
    if (value is! Map) return null;
    final league = value['league'];
    if (league is Map) return (league['name'] ?? league['short_code'])?.toString();
    return null;
  }

  String _detailName(Map<String, dynamic> item) {
    final type = item['type'];
    if (type is Map) return (type['name'] ?? type['code'])?.toString() ?? 'Métrica';
    return item['name']?.toString() ?? 'Métrica';
  }
}
