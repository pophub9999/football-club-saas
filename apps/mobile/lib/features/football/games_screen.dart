import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'football_repository.dart';

class GamesScreen extends StatefulWidget {
  const GamesScreen({super.key, required this.branding, required this.api, required this.accessToken});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;

  @override
  State<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends State<GamesScreen> {
  late final FootballRepository repository;
  List<FixtureSummary> fixtures = const [];
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
      final result = await repository.upcoming(widget.accessToken);
      if (mounted) setState(() => fixtures = result);
    } catch (exception) {
      if (mounted) setState(() => error = exception);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    return RefreshIndicator(
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 8),
            sliver: SliverToBoxAdapter(
              child: Text('Jogos', style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: b.textColor, fontWeight: FontWeight.w800)),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            sliver: SliverToBoxAdapter(child: Text('Próximos jogos do clube', style: TextStyle(color: b.mutedTextColor))),
          ),
          if (loading && fixtures.isEmpty)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
          else if (error != null && fixtures.isEmpty)
            SliverFillRemaining(child: _message('Não foi possível carregar os jogos.', 'Tentar novamente', _load))
          else if (fixtures.isEmpty)
            SliverFillRemaining(child: _message('Ainda não existem jogos disponíveis.', 'Atualizar', _load))
          else
            SliverList.builder(
              itemCount: fixtures.length,
              itemBuilder: (_, index) => Padding(
                padding: EdgeInsets.fromLTRB(20, index == 0 ? 0 : 8, 20, index == fixtures.length - 1 ? 24 : 0),
                child: _fixtureCard(fixtures[index], b),
              ),
            ),
        ],
      ),
    );
  }

  Widget _message(String text, String action, VoidCallback onPressed) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.sports_soccer_outlined, size: 48, color: widget.branding.mutedTextColor),
            const SizedBox(height: 14),
            Text(text, textAlign: TextAlign.center, style: TextStyle(color: widget.branding.textColor, fontWeight: FontWeight.w700)),
            const SizedBox(height: 14),
            OutlinedButton(onPressed: onPressed, child: Text(action)),
          ]),
        ),
      );

  Widget _fixtureCard(FixtureSummary fixture, ClubBranding b) {
    final date = fixture.kickoffAt;
    final dateLabel = '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}';
    final timeLabel = '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: b.primaryColor.withValues(alpha: .12))),
      child: Column(children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(fixture.competitionName ?? 'Jogo', style: TextStyle(color: b.primaryColor, fontWeight: FontWeight.w700, fontSize: 12)),
          Text('$dateLabel · $timeLabel', style: TextStyle(color: b.mutedTextColor, fontSize: 12)),
        ]),
        const SizedBox(height: 18),
        Row(children: [
          Expanded(child: _team(fixture.homeName, fixture.homeTeam['logoUrl'] as String?, b, Alignment.centerLeft)),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text('VS', style: TextStyle(color: b.mutedTextColor, fontWeight: FontWeight.w800))),
          Expanded(child: _team(fixture.awayName, fixture.awayTeam['logoUrl'] as String?, b, Alignment.centerRight)),
        ]),
        if (fixture.venueName != null) ...[
          const SizedBox(height: 14),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.location_on_outlined, size: 15, color: b.mutedTextColor), const SizedBox(width: 4), Text('${fixture.venueName}${fixture.venueCity == null ? '' : ' · ${fixture.venueCity}'}', style: TextStyle(color: b.mutedTextColor, fontSize: 12))]),
        ],
      ]),
    );
  }

  Widget _team(String name, String? logoUrl, ClubBranding b, Alignment alignment) => Column(crossAxisAlignment: alignment == Alignment.centerRight ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
        Container(width: 52, height: 52, decoration: BoxDecoration(color: b.backgroundColor, shape: BoxShape.circle), child: logoUrl == null ? Icon(Icons.shield_outlined, color: b.primaryColor) : ClipOval(child: Image.network(logoUrl, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield_outlined, color: b.primaryColor)))),
        const SizedBox(height: 8),
        Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: alignment == Alignment.centerRight ? TextAlign.right : TextAlign.left, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700, fontSize: 13)),
      ]);
}
