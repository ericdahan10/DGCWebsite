// DGC Chat API — Cloudflare Worker
// Lead-capturing chatbot with support ticket detection + escalation

const ALLOWED_ORIGINS = new Set([
  "https://dahangroup.io",
  "https://www.dahangroup.io",
  "https://vault.dahangroup.io",
  "https://dgcvault.onrender.com",
]);

function assertRequiredEnv(env, keys) {
  const missing = keys.filter((key) => !env?.[key]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

const DGC_SYSTEM_PROMPT = `You are ECHO, an AI specialist embedded as a chat widget on the Dahan Group Consulting (DGC) website. Never use any personal names or refer to specific team members.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your name is ECHO — DGC's AI assistant. You're confident, direct, and genuinely helpful — never robotic, never salesy. You ask smart questions, listen carefully, and connect what you hear to specific solutions DGC can deliver. You represent DGC's standard: practical, no-fluff AI that actually works.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABOUT DGC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dahan Group Consulting is a hands-on AI consulting firm. We don't just advise — we build and implement practical AI solutions that help growing businesses save time, capture more leads, and grow. We specialize in working with small and mid-size businesses, coaches, and agencies who want real results without the overhead of a large consulting firm.

Our edge: We focus on practical implementation over theory. When you work with DGC, we build it for you — from automations to custom chatbots to full AI pipelines — and we make sure it actually works in your business.

DGC Proprietary Products (mention when relevant):
- ECHO — AI chat assistant for websites (you are ECHO; DGC builds and deploys this for clients)
- TRACE — AI-powered SDR tool for lead intake, enrichment, scoring, and CRM push

Website: dahangroup.io

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHO WE HELP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Our clients typically come to us with one or more of these problems:
- Wasting hours on manual, repetitive tasks that could be automated
- Missing leads or following up too slowly (leads going cold)
- No clear AI strategy — overwhelmed by options, unsure where to start
- An outdated website or weak online presence that isn't converting visitors

We work with: small and local businesses, coaches, agencies, and service-based companies looking to implement AI without the complexity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW IT WORKS — OUR APPROACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every engagement starts with an AI Audit — a free discovery session where we assess the business, identify the highest-impact opportunities, and map out a clear action plan. No fluff, no 50-page reports. Just a focused roadmap you can actually execute.

From there, engagements follow three phases depending on where the client is:

PHASE 1 — GETTING STARTED
For businesses new to AI or looking to clean up their current tool stack.
- AI Workflow Automations: We map and automate repetitive manual processes — things like lead follow-up, data entry, scheduling, notifications, and internal reporting. Clients typically save 5–15 hours per week.
- AI Tool Optimization: We audit your existing tools (CRMs, email platforms, project management) and integrate AI features to get more out of what you already pay for.
- AI Website Creation: We design and build fast, modern websites with AI-powered features baked in — including chat widgets, lead capture, and automated follow-up. Built to convert.
- Team Training & Workshops: We run practical workshops that get your team using AI tools confidently in their day-to-day work — tailored to your industry and tools.

PHASE 2 — GOING DEEPER
For businesses ready to build more custom AI infrastructure.
- Custom AI Agents: We build AI chatbots and assistants tailored to your business — trained on your services, FAQs, and brand voice. Used for customer support, sales qualification, or internal knowledge. This is one of our most popular services.
- AI Lead Qualification & Email Automation: We build systems that automatically score incoming leads, segment them, and trigger personalized follow-up emails — so no lead goes cold and your team focuses on the hottest prospects.
- AI Knowledge Base: We create an internal AI-powered knowledge base your team can query in plain English — reducing time spent searching for answers, onboarding docs, or SOPs.
- AI Governance & Readiness: We help businesses build the policies, frameworks, and guardrails needed to use AI responsibly and at scale.

PHASE 3 — ADVANCED CAPABILITIES
For businesses ready to go deep on AI-driven growth.
- Advanced AI Solutions: Custom fine-tuned models, retrieval-augmented generation (RAG) systems, and AI-powered analytics tailored to specific business needs.
- AI Marketing & Personalization: AI-driven content pipelines, personalized outreach, and dynamic audience segmentation.
- Full AI Sales Pipeline: End-to-end AI automation from lead capture through qualification, nurture, and close — fully integrated with your CRM and communication tools.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMON QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: Where do we start?
A: Every engagement starts with a free AI Audit. We assess your business, identify the biggest opportunities, and give you a clear roadmap. No commitment required.

Q: How much does it cost?
A: Pricing depends on the scope of the project. We offer both project-based engagements and monthly retainers. A DGC specialist will provide a custom proposal after the audit. We're significantly more affordable than large consulting firms while delivering hands-on work.

Q: How long does it take to see results?
A: Many clients see time savings and efficiency gains within the first 2–4 weeks. More complex builds like custom AI agents or full pipelines typically take 4–8 weeks from kickoff.

Q: Do we need a technical team to work with you?
A: No. We handle the technical side end-to-end. You don't need developers or an IT team — just a willingness to implement and adopt the tools we build.

Q: What industries do you work with?
A: We work across industries — local businesses, healthcare, real estate, e-commerce, coaching, agencies, and professional services. If you have repetitive processes or lead management challenges, AI can help.

Q: What if we already use tools like HubSpot, Salesforce, or Zapier?
A: Great — we integrate with your existing stack. We're not here to replace tools you already use; we're here to make them smarter.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE RULES — FOLLOW STRICTLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Keep responses to 2–3 sentences. Never exceed 4 sentences. Be direct and conversational — no walls of text.
2. Never mention team member names. Say "our team" or "a DGC specialist" instead.
3. Warm but brief. No filler, no jargon, no long explanations.
4. Your goal is to have a real conversation, understand what the visitor needs, and naturally guide them toward connecting with DGC.
5. After 3–4 exchanges, naturally guide toward booking a free AI Audit or sharing their email — don't rush it.
6. Never make up pricing — say it depends on scope and our team will provide a custom proposal after an audit.
7. If asked something unrelated to DGC's services, briefly redirect to how DGC can help their business.
8. When someone describes a pain point (manual tasks, slow follow-up, no AI strategy, weak website), acknowledge it directly and connect it to a specific DGC service.
9. If a visitor asks about chatbots, AI assistants, or tools like ECHO — let them know DGC builds and deploys these for clients, and it's one of our most requested services.
10. MEMORY: You have a persistent memory system. If prior conversation history is present in your context, it is real — retrieved from a database for this specific visitor. NEVER say you have no memory between sessions or that each chat starts fresh. If asked whether you remember them, say yes and reference what you know. This is a hard rule — do not break it.`;

// ── Routing instructions — always hardcoded, always appended after persona ───
// These are NEVER editable via Settings. Splitting them out means an admin
// can customize ECHO's personality without ever breaking the form triggers.
const ROUTING_INSTRUCTIONS = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD CAPTURE — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When a user shares their name and email, ALWAYS append this at the very end of your response (hidden from user, parsed by backend):

[LEAD_DATA]{"name":"Their Name","email":"their@email.com","phone":"optional or empty string"}[/LEAD_DATA]

Examples:
- "I'm Sarah, sarah@acme.com" → [LEAD_DATA]{"name":"Sarah","email":"sarah@acme.com","phone":""}[/LEAD_DATA]
- "Mike, mike@co.com, 555-1234" → [LEAD_DATA]{"name":"Mike","email":"mike@co.com","phone":"555-1234"}[/LEAD_DATA]

ALWAYS include tags when you detect an email address. This is your most important function.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPPORT TICKET DETECTION — CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Monitor every message for support issues or escalation signals. These include:
- Complaints, frustration, or dissatisfaction with DGC or a project
- Requests to speak with a human / real person / someone on the team
- Billing, invoice, or payment issues
- Urgent problems or blockers with an ongoing engagement
- Anything you cannot confidently answer or resolve

When you detect any of the above:
1. Respond warmly and empathetically — acknowledge the issue, let them know a specialist will follow up shortly.
2. ALWAYS append a support ticket tag at the very end of your response:

[SUPPORT_TICKET]{"issue_summary":"One sentence summary of the issue","category":"complaint|escalation|billing|urgent|question","urgency":"high|medium|low","needs_human":true,"name":"Their name if known or empty string","email":"Their email if known or empty string"}[/SUPPORT_TICKET]

ONLY append the support ticket tag when a genuine issue or escalation is detected — not for general questions you can answer yourself.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTING — HOW TO DIRECT VISITORS (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
There are TWO paths for connecting visitors with our team. Use the correct one:

PATH 1 — ESCALATION (support issues only):
Use ONLY when the visitor has a genuine problem: complaint, billing issue, project blocker, or explicitly asks to speak to a human about an issue.
→ Append [SUPPORT_TICKET] tag (described above). The system will show an escalation form.

PATH 2 — CONTACT (general interest, wants to get in touch):
Use when the visitor is interested in our services, wants to learn more, wants pricing info, or is ready to take the next step — but does NOT have a support issue.
→ Append this tag at the end of your response:
[SHOW_CONTACT]
→ This tells the system to show the contact form or booking link.

EXAMPLES:
- "Can someone walk me through pricing?" → answer what you can, then append [SHOW_CONTACT]
- "How do I get started?" → mention the free AI Audit, then append [SHOW_CONTACT]
- "I want to book a consultation" → respond warmly, append [SHOW_CONTACT] immediately
- "I'd love to connect with the team" → respond warmly, append [SHOW_CONTACT] immediately

IMPORTANT: Do NOT append [SHOW_CONTACT] on every response. Only append it when the visitor is ready to take action or has explicitly asked to connect or book.`;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    Vary: "Origin",
    ...SECURITY_HEADERS,
  };
}

// Open CORS — used for public endpoints (widget-config, main chat) that must
// work when the widget is embedded on any client's website domain.
function openCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    ...SECURITY_HEADERS,
  };
}

// ── Tag extractors ────────────────────────────────────────────────────────────

function extractLeadFromTags(text) {
  const match = text.match(/\[LEAD_DATA\](.*?)\[\/LEAD_DATA\]/s);
  if (match) {
    try {
      const leadData = JSON.parse(match[1]);
      const cleanText = text
        .replace(/\[LEAD_DATA\].*?\[\/LEAD_DATA\]/s, "")
        .trim();
      return { leadData, cleanText };
    } catch (e) {
      return { leadData: null, cleanText: text };
    }
  }
  return { leadData: null, cleanText: text };
}

function extractSupportTicket(text) {
  const match = text.match(/\[SUPPORT_TICKET\](.*?)\[\/SUPPORT_TICKET\]/s);
  if (match) {
    try {
      const ticketData = JSON.parse(match[1]);
      const cleanText = text
        .replace(/\[SUPPORT_TICKET\].*?\[\/SUPPORT_TICKET\]/s, "")
        .trim();
      return { ticketData, cleanText };
    } catch (e) {
      return { ticketData: null, cleanText: text };
    }
  }
  return { ticketData: null, cleanText: text };
}

// ── [FIX] Extract [SHOW_CONTACT] tag ──────────────────────────────────────────
function extractShowContact(text) {
  const hasTag = /\[SHOW_CONTACT\]/.test(text);
  const cleanText = text.replace(/\[SHOW_CONTACT\]/g, "").trim();
  return { showContact: hasTag, cleanText };
}

// ── Text chunking ─────────────────────────────────────────────────────────────
// Splits a document into ~400-word paragraphs ready for embedding
function chunkText(text, maxWords = 400) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);
  const chunks = [];
  let current = [];
  let wordCount = 0;
  for (const para of paragraphs) {
    const words = para.split(/\s+/).length;
    if (wordCount + words > maxWords && current.length > 0) {
      chunks.push(current.join("\n\n"));
      current = [para];
      wordCount = words;
    } else {
      current.push(para);
      wordCount += words;
    }
  }
  if (current.length > 0) chunks.push(current.join("\n\n"));
  return chunks.length > 0 ? chunks : [text.trim()];
}

// ── OpenAI embeddings ─────────────────────────────────────────────────────────
// Converts text → 1536-dimension vector using text-embedding-3-small
async function embedText(text, env) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ input: text, model: "text-embedding-3-small" }),
  });
  const data = await res.json();
  if (!data.data?.[0]?.embedding) {
    throw new Error("OpenAI embedding failed: " + JSON.stringify(data));
  }
  return data.data[0].embedding; // array of 1536 floats
}

// ── Supabase REST helpers ─────────────────────────────────────────────────────
// Direct REST API — no npm package needed in Cloudflare Workers

async function supabaseInsert(table, row, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_KEY,
      Authorization: `Bearer ${env.SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert failed (${res.status}): ${err}`);
  }
}

async function supabaseRpc(fn, params, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_KEY,
      Authorization: `Bearer ${env.SUPABASE_KEY}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase RPC ${fn} failed (${res.status}): ${err}`);
  }
  return res.json();
}

// ── Supabase count helper ─────────────────────────────────────────────────────
// Returns the total row count for a table filtered by one key=value pair.
// Uses the Prefer: count=exact header and reads the Content-Range response.
async function supabaseCount(table, filterKey, filterValue, env) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/${table}?select=*&${filterKey}=eq.${encodeURIComponent(filterValue)}`,
    {
      headers: {
        apikey: env.SUPABASE_KEY,
        Authorization: `Bearer ${env.SUPABASE_KEY}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    },
  );
  const range = res.headers.get("Content-Range");
  if (!range) return 0;
  const match = range.match(/\/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

// ── System prompt resolver ────────────────────────────────────────────────────
// Returns the persona prompt (custom from Supabase or hardcoded default) with
// ROUTING_INSTRUCTIONS ALWAYS appended. This means lead capture, support ticket
// detection, and contact form routing can never be broken by editing Settings.
async function getSystemPrompt(env) {
  let persona = DGC_SYSTEM_PROMPT;
  if (env.SUPABASE_URL && env.SUPABASE_KEY && env.CLIENT_ID) {
    try {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/clients?id=eq.${env.CLIENT_ID}&select=system_prompt`,
        { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
      );
      if (res.ok) {
        const rows = await res.json();
        const custom = rows?.[0]?.system_prompt;
        if (custom && custom.trim()) persona = custom;
      }
    } catch { /* fall back to hardcoded */ }
  }
  // Always append routing instructions — these are never editable via Settings
  return persona + ROUTING_INSTRUCTIONS;
}

// ── HTML stripping ────────────────────────────────────────────────────────────
// Converts raw HTML into clean plain text suitable for embedding.
// Removes scripts, styles, nav, and footer — keeps meaningful body text.
function stripHtml(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "");

  // Block-level tags become newlines so paragraphs are preserved
  text = text
    .replace(/<\/?(p|div|h[1-6]|li|tr|br|section|article|main)[^>]*>/gi, "\n")
    .replace(/<\/?(ul|ol|table)[^>]*>/gi, "\n\n");

  text = text.replace(/<[^>]+>/g, ""); // strip remaining tags

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

  // Collapse whitespace and remove blank lines
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n\n")
    .trim();
}

// ── CSV line parser ───────────────────────────────────────────────────────────
// Handles quoted fields and escaped quotes correctly.
function parseCsvLine(line) {
  const result = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && !inQ) { inQ = true; }
    else if (c === '"' && inQ) { if (line[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; } }
    else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += c; }
  }
  result.push(cur.trim());
  return result;
}

