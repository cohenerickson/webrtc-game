import Connection from "./Connection";

const connection = new Connection();

connection.on("ready", (id) => {
  connection.send("Hello World!");
});

connection.on("data", (data: unknown): void => {});

window.addEventListener("click", (event): void => {
  connection.send({
    type: "click",
    x: event.clientX,
    y: event.clientY
  });
});
