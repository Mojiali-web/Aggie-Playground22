// Fictional demo data for the hackathon. Every person, bio and activity below is invented.
// Names are common and generic; any resemblance to real students is coincidental.

import { CATEGORIES } from "../../src/lib/categories";
import { LOCATION_BY_KEY } from "../../src/lib/locations";

export const DEMO_EMAIL_DOMAIN = "demo.aggieplayground.invalid"; // .invalid can never receive mail

export interface DemoProfile {
  key: string; // stable id: demo_key = "profile:<key>"
  first: string;
  last: string;
  year: "Freshman" | "Sophomore" | "Junior" | "Senior";
  major: string;
  emoji: string;
  color: string;
  bio: string;
  categories: string[];
  activities: string[]; // subcategories, must belong to `categories`
}

export const PROFILES: DemoProfile[] = [
  { key: "emily", first: "Emily", last: "Wong", year: "Sophomore", major: "Psychology", emoji: "🧋", color: "#ff8fa3", bio: "Always down for boba and spontaneous adventures 🧋", categories: ["Social & Hangouts", "Self-Care & Wellness"], activities: ["Coffee / Boba Runs", "Nature Breaks / Sunset Watching"] },
  { key: "alex", first: "Alex", last: "Chen", year: "Junior", major: "Computer Science", emoji: "🥏", color: "#7cc4ff", bio: "Frisbee addict. Will play literally anytime 🥏", categories: ["Competitive Sports", "Career & Networking"], activities: ["Ultimate Frisbee", "Hackathon Teammates"] },
  { key: "priya", first: "Priya", last: "Patel", year: "Senior", major: "Managerial Economics", emoji: "📈", color: "#b9a4ff", bio: "ECN 101 survivor. Ask me about index funds (or where to get the best chai) ☕", categories: ["Academic & Study", "Career & Networking"], activities: ["Exam Preparation", "Mock Interviews"] },
  { key: "marcus", first: "Marcus", last: "Johnson", year: "Sophomore", major: "Biological Sciences", emoji: "🏐", color: "#ffb454", bio: "Volleyball > everything. Bring snacks 🏐", categories: ["Competitive Sports", "Recreational Sports"], activities: ["Volleyball", "Casual Sports / Just-for-Fun Games"] },
  { key: "sofia", first: "Sofia", last: "Ramirez", year: "Junior", major: "Design", emoji: "🎨", color: "#ff7a59", bio: "Sketchbook in my bag at all times ✏️", categories: ["Self-Care & Wellness", "Social & Hangouts"], activities: ["Arts & Crafts", "Casual Hangouts"] },
  { key: "jason", first: "Jason", last: "Kim", year: "Senior", major: "Statistics", emoji: "🧗", color: "#7ed68a", bio: "Learning to climb. Scared of heights, doing it anyway.", categories: ["Fitness & Workouts", "Recreational Sports"], activities: ["Fitness Challenges", "Hiking / Nature Walks"] },
  { key: "aaliyah", first: "Aaliyah", last: "Brooks", year: "Freshman", major: "Undeclared", emoji: "🎵", color: "#ffe066", bio: "New here, say hi! I play ukulele (badly) 🎶", categories: ["Social & Hangouts", "Self-Care & Wellness"], activities: ["Campus Events", "Relaxation / De-stress Sessions"] },
  { key: "daniel", first: "Daniel", last: "Nguyen", year: "Junior", major: "Mechanical Engineering", emoji: "🚴", color: "#7cc4ff", bio: "Engineer by day, cyclist by sunrise. Calc tutor on the side.", categories: ["Fitness & Workouts", "Academic & Study"], activities: ["Running / Jogging", "Group Study Sessions"] },
  { key: "hannah", first: "Hannah", last: "Cohen", year: "Sophomore", major: "Communication", emoji: "🎬", color: "#ff8fa3", bio: "Movie nights are a love language 🍿", categories: ["Social & Hangouts", "Career & Networking"], activities: ["Movie / Game Nights", "Resume & LinkedIn Reviews"] },
  { key: "omar", first: "Omar", last: "Hassan", year: "Junior", major: "Economics", emoji: "💼", color: "#b9a4ff", bio: "Future founder (allegedly). Coffee chats always welcome.", categories: ["Career & Networking", "Social & Hangouts"], activities: ["Startup Brainstorming", "Networking / Coffee Chats"] },
  { key: "mei", first: "Mei", last: "Tanaka", year: "Senior", major: "Linguistics", emoji: "🌎", color: "#7ed68a", bio: "Language swaps and snacks from every country 🌎", categories: ["Academic & Study", "Social & Hangouts"], activities: ["Language Exchange", "Casual Hangouts"] },
  { key: "tyler", first: "Tyler", last: "Reed", year: "Freshman", major: "Computer Science", emoji: "💻", color: "#ffb454", bio: "Hackathon rookie looking for teammates. I bring the energy drinks.", categories: ["Career & Networking", "Academic & Study"], activities: ["Hackathon Teammates", "Study Buddies"] },
  { key: "isabella", first: "Isabella", last: "Garcia", year: "Sophomore", major: "Nutrition Science", emoji: "🏃", color: "#ff7a59", bio: "Slow runs, fast snacks. Sunset walks count as cardio.", categories: ["Fitness & Workouts", "Self-Care & Wellness"], activities: ["Running / Jogging", "Nature Breaks / Sunset Watching"] },
  { key: "noah", first: "Noah", last: "Williams", year: "Junior", major: "History", emoji: "📚", color: "#ffe066", bio: "Library gremlin. Will study with you (silently).", categories: ["Academic & Study", "Social & Hangouts"], activities: ["Library Meetups", "Dining Buddies"] },
];

