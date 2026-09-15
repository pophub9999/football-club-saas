import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../tickets/tickets_screen.dart';
import 'football_repository.dart';
import 'matchday_screen.dart';

class MatchdayModeScreen extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final b = branding;
    final date = fixture.kickoffAt;
    final dateLabel = '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    final timeLabel = '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(
        title: const Text('Dia de jogo'),
        backgroundColor: b.surfaceColor,
        foregroundColor: b.textColor,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        children: [
          _hero(b, dateLabel, timeLabel),
          const SizedBox(height: 16),
          _action(
            context,
            b,
            Icons.analytics_outlined,
            'Match Centre',
            'Resultado, eventos, equipas e estatísticas',
            () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => MatchdayScreen(
                branding: b,
                api: api,
                accessToken: accessToken,
                fixture: fixture,
              ),
            )),
          ),
          const SizedBox(height: 10),
          _action(
            context,
            b,
            Icons.confirmation_number_outlined,
            'Os meus bilhetes',
            'Abrir bilhete e QR de entrada',
            () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => TicketsScreen(
                branding: b,
                api: api,
                accessToken: accessToken,
              ),
            )),
          ),
          const SizedBox(height: 10),
          _info(b, Icons.login_outlined, 'Entradas', 'Portas, acessos e instruções serão configurados pelo clube.'),
          const SizedBox(height: 10),
          _info(b, Icons.local_parking_outlined, 'Estacionamento', 'Parques e recomendações de acesso serão configurados pelo clube.'),
          const SizedBox(height: 10),
          _info(
            b,
            Icons.directions_outlined,
            'Como chegar',
            fixture.venueName == null
                ? 'Localização ainda não definida.'
                : '${fixture.venueName}${fixture.venueCity == null ? '' : ' · ${fixture.venueCity}'}',
          ),
          const SizedBox(height: 10),
          _info(b, Icons.notifications_active_outlined, 'Notificações do jogo', 'Preferências push serão ligadas ao sistema de notificações do clube.'),
        ],
      ),
    );
  }

  Widget _hero(ClubBranding b, String date, String time) {
    final score = fixture.homeScore != null && fixture.awayScore != null
        ? '${fixture.homeScore}  -  ${fixture.awayScore}'
        : 'VS';
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [b.primaryColor, b.secondaryColor]),
        borderRadius: BorderRadius.circular(26),
      ),
      child: Column(
        children: [
          Text(fixture.competitionName ?? 'Jogo', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _team(fixture.homeName, fixture.homeTeam['logoUrl'] as String?)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(score, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
              ),
              Expanded(child: _team(fixture.awayName, fixture.awayTeam['logoUrl'] as String?, right: true)),
            ],
          ),
          const SizedBox(height: 16),
          Text(fixture.status, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('$date · $time', style: const TextStyle(color: Colors.white70)),
          if (fixture.venueName != null) ...[
            const SizedBox(height: 5),
            Text('${fixture.venueName}${fixture.venueCity == null ? '' : ' · ${fixture.venueCity}'}', style: const TextStyle(color: Colors.white70)),
          ],
        ],
      ),
    );
  }

  Widget _team(String name, String? logoUrl, {bool right = false}) => Column(
        crossAxisAlignment: right ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: .14), shape: BoxShape.circle),
            child: logoUrl == null
                ? const Icon(Icons.shield_outlined, color: Colors.white)
                : ClipOval(child: Image.network(logoUrl, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.shield_outlined, color: Colors.white))),
          ),
          const SizedBox(height: 8),
          Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: right ? TextAlign.right : TextAlign.left, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
        ],
      );

  Widget _action(BuildContext context, ClubBranding b, IconData icon, String title, String subtitle, VoidCallback onTap) => Card(
        color: b.surfaceColor,
        margin: EdgeInsets.zero,
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
          leading: CircleAvatar(backgroundColor: b.primaryColor.withValues(alpha: .12), child: Icon(icon, color: b.primaryColor)),
          title: Text(title, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)),
          subtitle: Text(subtitle, style: TextStyle(color: b.mutedTextColor)),
          trailing: Icon(Icons.chevron_right, color: b.mutedTextColor),
          onTap: onTap,
        ),
      );

  Widget _info(ClubBranding b, IconData icon, String title, String subtitle) => Card(
        color: b.surfaceColor,
        margin: EdgeInsets.zero,
        child: ListTile(
          leading: Icon(icon, color: b.primaryColor),
          title: Text(title, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)),
          subtitle: Text(subtitle, style: TextStyle(color: b.mutedTextColor)),
        ),
      );
}
