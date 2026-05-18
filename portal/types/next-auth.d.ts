import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role | string;
      departmentId?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: Role | string;
    departmentId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role | string;
    departmentId?: string;
  }
}
