import 'package:flutter/material.dart';
import '../../core/branding/club_branding.dart';
import 'tickets_repository.dart';

class TicketTransferScreen extends StatefulWidget {
  const TicketTransferScreen({super.key, required this.ticket, required this.branding, required this.repository, required this.accessToken});
  final Ticket ticket;
  final ClubBranding branding;
  final TicketsRepository repository;
  final String accessToken;
  @override State<TicketTransferScreen> createState() => _TicketTransferScreenState();
}

class _TicketTransferScreenState extends State<TicketTransferScreen> {
  final email = TextEditingController();
  final memberNumber = TextEditingController();
  bool sending = false;
  @override void dispose() { email.dispose(); memberNumber.dispose(); super.dispose(); }

  Future<void> _send() async {
    final e = email.text.trim(); final m = memberNumber.text.trim();
    if ((e.isEmpty) == (m.isEmpty)) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Indica email ou número de sócio, mas não ambos.'))); return; }
    setState(() => sending = true);
    try {
      await widget.repository.transfer(accessToken: widget.accessToken, ticketId: widget.ticket.id, recipientEmail: e.isEmpty ? null : e, recipientMemberNumber: m.isEmpty ? null : m);
      if (mounted) Navigator.of(context).pop(true);
    } catch (err) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Não foi possível transferir: $err'))); }
    finally { if (mounted) setState(() => sending = false); }
  }

  @override Widget build(BuildContext context) {
    final b = widget.branding;
    final input = InputDecoration(filled: true, fillColor: b.surfaceColor, labelStyle: TextStyle(color: b.mutedTextColor), border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none));
    return Scaffold(backgroundColor: b.backgroundColor, appBar: AppBar(title: const Text('Transferir bilhete'), backgroundColor: b.backgroundColor), body: ListView(padding: const EdgeInsets.all(20), children: [
      Text(widget.ticket.event.name, style: TextStyle(color: b.textColor, fontSize: 20, fontWeight: FontWeight.w800)), const SizedBox(height: 8),
      Text('O destinatário terá de aceitar a transferência. O pedido expira em 48 horas.', style: TextStyle(color: b.mutedTextColor)), const SizedBox(height: 24),
      TextField(controller: email, keyboardType: TextInputType.emailAddress, style: TextStyle(color: b.textColor), decoration: input.copyWith(labelText: 'Email do destinatário')),
      const SizedBox(height: 14),
      TextField(controller: memberNumber, style: TextStyle(color: b.textColor), decoration: input.copyWith(labelText: 'Ou número de sócio')),
      const SizedBox(height: 24),
      SizedBox(width: double.infinity, child: ElevatedButton(onPressed: sending ? null : _send, style: ElevatedButton.styleFrom(backgroundColor: b.primaryColor, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 15)), child: sending ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Enviar transferência'))),
    ]));
  }
}
