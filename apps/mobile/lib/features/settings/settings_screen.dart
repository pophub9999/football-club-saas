import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import '../scanner/scanner_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, required this.branding, required this.api, required this.accessToken, required this.onLogout, this.canScan = false});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  final VoidCallback onLogout;
  final bool canScan;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool notifications = true;
  bool matchday = true;
  bool marketing = false;

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(title: const Text('Definições'), backgroundColor: b.backgroundColor),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        children: [
          if (widget.canScan) ...[
            _section('Operação de jogo'),
            _tile(Icons.qr_code_scanner, 'Scanner de entradas', 'Validar bilhetes na entrada do estádio', onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ScannerScreen(branding: b, api: widget.api, accessToken: widget.accessToken)))),
          ],
          _section('Notificações'),
          _switchTile('Notificações gerais', notifications, (v) => setState(() => notifications = v)),
          _switchTile('Jogos e resultados', matchday, (v) => setState(() => matchday = v)),
          _switchTile('Ofertas e comunicações', marketing, (v) => setState(() => marketing = v)),
          _section('Conta e privacidade'),
          _tile(Icons.person_outline, 'Dados pessoais', 'Consultar e atualizar os teus dados'),
          _tile(Icons.privacy_tip_outlined, 'Privacidade', 'Consentimentos e utilização dos teus dados'),
          _tile(Icons.description_outlined, 'Termos e condições', 'Documentação legal do clube'),
          _tile(Icons.support_agent_outlined, 'Apoio', 'Contactar o clube ou abrir um pedido'),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: () => _confirmLogout(context),
            icon: const Icon(Icons.logout),
            label: const Text('Terminar sessão'),
            style: OutlinedButton.styleFrom(foregroundColor: b.textColor, side: BorderSide(color: b.mutedTextColor.withValues(alpha: .35))),
          ),
        ],
      ),
    );
  }

  Widget _section(String title) => Padding(
    padding: const EdgeInsets.only(top: 18, bottom: 8),
    child: Text(title, style: TextStyle(color: widget.branding.primaryColor, fontWeight: FontWeight.w800, fontSize: 13)),
  );

  Widget _switchTile(String title, bool value, ValueChanged<bool> onChanged) => SwitchListTile.adaptive(
    contentPadding: EdgeInsets.zero,
    title: Text(title, style: TextStyle(color: widget.branding.textColor, fontWeight: FontWeight.w600)),
    value: value,
    activeTrackColor: widget.branding.primaryColor,
    onChanged: onChanged,
  );

  Widget _tile(IconData icon, String title, String subtitle, {VoidCallback? onTap}) => ListTile(
    contentPadding: EdgeInsets.zero,
    leading: Icon(icon, color: widget.branding.primaryColor),
    title: Text(title, style: TextStyle(color: widget.branding.textColor, fontWeight: FontWeight.w700)),
    subtitle: Text(subtitle, style: TextStyle(color: widget.branding.mutedTextColor)),
    trailing: Icon(Icons.chevron_right, color: widget.branding.mutedTextColor),
    onTap: onTap ?? () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$title será disponibilizado nesta área.'))),
  );

  Future<void> _confirmLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Terminar sessão?'),
        content: const Text('Vais sair da conta neste dispositivo.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Sair')),
        ],
      ),
    );
    if (confirmed == true) widget.onLogout();
  }
}
