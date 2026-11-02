import { z } from "zod";

export const SignDifficultySchema = z.enum(["Easy", "Medium", "Hard"]);
export type SignDifficulty = z.infer<typeof SignDifficultySchema>;

export const SignSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  difficulty: SignDifficultySchema,
  emoji: z.string().min(1).default("👋"),
  videoUrl: z.string().default(""),
  thumbnailUrl: z.string().optional(),
  description: z.string().default(""),
  keywords: z.array(z.string()).default([]),
  createdAt: z.number().optional(),
});

export type Sign = z.infer<typeof SignSchema>;

export type DictionaryLoadState = "idle" | "loading" | "ready" | "empty" | "error";

export function parseSign(payload: unknown): Sign {
  return SignSchema.parse(payload);
}

export const DEMO_SIGNS: Sign[] = [
  {
    id: "sign-hello",
    title: "Hello",
    category: "Greetings",
    difficulty: "Easy",
    emoji: "👋",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "Start with an open dominant hand near the temple, then move outward and slightly forward in a gentle salute wave.",
    keywords: ["hi", "greeting", "welcome", "hello", "xin chào"],
  },
  {
    id: "sign-thank-you",
    title: "Thank You",
    category: "Greetings",
    difficulty: "Easy",
    emoji: "🙏",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description: "Touch the fingers of your flat dominant hand to your chin/lips, then extend your hand toward the person.",
    keywords: ["thanks", "gratitude", "appreciate", "cảm ơn"],
  },
  {
    id: "sign-please",
    title: "Please",
    category: "Greetings",
    difficulty: "Easy",
    emoji: "🤲",
    videoUrl: "",
    description: "Place your flat dominant hand on your chest and rub in a gentle clockwise circle.",
    keywords: ["please", "request", "làm ơn"],
  },
  {
    id: "sign-yes",
    title: "Yes",
    category: "Basics",
    difficulty: "Easy",
    emoji: "✊",
    videoUrl: "",
    description: "Make an 'S' fist and nod it up and down from the wrist, imitating a head nod.",
    keywords: ["yes", "agree", "affirmative", "đúng", "vâng"],
  },
  {
    id: "sign-no",
    title: "No",
    category: "Basics",
    difficulty: "Easy",
    emoji: "🤏",
    videoUrl: "",
    description: "Snap your index and middle fingers down quickly against your thumb.",
    keywords: ["no", "deny", "disagree", "không"],
  },
  {
    id: "sign-help",
    title: "Help",
    category: "Emergency",
    difficulty: "Medium",
    emoji: "🆘",
    videoUrl: "",
    description: "Place your dominant hand with thumb up ('A' handshape) on top of your flat non-dominant palm, then raise both hands together.",
    keywords: ["help", "assist", "support", "emergency", "giúp đỡ"],
  },
  {
    id: "sign-water",
    title: "Water",
    category: "Everyday",
    difficulty: "Easy",
    emoji: "💧",
    videoUrl: "",
    description: "Form a 'W' handshape with your three middle fingers and tap your index finger against your chin twice.",
    keywords: ["water", "drink", "thirst", "nước"],
  },
  {
    id: "sign-family",
    title: "Family",
    category: "Everyday",
    difficulty: "Medium",
    emoji: "👨‍👩‍👧",
    videoUrl: "",
    description: "Form 'F' handshapes with both hands touching index and thumbs, then draw a horizontal circle outward until pinkies meet.",
    keywords: ["family", "parents", "relatives", "gia đình"],
  },
  {
    id: "sign-friend",
    title: "Friend",
    category: "Everyday",
    difficulty: "Medium",
    emoji: "🤝",
    videoUrl: "",
    description: "Interlock your dominant index finger over the non-dominant index finger, then reverse and hook the other way.",
    keywords: ["friend", "companion", "pal", "bạn bè"],
  },
  {
    id: "sign-love",
    title: "Love",
    category: "Emotions",
    difficulty: "Easy",
    emoji: "❤️",
    videoUrl: "",
    description: "Cross both closed fists over your chest in an affectionate embrace gesture.",
    keywords: ["love", "care", "affection", "yêu thương"],
  },
  {
    id: "sign-goodbye",
    title: "Goodbye",
    category: "Greetings",
    difficulty: "Easy",
    emoji: "🙋",
    videoUrl: "",
    description: "Open your dominant hand facing forward and fold fingers down together a few times like a traditional wave.",
    keywords: ["bye", "farewell", "see you", "tạm biệt"],
  },
  {
    id: "sign-learn",
    title: "Learn",
    category: "Basics",
    difficulty: "Medium",
    emoji: "📖",
    videoUrl: "",
    description: "Hold your non-dominant hand flat like a book, grasp knowledge from the palm with dominant fingertips, and bring it up to your forehead.",
    keywords: ["learn", "study", "education", "học"],
  },
];
