// All copy for the /websites trail lives here so it can be edited without
// touching components. Prices and terms live in `services` and `terms`;
// keep the two in step when either changes.

export const sites = {
  hero: {
    badgeIcon: "🥾",
    badge: "Trailhead",
    // The headline renders as `headline` + highlighted `headlineAccent`.
    headline: "Fast websites that actually",
    headlineAccent: "bring in customers.",
    sub: "New sites, rebuilds, speed fixes, integrations with the tools you already run, and ongoing care — for businesses that need their website to pull its weight.",
    primaryCta: { label: "Get a free site audit", href: "#contact" },
    secondaryCta: { label: "See the results", href: "#overlook" },
    // Short proof points under the CTAs. Keep these to verifiable facts.
    // (The +244% result has its own card beside the hero copy: `highlight`.)
    proof: [
      "Based in Spokane / Coeur d'Alene",
      "Fixed quote before work starts",
    ],
    // Result teaser beside the hero copy (from the case study below).
    highlight: {
      value: "+244%",
      label: "Lead submissions",
      detail: "9 → 31 leads after one local retailer's rebuild",
      client: "Quality Stoves & Spas",
    },
  },

  caseStudy: {
    id: "overlook",
    badgeIcon: "🔭",
    badge: "Overlook",
    title: "What happened when one retailer rebuilt",
    business: "Quality Stoves & Spas",
    url: "https://qualitystovesandspas.com",
    urlLabel: "qualitystovesandspas.com",
    eyebrow: "Case study",
    launched: "Launched Aug 12, 2026",
    problem:
      "A hearth and spa retailer's aging Showit site was slow, hard to extend, and quietly costing them business.",
    solution:
      "I rebuilt it as a custom site, statically prerendered and served from the edge, with their product manuals moved to fast object storage. It launched August 12, 2026 — and the numbers moved immediately.",
    resultsLabel: "The results",
    // Before/after numbers drive the comparison bars; `detail` is the
    // context line under them. Same figures as before, just structured.
    outcomes: [
      {
        value: "+244%",
        label: "Lead submissions",
        before: { value: 9, display: "9 leads" },
        after: { value: 31, display: "31 leads" },
        detail: "Five weeks before vs. five weeks after launch.",
      },
      {
        value: "−39%",
        label: "Server response time",
        before: { value: 391, display: "391 ms" },
        after: { value: 237, display: "237 ms" },
        detail: "Average. Faster pages mean fewer visitors leave before the site even loads.",
      },
      {
        value: "+49%",
        label: "Core-market traffic",
        before: { value: 697, display: "697 users" },
        after: { value: 1042, display: "1,042 users" },
        detail: "Active users from Washington and Idaho, year over year.",
      },
    ],
    scores: {
      value: "93–100",
      label: "Google quality scores",
      items: [
        { label: "Performance", value: 93 },
        { label: "Accessibility", value: 96 },
        { label: "Best practices", value: 96 },
        { label: "SEO", value: 100 },
      ],
      detail: "Zero layout shift as pages load.",
    },
    footnoteLabel: "Sources",
    footnote:
      "Results for this one client, not a guarantee. Lead events Jun 13 – Jul 19 vs Aug 13 – Sep 19, 2026 (GA4); traffic Aug 13 – Sep 19, 2025 vs 2026 (GA4); response time Jun 20 – Sep 17, 2026 (Google Search Console); Lighthouse 13.4.1 via PageSpeed Insights, Sep 19, 2026.",
    underTheHood: {
      label: "Under the hood",
      body: "Next.js, statically prerendered, Cloudflare edge caching, R2 storage for manuals, GA4, Lighthouse. You don't need to know what any of that means — it's the same tooling behind sites that handle millions of visitors, sized for a local business.",
    },
    screenshots: [
      {
        src: "/screenshots/qualitystoves-home.png",
        alt: "Quality Stoves & Spas homepage after the rebuild",
        caption: "The rebuilt homepage",
      },
      {
        src: "/screenshots/qualitystoves-products.png",
        alt: "Quality Stoves & Spas product catalog page",
        caption: "Product catalog",
      },
    ],
    alsoBuiltLabel: "Also built",
    alsoBuilt: [
      {
        name: "Caeranthil",
        tag: "Web application",
        description:
          "An event-management platform with real-time dashboards and user management — proof this isn't only marketing sites. If your business needs a custom web application, that works too.",
        screenshot: {
          src: "/screenshots/caeranthil-dashboard.png",
          alt: "Caeranthil event management dashboard",
        },
      },
      {
        name: "NetSuite integration",
        tag: "Business systems",
        // Data flow shown in place of a screenshot (from the description).
        flow: ["Quo", "n8n add-on", "NetSuite"],
        description:
          "On the business-systems side, separate from websites: an n8n add-on for NetSuite, connected with custom certificates, that brings Quo message data into the ERP. If your tools don't talk to each other, I can fix that too.",
        screenshot: null,
      },
    ],
  },

  services: {
    id: "services",
    badgeIcon: "⛰️",
    badge: "Switchbacks",
    title: "What I can do for you",
    items: [
      {
        name: "Site Speed & Lead Audit",
        icon: "audit",
        price: "Free",
        // Optional delivery window, e.g. "Delivered in 5 business days".
        // Hidden on the page while empty.
        turnaround: "",
        description:
          "A short written or video walkthrough of your site in plain English: what's slowing it down, what's costing you leads, and what to fix first. No obligation.",
      },
      {
        name: "New Site or Rebuild",
        icon: "site",
        price: "From $1,500",
        description:
          "For businesses starting fresh or stuck on Showit, Wix, Squarespace, or an old WordPress site. Fast, easy to update, and built around whatever action you want visitors to take — call, book, buy, or walk in. Starter sites from $1,500, standard sites from $2,500.",
      },
      {
        name: "Integrations & Custom Features",
        icon: "integrations",
        price: "Scoped per project",
        description:
          "Connect your site and business tools: CRM or ERP, messaging, booking, quoting, inventory, payments, email, dashboards, customer portals. Secure, certificate-based connections where needed.",
      },
      {
        name: "Hosting & Maintenance",
        icon: "hosting",
        price: "From $49/mo",
        description:
          "Monthly care plans: hosting on Cloudflare, SSL, uptime monitoring, backups, and time for small edits every month. You never think about the website — it just works.",
      },
    ],
    cta: {
      text: "Not sure which one you need? Start with a free audit or discovery call.",
      label: "Start the conversation",
      href: "#contact",
      // Secondary link to the pricing & terms section.
      termsLabel: "Pricing & terms",
      termsHref: "#terms",
    },
  },

  whoItsFor: {
    id: "who",
    badgeIcon: "🧭",
    badge: "Crossroads",
    title: "Two kinds of businesses",
    columns: [
      {
        heading: "Local & showroom-based businesses",
        icon: "local",
        body: "Retailers, dealers, contractors, and service companies whose site feels slow on a phone or hasn't been touched in years.",
      },
      {
        heading: "Growing businesses & startups",
        icon: "growing",
        body: "Teams that need a real site or web app built properly, a site that's outgrown its template, or a developer who's actually reachable after launch.",
      },
    ],
    closing:
      "If your site was built by someone you can't get hold of anymore, that counts too.",
  },

  howItWorks: {
    id: "how",
    badgeIcon: "🗺️",
    badge: "Route Plan",
    title: "Four steps, no surprises",
    steps: [
      {
        title: "Audit or discovery call",
        body: "We look at what you have (or don't have) and what you need it to do. Free, plain English, no obligation.",
      },
      {
        title: "Plan & fixed quote",
        body: "You get a written plan and a fixed price before any work starts. No hourly meter running on the build.",
      },
      {
        title: "Build",
        body: "I build, and you review a live preview as it comes together — not a surprise reveal at the end.",
      },
      {
        title: "Launch & ongoing care",
        body: "The site goes live, and I stick around: hosting, backups, monitoring, updates, small changes.",
      },
    ],
  },

  // "How I work": prices and contract terms in plain English. The written
  // agreement each client signs is the source of truth; keep this in step.
  terms: {
    id: "terms",
    badgeIcon: "📜",
    badge: "Trail Rules",
    title: "How I work",
    intro:
      "Clear prices and plain terms, so you know exactly what you're signing up for before anything starts.",
    pricing: {
      title: "Pricing",
      items: [
        {
          name: "Site audit",
          detail: "A short written or video walkthrough of what to fix",
          price: "Free",
        },
        {
          name: "Starter site",
          detail: "3–5 pages, mobile-ready, contact form, basic SEO",
          price: "from $1,500",
        },
        {
          name: "Standard site",
          detail: "6–10 pages, custom design, Google Business setup",
          price: "from $2,500",
        },
        {
          name: "Changes & extra work",
          detail: "Edits and anything beyond what's included",
          price: "$55/hr",
        },
      ],
    },
    // Short cards, each a few plain-English points.
    cards: [
      {
        title: "Payment",
        icon: "payment",
        points: [
          "50% deposit to start, 50% when you approve the finished site.",
          "The site goes live once the final payment is in.",
          "Paid by invoice, by card or bank transfer. Invoices are due within 14 days.",
          "The deposit is non-refundable once work has started.",
        ],
      },
      {
        title: "Revisions",
        icon: "revisions",
        points: [
          "Two rounds of revisions are included.",
          "Extra rounds are billed at the hourly rate.",
        ],
      },
      {
        title: "Changes",
        icon: "changes",
        points: [
          "Anything outside the agreed scope gets a written quote first, so you can decide before any extra work starts.",
        ],
      },
      {
        title: "Ownership",
        icon: "ownership",
        points: [
          "Once it's paid in full, the finished site and its content are yours.",
          "I keep the rights to reusable code and tools, and may show the work in my portfolio.",
          "You buy and own your own domain name.",
        ],
      },
    ],
    carePlans: {
      title: "Care plans",
      intro: "A monthly plan keeps your site hosted on Cloudflare, backed up, and looked after.",
      plans: [
        {
          name: "Basic",
          price: "$49",
          period: "/mo",
          features: [
            "Hosting on Cloudflare",
            "SSL certificate",
            "Uptime monitoring",
            "Backups",
            "Up to 30 min of small edits a month",
          ],
        },
        {
          name: "Growth",
          price: "$99",
          period: "/mo",
          features: [
            "Everything in Basic",
            "Up to 2 hrs of edits a month",
            "Monthly traffic report",
            "Google Business profile help",
          ],
        },
      ],
    },
    timeline: {
      title: "Timeline",
      text: "A typical starter site takes a few weeks. Most of that depends on how quickly content and feedback come in.",
    },
    agreement: "Full details are in a simple written agreement before any work starts.",
    business: "William Barnhart · Sole proprietor · Spokane Valley, WA",
  },

  about: {
    id: "about",
    badgeIcon: "🏠",
    badge: "Lodge",
    title: "The person behind the work",
    body: "I'm William Barnhart, based in the Spokane / Coeur d'Alene area and available remotely. I run hosting infrastructure for other businesses, build full-stack web applications, and manage the Quality Stoves & Spas site day to day — so when you call, you reach the person who built the thing.",
    cta: { label: "Get in touch", href: "#contact" },
    // Quick facts beside the bio, restating the bio itself.
    facts: [
      "Spokane / Coeur d'Alene",
      "Available remotely",
      "Builds and hosts sites",
    ],
    secondaryCta: { label: "See my infrastructure work", href: "/infrastructure" },
  },

  contact: {
    id: "contact",
    badgeIcon: "✍️",
    badge: "Summit Register",
    title: "Tell me what your website should be doing",
    body: "Send a note and you'll reach me directly, not a ticket queue. If you have a site already, include the address and I'll take a look before we talk.",
    fields: {
      name: "Your name",
      email: "Your email",
      business: "Business name",
      website: "Website",
      optional: "Optional",
      message: "What do you need help with?",
      submit: "Send it",
      sending: "Sending…",
      submitNote: "Goes straight to my inbox. I'll reply by email.",
      privacyPrefix: "By sending, you agree to the",
      privacyLabel: "Privacy Policy",
      privacyHref: "/privacy",
    },
    // Form endpoint: a Cloudflare Pages Function (functions/api/contact.ts).
    endpoint: "/api/contact",
    status: {
      successTitle: "Thanks — your note is on its way.",
      successBody: "It came straight to me, and I'll reply to the email address you gave.",
      sendAnother: "Send another note",
      errorTitle: "That didn't send.",
      errorGeneric: "Something went wrong on my end.",
      errorFallback: "Please email me instead",
      errorFallbackNote: "(opens your email app with your note filled in), or try again.",
    },
    directLabel: "Or reach me directly",
    location: "Spokane / Coeur d'Alene",
    // What happens after a note comes in (restates the copy above and the
    // first step of "Four steps, no surprises").
    nextLabel: "What happens next",
    nextSteps: [
      "Your note comes straight to me, not a ticket queue.",
      "If you have a site, I take a look before we talk.",
      "We talk it through — free, plain English, no obligation.",
    ],
    email: "willbarnh@gmail.com",
    phone: "(509) 279-5635",
    phoneHref: "tel:+15092795635",
  },

  header: {
    cta: { label: "Get in touch", href: "#contact" },
  },

  footer: {
    tagline: "Websites for local businesses and startups · Spokane / Coeur d'Alene",
    backToTop: "Back to top",
  },

  crossLink: {
    label: "Infrastructure & sysadmin work",
    shortLabel: "Infrastructure",
    href: "/infrastructure",
  },
} as const;
