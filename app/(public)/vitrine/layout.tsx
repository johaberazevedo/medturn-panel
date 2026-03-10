import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vitrine",
  description:
    "Conheça o MedTurn, sistema para gestão de escalas médicas, trocas de plantão e fechamento financeiro.",
};

export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}