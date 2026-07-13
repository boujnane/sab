import Link from "next/link";

import { signOut } from "@/lib/actions/auth";
import { AppLineSidebar } from "@/components/app-line-sidebar";

export function NavBar() {
  return (
    <>
      <header className="px-6 py-5 md:hidden">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="font-display text-lg italic text-plum-950">
            Beranis
          </Link>
          <nav className="flex items-center gap-4 text-xs text-plum-700">
            <Link href="/timeline" className="hover:text-plum-950">
              timeline
            </Link>
            <Link href="/synthese" className="hover:text-plum-950">
              synthèse
            </Link>
          </nav>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-48 px-6 py-8 md:grid md:grid-rows-[auto_1fr_auto]">
        <Link href="/" className="font-display text-lg italic text-plum-950">
          Beranis
        </Link>

        <div className="mt-10">
          <AppLineSidebar />
        </div>

        <form action={signOut} className="pb-8">
          <button
            type="submit"
            className="w-full py-2 text-left text-xs text-plum-700 hover:text-plum-950"
          >
            déconnexion
          </button>
        </form>
      </aside>
    </>
  );
}
