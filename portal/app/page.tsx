import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin/governance");
  }

  if (session.user.role === "MANAGER") {
    redirect("/directory");
  }

  redirect("/goals/draft");
}
