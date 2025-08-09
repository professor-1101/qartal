import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ActivityLogger } from "@/lib/activity-logger";

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                if (!user || !(user as any).password) {
                    return null;
                }

                // Check if user is active
                if (!(user as any).isActive) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    (user as any).password
                );

                if (!isPasswordValid) {
                    return null;
                }

                // Check if user should be super user based on ENV
                const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
                console.log('SUPERUSER_EMAILS from ENV:', process.env.SUPERUSER_EMAILS);
                console.log('SuperUser emails array:', superUserEmails);
                console.log('Current login email:', credentials.email);
                const isSuper = superUserEmails.includes(credentials.email) || (user as any).isSuper;
                console.log('Is user super?', isSuper);

                return {
                    id: user.id,
                    email: user.email!,
                    firstName: (user as any).firstName,
                    lastName: (user as any).lastName,
                    isSuper: isSuper, // Use calculated value
                    isActive: (user as any).isActive,
                    autoSave: (user as any).autoSave,
                };
            }
        })
    ],
    session: {
        strategy: "jwt" as const,
    },
    pages: {
        signIn: "/sign-in",
        signOut: "/sign-in",
        error: "/sign-in",
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.email = user.email;
                token.isSuper = user.isSuper;
                token.isActive = user.isActive; // اضافه شد - مهم!
                token.autoSave = user.autoSave;
            }
            
            // IMPORTANT: Check for superuser status on every JWT refresh
            if (token.email) {
                const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
                console.log('JWT CALLBACK - SUPERUSER_EMAILS from ENV:', process.env.SUPERUSER_EMAILS);
                console.log('JWT CALLBACK - SuperUser emails array:', superUserEmails);
                console.log('JWT CALLBACK - Token email:', token.email);
                const shouldBeSuper = superUserEmails.includes(token.email as string);
                console.log('JWT CALLBACK - Should be super?', shouldBeSuper);
                
                // Update token with ENV-based superuser status
                token.isSuper = shouldBeSuper;
                console.log('JWT CALLBACK - Updated token.isSuper to:', token.isSuper);
            }
            
            console.log("JWT CALLBACK TOKEN:", token); // debug
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                // اطلاعات جدید را از دیتابیس بخوان
                const user = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { id: true, firstName: true, lastName: true, email: true, image: true, isSuper: true, isActive: true, autoSave: true }
                });
                if (user) {
                    // Check if user is still active
                    if (!user.isActive) {
                        // Force logout if user is deactivated
                        console.log("User is inactive, forcing logout:", user.email);
                        return null;
                    }
                    // Override with ENV-based superuser status
                    const superUserEmails = process.env.SUPERUSER_EMAILS?.split(',').map(email => email.trim()) || [];
                    const shouldBeSuper = superUserEmails.includes(user.email!) || user.isSuper;
                    
                    console.log('SESSION CALLBACK - SUPERUSER_EMAILS:', process.env.SUPERUSER_EMAILS);
                    console.log('SESSION CALLBACK - Should be super?', shouldBeSuper);
                    
                    session.user.id = user.id;
                    session.user.firstName = user.firstName;
                    session.user.lastName = user.lastName;
                    session.user.email = user.email;
                    session.user.image = user.image;
                    session.user.isSuper = shouldBeSuper; // Use ENV-based value
                    session.user.isActive = user.isActive;
                    session.user.autoSave = user.autoSave;
                }
            }
            console.log("SESSION CALLBACK SESSION:", session); // debug
            return session;
        },
        async signIn({ user  }) {
            // Log user login activity
            if (user?.id && user?.email) {
                await ActivityLogger.logUserLogin(user.id, user.email);
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            // If url is relative, join with baseUrl
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // If url starts with baseUrl, return as is
            if (url.startsWith(baseUrl)) return url;
            // Otherwise, fallback to baseUrl
            return baseUrl;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret",
    debug: process.env.NODE_ENV === "development",
}; 