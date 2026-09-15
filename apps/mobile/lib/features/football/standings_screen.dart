import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'football_repository.dart';

class StandingsScreen extends StatefulWidget {
  const StandingsScreen({super.key, required this.branding, required this.api, required this.accessToken});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;

  @override
  State<StandingsScreen> createState() => _StandingsScreenState();
}

class _StandingsScreenState extends State<StandingsScreen> {
  late final FootballRepository repository;
  FootballStandings? data;
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
      final result = await repository.currentStandings(widget.accessToken);
      if (mounted) setState(() => data = result);
    } catch (exception) {
      if (mounted) setState(() => error = exception);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(
        title: const Text('Classificação'),
        backgroundColor: b.backgroundColor,
        foregroundColor: b.textColor,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: loading && data == null
            ? const ListView(children: [SizedBox(height: 280), Center(child: CircularProgressIndicator())])
            : error != null && data == null
                ? ListView(children: [_message(b, 'Não foi possível carregar a classificação.', 'Tentar novamente', _load)])
                : data!.rows.isEmpty
                    ? ListView(children: [_message(b, 'Ainda não existe classificação disponível.', 'Atualizar', _load)])
                    : ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 28), children: [
                        _header(b),
                        const SizedBox(height: 12),
                        _table(b, data!.rows),
                      ]),
      ),
    );
  }

  Widget _header(ClubBranding b) => Container(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
        decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(18)),
        child: Row(children: [
          Icon(Icons.emoji_events_outlined, color: b.accentColor),
          const SizedBox(width: 10),
          Expanded(child: Text('Classificação da época', style: TextStyle(color: b.textColor, fontSize: 16, fontWeight: FontWeight.w800))),
          Text(data!.seasonId, style: TextStyle(color: b.mutedTextColor, fontSize: 11)),
        ]),
      );

  Widget _table(ClubBranding b, List<FootballStanding> rows) => Container(
        decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(18)),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          _tableHeader(b),
          ...rows.map((row) => _row(b, row)),
        ]),
      );

  Widget _tableHeader(ClubBranding b) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        color: b.primaryColor.withValues(alpha: .10),
        child: Row(children: [
          SizedBox(width: 30, child: Text('#', style: _headerStyle(b))),
          const Expanded(child: SizedBox()),
          SizedBox(width: 34, child: Text('J', textAlign: TextAlign.center, style: _headerStyle(b))),
          SizedBox(width: 34, child: Text('V', textAlign: TextAlign.center, style: _headerStyle(b))),
          SizedBox(width: 34, child: Text('E', textAlign: TextAlign.center, style: _headerStyle(b))),
          SizedBox(width: 34, child: Text('D', textAlign: TextAlign.center, style: _headerStyle(b))),
          SizedBox(width: 42, child: Text('DG', textAlign: TextAlign.center, style: _headerStyle(b))),
          SizedBox(width: 40, child: Text('PTS', textAlign: TextAlign.center, style: _headerStyle(b))),
        ]),
      );

  TextStyle _headerStyle(ClubBranding b) => TextStyle(color: b.mutedTextColor, fontSize: 10, fontWeight: FontWeight.w800);

  Widget _row(ClubBranding b, FootballStanding row) {
    final gd = row.goalDifference == null ? '—' : (row.goalDifference! > 0 ? '+${row.goalDifference}' : '${row.goalDifference}');
    final isLeader = row.position == 1;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(border: Border(top: BorderSide(color: b.primaryColor.withValues(alpha: .07)))),
      child: Row(children: [
        SizedBox(width: 30, child: Row(children: [Text('${row.position}', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800, fontSize: 12)), const SizedBox(width: 3), Text(row.formLabel, style: TextStyle(color: row.result == 'up' ? b.primaryColor : b.mutedTextColor, fontSize: 11))])),
        Expanded(child: Row(children: [
          Container(width: 30, height: 30, decoration: BoxDecoration(color: b.backgroundColor, shape: BoxShape.circle), child: row.teamLogoUrl == null ? Icon(Icons.shield_outlined, size: 17, color: b.primaryColor) : ClipOval(child: Image.network(row.teamLogoUrl!, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield_outlined, size: 17, color: b.primaryColor)))),
          const SizedBox(width: 8),
          Expanded(child: Text(row.teamShortName?.trim().isNotEmpty == true ? row.teamShortName! : row.teamName, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: b.textColor, fontSize: 12, fontWeight: isLeader ? FontWeight.w900 : FontWeight.w600))),
        ])),
        _cell(b, row.played),
        _cell(b, row.won),
        _cell(b, row.drawn),
        _cell(b, row.lost),
        SizedBox(width: 42, child: Text(gd, textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontSize: 11))),
        SizedBox(width: 40, child: Text('${row.points}', textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontSize: 12, fontWeight: FontWeight.w900))),
      ]),
    );
  }

  Widget _cell(ClubBranding b, int? value) => SizedBox(width: 34, child: Text(value?.toString() ?? '—', textAlign: TextAlign.center, style: TextStyle(color: b.mutedTextColor, fontSize: 11)));

  Widget _message(ClubBranding b, String text, String action, VoidCallback onPressed) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SizedBox(height: 220),
          Icon(Icons.emoji_events_outlined, size: 48, color: b.mutedTextColor),
          const SizedBox(height: 14),
          Text(text, textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          OutlinedButton(onPressed: onPressed, child: Text(action)),
        ]),
      );
}
