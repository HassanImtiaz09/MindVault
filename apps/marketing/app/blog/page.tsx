import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "DocVault blog — tips, updates, and insights on medical knowledge management.",
};

const posts = [
  {
    slug: "#",
    title: "Introducing DocVault: AI-Powered Medical Memory",
    excerpt:
      "We built DocVault because medical professionals deserve better tools for knowledge management. Here's our vision for the future of medical revision.",
    date: "8 May 2026",
    category: "Announcement",
  },
  {
    slug: "#",
    title: "5 Evidence-Based Strategies for UKMLA Preparation",
    excerpt:
      "The new UK Medical Licensing Assessment requires a different approach to revision. We explore spaced repetition, active recall, and how AI can help.",
    date: "Coming soon",
    category: "Study Tips",
  },
  {
    slug: "#",
    title: "How AI Extraction Works in DocVault",
    excerpt:
      "A technical deep-dive into how we use AI to automatically extract, summarise, and tag your medical knowledge from multiple source types.",
    date: "Coming soon",
    category: "Product",
  },
];

export default function BlogPage() {
  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          <p className="mt-4 text-lg text-gray-500">
            Tips, updates, and insights on medical knowledge management.
          </p>
        </div>

        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.title}
              className="p-6 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-600">
                  {post.category}
                </span>
                <span className="text-sm text-gray-400">{post.date}</span>
              </div>
              <Link href={post.slug}>
                <h2 className="text-xl font-semibold text-gray-900 hover:text-brand-500 transition-colors">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-2 text-gray-500">{post.excerpt}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center p-8 bg-brand-50 rounded-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Subscribe to updates</h2>
          <p className="mt-2 text-gray-500">
            Get notified when we publish new articles. No spam, unsubscribe anytime.
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Email{" "}
            <a href="mailto:blog@docvault.uk" className="text-brand-500 hover:underline">
              blog@docvault.uk
            </a>{" "}
            to subscribe.
          </p>
        </div>
      </div>
    </div>
  );
}
