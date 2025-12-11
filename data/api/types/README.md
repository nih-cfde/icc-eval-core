# How to generate types

## RePORTER

### Query

1. Copy "Example Value" textbox contents from [API docs](https://api.reporter.nih.gov/)
1. [Convert key names to snake_case](https://www.better-converter.com/JSON-Modifiers/Json-Snake-Case-Converter)
1. [Convert to TypeScript schema](https://app.quicktype.io/?l=ts) with only these options checked: `interfaces only`, `use types instead of interfaces`, `use string instead of enum`, `make all properties optional`

### Results

1. Go to https://api.reporter.nih.gov in browser
1. Run script below in browser dev console
1. Convert to TypeScript schema same way as above

```js
// projects/search or publications/search
fetch("https://api.reporter.nih.gov/v2/projects/search", {
  method: "POST",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ criteria: {}, limit: 500 }),
})
  .then((r) => r.json())
  .then(console.log);
```

## iCite

### Results

1. Run script below in browser dev console
1. Convert to TypeScript schema same way as above

```js
fetch("https://icite.od.nih.gov/api/pubs?fl=all")
  .then((r) => r.json())
  .then(console.log);
```
