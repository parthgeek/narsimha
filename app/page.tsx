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

  originalFigures[2] =
    `<figure class="reveal royal-frame-sm sanctum-photo" data-full="/5.png"><img src="/5.png" alt="Yoga Narasimha decorated with silver ornaments and garlands" loading="lazy">${galleryCornerMarkup}</figure>`;

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
        <div class="architecture-text">$1</div>
        <div class="architecture-photo">
          <div class="architecture-photo-heading">
            <span class="kicker">Seen From The Road</span>
            <h3>The Temple, As It Stands Today</h3>
          </div>
          <div class="art architecture-exterior royal-frame">
            <img src="/outsidetemple.png" alt="Exterior view of the Yoga Narasimha Temple at Baggavalli">
            ${galleryCornerMarkup}
            <div class="frame-tag">Temple Exterior</div>
          </div>
        </div>
      </div>`,
  );
}

function updateTopbarIcon(body: string) {
  return body
    .replace(
      /(<header class="nav" id="siteNav">\s*<div class="brand"><img\s+src=")[^"]+("[^>]*>)/,
      "$1/3.png$2",
    )
    .replace(
      '<a href="#visit">Visit</a>',
      '<a href="#experience">Visit</a>',
    );
}

function updateDeityImage(body: string) {
  return body.replace(
    /(<section id="deity">[\s\S]*?<div class="deity-star star-clip">\s*<img src=")[^"]+(" alt=")[^"]+("[^>]*>)/,
    "$1/3.png$2Front view of Yoga Narasimha anointed with turmeric$3",
  );
}

const templeExperienceMarkup = `
<!-- TEMPLE LOCATION MAP -->
<section id="experience" class="temple-experience">
  <div class="section-inner">
    <div class="experience-grid">
      <div class="experience-copy reveal in">
        <div class="kicker">Temple Location</div>
        <h2>Find your way to Baggavalli</h2>
        <p class="lead">Sri Yoga Narasimha Swamy Temple is located in Baggavalli village, near Ajjampura in Karnataka.</p>
        <p>Use the interactive map to inspect the surrounding roads, open the location in Google Maps, or begin navigation from your current location.</p>
        <div class="experience-notes" aria-label="Temple location details">
          <span><b>Village</b> Baggavalli</span>
          <span><b>Taluk</b> Ajjampura</span>
          <span><b>District</b> Chikkamagaluru</span>
          <span><b>PIN</b> 577547</span>
          <span><b>From Ajjampura</b> About 3 km</span>
        </div>
        <a class="experience-map-link" href="https://www.google.com/maps/search/?api=1&amp;query=Sri+Yoga+Narasimha+Swamy+Temple+Baggavalli+Ajjampura+Karnataka" target="_blank" rel="noopener noreferrer">Get directions in Google Maps <span aria-hidden="true">↗</span></a>
      </div>

      <div class="temple-map-card reveal in">
        <div id="templeMap" class="temple-map" role="application" aria-label="Interactive map showing Sri Yoga Narasimha Swamy Temple in Baggavalli"></div>
      </div>
    </div>

    <div class="visit-essentials reveal">
      <div class="visit-essentials-heading">
        <div>
          <div class="kicker">Plan Your Darshan</div>
          <h3>Before you visit</h3>
        </div>
        <p>Village temple schedules may change with the season and priest availability. Confirm locally before making a long journey.</p>
      </div>
      <div class="visit-essentials-grid">
        <div class="visit-essential"><span>Typical hours</span><strong>11:30–2:30<br>5:30–6:30</strong></div>
        <div class="visit-essential"><span>Entry</span><strong>Free</strong></div>
        <div class="visit-essential"><span>Dress</span><strong>Modest, temple-appropriate</strong></div>
        <div class="visit-essential"><span>Best for</span><strong>Quiet darshan, heritage &amp; photography</strong></div>
      </div>
      <p class="visit-essentials-note">The shrine is a working temple as well as a protected monument. Photography and footwear norms are set on site.</p>
    </div>
  </div>
