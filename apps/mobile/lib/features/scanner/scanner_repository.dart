import '../../core/api_client.dart';

class ScannerRepository {
  final ApiClient api;

  ScannerRepository(this.api);

  Future<Map<String, dynamic>> scan(String payload, {String? deviceId}) async {
    final response = await api.post('/tickets/scan', {
      'payload': payload,
      if (deviceId != null && deviceId.isNotEmpty) 'deviceId': deviceId,
    });
    return Map<String, dynamic>.from(response as Map);
  }
}
