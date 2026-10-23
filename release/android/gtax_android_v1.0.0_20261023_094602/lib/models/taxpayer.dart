/// Data models for Taxpayer and Property Portfolio
class Taxpayer {
  final int id;
  final String code;
  final String fullname;
  final String mobileNo;
  final int wardNo;
  final int taxTypeId;
  final String? panVatNo;
  final String? citizenshipNo;
  final String? email;

  Taxpayer({
    required this.id,
    required this.code,
    required this.fullname,
    required this.mobileNo,
    required this.wardNo,
    required this.taxTypeId,
    this.panVatNo,
    this.citizenshipNo,
    this.email,
  });

  factory Taxpayer.fromJson(Map<String, dynamic> json) {
    return Taxpayer(
      id: json['id'] ?? 0,
      code: json['code'] ?? '',
      fullname: json['fullanme'] ?? json['fullname'] ?? '',
      mobileNo: json['mobile_no'] ?? json['mobileNo'] ?? '',
      wardNo: json['ward_no'] ?? 1,
      taxTypeId: json['tax_type_id'] ?? 1,
      panVatNo: json['pan_vat_no'],
      citizenshipNo: json['citizenship_no'],
      email: json['email'],
    );
  }
}

class LandParcel {
  final int id;
  final int taxpayerId;
  final String kittaNumber;
  final String mothNumber;
  final int wardNo;
  final double areaSqfeet;
  final double assessedValuation;
  final bool includeInEvaluation;

  LandParcel({
    required this.id,
    required this.taxpayerId,
    required this.kittaNumber,
    required this.mothNumber,
    required this.wardNo,
    required this.areaSqfeet,
    required this.assessedValuation,
    required this.includeInEvaluation,
  });

  factory LandParcel.fromJson(Map<String, dynamic> json) {
    return LandParcel(
      id: json['id'] ?? 0,
      taxpayerId: json['taxpayer_id'] ?? 0,
      kittaNumber: json['kitta_number'] ?? '',
      mothNumber: json['moth_number'] ?? '',
      wardNo: json['ward_no'] ?? 1,
      areaSqfeet: (json['area_sqfeet'] as num?)?.toDouble() ?? 0.0,
      assessedValuation: (json['assessed_valuation'] as num?)?.toDouble() ?? 0.0,
      includeInEvaluation: json['include_in_evaluation'] ?? true,
    );
  }
}

class HouseStructure {
  final int id;
  final int taxpayerId;
  final String houseNumber;
  final String houseName;
  final String kittaNumber;
  final double totalAreaSqft;
  final double assessedValuation;

  HouseStructure({
    required this.id,
    required this.taxpayerId,
    required this.houseNumber,
    required this.houseName,
    required this.kittaNumber,
    required this.totalAreaSqft,
    required this.assessedValuation,
  });

  factory HouseStructure.fromJson(Map<String, dynamic> json) {
    return HouseStructure(
      id: json['id'] ?? 0,
      taxpayerId: json['taxpayer_id'] ?? 0,
      houseNumber: json['house_number'] ?? '',
      houseName: json['house_name'] ?? 'Residential House',
      kittaNumber: json['kitta_number'] ?? '',
      totalAreaSqft: (json['total_area_sqft'] as num?)?.toDouble() ?? 0.0,
      assessedValuation: (json['assessed_valuation'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class FloorSlab {
  final int id;
  final int houseId;
  final String floorName;
  final double areaInSqft;
  final double depreciationRate;
  final double floorAssessedValuation;

  FloorSlab({
    required this.id,
    required this.houseId,
    required this.floorName,
    required this.areaInSqft,
    required this.depreciationRate,
    required this.floorAssessedValuation,
  });

  factory FloorSlab.fromJson(Map<String, dynamic> json) {
    return FloorSlab(
      id: json['id'] ?? 0,
      houseId: json['house_id'] ?? 0,
      floorName: json['floor_name'] ?? 'Ground Floor',
      areaInSqft: (json['area_in_sqft'] as num?)?.toDouble() ?? 0.0,
      depreciationRate: (json['depreciation_rate'] as num?)?.toDouble() ?? 0.0,
      floorAssessedValuation: (json['floor_assessed_valuation'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ValuationSummary {
  final double totalLandValuation;
  final double totalHouseValuation;
  final double combinedTotalValuation;
  final double calculatedTaxLiability;
  final double rebateApplied;
  final double netPayableTax;
  final String currency;

  ValuationSummary({
    required this.totalLandValuation,
    required this.totalHouseValuation,
    required this.combinedTotalValuation,
    required this.calculatedTaxLiability,
    required this.rebateApplied,
    required this.netPayableTax,
    required this.currency,
  });

  factory ValuationSummary.fromJson(Map<String, dynamic> json) {
    return ValuationSummary(
      totalLandValuation: (json['totalLandValuation'] as num?)?.toDouble() ?? 0.0,
      totalHouseValuation: (json['totalHouseValuation'] as num?)?.toDouble() ?? 0.0,
      combinedTotalValuation: (json['combinedTotalValuation'] as num?)?.toDouble() ?? 0.0,
      calculatedTaxLiability: (json['calculatedTaxLiability'] as num?)?.toDouble() ?? 0.0,
      rebateApplied: (json['rebateApplied'] as num?)?.toDouble() ?? 0.0,
      netPayableTax: (json['netPayableTax'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] ?? 'NPR',
    );
  }
}

class TaxpayerDossier {
  final Taxpayer taxpayer;
  final List<LandParcel> lands;
  final List<HouseStructure> houses;
  final List<FloorSlab> floors;
  final ValuationSummary valuationSummary;

  TaxpayerDossier({
    required this.taxpayer,
    required this.lands,
    required this.houses,
    required this.floors,
    required this.valuationSummary,
  });

  factory TaxpayerDossier.fromJson(Map<String, dynamic> json) {
    return TaxpayerDossier(
      taxpayer: Taxpayer.fromJson(json['taxpayer'] ?? {}),
      lands: (json['lands'] as List? ?? []).map((l) => LandParcel.fromJson(l)).toList(),
      houses: (json['houses'] as List? ?? []).map((h) => HouseStructure.fromJson(h)).toList(),
      floors: (json['floors'] as List? ?? []).map((f) => FloorSlab.fromJson(f)).toList(),
      valuationSummary: ValuationSummary.fromJson(json['valuationSummary'] ?? {}),
    );
  }
}
