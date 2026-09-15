import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../tickets/tickets_screen.dart';
import 'football_repository.dart';
import 'matchday_screen.dart';

class MatchdayModeScreen extends StatefulWidget {
  const MatchdayModeScreen({
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
  State<MatchdayModeScreen> createState() => _MatchdayModeScreenState();
}

class _MatchdayModeScreenState extends State<MatchdayModeScreen> {
  Map<String, dynamic> _config = <String, dynamic>{};
  bool _loading = true;
  String? _error;

  Map<String, dynamic> _map(Object? value) {
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }
    return <String, dynamic>{};
  }

  List<Map<String, dynamic>> _list(String key) {
    final value = _config[key];
    if (value is! List) return const <Map<String, dynamic>>[];
    return value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false);
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final json = await widget.api.getJson(
        '/clubs/current/matchday',
        accessToken: widget.accessToken,
      );
      if (mounted) {
        setState(() {
          _config = _map(json);
          _error = null;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Não foi possível carregar as informações do dia de jogo.';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    final f = widget.fixture;
    final d = f.kickoffAt;
    final date =
        '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    final time =
        '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    final location = _map(_config['location']);

    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(
        title: const Text('Dia de jogo'),
        backgroundColor: b.surfaceColor,
        foregroundColor: b.textColor,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          children: [
            _hero(b, date, time),
            const SizedBox(height: 16),
            _action(
              context,
              b,
              Icons.analytics_outlined,
              'Match Centre',
              'Resultado, eventos, equipas e estatísticas',
              () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => MatchdayScreen(
                    branding: b,
                    api: widget.api,
                    accessToken: widget.accessToken,
                    fixture: f,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            _action(
              context,
              b,
              Icons.confirmation_number_outlined,
              'Os meus bilhetes',
              'Abrir bilhete e QR de entrada',
              () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => TicketsScreen(
                    branding: b,
                    api: widget.api,
                    accessToken: widget.accessToken,
                  ),
                ),
              ),
            ),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (_error != null)
              _info(b, Icons.error_outline, 'Informação', _error!),
            ..._entrances(b),
            ..._parking(b),
            _location(b, location),
            ..._notices(b),
          ],
        ),
      ),
    );
  }

  Widget _hero(ClubBranding b, String date, String time) {
    final f = widget.fixture;
    final score = f.homeScore != null && f.awayScore != null
        ? '${f.homeScore}  -  ${f.awayScore}'
        : 'VS';

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [b.primaryColor, b.secondaryColor],
        ),
        borderRadius: BorderRadius.circular(26),
      ),
      child: Column(
        children: [
          Text(
            f.competitionName ?? 'Jogo',
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _team(f.homeName, f.homeTeam['logoUrl'] as String?)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  score,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Expanded(
                child: _team(
                  f.awayName,
                  f.awayTeam['logoUrl'] as String?,
                  right: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            f.status,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text('$date · $time', style: const TextStyle(color: Colors.white70)),
          if (f.venueName != null) ...[
            const SizedBox(height: 5),
            Text(
              '${f.venueName}${f.venueCity == null ? '' : ' · ${f.venueCity}'}',
              style: const TextStyle(color: Colors.white70),
            ),
          ],
        ],
      ),
    );
  }

  Widget _team(String name, String? logoUrl, {bool right = false}) {
    return Column(
      crossAxisAlignment:
          right ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Container(
          width: 58,
          height: 58,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: .14),
            shape: BoxShape.circle,
          ),
          child: logoUrl == null
              ? const Icon(Icons.shield_outlined, color: Colors.white)
              : ClipOval(
                  child: Image.network(
                    logoUrl,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.shield_outlined,
                      color: Colors.white,
                    ),
                  ),
                ),
        ),
        const SizedBox(height: 8),
        Text(
          name,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          textAlign: right ? TextAlign.right : TextAlign.left,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }

  List<Widget> _entrances(ClubBranding b) {
    final entrances = _list('entrances');
    if (entrances.isEmpty) {
      return [
        _info(
          b,
          Icons.login_outlined,
          'Entradas',
          'O clube ainda não configurou os acessos.',
        ),
      ];
    }
    return entrances
        .map(
          (e) => _info(
            b,
            Icons.login_outlined,
            e['name'] as String? ?? 'Entrada',
            e['instructions'] as String? ?? '',
          ),
        )
        .toList();
  }

  List<Widget> _parking(ClubBranding b) {
    final parking = _list('parking');
    return [
      if (parking.isNotEmpty) const SizedBox(height: 10),
      ...parking.map(
        (e) => _info(
          b,
          Icons.local_parking_outlined,
          e['name'] as String? ?? 'Estacionamento',
          e['instructions'] as String? ?? '',
        ),
      ),
    ];
  }

  Widget _location(ClubBranding b, Map<String, dynamic> location) {
    final address = location['address'] as String?;
    final map = location['mapUrl'] as String?;
    final venue = widget.fixture.venueName == null
        ? ''
        : '${widget.fixture.venueName}${widget.fixture.venueCity == null ? '' : ' · ${widget.fixture.venueCity}'}';
    final lines = [
      if (venue.isNotEmpty) venue,
      if (address != null && address.isNotEmpty) address,
    ];

    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Card(
        color: b.surfaceColor,
        margin: EdgeInsets.zero,
        child: ListTile(
          leading: Icon(Icons.directions_outlined, color: b.primaryColor),
          title: Text(
            'Como chegar',
            style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800),
          ),
          subtitle: Text(
            lines.isEmpty
                ? 'Localização ainda não definida.'
                : lines.join('\n'),
            style: TextStyle(color: b.mutedTextColor),
          ),
          trailing: map == null
              ? null
              : Icon(Icons.open_in_new, color: b.primaryColor),
        ),
      ),
    );
  }

  List<Widget> _notices(ClubBranding b) {
    final notices = _list('notices');
    return [
      if (notices.isNotEmpty) const SizedBox(height: 10),
      ...notices.map(
        (e) => _info(
          b,
          (e['important'] as bool?) == true
              ? Icons.warning_amber_outlined
              : Icons.notifications_active_outlined,
          e['title'] as String? ?? 'Aviso',
          e['message'] as String? ?? '',
        ),
      ),
    ];
  }

  Widget _action(
    BuildContext context,
    ClubBranding b,
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) {
    return Card(
      color: b.surfaceColor,
      margin: EdgeInsets.zero,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        leading: CircleAvatar(
          backgroundColor: b.primaryColor.withValues(alpha: .12),
          child: Icon(icon, color: b.primaryColor),
        ),
        title: Text(
          title,
          style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800),
        ),
        subtitle: Text(subtitle, style: TextStyle(color: b.mutedTextColor)),
        trailing: Icon(Icons.chevron_right, color: b.mutedTextColor),
        onTap: onTap,
      ),
    );
  }

  Widget _info(ClubBranding b, IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Card(
        color: b.surfaceColor,
        margin: EdgeInsets.zero,
        child: ListTile(
          leading: Icon(icon, color: b.primaryColor),
          title: Text(
            title,
            style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800),
          ),
          subtitle: Text(subtitle, style: TextStyle(color: b.mutedTextColor)),
        ),
      ),
    );
  }
}
