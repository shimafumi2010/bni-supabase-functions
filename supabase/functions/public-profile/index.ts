import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Supabase Service Client ---
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: { persistSession: false },
  }
);

// --- HTML escape （最低限） ---
const escapeHtml = (str = "") =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// --- HTML Template ---
const renderHTML = (p: any) => `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(p.name)} | プロフィール</title>
  <meta name="description" content="${escapeHtml(p.company ?? "")} ${escapeHtml(p.name)} のプロフィール" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f9fafb;
      color: #1f2937;
      margin: 0;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .card {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,.1);
      margin-bottom: 1.5rem;
    }
    h1 {
      margin: 0;
      font-size: 1.8rem;
    }
    .furigana {
      color: #6b7280;
      font-size: 0.9rem;
    }
    .company {
      margin-top: 1rem;
      font-weight: 600;
    }
    .section {
      margin-top: 1.5rem;
    }
    .label {
      font-weight: 600;
      margin-bottom: .25rem;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>${escapeHtml(p.name)}</h1>
      ${p.furigana ? `<div class="furigana">${escapeHtml(p.furigana)}</div>` : ""}
      ${p.company ? `<div class="company">${escapeHtml(p.company)}</div>` : ""}
      ${p.position ? `<div>${escapeHtml(p.position)}</div>` : ""}
      ${p.category ? `<div>${escapeHtml(p.category)}</div>` : ""}
    </div>

    ${p.bio ? `
    <div class="card">
      <div class="section">
        <div class="label">自己紹介</div>
        <div style="white-space: pre-wrap;">${escapeHtml(p.bio)}</div>
      </div>
    </div>` : ""}

    <div class="card">
      <div class="section">
        <div class="label">連絡先</div>
        ${p.email ? `<div>Email: <a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></div>` : ""}
        ${p.phone ? `<div>Tel: <a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></div>` : ""}
        ${p.booking_url ? `<div><a href="${escapeHtml(p.booking_url)}" target="_blank">▶ 1to1予約</a></div>` : ""}
      </div>
    </div>

    <div style="text-align:center;color:#6b7280;font-size:.8rem;">
      Powered by BNI Chapter Hub
    </div>
  </div>
</body>
</html>`;

// --- Main ---
serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.pathname.split("/").pop();

  if (!slug) {
    return new Response("Not Found", { status: 404 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      name,
      furigana,
      company,
      position,
      category,
      bio,
      email,
      phone,
      booking_url,
      is_public
    `)
    .eq("public_slug", slug)
    .eq("is_public", true)
    .single();

  if (error || !profile) {
    return new Response("Not Found", { status: 404 });
  }

  const html = renderHTML(profile);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
