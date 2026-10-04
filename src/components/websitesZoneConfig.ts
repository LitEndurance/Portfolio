import { sites } from "@/content/sites";
import type { TrailStop } from "./trailTypes";

// Stops on the /websites trail, one per page section, in page order. Hoop
// positions live in hoopRoutes/websites.json (tagged with these ids); labels
// and icons reuse the section badges from src/content/sites.ts so the 3D hoop
// banners always match the cards.
//
// progressStart is set just before each section's top reaches the top of the
// viewport (re-measure at 1440 wide after changing section heights on
// /websites; last measured section tops after the v7 footer/privacy line:
// overlook .103, services .344, who .468, how .563, terms .658, about .867,
// contact .962). The orb arrives at each hoop exactly when its stop begins.
// The "How I work" section (id "terms") has no hoop of its own: the orb
// keeps climbing from the Route Plan hoop toward the Lodge while it scrolls
// by. Phones run the same thresholds against a longer page (390 wide:
// overlook .081, services .338, who .484, how .558, terms .620, about .850,
// contact .912), so stops land within a few percent of their sections there,
// and the footer after Contact leaves enough scroll for the summit.
//
// Camera path: the route zig-zags up the front (south) face, so the camera
// stays in front of the mountain (angle ~ pi/2) and sways toward the side
// each hoop sits on (larger angle = west/left, smaller = east/right) while
// the radius shrinks and the camera rises with the climb. The infrastructure
// trail orbits the whole peak instead; the two never share a camera path.
export const WEBSITES_STOPS: TrailStop[] = [
  {
    id: "hero",
    icon: sites.hero.badgeIcon,
    label: sites.hero.badge,
    progressStart: 0,
    landmark: { progress: 0.06, angle: 1.68, radius: 24, camY: 3.5 },
    effect: "flicker",
  },
  {
    id: "overlook",
    icon: sites.caseStudy.badgeIcon,
    label: sites.caseStudy.badge,
    progressStart: 0.091,
    landmark: { progress: 0.111, angle: 1.95, radius: 19, camY: 4.5 },
    effect: "aurora",
  },
  {
    id: "services",
    icon: sites.services.badgeIcon,
    label: sites.services.badge,
    progressStart: 0.332,
    landmark: { progress: 0.352, angle: 1.3, radius: 17, camY: 5 },
    effect: "none",
  },
  {
    id: "who",
    icon: sites.whoItsFor.badgeIcon,
    label: sites.whoItsFor.badge,
    progressStart: 0.456,
    landmark: { progress: 0.476, angle: 1.95, radius: 15, camY: 5.5 },
    effect: "none",
  },
  {
    id: "how",
    icon: sites.howItWorks.badgeIcon,
    label: sites.howItWorks.badge,
    progressStart: 0.551,
    landmark: { progress: 0.571, angle: 1.3, radius: 13.5, camY: 6 },
    effect: "none",
  },
  {
    id: "about",
    icon: sites.about.badgeIcon,
    label: sites.about.badge,
    progressStart: 0.855,
    landmark: { progress: 0.875, angle: 1.6, radius: 12, camY: 6 },
    effect: "none",
  },
  {
    id: "contact",
    icon: sites.contact.badgeIcon,
    label: sites.contact.badge,
    progressStart: 0.95,
    landmark: { progress: 0.96, angle: 1.8, radius: 14, camY: 5 },
    effect: "summit",
  },
];
