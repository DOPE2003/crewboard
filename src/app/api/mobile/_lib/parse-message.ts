/**
 * Converts the internal `__PREFIX__:{json}` message body format into a
 * typed structure that iOS clients can consume directly, with no string
 * parsing on the client side.
 */

export type MessageContent =
  | { type: "text"; text: string }
  | { type: "file"; file: FileContent }
  | { type: "offer"; offer: OfferContent }
  | { type: "gig_request"; gigRequest: GigRequestContent };

export interface FileContent {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface OfferContent {
  offerId: string;
  title: string;
  description: string;
  amount: number;
  deliveryDays: number;
  senderId: string;
  status: string;
}

export interface GigRequestContent {
  gigId: string;
  title: string;
}

export function parseMessageBody(body: string): MessageContent {
  if (body.startsWith("__FILE__:")) {
    try {
      const f = JSON.parse(body.slice(9));
      return {
        type: "file",
        file: {
          url: f.url ?? "",
          name: f.name ?? "file",
          size: f.size ?? 0,
          mimeType: f.type ?? "application/octet-stream",
        },
      };
    } catch {
      return { type: "file", file: { url: "", name: "file", size: 0, mimeType: "application/octet-stream" } };
    }
  }

  if (body.startsWith("__OFFER__:")) {
    try {
      const o = JSON.parse(body.slice(10));
      return { type: "offer", offer: o as OfferContent };
    } catch {
      return { type: "offer", offer: { offerId: "", title: "", description: "", amount: 0, deliveryDays: 0, senderId: "", status: "pending" } };
    }
  }

  if (body.startsWith("__GIGREQUEST__:")) {
    try {
      const g = JSON.parse(body.slice(15));
      return { type: "gig_request", gigRequest: { gigId: g.gigId ?? "", title: g.title ?? "" } };
    } catch {
      return { type: "gig_request", gigRequest: { gigId: "", title: "" } };
    }
  }

  return { type: "text", text: body };
}
