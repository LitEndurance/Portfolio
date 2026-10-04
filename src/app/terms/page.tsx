import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LEGAL, LegalSection, Mail } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  metadataBase: new URL("https://litendurance.dev"),
  title: "Website Terms of Use — William Barnhart",
  description:
    "The terms for using litendurance.dev: informational content, starting-at pricing, portfolio ownership, warranties, liability, and Washington law.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Website Terms of Use — William Barnhart",
    description: "The short, plain-English terms for using litendurance.dev.",
    type: "article",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Website Terms of Use"
      effective="October 4, 2026"
      lede={
        <p>
          These terms cover your use of {LEGAL.site}, run by {LEGAL.operator}, a sole proprietor based
          in {LEGAL.location}{" "}(&ldquo;I&rdquo;, &ldquo;me&rdquo;). By using the site, you agree to them.
          They&apos;re short on purpose.
        </p>
      }
    >
      <LegalSection id="content" title="1. Information only">
        <p>
          The content on this site, including service descriptions, case studies, results and
          articles, is general information about my work. It isn&apos;t an offer or a promise of
          specific results for your business. I keep it accurate and up to date, but things can
          change.
        </p>
      </LegalSection>

      <LegalSection id="pricing" title="2. Pricing and project terms">
        <p>
          Prices on this site are <strong>starting-at (&ldquo;from&rdquo;) prices</strong> to help you
          plan. The actual price, scope, timeline, payment schedule and other terms for any project
          are set in a <strong>signed written agreement</strong> before work starts. If anything on
          this site differs from your signed agreement, the agreement wins.
        </p>
      </LegalSection>

      <LegalSection id="ownership" title="3. Portfolio work and trademarks">
        <p>
          Portfolio pieces, client websites, screenshots, logos and trademarks shown on this site
          belong to their respective owners and appear here to illustrate my work. Showing them
          doesn&apos;t mean those businesses endorse this site. The site&apos;s own design, text and code
          belong to me. Please don&apos;t copy them wholesale without asking.
        </p>
      </LegalSection>

      <LegalSection id="use" title="4. Using the site">
        <p>
          Please use the site and its contact forms for genuine inquiries only: no spam, automated
          submissions, or attempts to break, overload or get around the site&apos;s security. How I
          handle what you send is explained in the{" "}
          <Link href="/privacy" className="legal-link">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="warranty" title="5. No warranties">
        <p>
          The site is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the fullest extent
          the law allows, I make no warranties of any kind about the site, including that it will
          be error-free, uninterrupted or fit for a particular purpose. Warranties for paid work, if
          any, are only those in your written agreement.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="6. Limitation of liability">
        <p>
          To the fullest extent the law allows, I&apos;m not liable for any indirect, incidental,
          special, consequential or punitive damages, or for lost profits, revenue or data, arising
          from your use of this site or reliance on its content. Links to other websites are
          provided for convenience, and I&apos;m not responsible for their content. Nothing here limits
          liability that can&apos;t be limited by law, and your written agreement governs any paid
          work.
        </p>
      </LegalSection>

      <LegalSection id="law" title="7. Governing law">
        <p>
          These terms are governed by the laws of the State of Washington, without regard to its
          conflict-of-law rules. Any dispute about the site will be handled in the state or federal
          courts located in Spokane County, Washington.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="8. Changes">
        <p>
          I may update these terms from time to time. The effective date at the top shows when they
          last changed, and continuing to use the site means you accept the current version.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="9. Contact">
        <p>Questions about these terms:</p>
        <div className="legal-contact">
          {LEGAL.operator}
          <br />
          Sole proprietor · {LEGAL.location}
          <br />
          <Mail />
        </div>
      </LegalSection>
    </LegalPage>
  );
}
