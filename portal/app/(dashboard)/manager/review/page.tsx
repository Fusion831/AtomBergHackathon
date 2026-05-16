import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function ManagerReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch sheets for direct reports
  const sheets = await prisma.goalSheet.findMany({
    where: {
      user: {
        managerId: session.user.role === "MANAGER" ? session.user.id : undefined,
      },
      status: {
        in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "LOCKED"],
      },
    },
    include: {
      user: true,
      cycle: true,
      goals: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Team Goal Reviews</h1>
        <p className="text-sm text-zinc-400 mt-1">Review, adjust, and approve goals submitted by your direct reports.</p>
      </div>

      <div className="space-y-4">
        {sheets.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-xl">
            <h3 className="text-zinc-300 font-medium">No reviews pending</h3>
            <p className="text-zinc-500 text-sm mt-1">Your team hasn't submitted any goal sheets yet.</p>
          </div>
        ) : (
          sheets.map((sheet) => (
            <Link key={sheet.id} href={`/manager/review/${sheet.id}`}>
              <div className="flex items-center justify-between p-5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-xl group cursor-pointer">
                <div>
                  <h3 className="text-zinc-100 font-medium">{sheet.user.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                    <span>{sheet.cycle.name}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                    <span>{sheet.goals.length} Goals</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                    <span>Submitted {sheet.submittedAt?.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    sheet.status === "SUBMITTED" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    sheet.status === "UNDER_REVIEW" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    sheet.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}>
                    {sheet.status.replace("_", " ")}
                  </span>
                  <ChevronRight className="text-zinc-500 group-hover:text-zinc-300 transition-colors" size={20} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
