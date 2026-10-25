import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'auth_repository.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.branding, required this.onAuthenticated});

  final ClubBranding branding;
  final Future<void> Function(AuthSession session, ClubBranding branding) onAuthenticated;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  late final ApiClient _api;
  late final AuthRepository _auth;
  bool _loading = false;
  bool _obscurePassword = true;
  String? _error;
  List<ClubOption> _clubs = const [];

  @override
  void initState() {
    super.initState();
    _api = ApiClient();
    _auth = AuthRepository(_api);
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _api.dispose();
    super.dispose();
  }

  Future<void> _login({String? tenantId}) async {
    FocusManager.instance.primaryFocus?.unfocus();
    if (_email.text.trim().isEmpty || _password.text.isEmpty) {
      setState(() => _error = 'Preenche o email e a palavra-passe.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await _auth.login(email: _email.text, password: _password.text, tenantId: tenantId);
      if (result.selectionRequired) {
        if (!mounted) return;
        setState(() => _clubs = result.clubs);
        return;
      }

      final session = result.session!;
      final branding = await _auth.loadBranding(session.accessToken);
      if (mounted) await widget.onAuthenticated(session, branding);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Não foi possível ligar ao servidor.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    final selectingClub = _clubs.isNotEmpty;
    return Scaffold(
      backgroundColor: b.backgroundColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: selectingClub ? _clubSelection(b) : _credentials(b),
            ),
          ),
        ),
      ),
    );
  }

  Widget _credentials(ClubBranding b) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _logo(b),
        const SizedBox(height: 28),
        Text(b.name, textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontSize: 28, fontWeight: FontWeight.w900)),
        if (b.slogan != null) ...[
          const SizedBox(height: 8),
          Text(b.slogan!, textAlign: TextAlign.center, style: TextStyle(color: b.mutedTextColor, fontSize: 14)),
        ],
        const SizedBox(height: 42),
        Text('Entrar', style: TextStyle(color: b.textColor, fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 18),
        _field(controller: _email, label: 'Email', keyboardType: TextInputType.emailAddress, prefix: Icons.email_outlined),
        const SizedBox(height: 14),
        _field(controller: _password, label: 'Palavra-passe', obscureText: _obscurePassword, prefix: Icons.lock_outline, suffix: IconButton(onPressed: () => setState(() => _obscurePassword = !_obscurePassword), icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined))),
        if (_error != null) ...[
          const SizedBox(height: 14),
          Text(_error!, style: TextStyle(color: b.accentColor, fontWeight: FontWeight.w600)),
        ],
        const SizedBox(height: 22),
        SizedBox(
          height: 54,
          child: FilledButton(
            onPressed: _loading ? null : () => _login(),
            style: FilledButton.styleFrom(backgroundColor: b.primaryColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
            child: _loading ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Entrar', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ),
        const SizedBox(height: 18),
        TextButton(onPressed: () {}, child: Text('Esqueci-me da palavra-passe', style: TextStyle(color: b.mutedTextColor))),
      ],
    );
  }

  Widget _clubSelection(ClubBranding b) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _logo(b),
        const SizedBox(height: 28),
        Text('Escolhe o teu clube', textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontSize: 25, fontWeight: FontWeight.w900)),
        const SizedBox(height: 8),
        Text('A tua conta está associada a vários clubes.', textAlign: TextAlign.center, style: TextStyle(color: b.mutedTextColor, fontSize: 14)),
        const SizedBox(height: 26),
        ..._clubs.map((club) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: SizedBox(
                height: 64,
                child: OutlinedButton(
                  onPressed: _loading ? null : () => _login(tenantId: club.id),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: b.textColor,
                    side: BorderSide(color: b.primaryColor.withValues(alpha: .35)),
                    backgroundColor: b.surfaceColor,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                  ),
                  child: Row(
                    children: [
                      Container(width: 38, height: 38, decoration: BoxDecoration(color: b.primaryColor.withValues(alpha: .14), shape: BoxShape.circle), child: Icon(Icons.shield_outlined, color: b.primaryColor)),
                      const SizedBox(width: 14),
                      Expanded(child: Text(club.name, style: const TextStyle(fontWeight: FontWeight.w800))),
                      Icon(Icons.chevron_right, color: b.mutedTextColor),
                    ],
                  ),
                ),
              ),
            )),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: b.accentColor, fontWeight: FontWeight.w600)),
        ],
        const SizedBox(height: 10),
        TextButton(onPressed: _loading ? null : () => setState(() { _clubs = const []; _error = null; }), child: Text('Usar outra conta', style: TextStyle(color: b.mutedTextColor))),
      ],
    );
  }

  Widget _logo(ClubBranding b) {
    final url = b.logoUrl ?? b.logoDarkUrl;
    return Center(
      child: Container(
        width: 92,
        height: 92,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: b.surfaceColor, shape: BoxShape.circle, border: Border.all(color: b.primaryColor.withValues(alpha: .25))),
        child: url == null ? Icon(Icons.shield, size: 52, color: b.primaryColor) : Image.network(url, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield, size: 52, color: b.primaryColor)),
      ),
    );
  }

  Widget _field({required TextEditingController controller, required String label, required IconData prefix, TextInputType? keyboardType, bool obscureText = false, Widget? suffix}) {
    final b = widget.branding;
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      style: TextStyle(color: b.textColor),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: b.mutedTextColor),
        prefixIcon: Icon(prefix, color: b.mutedTextColor),
        suffixIcon: suffix,
        filled: true,
        fillColor: b.surfaceColor,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: b.primaryColor, width: 1.5)),
      ),
    );
  }
}
