import EventEmitter from "events";
import Connection from "./Connection";
import * as uuid from "uuid";
import log from "./util/log";

interface QueuedBlock {
  data?: any;
  validations: Set<string>;
  rejections: Set<string>;
}

export default class Client extends EventEmitter {
  chain: any[] = [];
  connection: Connection;
  queue: Map<string, QueuedBlock> = new Map<string, QueuedBlock>();

  constructor(connection: Connection) {
    super();

    this.connection = connection;

    this.connection.on(
      "data",
      async (data: any, sender: string): Promise<void> => {
        if (data.type === "request") {
          let request = this.queue.get(data.id);
          if (!request) {
            this.queue.set(data.id, {
              validations: new Set<string>(),
              rejections: new Set<string>(),
              data: data
            });
            request = this.queue.get(data.id);
          }

          if (request && !request?.data) {
            request.data = data;
            this.queue.set(data.id, request!);
            this.#checkBlockValidity(data);
          }

          this.#emitValidationRequest(data);
        } else if (data.type === "response") {
          let request = this.queue.get(data.id);
          if (!request) {
            request = {
              validations: new Set<string>(),
              rejections: new Set<string>(),
              data: null
            };
            this.queue.set(data.id, request);
          }
          if (data.valid && !request.rejections.has(sender)) {
            request.validations.add(sender);
          } else if (!request.validations.has(sender)) {
            request.rejections.add(sender);
          }
          this.queue.set(data.id, request);
          if (request.data) this.#checkBlockValidity(data);
        }
      }
    );
  }

  #checkBlockValidity(data: any) {
    this.connection.peer.listAllPeers((peers: string[]) => {
      const request = this.queue.get(data.id);
      if (!request) return;
      if (
        request.validations.size >= peers.length / 2 ||
        request.validations.size === request.rejections.size
      ) {
        log("BLOCK_ACCEPTED", "blue", data.id, request.data);
        this.queue.delete(data.id);
        this.chain.push(request.data);
        this.emit("blockAccepted", request.data);
      } else if (request.rejections.size >= peers.length / 2) {
        log("BLOCK_REJECTED", "blue", data.id, request.data);
        this.queue.delete(data.id);
        this.chain.push(request.data);
        this.emit("blockRejected", request.data);
      }
    });
  }

  #emitValidationRequest(data: any) {
    this.emit("requestValidation", {
      data: data,
      accept: () => {
        this.connection.send(
          JSON.stringify({
            type: "response",
            id: data.id,
            valid: true
          })
        );
      },
      reject: () => {
        this.connection.send(
          JSON.stringify({
            type: "response",
            id: data.id,
            valid: false
          })
        );
      }
    });
  }

  push(data: any) {
    const requestId = uuid.v4();
    const request = {
      type: "request",
      id: requestId,
      data
    };
    this.queue.set(requestId, {
      validations: new Set<string>(),
      rejections: new Set<string>(),
      data: data
    });
    this.connection.send(JSON.stringify(request));
    this.#emitValidationRequest(request);
  }
}
