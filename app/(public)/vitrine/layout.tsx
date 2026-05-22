import type { Metadata } from "next";
import VitrineMotionProvider from "./_components/VitrineMotionProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.medturnapp.com"),
  title: "MedTurn | Gestão de escalas médicas para hospitais e serviços",
  description:
    "Conheça o MedTurn, sistema para gestão de escalas médicas, trocas de plantão com aprovação e fechamento financeiro mais organizado para hospitais, coordenações e serviços médicos.",
  openGraph: {
    title: "MedTurn | Gestão de escalas médicas para hospitais e serviços",
    description:
      "Organize escalas médicas, aprove trocas de plantão com mais segurança e reduza o retrabalho no fechamento financeiro com o MedTurn.",
    url: "https://www.medturnapp.com/vitrine",
    siteName: "MedTurn",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-medturn-vitrine.png",
        width: 1200,
        height: 630,
        alt: "MedTurn - Gestão de escalas médicas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MedTurn | Gestão de escalas médicas para hospitais e serviços",
    description:
      "Organize escalas médicas, aprove trocas de plantão com mais segurança e reduza o retrabalho no fechamento financeiro com o MedTurn.",
    images: ["/og-medturn-vitrine.png"],
  },
};

export default function VitrineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VitrineMotionProvider>{children}</VitrineMotionProvider>;
}
