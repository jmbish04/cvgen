import { DurableObject } from "cloudflare:workers";
import { broadcast, handleErrors, } from "../utils/ws"

export class RoomDO extends DurableObject {

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    await handleErrors(this, () => this.ctx.acceptWebSocket(server));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const sockets = this.ctx.getWebSockets();
    broadcast(ws, sockets, message);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(`WebSocket closed: code=${code}, reason=${reason}, wasClean=${wasClean}`);
  }

  async webSocketError(ws: WebSocket, error: any) {
    console.error("WebSocket error:", error);
  }
}