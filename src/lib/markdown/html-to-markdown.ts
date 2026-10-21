/**
 * Converts standard HTML markup to Markdown format.
 * Runs in the browser using the DOMParser API.
 */
export function htmlToMarkdown(html: string): string {
  if (!html.trim()) return "";
  if (typeof window === "undefined") return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const result = convertNode(doc.body).replace(/\n{3,}/g, "\n\n").trim();
    return result;
  } catch {
    return html;
  }
}

function convertNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (parent && (parent.tagName.toLowerCase() === "pre" || parent.tagName.toLowerCase() === "code")) {
      return node.textContent || "";
    }
    // Collapse consecutive whitespaces outside pre
    return (node.textContent || "").replace(/[\t\r\n ]+/g, " ");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  const getChildren = () => Array.from(el.childNodes).map(convertNode).join("");

  switch (tag) {
    case "h1":
      return `\n\n# ${getChildren().trim()}\n\n`;
    case "h2":
      return `\n\n## ${getChildren().trim()}\n\n`;
    case "h3":
      return `\n\n### ${getChildren().trim()}\n\n`;
    case "h4":
      return `\n\n#### ${getChildren().trim()}\n\n`;
    case "h5":
      return `\n\n##### ${getChildren().trim()}\n\n`;
    case "h6":
      return `\n\n###### ${getChildren().trim()}\n\n`;
    case "p":
      return `\n\n${getChildren().trim()}\n\n`;
    case "br":
      return "  \n";
    case "hr":
      return "\n\n---\n\n";
    case "strong":
    case "b": {
      const c = getChildren().trim();
      return c ? `**${c}**` : "";
    }
    case "em":
    case "i": {
      const c = getChildren().trim();
      return c ? `*${c}*` : "";
    }
    case "s":
    case "del":
    case "strike": {
      const c = getChildren().trim();
      return c ? `~~${c}~~` : "";
    }
    case "mark": {
      const c = getChildren().trim();
      return c ? `==${c}==` : "";
    }
    case "sup": {
      const c = getChildren().trim();
      return c ? `^${c}^` : "";
    }
    case "sub": {
      const c = getChildren().trim();
      return c ? `~${c}~` : "";
    }
    case "code": {
      if (el.parentElement?.tagName.toLowerCase() === "pre") {
        return el.textContent || "";
      }
      const c = el.textContent || "";
      return c.includes("`") ? `\`\` ${c} \`\`` : `\`${c}\``;
    }
    case "pre": {
      const codeChild = el.querySelector("code");
      const langMatch = (codeChild?.className || el.className).match(/language-([a-z0-9_-]+)/i);
      const lang = langMatch ? langMatch[1] : "";
      const text = (codeChild ? codeChild.textContent : el.textContent) || "";
      return `\n\n\`\`\`${lang}\n${text.replace(/\r\n/g, "\n").trim()}\n\`\`\`\n\n`;
    }
    case "blockquote": {
      const text = getChildren().trim();
      const quoted = text
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
      return `\n\n${quoted}\n\n`;
    }
    case "a": {
      const href = el.getAttribute("href") || "#";
      const title = el.getAttribute("title");
      const text = getChildren().trim() || href;
      return title ? `[${text}](${href} "${title}")` : `[${text}](${href})`;
    }
    case "img": {
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "";
      const title = el.getAttribute("title");
      return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
    }
    case "ul": {
      const items: string[] = [];
      el.querySelectorAll(":scope > li").forEach((li) => {
        const checkbox = li.querySelector('input[type="checkbox"]');
        let prefix = "- ";
        if (checkbox) {
          prefix = (checkbox as HTMLInputElement).checked ? "- [x] " : "- [ ] ";
        }
        const text = Array.from(li.childNodes)
          .filter((n) => !(n.nodeType === Node.ELEMENT_NODE && (n as HTMLElement).tagName.toLowerCase() === "input"))
          .map(convertNode)
          .join("")
          .trim();
        items.push(`${prefix}${text}`);
      });
      return `\n\n${items.join("\n")}\n\n`;
    }
    case "ol": {
      const items: string[] = [];
      let i = 1;
      el.querySelectorAll(":scope > li").forEach((li) => {
        const text = convertNode(li).trim();
        items.push(`${i++}. ${text}`);
      });
      return `\n\n${items.join("\n")}\n\n`;
    }
    case "table": {
      const rows = Array.from(el.querySelectorAll("tr"));
      if (rows.length === 0) return "";
      const tableData = rows.map((tr) =>
        Array.from(tr.querySelectorAll("th, td")).map((cell) =>
          convertNode(cell).replace(/\n/g, " ").trim()
        )
      );
      if (tableData.length === 0) return "";
      const colCount = Math.max(...tableData.map((r) => r.length));
      const normalized = tableData.map((row) => {
        while (row.length < colCount) row.push("");
        return row;
      });

      const header = normalized[0];
      const sep = header.map(() => "---");
      const dataRows = normalized.slice(1);

      const headerLine = `| ${header.join(" | ")} |`;
      const sepLine = `| ${sep.join(" | ")} |`;
      const bodyLines = dataRows.map((r) => `| ${r.join(" | ")} |`).join("\n");

      return `\n\n${headerLine}\n${sepLine}\n${bodyLines}\n\n`;
    }
    default:
      return getChildren();
  }
}
