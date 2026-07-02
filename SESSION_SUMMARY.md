# CodeTrack — Session Summary

## Project Overview
CodeTrack is a Competitive Programming Analytics Platform. Users connect LeetCode and Codeforces accounts to view unified progress in one dashboard.

**Stack:** FastAPI + PostgreSQL + SQLAlchemy + Alembic (backend) | React + TypeScript + Vite + TailwindCSS + React Query (frontend) | Docker Compose (deployment)

---

## Completed Modules

### Module 1 — Project Scaffold
Full monorepo structure: Docker Compose, Dockerfiles (multi-stage), Tailwind design tokens, Vite + TypeScript strict config, ESLint flat config, PostCSS.

### Module 2 — Backend Foundation
User model + TimestampMixin + UserRole enum, RefreshToken model, SQLAlchemy session/engine, Alembic with 2 verified migrations, FastAPI lifespan with DB startup check.

### Module 3 — Authentication (Backend + Frontend)
JWT access+refresh with type-claim separation, bcrypt (direct, not passlib), refresh-token rotation + real logout via DB revocation, global exception handlers, standard APIResponse envelope. Frontend: axios client with in-memory token store + 401→single-flight-refresh→retry, AuthProvider/useAuth, ProtectedRoute, LoginPage, RegisterPage.

### Module 4 — LeetCode Integration (Backend + Frontend)
Real GraphQL client (leetcode.com/graphql, unauthenticated), LeetCodeProfile/Submission models, repository/service (connect/sync/profile/submissions, dedup by leetcode_submission_id). Frontend: api/leetcode.ts (envelope-adapted), ProfileCard, SyncButton, StatisticsSection, RecentSubmissions, LeetCodeConnectPage, LeetCodeDashboardPage, all using DashboardLayout.

Known limitation: LeetCode's public API only returns accepted submissions; runtime/memory stored as null; live network calls untestable from sandbox.

### Module 5 — Dashboard
DashboardService (now aggregates LeetCode + Codeforces), endpoints: /dashboard/summary, /heatmap, /platforms. Frontend: DashboardLayout (THE one nav shell — AppLayout retired), OverviewCards, ActivityHeatmap (GitHub-style calendar), PlatformCards, GoalProgress (empty state), RecentActivity (empty state), DashboardPage.

### Module 6 — Codeforces Integration (Backend + Frontend) ← THIS SESSION
**Backend:**
- CodeforcesProfile, CodeforcesSubmission, CodeforcesContestResult models
- Real REST client (codeforces.com/api, rate-limited 2s between calls)
- BasePlatformRepository (shared base: get_profile_by_user_id, delete_profile, bulk_create_submissions)
- CodeforcesRepository (extends base + get_contest_history, get_existing_contest_ids, bulk_create_contest_results)
- platform_parsing.py (shared as_int/as_str/as_optional_* helpers)
- CodeforcesService (connect/sync/profile/submissions/contests; total_solved = distinct OK-verdict problems)
- Endpoints: /codeforces/connect, /sync, /profile, /submissions, /contests
- DashboardService updated: injects both repos, aggregates totals + cross-platform streaks + merged heatmap

**Frontend:**
- src/types/codeforces.ts (CF_RANK_COLORS for official rank colours)
- src/api/codeforces.ts (connect, sync, profile, submissions, contests)
- CodeforcesConnectPage.tsx, CfProfileCard.tsx, CfContestHistory.tsx
- CfSubmissions.tsx (all verdicts shown — not just accepted), CfSyncButton.tsx
- CodeforcesDashboardPage.tsx

Known limitation: Live CF API calls untestable from sandbox; verified via 7 mocked unit tests + TestClient E2E tests.

---

