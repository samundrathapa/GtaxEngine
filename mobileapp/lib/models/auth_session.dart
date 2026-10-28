import 'dart:convert';

/// Authentication Session & User Identity for Mobile App
class AuthSession {
  final String token;
  final int userId;
  final String username;
  final String fullname;
  final String role;
  final String email;
  final String mobile;
  final int wardNo;
  final String employeeId;
  final String photoPath;
  final bool isGuest;

  AuthSession({
    required this.token,
    required this.userId,
    required this.username,
    required this.fullname,
    required this.role,
    this.email = '',
    this.mobile = '',
    this.wardNo = 1,
    this.employeeId = '',
    this.photoPath = '',
    this.isGuest = false,
  });

  bool get isAuthenticated => !isGuest && token.isNotEmpty;
  bool get isOfficer => !isGuest && (role == 'superadmin' || role == 'admin' || role == 'operator');
  bool get isAdmin => !isGuest && (role == 'superadmin' || role == 'admin');
  bool get isSuperAdmin => !isGuest && role == 'superadmin';

  String get roleDisplayName {
    if (isGuest) return 'Public Citizen / Guest';
    switch (role.toLowerCase()) {
      case 'superadmin':
        return 'Super Administrator';
      case 'admin':
        return 'Municipal Tax Admin';
      case 'operator':
        return 'Tax Revenue Officer';
      case 'user':
        return 'Tax Analyst';
      default:
        return role.toUpperCase();
    }
  }

  static AuthSession guest() {
    return AuthSession(
      token: '',
      userId: 0,
      username: 'citizen',
      fullname: 'Public Citizen (सर्वसाधारण नागरिक)',
      role: 'guest',
      email: 'citizen@municipality.gov.np',
      mobile: '',
      wardNo: 1,
      employeeId: 'PUBLIC-GUEST',
      photoPath: '',
      isGuest: true,
    );
  }

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    if (json['is_guest'] == true) {
      return AuthSession.guest();
    }

    final user = json['user'] is Map<String, dynamic> ? json['user'] : json;
    final roleObj = json['role'];
    String roleStr = 'operator';
    if (roleObj is Map<String, dynamic>) {
      roleStr = roleObj['role_name'] ?? 'operator';
    } else if (roleObj is String) {
      roleStr = roleObj;
    } else if (user['role'] is String) {
      roleStr = user['role'];
    }

    return AuthSession(
      token: json['token'] ?? '',
      userId: user['id'] is int ? user['id'] : int.tryParse('${user['id']}') ?? 0,
      username: user['username'] ?? user['email']?.split('@')[0] ?? 'officer',
      fullname: user['fullname'] ?? 'Municipal Officer',
      role: roleStr,
      email: user['email'] ?? '',
      mobile: user['mobile'] ?? '',
      wardNo: user['ward_no'] is int ? user['ward_no'] : int.tryParse('${user['ward_no']}') ?? 1,
      employeeId: user['employee_id'] ?? '',
      photoPath: user['photo_path'] ?? '',
      isGuest: json['is_guest'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'is_guest': isGuest,
      'user': {
        'id': userId,
        'username': username,
        'fullname': fullname,
        'role': role,
        'email': email,
        'mobile': mobile,
        'ward_no': wardNo,
        'employee_id': employeeId,
        'photo_path': photoPath,
      },
      'role': role,
    };
  }
}
