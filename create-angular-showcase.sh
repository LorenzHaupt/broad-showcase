#!/usr/bin/env bash
set -euo pipefail

# Für die Ausführung direkt in ~/broad-showcase.
# Die lokale Library wird standardmäßig unter ~/browser-message-bus erwartet.

LIBRARY="$HOME/browser-message-bus"
OUTPUT="$(pwd)"
MODE="file"
INSTALL=false
VERIFY=false
FORCE=false

usage() {
  cat <<'HELP'
Erzeugt einen Angular-Showcase für @lorenz/browser-message-bus.

Standard:
  - Angular 21 LTS
  - lokale npm-Abhängigkeit per file:../browser-message-bus
  - der Anwendungscode importiert ausschließlich öffentliche Package-Exports

Aufruf:
  ./create-angular-showcase.sh [Optionen]

Optionen:
  --library PATH   Pfad zum lokalen browser-message-bus-Repo
  --packed         Library zuerst mit npm pack verpacken und das .tgz installieren
  --install        Dependencies des Showcases installieren
  --verify         Library bauen, Dependencies installieren und Angular-Build ausführen
  --force          vorhandene Showcase-Dateien auch bei fremder package.json überschreiben
  -h, --help       Hilfe anzeigen

Beispiele:
  ./create-angular-showcase.sh
  ./create-angular-showcase.sh --verify
  ./create-angular-showcase.sh --packed --verify
HELP
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --library)
      LIBRARY="${2:?Pfad nach --library fehlt}"
      shift 2
      ;;
    --packed)
      MODE="packed"
      shift
      ;;
    --install)
      INSTALL=true
      shift
      ;;
    --verify)
      VERIFY=true
      INSTALL=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unbekannte Option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

LIBRARY="$(realpath -m "$LIBRARY")"
OUTPUT="$(realpath -m "$OUTPUT")"

if [[ ! -f "$LIBRARY/package.json" ]]; then
  echo "Fehler: Kein package.json unter $LIBRARY gefunden." >&2
  exit 1
fi

if ! grep -q '"@lorenz/browser-message-bus"' "$LIBRARY/package.json"; then
  echo "Fehler: $LIBRARY ist nicht das erwartete @lorenz/browser-message-bus-Projekt." >&2
  exit 1
fi

# Der Showcase wird direkt im aktuellen Ordner erzeugt. Ein bereits vorhandenes
# Showcase darf aktualisiert werden; ein fremdes Node-Projekt wird aus Sicherheitsgründen
# nur mit --force überschrieben.
if [[ -f "$OUTPUT/package.json" ]] && ! grep -q '"browser-message-bus-angular-showcase"' "$OUTPUT/package.json"; then
  if [[ "$FORCE" != true ]]; then
    echo "Fehler: Im aktuellen Ordner liegt bereits eine fremde package.json." >&2
    echo "Wechsle nach ~/broad-showcase oder nutze bewusst --force." >&2
    exit 1
  fi
fi

mkdir -p "$OUTPUT"

mkdir -p "$OUTPUT/."
cat > "$OUTPUT/.editorconfig" <<'__ANGULAR_SHOWCASE_1__'
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
__ANGULAR_SHOWCASE_1__

mkdir -p "$OUTPUT/."
cat > "$OUTPUT/.gitignore" <<'__ANGULAR_SHOWCASE_2__'
/node_modules
/dist
/.angular
/.local-packages
*.log
.DS_Store
.idea/
__ANGULAR_SHOWCASE_2__

mkdir -p "$OUTPUT/."
cat > "$OUTPUT/README.md" <<'__ANGULAR_SHOWCASE_3__'
# Browser Message Bus – Angular Showcase

Dieser Showcase zeigt, dass `@lorenz/browser-message-bus` ohne Angular-spezifischen Adapter in einer normalen Angular-Anwendung verwendet werden kann. Die Library wird über ihren Paketnamen aus `node_modules` importiert; der Showcase greift niemals auf `src/` oder andere interne Dateien des Library-Repositories zu.

Der Showcase verwendet Angular 21 LTS mit Standalone Components und der seit Angular 21 standardmäßigen zoneless Change Detection. UI-Zustand wird über Angular Signals aktualisiert.

## Gezeigte Anwendungsfälle

- Same-Origin-Kommunikation zwischen mehreren Angular-Tabs über `BroadcastChannel`
- Presence zur Anzeige anderer laufender Bus-Instanzen
- mehrere Viewer-Popups mit gezieltem `instanceId`-Targeting
- Request/Reply zur Abfrage des Zustands eines konkreten Viewers
- Cross-Origin-Kommunikation zu einem Angular-iframe über `iframeBridge` / `windowBridge`
- Lifecycle-Erkennung beim Entfernen des iframes
- optionales Persistent Log in IndexedDB

