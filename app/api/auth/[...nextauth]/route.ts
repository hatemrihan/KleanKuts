import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session }) {
      // We'll handle admin status through OTP verification instead of email check
      session.user.isAdmin = false; // Default to false, will be updated after OTP verification
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always use the production URL
      const productionUrl = "https://kleankuts.shop";
      
      // If we're in production, use the production URL as base
      if (process.env.NODE_ENV === "production") {
        baseUrl = productionUrl;
      }
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Handle absolute URLs on the same origin
      const urlObject = new URL(url);
      if (urlObject.origin === baseUrl || urlObject.origin === productionUrl) {
        return url;
      }
      
      // Default fallback to base URL
      return baseUrl;
    }
  },
  pages: {
    signIn: '/',
    error: '/',
    signOut: '/'
  }
});

export { handler as GET, handler as POST }; 