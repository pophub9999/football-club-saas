import '../../core/api/api_client.dart';

class FixtureSummary {
  const FixtureSummary({
    required this.id,
    required this.kickoffAt,
    required this.status,
    required this.homeTeam,
    required this.awayTeam,
    this.venueName,
    this.venueCity,
    this.competitionName,
    this.homeScore,
    this.awayScore,
  });

  final String id;
  final DateTime kickoffAt;
  final String status;
  final Map<String, dynamic> homeTeam;
  final Map<String, dynamic> awayTeam;
  final String? venueName;
  final String? venueCity;
  final String? competitionName;
  final int? homeScore;
  final int? awayScore;

  factory FixtureSummary.fromJson(Map<String, dynamic> json) {
    final homeScore = json['homeScore'];
    final awayScore = json['awayScore'];
    return FixtureSummary(
      id: json['id'] as String,
      kickoffAt: DateTime.parse(json['kickoffAt'] as String).toLocal(),
      status: json['status'] as String? ?? 'SCHEDULED',
      homeTeam: Map<String, dynamic>.from(json['homeTeam'] as Map),
      awayTeam: Map<String, dynamic>.from(json['awayTeam'] as Map),
      venueName: json['venueName'] as String?,
      venueCity: json['venueCity'] as String?,
      competitionName: (json['competition'] as Map?)?['name'] as String?,
      homeScore: homeScore is num ? homeScore.toInt() : null,
      awayScore: awayScore is num ? awayScore.toInt() : null,
    );
  }

  String teamName(Map<String, dynamic> team) =>
      (team['shortName'] as String?)?.trim().isNotEmpty == true
          ? team['shortName'] as String
          : team['name'] as String;

  String get homeName => teamName(homeTeam);
  String get awayName => teamName(awayTeam);
}

class FixtureDetail {
  const FixtureDetail({required this.fixture, this.events = const [], this.lineups = const [], this.stats = const []});

  final FixtureSummary fixture;
  final List<Map<String, dynamic>> events;
  final List<Map<String, dynamic>> lineups;
  final List<Map<String, dynamic>> stats;

  factory FixtureDetail.fromJson(Map<String, dynamic> json) {
    return FixtureDetail(
      fixture: FixtureSummary.fromJson(json),
      events: _list(json['events']),
      lineups: _list(json['lineups']),
      stats: _list(json['stats']),
    );
  }

  static List<Map<String, dynamic>> _list(dynamic value) => value is List
      ? value.map((item) => Map<String, dynamic>.from(item as Map)).toList(growable: false)
      : const [];
}

class FootballRepository {
  FootballRepository(this.api);

  final ApiClient api;

  Future<List<FixtureSummary>> upcoming(String accessToken, {int limit = 20}) async {
    final json = await api.getJson('/football/fixtures/upcoming?limit=$limit', accessToken: accessToken);
    if (json is! List) return const [];
    return json
        .map<FixtureSummary>((item) => FixtureSummary.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList(growable: false);
  }

  Future<FixtureDetail> detail(String accessToken, String fixtureId) async {
    final json = await api.getJson('/football/fixtures/$fixtureId', accessToken: accessToken);
    if (json is! Map) throw const FormatException('Invalid fixture response');
    return FixtureDetail.fromJson(Map<String, dynamic>.from(json));
  }
}
