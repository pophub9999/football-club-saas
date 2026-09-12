import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';

class AuthSession {
  const AuthSession({required this.accessToken, required this.refreshToken, required this.user});

  final String accessToken;
  final String refreshToken;
  final Map<String, dynamic> user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: Map<String, dynamic>.from(json['user'] as Map),
    );
  }
}

class AuthRepository {
  AuthRepository(this.api);

  final ApiClient api;

  Future<AuthSession> login({required String email, required String password, String? tenantId}) async {
    final payload = <String, dynamic>{'email': email.trim(), 'password': password};
    if (tenantId != null && tenantId.isNotEmpty) payload['tenantId'] = tenantId;
    return AuthSession.fromJson(await api.postJson('/auth/login', payload));
  }

  Future<ClubBranding> loadBranding(String accessToken) async {
    return ClubBranding.fromJson(await api.getJson('/clubs/current/branding', accessToken: accessToken));
  }
}
