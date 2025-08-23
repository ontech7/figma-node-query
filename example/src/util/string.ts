export function toCamelCase(input: string) {
  return input
    .split(",")
    .map((part) => part.replace(" ", ""))
    .map((part, index) => {
      const [, valueRaw] = part.split("=");
      let value = valueRaw.replace(" ", "");

      if (value === "—") {
        value = "Still";
      }

      if (index === 0) {
        return "button" + value.charAt(0).toUpperCase() + value.slice(1);
      }

      return value.charAt(0).toUpperCase() + value.slice(1);
    })
    .join("");
}
