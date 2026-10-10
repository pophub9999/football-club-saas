import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'scanner_repository.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key, required this.branding, required this.api, required this.accessToken});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  late final MobileScannerController _controller;
  late final ScannerRepository _repository;
  bool _processing = false;
  Map<String, dynamic>? _result;
  String? _error;

  ClubBranding get b => widget.branding;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController();
    _repository = ScannerRepository(widget.api);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _scan(String payload) async {
    if (_processing || payload.isEmpty) return;
    if (!payload.startsWith('fcs://ticket/v1/')) return;

    setState(() {
      _processing = true;
      _result = null;
      _error = null;
    });
    await _controller.stop();

    try {
      final result = await _repository.scan(payload, widget.accessToken);
      if (!mounted) return;
      setState(() {
        _result = result;
        _processing = false;
      });
    } catch (exception) {
      if (!mounted) return;
      setState(() {
        _error = exception.toString();
        _processing = false;
      });
    }
  }

  Future<void> _nextScan() async {
    setState(() {
      _result = null;
      _error = null;
    });
    await _controller.start();
  }

  @override
  Widget build(BuildContext context) {
    final accepted = _result?['accepted'] == true;
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(
        title: const Text('Scanner de entradas'),
        backgroundColor: b.surfaceColor,
        foregroundColor: b.textColor,
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(controller: _controller, onDetect: (capture) {
            final barcode = capture.barcodes.firstOrNull;
            final value = barcode?.rawValue;
            if (value != null) _scan(value);
          }),
          IgnorePointer(
            child: Center(
              child: Container(
                width: 270,
                height: 270,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white, width: 3),
                  borderRadius: BorderRadius.circular(28),
                ),
              ),
            ),
          ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 28,
            child: _processing
                ? _statusCard(const CircularProgressIndicator(), 'A validar entrada...')
                : _result != null
                    ? _statusCard(
                        Icon(accepted ? Icons.check_circle : Icons.cancel, size: 64, color: accepted ? Colors.greenAccent : Colors.redAccent),
                        accepted ? 'ENTRADA AUTORIZADA' : 'ENTRADA RECUSADA',
                        subtitle: accepted ? 'Bilhete validado com sucesso.' : (_result?['result']?.toString() ?? 'Bilhete não autorizado.'),
                        action: _nextScan,
                      )
                    : _error != null
                        ? _statusCard(const Icon(Icons.error_outline, size: 56, color: Colors.redAccent), 'ERRO', subtitle: _error, action: _nextScan)
                        : Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(color: Colors.black.withValues(alpha: .72), borderRadius: BorderRadius.circular(20)),
                            child: const Text('Aponte a câmara para o QR do bilhete', textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _statusCard(Widget icon, String title, {String? subtitle, VoidCallback? action}) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(color: Colors.black.withValues(alpha: .86), borderRadius: BorderRadius.circular(24)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          icon,
          const SizedBox(height: 12),
          Text(title, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
          if (subtitle != null) ...[const SizedBox(height: 8), Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70))],
          if (action != null) ...[const SizedBox(height: 16), SizedBox(width: double.infinity, child: ElevatedButton(onPressed: action, child: const Text('Ler próximo bilhete')))],
        ],
      ),
    );
  }
}
