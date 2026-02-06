export type SocialActivity = "low" | "medium" | "high";

export type CheckIn = {
  id: string;
  createdAt: string; // ISO

  sleepHours: number;
  socialActivity: SocialActivity;
  screenTimeHours: number;
  moodRating?: number; // 1-5 optional
};

export type RiskLevel = "low" | "medium" | "high";

export type RiskAssessment = {
  score: number;
  level: RiskLevel;
  reasons: string[];
};
