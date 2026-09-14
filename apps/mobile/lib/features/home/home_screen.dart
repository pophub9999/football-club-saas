import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../auth/auth_repository.dart';
import '../clubs/club_screen.dart';
import '../football/football_repository.dart';
import '../football/games_screen.dart';
import '../settings/settings_screen.dart';
import '../wallet/wallet_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.branding, required this.api, required this.accessToken, required this.onLogout});
  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  final VoidCallback onLogout;
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HomeData? data;
  Map<String, dynamic>? nextMatch;
  Object? error;
  int selectedIndex = 0;
  ClubBranding get b => data?.branding ?? widget.branding;
  String get greetingName => (data?.member['firstName'] as String?)?.trim().isNotEmpty == true ? (data!.member['firstName'] as String).trim() : 'Adepto';

  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final home = await AuthRepository(widget.api).loadHome(widget.accessToken);
      Map<String, dynamic>? match;
      final fixtures = await FootballRepository(widget.api).upcoming(widget.accessToken, limit: 1);
      if (fixtures.isNotEmpty) { final f = fixtures.first; match = {'id': f.id, 'kickoffAt': f.kickoffAt.toUtc().toIso8601String(), 'status': f.status, 'venueName': f.venueName, 'venueCity': f.venueCity, 'competition': {'name': f.competitionName}, 'homeTeam': f.homeTeam, 'awayTeam': f.awayTeam}; }
      if (mounted) setState(() { data = home; nextMatch = match; error = null; });
    } catch (exception) { if (mounted) setState(() => error = exception); }
  }

  @override Widget build(BuildContext context) => Scaffold(
    backgroundColor: b.backgroundColor,
    body: SafeArea(child: _content(context)),
    bottomNavigationBar: NavigationBar(backgroundColor: b.surfaceColor, indicatorColor: b.primaryColor.withValues(alpha: .18), selectedIndex: selectedIndex, onDestinationSelected: (index) => setState(() => selectedIndex = index), destinations: const [
      NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
      NavigationDestination(icon: Icon(Icons.sports_soccer_outlined), selectedIcon: Icon(Icons.sports_soccer), label: 'Jogos'),
      NavigationDestination(icon: Icon(Icons.shield_outlined), selectedIcon: Icon(Icons.shield), label: 'Clube'),
      NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), selectedIcon: Icon(Icons.account_balance_wallet), label: 'Carteira'),
      NavigationDestination(icon: Icon(Icons.more_horiz), label: 'Mais'),
    ]),
  );

  Widget _content(BuildContext context) {
    if (selectedIndex == 1) return GamesScreen(branding: b, api: widget.api, accessToken: widget.accessToken);
    if (selectedIndex == 2) return ClubScreen(branding: b, api: widget.api, accessToken: widget.accessToken);
    if (selectedIndex == 3) return WalletScreen(branding: b, api: widget.api, accessToken: widget.accessToken);
    if (selectedIndex == 4) return SettingsScreen(branding: b, api: widget.api, accessToken: widget.accessToken, onLogout: widget.onLogout);
    if (data == null) {
      if (error != null) return Center(child: Padding(padding: const EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.cloud_off_outlined, size: 48, color: b.mutedTextColor), const SizedBox(height: 14), Text('Não foi possível carregar a tua área de sócio.', textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), const SizedBox(height: 14), OutlinedButton(onPressed: _load, child: const Text('Tentar novamente'))])));
      return Center(child: CircularProgressIndicator(color: b.primaryColor));
    }
    return RefreshIndicator(onRefresh: _load, child: CustomScrollView(physics: const AlwaysScrollableScrollPhysics(), slivers: [
      SliverPadding(padding: const EdgeInsets.fromLTRB(20, 18, 20, 0), sliver: SliverToBoxAdapter(child: _header(context))),
      SliverPadding(padding: const EdgeInsets.fromLTRB(20, 22, 20, 0), sliver: SliverToBoxAdapter(child: _nextMatch())),
      SliverPadding(padding: const EdgeInsets.fromLTRB(20, 24, 20, 0), sliver: SliverToBoxAdapter(child: _sectionTitle(context, 'A tua quota'))),
      SliverPadding(padding: const EdgeInsets.fromLTRB(20, 10, 20, 0), sliver: SliverToBoxAdapter(child: _duesCard())),
      SliverPadding(padding: const EdgeInsets.fromLTRB(20, 24, 20, 0), sliver: SliverToBoxAdapter(child: _sectionTitle(context, 'Notícias'))),
      SliverPadding(padding: const EdgeInsets.fromLTRB(20, 10, 20, 24), sliver: SliverToBoxAdapter(child: _newsRow())),
    ]));
  }

  Widget _header(BuildContext context) => Row(children: [Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Olá, $greetingName', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: b.textColor, fontWeight: FontWeight.w800)), const SizedBox(height: 4), Text('Sócio nº ${data!.member['memberNumber']}', style: TextStyle(color: b.mutedTextColor, fontSize: 13))])), _logo(size: 46)]);
  Widget _logo({double size = 56}) { final url = b.logoDarkUrl ?? b.logoUrl; return Container(width: size, height: size, padding: const EdgeInsets.all(7), decoration: BoxDecoration(color: b.surfaceColor, shape: BoxShape.circle), child: url == null ? Icon(Icons.shield, color: b.primaryColor, size: size * .55) : Image.network(url, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield, color: b.primaryColor))); }
  Widget _nextMatch() { final match = nextMatch; if (match == null) return Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(gradient: LinearGradient(colors: [b.secondaryColor, b.primaryColor]), borderRadius: BorderRadius.circular(24)), child: const Center(child: Text('Ainda não existem próximos jogos', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)))); final home = Map<String, dynamic>.from(match['homeTeam'] as Map); final away = Map<String, dynamic>.from(match['awayTeam'] as Map); final kickoff = DateTime.parse(match['kickoffAt'] as String).toLocal(); final when = '${kickoff.day.toString().padLeft(2, '0')}/${kickoff.month.toString().padLeft(2, '0')} · ${kickoff.hour.toString().padLeft(2, '0')}:${kickoff.minute.toString().padLeft(2, '0')}'; return Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(gradient: LinearGradient(colors: [b.secondaryColor, b.primaryColor]), borderRadius: BorderRadius.circular(24)), child: Column(children: [Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('PRÓXIMO JOGO', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700, fontSize: 12)), Text(when, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12))]), const SizedBox(height: 22), Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [_team(_teamName(home), home['logoUrl'] as String?), const Text('VS', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.w800)), _team(_teamName(away), away['logoUrl'] as String?)]), if (match['venueName'] != null) ...[const SizedBox(height: 14), Text(match['venueName'] as String, style: const TextStyle(color: Colors.white70, fontSize: 12))]])); }
  String _teamName(Map<String, dynamic> team) => (team['shortName'] as String?)?.trim().isNotEmpty == true ? team['shortName'] as String : team['name'] as String;
  Widget _team(String name, String? logoUrl) => Column(children: [Container(width: 58, height: 58, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: logoUrl == null ? Icon(Icons.shield, color: b.primaryColor, size: 30) : ClipOval(child: Image.network(logoUrl, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield, color: b.primaryColor)))), const SizedBox(height: 8), SizedBox(width: 100, child: Text(name, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)))]);
  Widget _sectionTitle(BuildContext context, String title) => Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: b.textColor));
  Widget _duesCard() { final nextDue = data!.dues['nextDue'] as Map<String, dynamic>?; final outstanding = data!.dues['outstandingAmount']?.toString() ?? '0.00'; final label = (nextDue?['description'] as String?)?.trim().isNotEmpty == true ? nextDue!['description'] as String : nextDue?['reference'] as String? ?? 'Sem quotas pendentes'; final status = nextDue?['status'] as String?; final statusLabel = status == 'OVERDUE' ? 'Vencida' : status == 'PARTIALLY_PAID' ? 'Parcialmente paga' : status == 'OPEN' ? 'Por pagar' : 'Em dia'; return Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(20)), child: Row(children: [Icon(Icons.receipt_long_outlined, color: b.accentColor), const SizedBox(width: 14), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), const SizedBox(height: 5), Text('$outstanding € · $statusLabel', style: TextStyle(color: b.mutedTextColor, fontSize: 13))]))])); }
  Widget _newsRow() => Container(height: 100, padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(18)), child: Row(children: [Icon(Icons.newspaper_outlined, color: b.primaryColor, size: 30), const SizedBox(width: 14), Expanded(child: Text('Consulta as notícias oficiais em Clube → Conteúdo do clube.', style: TextStyle(color: b.mutedTextColor, fontSize: 13)))]));
}
