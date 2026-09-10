import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from "@angular/core";
import { iframeBridge } from "@lorenz/browser-message-bus/bridge";
import type { BusConnection, Unsubscribe } from "@lorenz/browser-message-bus";
import { ShowcaseBusService } from "./showcase-bus.service";

interface LogLine {
  readonly time: string;
  readonly text: string;
}

@Component({
  selector: "app-main-page",
  standalone: true,
  template: `
    <main class="shell">
      <header class="hero">
        <p class="eyebrow">Angular Consumer Showcase</p>
        <h1>Browser Message Bus</h1>
        <p>
          Diese Anwendung bindet <code>@lorenz/browser-message-bus</code> wie eine normale npm-Abhängigkeit ein.
          Angular kennt keine internen Dateien der Bibliothek.
        </p>
        <div class="identity">
          <span>appId: <strong>{{ bus.role }}</strong></span>
          <span>instanceId: <code>{{ bus.bus.instanceId }}</code></span>
        </div>
      </header>

      <section class="grid">
        <article class="card">
          <h2>1. Tab ↔ Tab</h2>
          <p>Same-Origin-Kommunikation läuft automatisch über <code>BroadcastChannel</code>.</p>
          <div class="row">
            <input #broadcastInput value="Hallo aus Angular" aria-label="Broadcast-Nachricht">
            <button (click)="broadcast(broadcastInput.value)">Broadcast senden</button>
          </div>
          <button class="secondary" (click)="openSecondTab()">Zweiten Tab öffnen</button>
        </article>

        <article class="card">
          <h2>2. Presence</h2>
          <p>Aktuell bekannte Bus-Teilnehmer:</p>
          @if (bus.peers().length === 0) {
            <p class="muted">Noch keine anderen Instanzen gesehen.</p>
          } @else {
            <ul class="peers">
              @for (peer of bus.peers(); track peer.instanceId) {
                <li><strong>{{ peer.appId ?? "ohne appId" }}</strong> · <code>{{ short(peer.instanceId) }}</code></li>
              }
            </ul>
          }
        </article>

        <article class="card wide">
          <h2>3. Viewer-Popup mit Targeting und Request/Reply</h2>
          <p>
            Öffne mehrere Viewer. Der Host adressiert danach eine konkrete <code>instanceId</code>.
          </p>
          <div class="row wrap">
            <button (click)="openViewer()">Viewer öffnen</button>
            <select #viewerSelect aria-label="Viewer auswählen">
              <option value="">Viewer auswählen</option>
              @for (viewer of viewerPeers(); track viewer.instanceId) {
                <option [value]="viewer.instanceId">{{ short(viewer.instanceId) }}</option>
              }
            </select>
            <input #documentInput value="DOC-4711" aria-label="Dokument-ID">
            <button (click)="openDocument(viewerSelect.value, documentInput.value)">Dokument öffnen</button>
            <button class="secondary" (click)="readViewerState(viewerSelect.value)">State abfragen</button>
          </div>
          <p class="result">{{ viewerResult() }}</p>
        </article>

        <article class="card wide">
          <h2>4. Cross-Origin iframe</h2>
          <p>
            Der zweite Angular-Dev-Server läuft auf Port 4300. Die Bridge nutzt <code>postMessage</code> nur für den
            Handshake und danach einen dedizierten <code>MessagePort</code>.
          </p>

          @if (iframeVisible()) {
            <iframe
              #childFrame
              class="demo-frame"
              src="http://127.0.0.1:4300/iframe"
              title="Cross-Origin Angular iframe"
              (load)="connectIframe()"></iframe>
          } @else {
            <div class="frame-placeholder">iframe wurde entfernt.</div>
          }

          <div class="row wrap">
            <button [disabled]="!iframeVisible() || iframeConnected()" (click)="connectIframe()">Bridge verbinden</button>
            <button [disabled]="!iframeConnected()" (click)="sendIframeMessage()">Nachricht senden</button>
            <button class="secondary" [disabled]="!iframeVisible()" (click)="removeIframe()">iframe entfernen</button>
            <button class="secondary" [disabled]="iframeVisible()" (click)="restoreIframe()">iframe wiederherstellen</button>
          </div>
          <p class="result">{{ iframeStatus() }}</p>
        </article>

        <article class="card">
          <h2>5. Persistent Log</h2>
          <p>Ausgewählte fachliche Events werden im Host optional in IndexedDB gespeichert.</p>
          <div class="row wrap">
            <button (click)="loadPersistentLog()">Log lesen</button>
            <button class="secondary" (click)="clearPersistentLog()">Log löschen</button>
          </div>
          <pre>{{ persistentLogText() }}</pre>
        </article>

        <article class="card">
          <h2>Live-Ereignisse</h2>
          @if (events().length === 0) {
            <p class="muted">Noch keine Nachrichten.</p>
          } @else {
            <ul class="events">
              @for (event of events(); track $index) {
                <li><time>{{ event.time }}</time> {{ event.text }}</li>
              }
            </ul>
          }
        </article>
      </section>
    </main>
  `
})
export class MainPageComponent implements OnInit, OnDestroy {
  readonly bus = inject(ShowcaseBusService);

  @ViewChild("childFrame") private childFrame?: ElementRef<HTMLIFrameElement>;

