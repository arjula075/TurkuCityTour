import {
  BarChart,
  Callout,
  Card,
  CardBody,
  CardHeader,
  CollapsibleSection,
  Divider,
  Grid,
  H1,
  H2,
  PieChart,
  Stack,
  Stat,
  Table,
  Text,
  TodoListCard,
  useHostTheme,
} from "cursor/canvas";

const severityData = [
  { label: "Critical", value: 0, tone: "success" as const },
  { label: "High", value: 0, tone: "success" as const },
  { label: "Medium", value: 4, tone: "warning" as const },
  { label: "Low", value: 3, tone: "info" as const },
  { label: "Resolved / OK", value: 28, tone: "success" as const },
];

const categoryCategories = [
  "Auth & RLS",
  "Secrets",
  "Data layer",
  "Frontend",
  "Game integrity",
  "CI/CD",
];
const categorySeries = [
  {
    name: "Open findings by area",
    data: [1, 1, 0, 1, 0, 0],
    tone: "warning" as const,
  },
];

const highRows: string[][] = [];

const mediumRows = [
  [
    "Open self-registration (default)",
    "Public signup enabled by default; set VITE_ENABLE_REGISTRATION=false + disable Auth signup for invite-only.",
    "Register.jsx · features.js · Supabase Auth",
  ],
  [
    "Session in localStorage",
    "Default Supabase SPA persistence — JWT theft if XSS ever introduced.",
    "supabaseClient.js",
  ],
  [
    "Thunderforest key in bundle",
    "VITE_THUNDERFOREST_API_KEY in built JS — restrict by HTTP referrer in provider dashboard.",
    "MapView.jsx",
  ],
  [
    "CSP not verified in prod",
    "Run npm run security:verify-headers with DEPLOY_URL (or set GitHub secret).",
    "scripts/verify-security-headers.mjs",
  ],
];

const lowRows = [
  [
    "Auth abuse monitoring",
    "Enable Supabase CAPTCHA or rate limits on Register if spam appears.",
    "Register.jsx · Supabase Auth",
  ],
  [
    "httpOnly session (optional)",
    "Migrate to cookie session via SSR/proxy only if threat model requires.",
    "supabaseClient.js",
  ],
  [
    "Full DDL baseline dump",
    "00000_baseline.sql is an inventory manifest; optional pg_dump via dump-baseline-schema.sh.",
    "scripts/dump-baseline-schema.sh",
  ],
];

const resolvedRows = [
  ["create_user_profile hardened", "00001 — auth.uid(), no client uid param"],
  ["submit_answer RPC", "00002/00004 — server validates answers"],
  ["Player query sanitization", "fetchLocationsForPlayer omits is_correct and correct_answer"],
  ["user_progress integrity", "00004/00009 — trigger blocks client answered_correctly"],
  ["Platform admin RLS rebuild", "00020 — drop/recreate all core policies with is_platform_admin"],
  ["Multi-tenant org RLS", "00016–00017 — org-scoped catalog + subscription limits"],
  ["answers is_correct masked", "00010 view + integration tests"],
  ["record_location_guess RPC", "00011 — map-click guess server-validated"],
  ["record_give_up RPC", "00015 — give-up server-validated"],
  ["Storage policies versioned", "00012 storage.objects folder policies"],
  ["Leaderboard admin-only", "00006 view wrapper pattern"],
  ["client_logs hardened", "00007 rate limit + logger.js cap"],
  ["validate_location_arrival", "00008 walk-phase geofence"],
  ["AuthRoute guards", "/map, /game-complete, /complete, /sorry"],
  ["Invite-only registration flag", "VITE_ENABLE_REGISTRATION=false"],
  ["Integration test secrets", ".env.test.example — SUPABASE_TEST_* only"],
  ["RLS audit + legacy cleanup", "00014/00019/00020 + scripts/audit-rls.sql"],
  ["CSP verify script", "npm run security:verify-headers"],
  ["Schema inventory versioned", "00000_baseline.sql + npm run schema:manifest"],
  ["36 RLS integration tests", "PR + nightly supabase-integration.yml"],
  ["Security headers", "public/_headers + vercel.json"],
  ["Secret scanner + npm audit", "security.yml on every PR"],
  ["E2E auth redirect", "Unauthenticated /map → login"],
  ["users RLS tested", "is_platform_admin escalation blocked"],
  ["org tenancy tested", "Cross-org game isolation + subscription limits"],
  ["Dead admin leak API removed", "fetchLocationsWithHintsQuestionsAnswers → fetchLocationsForAdmin"],
  ["Paginated auth fixtures", "listAllAuthUsers — fixes flaky integration setup"],
];