</section>`;

function addTempleExperience(body: string) {
  return body.replace(
    /<!-- VISIT -->[\s\S]*?<!-- SEVA -->/,
    `${templeExperienceMarkup}\n\n<!-- SEVA -->`,
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

  const bodyWithUpdatedTopbar = updateDeityImage(updateTopbarIcon(originalBody));
  const bodyWithUpdatedHero = bodyWithUpdatedTopbar.replace(
    /<div class="clip">[\s\S]*?<\/div>\s*(<i class="rf-corner tl">)/,
    `<div class="clip">\n          ${slidesMarkup}\n        </div>\n        $1`,
  );
  const body = addTempleExperience(
    curateSanctumGallery(
      addArchitectureExterior(removeArchitectureGallery(bodyWithUpdatedHero)),
    ),
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
  .about-grid.reverse{
    align-items:stretch;
  }
  .architecture-copy{
    display:flex;
    flex-direction:column;
    gap:38px;
    justify-content:space-between;
  }
  .architecture-photo{
    display:flex;
    flex-direction:column;
    gap:18px;
  }
  .architecture-photo-heading{
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  .architecture-photo-heading h3{
    font-size:1.32rem;
    color:var(--ivory);
    letter-spacing:0.01em;
  }
  .architecture-exterior{
    width:100%;
  }
  .about-grid.reverse .architecture-photo{
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
  #deity .deity-star{
    background:#0b0805;
  }
  #deity .deity-star img{
    object-fit:contain;
    object-position:center;
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

  /* ---------- Interactive temple study ---------- */
  .temple-experience{
    overflow:hidden;
    background:
      radial-gradient(circle at 78% 18%, rgba(212,160,23,.08), transparent 27%),
      linear-gradient(180deg, var(--void) 0%, #100b07 100%);
    border-top:1px solid var(--stone-line);
  }
  .experience-grid{
    display:grid;
    grid-template-columns:minmax(300px,.76fr) minmax(520px,1.24fr);
    align-items:stretch;
    gap:clamp(42px,6vw,92px);
  }
  .experience-copy h2{
    max-width:560px;
    margin:14px 0 24px;
    font-size:clamp(2.25rem,4.5vw,4.65rem);
    line-height:.98;
    letter-spacing:-.045em;
    text-wrap:balance;
  }
  .experience-copy .lead{
    max-width:540px;
    margin:0 0 20px;
    color:var(--ivory);
    font-family:'Cormorant Garamond',serif;
    font-size:clamp(1.25rem,1.8vw,1.55rem);
    font-style:italic;
    line-height:1.55;
  }
  .experience-copy > p:not(.lead){ max-width:540px; line-height:1.8; }
  .experience-notes{
    display:flex;
    flex-wrap:wrap;
    gap:8px 18px;
    margin:30px 0 26px;
    color:var(--taupe-dim);
    font-size:.74rem;
    letter-spacing:.06em;
  }
  .experience-notes span{ white-space:nowrap; }
  .experience-notes b{ color:var(--gold-bright); font-weight:500; }
  .experience-map-link{
    display:inline-flex;
    align-items:center;
    gap:12px;
    color:var(--gold-bright);
    font-size:.77rem;
    font-weight:600;
    letter-spacing:.12em;
    text-decoration:none;
    text-transform:uppercase;
  }
  .experience-map-link span{ transition:transform .25s ease; }
  .experience-map-link:hover span{ transform:translate(3px,-3px); }
  .experience-map-link:focus-visible{ outline:2px solid var(--gold); outline-offset:6px; }

  .visit-essentials{
    margin-top:clamp(62px,8vw,104px);
    padding-top:clamp(36px,5vw,56px);
    border-top:1px solid var(--stone-line);
  }
  .visit-essentials-heading{
    display:grid;
    grid-template-columns:minmax(260px,.8fr) minmax(320px,1.2fr);
    align-items:end;
    gap:48px;
    margin-bottom:32px;
  }
  .visit-essentials-heading h3{
    margin-top:10px;
    color:var(--ivory);
    font-family:'Cinzel',serif;
    font-size:clamp(1.8rem,3vw,2.8rem);
    font-weight:500;
    letter-spacing:-.025em;
  }
  .visit-essentials-heading p{
    max-width:660px;
    margin:0;
    color:var(--taupe);
    line-height:1.75;
  }
  .visit-essentials-grid{
    display:grid;
    grid-template-columns:repeat(4,minmax(0,1fr));
    border-top:1px solid rgba(212,160,23,.25);
    border-bottom:1px solid rgba(212,160,23,.25);
  }
  .visit-essential{
    min-height:142px;
    padding:25px 24px 28px;
    border-right:1px solid rgba(212,160,23,.2);
  }
  .visit-essential:last-child{ border-right:0; }
  .visit-essential span{
    display:block;
    margin-bottom:13px;
    color:var(--gold);
    font-size:.66rem;
    font-weight:600;
    letter-spacing:.14em;
    text-transform:uppercase;
  }
  .visit-essential strong{
    color:var(--ivory);
    font-family:'Cormorant Garamond',serif;
    font-size:clamp(1.12rem,1.6vw,1.38rem);
    font-weight:500;
    line-height:1.35;
  }
  .visit-essentials-note{
    max-width:920px;
    margin:24px 0 0;
    color:var(--taupe-dim);
    font-size:.82rem;
    line-height:1.7;
  }

  .temple-map-card{
    position:relative;
    min-height:0;
    overflow:hidden;
    border:1px solid rgba(212,160,23,.35);
    border-radius:3px;
    background:#17100a;
    box-shadow:0 35px 90px rgba(5,3,2,.52), inset 0 0 0 1px rgba(255,244,207,.035);
  }
  .temple-map{
    display:block;
    width:100%;
    height:100%;
    min-height:0;
    filter:saturate(.78) sepia(.12) contrast(1.04);
  }
  .temple-map .leaflet-control-zoom a{
    border-color:rgba(212,160,23,.3);
    background:#17100a;
    color:var(--gold-bright);
  }
  .temple-map .leaflet-control-zoom a:hover{ background:#261a10; color:var(--ivory); }
  .temple-map .leaflet-control-attribution{
    background:rgba(15,10,7,.84);
    color:var(--taupe);
    font-size:.64rem;
  }
  .temple-map .leaflet-control-attribution a{ color:var(--gold-bright); }
  .temple-logo-marker{
    border:0;
    background:transparent;
  }
  .temple-logo-marker-shell{
    position:relative;
    z-index:1;
    display:block;
    width:64px;
    height:64px;
    border:3px solid var(--gold-bright);
    border-radius:50%;
    background:#100b07;
    box-shadow:0 8px 24px rgba(5,3,2,.55),0 0 0 5px rgba(212,160,23,.18);
  }
  .temple-logo-marker-shell::after{
    content:'';
    position:absolute;
    left:50%;
    bottom:-10px;
    width:17px;
    height:17px;
    border-right:3px solid var(--gold-bright);
    border-bottom:3px solid var(--gold-bright);
    background:#100b07;
    transform:translateX(-50%) rotate(45deg);
    z-index:-1;
  }
  .temple-logo-marker-shell img{
    display:block;
    width:100%;
    height:100%;
    border-radius:50%;
    object-fit:cover;
  }
  .temple-map .leaflet-popup-content-wrapper,
  .temple-map .leaflet-popup-tip{
    border:1px solid rgba(212,160,23,.35);
    background:#17100a;
    color:var(--ivory);
  }
  .temple-map .leaflet-popup-content{ margin:14px 18px; line-height:1.45; }
  .temple-map .leaflet-popup-content strong{
    display:block;
    margin-bottom:3px;
    color:var(--gold-bright);
    font-family:'Cinzel',serif;
    font-size:.78rem;
    font-weight:500;
  }
  .temple-map .leaflet-popup-content span{ color:var(--taupe); font-size:.72rem; }
  .temple-map .leaflet-popup-close-button{ color:var(--gold-bright); }
  .temple-viewer{
    position:relative;
    min-height:clamp(520px,58vw,680px);
    overflow:hidden;
    border:1px solid rgba(212,160,23,.28);
    border-radius:3px;
    background:#17100a;
    box-shadow:0 35px 90px rgba(5,3,2,.52), inset 0 0 0 1px rgba(255,244,207,.035);
    isolation:isolate;
  }
  .temple-viewer::after{
    content:'';
    position:absolute;
    inset:0;
    z-index:8;
    pointer-events:none;
    box-shadow:inset 0 0 80px rgba(3,2,1,.58);
  }
  .temple-viewer:fullscreen{ width:100vw; min-height:100vh; border:0; border-radius:0; }
  .viewer-meta{
    position:absolute;
    top:26px;
    left:28px;
    z-index:12;
    display:flex;
    flex-direction:column;
    padding-left:15px;
    border-left:1px solid var(--gold);
    text-shadow:0 2px 18px #080503;
  }
  .viewer-meta .viewer-eyebrow{
    margin-bottom:7px;
    color:var(--gold);
    font-size:.6rem;
    letter-spacing:.17em;
    text-transform:uppercase;
  }
  .viewer-meta strong{ color:var(--ivory); font-family:'Cinzel',serif; font-size:.95rem; font-weight:500; }
  .viewer-meta > span:last-child{ margin-top:4px; color:var(--taupe); font-size:.73rem; }

  .temple-scene{
    --photo-x:0px;
    --photo-y:0px;
    --photo-zoom:1;
    position:absolute;
    inset:0;
    overflow:hidden;
    cursor:grab;
    outline:none;
    touch-action:none;
    user-select:none;
    background:#0a0705;
  }
  .temple-scene:active{ cursor:grabbing; }
  .temple-scene:focus-visible{ box-shadow:inset 0 0 0 2px var(--gold-bright); }
  .viewer-hint{
    position:absolute;
    left:50%;
    bottom:82px;
    z-index:12;
    display:flex;
    align-items:center;
    gap:9px;
    transform:translateX(-50%);
    color:rgba(244,232,205,.75);
    font-size:.63rem;
    letter-spacing:.12em;
    text-transform:uppercase;
    transition:opacity .3s ease;
    white-space:nowrap;
  }
  .viewer-hint span{ width:22px; height:13px; border:1px solid var(--gold-dim); border-radius:8px; }
  .viewer-hint span::after{ content:''; display:block; width:1px; height:5px; margin:2px auto 0; background:var(--gold); }
  .temple-viewer.has-interacted .viewer-hint{ opacity:0; }
  .viewer-controls{
    position:absolute;
    left:50%;
    bottom:25px;
    z-index:12;
    display:flex;
    align-items:center;
    transform:translateX(-50%);
    border:1px solid rgba(212,160,23,.28);
    background:rgba(13,8,5,.76);
    box-shadow:inset 0 1px rgba(255,255,255,.05),0 12px 30px rgba(0,0,0,.25);
    backdrop-filter:blur(12px);
  }
  .viewer-controls button{
    width:42px;
    height:40px;
    border:0;
    border-right:1px solid rgba(212,160,23,.17);
    background:transparent;
    color:var(--ivory);
    font:500 1.08rem/1 'Barlow',sans-serif;
    cursor:pointer;
    transition:background .22s ease,color .22s ease,transform .12s ease;
  }
  .viewer-controls button:last-child{ border-right:0; }
  .viewer-controls button:hover{ background:rgba(212,160,23,.13); color:var(--gold-bright); }
  .viewer-controls button:active{ transform:translateY(1px) scale(.96); }
  .viewer-controls button:focus-visible{ outline:2px solid var(--gold-bright); outline-offset:-3px; }
  .control-rule{ width:1px; height:22px; margin:0 5px; background:rgba(212,160,23,.4); }
  .viewer-credit{
    position:absolute;
    right:14px;
    bottom:8px;
    z-index:12;
    color:rgba(201,185,153,.46);
    font-size:.52rem;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .viewer-credit a{ color:inherit; text-decoration:none; }
  .viewer-credit a:hover{ color:var(--gold-bright); }
  .temple-photo{
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    object-fit:cover;
    object-position:center;
    transform:translate3d(var(--photo-x),var(--photo-y),0) scale(var(--photo-zoom));
    transform-origin:center;
    transition:transform .2s cubic-bezier(.2,.72,.2,1),filter .35s ease;
    filter:saturate(.88) contrast(1.04) brightness(.82);
    will-change:transform;
  }
  .temple-scene::after{
    content:'';
    position:absolute;
    inset:0;
    pointer-events:none;
    background:linear-gradient(180deg,rgba(7,4,2,.48) 0%,transparent 30%,transparent 72%,rgba(7,4,2,.42) 100%);
  }
  .temple-scene.is-dragging .temple-photo{ transition:none; filter:saturate(.96) contrast(1.02) brightness(.88); }
  @media (max-width:980px){
    .experience-grid{ grid-template-columns:1fr; }
    .experience-copy{ max-width:680px; }
    .temple-viewer{ min-height:min(680px,78vw); }
    .temple-map-card,.temple-map{ min-height:min(680px,78vw); }
    .visit-essentials-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); }
    .visit-essential:nth-child(2){ border-right:0; }
    .visit-essential:nth-child(-n+2){ border-bottom:1px solid rgba(212,160,23,.2); }
  }
  @media (max-width:620px){
    .temple-experience{ padding-left:18px; padding-right:18px; }
    .experience-copy h2{ font-size:clamp(2.5rem,13vw,3.75rem); }
    .experience-notes{ display:grid; gap:8px; }
    .temple-viewer{ min-height:560px; }
    .temple-map-card,.temple-map{ min-height:560px; }
    .visit-essentials-heading{ grid-template-columns:1fr; gap:18px; }
    .visit-essentials-grid{ grid-template-columns:1fr; }
    .visit-essential,
    .visit-essential:nth-child(2){ min-height:0; border-right:0; border-bottom:1px solid rgba(212,160,23,.2); }
    .visit-essential:last-child{ border-bottom:0; }
    .viewer-meta{ top:20px; left:19px; }
    .viewer-credit{ display:none; }
  }
  @media (prefers-reduced-motion:reduce){
    .temple-photo,.viewer-hint{ transition:none; }
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
