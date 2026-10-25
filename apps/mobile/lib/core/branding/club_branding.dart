import 'package:flutter/material.dart';

class ClubBranding {
  const ClubBranding({
    required this.name,
    this.shortName,
    this.slogan,
    this.logoUrl,
    this.logoDarkUrl,
    this.heroImageUrl,
    this.primaryColor = const Color(0xFF008C45),
    this.secondaryColor = const Color(0xFF005B2A),
    this.accentColor = const Color(0xFFD7E83F),
    this.backgroundColor = const Color(0xFF07110D),
    this.surfaceColor = const Color(0xFF102019),
    this.textColor = Colors.white,
    this.mutedTextColor = const Color(0xFFA7B5AE),
  });

  final String name;
  final String? shortName;
  final String? slogan;
  final String? logoUrl;
  final String? logoDarkUrl;
  final String? heroImageUrl;
  final Color primaryColor;
  final Color secondaryColor;
  final Color accentColor;
  final Color backgroundColor;
  final Color surfaceColor;
  final Color textColor;
  final Color mutedTextColor;

  factory ClubBranding.fromJson(Map<String, dynamic> json) {
    final club = Map<String, dynamic>.from(json['club'] as Map? ?? const {});
    final branding = Map<String, dynamic>.from(json['branding'] as Map? ?? const {});

    Color parseColor(dynamic value, Color fallback) {
      if (value is! String) return fallback;
      final hex = value.replaceFirst('#', '');
      final normalized = hex.length == 6 ? 'FF$hex' : hex;
      final parsed = int.tryParse(normalized, radix: 16);
      return parsed == null ? fallback : Color(parsed);
    }

    return ClubBranding(
      name: (club['name'] as String?) ?? 'Clube',
      shortName: branding['shortName'] as String?,
      slogan: branding['slogan'] as String?,
      logoUrl: branding['logoUrl'] as String?,
      logoDarkUrl: branding['logoDarkUrl'] as String?,
      heroImageUrl: branding['heroImageUrl'] as String?,
      primaryColor: parseColor(branding['primaryColor'], const Color(0xFF008C45)),
      secondaryColor: parseColor(branding['secondaryColor'], const Color(0xFF005B2A)),
      accentColor: parseColor(branding['accentColor'], const Color(0xFFD7E83F)),
      backgroundColor: parseColor(branding['backgroundColor'], const Color(0xFF07110D)),
      surfaceColor: parseColor(branding['surfaceColor'], const Color(0xFF102019)),
      textColor: parseColor(branding['textColor'], Colors.white),
      mutedTextColor: parseColor(branding['mutedTextColor'], const Color(0xFFA7B5AE)),
    );
  }
}
