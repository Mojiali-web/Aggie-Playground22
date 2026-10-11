export type Activity = {
  id: string; host_id: string; title: string; category: string; subcategory: string;
  location_key: string; location_name: string; lat: number; lng: number;
  starts_at: string; duration_min: number; max_participants: number; description: string;
  skill_level: string | null; vibe: string | null; what_to_bring: string | null;
  status: "active" | "cancelled"; is_demo: boolean; created_at: string;
  participant_count: number; spots_remaining: number; host_name: string | null;
  host_emoji: string | null; host_color: string | null;
  live_status: "live" | "upcoming" | "ended" | "cancelled";
};
export type ActivityInput = Pick<Activity, "title" | "category" | "subcategory" | "location_key" | "location_name" | "lat" | "lng" | "starts_at" | "duration_min" | "max_participants" | "description" | "skill_level" | "vibe" | "what_to_bring">;
export type Profile = {
  id: string; display_name: string; avatar_emoji: string; avatar_color: string;
  bio: string; favorite_categories: string[]; preferred_activities: string[];
  discoverable: boolean; is_demo: boolean;
};
export type Post = { id: string; author_id: string; topic: string; title: string; body: string; created_at: string; author?: Pick<Profile, "display_name" | "avatar_emoji"> | null };
export type ClubEvent = { id: string; title: string; organization: string | null; starts_at: string | null; location: string | null; description: string | null; event_url: string; source_site: string; fetched_at: string };
export type AppNotification = { id: string; kind: "new_activity" | "activity_updated" | "activity_cancelled"; title: string; body: string; activity_id: string | null; read: boolean; created_at: string };
export type BuddyRequest = { id: string; from_user: string; to_user: string; status: "pending" | "accepted" | "declined"; created_at?: string };

export const CATEGORIES = [
  { name: "Social & Hangouts", emoji: "🧋", subcategories: ["Coffee / Boba Runs", "Dining Buddies", "Parties / Pregames", "Movie / Game Nights", "Casual Hangouts", "Campus Events", "Downtown Exploration"] },
  { name: "Career & Networking", emoji: "💼", subcategories: ["Hackathon Teammates", "Startup Brainstorming", "Networking / Coffee Chats", "Resume & LinkedIn Reviews", "Mock Interviews", "Case Competitions"] },
  { name: "Academic & Study", emoji: "📚", subcategories: ["Study Buddies", "Group Study Sessions", "Exam Preparation", "Homework Help", "Library Meetups", "Language Exchange"] },
  { name: "Fitness & Workouts", emoji: "💪", subcategories: ["Gym Buddies / Weightlifting", "Running / Jogging", "Pilates / Yoga", "HIIT / Bootcamp", "Cycling Workouts", "Fitness Challenges"] },
  { name: "Competitive Sports", emoji: "🏐", subcategories: ["Basketball", "Soccer", "Volleyball", "Tennis", "Badminton", "Pickleball", "Ultimate Frisbee", "Table Tennis", "Scrimmages / Tournaments"] },
  { name: "Recreational Sports", emoji: "🥏", subcategories: ["Casual Frisbee", "Beginner Pickleball", "Leisure Cycling", "Hiking / Nature Walks", "Roller Skating", "Casual Sports / Just-for-Fun Games"] },
  { name: "Self-Care & Wellness", emoji: "🌿", subcategories: ["Meditation / Mindfulness", "Journaling / Reading", "Arts & Crafts", "Nature Breaks / Sunset Watching", "Wellness Check-ins", "Relaxation / De-stress Sessions"] },
];
export const LOCATIONS = [
  { key: "mu", name: "Memorial Union (MU)", lat: 38.54175, lng: -121.74935 },
  { key: "quad", name: "The Quad", lat: 38.54213, lng: -121.74935 },
  { key: "arc", name: "Activities & Recreation Center (ARC)", lat: 38.543, lng: -121.75915 },
  { key: "shields", name: "Shields Library", lat: 38.53976, lng: -121.74928 },
  { key: "arboretum", name: "UC Davis Arboretum", lat: 38.5318, lng: -121.7508 },
  { key: "silo", name: "The Silo", lat: 38.53933, lng: -121.7555 },
];
export const FORUM_TOPICS = ["Looking for teammates", "Anyone free tonight?", "Campus recommendations", "Upcoming events", "Study groups"];
export const SKILL_LEVELS = ["Competitive", "Casual", "Beginners Welcome", "All Levels"];
