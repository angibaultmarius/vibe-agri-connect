import { Navigation } from "@/components/Navigation";

export default function LayoutApplication({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="app">{children}</div>
      <Navigation />
    </>
  );
}
