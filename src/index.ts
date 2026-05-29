export interface Env {
  DISCORD_WEBHOOK_URL: string;
}

interface QuotePayload {
  customerName?: string;
  phone?: string;
  address?: string;
  floor1Count?: string;
  floor2Count?: string;
  screenCount?: string;
  calculatedSubtotal?: string;
  finalQuote?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Enforce Cross-Origin Resource Sharing (CORS) safe headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // Handle CORS preflight validation checks
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Ingress restricted to POST transactions." }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    try {
      const body: QuotePayload = await request.json();

      // Runtime Type Assertions & Validation Matrix
      if (!body.customerName || !body.phone || !body.address) {
        return new Response(JSON.stringify({ error: "Bad Request. Missing mandatory validation attributes." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Sanitize string expressions to preserve webhook layout integrity
      const sanitize = (str: string) => str.replace(/([`*_\\[\]{}()#+\-.!])/g, "\\$1");

      const name = sanitize(body.customerName);
      const phone = sanitize(body.phone);
      const address = sanitize(body.address);
      const f1 = parseInt(body.floor1Count || "0", 10);
      const f2 = parseInt(body.floor2Count || "0", 10);
      const screens = parseInt(body.screenCount || "0", 10);
      const subtotal = sanitize(body.calculatedSubtotal || "$0.00");
      const total = sanitize(body.finalQuote || "$100.00");

      // Construct high-density payload mapping back to school parameters
      const discordPayload = {
        username: "Red Devil Dispatch",
        avatar_url: "https://raw.githubusercontent.com/unindexed/assets/main/SUH_Logo.png",
        embeds: [
          {
            title: "🚨 New Inbound Window Job Request",
            color: 13504806, // Base 10 integer equivalent of schoolRed hex #CE1126
            fields: [
              { name: "👤 Client Name", value: name, inline: true },
              { name: "📞 Phone Record", value: phone, inline: true },
              { name: "📍 Site Address", value: address, inline: false },
              { name: "🪟 1st Floor Count", value: `${f1} windows`, inline: true },
              { name: "🪜 2nd Floor Count", value: `${f2} windows`, inline: true },
              { name: "🕸️ Screen Count", value: `${screens} screens`, inline: true },
              { name: "💵 Item Subtotal", value: subtotal, inline: true },
              { name: "🏆 Estimated Quote", value: `**${total}**`, inline: true }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "Red Devil Exterior Operations Engine v1.2" }
          }
        ]
      };

      // Dispatches asynchronous telemetry over high-velocity backbone pipeline
      const upstreamResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      });

      if (!upstreamResponse.ok) {
        const errorText = await upstreamResponse.text();
        return new Response(JSON.stringify({ error: "Upstream pipeline execution failure.", details: errorText }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ status: "success", timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Internal Server Processing Exception.", message: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  },
};
