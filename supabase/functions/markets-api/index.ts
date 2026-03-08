import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Path: /markets-api or /markets-api/:id
  const marketId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

  try {
    // GET — list or single market (public, no auth)
    if (req.method === "GET") {
      const adminClient = createClient(supabaseUrl, serviceKey);

      if (marketId && marketId !== "markets-api") {
        // Single market
        const { data, error } = await adminClient
          .from("markets")
          .select("*")
          .eq("id", marketId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: "Market not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Increment embed views
        await adminClient
          .from("markets")
          .update({ embed_views: (data.embed_views || 0) + 1 })
          .eq("id", marketId);

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // List markets
      const category = url.searchParams.get("category");
      const search = url.searchParams.get("search");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const status = url.searchParams.get("status") || "active";

      let query = adminClient
        .from("markets")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (category && category !== "trending") {
        query = query.eq("category", category);
      }
      if (search) {
        query = query.ilike("question", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST — create market (requires auth)
    if (req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = claimsData.claims.sub;
      const body = await req.json();

      const { data, error } = await userClient.from("markets").insert({
        creator_id: userId,
        question: body.question,
        description: body.description || null,
        category: body.category || "trending",
        market_type: body.market_type || "binary",
        end_date: body.end_date,
        yes_odds: 50,
        no_odds: 50,
      }).select().single();

      if (error) throw error;

      // Update profile created_markets count
      const adminClient = createClient(supabaseUrl, serviceKey);
      await adminClient.rpc("increment_created_markets", { p_user_id: userId }).catch(() => {});

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT — place bet (requires auth)
    if (req.method === "PUT") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = claimsData.claims.sub;
      const body = await req.json();

      // Use the atomic place_bet function
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data, error } = await adminClient.rpc("place_bet", {
        p_market_id: body.market_id,
        p_user_id: userId,
        p_option: body.option,
        p_amount: body.amount,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
