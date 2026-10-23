import { Router } from "express";
import { GeminiFeaturesService } from "./GeminiFeaturesService.ts";
import { AiOrchestratorDomain } from "./AiOrchestratorDomain.ts";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }
    const reply = await GeminiFeaturesService.chatWithTaxAssistant(message, history || [], context);
    res.json({ success: true, data: { reply } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

aiRouter.post("/voice-command", (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ success: false, message: "Voice transcript is required." });
  }
  const parsed = AiOrchestratorDomain.parseVoiceCommand(transcript);
  res.json({ success: true, data: parsed });
});

aiRouter.post("/explain-calculation", async (req, res) => {
  const { context } = req.body;
  const explanation = await GeminiFeaturesService.explainCalculationFormula(context || {});
  res.json({ success: true, data: { explanation } });
});