// ── Core ingest logic (shared by all ingest routes) ───────────────────────────
// Chunks, embeds, and stores text. Returns the number of chunks stored.
// `notes` is an optional free-text description of what the content is and how
// Claude should use it. If provided, it is prepended to every chunk as a
// [Context: ...] header so Claude always sees the source context when retrieving.
async function ingestText(text, source, clientId, env, notes = null) {
  const chunks = chunkText(text.trim());
  let stored = 0;
  // Build prefix once — empty string if no notes so we don't inflate chunk size
  const contextPrefix = notes && notes.trim()
    ? `[Context: ${notes.trim()}]\n\n`
    : "";
  for (const chunk of chunks) {
    if (chunk.trim().length < 20) continue;
    const content = contextPrefix + chunk;
    const embedding = await embedText(content, env);
    await supabaseInsert(
      "knowledge_chunks",
      { client_id: clientId, content, source, embedding },
      env,
    );
    stored++;
  }
  return stored;
}

// ── Visitor Memory helpers ─────────────────────────────────────────────────────
// All three functions fail silently — memory errors never break the chat.

// Returns the conversation_id for this visitor, creating a new row if needed.
async function getOrCreateConversation(visitorId, clientId, env) {
  // Look for an existing conversation for this visitor
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/conversations?visitor_id=eq.${encodeURIComponent(visitorId)}&client_id=eq.${clientId}&order=started_at.desc&limit=1`,
    { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
  );
  const rows = await res.json();
  if (Array.isArray(rows) && rows.length > 0) return rows[0].id;

  // None found — create a new conversation row
  const createRes = await fetch(`${env.SUPABASE_URL}/rest/v1/conversations`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_KEY,
      Authorization: `Bearer ${env.SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ visitor_id: visitorId, client_id: clientId }),
  });
  const [newConvo] = await createRes.json();
  return newConvo.id;
}

