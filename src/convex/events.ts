// convex/events.ts
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const add = mutation({
	args: {
		type: v.string(),
		payload: v.any()
	},
	handler: async (ctx, { type, payload }) => {
		await ctx.db.insert('events', { type, payload, timestamp: Date.now() });
	}
});

export const list = query({
	handler: async (ctx) => {
		return await ctx.db.query('events').order('desc').take(100);
	}
});
