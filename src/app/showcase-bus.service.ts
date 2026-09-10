import { Injectable, OnDestroy, signal } from "@angular/core";
import { createMessageBus, type MessageBus } from "@lorenz/browser-message-bus";
import { persistentLog, type PersistentLogApi } from "@lorenz/browser-message-bus/persistent-log";
import { presence, type PeerInfo, type PresenceApi } from "@lorenz/browser-message-bus/presence";
import { requestReply, type RequestReplyApi } from "@lorenz/browser-message-bus/request-reply";
import type { ShowcaseMessages, ShowcaseRequests } from "./contracts";

export type ShowcaseRole = "host" | "viewer" | "iframe";

const CHANNEL = "browser-message-bus-angular-showcase";

@Injectable({ providedIn: "root" })
export class ShowcaseBusService implements OnDestroy {
  readonly role: ShowcaseRole = detectRole();
  readonly bus: MessageBus<ShowcaseMessages> = createMessageBus<ShowcaseMessages>({
    channel: CHANNEL,
    appId: this.role
  });

  readonly presence: PresenceApi = this.bus.use(
    presence({ heartbeatMs: 4_000, peerTimeoutMs: 14_000 })
  );

  readonly requests: RequestReplyApi<ShowcaseRequests> = this.bus.use(
    requestReply<ShowcaseRequests>({ defaultTimeoutMs: 3_000 })
  );

  readonly log: PersistentLogApi | undefined = this.role === "host"
    ? this.bus.use(
        persistentLog({
          topics: ["demo.broadcast", "viewer.state.changed", "iframe.event"],
          databaseName: "browser-message-bus-angular-showcase",
          maxEntries: 200,
          maxAgeMs: 24 * 60 * 60_000
        })
      )
    : undefined;

  private readonly peersState = signal<readonly PeerInfo[]>(this.presence.peers());
  readonly peers = this.peersState.asReadonly();

  private readonly unsubscribeJoin = this.presence.onJoin(() => this.refreshPeers());
  private readonly unsubscribeLeave = this.presence.onLeave(() => this.refreshPeers());

  private refreshPeers(): void {
    this.peersState.set(this.presence.peers());
  }

  ngOnDestroy(): void {
    this.unsubscribeJoin();
    this.unsubscribeLeave();
    void this.bus.close();
  }
}

function detectRole(): ShowcaseRole {
  if (window.location.pathname.startsWith("/viewer")) return "viewer";
  if (window.location.pathname.startsWith("/iframe")) return "iframe";
  return "host";
}
