import { relations } from "drizzle-orm";
import { levelMilestones, userRewards } from "./schema";
import { users } from "../users/schema";

export const levelMilestonesRelations = relations(levelMilestones, ({ many }) => ({
  userRewards: many(userRewards),
}));

export const userRewardsRelations = relations(userRewards, ({ one }) => ({
  user: one(users, {
    fields: [userRewards.userId],
    references: [users.id],
  }),
  milestone: one(levelMilestones, {
    fields: [userRewards.milestoneId],
    references: [levelMilestones.id],
  }),
}));