## Empfohlene Verzeichnisstruktur

```text
~/
├── browser-message-bus/
└── broad-showcase/
```

Die `package.json` des Showcases verwendet standardmäßig:

```json
"@lorenz/browser-message-bus": "file:../browser-message-bus"
```

Das ist eine normale npm-Dependency. Im TypeScript-Code wird ausschließlich über die öffentlichen Package-Exports importiert:

```ts
import { createMessageBus } from "@lorenz/browser-message-bus";
import { iframeBridge } from "@lorenz/browser-message-bus/bridge";
import { presence } from "@lorenz/browser-message-bus/presence";
import { requestReply } from "@lorenz/browser-message-bus/request-reply";
import { persistentLog } from "@lorenz/browser-message-bus/persistent-log";
```

## Start

Zuerst die Library bauen:

```bash
cd ~/browser-message-bus
npm install
npm run build
```

Danach den Showcase installieren und starten:

```bash
cd ~/broad-showcase
npm install
npm run dev
```

Öffne anschließend:

```text
http://127.0.0.1:4200/
```

`npm run dev` startet denselben Angular-Showcase zusätzlich auf Port 4300. Dadurch ist `/iframe` für den Host ein anderer Origin und die Bridge wird realistisch getestet.

## Angular-Integration

Die zentrale Integration liegt in `src/app/showcase-bus.service.ts`. Dort wird der Message Bus als normaler Angular-Service gekapselt. Komponenten verwenden anschließend Dependency Injection:

```ts
readonly bus = inject(ShowcaseBusService);
```

Für eine echte Anwendung ist dieses Muster meist angenehmer, als in jeder Component separat `createMessageBus()` aufzurufen. Der Message Bus selbst bleibt trotzdem vollständig framework-unabhängig.

## Release-naher Test mit `npm pack`

Wenn du nicht direkt auf das lokale Library-Verzeichnis verweisen möchtest, kannst du die Library wie bei einem Publish packen:

```bash
cd ~/browser-message-bus
npm run build
npm pack
```

Danach installierst du das erzeugte `.tgz` im Showcase:

```bash
npm install ../browser-message-bus/lorenz-browser-message-bus-1.0.0.tgz
```

Die Imports im Angular-Code ändern sich dabei nicht.
__ANGULAR_SHOWCASE_3__

mkdir -p "$OUTPUT/."
cat > "$OUTPUT/angular.json" <<'__ANGULAR_SHOWCASE_4__'
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "browser-message-bus-angular-showcase": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "styles": ["src/styles.css"]
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "700kB",
                  "maximumError": "1MB"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "browser-message-bus-angular-showcase:build:production"
            },
            "development": {
              "buildTarget": "browser-message-bus-angular-showcase:build:development"
            }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
__ANGULAR_SHOWCASE_4__

mkdir -p "$OUTPUT/."
cat > "$OUTPUT/package.json" <<'__ANGULAR_SHOWCASE_5__'
{
  "name": "browser-message-bus-angular-showcase",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --host 127.0.0.1 --port 4200",
    "start:iframe": "ng serve --host 127.0.0.1 --port 4300",
    "dev": "node scripts/dev.mjs",
    "build": "ng build",
    "typecheck": "ng build --configuration development"
  },
  "dependencies": {
    "@angular/common": "^21.2.23",
    "@angular/compiler": "^21.2.23",
    "@angular/core": "^21.2.23",
    "@angular/platform-browser": "^21.2.23",
    "@angular/router": "^21.2.23",
    "@lorenz/browser-message-bus": "file:../browser-message-bus",
    "rxjs": "^7.8.2",
    "tslib": "^2.8.1"
  },
  "devDependencies": {
    "@angular/build": "^21.2.23",
    "@angular/cli": "^21.2.23",
    "@angular/compiler-cli": "^21.2.23",
    "typescript": "~5.9.3"
  }
}
__ANGULAR_SHOWCASE_5__

mkdir -p "$OUTPUT/scripts"
cat > "$OUTPUT/scripts/dev.mjs" <<'__ANGULAR_SHOWCASE_6__'
import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [
  spawn(npmCommand, ["run", "start"], { stdio: "inherit" }),
  spawn(npmCommand, ["run", "start:iframe"], { stdio: "inherit" })
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 100).unref();
}

