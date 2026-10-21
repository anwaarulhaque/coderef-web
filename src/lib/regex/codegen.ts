// Code snippets that run the current pattern in other languages.
export type CodeLanguage = "JavaScript" | "Python" | "PHP" | "Java" | "C#" | "Go" | "Ruby";

export const CODE_LANGUAGES: CodeLanguage[] = ["JavaScript", "Python", "PHP", "Java", "C#", "Go", "Ruby"];

// Escapes "/" so the pattern can sit between slash delimiters.
const slashEscape = (pattern: string) => pattern.replace(/\\.|\//g, (m) => (m === "/" ? "\\/" : m));
const quoted = (s: string) => JSON.stringify(s);

type Input = { pattern: string; flags: string; text: string; substitution?: string };

export function generateCode(lang: CodeLanguage, { pattern, flags, text, substitution }: Input): { code: string; note?: string } {
  const global = flags.includes("g");
  const has = (f: string) => flags.includes(f);
  const sub = substitution !== undefined;

  switch (lang) {
    case "JavaScript": {
      const lines = [`const regex = /${slashEscape(pattern)}/${flags};`, `const str = ${quoted(text)};`, ""];
      if (sub) {
        lines.push(`const subst = ${quoted(substitution)};`, "const result = str.replace(regex, subst);", "console.log(result);");
      } else if (global) {
        lines.push("for (const match of str.matchAll(regex)) {", "  console.log(`Found \"${match[0]}\" at ${match.index}`, match.slice(1), match.groups);", "}");
      } else {
        lines.push("const match = regex.exec(str);", "if (match) console.log(match[0], match.index, match.slice(1), match.groups);");
      }
      return { code: lines.join("\n") };
    }
    case "Python": {
      const py = pattern.replace(/\(\?<(?![=!])/g, "(?P<").replace(/\\k<([^>]+)>/g, "(?P=$1)");
      const pyFlags = [has("i") && "re.IGNORECASE", has("m") && "re.MULTILINE", has("s") && "re.DOTALL"].filter(Boolean).join(" | ");
      const flagArg = pyFlags ? `, ${pyFlags}` : "";
      const lines = ["import re", "", `regex = re.compile(${quoted(py)}${flagArg})`, `text = ${quoted(text)}`, ""];
      if (sub) {
        const pySub = substitution.replace(/\$<([^>]+)>/g, "\\g<$1>").replace(/\$(\d+)/g, "\\g<$1>").replace(/\$&/g, "\\g<0>");
        lines.push(`result = regex.sub(${quoted(pySub)}, text${global ? "" : ", count=1"})`, "print(result)");
      } else if (global) {
        lines.push("for match in regex.finditer(text):", '    print(f"Found {match.group()!r} at {match.start()}", match.groups(), match.groupdict())');
      } else {
        lines.push("match = regex.search(text)", "if match:", "    print(match.group(), match.start(), match.groups(), match.groupdict())");
      }
      return { code: lines.join("\n"), note: "Python uses (?P<name>…) for named groups; the pattern was converted." };
    }
    case "PHP": {
      const phpFlags = ["i", "m", "s", "u"].filter(has).join("");
      const single = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
      const lines = ["<?php", "", `$re = ${single(`/${slashEscape(pattern)}/${phpFlags}`)};`, `$str = ${single(text)};`, ""];
      if (sub) {
        lines.push(`$subst = ${single(substitution.replace(/\$<([^>]+)>/g, "\\${$1}"))};`, `$result = preg_replace($re, $subst, $str${global ? "" : ", 1"});`, "echo $result;");
      } else if (global) {
        lines.push("preg_match_all($re, $str, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);", "print_r($matches);");
      } else {
        lines.push("if (preg_match($re, $str, $match, PREG_OFFSET_CAPTURE)) {", "    print_r($match);", "}");
      }
      return { code: lines.join("\n") };
    }
    case "Java": {
      const javaFlags = [has("i") && "Pattern.CASE_INSENSITIVE", has("m") && "Pattern.MULTILINE", has("s") && "Pattern.DOTALL", has("u") && "Pattern.UNICODE_CASE"].filter(Boolean).join(" | ");
      const lines = [
        "import java.util.regex.Matcher;",
        "import java.util.regex.Pattern;",
        "",
        "public class Example {",
        "    public static void main(String[] args) {",
        `        Pattern pattern = Pattern.compile(${quoted(pattern)}${javaFlags ? `, ${javaFlags}` : ""});`,
        `        String input = ${quoted(text)};`,
        "        Matcher matcher = pattern.matcher(input);",
      ];
      if (sub) {
        const javaSub = substitution.replace(/\$<([^>]+)>/g, "${$1}").replace(/\$&/g, "$0");
        lines.push(`        String result = matcher.${global ? "replaceAll" : "replaceFirst"}(${quoted(javaSub)});`, "        System.out.println(result);");
      } else {
        lines.push(`        ${global ? "while" : "if"} (matcher.find()) {`, '            System.out.println("Found \\"" + matcher.group() + "\\" at " + matcher.start());', "            for (int i = 1; i <= matcher.groupCount(); i++) {", '                System.out.println("  Group " + i + ": " + matcher.group(i));', "            }", "        }");
      }
      lines.push("    }", "}");
      return { code: lines.join("\n") };
    }
    case "C#": {
      const csFlags = [has("i") && "RegexOptions.IgnoreCase", has("m") && "RegexOptions.Multiline", has("s") && "RegexOptions.Singleline"].filter(Boolean).join(" | ");
      const lines = [
        "using System;",
        "using System.Text.RegularExpressions;",
        "",
        `var regex = new Regex(${quoted(pattern)}${csFlags ? `, ${csFlags}` : ""});`,
        `var input = ${quoted(text)};`,
        "",
      ];
      if (sub) {
        const csSub = substitution.replace(/\$<([^>]+)>/g, "${$1}").replace(/\$&/g, "$0");
        lines.push(`var result = regex.Replace(input, ${quoted(csSub)}${global ? "" : ", 1"});`, "Console.WriteLine(result);");
      } else if (global) {
        lines.push("foreach (Match match in regex.Matches(input))", "{", '    Console.WriteLine($"Found \\"{match.Value}\\" at {match.Index}");', "}");
      } else {
        lines.push("var match = regex.Match(input);", 'if (match.Success) Console.WriteLine($"Found \\"{match.Value}\\" at {match.Index}");');
      }
      return { code: lines.join("\n") };
    }
    case "Go": {
      const inline = ["i", "m", "s"].filter(has).join("");
      const goPattern = (inline ? `(?${inline})` : "") + pattern.replace(/\(\?<(?![=!])/g, "(?P<");
      const literal = goPattern.includes("`") ? quoted(goPattern) : `\`${goPattern}\``;
      const lines = ["package main", "", 'import (', '\t"fmt"', '\t"regexp"', ")", "", "func main() {", `\tre := regexp.MustCompile(${literal})`, `\tstr := ${quoted(text)}`, ""];
      if (sub) {
        const goSub = substitution.replace(/\$<([^>]+)>/g, "${$1}").replace(/\$(\d+)/g, "${$1}").replace(/\$&/g, "${0}");
        lines.push(`\tresult := re.ReplaceAllString(str, ${quoted(goSub)})`, "\tfmt.Println(result)");
      } else {
        lines.push(`\tfor _, match := range re.FindAllStringSubmatchIndex(str, ${global ? -1 : 1}) {`, "\t\tfmt.Println(str[match[0]:match[1]], match)", "\t}");
      }
      lines.push("}");
      return { code: lines.join("\n"), note: "Go's RE2 engine has no lookaround or backreferences." };
    }
    case "Ruby": {
      const rbFlags = (has("i") ? "i" : "") + (has("s") ? "m" : "");
      const rbText = quoted(text).replace(/#\{/g, "\\#{");
      const lines = [`re = /${slashEscape(pattern)}/${rbFlags}`, `str = ${rbText}`, ""];
      if (sub) {
        const rbSub = substitution.replace(/\$<([^>]+)>/g, "\\\\k<$1>").replace(/\$(\d+)/g, "\\\\$1").replace(/\$&/g, "\\\\0");
        lines.push(`result = str.${global ? "gsub" : "sub"}(re, ${quoted(rbSub)})`, "puts result");
      } else if (global) {
        lines.push("str.scan(re) do", "  match = Regexp.last_match", '  puts "Found #{match[0].inspect} at #{match.begin(0)}"', "end");
      } else {
        lines.push("if (match = re.match(str))", '  puts "Found #{match[0].inspect} at #{match.begin(0)}"', "end");
      }
      return { code: lines.join("\n"), note: "In Ruby, ^ and $ always match at line boundaries, and /m means dotAll." };
    }
  }
}
