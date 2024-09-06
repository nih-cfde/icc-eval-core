import test, { expect } from "@playwright/test";
import { splitPath } from "@/util/string";

test("split path", () => {
  const tests = {
    "http://data.org/": ["http://data.org", "", ""],
    "http://data.org": ["http://data.org", "", ""],
    "http://data.org/doc/": ["http://data.org/doc", "", ""],
    "http://data.org/doc": ["http://data.org/doc", "", ""],
    "http://data.org/api-v1": ["http://data.org/api-v1", "", ""],
    "http://data.org/v1/file.123.py": ["http://data.org/v1", "file.123", "py"],
    "https://data.org/?q=<SEARCH>": ["https://data.org/?q=<SEARCH>", "", ""],
    "http://data.org/{gene.name}": ["http://data.org/{gene.name}", "", ""],
    "/folder/folder/abc.123.csv": ["folder/folder", "abc.123", "csv"],
    "/folder/abc.123.csv": ["folder", "abc.123", "csv"],
    "folder/abc.123.csv": ["folder", "abc.123", "csv"],
    "/abc.123.csv": ["", "abc.123", "csv"],
    "abc.123.csv": ["", "abc.123", "csv"],
  };
  for (const [input, output] of Object.entries(tests)) {
    const { dir, name, ext } = splitPath(input);
    expect([input, dir, name, ext]).toEqual([input, ...output]);
  }
});
