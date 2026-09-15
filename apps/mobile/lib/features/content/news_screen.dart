import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'news_detail_screen.dart';
import 'news_repository.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({
    super.key,
    required this.branding,
    required this.api,
    required this.accessToken,
  });

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
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final result = await NewsRepository(widget.api).latest(widget.accessToken);
      if (mounted) setState(() { articles = result; error = null; });
    } catch (e) {
      if (mounted) setState(() => error = e);
    }
  }

  void _open(NewsArticle article) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => NewsDetailScreen(
          branding: widget.branding,
          api: widget.api,
          accessToken: widget.accessToken,
          article: article,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(
        title: const Text('Notícias'),
        backgroundColor: b.backgroundColor,
        foregroundColor: b.textColor,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: error != null
            ? ListView(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(32),
                    child: Center(
                      child: Text(
                        'Não foi possível carregar as notícias.',
                        style: TextStyle(color: b.textColor),
                      ),
                    ),
                  ),
                ],
              )
            : articles.isEmpty
                ? ListView(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(32),
                        child: Center(
                          child: Text(
                            'Ainda não existem notícias publicadas.',
                            style: TextStyle(color: b.mutedTextColor),
                          ),
                        ),
                      ),
                    ],
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: articles.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (_, index) => _card(articles[index]),
                  ),
      ),
    );
  }

  Widget _card(NewsArticle article) {
    final b = widget.branding;
    return InkWell(
      onTap: () => _open(article),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        decoration: BoxDecoration(
          color: b.surfaceColor,
          borderRadius: BorderRadius.circular(18),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (article.imageUrl != null)
              SizedBox(
                height: 170,
                width: double.infinity,
                child: Image.network(
                  article.imageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _placeholder(),
                ),
              )
            else
              _placeholder(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (article.category != null)
                    Text(
                      article.category!.toUpperCase(),
                      style: TextStyle(
                        color: b.accentColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1,
                      ),
                    ),
                  const SizedBox(height: 6),
                  Text(
                    article.title,
                    style: TextStyle(
                      color: b.textColor,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (article.excerpt != null) ...[
                    const SizedBox(height: 7),
                    Text(
                      article.excerpt!,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: b.mutedTextColor, height: 1.35),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        'Ler notícia',
                        style: TextStyle(
                          color: b.primaryColor,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(Icons.arrow_forward, size: 17, color: b.primaryColor),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() {
    final b = widget.branding;
    return Container(
      height: 130,
      width: double.infinity,
      color: b.secondaryColor,
      child: Icon(Icons.newspaper_outlined, size: 48, color: b.primaryColor),
    );
  }
}
