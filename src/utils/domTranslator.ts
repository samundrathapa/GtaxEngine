import { useEffect, useRef } from "react";
import {
  SupportedLang,
  lookupJsonTranslation,
  getCachedGoogleTranslation,
  translateBatchWithGoogle,
  subscribeToColumnMapping,
  subscribeToTranslations
} from "./i18n.ts";

const originalTextMap = new WeakMap<Text, string>();
const lastAppliedTextMap = new WeakMap<Text, string>();

const originalAttrMap = new WeakMap<Element, { placeholder?: string; title?: string }>();
const lastAppliedAttrMap = new WeakMap<Element, { placeholder?: string; title?: string }>();

let isApplyingDomTranslation = false;
let hasTranslatedDomOnce = false;

const SKIP_SELECTOR = '[data-no-translate="true"], script, style, noscript, code, pre, textarea, svg, canvas, iframe, [contenteditable="true"]';

function isSkippableElement(el: Element | null): boolean {
  if (!el) return true;
  if (el.closest(SKIP_SELECTOR)) return true;
  return false;
}

function shouldSkipText(rawCore: string): boolean {
  const core = rawCore.trim();
  if (!core || core.length < 2) return true;

  // Must contain at least one Unicode letter
  if (!/\p{L}/u.test(core)) return true;

  // Already contains Devanagari script (Nepali/Hindi already translated by React i18n)
  if (/[\u0900-\u097F]/.test(core)) return true;

  // Emails, URLs, API paths, hashes, DB connection strings
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(core)) return true;
  if (/^(https?:\/\/|\/api\/|#\/|www\.)/i.test(core)) return true;
  if (/@[\w.\-]+:\d+\//.test(core)) return true;

  // Technical codes, acronyms, language keys, fiscal codes, DB identifiers
  if (/^[a-z][a-z0-9_]*_[a-z0-9_]+$/.test(core)) return true;
  if (/^(eng|nep|ind|english|json|api|sql|jwt|rbac|cdc|pdf|csv|html|ok|id|pan|bs|ad|npr|inr|usd|rcc|ttl|db)$/i.test(core)) {
    return true;
  }
  if (/^(FY\s+[\d\/]+\s*(BS|AD)?|[A-Z]{2,5}[-_]\d+[A-Z0-9\-]*|V\d{3}[_\w]*)$/i.test(core)) {
    return true;
  }

  // Numbers + units / currency
  if (/^(Rs\.?|NPR|INR|USD)\s*[\d,.\-\s]+$/i.test(core)) return true;
  if (/^\d+(\.\d+)?\s*(ms|s|m|h|min|sec|mins|hrs|sq\.?\s*ft|sq\.?\s*m|%|px|kb|mb|gb)$/i.test(core)) return true;

  return false;
}

function resolveWithSuffix(
  coreText: string,
  lang: SupportedLang
): { translated: string | null; lookupTarget: string } {
  const directJson = lookupJsonTranslation(coreText, lang);
  if (directJson) return { translated: directJson, lookupTarget: coreText };

  const directCache = getCachedGoogleTranslation(coreText, lang);
  if (directCache) return { translated: directCache, lookupTarget: coreText };

  const suffixMatch = coreText.match(/^([\s\S]*?)(\s*[:*]+)$/);
  if (suffixMatch && suffixMatch[1].trim().length >= 2) {
    const clean = suffixMatch[1].trim();
    const suffix = suffixMatch[2];
    const cleanJson = lookupJsonTranslation(clean, lang);
    if (cleanJson) return { translated: `${cleanJson}${suffix}`, lookupTarget: clean };

    const cleanCache = getCachedGoogleTranslation(clean, lang);
    if (cleanCache) return { translated: `${cleanCache}${suffix}`, lookupTarget: clean };

    return { translated: null, lookupTarget: clean };
  }

  return { translated: null, lookupTarget: coreText };
}

function restoreElementAndDescendants(root: Element): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    if (!originalTextMap.has(textNode)) continue;
    const lastApplied = lastAppliedTextMap.get(textNode);
    const current = textNode.nodeValue ?? "";
    if (lastApplied !== undefined) {
      if (current === lastApplied) {
        const orig = originalTextMap.get(textNode)!;
        if (current !== orig) {
          textNode.nodeValue = orig;
        }
      } else {
        // React updated this node independently; adopt new English text as baseline
        originalTextMap.set(textNode, current);
      }
      lastAppliedTextMap.delete(textNode);
    }
  }

  const els = root.querySelectorAll("[placeholder], [title]");
  els.forEach((el) => {
    const origAttrs = originalAttrMap.get(el);
    const lastAttrs = lastAppliedAttrMap.get(el);
    if (!origAttrs || !lastAttrs) return;

    if (lastAttrs.placeholder !== undefined && origAttrs.placeholder !== undefined) {
      const currPh = el.getAttribute("placeholder");
      if (currPh === lastAttrs.placeholder) {
        el.setAttribute("placeholder", origAttrs.placeholder);
      } else if (currPh !== null) {
        origAttrs.placeholder = currPh;
      }
    }
    if (lastAttrs.title !== undefined && origAttrs.title !== undefined) {
      const currTitle = el.getAttribute("title");
      if (currTitle === lastAttrs.title) {
        el.setAttribute("title", origAttrs.title);
      } else if (currTitle !== null) {
        origAttrs.title = currTitle;
      }
    }
    lastAppliedAttrMap.delete(el);
  });
}

