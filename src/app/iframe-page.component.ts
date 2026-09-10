import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { windowBridge } from "@lorenz/browser-message-bus/bridge";
import type { BusConnection, Unsubscribe } from "@lorenz/browser-message-bus";
import { ShowcaseBusService } from "./showcase-bus.service";

@Component({
  selector: "app-iframe-page",
  standalone: true,
  template: `
    <main class="iframe-content">
      <div>
        <p class="kicker">Cross-Origin Consumer · :4300</p>
        <h2>Angular iframe</h2>
        <p>{{ status() }}</p>
      </div>
      <div class="iframe-message">
        <span class="label">Letzte Nachricht</span>
        <strong>{{ lastMessage() ?? "Noch keine Nachricht" }}</strong>
      </div>
    </main>
  `
})
export class IframePageComponent implements OnInit, OnDestroy {
  readonly showcase = inject(ShowcaseBusService);
  readonly status = signal("Warte auf Bridge …");
  readonly lastMessage = signal<string | null>(null);

  private connection?: BusConnection;
  private unsubscribeCommand?: Unsubscribe;

  ngOnInit(): void {
    this.unsubscribeCommand = this.showcase.messageBus.subscribe("iframe.command", (payload, context) => {
      this.lastMessage.set(payload.text);
      this.showcase.messageBus.publish(
        "iframe.event",
        { text: `Empfangen: ${payload.text}`, receivedAt: Date.now() },
        { target: { instanceId: context.source.instanceId } }
      );
    });

    void this.connectToHost();
  }

  private async connectToHost(): Promise<void> {
    try {
      const connection = await this.showcase.messageBus.connect(
        windowBridge({
          targetWindow: window.parent,
          origin: "http://127.0.0.1:4200",
          mode: "accept",
          allowedTopics: ["iframe.command", "iframe.event"],
          allowedExtensions: ["presence", "request-reply"],
          timeoutMs: 10_000
        })
      );
      this.connection = connection;
      this.status.set("Bridge aktiv");

      void connection.closed.then(() => {
        if (this.connection === connection) {
          this.connection = undefined;
          this.status.set("Bridge geschlossen");
        }
      });
    } catch (error) {
      this.status.set(error instanceof Error ? error.message : String(error));
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeCommand?.();
    void this.connection?.close();
  }
}
