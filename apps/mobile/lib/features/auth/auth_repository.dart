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

class ClubOption {
  const ClubOption({required this.id, required this.name, required this.slug});

  final String id;
  final String name;
  final String slug;

  factory ClubOption.fromJson(Map<String, dynamic> json) {
    return ClubOption(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
    );
  }
}

class LoginResult {
  const LoginResult.authenticated(this.session)
      : selectionRequired = false,
        clubs = const [];

  const LoginResult.selection(this.clubs)
      : selectionRequired = true,
        session = null;

  final bool selectionRequired;
  final AuthSession? session;
  final List<ClubOption> clubs;

  factory LoginResult.fromJson(Map<String, dynamic> json) {
    if (json['selectionRequired'] == true) {
      final clubs = (json['clubs'] as List<dynamic>? ?? const [])
          .map((club) => ClubOption.fromJson(Map<String, dynamic>.from(club as Map)))
          .toList(growable: false);
      return LoginResult.selection(clubs);
    }
    return LoginResult.authenticated(AuthSession.fromJson(json));
  }
}

class AuthRepository {
  AuthRepository(this.api);

  final ApiClient api;

  Future<LoginResult> login({required String email, required String password, String? tenantId}) async {
    final payload = <String, dynamic>{'email': email.trim(), 'password': password};
    if (tenantId != null && tenantId.isNotEmpty) payload['tenantId'] = tenantId;
    return LoginResult.fromJson(await api.postJson('/auth/login', payload));
  }

  Future<ClubBranding> loadBranding(String accessToken) async {
    return ClubBranding.fromJson(await api.getJson('/clubs/current/branding', accessToken: accessToken));
  }
}
