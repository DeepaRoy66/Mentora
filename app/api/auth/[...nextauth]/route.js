import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  callbacks: {
    // Called after user signs in
    async signIn({ user }) {
      if (!user?.email) return false;

      try {
        // Sync user in FastAPI backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            image: user.image,
          }),
        });

        if (!res.ok) {
          console.error("FastAPI backend returned error:", res.status);
        }

        return true;
      } catch (err) {
        console.error("FastAPI backend offline, logging in anyway:", err);
        return true;
      }
    },

    // Called whenever JWT token is created or updated
    async jwt({ token, user, session, trigger }) {
      // On initial login, attach user info to token
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      // Always fetch user stats from FastAPI using JWT
      if (token.email) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/user-stats?email=${token.email}`,
            {
              headers: {
                "Authorization": `Bearer ${token.email}`, // <-- Send JWT/email here
              },
            }
          );

          if (res.ok) {
            const data = await res.json();
            token.contributionPoints = data.contributionPoints || 0;
            if (data.image) token.picture = data.image;
          } else {
            console.error("FastAPI /user-stats returned status:", res.status);
            token.contributionPoints = 0;
          }
        } catch (err) {
          console.error("Backend fetch failed, using default values.", err);
          token.contributionPoints = 0;
        }
      }

      // Handle session update triggers
      if (trigger === "update" && session?.user) {
        token.picture = session.user.image;
      }

      return token;
    },

    // Called when session object is sent to frontend
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.contributionPoints = token.contributionPoints || 0;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
