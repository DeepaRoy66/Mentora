// app/lib/authOptions.js
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            image: user.image,
          }),
        });

        if (!res.ok) console.error("Backend returned status:", res.status);
        return true;
      } catch (err) {
        console.error("Backend offline, logging in anyway:", err);
        return true;
      }
    },

    async jwt({ token, user, session, trigger }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      if (token.email) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/user-stats?email=${token.email}`,
            { headers: { Authorization: `Bearer ${token.email}` } }
          );

          if (res.ok) {
            const data = await res.json();
            token.contributionPoints = data.contributionPoints || 0;
            if (data.image) token.picture = data.image;
          } else {
            token.contributionPoints = 0;
          }
        } catch {
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
