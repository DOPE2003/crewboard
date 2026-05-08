"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { getStaffRole } from "@/lib/auth-utils";
import { notifyUser } from "@/lib/notify";

async function getSessionUserId() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");
  return userId;
}

export type TicketCategory = "general" | "billing" | "order" | "account" | "bug" | "other";

export async function submitTicket({
  subject, category, body,
}: {
  subject: string;
  category: TicketCategory;
  body: string;
}) {
  const userId = await getSessionUserId();

  if (!subject.trim()) throw new Error("Subject is required.");
  if (!body.trim())    throw new Error("Message is required.");
  if (subject.length > 200) throw new Error("Subject is too long.");
  if (body.length > 5000)   throw new Error("Message is too long.");

  // Throttle: max 3 open tickets per user
  const openCount = await db.supportTicket.count({
    where: { userId, status: { in: ["open", "in-progress"] } },
  });
  if (openCount >= 3) throw new Error("You already have 3 open tickets. Please wait for a response.");

  const ticket = await db.supportTicket.create({
    data: {
      userId,
      subject: subject.trim(),
      category,
      body: body.trim(),
    },
  });

  // Notify all support staff
  const staff = await db.user.findMany({
    where: { role: { in: ["SUPPORT", "ADMIN", "OWNER"] } },
    select: { id: true },
  });
  await Promise.allSettled(
    staff.map((s) =>
      notifyUser({
        userId: s.id,
        type: "support_ticket",
        title: "New Support Ticket",
        body: subject.trim(),
        link: `/admin/support?id=${ticket.id}`,
      }).catch(() => {})
    )
  );

  return { id: ticket.id };
}

export async function getMyTickets() {
  const userId = await getSessionUserId();
  return db.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, subject: true, category: true,
      status: true, createdAt: true, resolvedAt: true, staffNote: true,
    },
  });
}

// ─── Staff actions ────────────────────────────────────────────────────────────

export async function getAllTickets(filters?: { status?: string; q?: string }) {
  const role = await getStaffRole();
  if (!role) redirect("/");

  const where: any = {};
  if (filters?.status && filters.status !== "all") where.status = filters.status;
  if (filters?.q) {
    where.OR = [
      { subject: { contains: filters.q, mode: "insensitive" } },
      { body:    { contains: filters.q, mode: "insensitive" } },
      { user: { OR: [
        { name:          { contains: filters.q, mode: "insensitive" } },
        { twitterHandle: { contains: filters.q, mode: "insensitive" } },
        { email:         { contains: filters.q, mode: "insensitive" } },
      ]}},
    ];
  }

  return db.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, twitterHandle: true, image: true, email: true } },
    },
    take: 100,
  });
}

export async function updateTicketStatus({
  ticketId, status, staffNote,
}: {
  ticketId: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  staffNote?: string;
}) {
  const role = await getStaffRole();
  if (!role) throw new Error("Unauthorized");

  const resolvedAt = ["resolved", "closed"].includes(status) ? new Date() : null;

  const ticket = await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      staffNote: staffNote?.trim() ?? undefined,
      resolvedAt: resolvedAt ?? undefined,
    },
    select: { userId: true, subject: true },
  });

  // Notify the user if resolved/closed
  if (status === "resolved" || status === "closed") {
    notifyUser({
      userId: ticket.userId,
      type: "support_ticket",
      title: "Support ticket resolved",
      body: `Your ticket "${ticket.subject}" has been ${status}.`,
      link: "/support",
    }).catch(() => {});
  }

  return { ok: true };
}