const postureRows = [
  ["Dimension", "Jun 2026 audit", "Current", "Remaining gap"],
  ["Database policies", "Dashboard only", "00000–00020 in repo", "Optional full pg_dump"],
  ["Answer validation", "Client is_correct", "submit_answer RPC + answers view", "—"],
  ["Admin / tenancy", "UI AdminRoute only", "is_platform_admin + org RLS", "—"],
  ["Progress / scores", "Client upsert", "RPCs for guess, give-up, answers", "—"],
  ["Security CI", "Unit + audit", "36 RLS tests + e2e smoke", "DEPLOY_URL header check"],
  ["HTTP headers", "None", "CSP in repo + verify script", "Run on production URL"],
];

const workflowRows = [
  ["security.yml", "PR / push First-release", "npm audit · secret scan · unit tests · optional headers"],
  ["supabase-integration.yml", "PR / push / nightly / manual", "36 live Supabase RLS + RPC tests"],
  ["ci.yml", "PR / push First-release", "unit · coverage · build · Playwright smoke"],
  ["supabase-keepalive.yml", "Mon/Thu cron", "Service-role REST ping"],
];

const phase4Todos = [
  { id: "n1", content: "Export 00000_baseline.sql schema inventory", status: "completed" as const },
  { id: "n2", content: "Mask is_correct for non-admin answers reads", status: "completed" as const },
  { id: "n3", content: "record_location_guess RPC", status: "completed" as const },
  { id: "n4", content: "Version Storage bucket RLS", status: "completed" as const },
  { id: "n5", content: "Legacy RLS cleanup (00014/00019/00020)", status: "completed" as const },
  { id: "n6", content: "Integration test: player SELECT must not return is_correct", status: "completed" as const },
  { id: "n7", content: "Thunderforest: restrict API key by production referrer", status: "pending" as const },
  { id: "n8", content: "Verify CSP on live deploy (security:verify-headers)", status: "pending" as const },
];

const phase5Todos = [
  { id: "n9", content: "Invite-only signup flag + Supabase Auth disable", status: "completed" as const },
  { id: "n10", content: "SUPABASE_TEST_* secrets only (.env.test.example)", status: "completed" as const },
  { id: "n11", content: "CAPTCHA / rate limits if registration abuse", status: "pending" as const },
  { id: "n12", content: "Optional httpOnly cookie session via SSR/proxy", status: "pending" as const },
  { id: "n13", content: "Multi-tenant schema + org RLS (00016–00020)", status: "completed" as const },
  { id: "n14", content: "Set DEPLOY_URL GitHub secret for CI header verification", status: "pending" as const },
];

const completedPhaseTodos = [
  { id: "done-0", content: "Phase 0–3: core RPCs, RLS, CI, headers (00001–00009)", status: "completed" as const },
  { id: "done-4", content: "Phase 4: game integrity (00010–00015, 27+ tests)", status: "completed" as const },
  { id: "done-5", content: "Phase 5: ops tooling, org tenancy, schema inventory, RLS rebuild", status: "completed" as const },
];

