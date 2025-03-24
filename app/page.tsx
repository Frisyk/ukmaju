import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/chat");
  } else {
    redirect("/login");
  }
  
  return null;
}
