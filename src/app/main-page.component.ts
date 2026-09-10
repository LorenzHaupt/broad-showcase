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
    <main class="page">
      <header class="intro">
        <p class="kicker">Angular Consumer Showcase</p>
        <h1>Browser Message Bus</h1>
        <p class="lead">
          Eine kleine Angular-Anwendung, die die öffentliche API von
          <code>@lorenz/browser-message-bus</code> als normale npm-Abhängigkeit verwendet.
        </p>

        <div class="runtime" aria-label="Aktive Bus-Instanz">
          <span class="status-dot" aria-hidden="true"></span>
          <strong>Bus aktiv</strong>
          <span>appId <code>{{ showcase.role }}</code></span>
          <span>instanceId <code>{{ short(showcase.messageBus.instanceId) }}</code></span>
        </div>
      </header>

      <nav class="toc" aria-label="Use Cases">
        <a href="#integration">Einbindung</a>
        <a href="#broadcast">Broadcast</a>
        <a href="#presence">Presence</a>
        <a href="#targeting">Targeting & RPC</a>
        <a href="#bridge">Cross-Origin Bridge</a>
        <a href="#persistence">Persistent Log</a>
      </nav>

      <section id="integration" class="use-case intro-case">
        <div class="case-copy">
          <p class="number">00 · Einbindung</p>
          <h2>Wie Angular die Library verwendet</h2>
          <p>
            Der Message Bus selbst kennt Angular nicht. In der Anwendung wird einmal ein Angular-Service erstellt,
            der den Bus und die benötigten Extensions kapselt. Components greifen danach über Dependency Injection
            darauf zu.
          </p>
          <div class="explanation">
            <strong>Warum das ein echter Consumer-Test ist</strong>
            <p>
              Der Code importiert ausschließlich über <code>@lorenz/browser-message-bus</code> und dessen öffentliche
              Subpath-Exports. Wenn <code>npm run build</code> erfolgreich ist, wurden Paket, ESM-Exports und
              TypeScript-Deklarationen korrekt aufgelöst.
            </p>
          </div>
        </div>

        <div class="code-panel">
          <div class="code-title">showcase-bus.service.ts</div>
          <pre><code>{{ integrationCode }}</code></pre>
        </div>
      </section>

      <section id="broadcast" class="use-case">
        <div class="case-copy">
          <p class="number">01 · Publish / Subscribe</p>
          <h2>Tabs synchronisieren</h2>
          <p>
            Typischer Use Case: Zwei Fenster derselben Web-Anwendung sollen auf ein Ereignis reagieren, ohne einen
            Backend-Roundtrip. Im gleichen Origin nutzt der Bus automatisch <code>BroadcastChannel</code>.
          </p>
          <div class="demo-box">
            <div class="demo-head">
              <strong>Live-Demo</strong>
              <span>Öffne einen zweiten Tab und sende eine Nachricht.</span>
            </div>
            <div class="controls">
              <input #broadcastInput value="Dokument wurde aktualisiert" aria-label="Broadcast-Nachricht">
              <button (click)="broadcast(broadcastInput.value)">Senden</button>
              <button class="ghost" (click)="openSecondTab()">Zweiten Tab öffnen</button>
            </div>
          </div>
        </div>

        <div class="code-panel">
          <div class="code-title">Component</div>
          <pre><code>{{ broadcastCode }}</code></pre>
        </div>
      </section>

      <section id="presence" class="use-case">
        <div class="case-copy">
          <p class="number">02 · Presence</p>
          <h2>Laufende Instanzen erkennen</h2>
          <p>
            Presence ist sinnvoll, wenn die Anwendung wissen möchte, welche anderen Bus-Instanzen gerade erreichbar
            sind – etwa offene Viewer, Tabs oder eingebettete Anwendungen.
          </p>
          <div class="demo-box">
            <div class="demo-head">
              <strong>Bekannte Peers</strong>
              <span>{{ showcase.peers().length }} andere Instanz(en)</span>
            </div>
            @if (showcase.peers().length === 0) {
              <p class="empty">Öffne einen zweiten Tab oder Viewer.</p>
            } @else {
              <ul class="peer-list">
                @for (peer of showcase.peers(); track peer.instanceId) {
                  <li>
                    <span>{{ peer.appId ?? "ohne appId" }}</span>
                    <code>{{ short(peer.instanceId) }}</code>
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <div class="code-panel">
          <div class="code-title">Presence Extension</div>
          <pre><code>{{ presenceCode }}</code></pre>
        </div>
      </section>

      <section id="targeting" class="use-case">
        <div class="case-copy">
          <p class="number">03 · Targeting & Request/Reply</p>
          <h2>Einen konkreten Viewer ansprechen</h2>
          <p>
            Ein Broadcast wäre hier falsch: Wenn mehrere Viewer geöffnet sind, soll nur die ausgewählte
            <code>instanceId</code> den Befehl erhalten. Für Rückfragen kann auf demselben Bus Request/Reply verwendet
            werden.
          </p>

          <div class="demo-box">
            <div class="demo-head">
              <strong>Live-Demo</strong>
              <span>Öffne zwei Viewer und adressiere nur einen davon.</span>
            </div>
            <div class="controls wrap">
              <button (click)="openViewer()">Viewer öffnen</button>
              <select #viewerSelect aria-label="Viewer auswählen">
                <option value="">Viewer auswählen</option>
                @for (viewer of viewerPeers(); track viewer.instanceId) {
                  <option [value]="viewer.instanceId">{{ short(viewer.instanceId) }}</option>
                }
              </select>
              <input #documentInput value="DOC-4711" aria-label="Dokument-ID">
              <button (click)="openDocument(viewerSelect.value, documentInput.value)">Dokument öffnen</button>
              <button class="ghost" (click)="readViewerState(viewerSelect.value)">State abfragen</button>
            </div>
            <p class="demo-result">{{ viewerResult() }}</p>
          </div>

          <details>
            <summary>Empfängerseite im Viewer</summary>
            <pre class="inline-code"><code>{{ viewerCode }}</code></pre>
          </details>
        </div>

        <div class="code-panel">
          <div class="code-title">Host: Targeting + Request</div>
          <pre><code>{{ targetingCode }}</code></pre>
        </div>
      </section>

      <section id="bridge" class="use-case">
        <div class="case-copy">
          <p class="number">04 · Bridge</p>
          <h2>Cross-Origin iframe anbinden</h2>
          <p>
            <code>BroadcastChannel</code> überschreitet keine Origins. Für ein fremdes iframe wird deshalb explizit
            eine Bridge aufgebaut. Der Handshake läuft über <code>postMessage</code>; danach transportiert ein
            dedizierter <code>MessagePort</code> die normalen Bus-Nachrichten.
          </p>

          <div class="demo-box">
            <div class="demo-head">
              <strong>Live-Demo</strong>
              <span>Host :4200 ↔ iframe :4300</span>
            </div>

            @if (iframeVisible()) {
              <iframe
                #childFrame
                class="demo-frame"
                src="http://127.0.0.1:4300/iframe"
                title="Cross-Origin Angular iframe"
                (load)="connectIframe()"></iframe>
            } @else {
              <div class="frame-placeholder">iframe entfernt</div>
            }

            <div class="controls wrap">
              <button [disabled]="!iframeConnected()" (click)="sendIframeMessage()">Nachricht senden</button>
              <button class="ghost" [disabled]="!iframeVisible()" (click)="removeIframe()">iframe entfernen</button>
              <button class="ghost" [disabled]="iframeVisible()" (click)="restoreIframe()">iframe laden</button>
            </div>
            <p class="demo-result">{{ iframeStatus() }}</p>
          </div>

          <details>
            <summary>Gegenseite im iframe</summary>
            <pre class="inline-code"><code>{{ iframeCode }}</code></pre>
          </details>
        </div>

        <div class="code-panel">
          <div class="code-title">Host: iframeBridge()</div>
          <pre><code>{{ bridgeCode }}</code></pre>
        </div>
      </section>

      <section id="persistence" class="use-case">
        <div class="case-copy">
          <p class="number">05 · Persistent Log</p>
          <h2>Ausgewählte Events lokal speichern</h2>
          <p>
            Das Log ist optional. Es speichert ausgewählte, tatsächlich zugestellte Nachrichten in IndexedDB – etwa
            für lokale Historie, Diagnose oder nachvollziehbare UI-Ereignisse. Es ersetzt kein serverseitiges Audit.
          </p>
          <div class="demo-box">
            <div class="demo-head">
              <strong>Live-Demo</strong>
              <span>Erzeuge vorher z. B. einen Broadcast.</span>
            </div>
            <div class="controls">
              <button (click)="loadPersistentLog()">Log lesen</button>
              <button class="ghost" (click)="clearPersistentLog()">Log löschen</button>
            </div>
            <pre class="log-output">{{ persistentLogText() }}</pre>
          </div>
        </div>

        <div class="code-panel">
          <div class="code-title">Persistent Log Extension</div>
          <pre><code>{{ persistenceCode }}</code></pre>
        </div>
      </section>

      <section class="activity">
        <div>
          <p class="number">Live</p>
          <h2>Ereignisse dieser Instanz</h2>
          <p>Hier sieht man, was im laufenden Host tatsächlich angekommen ist.</p>
        </div>
        @if (events().length === 0) {
          <p class="empty">Noch keine fachlichen Nachrichten empfangen.</p>
        } @else {
          <ul class="event-list">
            @for (event of events(); track $index) {
              <li><time>{{ event.time }}</time><span>{{ event.text }}</span></li>
            }
          </ul>
        }
      </section>

      <footer>
        <strong>Bewusst nicht Teil des Showcases:</strong>
        Backend-Aufrufe, Authentifizierung und fachliche Berechtigungen. Der Bus verbindet Browser-Kontexte; er ersetzt
        keine Server-API.
      </footer>
    </main>
  `
})
export class MainPageComponent implements OnInit, OnDestroy {
  readonly showcase = inject(ShowcaseBusService);

  @ViewChild("childFrame") private childFrame?: ElementRef<HTMLIFrameElement>;

  readonly events = signal<readonly LogLine[]>([]);
  readonly viewerResult = signal("Noch kein Viewer ausgewählt.");
  readonly iframeStatus = signal("iframe wird geladen …");
  readonly iframeVisible = signal(true);
  readonly iframeConnected = signal(false);
  readonly persistentLogText = signal("Noch nicht geladen.");

  readonly viewerPeers = computed(() => this.showcase.peers().filter(peer => peer.appId === "viewer"));

  readonly integrationCode = `@Injectable({ providedIn: "root" })
export class ShowcaseBusService {
  readonly messageBus = createMessageBus<ShowcaseMessages>({
    channel: "browser-message-bus-angular-showcase",
    appId: "host"
  });
}

// In einer Angular Component:
readonly showcase = inject(ShowcaseBusService);`;

  readonly broadcastCode = `this.showcase.messageBus.publish("demo.broadcast", {
  text: "Hallo aus Angular",
  sentAt: Date.now()
});

this.showcase.messageBus.subscribe(
  "demo.broadcast",
  payload => console.log(payload.text)
);`;

  readonly presenceCode = `const peers = this.messageBus.use(presence());

peers.onJoin(peer => {
  console.log("neu:", peer.appId, peer.instanceId);
});

const openInstances = peers.peers();`;

  readonly targetingCode = `this.showcase.messageBus.publish(
  "viewer.command",
  { command: "open", documentId: "DOC-4711" },
  { target: { instanceId: viewerId } }
);

const state = await this.showcase.requests.request(
  "viewer.state.get",
  undefined,
  { target: { instanceId: viewerId } }
);`;

  readonly viewerCode = `this.showcase.messageBus.subscribe("viewer.command", payload => {
  if (payload.command === "open") {
    openDocument(payload.documentId);
  }
});

this.showcase.requests.handle("viewer.state.get", () => ({
  documentId: currentDocumentId,
  status: "open"
}));`;

  readonly bridgeCode = `const connection = await this.showcase.messageBus.connect(
  iframeBridge({
    iframe,
    origin: "http://127.0.0.1:4300",
    allowedTopics: ["iframe.command", "iframe.event"]
  })
);

this.showcase.messageBus.publish(
  "iframe.command",
  { text: "Hallo" },
  { target: { instanceId: connection.remote.instanceId } }
);`;

  readonly iframeCode = `await this.showcase.messageBus.connect(
  windowBridge({
    targetWindow: window.parent,
    origin: "http://127.0.0.1:4200",
    mode: "accept",
    allowedTopics: ["iframe.command", "iframe.event"]
  })
);`;

  readonly persistenceCode = `const log = this.messageBus.use(
  persistentLog({
    topics: ["demo.broadcast"],
    maxEntries: 1000
  })
);

await log.ready();
const entries = await log.read({ order: "desc" });`;

  private iframeConnection: BusConnection | undefined;
  private iframeConnecting = false;
  private readonly subscriptions: Unsubscribe[] = [];

  ngOnInit(): void {
    this.subscriptions.push(
      this.showcase.messageBus.subscribe("demo.broadcast", (payload, context) => {
        this.pushEvent(`Broadcast von ${this.abbreviate(context.source.instanceId)}: ${payload.text}`);
      }),
      this.showcase.messageBus.subscribe("viewer.state.changed", (payload, context) => {
        this.pushEvent(
          `Viewer ${this.abbreviate(context.source.instanceId)}: ${payload.status} (${payload.documentId ?? "kein Dokument"})`
        );
      }),
      this.showcase.messageBus.subscribe("iframe.event", payload => {
        this.pushEvent(`iframe: ${payload.text}`);
      })
    );

    void this.showcase.log?.ready();
  }

  ngOnDestroy(): void {
    for (const unsubscribe of this.subscriptions) unsubscribe();
    void this.iframeConnection?.close();
  }

  broadcast(text: string): void {
    const value = text.trim();
    if (!value) return;
    this.showcase.messageBus.publish("demo.broadcast", { text: value, sentAt: Date.now() });
  }

  openSecondTab(): void {
    window.open(window.location.origin + "/", "_blank", "noopener");
  }

  openViewer(): void {
    const name = `viewer-${crypto.randomUUID()}`;
    window.open("/viewer", name, "popup,width=720,height=620");
  }

  openDocument(instanceId: string, documentId: string): void {
    if (!instanceId) {
      this.viewerResult.set("Bitte zuerst einen Viewer auswählen.");
      return;
    }

    this.showcase.messageBus.publish(
      "viewer.command",
      { command: "open", documentId: documentId.trim() || "DOC-4711" },
      { target: { instanceId } }
    );
    this.viewerResult.set(`Befehl gezielt an ${this.abbreviate(instanceId)} gesendet.`);
  }

  async readViewerState(instanceId: string): Promise<void> {
    if (!instanceId) {
      this.viewerResult.set("Bitte zuerst einen Viewer auswählen.");
      return;
    }

    this.viewerResult.set("Request läuft …");
    try {
      const state = await this.showcase.requests.request(
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
    this.iframeStatus.set("Bridge-Handshake läuft …");
    try {
      const connection = await this.showcase.messageBus.connect(
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
      this.iframeStatus.set(`Bridge aktiv → ${this.abbreviate(connection.remote.instanceId)}`);

      void connection.closed.then(() => {
        if (this.iframeConnection === connection) {
          this.iframeConnection = undefined;
          this.iframeConnected.set(false);
          this.iframeStatus.set("Bridge geschlossen.");
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
    this.showcase.messageBus.publish(
      "iframe.command",
      { text: "Hallo aus dem Angular-Host" },
      { target: { instanceId: this.iframeConnection.remote.instanceId } }
    );
  }

  removeIframe(): void {
    this.iframeVisible.set(false);
  }

  restoreIframe(): void {
    this.iframeVisible.set(true);
    this.iframeStatus.set("iframe wird neu geladen …");
  }

  async loadPersistentLog(): Promise<void> {
    if (!this.showcase.log) return;
    await this.showcase.log.ready();
    await this.showcase.log.flush();
    const entries = await this.showcase.log.read({ order: "desc", limit: 12 });
    this.persistentLogText.set(
      entries.length
        ? entries
            .map(entry => `${new Date(entry.timestamp).toLocaleTimeString()}  ${entry.topic}`)
            .join("\n")
        : "Log ist leer."
    );
  }

  async clearPersistentLog(): Promise<void> {
    if (!this.showcase.log) return;
    await this.showcase.log.clear();
    this.persistentLogText.set("Log wurde gelöscht.");
  }

  short(instanceId: string): string {
    return this.abbreviate(instanceId);
  }

  private pushEvent(text: string): void {
    const next: LogLine = { time: new Date().toLocaleTimeString(), text };
    this.events.update(events => [next, ...events].slice(0, 10));
  }

  private abbreviate(value: string): string {
    return value.length <= 10 ? value : `${value.slice(0, 8)}…`;
  }
}
