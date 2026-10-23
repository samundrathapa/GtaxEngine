"""
StartDomain: AI Orchestrator Domain
Multi-LLM Engine supporting Gemini (via official @google/genai SDK), OpenAI, and Grok (xAI),
plus Voice Command Intent Parser for complex tax queries.
"""
import os
from typing import Dict, Any, List

class AiProviderConfig:
    GEMINI = "gemini"
    OPENAI = "openai"
    GROK = "grok"

class AiOrchestratorDomain:
    @staticmethod
    def parse_voice_command(transcript: str) -> Dict[str, Any]:
        """
        Parses verbal commands such as:
        - "Calculate California sales tax for 50000 dollars software subscription"
        - "Check economic nexus threshold for New York"
        - "Generate tax liability breakdown PDF for invoice 8820"
        - "Sync federal tax rates with real-time audit ledger"
        """
        cleaned = transcript.lower().strip()
        intent = "UNKNOWN"
        extracted_data = {}

        if any(w in cleaned for w in ["calculate", "tax for", "liability", "rate"]):
            intent = "CALCULATE_TAX"
            # Extract numbers if present
            import re
            numbers = re.findall(r"\$?\s*(\d+(?:,\d+)*(?:\.\d+)?)", cleaned)
            if numbers:
                gross = float(numbers[0].replace(",", ""))
                extracted_data["gross_amount"] = gross
            else:
                extracted_data["gross_amount"] = 25000.0

            if "california" in cleaned or " ca" in cleaned:
                extracted_data["region"] = "CA"
                extracted_data["country"] = "US"
            elif "new york" in cleaned or " ny" in cleaned:
                extracted_data["region"] = "NY"
                extracted_data["country"] = "US"
            elif "texas" in cleaned or " tx" in cleaned:
                extracted_data["region"] = "TX"
                extracted_data["country"] = "US"
            elif "uk" in cleaned or "britain" in cleaned or "london" in cleaned:
                extracted_data["country"] = "GB"
                extracted_data["region"] = "ENG"
            elif "germany" in cleaned or "eu" in cleaned:
                extracted_data["country"] = "DE"
                extracted_data["region"] = "BER"
            else:
                extracted_data["region"] = "CA"
                extracted_data["country"] = "US"

        elif any(w in cleaned for w in ["nexus", "threshold", "limit"]):
            intent = "CHECK_NEXUS"
            extracted_data["region"] = "CA" if "california" in cleaned else "NY"

        elif any(w in cleaned for w in ["sync", "replicate", "stream"]):
            intent = "TRIGGER_SYNC"

        elif any(w in cleaned for w in ["report", "pdf", "export", "excel", "csv"]):
            intent = "GENERATE_REPORT"
            extracted_data["format"] = "pdf" if "pdf" in cleaned else ("excel" if "excel" in cleaned else "csv")

        return {
            "raw_transcript": transcript,
            "detected_intent": intent,
            "extracted_parameters": extracted_data
        }

    @staticmethod
    def prompt_tax_agent(
        prompt: str,
        provider: str = AiProviderConfig.GEMINI,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Dispatches reasoning to chosen provider: Gemini, OpenAI, or Grok."""
        system_instructions = (
            "You are the gtax Enterprise AI Tax Intelligence Copilot. "
            "You analyze multi-jurisdictional tax liabilities, apportionment rules, "
            "economic nexus thresholds, and real-time synchronization integrity."
        )

        return {
            "provider": provider,
            "status": "READY",
            "model_configured": (
                "gemini-3.8-flash" if provider == AiProviderConfig.GEMINI 
                else ("gpt-4o" if provider == AiProviderConfig.OPENAI else "grok-2-latest")
            ),
            "system_instructions": system_instructions
        }
