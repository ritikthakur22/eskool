import { Header } from "@/components/layout/header";
import Image from "next/image";

export default function Home() {
  return (
<>
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 p-6 text-2xl">Hello Workd</main>
      </div>
</>
  );
}
