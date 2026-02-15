import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import * as cheerio from "cheerio";

const CACHE_TTL_MS = 1000 * 60 * 10;
const pillyzeCache = new Map<string, { timestamp: number; payload: unknown }>();

const pillyzeProxy = (): Plugin => ({
  name: "pillyze-proxy",
  configureServer(server) {
    server.middlewares.use("/api/pillyze/search", async (req, res) => {
      if (req.method && req.method.toUpperCase() !== "GET") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "method_not_allowed" }));
        return;
      }

      const url = new URL(req.url ?? "", "http://localhost");
      const query = (url.searchParams.get("query") ?? "").trim();
      if (!query) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "query_required" }));
        return;
      }

      const cacheKey = query.toLowerCase();
      const cached = pillyzeCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ query, cached: true, ...(cached.payload as object) }));
        return;
      }

      try {
        const targetUrl = `https://www.pillyze.com/search/nutrients?query=${encodeURIComponent(query)}`;
        const response = await fetch(targetUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
            Accept: "text/html",
          },
        });

        if (!response.ok) {
          throw new Error(`Upstream responded with ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const items: Array<{
          href: string;
          brand: string;
          name: string;
          rating: string;
          reviews: string;
          dose: string;
          image: string;
        }> = [];

        $("#itemList a.item-card").each((_index, element) => {
          if (items.length >= 4) {
            return false;
          }
          const node = $(element);
          const href = node.attr("href") ?? "";
          const brand = node.find(".txt1").first().text().trim();
          const name = node.find(".txt2").first().text().trim();
          const rating = node.find(".star-point").first().text().trim();
          const reviews = node.find(".txt3").first().text().trim();
          const dose = node.find(".txt-dot").first().text().trim();
          const image = node.find("img.item-img").attr("src") ?? "";

          items.push({
            href: href ? new URL(href, "https://www.pillyze.com").toString() : "",
            brand,
            name,
            rating,
            reviews,
            dose,
            image,
          });

          return undefined;
        });

        const payload = { items, count: items.length };
        pillyzeCache.set(cacheKey, { timestamp: Date.now(), payload });
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ query, ...payload }));
      } catch (error) {
        res.statusCode = 502;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "upstream_failed" }));
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), pillyzeProxy()],
});
