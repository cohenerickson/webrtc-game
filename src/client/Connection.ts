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
          this.subscribePeer(id, this.#self.connect(id, { reliable: true }));
        });
      });
    });

    this.#self.on("connection", (conn): void => {
      this.subscribePeer(conn.peer, conn);
    });
  }

  sendPacket(data: any): void {
    this.#peers.forEach((conn): void => {
      conn.send(data);
    });
  }

  subscribePeer(id: string, conn: DataConnection): void {
    console.log(`connecting to ${id}`);
    conn.on("open", (): void => {
      this.#peers.set(id, conn);
      if (Object.values(this.#peers).every((x) => x.open))
        this.emit("ready", this.#self.id);
    });
    conn.on("data", (data: unknown): void => {
      this.emit("packet", data);
    });
    conn.on("close", (): void => {
      this.#peers.delete(id);
    });
  }

  get id(): string {
    return this.#self.id;
  }
}