export interface DemoActivity {
  key: string; // stable id: demo_key = "activity:<key>"
  emoji: string;
  title: string; // shown without emoji; emoji is its own column
  category: string;
  subcategory: string;
  location: string; // key in src/lib/locations.ts
  host: string; // profile key
  attendees: string[]; // other profile keys (host is added automatically)
  participants: number; // target total including the host — validated
  max: number;
  when: "live" | "soon";
  /** live: minutes AGO it started; soon: minutes from now until it starts */
  offsetMin: number;
  durationMin: number;
  skill?: "Competitive" | "Casual" | "Beginners Welcome" | "All Levels";
  vibe?: string;
  description: string;
  meeting: string;
  bring?: string;
}

export const ACTIVITIES: DemoActivity[] = [
  // ── Social & Hangouts ──
  { key: "boba-run", emoji: "🧋", title: "Spontaneous Boba Run", category: "Social & Hangouts", subcategory: "Coffee / Boba Runs", location: "downtown", host: "emily", attendees: ["hannah", "aaliyah", "sofia"], participants: 4, max: 8, when: "live", offsetMin: 20, durationMin: 240, vibe: "Chill", description: "Craving boba and not wanting to go alone. We're walking downtown, no plan beyond drinks and good company.", meeting: "Meet at Central Park by the fountain, then we walk to the nearest boba shop together.", bring: "Wallet or Venmo" },
  { key: "in-n-out", emoji: "🍜", title: "Anyone Down for Late-Night In-N-Out?", category: "Social & Hangouts", subcategory: "Dining Buddies", location: "innout", host: "aaliyah", attendees: ["tyler", "marcus"], participants: 3, max: 6, when: "soon", offsetMin: 170, durationMin: 90, vibe: "Silly", description: "Study break burger run. Animal style encouraged, judgment-free zone.", meeting: "Meet in the In-N-Out parking lot. Carpool from the ARC lot is possible, ask in the chat.", bring: "Appetite" },
  { key: "board-games", emoji: "🎲", title: "Board Games & Chill at the MU", category: "Social & Hangouts", subcategory: "Movie / Game Nights", location: "mu", host: "hannah", attendees: ["noah", "aaliyah", "mei", "tyler"], participants: 5, max: 8, when: "live", offsetMin: 35, durationMin: 240, vibe: "Wholesome", description: "Casual board games, no experience needed. We'll teach you anything from Catan to Codenames.", meeting: "Look for the table with the stack of board games near the MU seating area.", bring: "Your favorite game if you have one" },
  { key: "movie-night", emoji: "🎬", title: "Movie Night & New Friends", category: "Social & Hangouts", subcategory: "Movie / Game Nights", location: "scc", host: "hannah", attendees: ["aaliyah", "emily", "marcus", "daniel", "noah"], participants: 6, max: 10, when: "soon", offsetMin: 120, durationMin: 150, vibe: "Chill", description: "Group votes on the movie, snacks provided by whoever shows up with snacks. Great way to meet people.", meeting: "Meet in the lobby of the Student Community Center; we'll pick a room together.", bring: "Snacks to share" },
  { key: "intl-hangout", emoji: "🌎", title: "International Students Hangout", category: "Social & Hangouts", subcategory: "Casual Hangouts", location: "mu", host: "mei", attendees: ["aaliyah", "priya", "omar", "isabella"], participants: 5, max: 12, when: "soon", offsetMin: 90, durationMin: 120, vibe: "Wholesome", description: "Everyone is welcome, whether you're an international student or just curious. Swap stories, food recs, and language tips.", meeting: "Meet on the MU patio; I'll have a green water bottle on the table.", bring: "A snack from home if you like" },

  // ── Self-Care & Wellness ──
  { key: "sunset-walk", emoji: "🌅", title: "Sunset Walk at the Arboretum", category: "Self-Care & Wellness", subcategory: "Nature Breaks / Sunset Watching", location: "arboretum", host: "isabella", attendees: ["mei", "emily", "jason", "noah", "sofia"], participants: 6, max: 10, when: "soon", offsetMin: 45, durationMin: 90, vibe: "Chill", description: "Slow walk along the water, phones in pockets. Come decompress.", meeting: "Meet at the Arboretum Teaching Nursery entrance; we'll head toward the waterway.", bring: "Water bottle, a light jacket" },
  { key: "art-sketch", emoji: "🎨", title: "Casual Art & Sketching Meetup", category: "Self-Care & Wellness", subcategory: "Arts & Crafts", location: "downtown", host: "sofia", attendees: ["emily", "mei"], participants: 3, max: 6, when: "live", offsetMin: 25, durationMin: 210, skill: undefined, vibe: "Chill", description: "Bring a sketchbook and draw whatever's around: people, trees, coffee cups. All skill levels, no pressure.", meeting: "We'll be on the grass near the Central Park benches.", bring: "Sketchbook or paper, pencils" },
  { key: "music-jam", emoji: "🎵", title: "Music Jam Session", category: "Self-Care & Wellness", subcategory: "Relaxation / De-stress Sessions", location: "quad", host: "aaliyah", attendees: ["alex", "sofia", "jason"], participants: 4, max: 8, when: "live", offsetMin: 40, durationMin: 240, vibe: "Wholesome", description: "Acoustic jam on the grass: guitar, ukulele, vocals, or just vibes. Beginners absolutely welcome.", meeting: "Under the big tree on the west side of the Quad.", bring: "An instrument if you have one" },

  // ── Academic & Study ──
  { key: "ecn101", emoji: "📚", title: "ECN 101 Study & Suffer Together", category: "Academic & Study", subcategory: "Exam Preparation", location: "shields", host: "emily", attendees: ["priya", "omar", "noah", "tyler"], participants: 5, max: 8, when: "live", offsetMin: 30, durationMin: 300, vibe: "Focused", description: "Working through problem sets and practice questions together. Misery loves company.", meeting: "Group study area on the main floor of Shields. Text the group chat if you can't find us.", bring: "Notes, laptop, charger" },
  { key: "quiet-study", emoji: "💻", title: "Quiet Study Session at the Student Community Center", category: "Academic & Study", subcategory: "Study Buddies", location: "scc", host: "noah", attendees: ["priya", "mei", "sofia"], participants: 4, max: 10, when: "live", offsetMin: 50, durationMin: 330, vibe: "Focused", description: "Silent co-working. We say hi, then lock in. Breaks on the hour.", meeting: "Quiet seating area upstairs. Headphones on means do not disturb.", bring: "Headphones, laptop" },
  { key: "coffee-hw", emoji: "☕", title: "Coffee & Homework at Mishka's", category: "Academic & Study", subcategory: "Homework Help", location: "mishkas", host: "mei", attendees: ["hannah", "tyler"], participants: 3, max: 5, when: "live", offsetMin: 15, durationMin: 240, vibe: "Chill", description: "Do homework with a good latte nearby. Ask questions out loud, no judgment.", meeting: "Grab a table in the back; I'll be in a green sweater.", bring: "Laptop, headphones" },
  { key: "calc-group", emoji: "🧮", title: "Calculus Midterm Study Group", category: "Academic & Study", subcategory: "Group Study Sessions", location: "shields", host: "daniel", attendees: ["tyler", "alex", "marcus", "emily", "jason"], participants: 6, max: 6, when: "soon", offsetMin: 30, durationMin: 150, vibe: "Focused", description: "Practice problems, trading tricks, and quizzing each other. This one's full, so watch for the next one!", meeting: "Group study room on the second floor of Shields.", bring: "Practice exams, calculator" },

  // ── Career & Networking ──
  { key: "startup-brainstorm", emoji: "💼", title: "Startup Brainstorm & Coffee", category: "Career & Networking", subcategory: "Startup Brainstorming", location: "mu", host: "omar", attendees: ["alex", "priya", "tyler"], participants: 4, max: 8, when: "soon", offsetMin: 60, durationMin: 90, vibe: "Energetic", description: "Pitch half-baked ideas, give honest feedback, find co-founders. Bring a problem you want to solve.", meeting: "Meet at the MU Coffee House counter; we'll grab a table together.", bring: "Notebook, an idea" },
  { key: "hackathon-meetup", emoji: "🚀", title: "Hackathon Teammate Meetup", category: "Career & Networking", subcategory: "Hackathon Teammates", location: "scc", host: "tyler", attendees: ["alex", "omar", "daniel", "mei"], participants: 5, max: 10, when: "soon", offsetMin: 75, durationMin: 120, vibe: "Energetic", description: "Looking for teammates before the next hackathon. Designers, devs, and complete beginners all welcome.", meeting: "Big table in the Student Community Center lobby. Look for the laptop stickers.", bring: "Laptop and a project idea" },
  { key: "finance-chat", emoji: "📈", title: "Finance & Consulting Career Chat", category: "Career & Networking", subcategory: "Networking / Coffee Chats", location: "silo", host: "priya", attendees: ["omar", "hannah"], participants: 3, max: 6, when: "soon", offsetMin: 140, durationMin: 75, vibe: "Focused", description: "Informal peer chat about recruiting timelines, case prep, and what to do this quarter. Students only, no recruiters.", meeting: "Meet at the Silo seating area near the entrance.", bring: "Resume (optional), questions" },
  { key: "resume-practice", emoji: "🎤", title: "Resume & Interview Practice", category: "Career & Networking", subcategory: "Mock Interviews", location: "mu", host: "sofia", attendees: ["alex", "emily", "jason"], participants: 4, max: 8, when: "soon", offsetMin: 105, durationMin: 120, vibe: "Wholesome", description: "Swap resumes for feedback, then run short mock interviews in pairs. Friendly, not scary.", meeting: "Meet at the MU tables by the windows.", bring: "Printed or digital resume" },

  // ── Fitness & Workouts ──
  { key: "two-mile-run", emoji: "🏃", title: "2-Mile Run Around Campus", category: "Fitness & Workouts", subcategory: "Running / Jogging", location: "quad", host: "daniel", attendees: ["isabella", "jason", "noah"], participants: 4, max: 8, when: "soon", offsetMin: 15, durationMin: 60, skill: "Beginners Welcome", vibe: "Energetic", description: "Easy conversational pace, nobody gets left behind. Loop around campus and back.", meeting: "Meet at the Quad flagpole; stretch together first.", bring: "Running shoes, water" },
  { key: "rock-climbing", emoji: "🧗", title: "Beginner Rock Climbing Buddies", category: "Fitness & Workouts", subcategory: "Fitness Challenges", location: "arc", host: "jason", attendees: ["daniel", "aaliyah"], participants: 3, max: 6, when: "live", offsetMin: 25, durationMin: 240, skill: "Beginners Welcome", vibe: "Silly", description: "First-timers and rusty climbers welcome. We'll belay for each other and cheer loudly.", meeting: "Meet at the ARC front desk, then head to the climbing wall together.", bring: "Student ID, athletic clothes" },

  // ── Competitive Sports ──
  { key: "ultimate", emoji: "🥏", title: "Pickup Ultimate Frisbee on the Quad", category: "Competitive Sports", subcategory: "Ultimate Frisbee", location: "quad", host: "alex", attendees: ["marcus", "jason", "daniel", "isabella", "tyler", "emily"], participants: 7, max: 12, when: "live", offsetMin: 20, durationMin: 210, skill: "All Levels", vibe: "Energetic", description: "Pickup game, all levels. We'll split teams on arrival and rotate. Cleats optional.", meeting: "Open grass on the Quad; look for the orange disc.", bring: "Water, light and dark shirts for teams" },

  // ── Recreational Sports ──
  { key: "volleyball", emoji: "🏐", title: "Casual Volleyball at the ARC", category: "Recreational Sports", subcategory: "Casual Sports / Just-for-Fun Games", location: "arc", host: "marcus", attendees: ["alex", "isabella", "daniel", "hannah", "jason"], participants: 6, max: 10, when: "live", offsetMin: 30, durationMin: 210, skill: "Casual", vibe: "Energetic", description: "Just-for-fun volleyball games, rotating teams, no pressure. Come play or come cheer.", meeting: "Meet at the ARC outdoor sand courts; I'll have a red ball.", bring: "Water, athletic shoes" },
];

