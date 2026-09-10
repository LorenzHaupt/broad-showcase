import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { windowBridge } from "@lorenz/browser-message-bus/bridge";
import type { BusConnection, Unsubscribe } from "@lorenz/browser-message-bus";
import { ShowcaseBusService } from "./showcase-bus.service";

@Component({
  selector: "app-iframe-page",
  standalone: true,
  template: `
    <main class="iframe-shell">
      <p class="eyebrow">Cross-Origin Angular iframe</p>
      <h1>Port 4300</h1>
      <p>instanceId: <code>{{ bus.bus.instanceId }}</code></p>
      <p class="status">{{ status() }}</p>

      @if (lastMessage()) {
        <div class="message-box">{{ lastMessage() }}</div>
      }
    </main>
  `
})
export class IframePageComponent implements OnInit, OnDestroy {
  readonly bus = inject(ShowcaseBusService);
  readonly status = signal("Warte auf Host-Handshake …");
  readonly lastMessage = signal<string | null>(null);

  private connection?: BusConnection;
  private unsubscribeCommand?: Unsubscribe;

  ngOnInit(): void {
    this.unsubscribeCommand = this.bus.bus.subscribe("iframe.command", (payload, context) => {
      this.lastMessage.set(payload.text);
      this.bus.bus.publish(
        "iframe.event",
        { text: `Empfangen: ${payload.text}`, receivedAt: Date.now() },
        { target: { instanceId: context.source.instanceId } }
      );
    });

    void this.connectToHost();
  }

  private async connectToHost(): Promise<void> {
    try {
      const connection = await this.bus.bus.connect(
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
      this.status.set(`Bridge aktiv. Host: ${connection.remote.instanceId}`);

      void connection.closed.then(() => {
        if (this.connection === connection) {
          this.connection = undefined;
          this.status.set("Bridge geschlossen.");
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
