import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    redirect("/goals/draft");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-sm p-8 space-y-6 bg-zinc-950 border border-zinc-800 rounded-xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Sign In</h1>
          <p className="text-sm text-zinc-400 mt-2">Use your enterprise test credentials</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
