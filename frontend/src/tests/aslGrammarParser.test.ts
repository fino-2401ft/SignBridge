import { describe, test, expect } from "./testHarness";
import { parseSentenceToASLGloss, matchGlossToSigns, matchGlossToGestures } from "../utils/aslGrammarParser";
import type { Sign } from "../types/dictionary";
import type { GestureDTO } from "../types/gesture";

describe("aslGrammarParser", () => {
  test("strips English stop words like 'the', 'is', 'a'", () => {
    const result = parseSentenceToASLGloss("This is the apple");
    expect(result.parsedGloss).not.toContain("is");
    expect(result.parsedGloss).not.toContain("the");
    expect(result.parsedGloss).toContain("apple");
  });

  test("lemmatizes past tense verbs to base glosses", () => {
    const result = parseSentenceToASLGloss("I went to school and ate food");
    expect(result.parsedGloss).toContain("go");
    expect(result.parsedGloss).toContain("eat");
    expect(result.parsedGloss).not.toContain("went");
    expect(result.parsedGloss).not.toContain("ate");
  });

  test("expands common English contractions", () => {
    const result = parseSentenceToASLGloss("I don't know");
    expect(result.parsedGloss).toContain("not");
    expect(result.parsedGloss).toContain("know");
  });

  test("matches gloss tokens to available dictionary signs", () => {
    const mockSigns: Sign[] = [
      {
        id: "sign-hello",
        title: "Hello",
        category: "Greetings",
        difficulty: "Easy",
        emoji: "👋",
        videoUrl: "https://example.com/hello.mp4",
        thumbnailUrl: "https://example.com/hello.jpg",
        description: "Standard ASL greeting",
        keywords: ["hi", "greeting"],
      },
      {
        id: "sign-friend",
        title: "Friend",
        category: "People",
        difficulty: "Easy",
        emoji: "🤝",
        videoUrl: "https://example.com/friend.mp4",
        thumbnailUrl: "https://example.com/friend.jpg",
        description: "Friend gesture",
        keywords: ["pal", "buddy"],
      },
    ];

    const matched = matchGlossToSigns(["hello", "friend"], mockSigns);
    expect(matched.length).toBe(2);
    expect(matched[0]?.id).toBe("sign-hello");
    expect(matched[1]?.id).toBe("sign-friend");
  });

  test("matches gloss tokens to available gesture DTOs", () => {
    const mockGestures: GestureDTO[] = [
      {
        gestureId: "g-thank-you",
        label: "Thank you",
        category: "basics",
        videoUrl: "https://example.com/thanks.mp4",
        difficulty: "beginner",
        description: "Expressing gratitude",
        isDynamic: true,
        tags: ["gratitude"],
        alternatives: ["thanks"],
      },
    ];

    const matched = matchGlossToGestures(["thanks"], mockGestures);
    expect(matched.length).toBe(1);
    expect(matched[0]?.gestureId).toBe("g-thank-you");
  });
});
