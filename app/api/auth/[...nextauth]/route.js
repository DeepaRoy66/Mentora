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
        await fetch("http://127.0.0.1:5000/api/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            image: user.image,
          }),
        });
        return true;
      } catch (err) {
        console.error("Backend offline, logging in anyway:", err);
        return true; // ✅ Allow login even if backend is down
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;

        try {
          const res = await fetch(`http://127.0.0.1:5000/api/user-stats?email=${user.email}`);
          // ✅ Check if response is actually OK before parsing JSON
          if (res.ok) {
            const data = await res.json();
            token.contributionPoints = data.contributionPoints;
            if (data.image) token.picture = data.image;
          }
        } catch (error) {
          console.error("Backend fetch failed, using default values.");
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
        session.user.contributionPoints = token.contributionPoints ?? 0;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };