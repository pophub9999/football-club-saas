import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'football_repository.dart';

class MatchCentreScreen extends StatefulWidget {
  const MatchCentreScreen({
    super.key,
    required this.branding,
    required this.api,
    required this.accessToken,
    required this.fixture,
  });

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  final FixtureSummary fixture;

  @override
  State<MatchCentreScreen> createState() => _MatchCentreScreenState();
}

class _MatchCentreScreenState extends State<MatchCentreScreen> {
  late final FootballRepository repository;
  Map<String, dynamic>? detail;
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
      final result = await repository.fixture(widget.accessToken, widget.fixture.id);
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
    final fixture = detail == null ? widget.fixture : FixtureSummary.fromJson(detail!);
    final competition = (detail?['competition'] as Map?)?['name'] as String? ?? fixture.competitionName;
    final status = (detail?['status'] as String?) ?? fixture.status;
    final homeScore = detail?['homeScore'];
    final awayScore = detail?['awayScore'];

    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(
        backgroundColor: b.backgroundColor,
        foregroundColor: b.textColor,
        title: const Text('Match Centre'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: [
            if (loading && detail == null) const LinearProgressIndicator(),
            if (error != null) _errorCard(b),
            _headerCard(fixture, competition, status, homeScore, awayScore, b),
            const SizedBox(height: 14),
            _sectionCard(
              b,
              title: 'Informação do jogo',
              icon: Icons.info_outline,
              children: [
                _infoRow(Icons.calendar_today_outlined, 'Data', _dateTime(fixture.kickoffAt), b),
                _infoRow(Icons.location_on_outlined, 'Estádio', fixture.venueName ?? 'Por confirmar', b),
                if (fixture.venueCity != null) _infoRow(Icons.place_outlined, 'Localidade', fixture.venueCity!, b),
                _infoRow(Icons.sports_soccer_outlined, 'Estado', _statusLabel(status), b),
              ],
            ),
            const SizedBox(height: 14),
            _sectionCard(
              b,
              title: 'Eventos e estatísticas',
              icon: Icons.timeline_outlined,
              children: [
                _comingSoon('Os eventos, escalações e estatísticas serão apresentados aqui quando o fornecedor de dados do clube os disponibilizar.', b),
              ],
            ),
            const SizedBox(height: 14),
            _sectionCard(
              b,
              title: 'Bilhetes',
              icon: Icons.confirmation_number_outlined,
              children: [
                _comingSoon('A disponibilidade e os bilhetes deste jogo serão ligados ao módulo de bilhética.', b),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _headerCard(FixtureSummary fixture, String? competition, String status, dynamic homeScore, dynamic awayScore, ClubBranding b) {
    final hasScore = homeScore is num && awayScore is num;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: b.surfaceColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: b.primaryColor.withValues(alpha: .16)),
      ),
      child: Column(children: [
        Text(competition ?? 'Jogo', style: TextStyle(color: b.primaryColor, fontWeight: FontWeight.w800, fontSize: 13)),
        const SizedBox(height: 6),
        Text(_dateTime(fixture.kickoffAt), style: TextStyle(color: b.mutedTextColor, fontSize: 12)),
        const SizedBox(height: 22),
        Row(children: [
          Expanded(child: _team(fixture.homeName, fixture.homeTeam['logoUrl'] as String?, b, false)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: hasScore
                ? Text('${homeScore.toInt()} : ${awayScore.toInt()}', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w900, fontSize: 24))
                : Text('VS', style: TextStyle(color: b.mutedTextColor, fontWeight: FontWeight.w900, fontSize: 14)),
          ),
          Expanded(child: _team(fixture.awayName, fixture.awayTeam['logoUrl'] as String?, b, true)),
        ]),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(color: b.backgroundColor, borderRadius: BorderRadius.circular(30)),
          child: Text(_statusLabel(status), style: TextStyle(color: b.textColor, fontSize: 12, fontWeight: FontWeight.w700)),
        ),
      ]),
    );
  }

  Widget _team(String name, String? logoUrl, ClubBranding b, bool right) => Column(
        crossAxisAlignment: right ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Align(
            alignment: right ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              width: 62,
              height: 62,
              decoration: BoxDecoration(color: b.backgroundColor, shape: BoxShape.circle),
              child: logoUrl == null
                  ? Icon(Icons.shield_outlined, color: b.primaryColor, size: 30)
                  : ClipOval(child: Image.network(logoUrl, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield_outlined, color: b.primaryColor, size: 30))),
            ),
          ),
          const SizedBox(height: 8),
          Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: right ? TextAlign.right : TextAlign.left, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800, fontSize: 13)),
        ],
      );

  Widget _sectionCard(ClubBranding b, {required String title, required IconData icon, required List<Widget> children}) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(20)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(icon, color: b.primaryColor, size: 20), const SizedBox(width: 8), Text(title, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800, fontSize: 16))]),
          const SizedBox(height: 14),
          ...children,
        ]),
      );

  Widget _infoRow(IconData icon, String label, String value, ClubBranding b) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: b.mutedTextColor, size: 18),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: TextStyle(color: b.mutedTextColor, fontSize: 12))),
          const SizedBox(width: 10),
          Flexible(child: Text(value, textAlign: TextAlign.right, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700, fontSize: 12))),
        ]),
      );

  Widget _comingSoon(String text, ClubBranding b) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: b.backgroundColor, borderRadius: BorderRadius.circular(14)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(Icons.sync_outlined, color: b.mutedTextColor, size: 18),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: TextStyle(color: b.mutedTextColor, fontSize: 12, height: 1.4))),
        ]),
      );

  Widget _errorCard(ClubBranding b) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(16)),
          child: Row(children: [Icon(Icons.cloud_off_outlined, color: b.mutedTextColor), const SizedBox(width: 10), Expanded(child: Text('Não foi possível atualizar os dados. Os últimos dados disponíveis continuam visíveis.', style: TextStyle(color: b.mutedTextColor, fontSize: 12)))]),
        ),
      );

  String _dateTime(DateTime value) => '${value.day.toString().padLeft(2, '0')}/${value.month.toString().padLeft(2, '0')}/${value.year} · ${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}';

  String _statusLabel(String value) {
    switch (value.toUpperCase()) {
      case 'LIVE': return 'A decorrer';
      case 'FINISHED': return 'Finalizado';
      case 'POSTPONED': return 'Adiado';
      case 'CANCELLED': return 'Cancelado';
      default: return 'Agendado';
    }
  }
}
