import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'tickets_repository.dart';

class TicketsScreen extends StatefulWidget {
  const TicketsScreen({super.key, required this.branding, required this.api, required this.accessToken});

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;

  @override
  State<TicketsScreen> createState() => _TicketsScreenState();
}

class _TicketsScreenState extends State<TicketsScreen> {
  late final TicketsRepository repository = TicketsRepository(widget.api);
  List<Ticket>? tickets;
  Object? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final result = await repository.list(widget.accessToken);
      if (mounted) setState(() { tickets = result; error = null; });
    } catch (e) {
      if (mounted) setState(() => error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(title: const Text('Bilhetes'), backgroundColor: b.backgroundColor),
      body: RefreshIndicator(
        onRefresh: _load,
        child: tickets == null
            ? ListView(children: [SizedBox(height: MediaQuery.sizeOf(context).height * .3), Center(child: error == null ? CircularProgressIndicator(color: b.primaryColor) : Column(children: [Icon(Icons.confirmation_number_outlined, color: b.mutedTextColor, size: 46), const SizedBox(height: 12), Text('Não foi possível carregar os bilhetes.', style: TextStyle(color: b.textColor)), const SizedBox(height: 12), OutlinedButton(onPressed: _load, child: const Text('Tentar novamente'))]))])
            : tickets!.isEmpty
                ? ListView(children: [SizedBox(height: MediaQuery.sizeOf(context).height * .3), Center(child: Column(children: [Icon(Icons.confirmation_number_outlined, color: b.mutedTextColor, size: 54), const SizedBox(height: 12), Text('Ainda não tens bilhetes.', style: TextStyle(color: b.textColor, fontWeight: FontWeight.w700)), const SizedBox(height: 5), Text('Os teus bilhetes aparecerão aqui.', style: TextStyle(color: b.mutedTextColor))]))])
                : ListView.separated(
                    padding: const EdgeInsets.all(18),
                    itemCount: tickets!.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (_, index) => _TicketCard(ticket: tickets![index], branding: b, onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => TicketDetailScreen(ticket: tickets![index], branding: b, repository: repository, accessToken: widget.accessToken))),
                  ),
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket, required this.branding, required this.onTap});
  final Ticket ticket;
  final ClubBranding branding;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final date = ticket.event.startsAt.toLocal();
    return Card(
      color: branding.surfaceColor,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(ticket.event.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: branding.textColor, fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            Text('${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} · ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}', style: TextStyle(color: branding.mutedTextColor)),
            if (ticket.event.venueName != null) ...[const SizedBox(height: 4), Text(ticket.event.venueName!, style: TextStyle(color: branding.mutedTextColor))],
            const SizedBox(height: 14),
            Row(children: [Icon(Icons.event_seat_outlined, color: branding.primaryColor, size: 19), const SizedBox(width: 8), Text(ticket.section == null ? 'Lugar por definir' : 'Setor ${ticket.section}${ticket.row == null ? '' : ' · Fila ${ticket.row}'}${ticket.seat == null ? '' : ' · Lugar ${ticket.seat}'}', style: TextStyle(color: branding.textColor, fontWeight: FontWeight.w600)), const Spacer(), Icon(Icons.chevron_right, color: branding.mutedTextColor)]),
          ]),
        ),
      ),
    );
  }
}

class TicketDetailScreen extends StatefulWidget {
  const TicketDetailScreen({super.key, required this.ticket, required this.branding, required this.repository, required this.accessToken});
  final Ticket ticket;
  final ClubBranding branding;
  final TicketsRepository repository;
  final String accessToken;

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  TicketQr? qr;
  Object? error;

  @override
  void initState() {
    super.initState();
    _loadQr();
  }

  Future<void> _loadQr() async {
    try {
      final result = await widget.repository.qr(widget.accessToken, widget.ticket.id);
      if (mounted) setState(() => qr = result);
    } catch (e) {
      if (mounted) setState(() => error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    final ticket = widget.ticket;
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(title: const Text('Bilhete digital'), backgroundColor: b.backgroundColor),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(color: b.surfaceColor, borderRadius: BorderRadius.circular(26)),
            child: Column(children: [
              Text(ticket.event.name, textAlign: TextAlign.center, style: TextStyle(color: b.textColor, fontSize: 20, fontWeight: FontWeight.w800)),
              const SizedBox(height: 7),
              Text(_date(ticket.event.startsAt), style: TextStyle(color: b.mutedTextColor)),
              if (ticket.event.venueName != null) ...[const SizedBox(height: 4), Text(ticket.event.venueName!, style: TextStyle(color: b.mutedTextColor))],
              const SizedBox(height: 24),
              if (qr?.active == true && qr?.payload != null)
                Container(padding: const EdgeInsets.all(14), color: Colors.white, child: QrImageView(data: qr!.payload!, version: QrVersions.auto, size: 220))
              else if (error != null)
                Text('Não foi possível gerar o código de entrada.', textAlign: TextAlign.center, style: TextStyle(color: b.mutedTextColor))
              else
                SizedBox(width: 220, height: 220, child: Center(child: CircularProgressIndicator(color: b.primaryColor))),
              const SizedBox(height: 22),
              _info('Titular', ticket.holderName ?? 'Sócio'),
              _info('Bilhete', ticket.ticketNumber ?? ticket.externalTicketId),
              _info('Lugar', [ticket.section == null ? null : 'Setor ${ticket.section}', ticket.row == null ? null : 'Fila ${ticket.row}', ticket.seat == null ? null : 'Lugar ${ticket.seat}'].whereType<String>().join(' · ')),
              _info('Estado', _status(ticket.status)),
            ]),
          ),
          const SizedBox(height: 16),
          Text('Apresenta este código à entrada. Em produção, o código será assinado/rotativo para reduzir risco de cópia.', textAlign: TextAlign.center, style: TextStyle(color: b.mutedTextColor, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _info(String label, String value) => Padding(padding: const EdgeInsets.only(top: 10), child: Row(children: [Text('$label: ', style: TextStyle(color: widget.branding.mutedTextColor)), Expanded(child: Text(value.isEmpty ? '—' : value, textAlign: TextAlign.right, style: TextStyle(color: widget.branding.textColor, fontWeight: FontWeight.w700)))]));
  String _date(DateTime value) { final d = value.toLocal(); return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year} · ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}'; }
  String _status(String value) => switch (value) { 'ACTIVE' => 'Ativo', 'USED' => 'Utilizado', 'CANCELLED' => 'Cancelado', 'EXPIRED' => 'Expirado', _ => 'Emitido' };
}