/**
 * Translate all visible text nodes, placeholders, and title tooltips within `root`
 * using JSON mappings first (general + columns + locales) and falling back to Google Translate batch API.
 */
export function applyDomTranslations(
  root: Element,
  lang: SupportedLang,
  onBatchCompleted?: () => void
): void {
  if (typeof document === "undefined" || !root) return;

  if (lang === "eng") {
    if (!hasTranslatedDomOnce) return;
    isApplyingDomTranslation = true;
    try {
      restoreElementAndDescendants(root);
      hasTranslatedDomOnce = false;
    } finally {
      isApplyingDomTranslation = false;
    }
    return;
  }

  hasTranslatedDomOnce = true;
  const missingTexts = new Set<string>();

  isApplyingDomTranslation = true;
  try {
    // 1. Walk all Text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const parent = n.parentElement;
        if (!parent || isSkippableElement(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let currentNode: Node | null;
    while ((currentNode = walker.nextNode())) {
      const textNode = currentNode as Text;
      const currentVal = textNode.nodeValue ?? "";

      if (!originalTextMap.has(textNode)) {
        if (shouldSkipText(currentVal)) continue;
        originalTextMap.set(textNode, currentVal);
      } else {
        const lastApplied = lastAppliedTextMap.get(textNode);
        if (lastApplied !== undefined && currentVal !== lastApplied) {
          // React changed this node while translated
          if (shouldSkipText(currentVal)) {
            // If React already localized it into Devanagari (via t.*), don't touch it
            lastAppliedTextMap.delete(textNode);
            continue;
          }
          originalTextMap.set(textNode, currentVal);
        }
      }

      const rawOriginal = originalTextMap.get(textNode)!;
      const wsMatch = rawOriginal.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const leadingWs = wsMatch ? wsMatch[1] : "";
      const coreText = wsMatch ? wsMatch[2] : rawOriginal.trim();
      const trailingWs = wsMatch ? wsMatch[3] : "";

      if (shouldSkipText(coreText)) continue;

      const { translated, lookupTarget } = resolveWithSuffix(coreText, lang);
      if (translated) {
        const nextVal = `${leadingWs}${translated}${trailingWs}`;
        if (textNode.nodeValue !== nextVal) {
          textNode.nodeValue = nextVal;
        }
        lastAppliedTextMap.set(textNode, nextVal);
      } else {
        missingTexts.add(lookupTarget);
      }
    }

    // 2. Walk elements with `placeholder` or `title` attributes
    const attrEls = root.querySelectorAll("[placeholder], [title]");
    attrEls.forEach((el) => {
      if (isSkippableElement(el)) return;

      const origAttrs = originalAttrMap.get(el) || {};
      const lastAttrs = lastAppliedAttrMap.get(el) || {};
      let touched = false;

      const currPh = el.getAttribute("placeholder");
      if (currPh) {
        if (origAttrs.placeholder === undefined) {
          if (!shouldSkipText(currPh)) origAttrs.placeholder = currPh;
        } else if (lastAttrs.placeholder !== undefined && currPh !== lastAttrs.placeholder) {
          if (!shouldSkipText(currPh)) {
            origAttrs.placeholder = currPh;
          } else {
            delete lastAttrs.placeholder;
          }
        }

        if (origAttrs.placeholder && !shouldSkipText(origAttrs.placeholder)) {
          const { translated, lookupTarget } = resolveWithSuffix(origAttrs.placeholder.trim(), lang);
          if (translated) {
            if (currPh !== translated) {
              el.setAttribute("placeholder", translated);
            }
            lastAttrs.placeholder = translated;
            touched = true;
          } else {
            missingTexts.add(lookupTarget);
          }
        }
      }

      const currTitle = el.getAttribute("title");
      if (currTitle) {
        if (origAttrs.title === undefined) {
          if (!shouldSkipText(currTitle)) origAttrs.title = currTitle;
        } else if (lastAttrs.title !== undefined && currTitle !== lastAttrs.title) {
          if (!shouldSkipText(currTitle)) {
            origAttrs.title = currTitle;
          } else {
            delete lastAttrs.title;
          }
        }

        if (origAttrs.title && !shouldSkipText(origAttrs.title)) {
          const { translated, lookupTarget } = resolveWithSuffix(origAttrs.title.trim(), lang);
          if (translated) {
            if (currTitle !== translated) {
              el.setAttribute("title", translated);
            }
            lastAttrs.title = translated;
            touched = true;
          } else {
            missingTexts.add(lookupTarget);
          }
        }
      }

      if (origAttrs.placeholder !== undefined || origAttrs.title !== undefined) {
        originalAttrMap.set(el, origAttrs);
      }
      if (touched) {
        lastAppliedAttrMap.set(el, lastAttrs);
      }
    });
  } finally {
    isApplyingDomTranslation = false;
  }

  // 3. Batch fetch any remaining unmapped strings via Google Translate API and re-apply
  if (missingTexts.size > 0) {
    const batchList = Array.from(missingTexts);
    translateBatchWithGoogle(batchList, lang).then((resolvedMap) => {
      if (Object.keys(resolvedMap).length > 0 && onBatchCompleted) {
        onBatchCompleted();
      }
    });
  }
}

/**
 * React hook that mounts a lightweight MutationObserver at document.body so EVERY menu,
 * submenu, panel, modal/portal window, tab, table header, and button translates automatically
 * using Language JSON first, then Google Translate fallback.
 */
export function useAutoDomTranslation(lang: SupportedLang, deps: any[] = []): void {
  const langRef = useRef<SupportedLang>(lang);
  langRef.current = lang;

  useEffect(() => {
    if (typeof document === "undefined") return;
    let rafTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const runTranslation = () => {
      if (disposed) return;
      applyDomTranslations(document.body, langRef.current, () => {
        if (!disposed) {
          if (rafTimer) clearTimeout(rafTimer);
          rafTimer = setTimeout(runTranslation, 25);
        }
      });
    };

    // Initial pass after React commit
    const initTimer = setTimeout(runTranslation, 20);

    // Observe dynamic panels, portals, modals, dropdowns, and async API renders
    const observer = new MutationObserver((mutations) => {
      if (isApplyingDomTranslation || langRef.current === "eng") return;
      let hasMeaningfulChange = false;
      for (const m of mutations) {
        if (m.type === "childList" && (m.addedNodes.length > 0)) {
          hasMeaningfulChange = true;
          break;
        }
        if (m.type === "characterData") {
          hasMeaningfulChange = true;
          break;
        }
      }
      if (!hasMeaningfulChange) return;
      if (rafTimer) clearTimeout(rafTimer);
      rafTimer = setTimeout(runTranslation, 45);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    const unsubMap = subscribeToColumnMapping(() => {
      if (rafTimer) clearTimeout(rafTimer);
      rafTimer = setTimeout(runTranslation, 25);
    });
    const unsubTrans = subscribeToTranslations(() => {
      if (rafTimer) clearTimeout(rafTimer);
      rafTimer = setTimeout(runTranslation, 35);
    });

    return () => {
      disposed = true;
      clearTimeout(initTimer);
      if (rafTimer) clearTimeout(rafTimer);
      observer.disconnect();
      unsubMap();
      unsubTrans();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, ...deps]);
}
