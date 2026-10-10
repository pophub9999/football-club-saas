import '../../core/api/api_client.dart';

class FixtureSummary {
  const FixtureSummary({required this.id, required this.kickoffAt, required this.status, required this.homeTeam, required this.awayTeam, this.venueName, this.venueCity, this.competitionName, this.homeScore, this.awayScore});
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
    final homeScoreValue = json['homeScore'];
    final awayScoreValue = json['awayScore'];
    return FixtureSummary(id: json['id'] as String, kickoffAt: DateTime.parse(json['kickoffAt'] as String).toLocal(), status: json['status'] as String? ?? 'SCHEDULED', homeTeam: Map<String, dynamic>.from(json['homeTeam'] as Map), awayTeam: Map<String, dynamic>.from(json['awayTeam'] as Map), venueName: json['venueName'] as String?, venueCity: json['venueCity'] as String?, competitionName: (json['competition'] as Map?)?['name'] as String?, homeScore: homeScoreValue is num ? homeScoreValue.toInt() : null, awayScore: awayScoreValue is num ? awayScoreValue.toInt() : null);
  }
  String teamName(Map<String, dynamic> team) {
    final shortName = team['shortName'] as String?;
    return shortName?.trim().isNotEmpty == true ? shortName! : team['name'] as String;
  }
  String get homeName => teamName(homeTeam);
  String get awayName => teamName(awayTeam);
}

class FixtureDetail {
  const FixtureDetail({required this.fixture, this.events = const [], this.lineups = const [], this.stats = const []});
  final FixtureSummary fixture;
  final List<Map<String, dynamic>> events;
  final List<Map<String, dynamic>> lineups;
  final List<Map<String, dynamic>> stats;
  factory FixtureDetail.fromJson(Map<String, dynamic> json) => FixtureDetail(fixture: FixtureSummary.fromJson(json), events: _list(json['events']), lineups: _list(json['lineups']), stats: _list(json['stats']));
  static List<Map<String, dynamic>> _list(dynamic value) => value is List ? value.map((item) => Map<String, dynamic>.from(item as Map)).toList(growable: false) : const [];
}

class FootballStanding {
  const FootballStanding({required this.position, required this.teamName, required this.points, this.teamShortName, this.teamLogoUrl, this.played, this.won, this.drawn, this.lost, this.goalsFor, this.goalsAgainst, this.goalDifference, this.result});
  final int position;
  final String teamName;
  final int points;
  final String? teamShortName;
  final String? teamLogoUrl;
  final int? played;
  final int? won;
  final int? drawn;
  final int? lost;
  final int? goalsFor;
  final int? goalsAgainst;
  final int? goalDifference;
  final String? result;
  factory FootballStanding.fromJson(Map<String, dynamic> json) => FootballStanding(position: (json['position'] as num?)?.toInt() ?? 0, teamName: json['teamName'] as String? ?? 'Equipa', points: (json['points'] as num?)?.toInt() ?? 0, teamShortName: json['teamShortName'] as String?, teamLogoUrl: json['teamLogoUrl'] as String?, played: (json['played'] as num?)?.toInt(), won: (json['won'] as num?)?.toInt(), drawn: (json['drawn'] as num?)?.toInt(), lost: (json['lost'] as num?)?.toInt(), goalsFor: (json['goalsFor'] as num?)?.toInt(), goalsAgainst: (json['goalsAgainst'] as num?)?.toInt(), goalDifference: (json['goalDifference'] as num?)?.toInt(), result: json['result'] as String?);
  String get formLabel => switch (result) {'up' => '↑', 'down' => '↓', _ => '–'};
}

class FootballStandings {
  const FootballStandings({required this.seasonId, required this.provider, required this.rows});
  final String seasonId;
  final String provider;
  final List<FootballStanding> rows;
  factory FootballStandings.fromJson(Map<String, dynamic> json) => FootballStandings(seasonId: json['seasonId'] as String? ?? '', provider: json['provider'] as String? ?? '', rows: (json['standings'] as List? ?? const []).map((item) => FootballStanding.fromJson(Map<String, dynamic>.from(item as Map))).toList(growable: false));
}

