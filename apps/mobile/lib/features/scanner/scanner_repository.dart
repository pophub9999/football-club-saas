import '../../core/api/api_client.dart';

class ScannerRepository {
  final ApiClient api;

  ScannerRepository(this.api);

  Future<Map<String, dynamic>> scan(String payload, String accessToken, {String? deviceId}) async {
    final response = await api.postJson<dynamic>(
      '/tickets/scan',
      {
        'payload': payload,
        if (deviceId != null && deviceId.isNotEmpty) 'deviceId': deviceId,
      },
      accessToken: accessToken,
    );
    return Map<String, dynamic>.from(response as Map);
  }
}
