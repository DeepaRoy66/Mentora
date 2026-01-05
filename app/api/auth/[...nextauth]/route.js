import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectionToDatabase from "@/lib/database/mongoose";
import User from "@/lib/models/user";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // ✅ 1. SIGN IN → save/update user in DB
    async signIn({ user }) {
      if (!user?.email) return false;

      try {
        await connectionToDatabase();

        await User.findOneAndUpdate(
          { email: user.email },
          {
            $setOnInsert: {
              contributionPoints: 0,
            },
            $set: {
              name: user.name?.trim() || "Unknown User",
              email: user.email,
              image: user.image || null,
            },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error("❌ DB save error:", err);
      }

      return true;
    },

    // ✅ 2. JWT → LOAD USER FROM DB INTO TOKEN
    async jwt({ token, user }) {
      // First login
      if (user?.email) {
        await connectionToDatabase();

        const dbUser = await User.findOne({ email: user.email }).lean();

        if (dbUser) {
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          token.contributionPoints = dbUser.contributionPoints;
        }
      }

      return token;
    },

    // ✅ 3. SESSION → COPY FROM TOKEN TO CLIENT
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.contributionPoints = token.contributionPoints ?? 0;
      }

      return session;
    },
  },
});

export { handler as GET, handler as POST };
