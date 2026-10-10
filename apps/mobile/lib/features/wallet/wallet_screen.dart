import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'wallet_repository.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key, required this.branding, required this.api, required this.accessToken});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  late final WalletRepository repository = WalletRepository(widget.api);
  Map<String, dynamic>? membership;
  List<Map<String, dynamic>> dues = const [];
  List<Map<String, dynamic>> payments = const [];
  List<Map<String, dynamic>> receipts = const [];
  Object? error;
  bool loading = true;
  String? payingDueId;

  ClubBranding get b => widget.branding;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final results = await Future.wait([
        repository.membership(widget.accessToken),
        repository.dues(widget.accessToken),
        repository.payments(widget.accessToken),
        repository.receipts(widget.accessToken),
      ]);
      if (!mounted) return;
      setState(() {
        membership = results[0] as Map<String, dynamic>;
        dues = results[1] as List<Map<String, dynamic>>;
        payments = results[2] as List<Map<String, dynamic>>;
        receipts = results[3] as List<Map<String, dynamic>>;
        loading = false;
      });
    } catch (exception) {
      if (!mounted) return;
      setState(() {
        error = exception;
        loading = false;
      });
    }
  }

  Future<void> _pay(Map<String, dynamic> due) async {
    final dueId = due['id'] as String?;
    if (dueId == null) return;
    setState(() => payingDueId = dueId);
    try {
      final key = 'wallet-${dueId}-${DateTime.now().microsecondsSinceEpoch}';
      final intent = await repository.createPaymentIntent(
        accessToken: widget.accessToken,
        dueId: dueId,
        idempotencyKey: key,
      );
      final paymentId = intent['id'] as String?;
      if (paymentId == null) throw StateError('Resposta de pagamento inválida');
      await repository.confirmMockPayment(accessToken: widget.accessToken, paymentId: paymentId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pagamento registado com sucesso.')));
      await _load();
    } catch (exception) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Não foi possível concluir o pagamento: $exception')));
      setState(() => payingDueId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(
        title: Text('Carteira', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800)),
        backgroundColor: b.backgroundColor,
        foregroundColor: b.textColor,
        elevation: 0,
      ),
      body: loading
          ? Center(child: CircularProgressIndicator(color: b.primaryColor))
          : error != null
              ? _error()
              : RefreshIndicator(onRefresh: _load, child: _body()),
    );
  }

  Widget _body() {
    final member = Map<String, dynamic>.from(membership?['member'] as Map? ?? const {});
    final memberships = (membership?['memberships'] as List<dynamic>? ?? const [])
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList();
    final activeMembership = memberships.isNotEmpty ? memberships.first : null;
    final pendingDues = dues.where((due) => _amount(due['outstandingAmount'] ?? due['amount']) > 0 && due['status'] != 'PAID' && due['status'] != 'CANCELLED').toList();

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
      children: [
        _memberCard(member, activeMembership),
        const SizedBox(height: 22),
        _sectionTitle('Quotas'),
        const SizedBox(height: 10),
        if (pendingDues.isEmpty) _emptyCard(Icons.verified_outlined, 'Não tens quotas pendentes.') else ...pendingDues.map(_dueCard),
        const SizedBox(height: 22),
        _sectionTitle('Pagamentos'),
        const SizedBox(height: 10),
        if (payments.isEmpty) _emptyCard(Icons.payments_outlined, 'Ainda não existem pagamentos.') else ...payments.take(8).map(_paymentCard),
        const SizedBox(height: 22),
        _sectionTitle('Recibos'),
        const SizedBox(height: 10),
        if (receipts.isEmpty) _emptyCard(Icons.receipt_long_outlined, 'Ainda não existem recibos.') else ...receipts.take(8).map(_receiptCard),
      ],
    );
  }

  Widget _memberCard(Map<String, dynamic> member, Map<String, dynamic>? membership) {
    final first = member['firstName'] as String? ?? '';
    final last = member['lastName'] as String? ?? '';
    final name = '$first $last'.trim();
    final number = member['memberNumber'] as String? ?? '—';
    final status = (membership?['status'] as String? ?? 'ACTIVE').toUpperCase();
    final validFrom = _date(membership?['validFrom']);
    final validUntil = _date(membership?['validUntil']);
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [b.secondaryColor, b.primaryColor]),
        borderRadius: BorderRadius.circular(26),
        boxShadow: [BoxShadow(color: b.primaryColor.withValues(alpha: .22), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          _clubLogo(),
          const Spacer(),
          const Icon(Icons.verified_user_outlined, color: Colors.white70),
        ]),
        const SizedBox(height: 26),
        const Text('CARTÃO DE SÓCIO', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
        const SizedBox(height: 7),
        Text(name.isEmpty ? 'Sócio' : name, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text('Nº $number', style: const TextStyle(color: Colors.white70, fontSize: 13)),
        const SizedBox(height: 18),
        Row(children: [
          _cardMeta('ESTADO', _statusLabel(status)),
          const Spacer(),
          if (validUntil != null) _cardMeta('VÁLIDO ATÉ', validUntil),
          if (validUntil == null && validFrom != null) _cardMeta('DESDE', validFrom),
        ]),
      ]),
    );
  }

  Widget _clubLogo() {
    final url = b.logoDarkUrl ?? b.logoUrl;
    return Container(width: 52, height: 52, padding: const EdgeInsets.all(6), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: url == null ? Icon(Icons.shield, color: b.primaryColor, size: 28) : Image.network(url, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Icon(Icons.shield, color: b.primaryColor)));
  }

  Widget _cardMeta(String label, String value) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: const TextStyle(color: Colors.white54, fontSize: 9, fontWeight: FontWeight.w700)), const SizedBox(height: 3), Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12))]);

  Widget _dueCard(Map<String, dynamic> due) {
    final amount = _amount(due['outstandingAmount'] ?? due['amount']);
    final currency = due['currency'] as String? ?? 'EUR';
    final status = due['status'] as String? ?? 'OPEN';
    final description = (due['description'] as String?)?.trim().isNotEmpty == true ? due['description'] as String : due['reference'] as String? ?? 'Quota';
    final paying = payingDueId == due['id'];
    return Container(margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(17), decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(18)), child: Column(children: [Row(children: [Icon(Icons.receipt_long_outlined, color: b.accentColor), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(description, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), const SizedBox(height: 3), Text('${_statusLabel(status)} · ${_date(due['dueDate']) ?? 'Sem data'}', style: TextStyle(color: b.mutedTextColor, fontSize: 12))])), Text('${amount.toStringAsFixed(2)} $currency', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w800))]), const SizedBox(height: 12), SizedBox(width: double.infinity, child: FilledButton(onPressed: paying ? null : () => _pay(due), style: FilledButton.styleFrom(backgroundColor: b.primaryColor), child: paying ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Pagar quota')))]));
  }

  Widget _paymentCard(Map<String, dynamic> payment) => _listCard(Icons.payments_outlined, payment['due']?['description'] as String? ?? 'Pagamento', '${_amount(payment['amount']).toStringAsFixed(2)} ${payment['currency'] ?? 'EUR'} · ${_statusLabel(payment['status'] as String? ?? '')}', _date(payment['paidAt'] ?? payment['createdAt']));

  Widget _receiptCard(Map<String, dynamic> receipt) => _listCard(Icons.receipt_long_outlined, 'Recibo ${receipt['receiptNumber'] ?? '—'}', '${_amount(receipt['amount']).toStringAsFixed(2)} ${receipt['currency'] ?? 'EUR'}', _date(receipt['issuedAt']));

  Widget _listCard(IconData icon, String title, String subtitle, String? date) => Container(margin: const EdgeInsets.only(bottom: 9), padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(16)), child: Row(children: [Icon(icon, color: b.primaryColor), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), const SizedBox(height: 3), Text(subtitle, style: TextStyle(color: b.mutedTextColor, fontSize: 12))])), if (date != null) Text(date, style: TextStyle(color: b.mutedTextColor, fontSize: 11))]));

  Widget _emptyCard(IconData icon, String text) => Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(18)), child: Row(children: [Icon(icon, color: b.primaryColor), const SizedBox(width: 12), Expanded(child: Text(text, style: TextStyle(color: b.mutedTextColor)))]));
  Widget _sectionTitle(String title) => Text(title, style: TextStyle(color: b.textColor, fontSize: 19, fontWeight: FontWeight.w800));
  Widget _error() => Center(child: Padding(padding: const EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.cloud_off_outlined, size: 48, color: b.mutedTextColor), const SizedBox(height: 12), Text('Não foi possível carregar a carteira.', textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), const SizedBox(height: 14), OutlinedButton(onPressed: _load, child: const Text('Tentar novamente'))])));

  double _amount(dynamic value) => double.tryParse(value?.toString() ?? '') ?? 0;
  String? _date(dynamic value) { if (value == null) return null; final date = DateTime.tryParse(value.toString())?.toLocal(); if (date == null) return null; return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}'; }
  String _statusLabel(String status) { switch (status.toUpperCase()) { case 'ACTIVE': return 'Ativo'; case 'OPEN': return 'Por pagar'; case 'OVERDUE': return 'Vencida'; case 'PARTIALLY_PAID': return 'Parcialmente paga'; case 'PAID': return 'Pago'; case 'PENDING': return 'Pendente'; case 'FAILED': return 'Falhou'; case 'CANCELLED': return 'Cancelado'; default: return status.isEmpty ? '—' : status; } }
}
