import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../tickets/tickets_screen.dart';
import 'football_repository.dart';

class MatchdayScreen extends StatelessWidget {
  const MatchdayScreen({
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
    final date = fixture.kickoffAt;
    final dateLabel = '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    final timeLabel = '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';

    return Scaffold(
      backgroundColor: branding.backgroundColor,
      appBar: AppBar(
        title: const Text('Dia de jogo'),
        backgroundColor: branding.surfaceColor,
        foregroundColor: branding.textColor,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        children: [
          _hero(context, dateLabel, timeLabel),
          const SizedBox(height: 16),
          _action(
            context,
            Icons.confirmation_number_outlined,
            'Os meus bilhetes',
            'Abrir bilhetes e QR de entrada',
            () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => TicketsScreen(branding: branding, api: api, accessToken: accessToken),
            )),
          ),
          const SizedBox(height: 10),
          _infoCard(Icons.login_outlined, 'Entradas', 'Informação de portas e acessos será configurada pelo clube.'),
          const SizedBox(height: 10),
          _infoCard(Icons.local_parking_outlined, 'Estacionamento', 'Parques, acessos e recomendações serão configurados pelo clube.'),
          const SizedBox(height: 10),
          _infoCard(Icons.directions_outlined, 'Como chegar', fixture.venueName == null ? 'Localização ainda não definida.' : '${fixture.venueName}${fixture.venueCity == null ? '' : ' · ${fixture.venueCity}'}'),
          const SizedBox(height: 10),
          _infoCard(Icons.notifications_active_outlined, 'Avisos do jogo', 'Alertas de abertura de portas, alterações e informações importantes aparecerão aqui.'),
        ],
      ),
    );
  }

  Widget _hero(BuildContext context, String dateLabel, String timeLabel) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [branding.primaryColor, branding.secondaryColor]),
        borderRadius: BorderRadius.circular(26),
      ),
      child: Column(
        children: [
          Text(fixture.competitionName ?? 'Jogo', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _team(fixture.homeName, fixture.homeTeam['logoUrl'] as String?)),
              const Padding(padding: EdgeInsets.symmetric(horizontal: 10), child: Text('VS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900))),
              Expanded(child: _team(fixture.awayName, fixture.awayTeam['logoUrl'] as String?, right: true)),
            ],
          ),
          const SizedBox(height: 18),
          Text('$dateLabel · $timeLabel', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800)),
          if (fixture.venueName != null) ...[
            const SizedBox(height: 6),
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

  Widget _action(BuildContext context, IconData icon, String title, String subtitle, VoidCallback onTap) => Card(
        color: branding.surfaceColor,
        margin: EdgeInsets.zero,
        child: ListTile(
          leading: CircleAvatar(backgroundColor: branding.primaryColor.withValues(alpha: .14), child: Icon(icon, color: branding.primaryColor)),
          title: Text(title, style: TextStyle(color: branding.textColor, fontWeight: FontWeight.w800)),
          subtitle: Text(subtitle, style: TextStyle(color: branding.mutedTextColor)),
          trailing: Icon(Icons.chevron_right, color: branding.mutedTextColor),
          onTap: onTap,
        ),
      );

  Widget _infoCard(IconData icon, String title, String subtitle) => Card(
        color: branding.surfaceColor,
        margin: EdgeInsets.zero,
        child: ListTile(
          leading: Icon(icon, color: branding.primaryColor),
          title: Text(title, style: TextStyle(color: branding.textColor, fontWeight: FontWeight.w800)),
          subtitle: Text(subtitle, style: TextStyle(color: branding.mutedTextColor)),
        ),
      );
}
