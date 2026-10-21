import 'package:flutter/material.dart';
import '../../core/branding/club_branding.dart';
import 'tickets_repository.dart';

class TicketTransfersScreen extends StatefulWidget {
  const TicketTransfersScreen({super.key, required this.branding, required this.repository, required this.accessToken});
  final ClubBranding branding;
  final TicketsRepository repository;
  final String accessToken;
  @override State<TicketTransfersScreen> createState() => _TicketTransfersScreenState();
}

class _TicketTransfersScreenState extends State<TicketTransfersScreen> {
  List<IncomingTicketTransfer>? transfers;
  Object? error;
  String? accepting;

  @override void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final result = await widget.repository.incomingTransfers(widget.accessToken);
      if (mounted) setState(() { transfers = result; error = null; });
    } catch (e) { if (mounted) setState(() => error = e); }
  }

  Future<void> _accept(IncomingTicketTransfer transfer) async {
    setState(() => accepting = transfer.id);
    try {
      await widget.repository.acceptTransfer(accessToken: widget.accessToken, transferId: transfer.id);
      if (mounted) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Bilhete aceite com sucesso.'))); await _load(); }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Não foi possível aceitar: $e')));
    } finally { if (mounted) setState(() => accepting = null); }
  }

  @override Widget build(BuildContext context) {
    final b = widget.branding;
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(title: const Text('Transferências'), backgroundColor: b.backgroundColor),
      body: RefreshIndicator(onRefresh: _load, child: transfers == null
        ? ListView(children: [SizedBox(height: MediaQuery.sizeOf(context).height * .3), Center(child: error == null ? CircularProgressIndicator(color: b.primaryColor) : Text('Não foi possível carregar as transferências.', style: TextStyle(color: b.textColor)))])
        : transfers!.isEmpty
          ? ListView(children: [SizedBox(height: MediaQuery.sizeOf(context).height * .3), Center(child: Column(children: [Icon(Icons.swap_horiz, size: 52, color: b.mutedTextColor), const SizedBox(height: 12), Text('Sem transferências pendentes.', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700))]))])
          : ListView.separated(padding: const EdgeInsets.all(18), itemCount: transfers!.length, separatorBuilder: (_, __) => const SizedBox(height: 14), itemBuilder: (_, i) {
              final t = transfers![i];
              final d = t.ticket.event.startsAt.toLocal();
              final place = [t.ticket.section == null ? null : 'Setor ${t.ticket.section}', t.ticket.row == null ? null : 'Fila ${t.ticket.row}', t.ticket.seat == null ? null : 'Lugar ${t.ticket.seat}'].whereType<String>().join(' · ');
              return Card(color: b.surfaceColor, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), child: Padding(padding: const EdgeInsets.all(18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Bilhete recebido', style: TextStyle(color: b.primaryColor, fontWeight: FontWeight.w800)), const SizedBox(height: 8),
                Text(t.ticket.event.name, style: TextStyle(color: b.textColor, fontSize: 18, fontWeight: FontWeight.w800)), const SizedBox(height: 6),
                Text('${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year} · ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}', style: TextStyle(color: b.mutedTextColor)),
                if (t.ticket.event.venueName != null) Text(t.ticket.event.venueName!, style: TextStyle(color: b.mutedTextColor)),
                if (place.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(place, style: TextStyle(color: b.textColor, fontWeight: FontWeight.w600))),
                if (t.senderEmail != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text('Enviado por ${t.senderEmail}', style: TextStyle(color: b.mutedTextColor))),
                const SizedBox(height: 14),
                SizedBox(width: double.infinity, child: ElevatedButton(onPressed: accepting == null ? () => _accept(t) : null, style: ElevatedButton.styleFrom(backgroundColor: b.primaryColor, foregroundColor: Colors.white), child: accepting == t.id ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Aceitar bilhete'))),
              ])));
            }),
      ),
    );
  }
}
