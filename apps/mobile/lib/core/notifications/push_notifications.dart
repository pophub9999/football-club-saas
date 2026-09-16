import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../api/api_client.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

class PushNotifications {
  PushNotifications(this.api);

  final ApiClient api;
  String? _registeredToken;

  Future<bool> initialize(String accessToken) async {
    if (!Platform.isAndroid && !Platform.isIOS) return false;

    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true, provisional: false);

      final token = await messaging.getToken();
      if (token != null && token.isNotEmpty) {
        await _register(accessToken, token);
      }

      messaging.onTokenRefresh.listen((nextToken) async {
        try {
          await _register(accessToken, nextToken);
        } catch (_) {}
      });

      FirebaseMessaging.onMessage.listen((_) {});
      FirebaseMessaging.onMessageOpenedApp.listen((_) {});
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> unregister(String accessToken) async {
    final token = _registeredToken;
    if (token == null) return;
    try {
      await api.deleteJson('/notifications/devices', {'token': token}, accessToken: accessToken);
    } catch (_) {}
    _registeredToken = null;
  }

  Future<void> _register(String accessToken, String token) async {
    final platform = Platform.isIOS ? 'ios' : 'android';
    await api.postJson<Map<String, dynamic>>('/notifications/devices', {
      'token': token,
      'platform': platform,
      'appVersion': '0.1.0',
    }, accessToken: accessToken);
    _registeredToken = token;
  }
}
