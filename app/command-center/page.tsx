import type { Metadata } from "next";
import { CommandCenter } from "./command-center";

export const metadata: Metadata = {
  title: "Founder Command Center",
};

export default function CommandCenterPage() {
  return <CommandCenter />;
}
