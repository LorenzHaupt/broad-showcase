import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import type { Unsubscribe } from "@lorenz/browser-message-bus";
import { ShowcaseBusService } from "./showcase-bus.service";

@Component({
  selector: "app-viewer-page",
  standalone: true,
  template: `
    <main class="viewer-shell">
      <p class="eyebrow">Angular Viewer-Popup</p>
      <h1>Demo Viewer</h1>
      <p>
        Diese Seite ist eine zweite Angular-Anwendungslaufzeit im selben Origin. Sie kommuniziert ausschließlich
        über die öffentliche Message-Bus-API mit dem Host.
      </p>

      <dl class="facts">
        <div><dt>appId</dt><dd>{{ bus.role }}</dd></div>
        <div><dt>instanceId</dt><dd><code>{{ bus.bus.instanceId }}</code></dd></div>
        <div><dt>Status</dt><dd>{{ status() }}</dd></div>
        <div><dt>Dokument</dt><dd>{{ documentId() ?? "–" }}</dd></div>
      </dl>

      <div class="document-preview">
        @if (documentId()) {
          <strong>{{ documentId() }}</strong>
          <span>Dokument wäre jetzt im echten Viewer geöffnet.</span>
        } @else {
          <span>Kein Dokument geöffnet.</span>
        }
      </div>

      <div class="row wrap">
        <button class="secondary" (click)="clear()">Dokument schließen</button>
        <button (click)="closeWindow()">Viewer-Fenster schließen</button>
      </div>
    </main>
  `
})
export class ViewerPageComponent implements OnInit, OnDestroy {
  readonly bus = inject(ShowcaseBusService);
  readonly documentId = signal<string | null>(null);
  readonly status = signal<"idle" | "open">("idle");

  private unsubscribeCommand?: Unsubscribe;
  private unsubscribeRequest?: Unsubscribe;

  ngOnInit(): void {
    this.unsubscribeCommand = this.bus.bus.subscribe("viewer.command", (payload, context) => {
      if (payload.command === "open") {
        this.documentId.set(payload.documentId ?? "unbekannt");
        this.status.set("open");
        this.publishState(context.source.instanceId);
        return;
      }

      if (payload.command === "clear") {
        this.documentId.set(null);
        this.status.set("idle");
        this.publishState(context.source.instanceId);
        return;
      }

      if (payload.command === "close") {
        void this.bus.bus.close().finally(() => window.close());
      }
    });

    this.unsubscribeRequest = this.bus.requests.handle("viewer.state.get", () => ({
      instanceId: this.bus.bus.instanceId,
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
    this.bus.bus.publish("viewer.state.changed", {
      documentId: null,
      status: "idle"
    });
  }

  closeWindow(): void {
    void this.bus.bus.close().finally(() => window.close());
  }

  private publishState(targetInstanceId: string): void {
    this.bus.bus.publish(
      "viewer.state.changed",
      { documentId: this.documentId(), status: this.status() },
      { target: { instanceId: targetInstanceId } }
    );
  }
}
