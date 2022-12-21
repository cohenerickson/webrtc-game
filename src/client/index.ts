import Connection from "./Connection";
import Client from "./Client";

const connection = new Connection();
const client = new Client(connection);

connection.on("ready", () => {
  client.push({ type: "test", data: "test" });
});

client.on("requestValidation", (request) => {
  Math.random() > 0.5 ? request.accept() : request.reject();
});
