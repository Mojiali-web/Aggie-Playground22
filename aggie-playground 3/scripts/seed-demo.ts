/**
 * Seed (or remove) fictional demo students and activities.
 *
 *   npm run seed:demo                  dry run: prints the plan, writes nothing
 *   npm run seed:demo -- --apply       create / refresh demo data (safe to repeat; no duplicates)
 *   npm run seed:demo -- --remove --apply   delete ONLY demo data
 *   npm run seed:demo -- --apply --now=2026-10-17T09:30:00-07:00   anchor times to a chosen "now"
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (your machine only).
 * Run migrations 0001 and 0002 first.
 */
import { readFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_EMAIL_DOMAIN, buildPlan, validatePlan, type Plan } from "./demo/data";

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      const v = m[2].replace(/^['"]|['"]$/g, "");
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  }
}

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => args.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=");

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function printPlan(plan: Plan) {
  console.log(`Plan (anchored to ${plan.now}):`);
  console.log(`  ${plan.profiles.length} demo students (auth accounts with unusable passwords, marked is_demo)`);
  for (const p of plan.profiles) console.log(`    - ${p.display_name} (${p.year}, ${p.major})  ${p.email}`);
  console.log(`  ${plan.activities.length} demo activities`);
  const now = Date.parse(plan.now);
  for (const a of plan.activities) {
    const mins = Math.round((Date.parse(a.starts_at) - now) / 60000);
    const when = mins <= 0 ? `LIVE (started ${-mins} min ago)` : `starts in ${mins} min`;
    console.log(`    - ${a.emoji} ${a.title} · ${a.category} · ${a.participants}/${a.max} · ${a.location_name} · ${when}`);
  }
}

async function findUserIdByEmail(db: SupabaseClient, email: string): Promise<string | null> {
  for (let page = 1; page < 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser(db: SupabaseClient, email: string, name: string): Promise<string> {
  const existing = await findUserIdByEmail(db, email);
  if (existing) return existing;
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: randomBytes(32).toString("hex"), // random and never stored: nobody can sign in as a demo student
    email_confirm: true, // no confirmation email is sent
    user_metadata: { demo: true, full_name: name },
  });
  if (error || !data.user) throw new Error(`createUser(${email}) failed: ${error?.message}`);
  return data.user.id;
}

async function apply(db: SupabaseClient, plan: Plan) {
  // Preflight: migration 0002 must be installed.
  const probe = await db.from("activities").select("demo_key").limit(1);
  if (probe.error) fail(`Migration 0002 doesn't look installed (${probe.error.message}). Run supabase/migrations/0002_demo_support.sql first.`);

  const ids = new Map<string, string>();
  for (const p of plan.profiles) {
    const id = await ensureUser(db, p.email, p.display_name);
    ids.set(p.key, id);
    // The sign-up trigger already created the profile row; fill it in.
    const { error } = await db
      .from("profiles")
      .upsert({
        id,
        display_name: p.display_name,
        avatar_emoji: p.emoji,
        avatar_color: p.color,
        bio: p.bio,
        favorite_categories: p.categories,
        preferred_activities: p.activities,
        discoverable: true,
        is_demo: true,
        demo_key: p.demo_key,
        major: p.major,
        class_year: p.year,
      }, { onConflict: "id" });
    if (error) throw new Error(`profile ${p.key}: ${error.message}`);
  }
  console.log(`✔ ${plan.profiles.length} demo students ready`);

  for (const a of plan.activities) {
    const row = {
      host_id: ids.get(a.host)!,
      title: a.title,
      emoji: a.emoji,
      category: a.category,
      subcategory: a.subcategory,
      location_key: a.location,
      location_name: a.location_name,
      lat: a.lat,
      lng: a.lng,
      starts_at: a.starts_at,
      duration_min: a.durationMin,
      max_participants: a.max,
      description: a.description,
      meeting_instructions: a.meeting,
      what_to_bring: a.bring ?? null,
      skill_level: a.skill ?? null,
      vibe: a.vibe ?? null,
      status: "active",
      is_demo: true,
      demo_key: a.demo_key,
    };
    const { data, error } = await db.from("activities").upsert(row, { onConflict: "demo_key" }).select("id").single();
    if (error || !data) throw new Error(`activity ${a.key}: ${error?.message}`);

    // Add missing demo participants. Existing rows (including real students who joined) are left alone.
    const people = [a.host, ...a.attendees].map((k) => ({ activity_id: data.id, user_id: ids.get(k)! }));
    const { error: perr } = await db.from("participants").upsert(people, { onConflict: "activity_id,user_id", ignoreDuplicates: true });
    if (perr) throw new Error(`participants for ${a.key}: ${perr.message}`);
  }
  console.log(`✔ ${plan.activities.length} demo activities ready (times re-based to now)`);
}

async function remove(db: SupabaseClient) {
  const acts = await db.from("activities").delete().not("demo_key", "is", null).select("id");
  if (acts.error) throw new Error(acts.error.message);
  console.log(`✔ removed ${acts.data?.length ?? 0} demo activities (and their participants)`);

  const profs = await db.from("profiles").select("id, demo_key").not("demo_key", "is", null);
  if (profs.error) throw new Error(profs.error.message);
  let removed = 0;
  for (const p of profs.data ?? []) {
    // Extra guard: only delete accounts that carry the demo email domain.
    const { data } = await db.auth.admin.getUserById(p.id);
    if (!data.user?.email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`)) {
      console.warn(`  skipped ${p.id}: not a demo email, leaving it alone`);
      continue;
    }
    const { error } = await db.auth.admin.deleteUser(p.id);
    if (error) throw new Error(`deleteUser ${p.id}: ${error.message}`);
    removed++;
  }
  console.log(`✔ removed ${removed} demo students`);
}

async function main() {
  loadEnvLocal();
  const nowArg = opt("now");
  const now = nowArg ? new Date(nowArg) : new Date();
  if (Number.isNaN(now.getTime())) fail(`--now must be an ISO date, e.g. 2026-10-17T09:30:00-07:00`);

  const plan = buildPlan(now);
  const problems = validatePlan(plan);
  if (problems.length) fail(`Demo data is inconsistent:\n  - ${problems.join("\n  - ")}`);

  const doApply = flag("apply");
  if (!flag("remove")) printPlan(plan);
  else console.log("Will remove ALL demo activities and demo students (rows with a demo_key).");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!doApply) {
    console.log(`\nDRY RUN: nothing was written. Re-run with --apply to ${flag("remove") ? "remove" : "write"} this to ${url ? new URL(url).host : "your Supabase project"}.`);
    return;
  }
  if (!url || !key) fail("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");

  console.log(`\nTarget project: ${new URL(url).host}`);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  if (flag("remove")) await remove(db);
  else await apply(db, plan);
  console.log("\nDone.");
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
