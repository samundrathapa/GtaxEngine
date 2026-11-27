import React, { useEffect, useState } from "react";
import { ApiController } from "../../api/controller.ts";
import { SupportedLang } from "../../utils/i18n.ts";
import { OneDoorRegistrationModal } from "./OneDoorRegistrationModal.tsx";
import { RefreshCw } from "lucide-react";

interface NewTaxpayerPanelProps {
  currentLang?: SupportedLang;
  onComplete: (taxpayerId: number) => void;
  onViewTaxpayers: () => void;
}

export const NewTaxpayerPanel: React.FC<NewTaxpayerPanelProps> = ({
  currentLang = "eng",
  onComplete,
  onViewTaxpayers
}) => {
  const [loading, setLoading] = useState(true);
  const [masters, setMasters] = useState<any>({
    fiscalYears: [],
    landRates: [],
    malpotRates: [],
    constructionRates: [],
    constructionTypes: [],
    units: [],
    depreciations: [],
    propertyRanges: []
  });

  useEffect(() => {
    let active = true;
    const loadMasters = async () => {
      setLoading(true);
      try {
        const res = await ApiController.getPropertyMasters();
        if (active && res.success && res.data) {
          setMasters(res.data);
        }
      } catch (err) {
        console.warn("Failed to load masters for New TaxPayer panel:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadMasters();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading New TaxPayer registration workspace...
        </p>
      </div>
    );
  }

  return (
    <OneDoorRegistrationModal
      inline={true}
      isOpen={true}
      masters={masters}
      currentLang={currentLang}
      onClose={onViewTaxpayers}
      onComplete={onComplete}
    />
  );
};
