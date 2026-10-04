import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Ext, LEGAL, LegalSection, Mail } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  metadataBase: new URL("https://litendurance.dev"),
  title: "Privacy Policy — William Barnhart",
  description:
    "How litendurance.dev handles contact form messages, payments, hosting logs, and client project data. Plain English, no ad tracking.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — William Barnhart",
    description: "How litendurance.dev handles your information, in plain English.",
    type: "article",
    url: "/privacy",
  },
};

const TOC: [string, string][] = [
  ["collect", "What I collect"],
  ["use", "How I use it"],
  ["payments", "Payments (Stripe)"],
  ["hosting", "Hosting and security (Cloudflare)"],
  ["tracking", "Cookies, analytics and tracking"],
  ["retention", "How long I keep it"],
  ["clients", "Client project data"],
  ["rights", "Your choices and rights"],
  ["children", "Children"],
  ["changes", "Changes to this policy"],
  ["contact", "Contact"],
];

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy Policy"
      effective="October 4, 2026"
      toc={TOC}
      lede={
        <p>
          This policy explains what information {LEGAL.site} collects, why, and what happens to it.
          The site is run by {LEGAL.operator}, a sole proprietor based in {LEGAL.location}{" "}(&ldquo;I&rdquo;,
          &ldquo;me&rdquo;). The short version: I only collect what you choose to send me, I use it to
          reply and do the work, and I never sell it.
        </p>
      }
    >
      <LegalSection id="collect" title="1. What I collect">
        <h3>When you use a contact form</h3>
        <p>
          The contact forms on this site ask for your <strong>name</strong>, <strong>email address</strong>{" "}
          and <strong>message</strong>. The form on the websites page also asks for your{" "}
          <strong>business name</strong> and, optionally, your <strong>website</strong>. That&apos;s all the
          forms collect.
        </p>
        <p>
          When you press send, your message goes to a small server function on Cloudflare, which
          passes it to{" "}
          <Ext href="https://resend.com/legal/privacy-policy">Resend</Ext>, an email delivery service,
          to be emailed to me. It arrives in my email inbox (Gmail, run by{" "}
          <Ext href="https://policies.google.com/privacy">Google</Ext>). The site doesn&apos;t keep a
          separate database of messages.
        </p>
        <h3>When you email, call or message me directly</h3>
        <p>
          I receive whatever you include, such as your name, contact details and what you tell me
          about your project.
        </p>
        <h3>Automatically, when you visit</h3>
        <p>
          Like any website, the servers that deliver these pages see technical details such as your
          IP address, browser type, the page requested and the time. That&apos;s handled by Cloudflare;
          see <a href="#hosting" className="legal-link">Hosting and security</a> below.
        </p>
      </LegalSection>

      <LegalSection id="use" title="2. How I use it">
        <ul>
          <li>To read and reply to your message, and to follow up about the work you asked about.</li>
          <li>To prepare quotes, agreements and invoices, and to do and support the work if you hire me.</li>
          <li>To keep the site secure and working, for example blocking spam and abuse.</li>
          <li>To keep the business records the law requires (for example, for taxes).</li>
        </ul>
        <p>
          I don&apos;t sell, rent or trade your information, and I don&apos;t add you to marketing or
          newsletter lists. I only share it with the service providers named in this policy, as
          needed to run the site and the business, or if the law requires it.
        </p>
      </LegalSection>

      <LegalSection id="payments" title="3. Payments (Stripe)">
        <p>
          If you pay an invoice by card, the payment is processed by{" "}
          <Ext href="https://stripe.com/privacy">Stripe</Ext>. You enter your card details on
          Stripe&apos;s pages, not on this site, and I never see or store your full card number. Stripe
          shares what I need to run the business with me, such as your name, email, the amount paid
          and the payment status. Stripe&apos;s handling of your payment information is covered by
          the{" "}
          <Ext href="https://stripe.com/privacy">Stripe Privacy Policy</Ext>. If you pay by bank
          transfer instead, the transfer is handled by our banks.
        </p>
      </LegalSection>

      <LegalSection id="hosting" title="4. Hosting and security (Cloudflare)">
        <p>
          This site is hosted on Cloudflare Pages and served through Cloudflare&apos;s network, which
          also runs the contact form function. To deliver pages and protect the site, Cloudflare
          processes request data such as your IP address, browser details and the pages requested,
          and keeps server logs. Cloudflare may set a cookie only when it&apos;s needed for security or
          performance, such as telling people apart from bots. It isn&apos;t used for advertising.
          Cloudflare may also give me aggregated, cookie-free traffic statistics such as page
          views and country, which don&apos;t identify you.
        </p>
        <p>
          See the{" "}
          <Ext href="https://www.cloudflare.com/privacypolicy/">Cloudflare Privacy Policy</Ext> for
          details.
        </p>
      </LegalSection>

      <LegalSection id="tracking" title="5. Cookies, analytics and tracking">
        <ul>
          <li>
            <strong>No ad tracking.</strong> There are no advertising pixels, social media trackers or
            third-party analytics scripts (such as Google Analytics) on this site.
          </li>
          <li>
            <strong>No cookies of my own.</strong> The site itself doesn&apos;t set cookies. The only
            cookies you may get are Cloudflare&apos;s security or performance cookies described above.
          </li>
          <li>
            <strong>Fonts are served from this site.</strong> Typefaces are bundled with the site
            and load from {LEGAL.site}, so your browser doesn&apos;t contact Google Fonts or any other
            font service.
          </li>
          <li>
            <strong>Saved settings stay on your device.</strong> The infrastructure page&apos;s
            climbing game saves your progress, sound settings and terminal layout in your
            browser&apos;s local storage so they&apos;re still there next time. That data never leaves
            your device, and clearing your browser&apos;s site data removes it.
          </li>
          <li>
            <strong>Performance timing stays in your browser.</strong> The site measures its own
            loading speed (Web Vitals) inside your browser for debugging. Those numbers aren&apos;t
            sent anywhere.
          </li>
        </ul>
        <p>
          Links to other websites (for example, client sites in my portfolio, Stripe or Cloudflare)
          are covered by those sites&apos; own privacy policies.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="6. How long I keep it">
        <ul>
          <li>
            <strong>Inquiries:</strong> I keep messages for as long as they&apos;re useful for replying
            and following up, and I clear out old ones that didn&apos;t turn into work.
          </li>
          <li>
            <strong>Client records:</strong> agreements, invoices and payment records are kept as
            long as tax and accounting rules require, which is usually several years.
          </li>
          <li>
            <strong>Server logs:</strong> Cloudflare keeps these according to its own retention
            policies.
          </li>
        </ul>
        <p>You can ask me to delete your information sooner; see your choices and rights below.</p>
      </LegalSection>

      <LegalSection id="clients" title="7. Client project data">
        <p>
          If you hire me, I may get access to things like your site content, customer-facing data,
          hosting or domain accounts and passwords. I treat all of it as confidential:
        </p>
        <ul>
          <li>I use it only to do the work you&apos;ve asked for.</li>
          <li>
            I don&apos;t share it with anyone except the services needed to do that work (for example,
            your hosting provider), or if you ask me to.
          </li>
          <li>
            When the project ends, or whenever you ask, I return or delete what you gave me. You can
            change any passwords you shared at any time, and I recommend doing so after handoff.
          </li>
        </ul>
        <p>Your written agreement may include more detail and takes priority for that project.</p>
      </LegalSection>

      <LegalSection id="rights" title="8. Your choices and rights">
        <p>
          You can email me at <Mail /> to ask what information I have about you, to correct it, or
          to delete it. I&apos;ll reply within 30 days. I may need to keep some records, such as
          invoices, when the law requires it, and I&apos;ll tell you if that applies. You can also
          simply not use the contact forms and email me directly instead.
        </p>
      </LegalSection>

      <LegalSection id="children" title="9. Children">
        <p>
          This site is for businesses and adults. It isn&apos;t directed at children under 13, and I
          don&apos;t knowingly collect information from them. If you believe a child has sent me
          information, email me and I&apos;ll delete it.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="10. Changes to this policy">
        <p>
          If I change how I handle information, I&apos;ll update this page and the effective date at
          the top. If a change is significant, I&apos;ll point it out on this page.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <p>Questions or requests about your information:</p>
        <div className="legal-contact">
          {LEGAL.operator}
          <br />
          Sole proprietor · {LEGAL.location}
          <br />
          <Mail />
        </div>
        <p>
          See also the <Link href="/terms" className="legal-link">Website Terms of Use</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
