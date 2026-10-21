#!/bin/sh
# Wraps index.html in a full HTML document for hosting. GitHub Pages serves the docs/ folder.
cd "$(dirname "$0")"
mkdir -p docs
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<script>if (location.protocol === "http:" && location.hostname === "xray.ausiejus.lt") location.replace("https://" + location.host + location.pathname + location.search + location.hash);</script>\n</head>\n<body>\n'
  cat index.html
  printf '\n</body>\n</html>\n'
} > docs/index.html
echo "Built docs/index.html"