  readonly events = signal<readonly LogLine[]>([]);
  readonly viewerResult = signal("Noch kein Viewer-State abgefragt.");
  readonly iframeStatus = signal("Bridge noch nicht verbunden.");
  readonly iframeVisible = signal(true);
  readonly iframeConnected = signal(false);
  readonly persistentLogText = signal("Noch nicht geladen.");

  readonly viewerPeers = computed(() => this.bus.peers().filter(peer => peer.appId === "viewer"));

  private iframeConnection: BusConnection | undefined;
  private iframeConnecting = false;
  private readonly subscriptions: Unsubscribe[] = [];

  ngOnInit(): void {
    this.subscriptions.push(
      this.bus.bus.subscribe("demo.broadcast", (payload, context) => {
        this.pushEvent(`Broadcast von ${this.abbreviate(context.source.instanceId)}: ${payload.text}`);
      }),
      this.bus.bus.subscribe("viewer.state.changed", (payload, context) => {
        this.pushEvent(
          `Viewer ${this.abbreviate(context.source.instanceId)}: ${payload.status} (${payload.documentId ?? "kein Dokument"})`
        );
      }),
      this.bus.bus.subscribe("iframe.event", payload => {
        this.pushEvent(`iframe: ${payload.text}`);
      })
    );

    void this.bus.log?.ready();
  }

  ngOnDestroy(): void {
    for (const unsubscribe of this.subscriptions) unsubscribe();
    void this.iframeConnection?.close();
  }

  broadcast(text: string): void {
    const value = text.trim();
    if (!value) return;
    this.bus.bus.publish("demo.broadcast", { text: value, sentAt: Date.now() });
  }

  openSecondTab(): void {
    window.open(window.location.origin + "/", "_blank", "noopener");
  }

  openViewer(): void {
    const name = `viewer-${crypto.randomUUID()}`;
    window.open("/viewer", name, "popup,width=720,height=580");
  }

  openDocument(instanceId: string, documentId: string): void {
    if (!instanceId) {
      this.viewerResult.set("Bitte zuerst einen Viewer auswählen.");
      return;
    }

    this.bus.bus.publish(
      "viewer.command",
      { command: "open", documentId: documentId.trim() || "DOC-4711" },
      { target: { instanceId } }
    );
  }

  async readViewerState(instanceId: string): Promise<void> {
    if (!instanceId) {
      this.viewerResult.set("Bitte zuerst einen Viewer auswählen.");
      return;
    }

    this.viewerResult.set("Frage Viewer ab …");
    try {
      const state = await this.bus.requests.request(
        "viewer.state.get",
        undefined,
        { target: { instanceId }, timeoutMs: 3_000 }
      );
      this.viewerResult.set(
        `${this.abbreviate(state.instanceId)} → ${state.status}, Dokument: ${state.documentId ?? "keins"}`
      );
    } catch (error) {
      this.viewerResult.set(error instanceof Error ? error.message : String(error));
    }
  }

  async connectIframe(): Promise<void> {
    const iframe = this.childFrame?.nativeElement;
    if (!iframe || this.iframeConnection?.connected || this.iframeConnecting) return;

    this.iframeConnecting = true;
    this.iframeStatus.set("Handshake läuft …");
    try {
      const connection = await this.bus.bus.connect(
        iframeBridge({
          iframe,
          origin: "http://127.0.0.1:4300",
          allowedTopics: ["iframe.command", "iframe.event"],
          allowedExtensions: ["presence", "request-reply"],
          timeoutMs: 5_000
        })
      );

      this.iframeConnection = connection;
      this.iframeConnected.set(true);
      this.iframeStatus.set(`Verbunden mit ${this.abbreviate(connection.remote.instanceId)}.`);

      void connection.closed.then(() => {
        if (this.iframeConnection === connection) {
          this.iframeConnection = undefined;
          this.iframeConnected.set(false);
          this.iframeStatus.set("Bridge wurde geschlossen.");
        }
      });
    } catch (error) {
      this.iframeStatus.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.iframeConnecting = false;
    }
  }

  sendIframeMessage(): void {
    if (!this.iframeConnection?.connected) return;
    this.bus.bus.publish(
      "iframe.command",
      { text: "Hallo aus der Angular-Host-Anwendung" },
      { target: { instanceId: this.iframeConnection.remote.instanceId } }
    );
  }

  removeIframe(): void {
    this.iframeVisible.set(false);
  }

  restoreIframe(): void {
    this.iframeVisible.set(true);
    this.iframeStatus.set("Neues iframe geladen; Bridge muss erneut verbunden werden.");
  }

  async loadPersistentLog(): Promise<void> {
    if (!this.bus.log) return;
    await this.bus.log.ready();
    await this.bus.log.flush();
    const entries = await this.bus.log.read({ order: "desc", limit: 20 });
    this.persistentLogText.set(
      entries.length
        ? entries.map(entry => `${new Date(entry.timestamp).toLocaleTimeString()}  ${entry.topic}`).join("\n")
        : "Log ist leer."
    );
  }

  async clearPersistentLog(): Promise<void> {
    if (!this.bus.log) return;
    await this.bus.log.clear();
    this.persistentLogText.set("Log wurde gelöscht.");
  }

  short(instanceId: string): string {
    return this.abbreviate(instanceId);
  }

  private pushEvent(text: string): void {
    const next: LogLine = { time: new Date().toLocaleTimeString(), text };
    this.events.update(events => [next, ...events].slice(0, 12));
  }

  private abbreviate(value: string): string {
    return value.length <= 10 ? value : `${value.slice(0, 8)}…`;
  }
}
