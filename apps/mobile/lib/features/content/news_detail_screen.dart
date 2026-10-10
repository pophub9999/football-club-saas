import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/branding/club_branding.dart';
import 'news_repository.dart';

class NewsDetailScreen extends StatefulWidget {
  const NewsDetailScreen({
    super.key,
    required this.branding,
    required this.api,
    required this.accessToken,
    required this.article,
  });

  final ClubBranding branding;
  final ApiClient api;
  final String accessToken;
  final NewsArticle article;

  @override
  State<NewsDetailScreen> createState() => _NewsDetailScreenState();
}

class _NewsDetailScreenState extends State<NewsDetailScreen> {
  NewsArticle? article;
  String? error;

  @override
  void initState() {
    super.initState();
    article = widget.article;
    _load();
  }

  Future<void> _load() async {
    try {
      final result = await NewsRepository(widget.api).get(
        widget.accessToken,
        widget.article.slug,
      );
      if (mounted) setState(() => article = result);
    } catch (_) {
      if (mounted) setState(() => error = 'Não foi possível carregar a notícia.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.branding;
    final a = article!;
    final published = a.publishedAt == null
        ? null
        : '${a.publishedAt!.day.toString().padLeft(2, '0')}/${a.publishedAt!.month.toString().padLeft(2, '0')}/${a.publishedAt!.year}';

    return Scaffold(
      backgroundColor: b.backgroundColor,
      appBar: AppBar(
        title: const Text('Notícia'),
        backgroundColor: b.backgroundColor,
        foregroundColor: b.textColor,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          children: [
            if (a.imageUrl != null)
              SizedBox(
                height: 240,
                width: double.infinity,
                child: Image.network(
                  a.imageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _placeholder(b),
                ),
              )
            else
              _placeholder(b),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 36),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (a.category != null)
                    Text(
                      a.category!.toUpperCase(),
                      style: TextStyle(
                        color: b.accentColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1,
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    a.title,
                    style: TextStyle(
                      color: b.textColor,
                      fontSize: 28,
                      height: 1.15,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  if (published != null) ...[
                    const SizedBox(height: 10),
                    Text(published, style: TextStyle(color: b.mutedTextColor)),
                  ],
                  if (error != null) ...[
                    const SizedBox(height: 14),
                    Text(error!, style: TextStyle(color: b.accentColor)),
                  ],
                  if (a.excerpt != null && a.excerpt!.trim().isNotEmpty) ...[
                    const SizedBox(height: 22),
                    Text(
                      a.excerpt!,
                      style: TextStyle(
                        color: b.textColor,
                        fontSize: 17,
                        height: 1.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  if (a.body != null && a.body!.trim().isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text(
                      a.body!,
                      style: TextStyle(
                        color: b.mutedTextColor,
                        fontSize: 16,
                        height: 1.65,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder(ClubBranding b) => Container(
        height: 180,
        color: b.secondaryColor,
        child: Icon(Icons.newspaper_outlined, size: 60, color: b.primaryColor),
      );
}
