import 'package:flutter/material.dart';

void main() {
  runApp(const FootballClubApp());
}

class FootballClubApp extends StatelessWidget {
  const FootballClubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Adepto',
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Roboto',
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF087443)),
        scaffoldBackgroundColor: const Color(0xFFF5F6F5),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
              sliver: SliverToBoxAdapter(child: _header()),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
              sliver: SliverToBoxAdapter(child: _nextMatch()),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
              sliver: SliverToBoxAdapter(child: _sectionTitle('A tua quota', 'Ver todas')),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
              sliver: SliverToBoxAdapter(child: _duesCard()),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              sliver: SliverToBoxAdapter(child: _sectionTitle('Notícias', 'Ver todas')),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
              sliver: SliverToBoxAdapter(child: _newsRow()),
            ),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) => setState(() => selectedIndex = index),
        height: 72,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
          NavigationDestination(icon: Icon(Icons.sports_soccer_outlined), selectedIcon: Icon(Icons.sports_soccer), label: 'Jogos'),
          NavigationDestination(icon: Icon(Icons.shield_outlined), selectedIcon: Icon(Icons.shield), label: 'Clube'),
          NavigationDestination(icon: Icon(Icons.more_horiz), label: 'Mais'),
        ],
      ),
    );
  }

  Widget _header() => Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Bom dia, Ricardo', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Row(children: const [Icon(Icons.shield, size: 16, color: Color(0xFF087443)), SizedBox(width: 6), Text('Clube selecionado')]),
              ],
            ),
          ),
          CircleAvatar(
            radius: 22,
            backgroundColor: const Color(0xFFE2EEE8),
            child: Icon(Icons.person_outline, color: const Color(0xFF087443)),
          ),
        ],
      );

  Widget _nextMatch() => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF075B37), Color(0xFF0B8950)]),
          borderRadius: BorderRadius.circular(24),
          boxShadow: const [BoxShadow(blurRadius: 18, offset: Offset(0, 8), color: Color(0x24000000))],
        ),
        child: Column(
          children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('PRÓXIMO JOGO', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w700, letterSpacing: 1.1, fontSize: 12)),
              Container(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5), decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(20)), child: const Text('20 SET · 20:15', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600))),
            ]),
            const SizedBox(height: 22),
            Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
              _team('CASA', Icons.shield),
              const Text('VS', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.w800)),
              _team('FORA', Icons.shield_outlined),
            ]),
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, child: OutlinedButton(onPressed: () {}, style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white54), padding: const EdgeInsets.symmetric(vertical: 13)), child: const Text('Ver detalhes'))),
          ],
        ),
      );

  Widget _team(String name, IconData icon) => Column(children: [
        Container(width: 54, height: 54, decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Icon(icon, color: const Color(0xFF087443), size: 28)),
        const SizedBox(height: 8),
        Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
      ]);

  Widget _sectionTitle(String title, String action) => Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
        Text(action, style: const TextStyle(color: Color(0xFF087443), fontWeight: FontWeight.w600, fontSize: 13)),
      ]);

  Widget _duesCard() => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE4E8E5))),
        child: Row(children: [
          Container(width: 48, height: 48, decoration: BoxDecoration(color: const Color(0xFFFFF0E8), borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.receipt_long_outlined, color: Color(0xFFB85B20))),
          const SizedBox(width: 14),
          const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('Quota 2026/27', style: TextStyle(fontWeight: FontWeight.w700)), SizedBox(height: 5), Text('25,00 € · Vencida', style: TextStyle(color: Color(0xFF8A4A23), fontSize: 13))])),
          FilledButton(onPressed: () {}, style: FilledButton.styleFrom(backgroundColor: const Color(0xFF087443)), child: const Text('Pagar')),
        ]),
      );

  Widget _newsRow() => SizedBox(
        height: 172,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: 3,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, index) => Container(
            width: 225,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE4E8E5))),
            clipBehavior: Clip.antiAlias,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(height: 92, color: const Color(0xFFDDE8E2), child: Center(child: Icon(index == 0 ? Icons.stadium_outlined : Icons.sports_soccer, size: 34, color: const Color(0xFF087443)))),
              Padding(padding: const EdgeInsets.fromLTRB(13, 10, 13, 8), child: Text(['Bilhetes para o próximo jogo', 'Plantel prepara novo desafio', 'Toda a atualidade do clube'][index], maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13))),
            ]),
          ),
        ),
      );
}
