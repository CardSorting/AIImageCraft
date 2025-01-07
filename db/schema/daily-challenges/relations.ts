import { relations } from "drizzle-orm";
import { dailyChallenges, challengeProgress } from "./schema";
import { users } from "../users/schema";

export const dailyChallengesRelations = relations(dailyChallenges, ({ many }) => ({
  progress: many(challengeProgress),
}));

export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
  user: one(users, {
    fields: [challengeProgress.userId],
    references: [users.id],
  }),
  challenge: one(dailyChallenges, {
    fields: [challengeProgress.challengeId],
    references: [dailyChallenges.id],
  }),
}));