for (const child of children) {
  child.on("exit", code => {
    if (!stopping && code && code !== 0) stop(code);
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

console.log("\nHost:   http://127.0.0.1:4200/");
console.log("iframe: http://127.0.0.1:4300/iframe\n");
__ANGULAR_SHOWCASE_6__

mkdir -p "$OUTPUT/src/app"
cat > "$OUTPUT/src/app/app.component.ts" <<'__ANGULAR_SHOWCASE_7__'
import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent {}
__ANGULAR_SHOWCASE_7__

mkdir -p "$OUTPUT/src/app"
cat > "$OUTPUT/src/app/app.routes.ts" <<'__ANGULAR_SHOWCASE_8__'
import type { Routes } from "@angular/router";
import { IframePageComponent } from "./iframe-page.component";
import { MainPageComponent } from "./main-page.component";
import { ViewerPageComponent } from "./viewer-page.component";

export const routes: Routes = [
  { path: "", component: MainPageComponent },
  { path: "viewer", component: ViewerPageComponent },
  { path: "iframe", component: IframePageComponent },
  { path: "**", redirectTo: "" }
];
__ANGULAR_SHOWCASE_8__

mkdir -p "$OUTPUT/src/app"
cat > "$OUTPUT/src/app/contracts.ts" <<'__ANGULAR_SHOWCASE_9__'
export interface ShowcaseMessages {
  "demo.broadcast": {
    text: string;
    sentAt: number;
  };

  "viewer.command": {
    command: "open" | "clear" | "close";
    documentId?: string;
  };

  "viewer.state.changed": {
    documentId: string | null;
    status: "idle" | "open";
  };

  "iframe.command": {
    text: string;
  };

  "iframe.event": {
    text: string;
    receivedAt: number;
  };
}

export interface ShowcaseRequests {
  "viewer.state.get": {
    request: undefined;
    response: {
      instanceId: string;
      documentId: string | null;
      status: "idle" | "open";
    };
  };
}
__ANGULAR_SHOWCASE_9__

mkdir -p "$OUTPUT/src/app"
cat > "$OUTPUT/src/app/iframe-page.component.ts" <<'__ANGULAR_SHOWCASE_10__'
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
__ANGULAR_SHOWCASE_10__

mkdir -p "$OUTPUT/src/app"
cat > "$OUTPUT/src/app/main-page.component.ts" <<'__ANGULAR_SHOWCASE_11__'
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
__ANGULAR_SHOWCASE_11__

mkdir -p "$OUTPUT/src/app"
cat > "$OUTPUT/src/app/showcase-bus.service.ts" <<'__ANGULAR_SHOWCASE_12__'
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
__ANGULAR_SHOWCASE_12__

mkdir -p "$OUTPUT/src/app"
cat > "$OUTPUT/src/app/viewer-page.component.ts" <<'__ANGULAR_SHOWCASE_13__'
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
__ANGULAR_SHOWCASE_13__

mkdir -p "$OUTPUT/src"
cat > "$OUTPUT/src/index.html" <<'__ANGULAR_SHOWCASE_14__'
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Browser Message Bus – Angular Showcase</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>
__ANGULAR_SHOWCASE_14__

mkdir -p "$OUTPUT/src"
cat > "$OUTPUT/src/main.ts" <<'__ANGULAR_SHOWCASE_15__'
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)]
}).catch(error => console.error(error));
__ANGULAR_SHOWCASE_15__

mkdir -p "$OUTPUT/src"
cat > "$OUTPUT/src/styles.css" <<'__ANGULAR_SHOWCASE_16__'
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #1d2433;
  background: #f4f6fa;
  line-height: 1.5;
}

* { box-sizing: border-box; }
body { margin: 0; }
button, input, select { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .55; }
code { font-family: "SFMono-Regular", Consolas, monospace; }

.shell,
.viewer-shell,
.iframe-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0 64px;
}

.hero {
  background: #fff;
  border: 1px solid #dfe4ec;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(29, 36, 51, .06);
  margin-bottom: 24px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: .12em;
  font-size: .75rem;
  font-weight: 700;
  color: #5f6f86;
  margin: 0 0 8px;
}

h1 { margin: 0 0 12px; font-size: clamp(2rem, 6vw, 3.2rem); }
h2 { margin-top: 0; }
p { max-width: 78ch; }

.identity,
.row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.identity { flex-wrap: wrap; margin-top: 18px; }
.wrap { flex-wrap: wrap; }

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.card {
  background: #fff;
  border: 1px solid #dfe4ec;
  border-radius: 16px;
  padding: 22px;
  min-width: 0;
}
.card.wide { grid-column: 1 / -1; }

