import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";

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
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.sub = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        
        // Generate a proper JWT token for your backend
        session.accessToken = jwt.sign(
          {
            email: token.email,
            name: token.name,
            sub: token.email,
          },
          process.env.NEXTAUTH_SECRET,
          { algorithm: "HS256", expiresIn: "7d" }
        );
      }
      return session;
    },
    async signIn({ user }) {
      // Sync user with backend
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            image: user.image,
          }),
        });
      } catch (err) {
        console.error("Backend sync failed", err);
      }
      return true;
    },
  },
};