## Architecture Decisions
1. Standard APIResponse envelope: {success, message, data} on every endpoint
2. In-memory token storage (no localStorage/sessionStorage — XSS-safe, loses on hard refresh)
3. Real logout via refresh_tokens table revocation
4. Domain exceptions (AuthError, LeetCodeError, CodeforcesError) → global HTTP handlers
5. DashboardLayout is the ONE nav shell. AppLayout was retired.
6. BasePlatformRepository for structural shared CRUD. LeetCode NOT refactored (working code).
7. DashboardService takes both repos; cross-platform streak/heatmap aggregation
8. Codeforces stores ALL verdicts (WA, TLE, etc.) — richer than LeetCode's accepted-only API

---

## Database Tables (8 total)
users, refresh_tokens, leetcode_profiles, leetcode_submissions, codeforces_profiles, codeforces_submissions, codeforces_contest_results, alembic_version

---

## Tests (this session)
- pytest: 13/13 pass (6 LeetCode client + 7 Codeforces client)
- Backend: ruff ✅ (57 files), mypy ✅ (56 files), format ✅
- Frontend: tsc ✅ (0 errors), eslint ✅ (0 errors, 1 pre-existing warning), prod build ✅

---

## Remaining Work
- Module 7: Analytics charts (Recharts: rating progression, difficulty breakdown, verdict breakdown, weekly activity)
- Module 8: Goal tracking (goals table, CRUD, progress UI)
- Module 9: Contest calendar (upcoming contests from Codeforces API)
- Module 10: Profile & Settings pages (/profile and /settings currently 404→redirect)
- Module 11: Celery background sync (celery_worker/celery_beat scaffolded in docker-compose, non-functional)
- Platform disconnect endpoints (DELETE /leetcode/profile, DELETE /codeforces/profile) — not built yet
- GoalProgress and RecentActivity on dashboard are honest empty-state placeholders

## Known Issues
1. Live API calls to leetcode.com and codeforces.com blocked in sandbox — logic tested via mocks only
2. Hard page refresh logs user out (in-memory tokens by design)
3. Heatmap bounded by sync window, not full submission history
4. /profile and /settings catch-all to /dashboard — pages not built yet
5. getLeetCodeStatistics() in api/leetcode.ts will 404 — no backing endpoint (documented in JSDoc)
6. ESLint Fast Refresh warning on authStore.tsx is intentional (context file exports hook + provider)

---

## Commands
```bash
cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env
# Set SECRET_KEY: openssl rand -hex 32
docker compose up db redis backend frontend
docker compose exec backend alembic upgrade head
# Tests:
docker compose exec backend python -m pytest tests/ -v
cd frontend && npm run type-check && npm run lint && npm run build
```

---

## Next Session Prompt

Continue the CodeTrack project. Read SESSION_SUMMARY.md first — it is the source of truth.

Completed: Modules 1-6 (Scaffold, Backend Foundation, Auth, LeetCode, Dashboard, Codeforces Integration).

The next module is Module 7 — Analytics.

Build a dedicated /analytics page with:
- Codeforces rating progression chart (Recharts LineChart from /codeforces/contests data)
- LeetCode difficulty breakdown (Recharts PieChart from /leetcode/profile statistics)
- Codeforces verdict breakdown (Recharts PieChart from /codeforces/submissions data — group by verdict client-side)
- Weekly activity bar chart (group /dashboard/heatmap days by week, split by platform if possible)
- No new backend endpoints needed — consume existing endpoints only
- Add /analytics to Sidebar nav and App.tsx routes

Also build:
- Platform disconnect: DELETE /leetcode/profile and DELETE /codeforces/profile backend endpoints
- Disconnect buttons on LeetCodeDashboardPage and CodeforcesDashboardPage
- Wire disconnect into the PlatformCards component on the dashboard (show disconnect if connected)

Architecture rules:
- Do NOT modify completed modules unless fixing a real bug
- Do NOT change existing API contracts
- Reuse DashboardLayout, Button, Input, Skeleton components
- Use Recharts (already in package.json at v3.x)

Run all tests before stopping. Generate updated SESSION_SUMMARY.md when done.