button {
  border: 0;
  border-radius: 9px;
  padding: 10px 14px;
  background: #263a75;
  color: white;
}
button.secondary {
  background: #e8ecf4;
  color: #243047;
}
input, select {
  min-width: 180px;
  border: 1px solid #cfd6e2;
  border-radius: 9px;
  padding: 9px 11px;
  background: white;
}

.peers, .events { padding-left: 20px; }
.events { max-height: 220px; overflow: auto; }
.events time { display: inline-block; min-width: 88px; color: #6c7788; }
.muted { color: #778195; }
.result { min-height: 1.5em; font-weight: 600; }
pre {
  white-space: pre-wrap;
  background: #f4f6fa;
  border-radius: 10px;
  padding: 12px;
  min-height: 76px;
}

.demo-frame {
  width: 100%;
  min-height: 230px;
  border: 1px solid #cfd6e2;
  border-radius: 12px;
  margin: 12px 0 16px;
  background: white;
}
.frame-placeholder {
  display: grid;
  place-items: center;
  min-height: 180px;
  border: 1px dashed #b8c1ce;
  border-radius: 12px;
  margin: 12px 0 16px;
  color: #778195;
}

.viewer-shell,
.iframe-shell {
  max-width: 760px;
}
.facts {
  display: grid;
  gap: 8px;
  background: white;
  border: 1px solid #dfe4ec;
  border-radius: 14px;
  padding: 18px;
}
.facts div { display: grid; grid-template-columns: 130px 1fr; gap: 12px; }
.facts dt { color: #667286; }
.facts dd { margin: 0; overflow-wrap: anywhere; }
.document-preview,
.message-box {
  margin: 18px 0;
  border: 1px solid #dfe4ec;
  border-radius: 14px;
  padding: 28px;
  background: white;
  display: grid;
  gap: 8px;
}
.status { font-weight: 700; }

@media (max-width: 760px) {
  .grid { grid-template-columns: 1fr; }
  .card.wide { grid-column: auto; }
  .row { align-items: stretch; flex-direction: column; }
  input, select { width: 100%; }
}
__ANGULAR_SHOWCASE_16__

mkdir -p "$OUTPUT/."
cat > "$OUTPUT/tsconfig.app.json" <<'__ANGULAR_SHOWCASE_17__'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
__ANGULAR_SHOWCASE_17__

mkdir -p "$OUTPUT/."
cat > "$OUTPUT/tsconfig.json" <<'__ANGULAR_SHOWCASE_18__'
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "preserve",
    "lib": ["ES2022", "dom"]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
__ANGULAR_SHOWCASE_18__


# Die lokale Bibliothek wird als echte npm-Abhängigkeit eingetragen. Im Anwendungscode
# gibt es bewusst keine relativen Imports in das Library-Repository.
if [[ "$MODE" == "packed" ]]; then
  echo "Baue und packe lokale Library ..."
  (cd "$LIBRARY" && npm run build)
  mkdir -p "$OUTPUT/.local-packages"
  TARBALL="$(cd "$LIBRARY" && npm pack --silent --pack-destination "$OUTPUT/.local-packages" | tail -n 1)"
  DEPENDENCY="file:.local-packages/$TARBALL"
else
  RELATIVE_LIBRARY="$(realpath --relative-to="$OUTPUT" "$LIBRARY")"
  DEPENDENCY="file:$RELATIVE_LIBRARY"
fi

node - "$OUTPUT/package.json" "$DEPENDENCY" <<'NODE'
const fs = require('node:fs');
const [packagePath, dependency] = process.argv.slice(2);
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.dependencies['@lorenz/browser-message-bus'] = dependency;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
NODE

if [[ "$VERIFY" == true ]]; then
  echo "Baue lokale Library ..."
  (cd "$LIBRARY" && npm run build)
fi

if [[ "$INSTALL" == true ]]; then
  echo "Installiere Angular-Showcase ..."
  (cd "$OUTPUT" && npm install)
fi

if [[ "$VERIFY" == true ]]; then
  echo "Prüfe Angular-Build ..."
  (cd "$OUTPUT" && npm run build)
fi

cat <<NEXT

Angular-Showcase wurde im aktuellen Ordner erzeugt:
  $OUTPUT

Library-Dependency:
  @lorenz/browser-message-bus -> $DEPENDENCY

Start:
  cd "$OUTPUT"
  npm run dev

Dann öffnen:
  http://127.0.0.1:4200/
NEXT
