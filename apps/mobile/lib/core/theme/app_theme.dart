import 'package:flutter/material.dart';
import '../branding/club_branding.dart';

ThemeData buildAppTheme(ClubBranding branding) {
  final scheme = ColorScheme.fromSeed(
    seedColor: branding.primaryColor,
    brightness: Brightness.dark,
  ).copyWith(
    primary: branding.primaryColor,
    secondary: branding.accentColor,
    surface: branding.surfaceColor,
    onSurface: branding.textColor,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: branding.backgroundColor,
    colorScheme: scheme,
    appBarTheme: AppBarTheme(
      backgroundColor: branding.backgroundColor,
      foregroundColor: branding.textColor,
      elevation: 0,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: branding.surfaceColor,
      indicatorColor: branding.primaryColor.withValues(alpha: 0.22),
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: branding.mutedTextColor),
      ),
    ),
    cardTheme: CardThemeData(
      color: branding.surfaceColor,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
  );
}
