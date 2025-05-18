import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import mongoose from "mongoose";
import dbConnect from "@/app/lib/mongodb";

console.log("NextAuth initialization with NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
      isAmbassador?: boolean;
      ambassadorStatus?: string;
    }
  }
}

// Define interfaces for our data models
interface IAmbassador {
  email: string;
  status: string;
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
      
      // Check for callbackUrl in the URL parameters, which takes precedence
      try {
        const urlObj = new URL(url);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        if (callbackUrl) {
          // Make sure the callback URL is allowed (starts with the base URL)
          return callbackUrl.startsWith(baseUrl) ? callbackUrl : baseUrl;
        }
      } catch (e) {
        console.error("Error parsing URL:", e);
      }
      
      // Default to the basic logic: use the URL if it's allowed, otherwise fallback to baseUrl
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async session({ session }) {
      // Add ambassador status to the session if the user is an ambassador
      if (session?.user?.email) {
        try {
          await dbConnect();
          
          // Check if user is an admin
          const Admin = mongoose.models.Admin || mongoose.model('Admin', new mongoose.Schema({
            email: String
          }, { collection: 'admins' }));
          
          const admin = await Admin.findOne({ email: session.user.email }).lean();
          session.user.isAdmin = !!admin;
          
          // Check ambassador status
          const Ambassador = mongoose.models.Ambassador || mongoose.model('Ambassador', new mongoose.Schema({
            email: String,
            status: String
          }, { collection: 'ambassadors' }));
          
          const ambassador = await Ambassador.findOne({ email: session.user.email }).lean() as IAmbassador | null;
          
          if (ambassador) {
            session.user.isAmbassador = true;
            session.user.ambassadorStatus = ambassador.status;
          } else {
            session.user.isAmbassador = false;
          }
        } catch (error) {
          console.error("Error checking user status:", error);
        }
      }
      
      return session;
    }
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