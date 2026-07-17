import { readFileSync } from "node:fs";
import path from "node:path";
import ChantPlayer from "./chant-player";
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

const sanctumGallerySlides = heroSlides.slice(0, 3);
const galleryCornerMarkup =
  '<i class="rf-corner tl"></i><i class="rf-corner tr"></i><i class="rf-corner bl"></i><i class="rf-corner br"></i>';

function curateSanctumGallery(body: string) {
  const sectionStart = body.indexOf("<!-- GALLERY -->");
  const galleryStart = body.indexOf('<div class="gallery-grid">', sectionStart);

  if (sectionStart === -1 || galleryStart === -1) return body;

  const galleryContentStart = body.indexOf(">", galleryStart) + 1;
  const galleryEnd = body.indexOf("</div>", galleryContentStart);
  if (galleryEnd === -1) return body;

  const galleryContent = body.slice(galleryContentStart, galleryEnd);

  const originalFigures = Array.from(
    galleryContent.matchAll(/<figure[\s\S]*?<\/figure>/g),
    (match) => match[0],
  )
    .filter((_figure, index) => index !== 1 && index !== 2)
    .map((figure) =>
      figure
        .replace(/class="([^"]*)"/, (_match, classNames: string) => {
          const classes = classNames
            .split(/\s+/)
            .filter((className) => className !== "tall" && className !== "wide");
          if (!classes.includes("sanctum-photo")) classes.push("sanctum-photo");
          return `class="${classes.join(" ")}"`;
        })
        .replace("<img ", '<img loading="lazy" '),
    );

  const addedFigures = sanctumGallerySlides
    .map(
      ({ src, alt }) =>
        `<figure class="reveal royal-frame-sm sanctum-photo" data-full="${src}"><img src="${src}" alt="${alt}" loading="lazy">${galleryCornerMarkup}</figure>`,
    );
  const galleryFigures = [...originalFigures, ...addedFigures].join("\n      ");

  return `${body.slice(0, galleryStart)}<div class="gallery-grid sanctum-gallery">
      ${galleryFigures}
    </div>${body.slice(galleryEnd + "</div>".length)}`;
}

function removeArchitectureGallery(body: string) {
  const sectionStart = body.indexOf("<!-- ARCHITECTURE -->");
  const sectionEnd = body.indexOf("<!-- DEITY -->", sectionStart);
  const galleryStart = body.indexOf(
    '<div class="gallery-grid" style="margin-top:56px;">',
    sectionStart,
  );

  if (
    sectionStart === -1 ||
    sectionEnd === -1 ||
    galleryStart === -1 ||
    galleryStart > sectionEnd
  ) {
    return body;
  }

  const galleryEnd = body.indexOf("</div>", galleryStart);
  if (galleryEnd === -1 || galleryEnd > sectionEnd) return body;

  return `${body.slice(0, galleryStart)}${body.slice(
    galleryEnd + "</div>".length,
  )}`;
}

function addArchitectureExterior(body: string) {
  const architectureCopyPattern =
    /<div class="reveal">\s*(<p>The temple sits on a[\s\S]*?<\/p>\s*<p>It follows the compact[\s\S]*?<\/p>)\s*<\/div>/;

  return body.replace(
    architectureCopyPattern,
    `<div class="reveal architecture-copy">
        <div class="art architecture-exterior royal-frame">
          <img src="/outsidetemple.png" alt="Exterior view of the Yoga Narasimha Temple at Baggavalli">
          ${galleryCornerMarkup}
          <div class="frame-tag">Temple Exterior</div>
        </div>
        <div class="architecture-text">$1</div>
      </div>`,
  );
}

function updateTopbarIcon(body: string) {
  return body.replace(
    /(<header class="nav" id="siteNav">\s*<div class="brand"><img\s+src=")[^"]+("[^>]*>)/,
    "$1/3.png$2",
  );
}

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

  const bodyWithUpdatedTopbar = updateTopbarIcon(originalBody);
  const bodyWithUpdatedHero = bodyWithUpdatedTopbar.replace(
    /<div class="clip">[\s\S]*?<\/div>\s*(<i class="rf-corner tl">)/,
    `<div class="clip">\n          ${slidesMarkup}\n        </div>\n        $1`,
  );
  const body = curateSanctumGallery(
    addArchitectureExterior(removeArchitectureGallery(bodyWithUpdatedHero)),
  );

  const style = `${originalStyle}

  /* Keep the top of tall shrine portraits visible and discard the camera strip at the bottom. */
  .hero-slide-img.crop-from-bottom{
    object-position:center top;
  }

  header.nav .brand-logo{
    object-fit:cover;
    object-position:center 34%;
  }

  .gallery-grid.sanctum-gallery{
    grid-template-columns:repeat(4,minmax(0,1fr));
    grid-auto-rows:auto;
    gap:18px;
    align-items:start;
  }
  .gallery-grid.sanctum-gallery figure{
    aspect-ratio:3 / 4;
    background:#0b0805;
  }
  .gallery-grid.sanctum-gallery img{
    object-fit:contain;
    object-position:center;
    filter:saturate(0.96) brightness(0.96);
  }
  .gallery-grid.sanctum-gallery figure:hover img{
    transform:none;
    filter:saturate(1) brightness(1);
  }
  .lightbox img.crop-from-bottom{
    width:min(90vw, calc(90vh * 0.5025));
    aspect-ratio:593 / 1180;
    object-fit:cover;
    object-position:center top;
  }
  .architecture-copy{
    display:flex;
    flex-direction:column;
    gap:38px;
    align-self:stretch;
    justify-content:center;
  }
  .architecture-exterior{
    width:100%;
  }
  .about-grid.reverse .architecture-exterior{
    order:0;
  }
  .architecture-exterior img{
    aspect-ratio:3 / 2;
    object-fit:cover;
    object-position:center;
  }
  .architecture-text p:last-child{
    margin-bottom:0;
  }
  @media (min-width:881px){
    #deity .deity-wrap .star-frame{
      transform:translateX(28px);
    }
  }
  @media (max-width:1100px){
    .gallery-grid.sanctum-gallery{ grid-template-columns:repeat(2,minmax(0,1fr)); }
  }
  @media (max-width:520px){
    .gallery-grid.sanctum-gallery{
      grid-template-columns:1fr;
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
      <ChantPlayer />
      <ClientEffects />
    </>
  );
}
