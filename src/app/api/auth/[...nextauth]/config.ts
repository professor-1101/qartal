import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    (user as any).password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email!,
                    firstName: (user as any).firstName,
                    lastName: (user as any).lastName,
                };
            }
        })
    ],
    session: {
        strategy: "jwt" as const,
    },
    pages: {
        signIn: "/sign-in",
        signOut: "/",
        error: "/sign-in",
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                // اطلاعات جدید را از دیتابیس بخوان
                const user = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { id: true, firstName: true, lastName: true, email: true, image: true }
                });
                if (user) {
                    session.user.id = user.id;
                    session.user.firstName = user.firstName;
                    session.user.lastName = user.lastName;
                    session.user.email = user.email;
                    session.user.image = user.image;
                }
            }
            return session;
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