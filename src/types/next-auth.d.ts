import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      firstName?: string
      lastName?: string
      image?: string
      isSuper?: boolean
      isActive?: boolean
      autoSave?: boolean
    }
  }

  interface User {
    id: string
    email: string
    firstName?: string
    lastName?: string
    image?: string
    isSuper?: boolean
    isActive?: boolean
    autoSave?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    firstName?: string
    lastName?: string
    isSuper?: boolean
    isActive?: boolean
    autoSave?: boolean
  }
} 