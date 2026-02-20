import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { Progress } from "./components/ui/progress";
import { Switch } from "./components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { CheckCircle2, AlertCircle, Clock, FileText, Mail, Play, Pause, RefreshCw, ShieldCheck, Sparkles, Upload, Wand2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

/**
 * Deal Motivation Digitization — Demo App
 *
 * This demo showcases an end-to-end workflow with clear separation of:
 * - Human steps (user actions)
 * - Automation steps (rules/workflow gates)
 * - AI assistance (summaries, extraction, anomaly flags)
 *
 * Everything is mocked/in-memory so you can quickly demo the concept.
 */

// -----------------------------
// Helpers
// -----------------------------

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function ragFromStage(stage) {
  const order = [
    "Draft",
    "ReadyForModel",
    "ReadyForPreApprovals",
    "AwaitingPreApprovals",
    "ReadyForDoA",
    "InDoA",
    "Approved",
    "DeploymentReady",
    "Deploying",
    "PostApprovalTasks",
    "Live",
  ];
  const idx = order.indexOf(stage);
  if (idx <= 1) return "Grey";
  if (idx <= 3) return "Amber";
  if (idx <= 6) return "Amber";
  if (idx <= 9) return "Amber";
  return "Green";
}

function badgeVariantForRag(rag) {
  if (rag === "Green") return "default";
  if (rag === "Amber") return "secondary";
  if (rag === "Red") return "destructive";
  return "outline";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toCSV(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes("\n") || s.includes("\"") ) return `"${s.replaceAll('"','""')}"`;
    return s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -----------------------------
// Mock AI
// -----------------------------

function mockAIExtract(notes) {
  // Simple heuristic extraction for demo.
  const lower = (notes || "").toLowerCase();
  const dealType = lower.includes("sim") ? "SIM-Only" : "Device + Plan";
  const channel = lower.includes("sme") ? "SME" : lower.includes("enterprise") ? "Enterprise" : "Consumer";
  const duration = lower.includes("36") ? 36 : lower.includes("24") ? 24 : 24;
  const target = lower.includes("r") ? (Number((notes.match(/r\s?(\d+)/i) || [])[1]) || 499) : 499;
  const requiresOem = lower.includes("oem") || lower.includes("subsid") || lower.includes("device");
  const needsIcasa = dealType === "SIM-Only";

  const missing = [];
  if (!lower.includes("competitor") && !lower.includes("quote")) missing.push("Competitive evidence not referenced");
  if (!lower.includes("volume") && !lower.includes("units") && !lower.includes("qty")) missing.push("Volume/target units not provided");

  return {
    extracted: {
      dealName: "Vodacom Response — Back-to-School",
      dealType,
      channel,
      durationMonths: duration,
      targetMonthlyPrice: target,
      startDate: daysFromNow(7),
      endDate: daysFromNow(45),
      rationale:
        "Competitive response to retain share in targeted segment; pricing aligned to competitor signal; request time-bound for campaign window.",
      requiresOemFunding: requiresOem,
      requiresIcasa: needsIcasa,
    },
    aiSummary:
      "I converted your notes into a structured deal. I flagged missing volume and competitor proof if not included. You can generate deal lines next.",
    flags: missing,
  };
}

function mockAIReferenceDataCheck(datasetName, rows) {
  // Heuristic checks for demo.
  const issues = [];
  const keys = new Set();
  rows.forEach((r, i) => {
    const k = r.code || r.sku || r.name || `row_${i}`;
    if (keys.has(k)) issues.push({ severity: "High", msg: `Duplicate key detected: ${k}` });
    keys.add(k);
    if (typeof r.price === "number" && r.price <= 0) issues.push({ severity: "High", msg: `Non-positive price on ${k}` });
    if (typeof r.price === "number" && r.price > 100000) issues.push({ severity: "Medium", msg: `Unusually high price on ${k}` });
    if (r.status === "Discontinued" && r.active === true) issues.push({ severity: "High", msg: `Item marked Discontinued but active=true on ${k}` });
  });

  if (datasetName === "Competitor" && rows.some((r) => !r.source)) {
    issues.push({ severity: "Medium", msg: "Some competitor rows are missing a source reference" });
  }

  if (!issues.length) issues.push({ severity: "Info", msg: "No issues detected — looks consistent." });

  const summary = `Checked ${rows.length} rows for duplicates, missing fields, and outliers. Found ${issues.filter((x) => x.severity !== "Info").length} actionable issue(s).`;

  return { issues, summary };
}

function mockAISummarizeDecisionPack(dealCase) {
  const lines = dealCase.lines || [];
  const risky = [];
  if (dealCase.requiresIcasa) risky.push("ICASA lodgement required (SIM-only)");
  if (dealCase.requiresOemFunding) risky.push("OEM funding confirmation required");
  if (dealCase.financials?.marginPct < 12) risky.push("Low margin vs norm");
  if ((dealCase.attachments || []).length === 0) risky.push("No attachments provided");

  return {
    brief:
      `${dealCase.dealName || "Deal"} — ${dealCase.dealType} | Channel: ${dealCase.channel} | Duration: ${dealCase.durationMonths} months | Target: R${dealCase.targetMonthlyPrice}/mo. ` +
      `Lines: ${lines.length}. Estimated margin: ${dealCase.financials?.marginPct?.toFixed?.(1) ?? "—"}%. DoA level: ${dealCase.financials?.doaLevel ?? "—"}.`,
    risks: risky.length ? risky : ["No major risks flagged in this demo."],
    ask: "Approve the deal lines and confirm the commercial rationale. If needed, remove specific lines and approve the rest.",
  };
}

function mockAIExplainDeploymentFailure(err) {
  const e = (err || "").toLowerCase();
  if (e.includes("missing") && e.includes("priceplan")) return "Likely cause: required price plan code missing or not active in reference data. Fix: select an active plan or update reference data and re-run QA.";
  if (e.includes("date")) return "Likely cause: invalid start/end date combination. Fix: ensure start is in future and end is after start. Re-run QA.";
  if (e.includes("oem")) return "Likely cause: OEM funding flagged as required but confirmation not attached. Fix: upload OEM approval letter and re-run deployment readiness.";
  return "Likely cause: configuration mismatch between reference data and deployment template. Fix: re-run QA, compare codes, and update the affected fields.";
}

// -----------------------------
// Deterministic Financial Engine (Demo)
// -----------------------------

function runFinancialModel(dealCase) {
  const lines = dealCase.lines || [];

  // Toy logic: margin depends on target price, discounts, and device subsidy.
  const baseARPU = clamp(Number(dealCase.targetMonthlyPrice || 499), 99, 1999);
  const duration = clamp(Number(dealCase.durationMonths || 24), 1, 60);

  let totalDiscount = 0;
  let subsidy = 0;

  lines.forEach((l) => {
    totalDiscount += Number(l.monthlyDiscount || 0);
    subsidy += Number(l.deviceSubsidy || 0);
  });

  const avgDiscount = lines.length ? totalDiscount / lines.length : 0;
  const avgSubsidy = lines.length ? subsidy / lines.length : 0;

  // Simplified margin formula.
  const marginPct = clamp(28 - (avgDiscount / 20) - (avgSubsidy / 800) * 10, 2, 45);
  const paybackMonths = clamp(Math.round(6 + (avgSubsidy / 250) + (avgDiscount / 15)), 3, 36);

  // DoA tiers (demo)
  let doaLevel = "L1";
  if (marginPct < 18 || avgSubsidy > 900) doaLevel = "L2";
  if (marginPct < 12 || avgSubsidy > 1300) doaLevel = "L3";
  if (marginPct < 8 || avgSubsidy > 1700) doaLevel = "EXCO";

  const oemFundingRequired = dealCase.requiresOemFunding;
  const oemFundingSuggested = oemFundingRequired ? clamp(Math.round(avgSubsidy * 0.75), 200, 2000) : 0;

  return {
    baseARPU,
    duration,
    marginPct,
    paybackMonths,
    doaLevel,
    avgDiscount,
    avgSubsidy,
    oemFundingSuggested,
    notes:
      "Demo financial engine: deterministic calculations + DoA thresholds. In production, this would mirror MTN commercial model rules.",
  };
}

// -----------------------------
// Initial demo data
// -----------------------------

const DEMO_REF = {
  devices: [
    { code: "DEV-A14", name: "Aphone 14 (128GB)", price: 10999, status: "Active", stock: 220 },
    { code: "DEV-S21", name: "Sammy S21 FE", price: 8999, status: "Active", stock: 65 },
    { code: "DEV-N10", name: "Noko 10", price: 3999, status: "Active", stock: 480 },
  ],
  pricePlans: [
    { code: "PP-399", name: "Flex 399", price: 399, status: "Active" },
    { code: "PP-499", name: "Flex 499", price: 499, status: "Active" },
    { code: "PP-699", name: "Flex 699", price: 699, status: "Active" },
  ],
  addOns: [
    { code: "AO-5GB", name: "Extra 5GB", price: 49, status: "Active" },
    { code: "AO-10GB", name: "Extra 10GB", price: 79, status: "Active" },
  ],
  competitor: [
    { name: "Vodacom", offer: "SIM-only R399, 20GB", source: "Retail flyer", observed: "2026-02-01" },
    { name: "Telkom", offer: "Device+Plan R499 with Aphone 14", source: "Online listing", observed: "2026-02-03" },
  ],
};

const DEMO_SYSTEMS = [
  { id: "sys_ilula", name: "iLula (Promo Mgmt)" },
  { id: "sys_nucleus", name: "Nucleus (Billing)" },
  { id: "sys_crm", name: "CRM (Deal/Customer Ops)" },
  { id: "sys_channels", name: "Channels (USSD/App/Web)" },
];

const DEMO_APPROVERS = [
  { id: "ap_1", name: "Pricing Manager", level: "L1" },
  { id: "ap_2", name: "Commercial Head", level: "L2" },
  { id: "ap_3", name: "Finance Director", level: "L3" },
  { id: "ap_4", name: "EXCO", level: "EXCO" },
];
// -----------------------------
// User Journey Narrator (top-of-screen guide)
// -----------------------------

const JOURNEY_STEPS = [
  {
    key: "intro",
    title: "Orientation",
    role: "Requestor",
    view: "Overview",
    narrative:
      "This demo shows how a deal moves from reference data → intake → financials → approvals → deployment → go-live tasks. You control the pace step-by-step.",
    human: [
      "Switch roles to show responsibility and separation of duties.",
      "Use the module buttons to view each stage artefact.",
    ],
    automation: [
      "Stages auto-advance when gates are met (toggle Auto-advance in the sidebar).",
      "Audit trail records every major action.",
    ],
    ai: ["The AI panel explains what changed, what’s missing, and what to do next."],
    watch: [
      "Left sidebar: Deal stage + progress bar",
      "Left sidebar: AI panel narrative",
      "Any module: status badges and gating alerts",
    ],
    actionKey: null,
    actionLabel: null,
  },
  {
    key: "ref_upload",
    title: "Reference data — upload update",
    role: "Data Steward",
    view: "Reference Data",
    narrative:
      "We simulate a reference data update (devices/plans/etc.). Automation versions it. AI checks for duplicates and outliers.",
    human: ["Data Steward uploads an updated dataset."],
    automation: ["A new version is created (Pending Review) and added to history."],
    ai: ["AI flags anomalies (e.g., duplicate device code) and produces a short summary."],
    watch: [
      "Reference Data → Versions card (look for Pending Review)",
      "AI check summary box inside the version card",
    ],
    actionKey: "REF_UPLOAD",
    actionLabel: "Upload sample update",
  },
  {
    key: "ref_approve",
    title: "Reference data — peer review approval",
    role: "Peer Reviewer",
    view: "Reference Data",
    narrative:
      "A peer reviewer approves the pending version. Automation promotes it to Active and archives the previous Active version.",
    human: ["Peer Reviewer approves the version."],
    automation: ["System sets the approved version to Active and archives the previous version."],
    ai: ["AI notes what changed and whether issues remain."],
    watch: ["Reference Data → Versions (Active/Archived badges)", "Audit trail entry"],
    actionKey: "REF_APPROVE",
    actionLabel: "Approve pending version",
  },
  {
    key: "intake_extract",
    title: "Deal intake — convert notes into structured fields",
    role: "Requestor",
    view: "Deal Intake",
    narrative:
      "The requestor pastes unstructured notes. AI extracts structured fields (type, dates, channel, flags). The requestor remains accountable for correctness.",
    human: ["Requestor provides notes and confirms the extracted fields are correct."],
    automation: ["Completeness checks update readiness gates."],
    ai: ["AI extracts fields and flags missing evidence (e.g., volume, competitor proof)."],
    watch: ["Deal Intake → Structured fields card", "Deal Intake → Attachments", "AI panel flags"],
    actionKey: "INTAKE_EXTRACT",
    actionLabel: "Extract sample notes",
  },
  {
    key: "intake_lines",
    title: "Deal intake — generate deal lines",
    role: "Requestor",
    view: "Deal Intake",
    narrative:
      "AI creates deal lines using the active reference catalog (devices/plans). The requestor can adjust discounts/subsidies per line.",
    human: ["Requestor reviews the generated lines and edits discounts/subsidies if required."],
    automation: ["Lines feed the deterministic model and downstream deployment templates."],
    ai: ["AI uses constraints from reference data to bulk-generate lines."],
    watch: ["Deal Intake → Deal lines table", "Sidebar: stage progression"],
    actionKey: "INTAKE_LINES",
    actionLabel: "Generate deal lines",
  },
  {
    key: "model",
    title: "Financials — run the deterministic model",
    role: "Requestor",
    view: "Financials",
    narrative:
      "Automation runs deterministic calculations (margin, payback) and assigns a DoA level. AI explains the outputs in plain language.",
    human: ["Requestor validates assumptions and checks for outliers."],
    automation: ["Model computes KPIs and DoA routing thresholds."],
    ai: ["AI summarises the model outputs and highlights risky lines."],
    watch: ["Financials → Model outputs KPIs", "Financials → AI explanation card"],
    actionKey: "RUN_MODEL",
    actionLabel: "Run model",
  },
  {
    key: "pre",
    title: "Pre-approvals — OEM request, confirmation, and letter",
    role: "Commercial Admin",
    view: "Pre-Approvals",
    narrative:
      "If OEM funding is required, the request is sent and tracked. The deal cannot proceed until confirmation AND the letter are attached.",
    human: ["Commercial Admin requests OEM funding, records confirmation, uploads OEM letter."],
    automation: ["Dependency gate blocks approvals/deployment until complete."],
    ai: ["AI drafts the request email and interprets replies (demo)."],
    watch: ["Pre-Approvals → OEM status card (Status + Letter attached)", "Sidebar: stage changes"],
    actionKey: "PRE_OEM",
    actionLabel: "Complete OEM pre-approval",
  },
  {
    key: "doa_start",
    title: "Approvals — start DoA workflow",
    role: "Requestor",
    view: "Approvals",
    narrative:
      "Automation routes the deal to the correct approvers based on the computed DoA. AI generates a decision pack summary.",
    human: ["Requestor submits the deal for approval."],
    automation: ["System routes to approvers, opens the approval workflow, and records timestamps."],
    ai: ["AI produces a short decision pack with risks and the approval ask."],
    watch: ["Approvals → Required DoA + approver routing", "AI panel: decision pack"],
    actionKey: "DOA_START",
    actionLabel: "Start approvals",
  },
  {
    key: "doa_capture",
    title: "Approvals — capture decisions (portal + email)",
    role: "Approver",
    view: "Approvals",
    narrative:
      "Approvers can approve in the portal or reply by email. Automation captures both methods and updates DoA status.",
    human: ["Approvers approve/return, optionally removing lines."],
    automation: ["System records decisions, method, and audit trail; stage advances when all required approvals are collected."],
    ai: ["AI can generate a revision checklist when a deal is returned."],
    watch: ["Approvals → Portal approvals list", "Approvals → Email approvals tab", "Recorded approvals table"],
    actionKey: "DOA_CAPTURE",
    actionLabel: "Simulate approvals",
  },
  {
    key: "qa",
    title: "Deployment — run readiness QA",
    role: "Executor",
    view: "Deployment",
    narrative:
      "Automation runs readiness checks (model run, pre-approvals attached, dates valid, line completeness). Deployment stays locked if any failures exist.",
    human: ["Executor reviews failed checks and resolves issues."],
    automation: ["QA gate blocks deployment until fails are resolved."],
    ai: ["AI explains the likely cause of failures and the fix."],
    watch: ["Deployment → Readiness checks", "Deployment → readiness status"],
    actionKey: "RUN_QA",
    actionLabel: "Run QA",
  },
  {
    key: "deploy",
    title: "Deployment — deploy to downstream systems",
    role: "Executor",
    view: "Deployment",
    narrative:
      "Automation deploys the deal to each downstream system and tracks per-system outcomes. AI explains failures in plain language.",
    human: ["Executor monitors deployment statuses and retries after fixes."],
    automation: ["Per-system statuses update (Deploying/Deployed/Failed)."],
    ai: ["AI provides a failure explanation and a recommended fix."],
    watch: ["Deployment → Per-system status cards", "AI panel: failure explanation (if any)"],
    actionKey: "DEPLOY_ALL",
    actionLabel: "Deploy all",
  },
  {
    key: "tasks",
    title: "Post-approval tasks — complete mandatory items and go live",
    role: "Commercial Admin",
    view: "Tasks",
    narrative:
      "After approval, automation creates a task board. Mandatory items must be completed before the deal becomes Live.",
    human: ["Commercial Admin completes mandatory tasks (legal, commissions, compliance)."],
    automation: ["System blocks Live status until mandatory tasks are Done."],
    ai: ["AI can draft task briefs and reminders (demo)."],
    watch: ["Tasks → Go-live gate card", "Tasks → Mandatory badges"],
    actionKey: "COMPLETE_TASKS",
    actionLabel: "Complete mandatory tasks",
  },
  {
    key: "dash",
    title: "Dashboards — show visibility and export",
    role: "Admin",
    view: "Dashboards",
    narrative:
      "Wrap up by showing pipeline visibility and exporting the promo list. This demonstrates operational reporting and channel outputs.",
    human: ["Admin/manager reviews status and exports artefacts."],
    automation: ["Dashboards aggregate status and generate exports."],
    ai: ["AI provides a short weekly narrative summary."],
    watch: ["Dashboards → pipeline + cycle time charts", "Export promo list button"],
    actionKey: "EXPORT",
    actionLabel: "Export promo list",
  },
];

// -----------------------------
// UI building blocks
// -----------------------------

function Pill({ icon: Icon, title, children }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border bg-white/60 p-3">
      <div className="mt-0.5 rounded-lg border bg-white p-2">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function RagBadge({ rag }) {
  const variant = badgeVariantForRag(rag);
  return <Badge variant={variant}>{rag}</Badge>;
}

function StageBadge({ stage }) {
  const color =
    stage === "Live"
      ? "default"
      : stage === "Approved"
        ? "secondary"
        : stage.includes("Await")
          ? "destructive"
          : "outline";
  return <Badge variant={color}>{stage}</Badge>;
}

function HumanAutoAIKey() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Pill icon={CheckCircle2} title="User actions">
        People enter information, review outputs, and approve decisions at control points.
      </Pill>
      <Pill icon={RefreshCw} title="Automation">
        Rules drive routing, gating, status updates, and audit capture across the workflow.
      </Pill>
      <Pill icon={Sparkles} title="AI assistance">
        The AI extracts fields, summarises packs, flags anomalies, and explains issues in plain language.
      </Pill>
    </div>
  );
}

