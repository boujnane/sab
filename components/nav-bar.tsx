import Link from "next/link";

import { isAdminEmail } from "@/lib/admin";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { AppLineSidebar } from "@/components/app-line-sidebar";
import { AppMobileNav } from "@/components/app-mobile-nav";

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const showAdmin = isAdminEmail(user?.email);

  return (
    <>
      <header className="px-4 py-4 sm:px-6 md:hidden">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="font-display text-lg italic text-plum-950">
            Beranis
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-10 rounded-[var(--radius)] px-2 text-xs text-plum-700 hover:bg-plum-100/70 hover:text-plum-950"
            >
              déconnexion
            </button>
          </form>
        </div>
      </header>
      <AppMobileNav showAdmin={showAdmin} />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-48 px-6 py-8 md:grid md:grid-rows-[auto_1fr_auto]">
        <Link href="/" className="font-display text-lg italic text-plum-950">
          Beranis
        </Link>

        <div className="mt-10">
          <AppLineSidebar showAdmin={showAdmin} />
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
