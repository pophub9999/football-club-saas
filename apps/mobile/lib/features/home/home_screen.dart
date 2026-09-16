import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../auth/auth_repository.dart';
import '../clubs/club_screen.dart';
import '../content/news_screen.dart';
import '../football/games_screen.dart';
import '../settings/settings_screen.dart';
import '../tickets/tickets_screen.dart';
import '../wallet/wallet_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.branding, required this.api, required this.accessToken, required this.onLogout, this.canScan = false});
  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  final VoidCallback onLogout;
  final bool canScan;

  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HomeData? data;
  Object? error;
  int selectedIndex = 0;
  ClubBranding get b => data?.branding ?? widget.branding;
  String get greetingName {
    final value = data?.member['firstName'] as String?;
    return value?.trim().isNotEmpty == true ? value!.trim() : 'Adepto';
  }

  @override void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final home = await AuthRepository(widget.api).loadHome(widget.accessToken);
      if (mounted) setState(() { data = home; error = null; });
    } catch (exception) {
      if (mounted) setState(() => error = exception);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: b.backgroundColor,
    body: SafeArea(child: _content(context)),
    bottomNavigationBar: NavigationBar(
      backgroundColor: b.surfaceColor,
      indicatorColor: b.primaryColor.withValues(alpha: .18),
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) => setState(() => selectedIndex = index),
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
        NavigationDestination(icon: Icon(Icons.sports_soccer_outlined), selectedIcon: Icon(Icons.sports_soccer), label: 'Jogos'),
        NavigationDestination(icon: Icon(Icons.shield_outlined), selectedIcon: Icon(Icons.shield), label: 'Clube'),
        NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), selectedIcon: Icon(Icons.account_balance_wallet), label: 'Carteira'),
        NavigationDestination(icon: Icon(Icons.more_horiz), label: 'Mais'),
      ],
    ),
  );

  Widget _content(BuildContext context) {
    if (selectedIndex == 1) return GamesScreen(branding: b, api: widget.api, accessToken: widget.accessToken);
    if (selectedIndex == 2) return ClubScreen(branding: b, api: widget.api, accessToken: widget.accessToken);
    if (selectedIndex == 3) return WalletScreen(branding: b, api: widget.api, accessToken: widget.accessToken);
    if (selectedIndex == 4) return SettingsScreen(branding: b, api: widget.api, accessToken: widget.accessToken, onLogout: widget.onLogout, canScan: widget.canScan);
    if (data == null) {
      if (error != null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.cloud_off_outlined, size: 48, color: b.mutedTextColor), const SizedBox(height: 14),
        Text('Não foi possível carregar a tua área de sócio.', textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)),
        const SizedBox(height: 14), OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
      ]));
      return Center(child: CircularProgressIndicator(color: b.primaryColor));
    }
    return RefreshIndicator(onRefresh: _load, child: ListView(padding: const EdgeInsets.fromLTRB(20, 18, 20, 28), children: [
      _header(context), const SizedBox(height: 22), _nextMatch(),
      const SizedBox(height: 24), _sectionTitle(context, 'A tua quota'), const SizedBox(height: 10), _duesCard(),
      const SizedBox(height: 14), _ticketsButton(), const SizedBox(height: 24),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        _sectionTitle(context, 'Notícias'),
        TextButton(onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => NewsScreen(branding: b, api: widget.api, accessToken: widget.accessToken))), child: Text('Ver todas', style: TextStyle(color: b.primaryColor))),
      ]),
      const SizedBox(height: 10), _newsRow(),
    ]));
  }

  Widget _header(BuildContext context) => Row(children: [
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Olá, $greetingName', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: b.textColor, fontWeight: FontWeight.w800)),
      const SizedBox(height: 4), Text('Sócio nº ${data!.member['memberNumber']}', style: TextStyle(color: b.mutedTextColor, fontSize: 13)),
    ])), _logo(),
  ]);

  Widget _logo() {
    final url = b.logoDarkUrl ?? b.logoUrl;
    return Container(width: 46, height: 46, padding: const EdgeInsets.all(7), decoration: BoxDecoration(color: b.surfaceColor, shape: BoxShape.circle), child: url == null ? Icon(Icons.shield, color: b.primaryColor) : Image.network(url, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield, color: b.primaryColor)));
  }

  Widget _nextMatch() {
    final match = data!.nextMatch;
    if (match == null) return Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(gradient: LinearGradient(colors: [b.secondaryColor, b.primaryColor]), borderRadius: BorderRadius.circular(24)), child: const Center(child: Text('Ainda não existem próximos jogos', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700))));
    final home = Map<String, dynamic>.from(match['homeTeam'] as Map);
    final away = Map<String, dynamic>.from(match['awayTeam'] as Map);
    final kickoff = DateTime.parse(match['kickoffAt'] as String).toLocal();
    final when = '${kickoff.day.toString().padLeft(2, '0')}/${kickoff.month.toString().padLeft(2, '0')} · ${kickoff.hour.toString().padLeft(2, '0')}:${kickoff.minute.toString().padLeft(2, '0')}';
    return Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(gradient: LinearGradient(colors: [b.secondaryColor, b.primaryColor]), borderRadius: BorderRadius.circular(24)), child: Column(children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('PRÓXIMO JOGO', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700, fontSize: 12)), Text(when, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12))]),
      const SizedBox(height: 22), Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [_team(home), const Text('VS', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.w800)), _team(away)]),
      if (match['venueName'] != null) ...[const SizedBox(height: 14), Text(match['venueName'] as String, style: const TextStyle(color: Colors.white70, fontSize: 12))],
    ]));
  }

  Widget _team(Map<String, dynamic> team) {
    final short = team['shortName'] as String?;
    final name = short?.trim().isNotEmpty == true ? short! : team['name'] as String;
    final logo = team['logoUrl'] as String?;
    return Column(children: [
      Container(width: 58, height: 58, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: logo == null ? Icon(Icons.shield, color: b.primaryColor, size: 30) : ClipOval(child: Image.network(logo, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield, color: b.primaryColor)))),
      const SizedBox(height: 8), SizedBox(width: 100, child: Text(name, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12))),
    ]);
  }

  Widget _sectionTitle(BuildContext context, String title) => Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: b.textColor));

  Widget _duesCard() {
    final due = data!.dues['nextDue'] as Map<String, dynamic>?;
    final amount = data!.dues['outstandingAmount']?.toString() ?? '0.00';
    final description = due?['description'] as String?;
    final reference = due?['reference'] as String?;
    final label = description?.trim().isNotEmpty == true ? description! : reference ?? 'Sem quotas pendentes';
    final status = due?['status'] as String?;
    final statusLabel = status == 'OVERDUE' ? 'Vencida' : status == 'PARTIALLY_PAID' ? 'Parcialmente paga' : status == 'OPEN' ? 'Por pagar' : 'Em dia';
    return Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(20)), child: Row(children: [Icon(Icons.receipt_long_outlined, color: b.accentColor), const SizedBox(width: 14), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), const SizedBox(height: 5), Text('$amount € · $statusLabel', style: TextStyle(color: b.mutedTextColor, fontSize: 13))]))]));
  }

  Widget _ticketsButton() => Material(color: b.surfaceColor, borderRadius: BorderRadius.circular(18), child: InkWell(borderRadius: BorderRadius.circular(18), onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => TicketsScreen(branding: b, api: widget.api, accessToken: widget.accessToken))), child: Padding(padding: const EdgeInsets.all(16), child: Row(children: [Icon(Icons.confirmation_number_outlined, color: b.primaryColor), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Os meus bilhetes', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)), const SizedBox(height: 3), Text('Acede aos teus bilhetes digitais e QR de entrada', style: TextStyle(color: b.mutedTextColor, fontSize: 12))])), Icon(Icons.chevron_right, color: b.mutedTextColor)])));

  Widget _newsRow() {
    if (data!.news.isEmpty) return Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(18)), child: Text('Ainda não existem notícias publicadas.', style: TextStyle(color: b.mutedTextColor)));
    return SizedBox(height: 170, child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: data!.news.length, separatorBuilder: (_, __) => const SizedBox(width: 12), itemBuilder: (_, index) {
      final article = data!.news[index];
      final image = article['imageUrl'] as String?;
      return SizedBox(width: 245, child: Material(color: b.surfaceColor, borderRadius: BorderRadius.circular(18), clipBehavior: Clip.antiAlias, child: InkWell(onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => NewsScreen(branding: b, api: widget.api, accessToken: widget.accessToken))), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: image == null ? Container(color: b.secondaryColor, child: Icon(Icons.newspaper_outlined, color: b.primaryColor, size: 36)) : Image.network(image, width: double.infinity, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: b.secondaryColor, child: Icon(Icons.newspaper_outlined, color: b.primaryColor, size: 36)))),
        Padding(padding: const EdgeInsets.all(12), child: Text(article['title'] as String, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800))),
      ])));
    }));
  }
}