// Fetches the last N messages for a conversation, oldest-first (Claude needs chronological order).
async function fetchConversationHistory(conversationId, limit = 10, env) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.asc&limit=${limit}`,
    { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
  );
  const rows = await res.json();
  return Array.isArray(rows) ? rows.map((r) => ({ role: r.role, content: r.content })) : [];
}

// Saves a user + assistant message pair and updates the conversation timestamp.
// Runs in ctx.waitUntil — non-blocking, response is already sent by the time this runs.
async function saveConversationTurn(conversationId, userMsg, assistantMsg, env) {
  const headers = {
    apikey: env.SUPABASE_KEY,
    Authorization: `Bearer ${env.SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  await fetch(`${env.SUPABASE_URL}/rest/v1/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ conversation_id: conversationId, role: "user", content: userMsg }),
  });
  await fetch(`${env.SUPABASE_URL}/rest/v1/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ conversation_id: conversationId, role: "assistant", content: assistantMsg }),
  });
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/conversations?id=eq.${conversationId}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ last_active_at: new Date().toISOString() }),
    },
  );
}

// ── Save support ticket to Supabase ───────────────────────────────────────────
// Called from /escalation via ctx.waitUntil — non-blocking.
// Maps the escalation payload fields (camelCase from frontend) to snake_case columns.
// Fails silently — Apps Script remains the primary record, Supabase powers VAULT.
async function saveTicketToSupabase(payload, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) return;
  const desc = payload.issueSummary || payload.issue_summary || "";
  await supabaseInsert("tickets", {
    client_id:     env.CLIENT_ID,
    ticket_number: payload.ticketId || payload.ticket_id || "",
    visitor_name:  payload.clientName  || payload.visitor_name  || "",
    visitor_email: payload.clientEmail || payload.visitor_email || "",
    visitor_phone: payload.clientPhone || payload.visitor_phone || "",
    urgency:       (payload.urgency || "medium").toLowerCase(),
    subject:       desc.slice(0, 120),
    description:   desc,
    status:        "open",
  }, env);
}

// ── RAG retrieval ─────────────────────────────────────────────────────────────
// Finds the most relevant knowledge chunks for the user's message.
// Fails silently — if RAG errors, the chat continues without extra context.
async function retrieveContext(query, clientId, env) {
  try {
    const queryEmbedding = await embedText(query, env);
    const chunks = await supabaseRpc(
      "match_knowledge_chunks",
      {
        query_embedding: queryEmbedding,
        match_count: 4,
        match_client_id: clientId,
      },
      env,
    );
    if (!chunks || chunks.length === 0) return null;
    return chunks.map((c) => c.content).join("\n\n---\n\n");
  } catch (e) {
    console.error("RAG retrieval error (non-fatal):", e.message);
    return null; // chat continues without RAG context
  }
}

// ── Conversation helpers ──────────────────────────────────────────────────────

function extractLeadFromConversation(messages) {
  const emailRegex = /[\w.+-]+@[\w-]+\.[\w.]+/;
  const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;

  let email = null;
  let name = null;
  let phone = null;

  const userMessages = messages.filter((m) => m.role === "user").reverse();

  for (const msg of userMessages) {
    const text = msg.content;

    if (!email) {
      const emailMatch = text.match(emailRegex);
      if (emailMatch) email = emailMatch[0];
    }

    if (!phone) {
      const phoneMatch = text.match(phoneRegex);
      if (phoneMatch) phone = phoneMatch[0];
    }

    if (!name && email) {
      const namePatterns = [
        /(?:I'm|I am|my name is|this is|it's|hey,?\s*I'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[,\-–—]\s*/,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+here/i,
      ];
      for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch) {
          name = nameMatch[1].trim();
          break;
        }
      }

      if (!name) {
        const beforeEmail = text.split(email)[0].trim();
        const words = beforeEmail
          .replace(/[,.\-–—:]/g, " ")
          .trim()
          .split(/\s+/);
        const possibleName = words.filter(
          (w) => /^[A-Z]/.test(w) && w.length > 1 && w.length < 20,
        );
        if (possibleName.length > 0 && possibleName.length <= 3) {
          name = possibleName.join(" ");
        }
      }
    }

    if (email) break;
  }

  if (email) {
    return { name: name || "Chat visitor", email, phone: phone || "" };
  }
  return null;
}

function buildChatContext(messages) {
  return messages
    .slice(-10)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");
}

// ── Formspree (lead notify) ───────────────────────────────────────────────────

async function submitToFormspree(leadData, chatContext, env) {
  try {
    const res = await fetch(env.FORMSPREE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _replyto: env.ADMIN_EMAIL,
        _subject: "New Chatbot Lead - DGC Website",
        "Lead Name": leadData.name || "Not provided",
        "Lead Email": leadData.email || "Not provided",
        "Lead Phone": leadData.phone || "Not provided",
        Source: "AI Chatbot",
        Conversation: chatContext || "Lead captured via chat widget",
      }),
    });
    console.log("Formspree status:", res.status);
  } catch (e) {
    console.error("Formspree submission failed:", e.message);
  }
}

// ── Lead worker (qualification + email) ──────────────────────────────────────

async function sendToLeadWorker(leadData, chatContext, env) {
  try {
    const res = await fetch(env.LEAD_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: leadData.name || "Chat visitor",
        email: leadData.email,
        phone: leadData.phone || "",
        source: "AI Chatbot",
        conversation: chatContext || "",
      }),
    });
    console.log("Lead worker status:", res.status);
  } catch (e) {
    console.error("Lead worker call failed:", e.message);
  }
}

// ── [FIX] Helper to POST to Apps Script with manual redirect follow ──────────
// Google Apps Script returns a 302 redirect after POST. Cloudflare Workers'
// redirect:"follow" converts the redirected request to GET which can lose the
// response body. We manually follow the redirect to get the actual response.
async function postToAppsScript(payload, env) {
  const res = await fetch(env.GOOGLE_APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    redirect: "manual",
    body: JSON.stringify({ ...payload, _secret: env.APPS_SCRIPT_SECRET }),
  });

  // If Apps Script returns a redirect (302/303), follow it with GET
  if (res.status === 302 || res.status === 303 || res.status === 301) {
    const redirectUrl = res.headers.get("Location");
    if (redirectUrl) {
      const followRes = await fetch(redirectUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      return followRes;
    }
  }

  return res;
}

// ── Client confirmation email ─────────────────────────────────────────────────

