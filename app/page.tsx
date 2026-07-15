import { readFileSync } from "node:fs";
import path from "node:path";
import ClientEffects from "./client-effects";

function getOriginalPageParts() {
  const htmlPath = path.join(process.cwd(), "Yoga Narsimha Website.html");
  const html = readFileSync(htmlPath, "utf8");
  const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const body = html
    .match(/<body>([\s\S]*?)<script>/)?.[1]
    ?.trim();

  if (!body) {
    throw new Error("Could not extract body from Yoga Narsimha Website.html");
  }

  return { style, body };
}

export default function Home() {
  const { style, body } = getOriginalPageParts();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ClientEffects />
    </>
  );
}
