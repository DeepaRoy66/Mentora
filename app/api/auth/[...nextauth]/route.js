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
    async signIn({ user }) {
      if (!user?.email) return false;

      try {
        const res = await fetch("http://localhost:8000/sync-user", {
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
          // Allow login even if backend fails
        }

        return true;
      } catch (err) {
        console.error("FastAPI backend offline, logging in anyway:", err);
        return true; // ✅ Allow login even if backend is down
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;

        try {
          const res = await fetch(
            `http://localhost:8000/user-stats?email=${user.email}`
          );

          if (res.ok) {
            const data = await res.json();
            token.contributionPoints = data.contributionPoints || 0;
            if (data.image) token.picture = data.image;
          } else {
            console.error("FastAPI /user-stats returned status:", res.status);
            token.contributionPoints = 0;
          }
        } catch (error) {
          console.error("Backend fetch failed, using default values.", error);
          token.contributionPoints = 0;
        }
      }

      if (trigger === "update" && session?.user) {
        token.picture = session.user.image;
      }

      return token;
    },

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
