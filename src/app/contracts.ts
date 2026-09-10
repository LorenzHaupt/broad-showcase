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
