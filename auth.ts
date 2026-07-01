import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Reddit from "next-auth/providers/reddit";
import Twitter from "next-auth/providers/twitter";
import Facebook from "next-auth/providers/facebook";
import { db } from "@/db";
import { users, authAccounts, verificationTokens } from "@/db/schema";
import { generateUniqueUsername } from "@/lib/username";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: authAccounts as any,
    verificationTokensTable: verificationTokens,
  }),

  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: { params: { prompt: "select_account" } },
    }),

    Discord({
      clientId:     process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    }),

    Reddit({
      clientId:     process.env.AUTH_REDDIT_ID!,
      clientSecret: process.env.AUTH_REDDIT_SECRET!,
    }),

    Twitter({
      clientId:     process.env.AUTH_TWITTER_ID!,
      clientSecret: process.env.AUTH_TWITTER_SECRET!,
    }),

    Facebook({
      clientId:     process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const username = await generateUniqueUsername();
      await db.update(users).set({ username }).where(eq(users.id, user.id));
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },
});
