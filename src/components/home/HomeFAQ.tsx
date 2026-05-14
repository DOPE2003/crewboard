"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "What is Crewboard?",
    a: "Crewboard is a Web3-native freelancer marketplace built on Solana. It connects clients with verified creative and technical talent — designers, developers, content creators, and AI engineers — with on-chain escrow ensuring every payment is secure and transparent.",
  },
  {
    q: "How does escrow payment work?",
    a: "When you hire a freelancer, funds are locked in a Solana smart contract escrow. The freelancer delivers the work, you review it, and funds are released instantly upon approval. If there's a dispute, Crewboard's moderation team steps in — your money is always protected.",
  },
  {
    q: "Is it free to join Crewboard?",
    a: "Yes — signing up and browsing talent is completely free. Freelancers list their services at no cost. Crewboard charges a small platform fee only when a project is successfully completed.",
  },
  {
    q: "How do I get paid as a freelancer?",
    a: "Once a client approves your delivery, payment is released directly to your connected Solana wallet. There's no waiting period and no payment processor holding your funds — it settles on-chain in seconds.",
  },
  {
    q: "What types of services can I find on Crewboard?",
    a: "You'll find talent across Graphic Design, Web3 Development, Content Creation, Social Marketing, Motion Graphics, AI Engineering, and more. Use the category filter or search to find exactly the specialist you need.",
  },
  {
    q: "How do I know a freelancer is trustworthy?",
    a: "Every freelancer has a verified profile showing completed orders, total earnings, star ratings, portfolio work, and on-chain wallet activity. You can also DM freelancers directly before committing to a project to align on scope and expectations.",
  },
  {
    q: "Can I post a job instead of browsing freelancers?",
    a: "Absolutely. Post a job with your requirements and budget, and freelancers will apply directly. You review proposals, chat with candidates, and hire the best fit — all within the platform.",
  },
  {
    q: "What happens if there's a dispute?",
    a: "Crewboard has a built-in dispute resolution system. Either party can raise a dispute during the order period. Our moderation team reviews the evidence and mediates a fair resolution, with funds held safely in escrow throughout.",
  },
];

export default function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {FAQS.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`faq-item${isOpen ? " faq-item--open" : ""}`}>
            <button
              className="faq-trigger"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="faq-question">{faq.q}</span>
              <span className="faq-chevron" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>
            <div
              className="faq-body"
              style={{
                maxHeight: isOpen ? "400px" : "0",
                opacity: isOpen ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s ease, opacity 0.25s ease",
              }}
            >
              <p className="faq-answer">{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
