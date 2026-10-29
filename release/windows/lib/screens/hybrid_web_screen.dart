import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/api_service.dart';

class HybridWebScreen extends StatefulWidget {
  const HybridWebScreen({Key? key}) : super(key: key);

  @override
  State<HybridWebScreen> createState() => _HybridWebScreenState();
}

class _HybridWebScreenState extends State<HybridWebScreen> {
  final ApiService _api = ApiService();
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    final targetUrl = _api.baseUrl.isNotEmpty ? _api.baseUrl : 'http://127.0.0.1:3000';

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _isLoading = true),
          onPageFinished: (_) => setState(() => _isLoading = false),
        ),
      )
      ..loadRequest(Uri.parse(targetUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Full Portal (Single Common Entry)"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _controller.reload(),
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 12),
                  Text("Loading gtax Web Portal through Common Entry Point..."),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
