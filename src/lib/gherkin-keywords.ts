export interface GherkinKeywords {
  feature: string;
  background: string;
  scenario: string;
  scenarioOutline: string;
  examples: string;
  given: string;
  when: string;
  then: string;
  and: string;
  but: string;
}

export const gherkinKeywords: Record<string, GherkinKeywords> = {
  en: {
    feature: "Feature",
    background: "Background",
    scenario: "Scenario",
    scenarioOutline: "Scenario Outline",
    examples: "Examples",
    given: "Given",
    when: "When",
    then: "Then",
    and: "And",
    but: "But"
  },
  fa: {
    feature: "ویژگی",
    background: "پیش‌زمینه",
    scenario: "سناریو",
    scenarioOutline: "طرح سناریو",
    examples: "مثال‌ها",
    given: "با فرض",
    when: "هنگامی که",
    then: "آنگاه",
    and: "و",
    but: "اما"
  },
  ar: {
    feature: "خاصية",
    background: "الخلفية",
    scenario: "سيناريو",
    scenarioOutline: "خطة السيناريو",
    examples: "أمثلة",
    given: "بافتراض",
    when: "عندما",
    then: "اذاً",
    and: "و",
    but: "لكن"
  }
};

export const rtlLanguages = ['fa', 'ar', 'he', 'ur'];

export function isRTL(language: string): boolean {
  return rtlLanguages.includes(language);
}

export function getGherkinKeywords(language: string): GherkinKeywords {
  return gherkinKeywords[language] || gherkinKeywords.en;
}

export function getStepKeywords(language: string): string[] {
  const keywords = getGherkinKeywords(language);
  return [keywords.given, keywords.when, keywords.then, keywords.and, keywords.but];
}

export function translateGherkinText(text: string, fromLanguage: string, toLanguage: string): string {
  const fromKeywords = getGherkinKeywords(fromLanguage);
  const toKeywords = getGherkinKeywords(toLanguage);
  
  let translatedText = text;
  
  // Replace keywords
  Object.entries(fromKeywords).forEach(([key, fromKeyword]) => {
    const toKeyword = toKeywords[key as keyof GherkinKeywords];
    if (fromKeyword && toKeyword) {
      const regex = new RegExp(`\\b${fromKeyword}\\b`, 'gi');
      translatedText = translatedText.replace(regex, toKeyword);
    }
  });
  
  return translatedText;
}

export function getSupportedLanguages(): Array<{ code: string; name: string; isRTL: boolean }> {
  return [
    { code: 'en', name: 'English', isRTL: false },
    { code: 'fa', name: 'فارسی', isRTL: true },
    { code: 'ar', name: 'العربية', isRTL: true }
  ];
} 