import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../content/news_screen.dart';

class ClubScreen extends StatelessWidget {
  const ClubScreen({super.key, required this.branding, required this.api, required this.accessToken});
  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: branding.backgroundColor,
    body: SafeArea(child: ListView(padding: const EdgeInsets.fromLTRB(20, 20, 20, 28), children: [
      Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(gradient: LinearGradient(colors: [branding.secondaryColor, branding.primaryColor]), borderRadius: BorderRadius.circular(26)), child: Column(children: [
        _logo(), const SizedBox(height: 16),
        Text(branding.name, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 25, fontWeight: FontWeight.w900)),
        if (branding.slogan != null) ...[const SizedBox(height: 7), Text(branding.slogan!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70))],
      ])),
      const SizedBox(height: 22),
      _section('Conteúdo do clube', Icons.newspaper_outlined, 'Notícias e informação oficial do clube', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => NewsScreen(branding: branding, api: api, accessToken: accessToken)))),
      _section('Equipas', Icons.groups_outlined, 'Plantéis e equipas do clube', null),
      _section('História', Icons.auto_stories_outlined, 'História, títulos e momentos marcantes', null),
    ])),
  );

  Widget _logo() { final url = branding.logoDarkUrl ?? branding.logoUrl; return Container(width: 82, height: 82, padding: const EdgeInsets.all(10), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: url == null ? Icon(Icons.shield, color: branding.primaryColor, size: 46) : ClipOval(child: Image.network(url, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield, color: branding.primaryColor, size: 46)))); }
  Widget _section(String title, IconData icon, String subtitle, VoidCallback? onTap) => Container(margin: const EdgeInsets.only(bottom: 12), decoration: BoxDecoration(color: branding.surfaceColor, borderRadius: BorderRadius.circular(18)), child: ListTile(contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 7), leading: Icon(icon, color: branding.primaryColor, size: 30), title: Text(title, style: TextStyle(color: branding.textColor, fontWeight: FontWeight.w800)), subtitle: Text(subtitle, style: TextStyle(color: branding.mutedTextColor)), trailing: Icon(Icons.chevron_right, color: branding.mutedTextColor), onTap: onTap));
}
