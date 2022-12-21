export default function log(tag: string, color: string, subText: string, rawData?: any) {
  let data;
  try {
    data = JSON.parse(rawData);
  } catch {
    data = rawData;
  }
  console.log(
    `%c[${tag}] %c${subText}`,
    `color: ${color}; font-weight: bold;`,
    "color: gray;",
    `${data ? "\n" : ""}`,
    data ?? ""
  );
}
