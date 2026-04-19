import { useCallback, useEffect, useState } from "react";
import { SB } from "../../lib/supabase";

export function useMLCData(brandId) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await SB
        .from("menu_products")
        .select(`
          *,
          menu_product_lifecycle(*),
          product_briefs(id,brief_no,brief_status,working_title,target_selling_price,
            target_margin_floor_pct,positioning,strategic_rationale,channel_intent,
            submitted_at,returned_notes,mandatory_constraints),
          formula_headers(
            id,
            formula_versions(id,version_no,technical_status,product_type_snapshot,
              target_portion_qty,target_portion_uom,tested_portion_qty,
              theoretical_cogs_cache,tested_cogs_last,approved_at,approved_by)
          ),
          menu_product_versions(id,version_no,approved_selling_price,tested_cogs,
            gross_margin_pct,max_discount_headroom_pct,published_at,cfo_approved_at),
          menu_product_activations(id,activation_status,scheduled_live_at,
            actual_live_at,actual_inactive_at,
            menu_product_activation_scopes(location_id,channel_type))
        `)
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      setProducts(data || []);
    } catch (e) {
      console.error("useMLCData error:", e);
    }
    setLoading(false);
  }, [brandId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return { products, loading, reload: load };
}
