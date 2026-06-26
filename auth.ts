import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Reddit from "next-auth/providers/reddit";
import Twitter from "next-auth/providers/twitter";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, authAccounts, verificationTokens } from "@/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: authAccounts as any,
    verificationTokensTable: verificationTokens,
  }),

  session: { strategy: "jwt" },

  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        if (user.role === "banned") return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),

    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
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

  pages: {
    signIn:  "/login",
    signOut: "/logout",
    error:   "/login",
  },
});
