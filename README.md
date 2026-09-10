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
