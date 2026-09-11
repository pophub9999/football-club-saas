import 'package:flutter/material.dart';
import 'core/branding/club_branding.dart';
import 'core/theme/app_theme.dart';
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

class FootballClubApp extends StatelessWidget {
  const FootballClubApp({super.key, required this.branding});

  final ClubBranding branding;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: branding.name,
      theme: buildAppTheme(branding),
      home: HomeScreen(branding: branding),
    );
  }
}
