import type { ReactNode } from "react";

export function PageHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <div className="overline">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
      </div>
      {children}
    </header>
  );
}
