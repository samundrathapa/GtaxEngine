class AuthSession {
  final String token;
  final int userId;
  final String username;
  final String fullname;
  final String role;
  final int wardNo;

  AuthSession({
    required this.token,
    required this.userId,
    required this.username,
    required this.fullname,
    required this.role,
    required this.wardNo,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final user = json['user'] ?? {};
    return AuthSession(
      token: json['token'] ?? '',
      userId: user['id'] ?? 0,
      username: user['username'] ?? '',
      fullname: user['fullname'] ?? '',
      role: user['role'] ?? 'OFFICER',
      wardNo: user['ward_no'] ?? 1,
    );
  }
}
