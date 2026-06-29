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
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Swatch,
  Table,
  Text,
  TodoListCard,
  UsageBar,
  useHostTheme,
} from "cursor/canvas";

const gapCategories = [
  "Payments",
  "Licensing",
  "Game hosting",
  "Invites",
  "Tenancy",
  "Results",
];
const gapSeries = [
  {
    name: "Gap severity (0=done, 10=critical)",
    data: [10, 10, 9, 10, 3, 7],
    tone: "danger" as const,
  },
];

const lockedDecisions = [
  ["Business model", "Monthly subscription via Stripe. Free trial: host can create games and play solo only (max 1 player = themselves)."],
  ["Platform", "Single multi-tenant SaaS — one app, one Supabase project, org-isolated data."],
  ["Game creation", "Full custom tours — locations, hints, questions, answers (reuse existing admin editor)."],
  ["Invitations", "Share link + invite code (e.g. /join/ABC123). QR encodes same URL."],
  ["Player accounts", "Required — register/login before play. Progress in user_progress survives crash, battery loss, device switch."],
  ["Super-admin", "Yes — platform operator console for support, billing overrides, cross-org visibility."],
  ["Geography", "Global — hosts place GPS locations anywhere."],
  ["Distribution", "Web PWA + iOS/Android (existing Capacitor builds). Deep links for /join/:code on mobile."],
];

const roleModelRows = [
  ["platform_admin", "users.is_platform_admin (replaces global is_admin)", "All orgs, all games, support, billing overrides"],
  ["org_owner", "organization_members.role = owner", "Own org's games, invites, billing portal, per-game results"],
  ["org_member", "organization_members.role = member (future)", "Co-host access if needed later"],
  ["player", "Any authenticated user in game_players", "Play assigned games; progress tied to user_id"],
];

const trialVsPaidRows = [
  ["Field", "Free trial", "Paid subscription"],
  ["max_players per game", "1 (host only — solo test)", "Per tier (e.g. 10 / 50 / unlimited)"],
  ["max_games", "1–3 (TBD tier config)", "Per tier"],
  ["Game authoring", "Full custom tour", "Full custom tour"],
  ["Invite codes", "Disabled or host-only preview", "Enabled — share link to players"],
  ["Stripe status", "trialing", "active"],
  ["Duration", "14 days (TBD)", "Renews monthly"],
];

const reuseRows = [
  ["Game content model", "games → locations → hints → questions → answers"],
  ["Access control", "game_players + RPC assignment checks — unchanged for gameplay"],
  ["Progress persistence", "user_progress per user_id — why registration is required"],
  ["Server-authoritative play", "submit_answer, validate_location_arrival, record_location_guess, record_give_up"],
  ["Admin authoring UI", "AdminView / GameAdminTab — scope by owner_org_id, not rewrite"],
  ["Auth foundation", "Supabase email/password, Register.jsx, session guards"],
  ["Mobile shell", "Capacitor + VITE_MOBILE_BUILD + HashRouter — add deep-link handler for /join"],
];

const phase0Todos = [
  { id: "p0-1", content: "Product decisions locked (subscription, trial, invites, roles, mobile)", status: "completed" as const },
  { id: "p0-2", content: "Define Stripe products: trial (14d), monthly tiers with max_players + max_games", status: "pending" as const },
  { id: "p0-3", content: "Export 00000_baseline.sql schema inventory (npm run schema:manifest)", status: "completed" as const },
  { id: "p0-4", content: "Rename is_admin → is_platform_admin in schema + app (00016, 00020)", status: "completed" as const },
];

