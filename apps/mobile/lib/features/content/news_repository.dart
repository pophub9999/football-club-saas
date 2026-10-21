import '../../core/api/api_client.dart';

class NewsArticle {
  const NewsArticle({
    required this.id,
    required this.slug,
    required this.title,
    this.excerpt,
    this.body,
    this.imageUrl,
    this.category,
    this.publishedAt,
  });

  final String id;
  final String slug;
  final String title;
  final String? excerpt;
  final String? body;
  final String? imageUrl;
  final String? category;
  final DateTime? publishedAt;

  factory NewsArticle.fromJson(Map<String, dynamic> json) => NewsArticle(
        id: json['id'] as String,
        slug: json['slug'] as String,
        title: json['title'] as String,
        excerpt: json['excerpt'] as String?,
        body: json['body'] as String?,
        imageUrl: json['imageUrl'] as String?,
        category: json['category'] as String?,
        publishedAt: json['publishedAt'] == null
            ? null
            : DateTime.parse(json['publishedAt'] as String).toLocal(),
      );
}

class NewsRepository {
  NewsRepository(this.api);
  final ApiClient api;

  Future<List<NewsArticle>> latest(String accessToken, {int limit = 10}) async {
    final json = await api.getJson('/content/news?limit=$limit', accessToken: accessToken);
    if (json is! List) return const [];
    return json
        .map((item) => NewsArticle.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList(growable: false);
  }

  Future<NewsArticle> get(String accessToken, String idOrSlug) async {
    final json = await api.getJson(
      '/content/news/${Uri.encodeComponent(idOrSlug)}',
      accessToken: accessToken,
    );
    return NewsArticle.fromJson(Map<String, dynamic>.from(json as Map));
  }
}
