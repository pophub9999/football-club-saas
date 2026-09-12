import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:football_club_mobile/core/branding/club_branding.dart';

void main() {
  test('parses tenant branding configuration', () {
    final branding = ClubBranding.fromJson({
      'club': {'name': 'Clube Azul'},
      'branding': {
        'shortName': 'CA',
        'slogan': 'Sempre contigo',
        'logoUrl': 'https://example.com/logo.png',
        'logoDarkUrl': 'https://example.com/logo-dark.png',
        'primaryColor': '#123456',
        'secondaryColor': '#234567',
        'accentColor': '#ABCDEF',
      },
    });

    expect(branding.name, 'Clube Azul');
    expect(branding.shortName, 'CA');
    expect(branding.slogan, 'Sempre contigo');
    expect(branding.logoUrl, 'https://example.com/logo.png');
    expect(branding.logoDarkUrl, 'https://example.com/logo-dark.png');
    expect(branding.primaryColor, const Color(0xFF123456));
    expect(branding.secondaryColor, const Color(0xFF234567));
    expect(branding.accentColor, const Color(0xFFABCDEF));
  });

  test('uses safe defaults for missing branding values', () {
    final branding = ClubBranding.fromJson({'club': {'name': 'Clube'}});

    expect(branding.name, 'Clube');
    expect(branding.primaryColor, const Color(0xFF008C45));
    expect(branding.secondaryColor, const Color(0xFF005B2A));
    expect(branding.accentColor, const Color(0xFFD7E83F));
  });
}
