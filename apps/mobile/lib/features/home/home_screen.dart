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
  const HomeScreen({
    super.key,
    required this.branding,
    required this.api,
    required this.accessToken,
    required this.onLogout,
    this.canScan = false,
  });

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  final VoidCallback onLogout;
  final bool canScan;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HomeData? data;
  Object? error;
  int selectedIndex = 0;
  bool loading = true;

  ClubBranding get b => data?.branding ?? widget.branding;

  String get greetingName {
    final firstName = data?.member['firstName'];
    if (firstName is String && firstName.trim().isNotEmpty) {
      return firstName.trim();
    }
    final displayName = data?.member['displayName'];
    if (displayName is String && displayName.trim().isNotEmpty) {
      return displayName.trim().split(' ').first;
    }
    return 'Adepto';
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (mounted) setState(() => loading = true);
    try {
      final home = await AuthRepository(widget.api).loadHome(widget.accessToken);
      if (!mounted) return;
      setState(() {
        data = home;
        error = null;
        loading = false;
      });
    } catch (exception) {
      if (!mounted) return;
      setState(() {
        error = exception;
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: b.backgroundColor,
      body: SafeArea(child: _content(context)),
      bottomNavigationBar: NavigationBar(
        backgroundColor: b.surfaceColor,
        indicatorColor: b.primaryColor.withValues(alpha: 0.18),
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) {
          if (mounted) setState(() => selectedIndex = index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.sports_soccer_outlined),
            selectedIcon: Icon(Icons.sports_soccer),
            label: 'Jogos',
          ),
          NavigationDestination(
            icon: Icon(Icons.shield_outlined),
            selectedIcon: Icon(Icons.shield),
            label: 'Clube',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'Carteira',
          ),
          NavigationDestination(
            icon: Icon(Icons.more_horiz),
            selectedIcon: Icon(Icons.more_horiz),
            label: 'Mais',
          ),
        ],
      ),
    );
  }

  Widget _content(BuildContext context) {
    if (selectedIndex == 1) {
      return GamesScreen(
        branding: b,
        api: widget.api,
        accessToken: widget.accessToken,
      );
    }
    if (selectedIndex == 2) {
      return ClubScreen(
        branding: b,
        api: widget.api,
        accessToken: widget.accessToken,
      );
    }
    if (selectedIndex == 3) {
      return WalletScreen(
        branding: b,
        api: widget.api,
        accessToken: widget.accessToken,
      );
    }
    if (selectedIndex == 4) {
      return SettingsScreen(
        branding: b,
        api: widget.api,
        accessToken: widget.accessToken,
        onLogout: widget.onLogout,
        canScan: widget.canScan,
      );
    }

    if (loading && data == null) {
      return Center(child: CircularProgressIndicator(color: b.primaryColor));
    }

    if (data == null) {
      return _errorState();
    }

    return RefreshIndicator(
      color: b.primaryColor,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          _header(context),
          const SizedBox(height: 22),
          _nextMatch(),
          const SizedBox(height: 24),
          _sectionTitle(context, 'A tua quota'),
          const SizedBox(height: 10),
          _duesCard(),
          const SizedBox(height: 14),
          _ticketsButton(),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(child: _sectionTitle(context, 'Notícias')),
              TextButton(
                onPressed: () => _openNews(),
                child: Text(
                  'Ver todas',
                  style: TextStyle(color: b.primaryColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _newsRow(),
        ],
      ),
    );
  }

  Widget _errorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.cloud_off_outlined, size: 48, color: b.mutedTextColor),
            const SizedBox(height: 14),
            Text(
              'Não foi possível carregar a tua área de sócio.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: b.textColor,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 14),
            OutlinedButton(
              onPressed: loading ? null : _load,
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
    );
  }

  void _openNews() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => NewsScreen(
          branding: b,
          api: widget.api,
          accessToken: widget.accessToken,
        ),
      ),
    );
  }

  Widget _header(BuildContext context) {
    final memberNumber = data!.member['memberNumber']?.toString();
    final shortName = b.shortName?.trim();

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Olá, $greetingName',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: b.textColor,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                memberNumber == null || memberNumber.isEmpty
                    ? (shortName ?? 'Área de sócio')
                    : 'Sócio nº $memberNumber',
                style: TextStyle(color: b.mutedTextColor, fontSize: 13),
              ),
            ],
          ),
        ),
        _logo(),
      ],
    );
  }

  Widget _logo() {
    final url = b.logoDarkUrl ?? b.logoUrl;
    return Container(
      width: 46,
      height: 46,
      padding: const EdgeInsets.all(7),
      decoration: BoxDecoration(
        color: b.surfaceColor,
        shape: BoxShape.circle,
      ),
      child: url == null || url.trim().isEmpty
          ? Icon(Icons.shield, color: b.primaryColor)
          : Image.network(
              url,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => Icon(
                Icons.shield,
                color: b.primaryColor,
              ),
            ),
    );
  }

  Widget _nextMatch() {
    final match = data!.nextMatch;
    if (match == null) {
      return _gradientCard(
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Text(
              'Ainda não existem próximos jogos',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      );
    }

    final home = _map(match['homeTeam']);
    final away = _map(match['awayTeam']);
    final kickoff = _parseDate(match['kickoffAt']);
    final when = kickoff == null
        ? 'Data a confirmar'
        : '${kickoff.day.toString().padLeft(2, '0')}/${kickoff.month.toString().padLeft(2, '0')} · ${kickoff.hour.toString().padLeft(2, '0')}:${kickoff.minute.toString().padLeft(2, '0')}';

    return _gradientCard(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'PRÓXIMO JOGO',
                style: TextStyle(
                  color: Colors.white70,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
              Text(
                when,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(child: _team(home)),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  'VS',
                  style: TextStyle(
                    color: Colors.white54,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Expanded(child: _team(away)),
            ],
          ),
          if (match['venueName'] is String &&
              (match['venueName'] as String).trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(
              (match['venueName'] as String).trim(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }

  Widget _gradientCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [b.secondaryColor, b.primaryColor],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: child,
    );
  }

  Widget _team(Map<String, dynamic> team) {
    final shortName = team['shortName'];
    final fullName = team['name'];
    final name = shortName is String && shortName.trim().isNotEmpty
        ? shortName.trim()
        : fullName is String && fullName.trim().isNotEmpty
            ? fullName.trim()
            : 'Equipa';
    final logo = team['logoUrl'];

    return Column(
      children: [
        Container(
          width: 58,
          height: 58,
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
          ),
          child: logo is String && logo.trim().isNotEmpty
              ? ClipOval(
                  child: Image.network(
                    logo,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => Icon(
                      Icons.shield,
                      color: b.primaryColor,
                      size: 30,
                    ),
                  ),
                )
              : Icon(Icons.shield, color: b.primaryColor, size: 30),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: 100,
          child: Text(
            name,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  Widget _sectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w800,
        color: b.textColor,
      ),
    );
  }

  Widget _duesCard() {
    final rawNextDue = data!.dues['nextDue'];
    final due = rawNextDue is Map
        ? Map<String, dynamic>.from(rawNextDue)
        : null;
    final rawAmount = data!.dues['outstandingAmount'];
    final amount = _formatAmount(rawAmount);
    final description = due?['description'];
    final reference = due?['reference'];
    final label = description is String && description.trim().isNotEmpty
        ? description.trim()
        : reference is String && reference.trim().isNotEmpty
            ? reference.trim()
            : 'Sem quotas pendentes';
    final status = due?['status']?.toString().toUpperCase();
    final statusLabel = switch (status) {
      'OVERDUE' => 'Vencida',
      'PARTIALLY_PAID' => 'Parcialmente paga',
      'OPEN' => 'Por pagar',
      _ => 'Em dia',
    };

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: b.surfaceColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Icon(Icons.receipt_long_outlined, color: b.accentColor),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: b.textColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  '$amount € · $statusLabel',
                  style: TextStyle(color: b.mutedTextColor, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _ticketsButton() {
    return Material(
      color: b.surfaceColor,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => TicketsScreen(
              branding: b,
              api: widget.api,
              accessToken: widget.accessToken,
            ),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(Icons.confirmation_number_outlined, color: b.primaryColor),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Os meus bilhetes',
                      style: TextStyle(
                        color: b.textColor,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Acede aos teus bilhetes digitais e QR de entrada',
                      style: TextStyle(color: b.mutedTextColor, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: b.mutedTextColor),
            ],
          ),
        ),
      ),
    );
  }

  Widget _newsRow() {
    if (data!.news.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: b.surfaceColor,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Text(
          'Ainda não existem notícias publicadas.',
          style: TextStyle(color: b.mutedTextColor),
        ),
      );
    }

    return SizedBox(
      height: 170,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: data!.news.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, index) {
          final article = data!.news[index];
          final title = article['title']?.toString().trim();
          final image = article['imageUrl'];

          return SizedBox(
            width: 245,
            child: Material(
              color: b.surfaceColor,
              borderRadius: BorderRadius.circular(18),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: _openNews,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: image is String && image.trim().isNotEmpty
                          ? Image.network(
                              image,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _newsPlaceholder(),
                            )
                          : _newsPlaceholder(),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        title == null || title.isEmpty
                            ? 'Notícia'
                            : title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: b.textColor,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _newsPlaceholder() {
    return Container(
      color: b.secondaryColor,
      child: Icon(
        Icons.newspaper_outlined,
        color: b.primaryColor,
        size: 36,
      ),
    );
  }

  Map<String, dynamic> _map(Object? value) {
    if (value is Map) return Map<String, dynamic>.from(value);
    return <String, dynamic>{};
  }

  DateTime? _parseDate(Object? value) {
    if (value is! String || value.isEmpty) return null;
    return DateTime.tryParse(value)?.toLocal();
  }

  String _formatAmount(Object? value) {
    if (value == null) return '0.00';
    final number = double.tryParse(value.toString());
    if (number == null) return value.toString();
    return number.toStringAsFixed(2).replaceAll('.', ',');
  }
}
