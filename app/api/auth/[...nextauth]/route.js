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

    async jwt({ token, user }) {
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