const phase1Todos = [
  { id: "p1-1", content: "Migration: organizations (id, name, stripe_customer_id, created_at)", status: "completed" as const },
  { id: "p1-2", content: "Migration: subscriptions (org_id, stripe_sub_id, status, tier, trial_ends_at, max_games, max_players)", status: "completed" as const },
  { id: "p1-3", content: "Migration: organization_members (org_id, user_id, role: owner|member)", status: "completed" as const },
  { id: "p1-4", content: "Migration: games.owner_org_id FK — backfill existing games to platform org", status: "completed" as const },
  { id: "p1-5", content: "Helpers: is_platform_admin(), is_org_owner(org_id), subscription limit RPCs", status: "completed" as const },
  { id: "p1-6", content: "RLS: catalog writes for org owner OR platform_admin; reads scoped by game_players or org", status: "completed" as const },
  { id: "p1-7", content: "RPC enforce_subscription_limits — can_org_create_game, can_org_add_player_to_game", status: "completed" as const },
  { id: "p1-8", content: "Integration tests: org isolation, trial solo-only cap, platform_admin bypass", status: "completed" as const },
];

const phase2Todos = [
  { id: "p2-1", content: "Stripe: trial subscription product (max_players=1) + paid monthly tiers", status: "pending" as const },
  { id: "p2-2", content: "Edge Function: create-checkout-session (trial or paid, no card for trial TBD)", status: "pending" as const },
  { id: "p2-3", content: "Webhook: customer.subscription.created/updated/deleted → sync subscriptions table", status: "pending" as const },
  { id: "p2-4", content: "Webhook: on first subscription → create org + organization_members(owner) + trial limits", status: "pending" as const },
  { id: "p2-5", content: "Pricing page + Start free trial CTA → Stripe Checkout → /host onboarding", status: "pending" as const },
  { id: "p2-6", content: "Trial UX: host can author + play own game solo; invite UI disabled until paid", status: "pending" as const },
  { id: "p2-7", content: "Stripe Customer Portal link in host settings for upgrade/cancel", status: "pending" as const },
];

const phase3Todos = [
  { id: "p3-1", content: "Route /host — org-scoped game list; guard: active subscription or trialing", status: "pending" as const },
  { id: "p3-2", content: "Refactor AdminView → HostView: filter by owner_org_id; reuse GameAdminTab", status: "pending" as const },
  { id: "p3-3", content: "Route /platform — super-admin: all orgs, games, subscription status, manual overrides", status: "pending" as const },
  { id: "p3-4", content: "Per-game Results for host (filter leaderboard views by game_id)", status: "pending" as const },
  { id: "p3-5", content: "Remove host access to global UserManager — players join via invite only", status: "pending" as const },
];

const phase4Todos = [
  { id: "p4-1", content: "Migration: game_invites (game_id, code UNIQUE, max_uses, expires_at, revoked_at)", status: "pending" as const },
  { id: "p4-2", content: "RPC join_game_by_invite(code): validate invite + subscription max_players + insert game_players", status: "pending" as const },
  { id: "p4-3", content: "Page /join/:code — show game name; Register or Login; then auto-join RPC", status: "pending" as const },
  { id: "p4-4", content: "Host UI: copy link turkucitytour.app/join/CODE + QR; set max uses / expiry", status: "pending" as const },
  { id: "p4-5", content: "Persist invite code in sessionStorage through auth redirect so join completes after register", status: "pending" as const },
  { id: "p4-6", content: "Capacitor App Links / Universal Links for /join/:code on iOS and Android", status: "pending" as const },
  { id: "p4-7", content: "Sorry.jsx: no games → prompt to enter invite code or use join link", status: "pending" as const },
];

const phase5Todos = [
  { id: "p5-1", content: "E2E: trial signup → create tour → upgrade → invite → player registers → resumes after re-login", status: "pending" as const },
  { id: "p5-2", content: "Legal: ToS, subscription terms, refund policy, PrivacyPolicy.jsx commerce updates", status: "pending" as const },
  { id: "p5-3", content: "Mobile store listings: deep links, subscription disclosure (host buys on web)", status: "pending" as const },
  { id: "p5-4", content: "Monitoring: Stripe webhook failures, trial→paid conversion, subscription churn alerts", status: "pending" as const },
];