function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xl font-semibold tracking-tight">{title}</div>
        {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

function AuditLog({ logs }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
        <CardDescription>Every workflow transition and major action is recorded here.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[420px] space-y-2 overflow-auto rounded-xl border bg-muted/30 p-3">
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No actions yet.</div>
          ) : (
            logs
              .slice()
              .reverse()
              .map((l) => (
                <div key={l.id} className="rounded-lg border bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{l.action}</div>
                    <div className="text-xs text-muted-foreground">{fmt(l.at)}</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Actor:</span> {l.actor} •{" "}
                    <span className="font-medium text-foreground">Module:</span> {l.module}
                  </div>
                  {l.details ? <div className="mt-2 text-sm">{l.details}</div> : null}
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
function JourneyNarrator({
  open,
  onToggle,
  stepIndex,
  stepCount,
  step,
  onPrev,
  onNext,
  onGo,
  onRun,
  onRunAll,
  running,
}) {
  const pct = stepCount ? Math.round(((stepIndex + 1) / stepCount) * 100) : 0;

  return (
    <Card className="sticky top-2 z-20 border bg-white/80 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              User Journey Narrative
            </CardTitle>
            <CardDescription className="mt-1">
              Step {stepIndex + 1} of {stepCount}: <span className="font-medium text-foreground">{step?.title}</span>
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onPrev} disabled={running || stepIndex === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={onNext} disabled={running || stepIndex === stepCount - 1}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={onRunAll} disabled={running}>
              <Play className="mr-1 h-4 w-4" /> Run all
            </Button>
            <Button variant="default" size="sm" onClick={onRun} disabled={running}>
              {running ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
              Run this step
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {open ? (
                <>
                  Collapse <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  Expand <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <Progress value={pct} />
          <div className="mt-1 text-xs text-muted-foreground">Journey progress: {pct}%</div>
        </div>
      </CardHeader>

      {open ? (
        <CardContent className="pt-0">
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-xl border bg-white p-3">
                <div className="text-sm font-semibold">Narration</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{step?.narrative}</div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Suggested role: {step?.role}</Badge>
                  <Badge variant="outline">Suggested screen: {step?.view}</Badge>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-semibold text-muted-foreground">Jump to a step</div>
                  <div className="mt-2">
                    <Select value={String(stepIndex)} onValueChange={(v) => onGo(Number(v))}>
                      <SelectTrigger className="max-w-[520px]">
                        <SelectValue placeholder="Select step" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOURNEY_STEPS.map((s, idx) => (
                          <SelectItem key={s.key} value={String(idx)}>
                            {idx + 1}. {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Tip: Use <span className="font-medium text-foreground">Prev/Next</span> to control the pace. Use <span className="font-medium text-foreground">Run this step</span> to trigger the demo actions for the current step.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border bg-white p-3">
                <div className="text-sm font-semibold">What happens in this step</div>
                <div className="mt-2 grid gap-2">
                  <div>
                    <div className="text-xs font-semibold">User actions</div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {(step?.human || []).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Automation</div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {(step?.automation || []).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold">AI assistance</div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {(step?.ai || []).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-3">
                <div className="text-sm font-semibold">What to pay attention to</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {(step?.watch || []).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

// -----------------------------
// Main App
// -----------------------------

export default function DealMotivationDemoApp() {
  const [role, setRole] = useState("Requestor");
  const [view, setView] = useState("Overview");

  // Reference data (versioned)
  const [refVersions, setRefVersions] = useState(() => {
    const v1 = {
      id: uid("refv"),
      version: "v1",
      at: nowISO(),
      status: "Active",
      by: "System",
      datasets: DEMO_REF,
      ai: { summary: "Baseline reference data loaded.", issues: [{ severity: "Info", msg: "No issues detected — looks consistent." }] },
    };
    return [v1];
  });

  const activeRef = useMemo(() => {
    const active = refVersions.find((v) => v.status === "Active");
    return active?.datasets || DEMO_REF;
  }, [refVersions]);

  // Deal Case
  const [dealCase, setDealCase] = useState(() => ({
    id: "202602EBU0001",
    dealName: "",
    dealType: "Device + Plan",
    channel: "Consumer",
    durationMonths: 24,
    targetMonthlyPrice: 499,
    startDate: daysFromNow(7),
    endDate: daysFromNow(45),
    rationale: "",
    requiresOemFunding: true,
    requiresIcasa: false,
    attachments: [],
    lines: [],
    stage: "Draft",
    rag: "Grey",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    financials: null,
    preApprovals: {
      oemFunding: { required: true, status: "NotStarted", requestedAt: null, confirmedAt: null, letterAttached: false },
      stockWriteOff: { required: false, status: "NotRequired" },
    },
    doa: {
      requiredLevel: null,
      status: "NotStarted", // NotStarted | InProgress | Approved | Returned
      approvals: [],
      emailThread: [],
    },
    deployment: {
      readiness: "NotReady", // NotReady | Ready | FailedChecks
      qa: [],
      perSystem: DEMO_SYSTEMS.map((s) => ({ systemId: s.id, systemName: s.name, status: "NotDeployed", message: "" })),
      lastError: "",
    },
    tasks: [],
    performance: {
      targetUnits: 800,
      actualUnits: 0,
      revenue: 0,
      updatedAt: nowISO(),
    },
  }));

  const [logs, setLogs] = useState([]);

  const [aiPanel, setAiPanel] = useState({
    title: "AI panel",
    body: "AI suggestions and summaries will appear here as you progress.",
  });
  // User Journey narrator state
  const [journeyOpen, setJourneyOpen] = useState(true);
  const [journeyStep, setJourneyStep] = useState(0);
  const [journeyRunning, setJourneyRunning] = useState(false);
  const journeyRunningRef = useRef(false);

  // Demo toggles
  const [autoAdvance, setAutoAdvance] = useState(true);
  const scenarioRunningRef = useRef(false);

  // Derived
  const approversNeeded = useMemo(() => {
    const level = dealCase.financials?.doaLevel || dealCase.doa.requiredLevel;
    if (!level) return [];
    const order = ["L1", "L2", "L3", "EXCO"];
    const idx = order.indexOf(level);
    const needed = DEMO_APPROVERS.filter((a) => order.indexOf(a.level) <= idx);
    return needed;
  }, [dealCase.financials, dealCase.doa.requiredLevel]);

  const stageProgress = useMemo(() => {
    const map = {
      Draft: 5,
      ReadyForModel: 12,
      ReadyForPreApprovals: 22,
      AwaitingPreApprovals: 32,
      ReadyForDoA: 42,
      InDoA: 55,
      Approved: 68,
      DeploymentReady: 76,
      Deploying: 84,
      PostApprovalTasks: 92,
      Live: 100,
    };
    return map[dealCase.stage] ?? 5;
  }, [dealCase.stage]);

  // -----------------------------
  // Logging

  function addLog(module, action, details = "") {
    setLogs((p) => [
      ...p,
      {
        id: uid("log"),
        at: nowISO(),
        actor: role,
        module,
        action,
        details,
      },
    ]);
  }
  // -----------------------------
  // -----------------------------
  // Journey narrator helpers
  // -----------------------------

  function narratorTextFor(step) {
    if (!step) return "";
    const bullets = (arr) =>
      arr && arr.length ? arr.map((x) => `• ${x}`).join("\n") : "• —";

    return [
      step.narrative,
      "",
      "User actions:",
      bullets(step.human),
      "",
      "Automation:",
      bullets(step.automation),
      "",
      "AI assistance:",
      bullets(step.ai),
      "",
      "Pay attention to:",
      bullets(step.watch),
    ].join("\n");
  }

  function goToJourneyStep(idx, opts = {}) {
    const nextIdx = clamp(idx, 0, JOURNEY_STEPS.length - 1);
    const step = JOURNEY_STEPS[nextIdx];

    setJourneyStep(nextIdx);
    setRole(step.role);
    setView(step.view);
    setAiPanel({ title: `Journey step ${nextIdx + 1}/${JOURNEY_STEPS.length}: ${step.title}`, body: narratorTextFor(step) });

    if (opts.log !== false) {
      addLog("Journey", `Navigated to: ${step.title}`, `Suggested role: ${step.role} • Suggested screen: ${step.view}`);
    }
  }

  async function runJourneyStepActions(idx) {
    if (journeyRunningRef.current) return;
    journeyRunningRef.current = true;
    setJourneyRunning(true);

    try {
      const step = JOURNEY_STEPS[clamp(idx, 0, JOURNEY_STEPS.length - 1)];
      // Always navigate first so the audience sees the right screen.
      goToJourneyStep(idx, { log: false });

      // Small pause so the UI updates before actions fire.
      await wait(250);

      switch (step.actionKey) {
        case "REF_UPLOAD": {
          uploadSampleRefUpdate();
          addLog("Journey", "Step action executed", "Reference data update uploaded (demo)." );
          break;
        }
        case "REF_APPROVE": {
          const pending = refVersions.find((v) => v.status === "PendingReview");
          if (pending) {
            approveRefVersion(pending.id);
            addLog("Journey", "Step action executed", "Pending reference version approved (demo)." );
          } else {
            setAiPanel({
              title: "Journey narrator",
              body: "No Pending Review reference version found. Run the previous step (upload update) first.",
            });
          }
          break;
        }
        case "INTAKE_EXTRACT": {
          extractFromNotes("Need SIM-only competitive response for SME. 24 months. Target R399. Competitor quote attached.");
          await wait(250);
          addAttachment("Competitor Quote");
          addLog("Journey", "Step action executed", "Notes extracted + competitor attachment added (demo)." );
          break;
        }
        case "INTAKE_LINES": {
          generateDealLines();
          addLog("Journey", "Step action executed", "Deal lines generated from reference data (demo)." );
          break;
        }
        case "RUN_MODEL": {
          runModel();
          addLog("Journey", "Step action executed", "Deterministic model run and DoA computed (demo)." );
          break;
        }
        case "PRE_OEM": {
          if (!dealCase.requiresOemFunding) {
            setAiPanel({
              title: "Journey narrator",
              body: "This deal is not flagged for OEM funding in the current state. Toggle ‘Requires OEM funding’ in Deal Intake to demonstrate this gate.",
            });
            break;
          }
          requestOemFunding();
          await wait(250);
          confirmOemFunding();
          await wait(250);
          attachOemLetter();
          addLog("Journey", "Step action executed", "OEM request + confirm + letter attached (demo)." );
          break;
        }
        case "DOA_START": {
          if (!dealCase.financials) {
            setAiPanel({
              title: "Journey narrator",
              body: "Run the Financials step first (deterministic model) so the DoA level is computed before starting approvals.",
            });
            break;
          }
          startDoA();
          addLog("Journey", "Step action executed", "Approval workflow started (demo)." );
          break;
        }
        case "DOA_CAPTURE": {
          if (dealCase.doa.status !== "InProgress") {
            if (dealCase.financials) startDoA();
            await wait(250);
          }

          // Approve required levels: L1 via portal, L2 via email, remaining via portal.
          const levelToId = {
            L1: DEMO_APPROVERS.find((a) => a.level === "L1")?.id,
            L2: DEMO_APPROVERS.find((a) => a.level === "L2")?.id,
            L3: DEMO_APPROVERS.find((a) => a.level === "L3")?.id,
            EXCO: DEMO_APPROVERS.find((a) => a.level === "EXCO")?.id,
          };

          if (levelToId.L1) portalApprove(levelToId.L1);
          await wait(200);
          emailSendToApprover();
          await wait(200);
          emailReply("APPROVE");
          await wait(200);

          // If higher levels are required, approve them in portal (demo convenience)
          const required = dealCase.financials?.doaLevel || dealCase.doa.requiredLevel || "L1";
          const order = ["L1", "L2", "L3", "EXCO"];
          const maxIdx = order.indexOf(required);
          if (maxIdx >= order.indexOf("L3") && levelToId.L3) portalApprove(levelToId.L3);
          if (maxIdx >= order.indexOf("EXCO") && levelToId.EXCO) portalApprove(levelToId.EXCO);

          addLog("Journey", "Step action executed", "Approvals captured (portal + email) (demo)." );
          break;
        }
        case "RUN_QA": {
          runDeploymentQA();
          addLog("Journey", "Step action executed", "Deployment readiness QA executed (demo)." );
          break;
        }
        case "DEPLOY_ALL": {
          if (dealCase.deployment.readiness !== "Ready") {
            setAiPanel({
              title: "Journey narrator",
              body: "Deployment is still locked. Run ‘Deployment — run readiness QA’ and fix any failed checks first.",
            });
            break;
          }
          deployAll();
          addLog("Journey", "Step action executed", "Deployment started (demo). Watch per-system statuses." );
          // Give the demo time to show results
          await wait(1100);
          break;
        }
        case "COMPLETE_TASKS": {
          completeAllMandatoryTasks();
          addLog("Journey", "Step action executed", "Mandatory post-approval tasks completed (demo)." );
          break;
        }
        case "EXPORT": {
          exportPromoList();
          addLog("Journey", "Step action executed", "Promo list exported (demo)." );
          break;
        }
        default: {
          // No action for intro step
          addLog("Journey", "Step has no actions", "Use this step to orient your audience." );
          break;
        }
      }
    } finally {
      journeyRunningRef.current = false;
      setJourneyRunning(false);
    }
  }

  // -----------------------------
  // Automation: stage transitions & gating
  // -----------------------------

  function setStage(nextStage) {
    setDealCase((d) => {
      const next = { ...d, stage: nextStage, rag: ragFromStage(nextStage), updatedAt: nowISO() };
      return next;
    });
    addLog("Workflow", `Stage set to ${nextStage}`, "Automation updated deal stage based on rules and actions.");
  }

  function automationRecomputeReadiness(d = dealCase) {
    // Basic gating rules for demo
    const hasBasics = !!(d.dealName && d.rationale && d.startDate && d.endDate);
    const hasLines = (d.lines || []).length > 0;

    const modelReady = hasBasics && hasLines;

    const requiresPre = d.requiresOemFunding || d.preApprovals?.stockWriteOff?.required;
    const preOk = !requiresPre || (d.preApprovals.oemFunding.status === "Confirmed" && (!d.preApprovals.oemFunding.required || d.preApprovals.oemFunding.letterAttached));

    const hasFinancials = !!d.financials;

    const doaOk = d.doa.status === "Approved";

    const deploymentReady = doaOk && preOk && hasFinancials;

    // Create post-approval tasks if approved and not created yet
    const shouldCreateTasks = doaOk && (d.tasks || []).length === 0;

    return { modelReady, preOk, hasFinancials, deploymentReady, shouldCreateTasks };
  }

  function automationMaybeAdvance() {
    if (!autoAdvance) return;

    setDealCase((d) => {
      const { modelReady, preOk, hasFinancials, deploymentReady, shouldCreateTasks } = automationRecomputeReadiness(d);

      let nextStage = d.stage;

      if (d.stage === "Draft" && modelReady) nextStage = "ReadyForModel";
      if (d.stage === "ReadyForModel" && hasFinancials) nextStage = "ReadyForPreApprovals";

      const requiresPre = d.requiresOemFunding || d.preApprovals?.stockWriteOff?.required;
      if (d.stage === "ReadyForPreApprovals" && requiresPre && !preOk) nextStage = "AwaitingPreApprovals";
      if ((d.stage === "ReadyForPreApprovals" || d.stage === "AwaitingPreApprovals") && preOk) nextStage = "ReadyForDoA";

      if (d.stage === "ReadyForDoA" && d.doa.status === "InProgress") nextStage = "InDoA";
      if (d.stage === "InDoA" && d.doa.status === "Approved") nextStage = "Approved";

      if (d.stage === "Approved" && deploymentReady) nextStage = "DeploymentReady";
      if (d.stage === "DeploymentReady" && d.deployment.readiness === "Ready") nextStage = "Deploying";
      if (d.stage === "Deploying" && d.deployment.perSystem.every((s) => s.status === "Deployed")) nextStage = "PostApprovalTasks";

      // Post approval tasks gating to Live
      const mandatoryDone = (d.tasks || []).filter((t) => t.mandatory).every((t) => t.status === "Done");
      if (d.stage === "PostApprovalTasks" && mandatoryDone) nextStage = "Live";

      const next = { ...d };

      if (shouldCreateTasks) {
        const tasks = buildPostApprovalTasks(d);
        next.tasks = tasks;
      }

      if (nextStage !== d.stage) {
        next.stage = nextStage;
        next.rag = ragFromStage(nextStage);
        next.updatedAt = nowISO();
      }

      return next;
    });
  }

  useEffect(() => {
    automationMaybeAdvance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealCase.dealName, dealCase.rationale, dealCase.lines, dealCase.financials, dealCase.preApprovals, dealCase.doa, dealCase.deployment, dealCase.tasks, autoAdvance]);

  // -----------------------------
  // Post-approval tasks
  // -----------------------------

  function buildPostApprovalTasks(d) {
    const tasks = [];

    // Always
    tasks.push({ id: uid("t"), title: "Publish deal T&Cs", owner: "Legal", due: daysFromNow(3), status: "Todo", mandatory: true, category: "Legal" });
    tasks.push({ id: uid("t"), title: "Create marketing assets", owner: "Marketing", due: daysFromNow(5), status: "Todo", mandatory: false, category: "Marketing" });
    tasks.push({ id: uid("t"), title: "Update commission table", owner: "Sales Ops", due: daysFromNow(4), status: "Todo", mandatory: true, category: "Commissions" });
    tasks.push({ id: uid("t"), title: "Confirm NRV / compliance pack", owner: "Commercial Admin", due: daysFromNow(4), status: "Todo", mandatory: true, category: "Governance" });

    if (d.requiresIcasa) {
      tasks.push({ id: uid("t"), title: "ICASA lodgement (SIM-only) + upload reference", owner: "Regulatory", due: daysFromNow(2), status: "Todo", mandatory: true, category: "ICASA" });
      tasks.push({ id: uid("t"), title: "ICASA quarterly reporting entry", owner: "Regulatory", due: daysFromNow(14), status: "Todo", mandatory: false, category: "ICASA" });
    }

    if (d.requiresOemFunding) {
      tasks.push({ id: uid("t"), title: "Upload OEM funding letter", owner: "Commercial Admin", due: daysFromNow(2), status: d.preApprovals.oemFunding.letterAttached ? "Done" : "Todo", mandatory: true, category: "OEM" });
    }

    addLog("Tasks", "Post-approval tasks created", "Automation created a task board based on deal type and rules.");
    setAiPanel({
      title: "AI assistance",
      body: "I created a post-approval task list based on the deal type. Mandatory items must be completed before the deal can be marked Live.",
    });

    return tasks;
  }

  // -----------------------------
  // Actions: Reference Data
  // -----------------------------

  function uploadSampleRefUpdate() {
    const updatedDevices = activeRef.devices.map((d) => ({ ...d }));
    updatedDevices.push({ code: "DEV-X2", name: "Xeno X2", price: 5999, status: "Active", stock: 120 });
    // Introduce a small issue for demo
    updatedDevices.push({ code: "DEV-X2", name: "Xeno X2 Duplicate", price: 5999, status: "Active", stock: 120 });

    const draft = {
      id: uid("refv"),
      version: `v${refVersions.length + 1}`,
      at: nowISO(),
      status: "PendingReview",
      by: role,
      datasets: { ...activeRef, devices: updatedDevices },
      ai: null,
    };

    // AI check
    const ai = mockAIReferenceDataCheck("Devices", updatedDevices);
    draft.ai = ai;

    setRefVersions((p) => [...p, draft]);

    addLog("Reference Data", "Uploaded reference data update", `Created ${draft.version} (Pending Review).`);
    setAiPanel({ title: "AI assistance", body: `${ai.summary} Example issue: ${ai.issues[0]?.msg || "—"}` });
  }

  function approveRefVersion(refId) {
    setRefVersions((p) =>
      p.map((v) => {
        if (v.id === refId) return { ...v, status: "Active" };
        if (v.status === "Active") return { ...v, status: "Archived" };
        return v;
      })
    );
    addLog("Reference Data", "Peer review approved reference data", "Automation set the approved version as Active and archived the prior Active version.");
  }

  // -----------------------------
  // Actions: Deal Intake
  // -----------------------------

  function extractFromNotes(notes) {
    const out = mockAIExtract(notes);
    setDealCase((d) => ({
      ...d,
      ...out.extracted,
      preApprovals: {
        ...d.preApprovals,
        oemFunding: {
          ...d.preApprovals.oemFunding,
          required: out.extracted.requiresOemFunding,
        },
      },
      updatedAt: nowISO(),
    }));

    addLog("Deal Intake", "AI extracted structured fields from notes", out.flags.length ? `Flags: ${out.flags.join("; ")}` : "No flags.");

    setAiPanel({
      title: "AI assistance",
      body: `${out.aiSummary}${out.flags.length ? `\n\nFlags to fix: ${out.flags.join(" • ")}` : ""}`,
    });
  }

  function addAttachment(kind) {
    const att = { id: uid("att"), kind, name: `${kind} — ${new Date().toLocaleTimeString()}.pdf`, at: nowISO() };
    setDealCase((d) => ({ ...d, attachments: [...(d.attachments || []), att], updatedAt: nowISO() }));
    addLog("Deal Intake", "Attachment added", att.name);
  }

  function generateDealLines() {
    // Create 3 lines based on active reference data.
    const devices = activeRef.devices.slice(0, 3);
    const plans = activeRef.pricePlans.slice(0, 3);

    const lines = devices.map((dev, i) => {
      const plan = plans[i % plans.length];
      const deviceSubsidy = Math.round(clamp(dev.price * 0.18, 300, 1800));
      const monthlyDiscount = Math.round(clamp((dealCase.targetMonthlyPrice - plan.price) * 0.5, 0, 120));
      return {
        id: uid("line"),
        deviceCode: dev.code,
        deviceName: dev.name,
        planCode: plan.code,
        planName: plan.name,
        termMonths: dealCase.durationMonths,
        monthlyPrice: plan.price,
        monthlyDiscount,
        deviceSubsidy,
        addOns: [activeRef.addOns[0]?.code].filter(Boolean),
      };
    });

    setDealCase((d) => ({ ...d, lines, updatedAt: nowISO() }));
    addLog("Deal Intake", "Generated deal lines", "AI-assisted bulk creation created 3 deal lines from reference data constraints.");

    setAiPanel({
      title: "AI assistance",
      body: "I generated 3 deal lines using the active device and plan catalog. You can edit discounts and subsidies per line before running the financial model.",
    });
  }

  function updateLine(lineId, patch) {
    setDealCase((d) => ({
      ...d,
      lines: (d.lines || []).map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
      updatedAt: nowISO(),
    }));
  }

  // -----------------------------
  // Actions: Financial model + DoA
  // -----------------------------

  function runModel() {
    setDealCase((d) => {
      const fin = runFinancialModel(d);
      const next = { ...d, financials: fin, doa: { ...d.doa, requiredLevel: fin.doaLevel }, updatedAt: nowISO() };
      return next;
    });

    addLog("Financials", "Ran deterministic financial model", "Automation calculated margin, payback, and DoA level.");

    setAiPanel({
      title: "AI assistance",
      body: "I summarised the model outputs for approvers and highlighted any low-margin or high-subsidy lines. (Calculations remain deterministic.)",
    });
  }

  // -----------------------------
  // Actions: Pre-approvals (OEM)
  // -----------------------------

  function requestOemFunding() {
    setDealCase((d) => ({
      ...d,
      preApprovals: {
        ...d.preApprovals,
        oemFunding: { ...d.preApprovals.oemFunding, status: "Requested", requestedAt: nowISO() },
      },
      updatedAt: nowISO(),
    }));

    addLog("Pre-Approvals", "OEM funding request sent", "Human triggered request; automation tracked status and timestamps.");

    setAiPanel({
      title: "AI assistance",
      body: "Draft email generated: includes a one-page summary, requested OEM funding level per line, and required attachments.",
    });
  }

  function confirmOemFunding() {
    setDealCase((d) => ({
      ...d,
      preApprovals: {
        ...d.preApprovals,
        oemFunding: { ...d.preApprovals.oemFunding, status: "Confirmed", confirmedAt: nowISO() },
      },
      updatedAt: nowISO(),
    }));

    addLog("Pre-Approvals", "OEM funding confirmed", "Human recorded OEM confirmation; automation unlocked DoA gating when letter is attached.");
  }

  function attachOemLetter() {
    setDealCase((d) => ({
      ...d,
      preApprovals: {
        ...d.preApprovals,
        oemFunding: { ...d.preApprovals.oemFunding, letterAttached: true },
      },
      attachments: [...(d.attachments || []), { id: uid("att"), kind: "OEM Letter", name: "OEM Funding Letter.pdf", at: nowISO() }],
      updatedAt: nowISO(),
    }));

    addLog("Pre-Approvals", "OEM letter attached", "Human uploaded OEM letter; automation can now treat OEM pre-approval as complete.");
  }

  // -----------------------------
  // Actions: DoA approvals (portal + email)
  // -----------------------------

  function startDoA() {
    setDealCase((d) => ({
      ...d,
      doa: { ...d.doa, status: "InProgress", approvals: [], emailThread: [] },
      updatedAt: nowISO(),
    }));

    const pack = mockAISummarizeDecisionPack({ ...dealCase, financials: dealCase.financials || runFinancialModel(dealCase) });
    setAiPanel({
      title: "AI assistance",
      body: `${pack.brief}\n\nRisks: ${pack.risks.join(" • ")}\n\nAsk: ${pack.ask}`,
    });

    addLog("Approvals", "Approval workflow started", "Automation routed the deal to approvers based on the calculated DoA level.");
  }

  function portalApprove(approverId) {
    const approver = DEMO_APPROVERS.find((a) => a.id === approverId);
    setDealCase((d) => {
      const approvals = [...(d.doa.approvals || []), { id: uid("apr"), approver: approver?.name || "Approver", level: approver?.level || "", method: "Portal", at: nowISO(), status: "Approved" }];
      const needed = approversNeeded;
      const order = ["L1", "L2", "L3", "EXCO"];
      const maxNeeded = order.indexOf(d.financials?.doaLevel || d.doa.requiredLevel || "L1");
      const doneLevels = new Set(approvals.map((x) => x.level));
      const allDone = needed.filter((x) => order.indexOf(x.level) <= maxNeeded).every((x) => doneLevels.has(x.level));
      return {
        ...d,
        doa: { ...d.doa, approvals, status: allDone ? "Approved" : "InProgress" },
        updatedAt: nowISO(),
      };
    });

    addLog("Approvals", "Portal approval recorded", `${approver?.name || "Approver"} approved via portal.`);
  }

  function emailSendToApprover() {
    const msg = {
      id: uid("em"),
      at: nowISO(),
      from: "noreply@dealflow.demo",
      to: "approver@demo",
      subject: `Approval required: ${dealCase.id} — ${dealCase.dealName || "Deal"}`,
      body:
        "Please reply with: APPROVE / RETURN / REMOVE <line numbers>.\n\n(For demo: use the buttons in the Email tab.)",
    };
    setDealCase((d) => ({ ...d, doa: { ...d.doa, emailThread: [...(d.doa.emailThread || []), msg] }, updatedAt: nowISO() }));
    addLog("Approvals", "Approval email sent", "Automation generated an approval email with a decision pack summary.");
  }

  function emailReply(action) {
    // Demo: treat email reply as the L2 approval
    const approver = DEMO_APPROVERS.find((a) => a.level === "L2");

    if (action === "RETURN") {
      setDealCase((d) => ({ ...d, doa: { ...d.doa, status: "Returned" }, updatedAt: nowISO() }));
      addLog("Approvals", "Email reply: RETURN", "Approver requested revisions. Automation created a revision checklist (demo).");
      setAiPanel({
        title: "AI assistance",
        body: "Revision checklist (demo):\n• Add competitor proof attachment\n• Confirm target volumes\n• Reduce subsidy on Line 2 OR increase monthly price\n\nAfter changes, resubmit for approval.",
      });
      return;
    }

    if (action.startsWith("REMOVE")) {
      // Remove line 2 for demo
      setDealCase((d) => ({ ...d, lines: d.lines.filter((_, idx) => idx !== 1), updatedAt: nowISO() }));
      addLog("Approvals", "Email reply: REMOVE line(s)", "Approver removed Line 2 and asked to proceed with remaining lines.");
      setAiPanel({
        title: "AI assistance",
        body: "I removed the specified line(s) from the deal case and recalculated readiness. You can re-run the model if needed.",
      });
      return;
    }

    // APPROVE
    setDealCase((d) => {
      const approvals = [...(d.doa.approvals || []), { id: uid("apr"), approver: approver?.name || "Commercial Head", level: approver?.level || "L2", method: "Email", at: nowISO(), status: "Approved" }];
      const needed = approversNeeded;
      const order = ["L1", "L2", "L3", "EXCO"];
      const maxNeeded = order.indexOf(d.financials?.doaLevel || d.doa.requiredLevel || "L1");
      const doneLevels = new Set(approvals.map((x) => x.level));
      const allDone = needed.filter((x) => order.indexOf(x.level) <= maxNeeded).every((x) => doneLevels.has(x.level));
      return { ...d, doa: { ...d.doa, approvals, status: allDone ? "Approved" : "InProgress" }, updatedAt: nowISO() };
    });
    addLog("Approvals", "Email reply: APPROVE", "Approver approved via email reply; automation recorded it.");
  }

  // -----------------------------
  // Actions: Deployment QA + deploy
  // -----------------------------

  function runDeploymentQA() {
    const qa = [];

    // Checks
    if (!dealCase.financials) qa.push({ id: uid("qa"), check: "Financial model run", status: "Fail", msg: "Run the deterministic model before deployment." });
    if (dealCase.requiresOemFunding) {
      if (dealCase.preApprovals.oemFunding.status !== "Confirmed") qa.push({ id: uid("qa"), check: "OEM funding confirmed", status: "Fail", msg: "OEM funding is required but not confirmed." });
      if (!dealCase.preApprovals.oemFunding.letterAttached) qa.push({ id: uid("qa"), check: "OEM letter attached", status: "Fail", msg: "OEM confirmation letter must be attached." });
    }

    if (new Date(dealCase.endDate) <= new Date(dealCase.startDate)) {
      qa.push({ id: uid("qa"), check: "Start/End dates valid", status: "Fail", msg: "End date must be after start date." });
    }

    (dealCase.lines || []).forEach((l, idx) => {
      if (!l.planCode) qa.push({ id: uid("qa"), check: `Line ${idx + 1}: Plan code present`, status: "Fail", msg: "Missing price plan code." });
      if (!l.deviceCode && dealCase.dealType !== "SIM-Only") qa.push({ id: uid("qa"), check: `Line ${idx + 1}: Device code present`, status: "Fail", msg: "Missing device code." });
      if (Number(l.monthlyDiscount || 0) > 200) qa.push({ id: uid("qa"), check: `Line ${idx + 1}: Discount sanity`, status: "Warn", msg: "Large discount — verify policy." });
    });

    if (!qa.length) qa.push({ id: uid("qa"), check: "All checks", status: "Pass", msg: "All deployment readiness checks passed." });

    const hasFail = qa.some((x) => x.status === "Fail");

    setDealCase((d) => ({
      ...d,
      deployment: { ...d.deployment, qa, readiness: hasFail ? "FailedChecks" : "Ready", lastError: "" },
      updatedAt: nowISO(),
    }));

    addLog("Deployment", "Deployment QA run", hasFail ? "Checks failed — fix issues before deploy." : "All checks passed — deployment unlocked.");

    setAiPanel({
      title: "AI assistance",
      body: hasFail
        ? "I flagged issues that will likely cause deployment failures. Fix the failed checks and run QA again."
        : "Readiness checks passed. Next: deploy per system and capture outcomes.",
    });
  }

  function deployAll() {
    // Demo deployment: introduce a random failure if iLula and SIM-only without ICASA task done
    setDealCase((d) => ({
      ...d,
      deployment: {
        ...d.deployment,
        perSystem: d.deployment.perSystem.map((s) => ({ ...s, status: "Deploying", message: "" })),
      },
      updatedAt: nowISO(),
    }));

    addLog("Deployment", "Deployment started", "Automation executed deployment actions (demo).");

    setTimeout(() => {
      setDealCase((d) => {
        const icasaDone = (d.tasks || []).find((t) => t.category === "ICASA" && t.mandatory)?.status === "Done";
        const perSystem = d.deployment.perSystem.map((s) => {
          if (s.systemId === "sys_ilula" && d.requiresIcasa && !icasaDone) {
            return { ...s, status: "Failed", message: "ICASA lodgement missing" };
          }
          return { ...s, status: "Deployed", message: "OK" };
        });

        const failed = perSystem.find((x) => x.status === "Failed");
        const lastError = failed ? `${failed.systemName}: ${failed.message}` : "";

        return {
          ...d,
          deployment: { ...d.deployment, perSystem, lastError },
          updatedAt: nowISO(),
        };
      });

      addLog("Deployment", "Deployment completed", "Per-system results recorded. (In production: API callbacks or job statuses.)");

      // AI explanation if failed
      const currentErr = (dealCase.deployment?.lastError || "").trim();
      if (currentErr) {
        setAiPanel({ title: "AI assistance", body: mockAIExplainDeploymentFailure(currentErr) });
      }
    }, 900);
  }

  function retryDeploymentAfterFix() {
    // For demo, mark ICASA task as done if present
    setDealCase((d) => {
      const tasks = (d.tasks || []).map((t) => (t.category === "ICASA" && t.mandatory ? { ...t, status: "Done" } : t));
      return { ...d, tasks, updatedAt: nowISO() };
    });
    addLog("Tasks", "Marked ICASA task done (demo fix)", "Human completed compliance gating; deployment can proceed.");

    setTimeout(() => {
      setDealCase((d) => ({
        ...d,
        deployment: { ...d.deployment, perSystem: d.deployment.perSystem.map((s) => ({ ...s, status: "Deployed", message: "OK" })), lastError: "" },
        updatedAt: nowISO(),
      }));
      addLog("Deployment", "Redeployed successfully", "Automation re-ran deployment and recorded success.");
      setAiPanel({ title: "AI assistance", body: "Deployment succeeded after ICASA gating was completed." });
    }, 700);
  }

  // -----------------------------
  // Actions: Tasks
  // -----------------------------

  function setTaskStatus(taskId, status) {
    setDealCase((d) => ({
      ...d,
      tasks: (d.tasks || []).map((t) => (t.id === taskId ? { ...t, status } : t)),
      updatedAt: nowISO(),
    }));
    addLog("Tasks", "Task status updated", `Task ${taskId} set to ${status}.`);
  }

  function completeAllMandatoryTasks() {
    setDealCase((d) => ({
      ...d,
      tasks: (d.tasks || []).map((t) => (t.mandatory ? { ...t, status: "Done" } : t)),
      updatedAt: nowISO(),
    }));
    addLog("Tasks", "Completed all mandatory tasks", "Human completed required post-approval items to allow Live status.");
  }

  // -----------------------------
  // Guided scenario
  // -----------------------------

  async function runGuidedScenario() {
    if (scenarioRunningRef.current) return;
    scenarioRunningRef.current = true;

    try {
      setView("Overview");
      setRole("Data Steward");
      setAiPanel({ title: "Guided scenario", body: "Step 1/8: Upload a reference data update and run AI checks." });
      await wait(500);
      uploadSampleRefUpdate();
      await wait(900);

      setAiPanel({ title: "Guided scenario", body: "Step 2/8: Peer reviewer approves the reference data update (or rejects)." });
      setRole("Peer Reviewer");
      await wait(800);
      const pending = refVersions.find((v) => v.status === "PendingReview");
      if (pending) approveRefVersion(pending.id);
      await wait(700);

      setRole("Requestor");
      setView("Deal Intake");
      setAiPanel({ title: "Guided scenario", body: "Step 3/8: Requestor pastes notes; AI extracts structured deal fields." });
      await wait(700);
      extractFromNotes(
        "Need competitive response for SME. Device+plan. 24 months. Target R499. Competitor is Vodacom. Need OEM subsid support."
      );
      await wait(650);
      addAttachment("Competitor Quote");
      await wait(450);
      generateDealLines();
      await wait(600);

      setView("Financials");
      setAiPanel({ title: "Guided scenario", body: "Step 4/8: Run the deterministic financial model and compute DoA." });
      await wait(600);
      runModel();
      await wait(650);

      setView("Pre-Approvals");
      setAiPanel({ title: "Guided scenario", body: "Step 5/8: Request and confirm OEM funding; attach OEM letter." });
      await wait(600);
      requestOemFunding();
      await wait(700);
      confirmOemFunding();
      await wait(500);
      attachOemLetter();
      await wait(600);

      setRole("Approver");
      setView("Approvals");
      setAiPanel({ title: "Guided scenario", body: "Step 6/8: Start DoA workflow. Approve via portal + email." });
      await wait(650);
      startDoA();
      await wait(500);
      portalApprove("ap_1");
      await wait(500);
      emailSendToApprover();
      await wait(450);
      emailReply("APPROVE");
      await wait(500);
      portalApprove("ap_3");
      await wait(450);

      setRole("Executor");
      setView("Deployment");
      setAiPanel({ title: "Guided scenario", body: "Step 7/8: Run deployment QA and deploy to all systems." });
      await wait(650);
      runDeploymentQA();
      await wait(650);
      deployAll();
      await wait(1100);

      setRole("Commercial Admin");
      setView("Tasks");
      setAiPanel({ title: "Guided scenario", body: "Step 8/8: Complete mandatory tasks; deal becomes Live." });
      await wait(650);
      completeAllMandatoryTasks();
      await wait(700);

      setView("Dashboards");
      setAiPanel({ title: "Guided scenario", body: "Scenario complete. Explore modules, audit trail, and exports." });
      await wait(400);
    } finally {
      scenarioRunningRef.current = false;
    }
  }

  function wait(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // -----------------------------
  // Exports
  // -----------------------------

  function exportPromoList() {
    const rows = (dealCase.lines || []).map((l, idx) => ({
      DealID: dealCase.id,
      DealName: dealCase.dealName,
      Line: idx + 1,
      DeviceCode: l.deviceCode,
      DeviceName: l.deviceName,
      PlanCode: l.planCode,
      PlanName: l.planName,
      TermMonths: l.termMonths,
      MonthlyPrice: l.monthlyPrice,
      MonthlyDiscount: l.monthlyDiscount,
      DeviceSubsidy: l.deviceSubsidy,
      AddOns: (l.addOns || []).join("|"),
      StartDate: dealCase.startDate,
      EndDate: dealCase.endDate,
    }));
    const csv = toCSV(rows);
    downloadText(`promo_list_${dealCase.id}.csv`, csv);
    addLog("Reporting", "Exported promo list", "Automation exported a CSV for channel distribution.");
  }

  // -----------------------------
  // Dashboards data
  // -----------------------------

  const pipelineData = useMemo(() => {
    const stageCounts = [
      { stage: "Draft", count: dealCase.stage === "Draft" ? 1 : 0 },
      { stage: "Approvals", count: ["ReadyForDoA", "InDoA"].includes(dealCase.stage) ? 1 : 0 },
      { stage: "Deployment", count: ["DeploymentReady", "Deploying"].includes(dealCase.stage) ? 1 : 0 },
      { stage: "Tasks", count: dealCase.stage === "PostApprovalTasks" ? 1 : 0 },
      { stage: "Live", count: dealCase.stage === "Live" ? 1 : 0 },
    ];
    return stageCounts;
  }, [dealCase.stage]);

  const cycleData = useMemo(() => {
    // Toy cycle time trend
    const start = new Date(dealCase.createdAt).getTime();
    const steps = [
      { name: "Created", t: 0 },
      { name: "Model", t: 2.2 },
      { name: "Pre-Approval", t: 3.4 },
      { name: "DoA", t: 5.1 },
      { name: "Deploy", t: 6.2 },
      { name: "Live", t: dealCase.stage === "Live" ? 7.0 : 6.6 },
    ];
    // If still early stage, compress
    const mult = dealCase.stage === "Draft" ? 0.4 : dealCase.stage.includes("DoA") ? 0.75 : 1;
    return steps.map((s) => ({ step: s.name, hours: Number((s.t * mult).toFixed(2)) }));
  }, [dealCase.createdAt, dealCase.stage]);

  // -----------------------------
  // Navigation
  // -----------------------------

  const nav = [
    { key: "Overview", label: "Overview" },
    { key: "Reference Data", label: "Reference Data" },
    { key: "Deal Intake", label: "Deal Intake" },
    { key: "Financials", label: "Financials" },
    { key: "Pre-Approvals", label: "Pre-Approvals" },
    { key: "Approvals", label: "Approvals" },
    { key: "Deployment", label: "Deployment" },
    { key: "Tasks", label: "Post-Approval Tasks" },
    { key: "Dashboards", label: "Dashboards" },
    { key: "Audit", label: "Audit" },
  ];

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <JourneyNarrator
            open={journeyOpen}
            onToggle={() => setJourneyOpen((o) => !o)}
            stepIndex={journeyStep}
            stepCount={JOURNEY_STEPS.length}
            step={JOURNEY_STEPS[journeyStep]}
            onPrev={() => goToJourneyStep(journeyStep - 1)}
            onNext={() => goToJourneyStep(journeyStep + 1)}
            onGo={(idx) => goToJourneyStep(idx)}
            onRun={() => runJourneyStepActions(journeyStep)}
            onRunAll={runGuidedScenario}
            running={journeyRunning}
          />
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Sidebar */}
          <div className="w-full lg:w-[320px]">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Deal Motivation Demo</CardTitle>
                <CardDescription>AI-assisted workflow (demo) — human actions + automation gates + AI help.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Current role</div>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Requestor", "Peer Reviewer", "Data Steward", "Approver", "Executor", "Commercial Admin", "Admin"].map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">Switch roles to demonstrate responsibilities.</div>
                </div>

                <div className="rounded-xl border bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">Deal case</div>
                    <RagBadge rag={dealCase.rag} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">ID: {dealCase.id}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StageBadge stage={dealCase.stage} />
                    {dealCase.financials?.doaLevel ? <Badge variant="outline">DoA: {dealCase.financials.doaLevel}</Badge> : null}
                    {dealCase.requiresIcasa ? <Badge variant="secondary">ICASA required</Badge> : null}
                    {dealCase.requiresOemFunding ? <Badge variant="secondary">OEM funding</Badge> : null}
                  </div>
                  <div className="mt-3">
                    <Progress value={stageProgress} />
                    <div className="mt-1 text-xs text-muted-foreground">Progress: {stageProgress}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-white p-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold">Auto-advance</div>
                    <div className="text-xs text-muted-foreground">Automation moves stages when gates are met.</div>
                  </div>
                  <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
                </div>

                <Button className="w-full" onClick={runGuidedScenario} disabled={scenarioRunningRef.current}>
                  <Play className="mr-2 h-4 w-4" />
                  Run guided scenario
                </Button>

                <Separator />

                <div className="space-y-1">
                  {nav.map((n) => (
                    <Button
                      key={n.key}
                      variant={view === n.key ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setView(n.key)}
                    >
                      {n.label}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div className="rounded-xl border bg-white p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4" />
                    {aiPanel.title}
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{aiPanel.body}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main */}
          <div className="flex-1 space-y-4">
            {view === "Overview" ? (
              <Overview
                role={role}
                dealCase={dealCase}
                activeRef={activeRef}
                approversNeeded={approversNeeded}
                setView={setView}
                exportPromoList={exportPromoList}
              />
            ) : null}

            {view === "Reference Data" ? (
              <ReferenceData
                role={role}
                refVersions={refVersions}
                uploadSampleRefUpdate={uploadSampleRefUpdate}
                approveRefVersion={approveRefVersion}
              />
            ) : null}

            {view === "Deal Intake" ? (
              <DealIntake
                role={role}
                dealCase={dealCase}
                setDealCase={setDealCase}
                extractFromNotes={extractFromNotes}
                addAttachment={addAttachment}
                generateDealLines={generateDealLines}
                updateLine={updateLine}
                addLog={addLog}
                setAiPanel={setAiPanel}
              />
            ) : null}

            {view === "Financials" ? (
              <Financials
                role={role}
                dealCase={dealCase}
                runModel={runModel}
              />
            ) : null}

            {view === "Pre-Approvals" ? (
              <PreApprovals
                role={role}
                dealCase={dealCase}
                requestOemFunding={requestOemFunding}
                confirmOemFunding={confirmOemFunding}
                attachOemLetter={attachOemLetter}
              />
            ) : null}

            {view === "Approvals" ? (
              <Approvals
                role={role}
                dealCase={dealCase}
                approversNeeded={approversNeeded}
                startDoA={startDoA}
                portalApprove={portalApprove}
                emailSendToApprover={emailSendToApprover}
                emailReply={emailReply}
              />
            ) : null}

            {view === "Deployment" ? (
              <Deployment
                role={role}
                dealCase={dealCase}
                runDeploymentQA={runDeploymentQA}
                deployAll={deployAll}
                retryDeploymentAfterFix={retryDeploymentAfterFix}
              />
            ) : null}

            {view === "Tasks" ? (
              <TaskBoard
                role={role}
                dealCase={dealCase}
                setTaskStatus={setTaskStatus}
                completeAllMandatoryTasks={completeAllMandatoryTasks}
              />
            ) : null}

            {view === "Dashboards" ? (
              <Dashboards
                role={role}
                dealCase={dealCase}
                pipelineData={pipelineData}
                cycleData={cycleData}
                exportPromoList={exportPromoList}
              />
            ) : null}

            {view === "Audit" ? <AuditLog logs={logs} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Views
// -----------------------------

function Overview({ role, dealCase, activeRef, approversNeeded, setView, exportPromoList }) {
  return (
    <div className="space-y-4">
      <SectionTitle
        title="Overview"
        subtitle="Use this as your pitch narrative: human responsibility + automation gates + AI assistance across the full lifecycle."
        right={
          <Button variant="secondary" onClick={exportPromoList}>
            <FileText className="mr-2 h-4 w-4" />
            Export promo list
          </Button>
        }
      />

      <HumanAutoAIKey />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>What the user does</CardTitle>
            <CardDescription>Decisions remain human-owned at key control points.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Submit deal intent and attach evidence</li>
              <li>Peer review and approve reference data</li>
              <li>Approve/return deals based on DoA</li>
              <li>Authorize deployment and verify success</li>
              <li>Complete post-approval compliance tasks</li>
            </ul>
            <Button className="w-full" variant="outline" onClick={() => setView("Deal Intake")}>Go to Deal Intake</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What automation does</CardTitle>
            <CardDescription>Rules + routing + gating create speed, consistency and auditability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Stage transitions when gates are met</li>
              <li>DoA routing based on model thresholds</li>
              <li>Pre-approval dependencies (OEM/ICASA)</li>
              <li>QA gates before deployment</li>
              <li>Task board creation after approval</li>
            </ul>
            <Button className="w-full" variant="outline" onClick={() => setView("Approvals")}>Go to Approvals</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What AI does</CardTitle>
            <CardDescription>AI reduces admin work and improves submission/approval quality.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Extracts structured fields from notes</li>
              <li>Summarises decision packs for approvers</li>
              <li>Flags anomalies in reference data and configs</li>
              <li>Explains failures in plain language</li>
              <li>Highlights bottlenecks and risks</li>
            </ul>
            <Button className="w-full" variant="outline" onClick={() => setView("Deployment")}>Go to Deployment</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal snapshot</CardTitle>
          <CardDescription>Live view of the current demo deal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-3">
            <div className="text-sm font-semibold">Deal case</div>
            <div className="mt-2 text-sm text-muted-foreground">Name: {dealCase.dealName || "—"}</div>
            <div className="text-sm text-muted-foreground">Type: {dealCase.dealType}</div>
            <div className="text-sm text-muted-foreground">Channel: {dealCase.channel}</div>
            <div className="text-sm text-muted-foreground">
              Dates: {new Date(dealCase.startDate).toLocaleDateString()} → {new Date(dealCase.endDate).toLocaleDateString()}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {dealCase.requiresOemFunding ? <Badge variant="secondary">OEM funding</Badge> : null}
              {dealCase.requiresIcasa ? <Badge variant="secondary">ICASA</Badge> : null}
              <Badge variant="outline">Lines: {(dealCase.lines || []).length}</Badge>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="text-sm font-semibold">Reference data (active)</div>
            <div className="mt-2 text-sm text-muted-foreground">Devices: {activeRef.devices.length}</div>
            <div className="text-sm text-muted-foreground">Plans: {activeRef.pricePlans.length}</div>
            <div className="text-sm text-muted-foreground">Add-ons: {activeRef.addOns.length}</div>
            <div className="text-sm text-muted-foreground">Competitor rows: {activeRef.competitor.length}</div>
            <Separator className="my-2" />
            <div className="text-sm font-semibold">Approvers likely required</div>
            <div className="mt-1 text-sm text-muted-foreground">{approversNeeded.length ? approversNeeded.map((a) => a.name).join(" • ") : "Run the model to compute DoA."}</div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Wand2 className="h-4 w-4" />
        <AlertTitle>Demo tip</AlertTitle>
        <AlertDescription>
          Toggle <span className="font-medium">Auto-advance</span> to show the workflow gates moving stages automatically when prerequisites are met.
          Keep it on for a clean “end-to-end” demo.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ReferenceData({ role, refVersions, uploadSampleRefUpdate, approveRefVersion }) {
  const canUpload = ["Data Steward", "Admin"].includes(role);
  const canApprove = ["Peer Reviewer", "Admin"].includes(role);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Reference Data"
        subtitle="Human: upload + peer review. Automation: versioning/audit. AI: anomaly detection + change summary."
        right={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={uploadSampleRefUpdate} disabled={!canUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload sample update
            </Button>
          </div>
        }
      />

      {!canUpload ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Role limitation</AlertTitle>
          <AlertDescription>Switch role to Data Steward/Admin to upload reference data.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Versions</CardTitle>
            <CardDescription>Automation maintains version history with a single Active dataset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {refVersions
              .slice()
              .reverse()
              .map((v) => (
                <div key={v.id} className="rounded-xl border bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{v.version}</div>
                    <Badge variant={v.status === "Active" ? "default" : v.status === "PendingReview" ? "secondary" : "outline"}>{v.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">By {v.by} • {fmt(v.at)}</div>

                  {v.ai ? (
                    <div className="mt-3 rounded-lg border bg-muted/30 p-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="h-4 w-4" /> AI check summary
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{v.ai.summary}</div>
                      <div className="mt-2 space-y-1">
                        {v.ai.issues.slice(0, 4).map((i, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{i.severity}:</span> {i.msg}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {v.status === "PendingReview" ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => approveRefVersion(v.id)}
                        disabled={!canApprove}
                        className="w-full"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Approve (peer review)
                      </Button>
                    </div>
                  ) : null}

                  {v.status === "PendingReview" && !canApprove ? (
                    <div className="mt-2 text-xs text-muted-foreground">Switch role to Peer Reviewer/Admin to approve.</div>
                  ) : null}
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active datasets</CardTitle>
            <CardDescription>Preview of what deal creators can select from.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DatasetMiniTable title="Devices" rows={refVersions.find((v) => v.status === "Active")?.datasets.devices || []} cols={["code", "name", "price", "stock"]} />
            <DatasetMiniTable title="Price Plans" rows={refVersions.find((v) => v.status === "Active")?.datasets.pricePlans || []} cols={["code", "name", "price"]} />
            <DatasetMiniTable title="Competitor" rows={refVersions.find((v) => v.status === "Active")?.datasets.competitor || []} cols={["name", "offer", "source"]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DatasetMiniTable({ title, rows, cols }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              {cols.map((c) => (
                <th key={c} className="px-2 py-1">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 4).map((r, idx) => (
              <tr key={idx} className="border-t">
                {cols.map((c) => (
                  <td key={c} className="px-2 py-1">{String(r[c] ?? "—")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 4 ? <div className="mt-2 text-xs text-muted-foreground">Showing 4 of {rows.length} rows.</div> : null}
    </div>
  );
}

function DealIntake({ role, dealCase, setDealCase, extractFromNotes, addAttachment, generateDealLines, updateLine, addLog, setAiPanel }) {
  const canEdit = ["Requestor", "Admin"].includes(role);
  const [notes, setNotes] = useState(
    "Need SIM-only competitive response for SME. 24 months. Target R399. Competitor quote attached."
  );

  useEffect(() => {
    // Keep the SIM-only demo easy to trigger
    if (dealCase.dealType === "SIM-Only") {
      setDealCase((d) => ({ ...d, requiresIcasa: true, updatedAt: nowISO() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealCase.dealType]);

  function setField(k, v) {
    setDealCase((d) => ({ ...d, [k]: v, updatedAt: nowISO() }));
  }

  function markReady() {
    addLog("Deal Intake", "Submission marked ready", "Human indicates deal is ready for model/validation." );
    setAiPanel({ title: "AI assistance", body: "I will run completeness checks and recommend what to fix before approvals." });
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Deal Intake"
        subtitle="Human: define intent + evidence. Automation: completeness gates. AI: extract fields + suggest missing info + bulk lines." 
        right={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => addAttachment("Competitor Quote")} disabled={!canEdit}>
              <FileText className="mr-2 h-4 w-4" /> Add competitor attachment
            </Button>
            <Button onClick={generateDealLines} disabled={!canEdit}>
              <Wand2 className="mr-2 h-4 w-4" /> Generate deal lines
            </Button>
          </div>
        }
      />

      {!canEdit ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Role limitation</AlertTitle>
          <AlertDescription>Switch role to Requestor/Admin to edit deal intake fields.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI-assisted capture</CardTitle>
            <CardDescription>Paste unstructured notes, email text, or meeting notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={7} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => extractFromNotes(notes)} disabled={!canEdit} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" /> Extract structured deal fields
              </Button>
              <Button variant="outline" onClick={() => setNotes("Need competitive response for SME. Device+plan. 24 months. Target R499. Competitor is Vodacom. Need OEM subsid support.")} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" /> Load sample notes
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              In production: the AI would write into a structured schema. Here: we mock the extraction.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Structured fields</CardTitle>
            <CardDescription>These drive validation, modeling, routing and downstream deployment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs font-semibold">Deal name</div>
                <Input value={dealCase.dealName} onChange={(e) => setField("dealName", e.target.value)} disabled={!canEdit} placeholder="e.g., Back-to-School Response" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold">Deal type</div>
                <Select value={dealCase.dealType} onValueChange={(v) => setField("dealType", v)}>
                  <SelectTrigger disabled={!canEdit}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Device + Plan">Device + Plan</SelectItem>
                    <SelectItem value="SIM-Only">SIM-Only</SelectItem>
                    <SelectItem value="Outright">Outright</SelectItem>
                    <SelectItem value="Extension">Extension</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold">Channel</div>
                <Select value={dealCase.channel} onValueChange={(v) => setField("channel", v)}>
                  <SelectTrigger disabled={!canEdit}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consumer">Consumer</SelectItem>
                    <SelectItem value="SME">SME</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold">Duration (months)</div>
                <Input type="number" value={dealCase.durationMonths} onChange={(e) => setField("durationMonths", Number(e.target.value))} disabled={!canEdit} />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold">Target monthly price (R)</div>
                <Input type="number" value={dealCase.targetMonthlyPrice} onChange={(e) => setField("targetMonthlyPrice", Number(e.target.value))} disabled={!canEdit} />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold">Requires OEM funding</div>
                <div className="flex items-center gap-2">
                  <Switch checked={!!dealCase.requiresOemFunding} onCheckedChange={(v) => setField("requiresOemFunding", v)} disabled={!canEdit} />
                  <div className="text-sm text-muted-foreground">{dealCase.requiresOemFunding ? "Yes" : "No"}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold">Start date</div>
                <Input type="date" value={dealCase.startDate.slice(0, 10)} onChange={(e) => setField("startDate", new Date(e.target.value).toISOString())} disabled={!canEdit} />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold">End date</div>
                <Input type="date" value={dealCase.endDate.slice(0, 10)} onChange={(e) => setField("endDate", new Date(e.target.value).toISOString())} disabled={!canEdit} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold">Rationale</div>
              <Textarea value={dealCase.rationale} onChange={(e) => setField("rationale", e.target.value)} disabled={!canEdit} rows={4} placeholder="Why are we doing this deal?" />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="w-full" onClick={markReady} disabled={!canEdit}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark ready
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => addAttachment("Internal Motivation Memo")}
                disabled={!canEdit}
              >
                <FileText className="mr-2 h-4 w-4" /> Add motivation memo
              </Button>
            </div>

            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-sm font-semibold">Attachments</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(dealCase.attachments || []).length ? (
                  dealCase.attachments.map((a) => (
                    <Badge key={a.id} variant="outline">{a.kind}</Badge>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No attachments yet.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal lines</CardTitle>
          <CardDescription>Human can edit per-line discounts. Automation uses these for modeling + deployment readiness.</CardDescription>
        </CardHeader>
        <CardContent>
          {(dealCase.lines || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No lines yet. Use “Generate deal lines”.</div>
          ) : (
            <div className="overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Line</th>
                    <th className="px-3 py-2">Device</th>
                    <th className="px-3 py-2">Plan</th>
                    <th className="px-3 py-2">Discount (R/mo)</th>
                    <th className="px-3 py-2">Subsidy (R)</th>
                    <th className="px-3 py-2">Add-ons</th>
                  </tr>
                </thead>
                <tbody>
                  {dealCase.lines.map((l, idx) => (
                    <tr key={l.id} className="border-t bg-white">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">{l.deviceName || "—"}</td>
                      <td className="px-3 py-2">{l.planName || "—"}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={l.monthlyDiscount}
                          onChange={(e) => updateLine(l.id, { monthlyDiscount: Number(e.target.value) })}
                          disabled={!canEdit}
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={l.deviceSubsidy}
                          onChange={(e) => updateLine(l.id, { deviceSubsidy: Number(e.target.value) })}
                          disabled={!canEdit}
                          className="h-8"
                        />
                      </td>
                      <td className="px-3 py-2">{(l.addOns || []).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Financials({ role, dealCase, runModel }) {
  const canRun = ["Requestor", "Commercial Admin", "Admin"].includes(role);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Financials"
        subtitle="Human: verify assumptions. Automation: compute model + DoA. AI: explain outputs + highlight outliers."
        right={
          <Button onClick={runModel} disabled={!canRun || (dealCase.lines || []).length === 0}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Run deterministic model
          </Button>
        }
      />

      {!canRun ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Role limitation</AlertTitle>
          <AlertDescription>Switch role to Requestor/Commercial Admin/Admin to run the model.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model outputs</CardTitle>
            <CardDescription>Deterministic calculations (demo).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!dealCase.financials ? (
              <div className="text-sm text-muted-foreground">Run the model to populate results.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Kpi label="Margin" value={`${dealCase.financials.marginPct.toFixed(1)}%`} />
                <Kpi label="Payback" value={`${dealCase.financials.paybackMonths} months`} />
                <Kpi label="DoA level" value={dealCase.financials.doaLevel} />
                <Kpi label="Avg subsidy" value={`R${Math.round(dealCase.financials.avgSubsidy)}`} />
                <Kpi label="Avg discount" value={`R${Math.round(dealCase.financials.avgDiscount)}/mo`} />
                <Kpi label="Suggested OEM funding" value={`R${dealCase.financials.oemFundingSuggested}`} />
              </div>
            )}
            <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Automation:</span> model + DoA thresholds are consistent across all deals.
              <div className="mt-1">In production this would mirror MTN’s commercial model rules and connect to reference data catalogs.</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI explanation (demo)</CardTitle>
            <CardDescription>Readable summary for approvers — reduces decision time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!dealCase.financials ? (
              <div className="text-sm text-muted-foreground">Run the model to generate the summary.</div>
            ) : (
              <div className="rounded-xl border bg-white p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Summary
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  The deal targets R{dealCase.targetMonthlyPrice}/mo over {dealCase.durationMonths} months. Based on line subsidies and discounts,
                  estimated margin is {dealCase.financials.marginPct.toFixed(1)}% with payback {dealCase.financials.paybackMonths} months.
                  DoA requirement is {dealCase.financials.doaLevel}.
                </div>
                <div className="mt-3 text-sm">
                  <div className="font-semibold">Flags</div>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                    {dealCase.financials.marginPct < 12 ? <li>Margin is low — consider reducing subsidy or discount.</li> : <li>No major financial flags in this demo.</li>}
                    {dealCase.requiresOemFunding ? <li>OEM funding required — ensure confirmation + letter attached before deployment.</li> : null}
                  </ul>
                </div>
              </div>
            )}

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                AI helps explain and highlight issues. The approval decision remains a human responsibility.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function PreApprovals({ role, dealCase, requestOemFunding, confirmOemFunding, attachOemLetter }) {
  const canAct = ["Requestor", "Commercial Admin", "Admin"].includes(role);
  const oem = dealCase.preApprovals?.oemFunding;

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Pre-Approvals"
        subtitle="Human: request/confirm OEM funding. Automation: dependency gating. AI: draft request + interpret replies."
        right={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={requestOemFunding} disabled={!canAct || !dealCase.requiresOemFunding}>
              <Mail className="mr-2 h-4 w-4" /> Request OEM funding
            </Button>
            <Button onClick={confirmOemFunding} disabled={!canAct || !dealCase.requiresOemFunding}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm OEM
            </Button>
          </div>
        }
      />

      {!dealCase.requiresOemFunding ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>No pre-approval needed</AlertTitle>
          <AlertDescription>This deal is not flagged as requiring OEM funding in this demo.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>OEM funding status</CardTitle>
            <CardDescription>Automation uses this as a gate before DoA and deployment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Required</div>
                <Badge variant={dealCase.requiresOemFunding ? "secondary" : "outline"}>{dealCase.requiresOemFunding ? "Yes" : "No"}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Status</div>
                <Badge variant={oem?.status === "Confirmed" ? "default" : oem?.status === "Requested" ? "secondary" : "outline"}>{oem?.status}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Requested: {oem?.requestedAt ? fmt(oem.requestedAt) : "—"}</div>
              <div className="text-xs text-muted-foreground">Confirmed: {oem?.confirmedAt ? fmt(oem.confirmedAt) : "—"}</div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Letter attached</div>
                <Badge variant={oem?.letterAttached ? "default" : "outline"}>{oem?.letterAttached ? "Yes" : "No"}</Badge>
              </div>
              <div className="mt-2">
                <Button variant="outline" className="w-full" onClick={attachOemLetter} disabled={!canAct || oem?.status !== "Confirmed"}>
                  <Upload className="mr-2 h-4 w-4" /> Upload OEM letter
                </Button>
                {oem?.status !== "Confirmed" ? (
                  <div className="mt-2 text-xs text-muted-foreground">Confirm OEM first, then upload the letter.</div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI-generated request (demo)</CardTitle>
            <CardDescription>Turns the deal into a one-page email pack.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-white p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <Mail className="h-4 w-4" /> OEM Funding Request Email
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Subject: OEM funding request — {dealCase.id}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                Hi OEM Team,\n\nWe request OEM funding support for deal {dealCase.id} ({dealCase.dealName || "—"}).\n\nSummary:\n- Deal type: {dealCase.dealType}\n- Channel: {dealCase.channel}\n- Dates: {new Date(dealCase.startDate).toLocaleDateString()} to {new Date(dealCase.endDate).toLocaleDateString()}\n- Target: R{dealCase.targetMonthlyPrice}/mo | Term: {dealCase.durationMonths}m\n- Suggested OEM contribution (demo): R{dealCase.financials?.oemFundingSuggested ?? "—"} per line\n\nAttachments:\n- Deal lines + rationale\n- Competitive evidence\n\nPlease reply APPROVED / CHANGES REQUIRED and attach the approval letter.\n\nThanks,
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!canAct ? (
        <div className="text-xs text-muted-foreground">Switch role to Requestor/Commercial Admin/Admin to act on pre-approvals.</div>
      ) : null}
    </div>
  );
}

function Approvals({ role, dealCase, approversNeeded, startDoA, portalApprove, emailSendToApprover, emailReply }) {
  const canStart = ["Requestor", "Commercial Admin", "Admin"].includes(role);
  const canApprove = ["Approver", "Admin"].includes(role);

  const order = ["L1", "L2", "L3", "EXCO"];
  const required = dealCase.financials?.doaLevel || dealCase.doa.requiredLevel;
  const maxIdx = required ? order.indexOf(required) : -1;

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Approvals (DoA)"
        subtitle="Human: approve/return. Automation: routing + audit + email/portal capture. AI: decision pack summary + revision checklist." 
        right={
          <div className="flex gap-2">
            <Button onClick={startDoA} disabled={!canStart || !dealCase.financials}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Start approval workflow
            </Button>
          </div>
        }
      />

      {!dealCase.financials ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Model required</AlertTitle>
          <AlertDescription>Run the deterministic model first to compute DoA and unlock approvals.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Approver routing</CardTitle>
            <CardDescription>Automation selects approvers based on DoA level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Required DoA</div>
                <Badge variant="outline">{required || "—"}</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Needed: {approversNeeded.length ? approversNeeded.map((a) => a.name).join(" • ") : "—"}</div>
            </div>

            <div className="rounded-xl border bg-white p-3">
              <div className="text-sm font-semibold">Portal approvals</div>
              <div className="mt-2 space-y-2">
                {DEMO_APPROVERS.filter((a) => maxIdx >= 0 && order.indexOf(a.level) <= maxIdx).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-2">
                    <div>
                      <div className="text-sm font-semibold">{a.name}</div>
                      <div className="text-xs text-muted-foreground">Level {a.level}</div>
                    </div>
                    <Button size="sm" onClick={() => portalApprove(a.id)} disabled={!canApprove || dealCase.doa.status !== "InProgress"}>
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
              {dealCase.doa.status !== "InProgress" ? (
                <div className="mt-2 text-xs text-muted-foreground">Start the workflow first to enable approvals.</div>
              ) : null}
            </div>

            {!canApprove ? (
              <div className="text-xs text-muted-foreground">Switch role to Approver/Admin to record approvals.</div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email approvals (demo)</CardTitle>
            <CardDescription>Approvers can reply to email; automation captures the decision.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="Inbox">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="Inbox">Inbox</TabsTrigger>
                <TabsTrigger value="Thread">Thread</TabsTrigger>
              </TabsList>
              <TabsContent value="Inbox" className="space-y-3">
                <Button variant="secondary" className="w-full" onClick={emailSendToApprover} disabled={!canStart || dealCase.doa.status === "NotStarted"}>
                  <Mail className="mr-2 h-4 w-4" /> Send approval email
                </Button>

                <div className="rounded-xl border bg-white p-3">
                  <div className="text-sm font-semibold">Simulated reply actions</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <Button variant="outline" onClick={() => emailReply("APPROVE")} disabled={!canApprove || dealCase.doa.status !== "InProgress"}>
                      APPROVE
                    </Button>
                    <Button variant="outline" onClick={() => emailReply("RETURN")} disabled={!canApprove || dealCase.doa.status !== "InProgress"}>
                      RETURN
                    </Button>
                    <Button variant="outline" onClick={() => emailReply("REMOVE") } disabled={!canApprove || dealCase.doa.status !== "InProgress"}>
                      REMOVE line 2
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">In production: email parsing + signature checks + DoA validation.</div>
                </div>

                <div className="rounded-xl border bg-muted/30 p-3">
                  <div className="text-sm font-semibold">DoA status</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{dealCase.doa.status}</Badge>
                    <Badge variant="outline">Approvals: {(dealCase.doa.approvals || []).length}</Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="Thread" className="space-y-3">
                {(dealCase.doa.emailThread || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No email thread yet. Send an approval email first.</div>
                ) : (
                  <div className="space-y-2">
                    {dealCase.doa.emailThread.map((m) => (
                      <div key={m.id} className="rounded-xl border bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold">{m.subject}</div>
                          <div className="text-xs text-muted-foreground">{fmt(m.at)}</div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">From: {m.from} → To: {m.to}</div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recorded approvals</CardTitle>
          <CardDescription>Full audit trail — method (portal/email) and timestamps.</CardDescription>
        </CardHeader>
        <CardContent>
          {(dealCase.doa.approvals || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No approvals yet.</div>
          ) : (
            <div className="overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Approver</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dealCase.doa.approvals.map((a) => (
                    <tr key={a.id} className="border-t bg-white">
                      <td className="px-3 py-2">{a.approver}</td>
                      <td className="px-3 py-2">{a.level}</td>
                      <td className="px-3 py-2">{a.method}</td>
                      <td className="px-3 py-2">{fmt(a.at)}</td>
                      <td className="px-3 py-2"><Badge variant={a.status === "Approved" ? "default" : "outline"}>{a.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Deployment({ role, dealCase, runDeploymentQA, deployAll, retryDeploymentAfterFix }) {
  const canAct = ["Executor", "Admin"].includes(role);

  const hasFail = (dealCase.deployment.qa || []).some((x) => x.status === "Fail");
  const anyFailedSystem = dealCase.deployment.perSystem.some((s) => s.status === "Failed");

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Deployment"
        subtitle="Human: authorized deployment + monitoring. Automation: QA gate + per-system status tracking. AI: flag issues + explain failures." 
        right={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={runDeploymentQA} disabled={!canAct}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Run readiness QA
            </Button>
            <Button onClick={deployAll} disabled={!canAct || dealCase.deployment.readiness !== "Ready"}>
              <Play className="mr-2 h-4 w-4" /> Deploy all
            </Button>
          </div>
        }
      />

      {!canAct ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Role limitation</AlertTitle>
          <AlertDescription>Switch role to Executor/Admin to run QA and deploy.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Readiness checks</CardTitle>
            <CardDescription>Automation blocks deployment until fails are resolved.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(dealCase.deployment.qa || []).length === 0 ? (
              <div className="text-sm text-muted-foreground">Run QA to see checks.</div>
            ) : (
              <div className="space-y-2">
                {dealCase.deployment.qa.map((q) => (
                  <div key={q.id} className="flex items-start justify-between gap-3 rounded-xl border bg-white p-3">
                    <div>
                      <div className="text-sm font-semibold">{q.check}</div>
                      <div className="text-xs text-muted-foreground">{q.msg}</div>
                    </div>
                    <Badge variant={q.status === "Pass" ? "default" : q.status === "Warn" ? "secondary" : "destructive"}>{q.status}</Badge>
                  </div>
                ))}
              </div>
            )}

            {hasFail ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fix required</AlertTitle>
                <AlertDescription>Resolve failed checks, then run QA again.</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-system status</CardTitle>
            <CardDescription>Deployment results tracked per downstream system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {dealCase.deployment.perSystem.map((s) => (
                <div key={s.systemId} className="flex items-center justify-between rounded-xl border bg-white p-3">
                  <div>
                    <div className="text-sm font-semibold">{s.systemName}</div>
                    <div className="text-xs text-muted-foreground">{s.message || "—"}</div>
                  </div>
                  <Badge
                    variant={
                      s.status === "Deployed"
                        ? "default"
                        : s.status === "Deploying"
                          ? "secondary"
                          : s.status === "Failed"
                            ? "destructive"
                            : "outline"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>

            {anyFailedSystem ? (
              <div className="rounded-xl border bg-white p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Demo failure detected
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  One system failed. In this demo, iLula fails if ICASA mandatory task is not completed.
                </div>
                <Button className="mt-3 w-full" variant="outline" onClick={retryDeploymentAfterFix} disabled={!canAct}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Apply demo fix and retry
                </Button>
              </div>
            ) : null}

            {dealCase.deployment.lastError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Last error</AlertTitle>
                <AlertDescription>{dealCase.deployment.lastError}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TaskBoard({ role, dealCase, setTaskStatus, completeAllMandatoryTasks }) {
  const canAct = ["Commercial Admin", "Admin"].includes(role);

  const grouped = useMemo(() => {
    const g = {};
    (dealCase.tasks || []).forEach((t) => {
      g[t.category] = g[t.category] || [];
      g[t.category].push(t);
    });
    return g;
  }, [dealCase.tasks]);

  const mandatoryDone = (dealCase.tasks || []).filter((t) => t.mandatory).every((t) => t.status === "Done");

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Post-Approval Tasks"
        subtitle="Human: complete compliance artefacts. Automation: creates tasks + blocks go-live until mandatory tasks are done. AI: task briefs + reminders." 
        right={
          <Button onClick={completeAllMandatoryTasks} disabled={!canAct || (dealCase.tasks || []).length === 0}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Complete all mandatory (demo)
          </Button>
        }
      />

      {(dealCase.tasks || []).length === 0 ? (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Tasks not created yet</AlertTitle>
          <AlertDescription>In this demo, tasks are created automatically after DoA status becomes Approved.</AlertDescription>
        </Alert>
      ) : null}

      {!canAct ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Role limitation</AlertTitle>
          <AlertDescription>Switch role to Commercial Admin/Admin to update task statuses.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.keys(grouped).length ? (
          Object.entries(grouped).map(([cat, items]) => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle>{cat}</CardTitle>
                <CardDescription>{items.filter((t) => t.mandatory).length} mandatory item(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((t) => (
                  <div key={t.id} className="rounded-xl border bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">{t.title}</div>
                          {t.mandatory ? <Badge variant="secondary">Mandatory</Badge> : <Badge variant="outline">Optional</Badge>}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">Owner: {t.owner} • Due: {new Date(t.due).toLocaleDateString()}</div>
                      </div>
                      <Badge variant={t.status === "Done" ? "default" : t.status === "Doing" ? "secondary" : "outline"}>{t.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Button size="sm" variant="outline" onClick={() => setTaskStatus(t.id, "Todo")} disabled={!canAct}>Todo</Button>
                      <Button size="sm" variant="outline" onClick={() => setTaskStatus(t.id, "Doing")} disabled={!canAct}>Doing</Button>
                      <Button size="sm" onClick={() => setTaskStatus(t.id, "Done")} disabled={!canAct}>Done</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No tasks</CardTitle>
              <CardDescription>Complete approvals and deployment to generate tasks in this demo.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Go-live gate</CardTitle>
            <CardDescription>Automation blocks Live status until mandatory tasks are complete.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Mandatory tasks complete</div>
                <Badge variant={mandatoryDone ? "default" : "destructive"}>{mandatoryDone ? "Yes" : "No"}</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                When all mandatory tasks are marked Done, the workflow automatically transitions the deal to <span className="font-medium text-foreground">Live</span>.
              </div>
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>AI assistance (demo)</AlertTitle>
              <AlertDescription>
                AI can generate task briefs, detect missing artefacts, and draft reminders. Completion and sign-off remain human responsibilities.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Dashboards({ role, dealCase, pipelineData, cycleData, exportPromoList }) {
  return (
    <div className="space-y-4">
      <SectionTitle
        title="Dashboards"
        subtitle="Automation: reporting and exports. AI: insights and anomaly highlights."
        right={
          <Button variant="secondary" onClick={exportPromoList}>
            <FileText className="mr-2 h-4 w-4" /> Export promo list
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by stage (demo)</CardTitle>
            <CardDescription>Operational visibility — where deals are stuck.</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <XAxis dataKey="stage" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cycle time trend (demo)</CardTitle>
            <CardDescription>Shows how automation + AI reduce elapsed time through the workflow.</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cycleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hours" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI insights (demo)</CardTitle>
          <CardDescription>Short narrative summary to support weekly reporting.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-white p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Summary
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Current deal is <span className="font-medium text-foreground">{dealCase.stage}</span> (RAG: {dealCase.rag}).
              {(dealCase.tasks || []).length
                ? ` There are ${(dealCase.tasks || []).filter((t) => t.status !== "Done").length} remaining tasks.`
                : " Tasks will be created after approval."}
              {dealCase.deployment.lastError ? ` Deployment risk: ${dealCase.deployment.lastError}.` : " Deployment status is healthy in this demo."}
            </div>
            <div className="mt-3 text-sm">
              <div className="font-semibold">Recommended next action</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {dealCase.stage === "Draft" ? "Complete deal intake fields and generate lines." :
                dealCase.stage === "ReadyForModel" ? "Run the deterministic financial model." :
                dealCase.stage === "AwaitingPreApprovals" ? "Confirm OEM funding and attach the letter." :
                dealCase.stage === "ReadyForDoA" ? "Start DoA workflow and capture approvals." :
                dealCase.stage === "DeploymentReady" ? "Run readiness QA and deploy." :
                dealCase.stage === "PostApprovalTasks" ? "Complete mandatory compliance tasks to go live." :
                dealCase.stage === "Live" ? "Export promo list and monitor performance." :
                "Continue the workflow."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Demo export</AlertTitle>
        <AlertDescription>
          The “Export promo list” button generates a CSV to simulate distribution to channels.
        </AlertDescription>
      </Alert>
    </div>
  );
}