function buildConfirmationEmail(clientName, ticketId) {
  const firstName = clientName ? clientName.split(" ")[0] : "there";
  const htmlBody = `Hi ${firstName},<br><br>We've received your request and our team is already working on it. We'll be in touch within 2–3 business days.<br><br>The DGC Team`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr>
    <td style="background:linear-gradient(135deg,#0d1117 0%,#142d5a 100%);padding:28px 32px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="vertical-align:middle;padding-right:12px;">
            <div style="width:36px;height:36px;border-radius:50%;border:2px solid #2d5a8f;display:inline-block;text-align:center;line-height:32px;">
              <span style="color:#4a8ac7;font-size:14px;font-weight:bold;">&#9678;</span>
            </div>
          </td>
          <td style="vertical-align:middle;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">DAHAN GROUP</span>
            <span style="color:rgba(255,255,255,0.5);font-size:18px;font-weight:300;letter-spacing:0.5px;"> CONSULTING</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 32px 8px;font-size:15px;line-height:1.7;color:#333333;">
      ${htmlBody}
    </td>
  </tr>
  <tr>
    <td style="padding:16px 32px 32px;">
      <table cellpadding="0" cellspacing="0" style="background:#f8f9fc;border-left:3px solid #2d5a8f;border-radius:4px;padding:12px 16px;width:100%;">
        <tr><td style="font-size:12px;color:#888888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Ticket Reference</td></tr>
        <tr><td style="font-size:14px;color:#1a1a1a;font-weight:700;">${ticketId}</td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px;"><div style="border-top:1px solid #e8e8ee;"></div></td>
  </tr>
  <tr>
    <td style="padding:24px 32px 28px;">
      <div style="font-size:13px;font-weight:700;color:#1a1a1a;">Dahan Group Consulting</div>
      <div style="font-size:12px;color:#2d5a8f;margin-top:2px;">AI for Real Business Growth</div>
      <div style="margin-top:10px;font-size:12px;color:#888888;">
        <a href="https://dahangroup.io" style="color:#2d5a8f;text-decoration:none;">dahangroup.io</a> &middot;
        <a href="mailto:admin@dahangroup.io" style="color:#2d5a8f;text-decoration:none;">admin@dahangroup.io</a>
      </div>
    </td>
  </tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
  <tr>
    <td style="padding:16px 32px;text-align:center;font-size:11px;color:#aaaaaa;">
      You're receiving this because you submitted a support request via dahangroup.io
    </td>
  </tr>
</table>
</td></tr></table>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    // Preflight — use open CORS so widget.js works from any embedded domain.
    // Admin endpoint security is enforced by X-API-Key, not by CORS origin.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: openCorsHeaders() });
    }

    // Health check
    if (request.method === "GET") {
      return new Response("OK: DGC Chat API is running. Use POST for chat.", {
        headers: { "Content-Type": "text/plain", ...corsHeaders(request) },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders(request),
      });
    }

    const url = new URL(request.url);

    // ── /vault-login — unauthenticated, validates username + password ──────────
    // Returns the SITE_API_KEY so vault.html can use it for subsequent calls.
    // VAULT_USERNAME is a plain var; VAULT_PASSWORD must be a Cloudflare secret.
    if (url.pathname === "/vault-login") {
      try {
        const { username, password } = await request.json();
        const validUser = env.VAULT_USERNAME || "admin";
        const validPass = env.VAULT_PASSWORD;
        if (!validPass) {
          return new Response(JSON.stringify({ error: "Login not configured — set VAULT_PASSWORD secret in Cloudflare." }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }
        if (username === validUser && password === validPass) {
          return new Response(JSON.stringify({ ok: true, key: env.SITE_API_KEY }), {
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }
        return new Response(JSON.stringify({ error: "Invalid username or password." }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Bad request" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── API key auth ──────────────────────────────────────────────────────────
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey || apiKey !== env.SITE_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(request),
        },
      });
    }

    // ── /ingest route: chunk text → embed → store in Supabase for RAG ────────
    // Called from the admin panel (or curl) to add knowledge to ECHO's brain.
    // Body: { text: "...", source: "optional label", notes: "optional context", client_id: "dgc" }
    if (url.pathname === "/ingest") {
      try {
        const {
          text,
          source = "manual",
          client_id = env.CLIENT_ID,
          notes,
        } = await request.json();
        if (!text || text.trim().length < 10) {
          return new Response(
            JSON.stringify({ error: "text field required (min 10 chars)" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders(request),
              },
            },
          );
        }
        const stored = await ingestText(text, source, client_id, env, notes);
        return new Response(
          JSON.stringify({
            success: true,
            chunks_stored: stored,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(request),
            },
          },
        );
      } catch (e) {
        console.error("Ingest error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(request),
          },
        });
      }
    }

    // ── /ingest-url: fetch a webpage, strip HTML, and ingest as knowledge ────
    if (url.pathname === "/ingest-url") {
      try {
        const { url: pageUrl, source = "website", notes } = await request.json();
        if (!pageUrl) {
          return new Response(JSON.stringify({ error: "url field required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }
        // Fetch the page with full browser-like headers to pass bot detection
        const pageRes = await fetch(pageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
          },
        });
        if (!pageRes.ok) {
          const hint = pageRes.status === 403 || pageRes.status === 503
            ? " The site is blocking automated access (e.g. Cloudflare protection). For your own site, use the Text tab and paste the content directly."
            : " Ensure the URL is public and accessible.";
          throw new Error(`Could not fetch page (HTTP ${pageRes.status}).${hint}`);
        }
        const html = await pageRes.text();
        const text = stripHtml(html);
        if (text.length < 50) {
          throw new Error("Page returned too little text. The site may block scrapers — try pasting the content directly in the Text tab instead.");
        }
        const stored = await ingestText(text, source, env.CLIENT_ID, env, notes);
        return new Response(
          JSON.stringify({ success: true, chunks_stored: stored, url: pageUrl }),
          { headers: { "Content-Type": "application/json", ...corsHeaders(request) } },
        );
      } catch (e) {
        console.error("Ingest-url error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /ingest-youtube: extract transcript from a YouTube video and ingest ──
    if (url.pathname === "/ingest-youtube") {
      try {
        const { url: ytUrl, notes } = await request.json();
        if (!ytUrl) {
          return new Response(JSON.stringify({ error: "url field required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }

        // Extract the video ID from any YouTube URL format
        const idMatch = ytUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
        if (!idMatch) throw new Error("Invalid YouTube URL — could not extract video ID.");
        const videoId = idMatch[1];

        // Attempt 1: auto-generated captions via YouTube's timedtext API
        let transcript = "";
        let title = "";
        try {
          const captionRes = await fetch(
            `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
            { headers: { "User-Agent": "Mozilla/5.0" } },
          );
          if (captionRes.ok) {
            const captionData = await captionRes.json();
            if (captionData.events && captionData.events.length > 0) {
              transcript = captionData.events
                .filter((e) => e.segs)
                .map((e) => e.segs.map((s) => s.utf8 || "").join(""))
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();
            }
          }
        } catch (_) { /* fall through */ }

        // Attempt 2: fall back to video title + description via oEmbed
        if (!transcript) {
          const oembedRes = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`,
          );
          if (!oembedRes.ok) throw new Error("Could not retrieve YouTube content. Ensure the video is public.");
          const meta = await oembedRes.json();
          title = meta.title || "";
          transcript = `Video Title: ${meta.title}\nChannel: ${meta.author_name}`;
        } else {
          // Also grab title for the response label
          try {
            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`);
            if (oembedRes.ok) { const meta = await oembedRes.json(); title = meta.title || ""; }
          } catch (_) { /* non-fatal */ }
        }

        const source = `youtube-${videoId}`;
        const stored = await ingestText(transcript, source, env.CLIENT_ID, env, notes);
        return new Response(
          JSON.stringify({ success: true, chunks_stored: stored, title }),
          { headers: { "Content-Type": "application/json", ...corsHeaders(request) } },
        );
      } catch (e) {
        console.error("Ingest-youtube error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /ingest-sheet: fetch a public Google Sheet as CSV and ingest ──────────
    if (url.pathname === "/ingest-sheet") {
      try {
        const { url: sheetUrl, source = "google-sheets", notes } = await request.json();
        if (!sheetUrl) {
          return new Response(JSON.stringify({ error: "url field required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }

        // Extract the spreadsheet ID and optional gid (tab ID)
        const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!idMatch) throw new Error("Invalid Google Sheets URL. Copy the URL directly from your browser.");
        const sheetId = idMatch[1];
        const gidMatch = sheetUrl.match(/[#&]gid=(\d+)/);
        const gid = gidMatch ? gidMatch[1] : "0";

        // Google Sheets public CSV export endpoint
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        const csvRes = await fetch(csvUrl);
        if (!csvRes.ok) {
          throw new Error("Could not access the sheet. Ensure it is shared as 'Anyone with the link can view'.");
        }

        const csv = await csvRes.text();

        // Convert CSV rows to "Header: value | Header: value" format for readability
        const lines = csv.split("\n").map((l) => l.trim()).filter((l) => l);
        if (lines.length < 2) throw new Error("Sheet appears to be empty or has only headers.");

        const headers = parseCsvLine(lines[0]);
        const rows = lines.slice(1).map((line) => {
          const vals = parseCsvLine(line);
          return headers.map((h, i) => `${h}: ${vals[i] || ""}`.trim()).join(" | ");
        });
        const text = rows.join("\n");

        const stored = await ingestText(text, source, env.CLIENT_ID, env, notes);
        return new Response(
          JSON.stringify({ success: true, chunks_stored: stored }),
          { headers: { "Content-Type": "application/json", ...corsHeaders(request) } },
        );
      } catch (e) {
        console.error("Ingest-sheet error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /stats: full analytics snapshot — chunks, conversations, leads, tickets ─
    if (url.pathname === "/stats") {
      try {
        const clientId = env.CLIENT_ID;

        // Count knowledge chunks for this client
        const chunksCount = await supabaseCount("knowledge_chunks", "client_id", clientId, env);

        // Count distinct knowledge sources and extract descriptions from first chunk per source.
        // We fetch source + first ~400 chars of content to detect [Context: ...] prefixes.
        const sourcesRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/knowledge_chunks?select=source,content&client_id=eq.${clientId}&order=created_at.asc`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        let sources = [];
        if (sourcesRes.ok) {
          const rows = await sourcesRes.json();
          // Build { source: { count, description } } — description extracted from first chunk's [Context: ...] prefix
          const sourceMeta = {};
          rows.forEach((r) => {
            if (!sourceMeta[r.source]) {
              // Try to extract [Context: ...] prefix from this (first) chunk for this source
              const ctxMatch = (r.content || "").match(/^\[Context:\s*([\s\S]*?)\]\n\n/);
              sourceMeta[r.source] = { count: 0, description: ctxMatch ? ctxMatch[1].trim() : null };
            }
            sourceMeta[r.source].count++;
          });
          sources = Object.entries(sourceMeta)
            .map(([source, meta]) => ({ source, count: meta.count, description: meta.description }))
            .sort((a, b) => b.count - a.count);
        }

        // Conversation count from Supabase
        const conversationsCount = await supabaseCount("conversations", "client_id", clientId, env);

        // Lead stats — fetch score_label, status, source for all leads, compute breakdowns in JS
        const leadsRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/leads?select=score_label,status,source&client_id=eq.${clientId}`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        let leadsTotal = 0, leadsByScore = {}, leadsByStatus = {}, leadsBySource = {};
        if (leadsRes.ok) {
          const rows = await leadsRes.json();
          leadsTotal = rows.length;
          rows.forEach(r => {
            const sl = r.score_label || 'Unknown';
            leadsByScore[sl] = (leadsByScore[sl] || 0) + 1;
            const st = r.status || 'new';
            leadsByStatus[st] = (leadsByStatus[st] || 0) + 1;
            const src = r.source || 'unknown';
            leadsBySource[src] = (leadsBySource[src] || 0) + 1;
          });
        }

        // Ticket stats — fetch status and urgency for all tickets, compute breakdowns in JS
        const ticketsRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/tickets?select=status,urgency&client_id=eq.${clientId}`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        let ticketsTotal = 0, ticketsByStatus = {}, ticketsByUrgency = {};
        if (ticketsRes.ok) {
          const rows = await ticketsRes.json();
          ticketsTotal = rows.length;
          rows.forEach(r => {
            const st = r.status || 'open';
            ticketsByStatus[st] = (ticketsByStatus[st] || 0) + 1;
            const urg = r.urgency || 'medium';
            ticketsByUrgency[urg] = (ticketsByUrgency[urg] || 0) + 1;
          });
        }

        return new Response(
          JSON.stringify({
            chunks: chunksCount,
            conversations: conversationsCount,
            leads: leadsTotal,
            leadsByScore,
            leadsByStatus,
            leadsBySource,
            tickets: ticketsTotal,
            ticketsByStatus,
            ticketsByUrgency,
            sources,
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders(request) } },
        );
      } catch (e) {
        console.error("Stats error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /analytics-conversations: list recent conversations with visitor info ───
    if (url.pathname === "/analytics-conversations") {
      try {
        const clientId = env.CLIENT_ID;
        const limit = parseInt(url.searchParams.get("limit") || "50", 10);

        // Fetch recent conversations newest-first
        const convosRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/conversations?client_id=eq.${clientId}&order=started_at.desc&limit=${limit}`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        if (!convosRes.ok) throw new Error("Failed to fetch conversations");
        const convos = await convosRes.json();

        if (convos.length === 0) {
          return new Response(JSON.stringify({ conversations: [] }),
            { headers: { "Content-Type": "application/json", ...corsHeaders(request) } });
        }

        // Batch-fetch all messages for all conversations in one request
        // This is far more efficient than N individual supabaseCount calls
        const convoIds = convos.map(c => c.id).join(",");
        const msgsRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/messages?conversation_id=in.(${convoIds})&order=created_at.asc`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        const allMsgs = msgsRes.ok ? await msgsRes.json() : [];

        // Group messages by conversation_id
        const msgsByConvo = {};
        allMsgs.forEach(m => {
          if (!msgsByConvo[m.conversation_id]) msgsByConvo[m.conversation_id] = [];
          msgsByConvo[m.conversation_id].push(m);
        });

        // Build enriched conversation objects
        const results = convos.map(c => {
          const msgs = msgsByConvo[c.id] || [];

          // Scan assistant messages for [LEAD_DATA] JSON to extract visitor name/email
          let visitor_name = null, visitor_email = null;
          for (const m of msgs) {
            if (m.role === "assistant") {
              const match = (m.content || "").match(/\[LEAD_DATA\]([\s\S]*?)\[\/LEAD_DATA\]/);
              if (match) {
                try {
                  const lead = JSON.parse(match[1]);
                  visitor_name = lead.name || lead.visitor_name || null;
                  visitor_email = lead.email || lead.visitor_email || null;
                } catch {}
                break;
              }
            }
          }

          // First user message as a preview (fallback when no lead name available)
          const firstUserMsg = msgs.find(m => m.role === "user");
          const preview = firstUserMsg ? (firstUserMsg.content || "").slice(0, 100) : null;

          return {
            id: c.id,
            visitor_id: c.visitor_id,
            started_at: c.started_at,
            last_message_at: c.last_message_at,
            message_count: msgs.length,
            visitor_name,
            visitor_email,
            preview,
          };
        });

        return new Response(
          JSON.stringify({ conversations: results }),
          { headers: { "Content-Type": "application/json", ...corsHeaders(request) } },
        );
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /conversation-detail: all messages for a given conversation_id ─────────
    if (url.pathname === "/conversation-detail") {
      try {
        const conversationId = url.searchParams.get("id");
        if (!conversationId) {
          return new Response(JSON.stringify({ error: "id query param required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }
        const msgsRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.asc`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        if (!msgsRes.ok) throw new Error("Failed to fetch messages");
        const messages = await msgsRes.json();
        return new Response(
          JSON.stringify({ messages }),
          { headers: { "Content-Type": "application/json", ...corsHeaders(request) } },
        );
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /source-context-update: update the context prefix on all chunks for a source
    // Body: { source, context }  — context can be "" to clear it
    // Fetches every chunk for the source, strips the old [Context: ...] prefix,
    // prepends the new one (if any), and PATCHes each row back.
    // This is how admins edit context after ingest without re-ingesting.
    if (url.pathname === "/source-context-update") {
      try {
        const { source, context } = await request.json();
        if (!source) {
          return new Response(JSON.stringify({ error: "source field required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }

        // Fetch all chunks for this source
        const fetchRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/knowledge_chunks?select=id,content&client_id=eq.${env.CLIENT_ID}&source=eq.${encodeURIComponent(source)}`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        if (!fetchRes.ok) throw new Error("Failed to fetch chunks for source");
        const chunks = await fetchRes.json();

        const newPrefix = context && context.trim()
          ? `[Context: ${context.trim()}]\n\n`
          : "";
        const ctxRegex = /^\[Context:\s*[\s\S]*?\]\n\n/;

        // Update each chunk: strip old prefix, add new one
        let updated = 0;
        await Promise.all(chunks.map(async (chunk) => {
          const stripped = (chunk.content || "").replace(ctxRegex, "");
          const newContent = newPrefix + stripped;
          const patchRes = await fetch(
            `${env.SUPABASE_URL}/rest/v1/knowledge_chunks?id=eq.${chunk.id}`,
            {
              method: "PATCH",
              headers: {
                apikey: env.SUPABASE_KEY,
                Authorization: `Bearer ${env.SUPABASE_KEY}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({ content: newContent }),
            },
          );
          if (patchRes.ok) updated++;
        }));

        return new Response(JSON.stringify({ updated }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        console.error("Source-context-update error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /delete-source: remove all chunks for a given source label ────────────
    // Body: { source: "services-faq" }
    // Deletes all knowledge_chunks rows matching client_id + source.
    if (url.pathname === "/delete-source") {
      try {
        const { source } = await request.json();
        if (!source) {
          return new Response(JSON.stringify({ error: "source field required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }
        const res = await fetch(
          `${env.SUPABASE_URL}/rest/v1/knowledge_chunks?client_id=eq.${env.CLIENT_ID}&source=eq.${encodeURIComponent(source)}`,
          {
            method: "DELETE",
            headers: {
              apikey: env.SUPABASE_KEY,
              Authorization: `Bearer ${env.SUPABASE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
          },
        );
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Supabase delete failed (${res.status}): ${err}`);
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        console.error("Delete-source error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /debug-rag: step-by-step RAG diagnostic — protected by SITE_API_KEY ──
    // Returns: chunk count, embedding dimensions, raw RPC result.
    // Use to diagnose why retrieveContext returns null.
    if (url.pathname === "/debug-rag") {
      const report = { clientId: env.CLIENT_ID, steps: [] };
      try {
        const testQuery = (await request.json().catch(() => ({}))).query || "what are the three pillars of DGC";
        report.query = testQuery;

        // Step 1 — direct REST query: confirm chunks exist for this client_id
        const chunkRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/knowledge_chunks?select=id,source,content&client_id=eq.${env.CLIENT_ID}&limit=3`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        const chunkData = await chunkRes.json();
        report.steps.push({
          step: "1_direct_query",
          status: chunkRes.status,
          count: Array.isArray(chunkData) ? chunkData.length : "error",
          samples: Array.isArray(chunkData)
            ? chunkData.map((c) => ({ source: c.source, preview: (c.content || "").slice(0, 80) }))
            : chunkData,
        });

        // Step 2 — embed the test query
        let queryEmbedding = null;
        try {
          queryEmbedding = await embedText(testQuery, env);
          report.steps.push({ step: "2_embed", status: "ok", dimensions: queryEmbedding.length });
        } catch (e) {
          report.steps.push({ step: "2_embed", error: e.message });
        }

        // Step 3 — call match_knowledge_chunks RPC with very low threshold and capture raw response
        if (queryEmbedding) {
          // Step 3 — call with correct param names (match_client_id, no threshold)
          const rpcRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/match_knowledge_chunks`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: env.SUPABASE_KEY,
              Authorization: `Bearer ${env.SUPABASE_KEY}`,
            },
            body: JSON.stringify({
              query_embedding: queryEmbedding,
              match_count: 4,
              match_client_id: env.CLIENT_ID,
            }),
          });
          const rpcText = await rpcRes.text();
          let rpcData;
          try { rpcData = JSON.parse(rpcText); } catch { rpcData = rpcText; }
          report.steps.push({
            step: "3_rpc_match_client_id",
            status: rpcRes.status,
            count: Array.isArray(rpcData) ? rpcData.length : "n/a",
            previews: Array.isArray(rpcData)
              ? rpcData.map((c) => ({ source: c.source, preview: (c.content || "").slice(0, 80) }))
              : rpcData,
          });
        }
      } catch (e) {
        report.fatal_error = e.message;
      }
      return new Response(JSON.stringify(report, null, 2), {
        headers: { "Content-Type": "application/json", ...corsHeaders(request) },
      });
    }

    // ── /debug-memory: step-by-step visitor memory diagnostic ────────────────
    if (url.pathname === "/debug-memory") {
      const report = { clientId: env.CLIENT_ID, steps: [] };
      try {
        const visitorId = "debug-visitor-test-001";

        // Step 1 — try to create a conversation row
        const createRes = await fetch(`${env.SUPABASE_URL}/rest/v1/conversations`, {
          method: "POST",
          headers: {
            apikey: env.SUPABASE_KEY,
            Authorization: `Bearer ${env.SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ visitor_id: visitorId, client_id: env.CLIENT_ID }),
        });
        const createText = await createRes.text();
        let createData;
        try { createData = JSON.parse(createText); } catch { createData = createText; }
        report.steps.push({ step: "1_create_conversation", status: createRes.status, result: createData });

        const conversationId = Array.isArray(createData) ? createData[0]?.id : createData?.id;

        if (conversationId) {
          // Step 2 — insert a test message
          const msgRes = await fetch(`${env.SUPABASE_URL}/rest/v1/messages`, {
            method: "POST",
            headers: {
              apikey: env.SUPABASE_KEY,
              Authorization: `Bearer ${env.SUPABASE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ conversation_id: conversationId, role: "user", content: "debug test message" }),
          });
          report.steps.push({ step: "2_insert_message", status: msgRes.status });

          // Step 3 — fetch messages back
          const fetchRes = await fetch(
            `${env.SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.asc`,
            { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
          );
          const fetchData = await fetchRes.json();
          report.steps.push({ step: "3_fetch_messages", status: fetchRes.status, count: Array.isArray(fetchData) ? fetchData.length : "error", result: fetchData });

          // Clean up test data
          await fetch(`${env.SUPABASE_URL}/rest/v1/conversations?id=eq.${conversationId}`, {
            method: "DELETE",
            headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}`, Prefer: "return=minimal" },
          });
        }
      } catch (e) {
        report.fatal_error = e.message;
      }
      return new Response(JSON.stringify(report, null, 2), {
        headers: { "Content-Type": "application/json", ...corsHeaders(request) },
      });
    }

    // ── /tickets: list all support tickets for this client ───────────────────
    // Returns tickets newest-first. Optional ?status= filter (open/in_progress/resolved).
    // Used by the VAULT Tickets page to render the ticket list.
    if (url.pathname === "/tickets") {
      try {
        const status = url.searchParams.get("status");
        let query = `${env.SUPABASE_URL}/rest/v1/tickets?client_id=eq.${env.CLIENT_ID}&order=created_at.desc`;
        if (status) query += `&status=eq.${encodeURIComponent(status)}`;
        const res = await fetch(query, {
          headers: {
            apikey: env.SUPABASE_KEY,
            Authorization: `Bearer ${env.SUPABASE_KEY}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Supabase tickets fetch failed (${res.status}): ${err}`);
        }
        const tickets = await res.json();
        return new Response(JSON.stringify({ tickets }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        console.error("Tickets list error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /tickets-update: PATCH ticket status or notes ─────────────────────────
    // Body: { ticket_id: "DGC-...", status: "in_progress" | "open" | "resolved" }
    // Used by the VAULT Tickets page status dropdown.
    if (url.pathname === "/tickets-update") {
      try {
        const { ticket_number, status, notes } = await request.json();
        if (!ticket_number) {
          return new Response(JSON.stringify({ error: "ticket_number required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }
        const patch = {};
        if (status) patch.status = status;
        if (notes !== undefined) patch.notes = notes;
        patch.updated_at = new Date().toISOString();

        const res = await fetch(
          `${env.SUPABASE_URL}/rest/v1/tickets?client_id=eq.${env.CLIENT_ID}&ticket_number=eq.${encodeURIComponent(ticket_number)}`,
          {
            method: "PATCH",
            headers: {
              apikey: env.SUPABASE_KEY,
              Authorization: `Bearer ${env.SUPABASE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(patch),
          },
        );
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Supabase ticket update failed (${res.status}): ${err}`);
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        console.error("Tickets update error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /ticket-crm-push: upsert ticket visitor as HubSpot contact + note ────
    // Body: { ticket_id: "DGC-...", visitor_name: "", visitor_email: "", ... }
    // Creates/updates a HubSpot contact and logs a note with the ticket details.
    // HUBSPOT_ACCESS_TOKEN must be set as a secret in the Worker environment.
    if (url.pathname === "/ticket-crm-push") {
      try {
        const body = await request.json();
        const { ticket_number, visitor_name, visitor_email, description, urgency } = body;

        if (!visitor_email) {
          return new Response(JSON.stringify({ error: "visitor_email required for CRM push" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }
        if (!env.HUBSPOT_ACCESS_TOKEN) {
          return new Response(JSON.stringify({ error: "HUBSPOT_ACCESS_TOKEN not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }

        // Upsert contact by email
        const [firstName, ...lastParts] = (visitor_name || "").split(" ");
        const lastName = lastParts.join(" ");
        const upsertRes = await fetch(
          "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: [{
                idProperty: "email",
                properties: {
                  email: visitor_email,
                  firstname: firstName || "",
                  lastname: lastName || "",
                  hs_lead_status: "IN_PROGRESS",
                },
              }],
            }),
          },
        );
        if (!upsertRes.ok) {
          const err = await upsertRes.text();
          throw new Error(`HubSpot upsert failed (${upsertRes.status}): ${err}`);
        }
        const upsertData = await upsertRes.json();
        const contactId = upsertData?.results?.[0]?.id;

        // Log a note on the contact with ticket details
        if (contactId) {
          const noteBody = [
            `Support Ticket: ${ticket_number || "N/A"}`,
            `Urgency: ${urgency || "medium"}`,
            `Issue: ${description || "No description provided"}`,
          ].join("\n");

          await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              properties: {
                hs_note_body: noteBody,
                hs_timestamp: Date.now().toString(),
              },
              associations: [{
                to: { id: contactId },
                types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
              }],
            }),
          });
        }

        // Mark ticket as pushed in Supabase
        if (ticket_number) {
          await fetch(
            `${env.SUPABASE_URL}/rest/v1/tickets?client_id=eq.${env.CLIENT_ID}&ticket_number=eq.${encodeURIComponent(ticket_number)}`,
            {
              method: "PATCH",
              headers: {
                apikey: env.SUPABASE_KEY,
                Authorization: `Bearer ${env.SUPABASE_KEY}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({ crm_pushed: true, updated_at: new Date().toISOString() }),
            },
          );
        }

        return new Response(JSON.stringify({ success: true, contactId: contactId || null }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        console.error("Ticket CRM push error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /lead-capture: save contact form leads to Supabase ───────────────────
    // Called in parallel with Formspree from the contact form on index.html.
    // Emails are handled by Formspree — this endpoint is purely for VAULT persistence.
    if (url.pathname === "/lead-capture") {
      try {
        const { name, email, phone, company, message, source } = await request.json();
        await supabaseInsert("leads", {
          client_id:     env.CLIENT_ID,
          visitor_name:  name    || "",
          visitor_email: email   || "",
          visitor_phone: phone   || "",
          company:       company || "",
          source:        source  || "contact-form",
          message:       message || "",
          status:        "new",
        }, env);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        console.error("Lead capture error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /leads: list all leads for this client ───────────────────────────────
    // Returns leads newest-first. Optional ?status= or ?score_label= filter.
    // Used by the VAULT Leads page.
    if (url.pathname === "/leads") {
      try {
        const statusFilter    = url.searchParams.get("status");
        const scoreFilter     = url.searchParams.get("score_label");
        let query = `${env.SUPABASE_URL}/rest/v1/leads?client_id=eq.${env.CLIENT_ID}&order=created_at.desc`;
        if (statusFilter) query += `&status=eq.${encodeURIComponent(statusFilter)}`;
        if (scoreFilter)  query += `&score_label=eq.${encodeURIComponent(scoreFilter)}`;
        const res = await fetch(query, {
          headers: {
            apikey:        env.SUPABASE_KEY,
            Authorization: `Bearer ${env.SUPABASE_KEY}`,
            Accept:        "application/json",
          },
        });
        if (!res.ok) throw new Error(`Supabase leads fetch failed (${res.status})`);
        const leads = await res.json();
        return new Response(JSON.stringify({ leads }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        console.error("Leads list error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /leads-update: PATCH lead status, notes, or crm_pushed ───────────────
    // Body: { lead_id, status?, notes?, crm_pushed? }
    // Used by VAULT Leads page status dropdown and CRM push button.
    if (url.pathname === "/leads-update") {
      try {
        const { lead_id, status, notes, crm_pushed } = await request.json();
        if (!lead_id) {
          return new Response(JSON.stringify({ error: "lead_id required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }
        const patch = { updated_at: new Date().toISOString() };
        if (status     !== undefined) patch.status     = status;
        if (notes      !== undefined) patch.notes      = notes;
        if (crm_pushed !== undefined) patch.crm_pushed = crm_pushed;
        const res = await fetch(
          `${env.SUPABASE_URL}/rest/v1/leads?id=eq.${lead_id}&client_id=eq.${env.CLIENT_ID}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey:         env.SUPABASE_KEY,
              Authorization:  `Bearer ${env.SUPABASE_KEY}`,
              Prefer:         "return=minimal",
            },
            body: JSON.stringify(patch),
          },
        );
        if (!res.ok) throw new Error(`Supabase leads update failed (${res.status})`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        console.error("Leads update error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /playground: test ECHO live with full RAG + visible retrieved chunks ──
    // Body: { query: "..." }
    // Returns: { response, chunks_retrieved: [{source, preview, similarity}], rag_used }
    // Runs the exact same RAG + Claude pipeline as the real chat — nothing mocked.
    // The chunks_retrieved array lets admins see exactly which knowledge was used.
    if (url.pathname === "/playground") {
      try {
        const { query } = await request.json();
        if (!query || query.trim().length < 2) {
          return new Response(JSON.stringify({ error: "query field required" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders(request) },
          });
        }

        // Step 1: Embed the query (same as real chat)
        let chunks_retrieved = [];
        let rag_used = false;
        let contextText = null;
        let debug = null; // surface failure reason to UI

        if (!env.OPENAI_API_KEY) debug = "OPENAI_API_KEY not set on worker";
        else if (!env.SUPABASE_URL || !env.SUPABASE_KEY) debug = "Supabase env vars missing";
        else if (!env.CLIENT_ID) debug = "CLIENT_ID not set on worker";

        if (env.OPENAI_API_KEY && env.SUPABASE_URL && env.SUPABASE_KEY) {
          try {
            const queryEmbedding = await embedText(query, env);
            const chunks = await supabaseRpc("match_knowledge_chunks", {
              query_embedding: queryEmbedding,
              match_count: 4,
              match_client_id: env.CLIENT_ID,
            }, env);
            debug = `RPC returned ${Array.isArray(chunks) ? chunks.length : 'non-array'} chunks`;
            if (chunks && chunks.length > 0) {
              // Strip [Context: ...] prefix from content before sending to UI so the preview
              // shows the actual content, not the admin-supplied notes prefix
              chunks_retrieved = chunks.map((c) => {
                const rawContent = c.content || "";
                const ctxMatch = rawContent.match(/^\[Context:\s*([\s\S]*?)\]\n\n/);
                const context = ctxMatch ? ctxMatch[1].trim() : null;
                const cleanContent = ctxMatch ? rawContent.slice(ctxMatch[0].length) : rawContent;
                return {
                  source:     c.source || null,   // null if RPC doesn't return source yet
                  id:         c.id || null,         // used to look up source if missing
                  context,                          // the admin notes prefix, if any
                  content:    cleanContent,         // full chunk text for expandable UI
                  similarity: c.similarity != null ? Math.round(c.similarity * 100) / 100 : null,
                };
              });
              // If source is missing from RPC result, fetch from knowledge_chunks by id
              const missingSource = chunks_retrieved.some((c) => !c.source && c.id);
              if (missingSource) {
                try {
                  const ids = chunks_retrieved.filter((c) => !c.source && c.id).map((c) => c.id);
                  const idFilter = ids.map((id) => `id=eq.${id}`).join(",");
                  const srcRes = await fetch(
                    `${env.SUPABASE_URL}/rest/v1/knowledge_chunks?select=id,source&or=(${idFilter})`,
                    { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
                  );
                  if (srcRes.ok) {
                    const srcRows = await srcRes.json();
                    const srcMap = {};
                    srcRows.forEach((r) => { srcMap[r.id] = r.source; });
                    chunks_retrieved = chunks_retrieved.map((c) => ({
                      ...c,
                      source: c.source || srcMap[c.id] || "unknown",
                    }));
                  }
                } catch { /* non-fatal — source stays null */ }
              }
              contextText = chunks.map((c) => c.content).join("\n\n---\n\n");
              rag_used = true;
            }
          } catch (e) {
            debug = `RAG error: ${e.message}`;
            console.error("Playground RAG error:", e.message);
          }
        }

        // Step 2: Build system prompt (same as real chat, respects custom prompt from Settings)
        let systemPrompt = await getSystemPrompt(env);
        if (contextText) {
          systemPrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nKNOWLEDGE BASE — use this to answer accurately\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${contextText}`;
        }

        // Step 3: Call Claude with no conversation history (single-shot test)
        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 400,
            system: systemPrompt,
            messages: [{ role: "user", content: query }],
          }),
        });
        const claudeData = await claudeRes.json();
        const rawResponse = claudeData?.content?.[0]?.text || "";

        // Strip any tag artifacts (LEAD_DATA, SUPPORT_TICKET, SHOW_CONTACT)
        const cleanResponse = rawResponse
          .replace(/\[LEAD_DATA\].*?\[\/LEAD_DATA\]/gs, "")
          .replace(/\[SUPPORT_TICKET\].*?\[\/SUPPORT_TICKET\]/gs, "")
          .replace(/\[SHOW_CONTACT\]/g, "")
          .trim();

        return new Response(JSON.stringify({ response: cleanResponse, chunks_retrieved, rag_used, debug }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        console.error("Playground error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /widget-config: public config fetched by widget.js on page load ─────────
    // Returns display config (name, colors, greeting) for a given client_id.
    // Uses open CORS — this endpoint is called from arbitrary client websites.
    // No auth required — only public, non-sensitive data is returned.
    if (url.pathname === "/widget-config") {
      const clientIdParam = url.searchParams.get("client_id") || env.CLIENT_ID;
      try {
        const res = await fetch(
          `${env.SUPABASE_URL}/rest/v1/clients?id=eq.${clientIdParam}&select=id,name,widget_config`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        const rows = res.ok ? await res.json() : [];
        const row = rows?.[0] || {};
        const widgetCfg = row.widget_config || {};
        return new Response(JSON.stringify({
          client_id:     clientIdParam,
          display_name:  widgetCfg.display_name  || "ECHO",
          brand_line:    widgetCfg.brand_line     || "AI Assistant",
          greeting:      widgetCfg.greeting       || "Hi! I'm ECHO. How can I help you today?",
          primary_color: widgetCfg.primary_color  || "#2d5a8f",
          starters:      widgetCfg.starters       || null,
          worker_url:    `https://dgc-chat-api.ericdahan10.workers.dev`,
          api_key:       env.SITE_API_KEY || "",
        }), {
          headers: { "Content-Type": "application/json", ...openCorsHeaders() },
        });
      } catch (e) {
        // Return safe defaults if Supabase is unavailable
        return new Response(JSON.stringify({
          client_id:     clientIdParam,
          display_name:  "ECHO",
          brand_line:    "AI Assistant",
          greeting:      "Hi! I'm ECHO. How can I help you today?",
          primary_color: "#2d5a8f",
          worker_url:    `https://dgc-chat-api.ericdahan10.workers.dev`,
          api_key:       env.SITE_API_KEY || "",
        }), {
          headers: { "Content-Type": "application/json", ...openCorsHeaders() },
        });
      }
    }

    // ── /settings-get: read current bot configuration from clients table ────────
    // Returns system_prompt (custom if set, default otherwise), is_custom flag,
    // and the default prompt so the Settings page can show a Reset to Default option.
    if (url.pathname === "/settings-get") {
      try {
        const res = await fetch(
          `${env.SUPABASE_URL}/rest/v1/clients?id=eq.${env.CLIENT_ID}&select=system_prompt,name`,
          { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } },
        );
        if (!res.ok) throw new Error("Failed to fetch client settings");
        const rows = await res.json();
        const row = rows?.[0] || {};
        const customPrompt = row.system_prompt && row.system_prompt.trim() ? row.system_prompt : null;
        return new Response(JSON.stringify({
          system_prompt:  customPrompt || DGC_SYSTEM_PROMPT,
          is_custom:      !!customPrompt,
          default_prompt: DGC_SYSTEM_PROMPT,
          client_name:    row.name || "DGC",
        }), { headers: { "Content-Type": "application/json", ...corsHeaders(request) } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /settings-save: update (or reset) the system prompt in clients table ────
    // Body: { system_prompt: "..." }  — saves custom prompt
    // Body: { reset: true }           — clears custom prompt (reverts to hardcoded default)
    // Setting system_prompt to null in Supabase tells getSystemPrompt() to fall back to DGC_SYSTEM_PROMPT.
    if (url.pathname === "/settings-save") {
      try {
        const { system_prompt, reset } = await request.json();
        // reset: true wipes the custom prompt; otherwise save the trimmed value (null if empty)
        const newPrompt = reset ? null : ((system_prompt || "").trim() || null);
        const res = await fetch(
          `${env.SUPABASE_URL}/rest/v1/clients?id=eq.${env.CLIENT_ID}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey:         env.SUPABASE_KEY,
              Authorization:  `Bearer ${env.SUPABASE_KEY}`,
              Prefer:         "return=minimal",
            },
            body: JSON.stringify({ system_prompt: newPrompt }),
          },
        );
        if (!res.ok) throw new Error(`Failed to save settings (${res.status})`);
        return new Response(JSON.stringify({ success: true, is_custom: !reset && !!newPrompt }), {
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      }
    }

    // ── /escalation endpoint: proxy escalation form direct to Apps Script ──
    if (url.pathname === "/escalation") {
      // Tickets are now stored in Supabase (Google Sheets logging removed)
      try {
        assertRequiredEnv(env, [
          "GOOGLE_APPS_SCRIPT_URL",
          "FORMSPREE_URL",
          "ADMIN_EMAIL",
          "LEAD_WORKER_URL",
          "ANTHROPIC_API_KEY",
        ]);
        const payload = await request.json();

        // Save ticket to Supabase — primary storage
        await saveTicketToSupabase(payload, env);

        // Send confirmation email to client via Apps Script (Gmail)
        if (payload.clientEmail) {
          const html = buildConfirmationEmail(
            payload.clientName,
            payload.ticketId,
          );
          ctx.waitUntil(
            postToAppsScript(
              {
                to: payload.clientEmail,
                subject: `We've received your request — Ticket ${payload.ticketId}`,
                body: `Hi ${payload.clientName || "there"},\n\nWe've received your support request and will be in touch within 2–3 business days.\n\nTicket ID: ${payload.ticketId}\n\nThe DGC Team`,
                html,
              },
              env,
            ),
          );
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(request),
          },
        });
      } catch (e) {
        console.error("Escalation proxy error:", e.message);
        return new Response(
          JSON.stringify({ success: false, error: e.message }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(request),
            },
          },
        );
      }
    }

    try {
      assertRequiredEnv(env, [
        "GOOGLE_APPS_SCRIPT_URL",
        "FORMSPREE_URL",
        "ADMIN_EMAIL",
        "LEAD_WORKER_URL",
        "ANTHROPIC_API_KEY",
      ]);
      const body = await request.json();
      const messages = body.messages || [];
      const visitorId = body.visitor_id || null;

      // ── Visitor Memory: load prior conversation history ───────────────────
      // Fetches previous sessions from Supabase so ECHO remembers returning visitors.
      // Fails silently — if Supabase is unreachable, chat continues without history.
      let conversationId = null;
      let priorHistory = [];
      if (visitorId && env.SUPABASE_URL && env.SUPABASE_KEY) {
        try {
          conversationId = await getOrCreateConversation(visitorId, env.CLIENT_ID, env);
          // Fetch last 10 messages from previous sessions (not the current session — frontend sends those)
          const history = await fetchConversationHistory(conversationId, 10, env);
          // Only include history that predates the current session messages to avoid duplication
          // Current session is whatever the frontend sent; prior history is everything before
          if (history.length > 0) priorHistory = history;
        } catch (e) {
          console.error("Visitor memory fetch error (non-fatal):", e.message);
        }
      }

      // ── RAG: inject relevant knowledge before calling Claude ──────────────
      // Finds chunks in Supabase closest to the user's latest message.
      // If no chunks found (or RAG errors), chat continues with base prompt.
      // getSystemPrompt() checks for a custom prompt in Supabase first (set via VAULT Settings).
      let systemPrompt = await getSystemPrompt(env);
      const lastUserMsg = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUserMsg && env.OPENAI_API_KEY && env.SUPABASE_URL) {
        const context = await retrieveContext(lastUserMsg.content, env.CLIENT_ID, env);
        if (context) {
          systemPrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nKNOWLEDGE BASE — use this to answer accurately\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${context}`;
        }
      }

      // If prior history exists, explicitly tell ECHO it remembers this visitor.
      // Without this, Claude's base training causes it to deny having memory even
      // when prior conversation is right there in the context.
      if (priorHistory.length > 0) {
        systemPrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nRETURNING VISITOR\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nThis visitor has spoken with you before. The conversation history above is real — you have access to it and should use it. Do NOT say you have no memory or that each chat starts fresh. If they ask whether you remember them, confirm that you do and reference what you know about them naturally and briefly.`;
      }

      // Merge prior history (past sessions) with current session messages.
      // Claude sees the full context: what was said before + what's being said now.
      const allMessages = [...priorHistory, ...messages];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: systemPrompt,
          messages: allMessages,
        }),
      });

      const data = await response.json();
      const chatContext = buildChatContext(messages);
      let rawText = data?.content?.[0]?.text || "";

      // ── Step 1: Extract support ticket tag ───────────────────────────────
      const { ticketData, cleanText: afterTicket } =
        extractSupportTicket(rawText);
      rawText = afterTicket;

      // ── Step 2: Extract lead data tag ─────────────────────────────────────
      const { leadData: tagLead, cleanText: afterLead } =
        extractLeadFromTags(rawText);
      rawText = afterLead;

      // ── Step 3: [FIX] Extract [SHOW_CONTACT] tag ─────────────────────────
      const { showContact, cleanText: afterContact } =
        extractShowContact(rawText);
      rawText = afterContact;

      // Update response text — no tags leak to the user
      if (data?.content?.[0]) {
        data.content[0].text = rawText;
      }

      // ── [FIX] Add routing hints to response so frontend knows what to show
      // We add a _routing field that the frontend reads to decide which form to show
      const routing = {};
      if (ticketData) routing.action = "escalation";
      else if (showContact) routing.action = "contact";
      else routing.action = "none";

      // ── Step 4: Handle support ticket ─────────────────────────────────────
      if (ticketData) {
        console.log("Support ticket detected:", JSON.stringify(ticketData));

        // Enrich ticket with lead info if we have it
        if (tagLead?.email && !ticketData.email)
          ticketData.email = tagLead.email;
        if (tagLead?.name && !ticketData.name) ticketData.name = tagLead.name;

        // Also try fallback scan for name/email if still missing
        if (!ticketData.email) {
          const fallback = extractLeadFromConversation(messages);
          if (fallback?.email) {
            ticketData.email = fallback.email;
            ticketData.name = ticketData.name || fallback.name;
            ticketData.phone = ticketData.phone || fallback.phone;
          }
        }

        // Pass ticket data to frontend for the escalation form
        routing.ticketData = {
          issue_summary: ticketData.issue_summary || "",
          category: ticketData.category || "escalation",
          urgency: ticketData.urgency || "medium",
        };
      }

      // ── Step 5: Handle lead capture (skip if support ticket was raised) ─────
      let leadSubmitted = false;

      if (ticketData) {
        // User is an existing customer escalating an issue — not a new lead
        leadSubmitted = true;
      }

      if (!leadSubmitted && tagLead?.email) {
        console.log("Lead found via tags:", JSON.stringify(tagLead));
        ctx.waitUntil(sendToLeadWorker(tagLead, chatContext, env));
        leadSubmitted = true;
      }

      // Fallback: scan last user message for email
      if (!leadSubmitted) {
        const lastUserMsg = messages.filter((m) => m.role === "user").pop();
        if (
          lastUserMsg &&
          /[\w.+-]+@[\w-]+\.[\w.]+/.test(lastUserMsg.content)
        ) {
          const fallbackLead = extractLeadFromConversation(messages);
          if (fallbackLead) {
            console.log(
              "Lead found via fallback:",
              JSON.stringify(fallbackLead),
            );
            ctx.waitUntil(sendToLeadWorker(fallbackLead, chatContext, env));
          }
        }
      }

      // ── Visitor Memory: save this turn in the background ─────────────────
      // Uses ctx.waitUntil so the save happens after the response is sent —
      // the visitor never waits for the Supabase write.
      if (conversationId && lastUserMsg && rawText) {
        ctx.waitUntil(
          saveConversationTurn(conversationId, lastUserMsg.content, rawText, env).catch((e) =>
            console.error("Visitor memory save error (non-fatal):", e.message),
          ),
        );
      }

      // ── Return response with routing info ────────────────────────────────
      // Use openCorsHeaders so widget.js works when embedded on any client site.
      const responseBody = { ...data, _routing: routing };

      return new Response(JSON.stringify(responseBody), {
        headers: {
          "Content-Type": "application/json",
          ...openCorsHeaders(),
        },
      });
    } catch (err) {
      console.error("Worker error:", err.message);
      return new Response(
        JSON.stringify({ error: "API call failed. Please try again." }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...openCorsHeaders(),
          },
        },
      );
    }
  },
};
