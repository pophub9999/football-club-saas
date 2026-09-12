import 'package:flutter/material.dart';

import 'core/api/api_client.dart';
import 'core/branding/club_branding.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_repository.dart';
import 'features/auth/auth_storage.dart';
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
  late final ApiClient _api;
  late final AuthRepository _auth;
  late final AuthStorage _storage;
  ClubBranding? _authenticatedBranding;
  AuthSession? _session;
  bool _restoring = true;

  @override
  void initState() {
    super.initState();
    _api = ApiClient();
    _auth = AuthRepository(_api);
    _storage = AuthStorage();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    try {
      final refreshToken = await _storage.readRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) return;

      final session = await _auth.refresh(refreshToken);
      final branding = await _auth.loadBranding(session.accessToken);
      await _storage.saveRefreshToken(session.refreshToken);
      if (!mounted) return;
      setState(() {
        _session = session;
        _authenticatedBranding = branding;
      });
    } catch (_) {
      await _storage.clear();
    } finally {
      if (mounted) setState(() => _restoring = false);
    }
  }

  Future<void> _authenticated(AuthSession session, ClubBranding branding) async {
    await _storage.saveRefreshToken(session.refreshToken);
    if (!mounted) return;
    setState(() {
      _session = session;
      _authenticatedBranding = branding;
    });
  }

  @override
  void dispose() {
    _api.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final branding = _authenticatedBranding ?? widget.branding;

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: branding.name,
      theme: buildAppTheme(branding),
      home: _restoring
          ? _SplashScreen(branding: branding)
          : _session == null
              ? LoginScreen(branding: branding, onAuthenticated: _authenticated)
              : HomeScreen(
                  branding: branding,
                  displayName: _session!.user['email'] as String?,
                ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen({required this.branding});

  final ClubBranding branding;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: branding.backgroundColor,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shield, color: branding.primaryColor, size: 64),
            const SizedBox(height: 18),
            Text(branding.name, style: TextStyle(color: branding.textColor, fontSize: 22, fontWeight: FontWeight.w900)),
            const SizedBox(height: 24),
            SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: branding.primaryColor)),
          ],
        ),
      ),
    );
  }
}
