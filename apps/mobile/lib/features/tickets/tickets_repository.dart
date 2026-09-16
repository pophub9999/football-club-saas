import '../../core/api/api_client.dart';

class TicketEvent {
  TicketEvent({required this.id, required this.name, required this.startsAt, this.endsAt, this.venueName, this.venueAddress});
  final String id;
  final String name;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String? venueName;
  final String? venueAddress;
  factory TicketEvent.fromJson(Map<String, dynamic> json) => TicketEvent(id: json['id'] as String, name: json['name'] as String, startsAt: DateTime.parse(json['startsAt'] as String), endsAt: json['endsAt'] == null ? null : DateTime.parse(json['endsAt'] as String), venueName: json['venueName'] as String?, venueAddress: json['venueAddress'] as String?);
}

class Ticket {
  Ticket({required this.id, required this.externalTicketId, required this.status, required this.event, this.ticketNumber, this.holderName, this.section, this.row, this.seat, this.issuedAt, this.validUntil});
  final String id;
  final String externalTicketId;
  final String status;
  final TicketEvent event;
  final String? ticketNumber;
  final String? holderName;
  final String? section;
  final String? row;
  final String? seat;
  final DateTime? issuedAt;
  final DateTime? validUntil;
  factory Ticket.fromJson(Map<String, dynamic> json) => Ticket(id: json['id'] as String, externalTicketId: json['externalTicketId'] as String, status: json['status'] as String, event: TicketEvent.fromJson(json['event'] as Map<String, dynamic>), ticketNumber: json['ticketNumber'] as String?, holderName: json['holderName'] as String?, section: json['section'] as String?, row: json['row'] as String?, seat: json['seat'] as String?, issuedAt: json['issuedAt'] == null ? null : DateTime.parse(json['issuedAt'] as String), validUntil: json['validUntil'] == null ? null : DateTime.parse(json['validUntil'] as String));
}

class TicketQr {
  TicketQr({required this.ticketId, required this.active, this.payload, this.expiresAt});
  final String ticketId;
  final bool active;
  final String? payload;
  final DateTime? expiresAt;
  factory TicketQr.fromJson(Map<String, dynamic> json) => TicketQr(ticketId: json['ticketId'] as String, active: json['active'] as bool? ?? false, payload: json['payload'] as String?, expiresAt: json['expiresAt'] == null ? null : DateTime.parse(json['expiresAt'] as String));
}

class IncomingTicketTransfer {
  IncomingTicketTransfer({required this.id, required this.expiresAt, required this.ticket, this.senderEmail});
  final String id;
  final DateTime expiresAt;
  final Ticket ticket;
  final String? senderEmail;
  factory IncomingTicketTransfer.fromJson(Map<String, dynamic> json) {
    final ticketJson = Map<String, dynamic>.from(json['ticket'] as Map);
    return IncomingTicketTransfer(id: json['id'] as String, expiresAt: DateTime.parse(json['expiresAt'] as String), ticket: Ticket.fromJson(ticketJson), senderEmail: (json['fromUser'] as Map?)?['email'] as String?);
  }
}

class TicketsRepository {
  TicketsRepository(this.api);
  final ApiClient api;

  Future<List<Ticket>> list(String accessToken) async {
    final data = await api.getJson('/tickets', accessToken: accessToken);
    return (data as List<dynamic>).map((item) => Ticket.fromJson(item as Map<String, dynamic>)).toList();
  }
  Future<Ticket> get(String accessToken, String ticketId) async => Ticket.fromJson(await api.getJson('/tickets/$ticketId', accessToken: accessToken) as Map<String, dynamic>);
  Future<TicketQr> qr(String accessToken, String ticketId) async => TicketQr.fromJson(await api.getJson('/tickets/$ticketId/qr', accessToken: accessToken) as Map<String, dynamic>);
  Future<List<IncomingTicketTransfer>> incomingTransfers(String accessToken) async {
    final data = await api.getJson('/tickets/transfers/incoming', accessToken: accessToken);
    return (data as List<dynamic>).map((item) => IncomingTicketTransfer.fromJson(item as Map<String, dynamic>)).toList();
  }
  Future<Map<String, dynamic>> transfer({required String accessToken, required String ticketId, String? recipientEmail, String? recipientMemberNumber}) async {
    final payload = <String, dynamic>{};
    if (recipientEmail != null && recipientEmail.trim().isNotEmpty) payload['recipientEmail'] = recipientEmail.trim();
    if (recipientMemberNumber != null && recipientMemberNumber.trim().isNotEmpty) payload['recipientMemberNumber'] = recipientMemberNumber.trim();
    return api.postJson('/tickets/$ticketId/transfer', payload, accessToken: accessToken);
  }
  Future<Map<String, dynamic>> acceptTransfer({required String accessToken, required String transferId}) => api.postJson('/tickets/transfers/$transferId/accept', const {}, accessToken: accessToken);
}
