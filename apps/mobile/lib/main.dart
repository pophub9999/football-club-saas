import 'package:flutter/material.dart';

import 'core/branding/club_branding.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_repository.dart';
import 'features/auth/login_screen.dart';
import 'features/home/home_screen.dart';

void main() {
  const branding = ClubBranding(
    name: 'Clube Principal',
    shortName: 'Clube Principal',
    slogan: 'Juntos somos mais fortes',
    primaryColor: Color(0xFF008C45),
    secondaryColor: Color(0xFF005B2A),
    accentColor: Color(0xFFD7E83F),
    backgroundColor: Color(0xFF07110D),
    surfaceColor: Color(0xFF102019),
  );

  runApp(FootballClubApp(branding: branding));
}

class FootballClubApp extends StatefulWidget {
  const FootballClubApp({super.key, required this.branding});

  final ClubBranding branding;

  @override
  State<FootballClubApp> createState() => _FootballClubAppState();
}

class _FootballClubAppState extends State<FootballClubApp> {
  ClubBranding? _authenticatedBranding;
  AuthSession? _session;

  Future<void> _authenticated(AuthSession session, ClubBranding branding) async {
    setState(() {
      _session = session;
      _authenticatedBranding = branding;
    });
  }

  @override
  Widget build(BuildContext context) {
    final branding = _authenticatedBranding ?? widget.branding;

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: branding.name,
      theme: buildAppTheme(branding),
      home: _session == null
          ? LoginScreen(branding: branding, onAuthenticated: _authenticated)
          : HomeScreen(branding: branding),
    );
  }
}
