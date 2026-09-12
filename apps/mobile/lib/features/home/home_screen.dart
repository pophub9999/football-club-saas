import 'package:flutter/material.dart';
import '../../core/branding/club_branding.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.branding, this.displayName, this.memberNumber});

  final ClubBranding branding;
  final String? displayName;
  final String? memberNumber;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int selectedIndex = 0;

  ClubBranding get b => widget.branding;
  String get greetingName => (widget.displayName?.trim().isNotEmpty ?? false) ? widget.displayName!.trim() : 'Adepto';

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
    return CustomScrollView(
      slivers: [
        SliverPadding(padding: const EdgeInsets.fromLTRB(20, 18, 20, 0), sliver: SliverToBoxAdapter(child: _header(context))),
        SliverPadding(padding: const EdgeInsets.fromLTRB(20, 22, 20, 0), sliver: SliverToBoxAdapter(child: _nextMatch(context))),
        SliverPadding(padding: const EdgeInsets.fromLTRB(20, 24, 20, 0), sliver: SliverToBoxAdapter(child: _sectionTitle(context, 'A tua quota'))),
        SliverPadding(padding: const EdgeInsets.fromLTRB(20, 10, 20, 0), sliver: SliverToBoxAdapter(child: _duesCard())),
        SliverPadding(padding: const EdgeInsets.fromLTRB(20, 24, 20, 0), sliver: SliverToBoxAdapter(child: _sectionTitle(context, 'Notícias'))),
        SliverPadding(padding: const EdgeInsets.fromLTRB(20, 10, 20, 24), sliver: SliverToBoxAdapter(child: _newsRow())),
      ],
    );
  }

  Widget _header(BuildContext context) => Row(
        children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Olá, $greetingName 👋', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              if (widget.memberNumber != null && widget.memberNumber!.isNotEmpty)
                Text('Sócio nº ${widget.memberNumber}', style: TextStyle(color: b.mutedTextColor, fontSize: 13)),
            ]),
          ),
          _logo(size: 46),
        ],
      );

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
        decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [b.secondaryColor, b.primaryColor]), borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(blurRadius: 24, offset: const Offset(0, 10), color: b.primaryColor.withValues(alpha: .22))]),
        child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('PRÓXIMO JOGO', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700, letterSpacing: 1.1, fontSize: 12)), _pill('20 SET · 20:15')]),
          const SizedBox(height: 22),
          Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [_team(b.shortName ?? b.name, Icons.shield), const Text('VS', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.w800)), _team('FC Rival', Icons.shield_outlined)]),
          const SizedBox(height: 14),
          const Text('Estádio Municipal', style: TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 18),
          SizedBox(width: double.infinity, child: FilledButton(onPressed: () {}, style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: b.secondaryColor), child: const Text('Ver jogo  →'))),
        ]),
      );

  Widget _pill(String text) => Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: Colors.white.withValues(alpha: .14), borderRadius: BorderRadius.circular(20)), child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)));

  Widget _team(String name, IconData icon) => Column(children: [Container(width: 58, height: 58, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Icon(icon, color: b.primaryColor, size: 30)), const SizedBox(height: 8), SizedBox(width: 85, child: Text(name, textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)))]);

  Widget _sectionTitle(BuildContext context, String title) => Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: b.textColor)), Text('Ver todas  ›', style: TextStyle(color: b.primaryColor, fontWeight: FontWeight.w700, fontSize: 13))]);

  Widget _duesCard() => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: b.primaryColor.withValues(alpha: .12))),
        child: Row(children: [Container(width: 48, height: 48, decoration: BoxDecoration(color: b.accentColor.withValues(alpha: .16), borderRadius: BorderRadius.circular(14)), child: Icon(Icons.receipt_long_outlined, color: b.accentColor)), const SizedBox(width: 14), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Quota 2026/27', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), const SizedBox(height: 5), Text('25,00 € · Vencida', style: TextStyle(color: b.mutedTextColor, fontSize: 13))])), FilledButton(onPressed: () {}, style: FilledButton.styleFrom(backgroundColor: b.primaryColor), child: const Text('Pagar'))]),
      );

  Widget _newsRow() => SizedBox(height: 172, child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: 3, separatorBuilder: (_, __) => const SizedBox(width: 12), itemBuilder: (_, index) => Container(width: 225, decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(18), border: Border.all(color: b.primaryColor.withValues(alpha: .12))), clipBehavior: Clip.antiAlias, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Container(height: 92, decoration: BoxDecoration(gradient: LinearGradient(colors: [b.secondaryColor, b.primaryColor])), child: Center(child: Icon(index == 0 ? Icons.stadium_outlined : Icons.sports_soccer, size: 34, color: Colors.white))), Padding(padding: const EdgeInsets.fromLTRB(13, 10, 13, 8), child: Text(['Bilhetes para o próximo jogo', 'Plantel prepara novo desafio', 'Toda a atualidade do clube'][index], maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700, fontSize: 13)))])));
}
