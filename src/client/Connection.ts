import Peer, { DataConnection } from "peerjs";
import { EventEmitter } from "events";

export default class Connection extends EventEmitter {
  #peers: Map<string, DataConnection> = new Map<string, DataConnection>();
  #self: Peer;

  constructor() {
    super();

    this.#self = new Peer({
      host: "localhost",
      port: 8080,
      path: "/peerjs"
    });

    this.#self.on("open", (): void => {
      this.#self.listAllPeers((ids): void => {
        ids.forEach((id): void => {
          if (id === this.#self.id) return;
          if (this.#peers.has(id)) return;
          const peerConnection = this.#self.connect(id, { reliable: true });
          this.#subscribePeer(id, peerConnection);
        });
        let ready = false;
        const checkReadyState = () => {
          let allReady = true;
          ids.forEach((id): void => {
            if (!this.#peers.has(id) && id !== this.#self.id) {
              allReady = false;
            }
          });
          if (allReady && !ready) {
            log("READY", this.#self.id);
            this.emit("ready", this.#self.id);
            ready = true;
          }
          if (!ready) {
            requestAnimationFrame(checkReadyState);
          }
        };
        requestAnimationFrame(checkReadyState);
      });
    });

    this.#self.on("connection", (conn): void => {
      log("NEW_CONNECTION", conn.peer);
      this.#subscribePeer(conn.peer, conn);
    });
  }

  #subscribePeer(id: string, conn: DataConnection): void {
    conn.on("open", (): void => {
      this.#peers.set(id, conn);
      this.emit("peerConnect", id);
    });
    conn.on("data", (rawData: any): void => {
      let data: unknown;
      if (rawData.startsWith("json:")) {
        data = JSON.parse(rawData.slice(5));
      } else if (rawData.startsWith("string:")) {
        data = rawData.slice(7);
      } else {
        data = rawData;
      }
      log("INCOMING", id, data);
      this.emit("data", data);
    });
    conn.on("close", (): void => {
      log("CONNECTION_CLOSED", id);
      this.#peers.delete(id);
      this.emit("peerDisconnect", id);
    });
  }

  send(rawData: any, peers?: string | string[]): void {
    let data: string;
    try {
      data = `json:${JSON.stringify(rawData)}`;
    } catch {
      data = `string:${rawData.toString()}`;
    }
    log("OUTGOING", this.id, rawData);
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
    return this.#self.id;
  }
}

function log(tag: string, id: string, rawData?: any) {
  let data;
  try {
    data = JSON.parse(rawData);
  } catch {
    data = rawData;
  }
  console.log(
    `%c[${tag}] %c${id}`,
    "color: magenta; font-weight: bold;",
    "color: gray;",
    `${data ? "\n" : ""}`,
    data ?? ""
  );
}