const userJourneyRows = [
  ["Step", "Actor", "Flow"],
  ["1", "Prospect", "Landing → Start free trial → Stripe (14d, no card or card-on-file TBD) → org created"],
  ["2", "Host (trial)", "Host dashboard → create custom tour → play solo to test (max 1 player)"],
  ["3", "Host (paid)", "Upgrade via Stripe → invite link enabled → share /join/CODE or QR"],
  ["4", "Player", "Open link → Register (or Login) → auto-join game → MapView"],
  ["5", "Player", "Battery dies / app crashes → Login again → same user_progress restored"],
  ["6", "Host", "Per-game leaderboard + player list for their org only"],
  ["7", "Super-admin", "/platform → any org, override subscription, support tickets"],
];

const joinFlowRows = [
  ["State", "Behaviour"],
  ["Anonymous + /join/CODE", "Show game title; Register or Login buttons; store CODE in sessionStorage"],
  ["Register success", "create_user_profile → join_game_by_invite(CODE) → redirect /map"],
  ["Login success", "join_game_by_invite(CODE) → redirect /map (idempotent if already joined)"],
  ["Trial host opens own invite", "Blocked or solo-only — invite RPC checks subscription.max_players > 1"],
  ["Invalid/expired code", "Error page with link to enter code manually"],
];

function DecisionRow({ topic, decision }: { topic: string; decision: string }) {
  const { tokens } = useHostTheme();
  return (
    <Row gap={8} align="start">
      <Pill tone="success" size="small">
        {topic}
      </Pill>
      <Text style={{ flex: 1, fontSize: 13 }}>{decision}</Text>
    </Row>
  );
}

