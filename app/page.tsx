import { readFileSync } from "node:fs";
import path from "node:path";
import ClientEffects from "./client-effects";

const heroSlides = [
  {
    src: "/1.png",
    alt: "Yoga Narasimha anointed with turmeric, viewed from the left",
  },
  {
    src: "/2.png",
    alt: "Yoga Narasimha anointed with turmeric, seated in the sanctum",
  },
  {
    src: "/3.png",
    alt: "Front view of Yoga Narasimha anointed with turmeric",
  },
  {
    src: "/4.png",
    alt: "Yoga Narasimha anointed with turmeric, viewed from the right",
  },
  {
    src: "/5.png",
    alt: "Yoga Narasimha decorated with silver ornaments and garlands",
  },
];

const galleryCornerMarkup =
  '<i class="rf-corner tl"></i><i class="rf-corner tr"></i><i class="rf-corner bl"></i><i class="rf-corner br"></i>';

function getOriginalPageParts() {
  const htmlPath = path.join(process.cwd(), "Yoga Narsimha Website.html");
  const html = readFileSync(htmlPath, "utf8");
  const originalStyle = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const originalBody = html
    .match(/<body>([\s\S]*?)<script>/)?.[1]
    ?.trim();

  if (!originalBody) {
    throw new Error("Could not extract body from Yoga Narsimha Website.html");
  }

  const slidesMarkup = heroSlides
    .map(
      ({ src, alt }, index) =>
        `<img class="hero-slide-img crop-from-bottom${index === 0 ? " active" : ""}" src="${src}" alt="${alt}"${index === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>`,
    )
    .join("\n          ");

  const galleryMarkup = heroSlides
    .filter(({ src }) => src === "/1.png" || src === "/3.png")
    .map(
      ({ src, alt }) =>
        `<figure class="reveal royal-frame-sm" data-full="${src}" data-crop-bottom><img class="crop-from-bottom" src="${src}" alt="${alt}" loading="lazy">${galleryCornerMarkup}</figure>`,
    )
    .join("\n      ");

  const body = originalBody
    .replace(
      /<div class="clip">[\s\S]*?<\/div>\s*(<i class="rf-corner tl">)/,
      `<div class="clip">\n          ${slidesMarkup}\n        </div>\n        $1`,
    )
    .replace(
      /<div class="gallery-grid" style="margin-top:56px;">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>\s*<!-- DEITY -->/,
      `<div class="gallery-grid architecture-gallery" style="margin-top:56px;">$1\n      ${galleryMarkup}\n    </div>\n  </div>\n</section>\n\n<!-- DEITY -->`,
    );

  const style = `${originalStyle}

  /* Keep the top of tall shrine portraits visible and discard the camera strip at the bottom. */
  .hero-slide-img.crop-from-bottom{
    object-position:center top;
  }

  .gallery-grid.architecture-gallery{
    grid-template-columns:repeat(5,minmax(0,1fr));
  }
  .gallery-grid img.crop-from-bottom{
    object-position:center top;
  }
  .lightbox img.crop-from-bottom{
    width:min(90vw, calc(90vh * 0.5025));
    aspect-ratio:593 / 1180;
    object-fit:cover;
    object-position:center top;
  }
  @media (max-width:1100px){
    .gallery-grid.architecture-gallery{ grid-template-columns:repeat(3,minmax(0,1fr)); }
  }
  @media (max-width:880px){
    .gallery-grid.architecture-gallery{ grid-template-columns:repeat(2,minmax(0,1fr)); }
  }
  @media (max-width:520px){
    .gallery-grid.architecture-gallery{
      grid-template-columns:1fr;
      grid-auto-rows:230px;
    }
  }
  `;

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