// ───────────────────────── planning ─────────────────────────

export interface PlannedActivity extends Omit<DemoActivity, "when" | "offsetMin"> {
  demo_key: string;
  starts_at: string;
  location_name: string;
  lat: number;
  lng: number;
}

export interface Plan {
  now: string;
  profiles: (DemoProfile & { demo_key: string; email: string; display_name: string })[];
  activities: PlannedActivity[];
}

const MIN = 60_000;

/** Relative timing: everything is computed from `now`, so re-running re-bases the whole demo. */
export function buildPlan(now: Date): Plan {
  const profiles = PROFILES.map((p) => ({
    ...p,
    demo_key: `profile:${p.key}`,
    email: `demo-${p.key}@${DEMO_EMAIL_DOMAIN}`,
    display_name: `${p.first} ${p.last}`,
  }));
  const activities = ACTIVITIES.map((a) => {
    const loc = LOCATION_BY_KEY[a.location];
    const { when, offsetMin, ...rest } = a;
    const start = when === "live" ? now.getTime() - offsetMin * MIN : now.getTime() + offsetMin * MIN;
    return { ...rest, demo_key: `activity:${a.key}`, starts_at: new Date(start).toISOString(), location_name: loc?.name ?? a.location, lat: loc?.lat ?? NaN, lng: loc?.lng ?? NaN };
  });
  return { now: now.toISOString(), profiles, activities };
}

