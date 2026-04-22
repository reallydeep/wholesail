export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="print-root">{children}</div>;
}

export const metadata = {
  robots: { index: false, follow: false },
};
