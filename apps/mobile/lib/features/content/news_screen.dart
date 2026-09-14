import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'news_repository.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key, required this.branding, required this.api, required this.accessToken});
  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  List<NewsArticle> articles = const [];
  Object? error;
  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final result = await NewsRepository(widget.api).latest(widget.accessToken);
      if (mounted) setState(() { articles = result; error = null; });
    } catch (e) { if (mounted) setState(() => error = e); }
  }
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: widget.branding.backgroundColor,
    appBar: AppBar(title: const Text('Notícias'), backgroundColor: widget.branding.backgroundColor),
    body: RefreshIndicator(
      onRefresh: _load,
      child: error != null
        ? ListView(children: [Padding(padding: const EdgeInsets.all(32), child: Center(child: Text('Não foi possível carregar as notícias.', style: TextStyle(color: widget.branding.textColor))))])
        : articles.isEmpty
          ? ListView(children: [Padding(padding: const EdgeInsets.all(32), child: Center(child: Text('Ainda não existem notícias publicadas.', style: TextStyle(color: widget.branding.mutedTextColor))))])
          : ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: articles.length,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (_, index) => _card(articles[index]),
            ),
    ),
  );

  Widget _card(NewsArticle article) => Container(
    decoration: BoxDecoration(color: widget.branding.surfaceColor, borderRadius: BorderRadius.circular(18)),
    clipBehavior: Clip.antiAlias,
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (article.imageUrl != null) SizedBox(height: 170, width: double.infinity, child: Image.network(article.imageUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _placeholder())) else _placeholder(),
      Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (article.category != null) Text(article.category!.toUpperCase(), style: TextStyle(color: widget.branding.accentColor, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
        const SizedBox(height: 6),
        Text(article.title, style: TextStyle(color: widget.branding.textColor, fontSize: 18, fontWeight: FontWeight.w800)),
        if (article.excerpt != null) ...[const SizedBox(height: 7), Text(article.excerpt!, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(color: widget.branding.mutedTextColor, height: 1.35))],
      ])),
    ]),
  );
  Widget _placeholder() => Container(height: 130, width: double.infinity, color: widget.branding.secondaryColor, child: Icon(Icons.newspaper_outlined, size: 48, color: widget.branding.primaryColor));
}