/** Returns a list of problems; empty means the plan is internally consistent. */
export function validatePlan(plan: Plan): string[] {
  const errs: string[] = [];
  const cats = new Map(CATEGORIES.map((c) => [c.name, c]));
  const profileKeys = new Set(plan.profiles.map((p) => p.key));
  const seenKeys = new Set<string>();

  for (const p of plan.profiles) {
    for (const c of p.categories) if (!cats.has(c)) errs.push(`profile ${p.key}: unknown category "${c}"`);
    const subs = p.categories.flatMap((c) => cats.get(c)?.subcategories ?? []);
    for (const s of p.activities) if (!subs.includes(s)) errs.push(`profile ${p.key}: activity "${s}" not in its categories`);
    if (p.bio.length > 200) errs.push(`profile ${p.key}: bio too long`);
  }
  for (const a of plan.activities) {
    if (seenKeys.has(a.demo_key)) errs.push(`duplicate activity key ${a.key}`);
    seenKeys.add(a.demo_key);
    const cat = cats.get(a.category);
    if (!cat) errs.push(`${a.key}: unknown category "${a.category}"`);
    else if (!cat.subcategories.includes(a.subcategory)) errs.push(`${a.key}: unknown subcategory "${a.subcategory}"`);
    if (!LOCATION_BY_KEY[a.location]) errs.push(`${a.key}: unknown location "${a.location}"`);
    if (!profileKeys.has(a.host)) errs.push(`${a.key}: unknown host "${a.host}"`);
    const people = [a.host, ...a.attendees];
    for (const k of people) if (!profileKeys.has(k)) errs.push(`${a.key}: unknown attendee "${k}"`);
    if (new Set(people).size !== people.length) errs.push(`${a.key}: duplicate person or host listed as attendee`);
    if (people.length !== a.participants) errs.push(`${a.key}: expected ${a.participants} participants but lists ${people.length}`);
    if (a.max < a.participants) errs.push(`${a.key}: max ${a.max} < participants ${a.participants}`);
    if (a.max < 2 || a.max > 200) errs.push(`${a.key}: max out of DB range`);
    if (a.durationMin < 10 || a.durationMin > 720) errs.push(`${a.key}: duration out of DB range`);
    if (a.title.length < 3 || a.title.length > 80) errs.push(`${a.key}: title length out of range`);
    if (a.description.length < 20 || !a.meeting) errs.push(`${a.key}: missing description or meeting instructions`);
  }
  return errs;
}