export default function TurkuCityTourSecurityPlan() {
  const { tokens } = useHostTheme();

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>TurkuCityTour Security Plan</H1>
        <Text>
          Post-remediation audit — June 2026. All critical and high game-integrity findings are
          closed. RPCs, org-scoped RLS, platform admin rebuild (00020), and 36 live integration
          tests protect answers, progress, and catalog mutations. Remaining work is operational.
        </Text>
        <Text style={{ color: tokens.text.secondary, fontSize: 12 }}>
          Source: TurkuCityTour First-release — migrations 00000–00020 — June 2026
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="0" label="Critical open" tone="success" />
        <Stat value="0" label="High open" tone="success" />
        <Stat value="36" label="RLS tests" tone="success" />
        <Stat value="21" label="SQL migrations" tone="success" />
      </Grid>

      <Callout tone="success">
        No critical or high open findings. Schema inventory committed (00000_baseline.sql).
        Multi-tenant RLS live. Give-up, guess, and answer paths are server-authoritative.
      </Callout>

      <Callout tone="warning">
        Manual ops: restrict Thunderforest referrer, set DEPLOY_URL secret, verify CSP on prod,
        and disable public Auth signup if invite-only is required.
      </Callout>

      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader
            title="Findings by severity"
            trailing={
              <Text style={{ fontSize: 12, color: tokens.text.secondary }}>
                35 items tracked · 28 resolved
              </Text>
            }
          />
          <CardBody>
            <PieChart data={severityData} donut size={200} />
            <Text style={{ fontSize: 12, color: tokens.text.secondary, marginTop: 8 }}>
              Post-remediation snapshot · June 2026
            </Text>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Open findings by area" />
          <CardBody>
            <BarChart
              categories={categoryCategories}
              series={categorySeries}
              horizontal
              height={200}
            />
            <Text style={{ fontSize: 12, color: tokens.text.secondary, marginTop: 8 }}>
              Open items only · game integrity and CI/CD addressed
            </Text>
          </CardBody>
        </Card>
      </Grid>

      {highRows.length > 0 ? (
        <Stack gap={8}>
          <H2>High findings (open)</H2>
          <Table
            headers={["Finding", "Impact", "Location"]}
            rows={highRows}
            rowTone={highRows.map(() => "danger" as const)}
            striped
            stickyHeader
          />
        </Stack>
      ) : (
        <Callout tone="success">No high-severity open findings.</Callout>
      )}

      <CollapsibleSection title="Medium findings (4)" defaultOpen={false}>
        <Table
          headers={["Finding", "Impact", "Location"]}
          rows={mediumRows}
          rowTone={mediumRows.map(() => "warning" as const)}
          striped
        />
      </CollapsibleSection>

      <CollapsibleSection title="Low findings (3)" defaultOpen={false}>
        <Table
          headers={["Finding", "Impact", "Location"]}
          rows={lowRows}
          rowTone={lowRows.map(() => "info" as const)}
          striped
        />
      </CollapsibleSection>

      <Stack gap={8}>
        <H2>Posture — audit vs today</H2>
        <Table headers={postureRows[0]} rows={postureRows.slice(1)} striped stickyHeader />
      </Stack>

      <Stack gap={8}>
        <H2>Resolved controls (28)</H2>
        <Table headers={["Control", "Detail"]} rows={resolvedRows} striped />
      </Stack>

      <Stack gap={8}>
        <H2>CI security workflows</H2>
        <Table headers={["Workflow", "Trigger", "Scope"]} rows={workflowRows} striped />
      </Stack>

      <Divider />

      <H2>Next steps</H2>
      <Text style={{ color: tokens.text.secondary }}>
        Phases 0–5 code work is complete. Remaining items are operational: Thunderforest referrer,
        production CSP verification, and optional invite-only Auth configuration.
      </Text>

      <TodoListCard title="Completed phases" todos={completedPhaseTodos} defaultExpanded={false} />

      <CollapsibleSection title="Phase 4 — Game integrity" defaultOpen={false}>
        <TodoListCard todos={phase4Todos} defaultExpanded={false} />
      </CollapsibleSection>

      <CollapsibleSection title="Phase 5 — Ops & tenancy" defaultOpen>
        <TodoListCard todos={phase5Todos} defaultExpanded />
      </CollapsibleSection>

      <Callout tone="info">
        After each migration, run npm run test:integration and npm run schema:manifest. Apply SQL
        manually in Supabase SQL Editor.
      </Callout>
    </Stack>
  );
}
