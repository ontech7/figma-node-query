export type JSONValue = string | number | boolean | JSONObject | JSONArray;

export interface JSONObject extends Record<string, any> {
  children?: JSONObject[];
}

export interface JSONArray extends Array<JSONValue> {}