export default function TurkuCityTourProductPlan() {
  const { tokens } = useHostTheme();

  const readinessSegments = [
    { label: "Gameplay engine", value: 85, tone: "success" as const },
    { label: "Admin authoring", value: 70, tone: "success" as const },
    { label: "Auth & security", value: 75, tone: "success" as const },
    { label: "Multi-tenant SaaS", value: 55, tone: "warning" as const },
    { label: "Commerce", value: 0, tone: "danger" as const },
    { label: "Self-serve invites", value: 0, tone: "danger" as const },
  ];

  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <H1>TurkuCityTour Product Plan</H1>
        <Text>
          Self-serve SaaS: monthly subscription with free solo trial, full custom GPS tours,
          share-link invites with registered players, platform super-admin, web + mobile.
        </Text>
        <Text style={{ color: tokens.text.secondary, fontSize: 12 }}>
          Decisions locked — June 2026 · migrations 00000–00020 in repo · Phase 1 tenancy shipped
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="Monthly" label="Subscription" tone="info" />
        <Stat value="1" label="Trial max players" tone="warning" />
        <Stat value="3" label="Role types" tone="success" />
        <Stat value="~70%" label="Engine ready" tone="success" />
      </Grid>

      <Callout tone="success">
        Decisions confirmed: Stripe monthly sub, 1-player trial, single SaaS, full custom tours,
        /join/CODE with required registration (progress resume), super-admin console, global GPS,
        web + Capacitor mobile with deep links.
      </Callout>

      <Stack gap={8}>
        <H2>Locked product decisions</H2>
        <Card variant="outlined">
          <CardBody>
            <Stack gap={12}>
              {lockedDecisions.map(([topic, decision]) => (
                <DecisionRow key={topic} topic={topic} decision={decision} />
              ))}
            </Stack>
          </CardBody>
        </Card>
      </Stack>

      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader title="Product readiness by area" />
          <CardBody>
            <UsageBar segments={readinessSegments} showLabels />
            <Text style={{ fontSize: 12, color: tokens.text.secondary, marginTop: 8 }}>
              Pre-implementation estimate · June 2026
            </Text>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Remaining gap by area" />
          <CardBody>
            <BarChart categories={gapCategories} series={gapSeries} horizontal height={200} />
            <Text style={{ fontSize: 12, color: tokens.text.secondary, marginTop: 8 }}>
              10 = not started · unchanged until Phase 1 ships
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <Stack gap={8}>
        <H2>Role model</H2>
        <Table headers={["Role", "Storage", "Capabilities"]} rows={roleModelRows} striped stickyHeader />
      </Stack>

      <Stack gap={8}>
        <H2>Trial vs paid subscription</H2>
        <Table headers={trialVsPaidRows[0]} rows={trialVsPaidRows.slice(1)} striped />
        <Text style={{ color: tokens.text.secondary, fontSize: 12 }}>
          Trial lets hosts validate tour authoring and solo gameplay before paying to invite real players.
        </Text>
      </Stack>

      <Stack gap={8}>
        <H2>Reusable from current codebase</H2>
        <Table headers={["Asset", "Notes"]} rows={reuseRows} striped />
      </Stack>

      <Stack gap={8}>
        <H2>Target user journey</H2>
        <Table headers={userJourneyRows[0]} rows={userJourneyRows.slice(1)} striped />
      </Stack>

      <Stack gap={8}>
        <H2>Join flow (/join/:code)</H2>
        <Table headers={joinFlowRows[0]} rows={joinFlowRows.slice(1)} striped />
      </Stack>

      <Divider />

      <Stack gap={8}>
        <H2>Implementation phases</H2>
        <Text style={{ color: tokens.text.secondary }}>
          Order: tenancy + RLS first, then Stripe trial/paid, host + super-admin UIs, invites, launch.
          Gameplay RPCs unchanged — they already check game_players membership.
        </Text>
      </Stack>

      <CollapsibleSection
        title="Phase 0 — Prerequisites"
        leading={<Swatch color="gray" />}
        count={4}
        defaultOpen={false}
      >
        <TodoListCard todos={phase0Todos} defaultExpanded />
      </CollapsibleSection>

      <CollapsibleSection
        title="Phase 1 — Multi-tenant schema & RLS"
        leading={<Swatch color="red" />}
        count={8}
        trailing={<Text style={{ fontSize: 12 }}>~2–3 weeks</Text>}
        defaultOpen
      >
        <Stack gap={8}>
          <Callout tone="warning">
            Database: run every migration manually in Supabase (SQL Editor or your runner).
            Repo updates alone do not change production.
          </Callout>
          <H3>Schema sketch</H3>
          <Text style={{ fontFamily: "monospace", fontSize: 12, color: tokens.text.secondary }}>
            organizations ← subscriptions (stripe_sub_id, status, max_players, max_games){"\n"}
            organization_members (owner) → users{"\n"}
            games.owner_org_id · game_invites (Phase 4){"\n"}
            is_platform_admin() · is_org_owner(org_id)
          </Text>
          <TodoListCard todos={phase1Todos} defaultExpanded />
        </Stack>
      </CollapsibleSection>

      <CollapsibleSection
        title="Phase 2 — Stripe subscription & trial"
        leading={<Swatch color="orange" />}
        count={7}
        trailing={<Text style={{ fontSize: 12 }}>~1–2 weeks</Text>}
      >
        <TodoListCard todos={phase2Todos} defaultExpanded={false} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Phase 3 — Host dashboard + super-admin"
        leading={<Swatch color="yellow" />}
        count={5}
        trailing={<Text style={{ fontSize: 12 }}>~1–2 weeks</Text>}
      >
        <TodoListCard todos={phase3Todos} defaultExpanded={false} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Phase 4 — Invite links & player join"
        leading={<Swatch color="green" />}
        count={7}
        trailing={<Text style={{ fontSize: 12 }}>~1 week</Text>}
      >
        <TodoListCard todos={phase4Todos} defaultExpanded={false} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Phase 5 — Launch readiness"
        leading={<Swatch color="blue" />}
        count={4}
        trailing={<Text style={{ fontSize: 12 }}>~1 week</Text>}
      >
        <TodoListCard todos={phase5Todos} defaultExpanded={false} />
      </CollapsibleSection>

      <Callout tone="info">
        Player progress resume is already solved by user_progress keyed on user_id — registration
        is the right choice. No guest/anonymous mode needed.
      </Callout>

      <Callout tone="warning">
        One open product detail: trial signup — card required upfront (auto-convert) vs no card
        (manual upgrade)? Affects Stripe Checkout config in Phase 2.
      </Callout>
    </Stack>
  );
}
