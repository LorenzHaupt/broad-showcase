import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import type { Unsubscribe } from "@lorenz/browser-message-bus";
import { ShowcaseBusService } from "./showcase-bus.service";

@Component({
  selector: "app-viewer-page",
  standalone: true,
  template: `
    <main class="small-page">
      <p class="kicker">Targeted Consumer</p>
      <h1>Viewer</h1>
      <p class="lead">Eigenständige Angular-Laufzeit im selben Origin.</p>

      <div class="runtime viewer-runtime">
        <span class="status-dot" aria-hidden="true"></span>
        <strong>{{ status() }}</strong>
        <span><code>{{ short(showcase.messageBus.instanceId) }}</code></span>
      </div>

      <section class="viewer-document">
        <span class="label">Aktuelles Dokument</span>
        @if (documentId()) {
          <strong>{{ documentId() }}</strong>
          <p>Der Host hat genau diese Viewer-Instanz adressiert.</p>
        } @else {
          <strong>Kein Dokument</strong>
          <p>Wähle diesen Viewer im Host und sende einen Befehl.</p>
        }
      </section>

      <div class="controls">
        <button class="ghost" (click)="clear()">Leeren</button>
        <button (click)="closeWindow()">Fenster schließen</button>
      </div>
    </main>
  `
})
export class ViewerPageComponent implements OnInit, OnDestroy {
  readonly showcase = inject(ShowcaseBusService);
  readonly documentId = signal<string | null>(null);
  readonly status = signal<"idle" | "open">("idle");

  private unsubscribeCommand?: Unsubscribe;
  private unsubscribeRequest?: Unsubscribe;

  ngOnInit(): void {
    this.unsubscribeCommand = this.showcase.messageBus.subscribe("viewer.command", (payload, context) => {
      if (payload.command === "open") {
        this.documentId.set(payload.documentId ?? "unbekannt");
        this.status.set("open");
        this.publishState(context.source.instanceId);
        return;
      }

      if (payload.command === "clear") {
        this.clear();
        this.publishState(context.source.instanceId);
        return;
      }

      if (payload.command === "close") {
        void this.showcase.messageBus.close().finally(() => window.close());
      }
    });

    this.unsubscribeRequest = this.showcase.requests.handle("viewer.state.get", () => ({
      instanceId: this.showcase.messageBus.instanceId,
      documentId: this.documentId(),
      status: this.status()
    }));
  }

  ngOnDestroy(): void {
    this.unsubscribeCommand?.();
    this.unsubscribeRequest?.();
  }

  clear(): void {
    this.documentId.set(null);
    this.status.set("idle");
    this.showcase.messageBus.publish("viewer.state.changed", {
      documentId: null,
      status: "idle"
    });
  }

  closeWindow(): void {
    void this.showcase.messageBus.close().finally(() => window.close());
  }

  short(value: string): string {
    return value.length <= 10 ? value : `${value.slice(0, 8)}…`;
  }

  private publishState(targetInstanceId: string): void {
    this.showcase.messageBus.publish(
      "viewer.state.changed",
      { documentId: this.documentId(), status: this.status() },
      { target: { instanceId: targetInstanceId } }
    );
  }
}
