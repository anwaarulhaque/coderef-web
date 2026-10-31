import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Content & copyright", description: "Who owns CodeRef's content, how third-party material is handled, and how to send a copyright notice.", path: "/copyright/" });

export default function Page() {
  return (
    <LegalPage title="Content & copyright" updated="October 31, 2026">
      <p>This page explains who owns the content on coderef.xyz and how to tell us about a problem with it.</p>

      <h2>Our content</h2>
      <p>
        The cheat sheets, quick references, explanations, code examples and tool interfaces on CodeRef are created and curated by the CodeRef team. We use AI-assisted tools to draft some of it, and we review it before publishing. We own or have the right to publish and charge for this content. Please don&apos;t republish it in bulk without asking.
      </p>

      <h2>AI-assisted content</h2>
      <p>
        Some of our text and examples are drafted with AI-assisted tools and then reviewed and edited by the team. We don&apos;t knowingly publish text copied from other sources, and we check that pages are our own work and not reproductions of official documentation. If you find a passage that matches your work too closely, tell us and we will rewrite or remove it.
      </p>

      <h2>Using our content</h2>
      <ul>
        <li>You are welcome to link to any CodeRef page.</li>
        <li>You may quote short excerpts with credit and a link back to the page.</li>
        <li>Short code examples are meant to be copied into your own projects.</li>
        <li>Please don&apos;t copy whole pages, scrape the site in bulk, or resell our content as your own.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        What you save in your account (palettes, requests, documents) stays yours. You give us permission to store it and to show it to anyone you share a link with, only to run the service. See the <Link href="/terms/">terms of service</Link>.
      </p>

      <h2>Third-party material</h2>
      <ul>
        <li>We don&apos;t copy official documentation. We link to it from each page so you can read the source.</li>
        <li>Browser support data is built on open compatibility datasets.</li>
        <li>Some DESIGN.md files in the design library are written by the CodeRef team. Others are created by third parties under their own licences, which we credit. A third-party file without an open licence is linked to its source and is not hosted or sold by us.</li>
        <li>Product, company and technology names belong to their owners. Using a name does not mean the owner endorses or is affiliated with CodeRef.</li>
      </ul>

      <h2>What CodeRef Pro charges for</h2>
      <p>
        Paid plans cover features: cloud save, share links and exports. We do not sell third-party content. See <Link href="/pricing/">pricing</Link> and the <Link href="/terms/">terms of service</Link>.
      </p>

      <h2>Report a copyright problem</h2>
      <p>
        If you believe something on CodeRef infringes your copyright, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with:
      </p>
      <ul>
        <li>The URL of the page or file.</li>
        <li>A description of the work you say is infringed, and where it lives.</li>
        <li>Your name and contact details.</li>
        <li>A statement that you are the owner or are authorised to act for the owner, and that the information you give is accurate.</li>
      </ul>
      <p>We review notices promptly and remove or correct material when a claim is valid. We may tell the person who published the item that a notice was received. If you think a notice about your content is mistaken, write to the same address with your name, the URL and the reason, and we will take another look.</p>
      <p>Accounts that repeatedly publish infringing material may be suspended.</p>

      <h2>Report a mistake</h2>
      <p>Reference content can contain errors. If you find one, write to the same address and we will fix it.</p>
    </LegalPage>
  );
}
