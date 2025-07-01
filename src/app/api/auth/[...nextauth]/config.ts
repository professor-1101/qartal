import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).firstName = token.firstName;
                (session.user as any).lastName = token.lastName;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret",
    debug: process.env.NODE_ENV === "development",
}; 