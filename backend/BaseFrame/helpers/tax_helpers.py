"""
Helper utilities: Multi-Jurisdictional Tax Nexus, Currency, and Compounding Helpers
"""
import decimal
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple

class TaxEngineHelper:
    @staticmethod
    def round_currency(amount: float) -> float:
        d = Decimal(str(amount))
        return float(d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    @staticmethod
    def calculate_compound_liability(
        base_taxable_amount: float,
        rules: List[Dict[str, any]]
    ) -> Dict[str, any]:
        """
        Calculates complex tiered, progressive, and multi-jurisdictional tax liabilities:
        - Federal
        - State / Provincial
        - Municipal / Local
        - VAT / GST / Digital Services Tax
        """
        breakdown = []
        cumulative_tax = 0.0

        for rule in rules:
            rate = rule.get("rate_percentage", 0.0) / 100.0
            jurisdiction_type = rule.get("jurisdiction_type", "state")
            apportionment_ratio = rule.get("apportionment_ratio", 1.0)
            
            # Check if compounded or flat on taxable base
            is_cumulative = rule.get("is_cumulative_compounded", False)
            taxable_base = (base_taxable_amount + cumulative_tax) if is_cumulative else base_taxable_amount
            
            tax_liability = TaxEngineHelper.round_currency(taxable_base * rate * apportionment_ratio)
            cumulative_tax += tax_liability

            breakdown.append({
                "rule_id": rule.get("rule_id", "RULE_AUTO"),
                "jurisdiction_code": rule.get("jurisdiction_code"),
                "jurisdiction_name": rule.get("jurisdiction_name"),
                "jurisdiction_type": jurisdiction_type,
                "rate_percentage": rule.get("rate_percentage", 0.0),
                "taxable_base": taxable_base,
                "apportionment_ratio": apportionment_ratio,
                "tax_liability": tax_liability
            })

        total_liability = TaxEngineHelper.round_currency(cumulative_tax)
        effective_rate = round((total_liability / base_taxable_amount * 100.0), 4) if base_taxable_amount > 0 else 0.0

        return {
            "base_taxable_amount": base_taxable_amount,
            "total_tax_liability": total_liability,
            "net_effective_tax_rate": effective_rate,
            "jurisdiction_breakdown": breakdown
        }

    @staticmethod
    def evaluate_economic_nexus(sales_volume: float, transaction_count: int, threshold_sales: float = 100000.0, threshold_transactions: int = 200) -> Dict[str, any]:
        has_nexus = (sales_volume >= threshold_sales) or (transaction_count >= threshold_transactions)
        return {
            "has_nexus": has_nexus,
            "sales_threshold_met": sales_volume >= threshold_sales,
            "transaction_count_met": transaction_count >= threshold_transactions,
            "sales_progress_pct": min(100.0, round((sales_volume / threshold_sales) * 100.0, 1)),
            "transaction_progress_pct": min(100.0, round((transaction_count / threshold_transactions) * 100.0, 1))
        }