class FootballPlayer {
  const FootballPlayer({required this.externalId, required this.name, required this.teams, required this.statistics, this.displayName, this.imageUrl, this.nationality, this.birthDate, this.height, this.weight, this.position, this.detailedPosition});
  final String externalId;
  final String name;
  final String? displayName;
  final String? imageUrl;
  final String? nationality;
  final String? birthDate;
  final int? height;
  final int? weight;
  final String? position;
  final String? detailedPosition;
  final List<Map<String, dynamic>> teams;
  final List<Map<String, dynamic>> statistics;
  factory FootballPlayer.fromJson(Map<String, dynamic> json) => FootballPlayer(externalId: json['externalId'] as String? ?? '', name: json['name'] as String? ?? 'Jogador', displayName: json['displayName'] as String?, imageUrl: json['imageUrl'] as String?, nationality: json['nationality'] as String?, birthDate: json['birthDate'] as String?, height: (json['height'] as num?)?.toInt(), weight: (json['weight'] as num?)?.toInt(), position: json['position'] as String?, detailedPosition: json['detailedPosition'] as String?, teams: _list(json['teams']), statistics: _list(json['statistics']));
  static List<Map<String, dynamic>> _list(dynamic value) => value is List ? value.map((item) => Map<String, dynamic>.from(item as Map)).toList(growable: false) : const [];
}

class FootballSquadPlayer {
  const FootballSquadPlayer({required this.externalId, required this.name, this.displayName, this.imageUrl, this.position, this.detailedPosition, this.jerseyNumber, this.isCaptain, this.inSquad});
  final String externalId;
  final String name;
  final String? displayName;
  final String? imageUrl;
  final String? position;
  final String? detailedPosition;
  final int? jerseyNumber;
  final bool? isCaptain;
  final bool? inSquad;
  factory FootballSquadPlayer.fromJson(Map<String, dynamic> json) => FootballSquadPlayer(externalId: json['externalId']?.toString() ?? '', name: json['name']?.toString() ?? 'Jogador', displayName: json['displayName'] as String?, imageUrl: json['imageUrl'] as String?, position: json['position'] as String?, detailedPosition: json['detailedPosition'] as String?, jerseyNumber: (json['jerseyNumber'] as num?)?.toInt(), isCaptain: json['isCaptain'] as bool?, inSquad: json['inSquad'] as bool?);
}

class FootballTeam {
  const FootballTeam({required this.id, required this.externalId, required this.name, this.shortName, this.logoUrl, this.provider});
  final String id;
  final String externalId;
  final String name;
  final String? shortName;
  final String? logoUrl;
  final String? provider;
  factory FootballTeam.fromJson(Map<String, dynamic> json) => FootballTeam(id: json['id'] as String, externalId: json['externalId'] as String, name: json['name'] as String, shortName: json['shortName'] as String?, logoUrl: json['logoUrl'] as String?, provider: json['provider'] as String?);
}

class FootballRepository {
  FootballRepository(this.api);
  final ApiClient api;
  Future<List<FixtureSummary>> upcoming(String accessToken, {int limit = 20}) async { final json = await api.getJson('/football/fixtures/upcoming?limit=$limit', accessToken: accessToken); if (json is! List) return const []; return json.map<FixtureSummary>((item) => FixtureSummary.fromJson(Map<String, dynamic>.from(item as Map))).toList(growable: false); }
  Future<FixtureDetail> detail(String accessToken, String fixtureId) async { final json = await api.getJson('/football/fixtures/$fixtureId', accessToken: accessToken); if (json is! Map) throw const FormatException('Invalid fixture response'); return FixtureDetail.fromJson(Map<String, dynamic>.from(json)); }
  Future<FootballStandings> currentStandings(String accessToken) async { final json = await api.getJson('/football/standings/current', accessToken: accessToken); if (json is! Map) throw const FormatException('Invalid standings response'); return FootballStandings.fromJson(Map<String, dynamic>.from(json)); }
  Future<List<FootballTeam>> teams(String accessToken, {int limit = 50}) async { final json = await api.getJson('/football/teams?limit=$limit', accessToken: accessToken); if (json is! List) return const []; return json.map<FootballTeam>((item) => FootballTeam.fromJson(Map<String, dynamic>.from(item as Map))).toList(growable: false); }
  Future<List<FootballSquadPlayer>> squad(String accessToken, String teamId, {String? seasonId}) async { final query = seasonId == null || seasonId.isEmpty ? '' : '?seasonId=${Uri.encodeQueryComponent(seasonId)}'; final json = await api.getJson('/football/teams/$teamId/squad$query', accessToken: accessToken); if (json is! Map) throw const FormatException('Invalid squad response'); final players = json['players']; if (players is! List) return const []; return players.map<FootballSquadPlayer>((item) => FootballSquadPlayer.fromJson(Map<String, dynamic>.from(item as Map))).toList(growable: false); }
  Future<FootballPlayer> player(String accessToken, String playerId) async { final json = await api.getJson('/football/players/$playerId', accessToken: accessToken); if (json is! Map) throw const FormatException('Invalid player response'); return FootballPlayer.fromJson(Map<String, dynamic>.from(json)); }
}
