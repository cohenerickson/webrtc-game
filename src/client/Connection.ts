import Peer, { DataConnection } from "peerjs";
import { EventEmitter } from "events";
import log from "./util/log";

export default class Connection extends EventEmitter {
  #peers: Map<string, DataConnection> = new Map<string, DataConnection>();
  peer: Peer;

  constructor() {
    super();

    this.peer = new Peer({
      host: location.hostname,
      port: Number(location.host.split(":")[1]) || 443,
      path: "/peerjs"
    });

    this.peer.on("open", (): void => {
      this.peer.listAllPeers((ids): void => {
        ids.forEach((id): void => {
          if (id === this.peer.id) return;
          if (this.#peers.has(id)) return;
          const peerConnection = this.peer.connect(id, { reliable: true });
          this.#subscribePeer(id, peerConnection);
        });
        let ready = false;
        const checkReadyState = () => {
          let allReady = true;
          ids.forEach((id): void => {
            if (!this.#peers.has(id) && id !== this.peer.id) {
              allReady = false;
            }
          });
          if (allReady && !ready) {
            log("READY", "magenta", this.peer.id);
            this.emit("ready", this.peer.id);
            ready = true;
          }
          if (!ready) {
            requestAnimationFrame(checkReadyState);
          }
        };
        requestAnimationFrame(checkReadyState);
      });
    });

    this.peer.on("connection", (conn): void => {
      log("NEW_CONNECTION", "magenta", conn.peer);
      this.#subscribePeer(conn.peer, conn);
    });
  }

  #subscribePeer(id: string, conn: DataConnection): void {
    conn.on("open", (): void => {
      this.#peers.set(id, conn);
      this.emit("peerConnect", id);
    });
    conn.on("data", (rawData: any): void => {
      let data: any;
      try {
        data = JSON.parse(rawData);
      } catch {
        data = rawData;
      }
      log("INCOMING", "magenta", id, data);
      this.emit("data", data, id);
      this.emit(`data:${id}`, data, id);
    });
    conn.on("close", (): void => {
      log("CONNECTION_CLOSED", "magenta", id);
      this.#peers.delete(id);
      this.emit("peerDisconnect", id);
    });
  }

  send(data: any, peers?: string | string[]): void {
    log("OUTGOING", "magenta", this.id, data);
    if (peers) {
      if (typeof peers === "string") this.#peers.get(peers)?.send(data);
      else peers.forEach((id): void => this.#peers.get(id)?.send(data));
    } else {
      this.#peers.forEach((conn): void => {
        conn.send(data);
      });
    }
  }

  get id(): string {
    return this.peer.id;
  }
}
