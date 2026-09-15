import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        baseUrl = (baseUrl ?? const String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3000/v1')).replaceFirst(RegExp(r'/$'), '');

  final http.Client _client;
  final String baseUrl;

  Future<T> postJson<T>(String path, Map<String, dynamic> body, {String? accessToken}) async {
    final headers = <String, String>{'content-type': 'application/json'};
    if (accessToken != null) headers['authorization'] = 'Bearer $accessToken';
    final response = await _client.post(Uri.parse('$baseUrl$path'), headers: headers, body: jsonEncode(body));
    return _decode<T>(response);
  }

  Future<T> patchJson<T>(String path, Map<String, dynamic> body, {String? accessToken}) async {
    final headers = <String, String>{'content-type': 'application/json'};
    if (accessToken != null) headers['authorization'] = 'Bearer $accessToken';
    final response = await _client.patch(Uri.parse('$baseUrl$path'), headers: headers, body: jsonEncode(body));
    return _decode<T>(response);
  }

  Future<T> getJson<T>(String path, {String? accessToken}) async {
    final headers = <String, String>{'accept': 'application/json'};
    if (accessToken != null) headers['authorization'] = 'Bearer $accessToken';
    final response = await _client.get(Uri.parse('$baseUrl$path'), headers: headers);
    return _decode<T>(response);
  }

  T _decode<T>(http.Response response) {
    dynamic decoded;
    try {
      decoded = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    } catch (_) {
      throw ApiException('Resposta inválida do servidor.', statusCode: response.statusCode);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded is Map<String, dynamic> && decoded['message'] != null
          ? decoded['message'].toString()
          : 'Não foi possível concluir o pedido.';
      throw ApiException(message, statusCode: response.statusCode);
    }

    return decoded as T;
  }

  void dispose() => _client.close();
}
