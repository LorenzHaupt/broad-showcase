# Browser Message Bus – Angular Showcase

Dieser Showcase ist bewusst klein gehalten: Er ist gleichzeitig **laufende Demo** und **lesbare Angular-Referenz** für `@lorenz/browser-message-bus`.

Die Anwendung verwendet die Library wie ein normales npm-Paket. Es gibt keine Imports auf `../browser-message-bus/src` oder andere interne Dateien. Alle Imports laufen über die öffentlichen Package-Exports.

## Was der Showcase zeigt

| Use Case | Problem | Gezeigte API |
| --- | --- | --- |
| Publish / Subscribe | Zwei Tabs derselben Anwendung sollen Ereignisse austauschen | `createMessageBus`, `publish`, `subscribe` |
| Presence | Offene Tabs, Viewer oder andere Bus-Instanzen erkennen | `presence()` |
| Targeting | Nur einen konkreten Viewer ansprechen | `target.instanceId` |
| Request / Reply | Zustand eines konkreten Viewers abfragen | `requestReply()` |
| Cross-Origin Bridge | Angular-Host mit fremdem iframe verbinden | `iframeBridge`, `windowBridge` |
| Persistent Log | Ausgewählte zugestellte Events lokal speichern | `persistentLog()` |

Jeder Use Case besteht in der Oberfläche aus drei Teilen:

1. **Wofür ist das gedacht?**
2. **Live-Demo**
3. **Der relevante Angular-/Library-Code**

## Library-Einbindung

Im Showcase wird die Library als Dependency installiert:

```json
"@lorenz/browser-message-bus": "file:../browser-message-bus"
```

Der Anwendungscode verwendet nur öffentliche Imports:

```ts
import { createMessageBus } from "@lorenz/browser-message-bus";
import { iframeBridge } from "@lorenz/browser-message-bus/bridge";
import { presence } from "@lorenz/browser-message-bus/presence";
import { requestReply } from "@lorenz/browser-message-bus/request-reply";
import { persistentLog } from "@lorenz/browser-message-bus/persistent-log";
```

Die Angular-spezifische Kapselung liegt in `src/app/showcase-bus.service.ts`. Die Message-Bus-Library selbst benötigt keinen Angular-Adapter.

## Start

Library bauen:

```bash
cd ~/browser-message-bus
npm install
npm run build
```

Showcase installieren und starten:

```bash
cd ~/broad-showcase
npm install
npm run dev
```

Dann öffnen:

```text
http://127.0.0.1:4200/
```

`npm run dev` startet zusätzlich dieselbe Angular-Anwendung auf `http://127.0.0.1:4300`. Dadurch kann der iframe-Use-Case tatsächlich Cross-Origin getestet werden.

## So demonstrierst du die Use Cases

### 1. Publish / Subscribe

1. Auf **„Zweiten Tab öffnen“** klicken.
2. Im ersten Tab eine Nachricht senden.
3. Im zweiten Tab erscheint das Event unter **„Ereignisse dieser Instanz“**.

Damit ist sichtbar, dass die beiden Angular-Laufzeiten über den Message Bus kommunizieren.

### 2. Presence

Mit mehreren Tabs oder Viewern zeigt **„Bekannte Peers“** deren `appId` und gekürzte `instanceId` an.

### 3. Targeting und Request/Reply

1. Zwei Viewer öffnen.
2. Einen konkreten Viewer auswählen.
3. `DOC-4711` öffnen.
4. Nur der ausgewählte Viewer reagiert.
5. Mit **„State abfragen“** wird der Zustand dieses konkreten Viewers per Request/Reply zurückgegeben.

### 4. Cross-Origin iframe

Der Host läuft auf Port `4200`, der iframe auf Port `4300`. Die Bridge wird beim Laden aufgebaut. Danach kann der Host eine Nachricht gezielt an das iframe senden. Entfernt man das iframe, wird die Bridge geschlossen.

### 5. Persistent Log

Nach einigen Events auf **„Log lesen“** klicken. Der Host liest die gespeicherten Einträge aus IndexedDB.

## Woran erkenne ich, dass die Library wirklich korrekt eingebunden ist?

```bash
cd ~/broad-showcase
npm ls @lorenz/browser-message-bus
npm run build
```

Zusätzlich kannst du prüfen, dass keine internen Source-Imports existieren:

```bash
grep -R "browser-message-bus/src" src
```

Dieser Befehl sollte keine Treffer liefern.

Die öffentlichen Package-Imports kannst du anzeigen mit:

```bash
grep -R "@lorenz/browser-message-bus" src
```

Ein erfolgreicher Angular-Build bedeutet insbesondere, dass npm das Paket installiert hat und TypeScript die veröffentlichten ESM-Exports und `.d.ts`-Deklarationen auflösen konnte. Die Live-Demos prüfen anschließend das tatsächliche Laufzeitverhalten.

## Bewusste Grenze

Der Showcase verwendet den Bus für Browser-Kommunikation. Backend-Datenzugriff, Authentifizierung, fachliche Berechtigungen und serverseitiges Audit gehören weiterhin in normale Backend-APIs und sind absichtlich nicht Teil der Demo.
