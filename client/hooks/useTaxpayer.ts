/**
 * gtax Enterprise - Next.js useTaxpayer Hook
 * Manages taxpayer registration state, search, and today's list
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/apiClient.ts";
import { TaxpayerRecord } from "../types.ts";

export function useTaxpayer() {
  const [taxpayers, setTaxpayers] = useState<TaxpayerRecord[]>([]);
  const [todayTaxpayers, setTodayTaxpayers] = useState<TaxpayerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxpayers = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getTaxpayers(query);
      if (res.success && Array.isArray(res.data)) {
        setTaxpayers(res.data);
      } else {
        setError(res.message || "Failed to load taxpayers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching taxpayers");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayTaxpayers = useCallback(async () => {
    try {
      const res = await apiClient.getTodayTaxpayers();
      if (res.success && Array.isArray(res.data)) {
        setTodayTaxpayers(res.data);
      }
    } catch (err) {
      console.error("Failed to load today taxpayers:", err);
    }
  }, []);

  const createTaxpayer = async (payload: Partial<TaxpayerRecord>) => {
    setLoading(true);
    try {
      const res = await apiClient.createTaxpayer(payload);
      if (res.success) {
        await fetchTaxpayers();
        await fetchTodayTaxpayers();
        return res.data;
      } else {
        throw new Error(res.message || "Failed to save taxpayer");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxpayers();
    fetchTodayTaxpayers();
  }, [fetchTaxpayers, fetchTodayTaxpayers]);

  return {
    taxpayers,
    todayTaxpayers,
    loading,
    error,
    fetchTaxpayers,
    fetchTodayTaxpayers,
    createTaxpayer,
  };
}
