import Connection from "./Connection";

const connection = new Connection();

connection.on("ready", (id) => {
  connection.sendPacket("hello from " + id);
});

connection.on("packet", (data: unknown): void => {
  console.log(data);
});

// import Peer, { DataConnection } from "peerjs";

// const peers = new Map<string, DataConnection>();

// const peer = new Peer({
//   host: "localhost",
//   port: 8080,
//   path: "/peerjs"
// });

// peer.on("open", (): void => {
//   peer.listAllPeers((ids): void => {
//     ids.forEach((id): void => {
//       if (id === peer.id) return;
//       if (peers.has(id)) return;
//       subscribePeer(id, peer.connect(id, { reliable: true }));
//     });
//   });
// });

// peer.on("connection", (conn): void => {
//   subscribePeer(conn.peer, conn);
// });

// function subscribePeer(id: string, conn: DataConnection): void {
//   conn.on("open", (): void => {
//     console.log(`connected to ${id}`);
//     peers.set(id, conn);
//   });
//   conn.on("data", recievePacket);
//   conn.on("close", (): void => {
//     peers.delete(id);
//   });
// }

// function recievePacket(data: any): void {
//   alert(data);
//   console.log(data);
// }

// function sendPacket(data: any): void {
//   peers.forEach((conn): void => {
//     conn.send(data);
//   });
// }

window.addEventListener("click", (): void => {
  connection.sendPacket("hello from " + connection.id);
});
