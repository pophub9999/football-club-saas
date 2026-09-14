import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../auth/auth_repository.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.branding, required this.api, required this.accessToken});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HomeData? data;
  Object? error;
  int selectedIndex = 0;

  ClubBranding get b => data?.branding ?? widget.branding;
  String get greetingName => (data?.member['firstName'] as String?)?.trim().isNotEmpty == true ? (data!.member['firstName'] as String).trim() : 'Adepto';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final loaded = await AuthRepository(widget.api).loadHome(widget.accessToken);
      if (mounted) setState(() => data = loaded);
    } catch (exception) {
      if (mounted) setState(() => error = exception);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: _content(context)),
      bottomNavigationBar: NavigationBar(
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
  }

  Widget _content(BuildContext context) {
    if (error != null && data == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.cloud_off_outlined, size: 48, color: b.mutedTextColor),
            const SizedBox(height: 14),
            Text('Não foi possível carregar a tua área de sócio.', textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)),
            const SizedBox(height: 14),
            OutlinedButton(onPressed: _load, child: const Text('Tentar novamente')),
          ]),
        ),
      );
    }

    if (data == null) return const Center(child: CircularProgressIndicator());

    return RefreshIndicator(
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(padding: const EdgeInsets.fromLTRB(20, 18, 20, 0), sliver: SliverToBoxAdapter(child: _header(context))),
          SliverPadding(padding: const EdgeInsets.fromLTRB(20, 22, 20, 0), sliver: SliverToBoxAdapter(child: _nextMatch(context))),
          SliverPadding(padding: const EdgeInsets.fromLTRB(20, 24, 20, 0), sliver: SliverToBoxAdapter(child: _sectionTitle(context, 'A tua quota'))),
          SliverPadding(padding: const EdgeInsets.fromLTRB(20, 10, 20, 0), sliver: SliverToBoxAdapter(child: _duesCard())),
          SliverPadding(padding: const EdgeInsets.fromLTRB(20, 24, 20, 0), sliver: SliverToBoxAdapter(child: _sectionTitle(context, 'Notícias'))),
          SliverPadding(padding: const EdgeInsets.fromLTRB(20, 10, 20, 24), sliver: SliverToBoxAdapter(child: _newsRow())),
        ],
      ),
    );
  }

  Widget _header(BuildContext context) => Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Olá, $greetingName 👋', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('Sócio nº ${data!.member['memberNumber']}', style: TextStyle(color: b.mutedTextColor, fontSize: 13)),
        ])),
        _logo(size: 46),
      ]);

  Widget _logo({double size = 56}) {
    final url = b.logoDarkUrl ?? b.logoUrl;
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(7),
      decoration: BoxDecoration(color: b.surfaceColor, shape: BoxShape.circle),
      child: url == null ? Icon(Icons.shield, color: b.primaryColor, size: size * .55) : Image.network(url, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield, color: b.primaryColor)),
    );
  }

  Widget _nextMatch(BuildContext context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [b.secondaryColor, b.primaryColor]),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(blurRadius: 24, offset: const Offset(0, 10), color: b.primaryColor.withValues(alpha: .22))],
        ),
        child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('PRÓXIMO JOGO', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700, letterSpacing: 1.1, fontSize: 12)), _pill('A integrar')]),
          const SizedBox(height: 22),
          Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [_team(b.shortName ?? b.name, Icons.shield), const Text('VS', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.w800)), _team('Próximo adversário', Icons.shield_outlined)]),
          const SizedBox(height: 14),
          const Text('Dados de futebol serão ligados nesta etapa', style: TextStyle(color: Colors.white70, fontSize: 12), textAlign: TextAlign.center),
        ]),
      );

  Widget _pill(String text) => Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: Colors.white.withValues(alpha: .14), borderRadius: BorderRadius.circular(20)), child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)));

  Widget _team(String name, IconData icon) => Column(children: [Container(width: 58, height: 58, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Icon(icon, color: b.primaryColor, size: 30)), const SizedBox(height: 8), SizedBox(width: 100, child: Text(name, textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)))]);

  Widget _sectionTitle(BuildContext context, String title) => Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: b.textColor)), Text('Ver todas  ›', style: TextStyle(color: b.primaryColor, fontWeight: FontWeight.w700, fontSize: 13))]);

  Widget _duesCard() {
    final nextDue = data!.dues['nextDue'] as Map<String, dynamic>?;
    final outstanding = data!.dues['outstandingAmount']?.toString() ?? '0.00';
    final description = nextDue?['description'] as String?;
    final reference = nextDue?['reference'] as String?;
    final status = nextDue?['status'] as String?;
    final label = description?.trim().isNotEmpty == true ? description! : reference ?? 'Sem quotas pendentes';
    final statusLabel = status == 'OVERDUE' ? 'Vencida' : status == 'PARTIALLY_PAID' ? 'Parcialmente paga' : status == 'OPEN' ? 'Por pagar' : 'Em dia';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: b.primaryColor.withValues(alpha: .12))),
      child: Row(children: [
        Container(width: 48, height: 48, decoration: BoxDecoration(color: b.accentColor.withValues(alpha: .16), borderRadius: BorderRadius.circular(14)), child: Icon(Icons.receipt_long_outlined, color: b.accentColor)),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)),
          const SizedBox(height: 5),
          Text('$outstanding € · $statusLabel', style: TextStyle(color: b.mutedTextColor, fontSize: 13)),
        ])),
        if (nextDue != null && (status == 'OPEN' || status == 'OVERDUE' || status == 'PARTIALLY_PAID'))
          FilledButton(onPressed: () {}, style: FilledButton.styleFrom(backgroundColor: b.primaryColor), child: const Text('Pagar')),
      ]),
    );
  }

  Widget _newsRow() => Container(
        height: 100,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(18), border: Border.all(color: b.primaryColor.withValues(alpha: .12))),
        child: Row(children: [
          Icon(Icons.newspaper_outlined, color: b.primaryColor, size: 30),
          const SizedBox(width: 14),
          Expanded(child: Text('As notícias do clube ficarão disponíveis quando o módulo de conteúdo estiver ligado.', style: TextStyle(color: b.mutedTextColor, fontSize: 13))),
        ]),
      );
}
