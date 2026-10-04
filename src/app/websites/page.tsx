import type { Metadata } from "next";
import { ClimbProvider } from "@/components/ClimbContext";
import AdaptiveMountain from "@/components/AdaptiveMountain";
import SitesBootScreen from "@/components/sites/SitesBootScreen";
import SitesHero from "@/components/sites/SitesHero";
import SitesCaseStudy from "@/components/sites/SitesCaseStudy";
import SitesServices from "@/components/sites/SitesServices";
import SitesWho from "@/components/sites/SitesWho";
import SitesHow from "@/components/sites/SitesHow";
import SitesTerms from "@/components/sites/SitesTerms";
import SitesAbout from "@/components/sites/SitesAbout";
import SitesContact from "@/components/sites/SitesContact";
import SitesFooter from "@/components/sites/SitesFooter";
import "./sites.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://litendurance.dev"),
  title: "Fast Websites for Local Business — William Barnhart",
  description:
    "New sites, rebuilds, speed fixes, integrations, and ongoing care for local businesses and startups. Lead submissions up 244% for a Spokane-area retailer — see the numbers.",
  openGraph: {
    title: "Fast Websites for Local Business — William Barnhart",
    description:
      "New sites, rebuilds, speed fixes, integrations, and ongoing care. Lead submissions up 244% for a Spokane-area retailer — see the numbers.",
    type: "website",
    images: [
      {
        url: "/screenshots/qualitystoves-home.png",
        width: 1880,
        height: 940,
        alt: "Quality Stoves & Spas homepage after its rebuild",
      },
    ],
  },
};

export default function WebsitesPage() {
  return (
    // Used here only for the boot stage the mountain and boot screen share.
    // The summit-climb game (saved progress) and ambient sound belong to the
    // infrastructure page, so this page neither persists climb state nor
    // starts the sound engine.
    <ClimbProvider persist={false} audio={false}>
      {/* Same mountain as the infrastructure trail, but its own hoop route,
          section stops, and camera path (trail="websites"). The camera climbs
          with native scroll via the mountain's own ScrollTrigger. */}
      <AdaptiveMountain trail="websites" />
      {/* .sites-page scopes this page's visual layer (sites.css). */}
      <main className="sites-page relative z-[2]">
        <SitesHero />
        <SitesCaseStudy />
        <SitesServices />
        <SitesWho />
        <SitesHow />
        <SitesTerms />
        <SitesAbout />
        <SitesContact />
        <SitesFooter />
      </main>
      {/* Initialization screen shared with the infrastructure trail (worded
          for this page); scroll stays locked while it is showing. */}
      <SitesBootScreen />
    </ClimbProvider>
  );
}
