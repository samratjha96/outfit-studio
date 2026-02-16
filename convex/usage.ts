import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const DAILY_LIMIT = 10;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export const checkQuota = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = todayUTC();
    const row = await ctx.db
      .query("usageLimits")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today),
      )
      .unique();

    const used = row?.count ?? 0;
    return { allowed: used < DAILY_LIMIT, used, limit: DAILY_LIMIT };
  },
});

export const recordUsage = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = todayUTC();
    const row = await ctx.db
      .query("usageLimits")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today),
      )
      .unique();

    if (row) {
      await ctx.db.patch(row._id, { count: row.count + 1 });
    } else {
      await ctx.db.insert("usageLimits", {
        userId: args.userId,
        date: today,
        count: 1,
      });
    }
  },
});

export const getRemaining = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const today = todayUTC();
    const row = await ctx.db
      .query("usageLimits")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today),
      )
      .unique();

    const used = row?.count ?? 0;
    return { used, limit: DAILY_LIMIT };
  },
});
