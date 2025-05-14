import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

console.log("NextAuth initialization with NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debugging
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Sign in callback triggered", { user, account });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback", { url, baseUrl });
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  logger: {
    error(code, metadata) {
      console.error(`Auth error (${code}):`, metadata);
    },
    warn(code) {
      console.warn(`Auth warning: ${code}`);
    },
    debug(code, metadata) {
      console.log(`Auth debug (${code}):`, metadata);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 