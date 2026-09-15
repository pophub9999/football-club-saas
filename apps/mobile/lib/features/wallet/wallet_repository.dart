import '../../core/api/api_client.dart';

class WalletRepository {
  WalletRepository(this.api);

  final ApiClient api;

  Future<Map<String, dynamic>> membership(String accessToken) async {
    return api.getJson<Map<String, dynamic>>('/membership/me', accessToken: accessToken);
  }

  Future<List<Map<String, dynamic>>> dues(String accessToken) async {
    final json = await api.getJson<dynamic>('/membership/dues', accessToken: accessToken);
    final list = json is List ? json : (json is Map && json['dues'] is List ? json['dues'] as List<dynamic> : const <dynamic>[]);
    return list.map((item) => Map<String, dynamic>.from(item as Map)).toList(growable: false);
  }

  Future<List<Map<String, dynamic>>> payments(String accessToken) async {
    final json = await api.getJson<dynamic>('/payments/history', accessToken: accessToken);
    final list = json is List ? json : (json is Map && json['payments'] is List ? json['payments'] as List<dynamic> : const <dynamic>[]);
    return list.map((item) => Map<String, dynamic>.from(item as Map)).toList(growable: false);
  }

  Future<List<Map<String, dynamic>>> receipts(String accessToken) async {
    final json = await api.getJson<dynamic>('/receipts', accessToken: accessToken);
    final list = json is List ? json : (json is Map && json['receipts'] is List ? json['receipts'] as List<dynamic> : const <dynamic>[]);
    return list.map((item) => Map<String, dynamic>.from(item as Map)).toList(growable: false);
  }

  Future<Map<String, dynamic>> createPaymentIntent({
    required String accessToken,
    required String dueId,
    required String idempotencyKey,
  }) {
    return api.postJson<Map<String, dynamic>>('/payments/intents', {
      'dueId': dueId,
      'idempotencyKey': idempotencyKey,
      'provider': 'mock',
    }, accessToken: accessToken);
  }

  Future<Map<String, dynamic>> confirmMockPayment({
    required String accessToken,
    required String paymentId,
  }) {
    return api.postJson<Map<String, dynamic>>('/payments/mock/$paymentId/succeed', const {}, accessToken: accessToken);
  }
}
