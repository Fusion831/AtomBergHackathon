import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";

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
        
        {/* Simple form calling the default NextAuth login endpoint for credentials */}
        <form className="space-y-4" action="/api/auth/callback/credentials" method="POST">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <input 
              type="email" 
              name="email"
              defaultValue="employee@test.com"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <input 
              type="password" 
              name="password"
              defaultValue="password"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required 
            />
          </div>
          <button 
            type="submit"
            className="w-full px-4 py-2 mt-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
