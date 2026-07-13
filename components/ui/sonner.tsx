"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[var(--radius)] !border !border-plum-200 !bg-[var(--surface)] !text-plum-950 !shadow-[var(--shadow-hairline)] !text-sm",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
