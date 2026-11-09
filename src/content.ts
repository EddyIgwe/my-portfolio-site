/**
 * Site content. Every word on the site lives here.
 *
 * Sources: Edwin Igwebuike's CV (October 2026), the rebuild brief, and Behance
 * (project titles, publish dates, appreciations and views checked on 27 October 2026).
 *
 * House style: British spelling, no em dashes in visible copy, third person.
 */

const BASE = __ASSET_BASE__;
export const asset = (path: string) => `${BASE}${path}`;

export const person = {
  name: 'Edwin Igwebuike',
  firstName: 'Edwin',
  lastName: 'Igwebuike',
  role: 'Brand & Marketing Designer',
  email: 'edwinigwebuike7@gmail.com',
  cv: asset('assets/Edwin-Igwebuike-CV.pdf'),
  cvFileName: 'Edwin-Igwebuike-CV.pdf',
};

export type SocialLink = {
  id: string;
  label: string;
  handle: string;
  href: string;
  /**
   * Links are checked before launch. Set to false to hide a link from the site
   * without deleting it. See README for the result of each check.
   */
  enabled: boolean;
};

export const social: SocialLink[] = [
  { id: 'behance', label: 'Behance', handle: 'edwinigwebuike007', href: 'https://www.behance.net/edwinigwebuike007', enabled: true },
  { id: 'linkedin', label: 'LinkedIn', handle: 'Edwin Igwebuike', href: 'https://www.linkedin.com/in/edwin-igwebuike-0925a51a1', enabled: true },
  { id: 'dribbble', label: 'Dribbble', handle: 'edwinigwe', href: 'https://dribbble.com/edwinigwe', enabled: true },
  // On 27 Oct 2026 X showed "We're unable to show this account" for @RayThe_Kid to signed-out visitors.
  { id: 'twitter', label: 'Twitter', handle: '@RayThe_Kid', href: 'https://twitter.com/RayThe_Kid', enabled: false },
  { id: 'telegram', label: 'Telegram', handle: '@jefe_007', href: 'https://t.me/jefe_007', enabled: true },
  // instagram.com/el.jefe_ belongs to someone else and instagram.com/_el_.jefe_ is unavailable. Add the right handle, then enable.
  { id: 'instagram', label: 'Instagram', handle: '', href: '', enabled: false },
  { id: 'video', label: 'Introduction video', handle: 'Loom', href: 'https://www.loom.com/share/22185400f82247d0b0e77d419ec4d4e1', enabled: true },
];

export const socialById = (id: string) => social.find((s) => s.id === id)!;

/** CV link: downloads on the real site; opens in a new tab in the hosted preview, where downloads are blocked. */
export const cvLink =
  import.meta.env.MODE === 'single'
    ? { href: person.cv, target: '_blank', rel: 'noopener noreferrer' }
    : { href: person.cv, download: person.cvFileName };

export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#work' },
  { label: 'Experience', href: '#experience' },
  { label: 'Rates', href: '#rates' },
  { label: 'Contact', href: '#contact' },
];

export const hero = {
  role: 'Brand & Marketing Designer',
  intro: 'Brand identity, guidelines, campaigns, decks and print for 20+ clients in eight countries.',
  detail: 'Figma Certified. Based in Nigeria, working remotely worldwide.',
  status: 'Available now',
  statusDetail: 'Full-time, contract, part-time and freelance roles. Remote, worldwide.',
  caption: 'Live monogram in halftone dots. Press it.',
  captionStill: 'EI monogram in halftone dots',
  photo: {
    src: asset('portrait/edwin-igwebuike-230.webp'),
    alt: 'Edwin Igwebuike in a dark suit and tie',
    width: 230,
    height: 230,
  },
  stats: [
    { value: '5+', label: 'years designing' },
    { value: '20+', label: 'clients' },
    { value: '22', label: 'projects on Behance' },
  ],
};

export const availability = {
  statement: 'Available for full-time, contract, part-time and freelance roles, remote worldwide.',
  hours: 'Edwin works US and UAE hours remotely from Nigeria (UTC+1). His full-time role at Go Brewing ended in August 2026.',
  setup: 'His setup runs on solar power and fibre-optic internet.',
  clocks: [
    { city: 'Lagos', zone: 'Africa/Lagos' },
    { city: 'New York', zone: 'America/New_York' },
    { city: 'Dubai', zone: 'Asia/Dubai' },
  ],
};

export const about = {
  title: ['Design is the craft.', 'Clarity is the point.'],
  lead: 'Edwin Igwebuike is a Figma-certified designer with five-plus years in brand, marketing, presentation, social, print and infographic work, plus light motion and early UI and web experience.',
  body: 'He has delivered work for 20+ clients across the UK, US, Canada, UAE, Croatia, Egypt, Georgia and Nigeria, and for full-time and contract design teams.',
  stats: [
    { value: '15K+', label: 'Behance views' },
    { value: '1.2K', label: 'appreciations' },
  ],
  /** `example` is the id of a project shown beside the discipline, or 'video' for the Loom intro. */
  disciplines: [
    { name: 'Brand identity and guidelines', example: 'hilcot' },
    { name: 'Logo design', example: 'udevhouse' },
    { name: 'Marketing and campaign design', example: 'quex-qudefi' },
    { name: 'Marketing collateral', example: 'baker-industries' },
    { name: 'Packaging and print production', example: 'go-brewing' },
    { name: 'Presentation and pitch decks', example: 'dbay' },
    { name: 'Social media graphics', example: 'social-media-oct-nov-2025' },
    { name: 'Web graphics', example: 'verox' },
    { name: 'UI design', example: 'maestro-bot' },
    { name: 'Short-form video editing', example: 'video' },
    { name: 'Light motion graphics', example: 'video' },
    { name: 'Editorial and corporate publication design', example: 'ideolux' },
  ],
  strengths: [
    'Visual storytelling',
    'Typography and layout',
    'Brand consistency',
    'Deadline and project management',
    'Remote client communication',
    'Cross-functional collaboration',
  ],
  software: ['Photoshop', 'Illustrator', 'Figma', 'Canva', 'Affinity by Canva', 'CapCut', 'PowerPoint', 'Word'],
};

export type FilterId = 'brand' | 'guidelines' | 'ui' | 'content' | 'infographics' | 'presentation';

export const filters: Array<{ id: 'all' | FilterId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'brand', label: 'Brand identity' },
  { id: 'guidelines', label: 'Guidelines' },
  { id: 'ui', label: 'UI & web' },
  { id: 'content', label: 'Content & campaigns' },
  { id: 'infographics', label: 'Infographics' },
  { id: 'presentation', label: 'Presentation' },
];

export type Project = {
  id: string;
  title: string;
  discipline: string;
  /** Filters the project appears under (besides All). */
  tags: FilterId[];
  client?: string;
  year: number;
  href: string;
  /** Behance stats on 27 October 2026 (kept for reference; the order is by recency). */
  appreciations: number;
  views: number;
};

const B = 'https://www.behance.net/gallery/';

const projectData: Project[] = [
  { id: 'maestro-bot', title: 'Maestro Bot Landing Page Redesign', discipline: 'UI & web', tags: ['ui'], client: 'Maestro Bot', year: 2025, href: `${B}223952187/Maestro-Bot-Landing-Page-Redesign`, appreciations: 337, views: 3039 },
  { id: 'hilcot', title: 'Hilcot Logo Redesign & Branding', discipline: 'Brand identity', tags: ['brand'], client: 'Hilcot Energy Services', year: 2025, href: `${B}222973869/Hilcot-Logo-Redesign-and-Branding`, appreciations: 312, views: 2769 },
  { id: 'quex-qudefi', title: 'Graphics for QuEx & QuDefi', discipline: 'Content & campaigns', tags: ['content', 'infographics'], client: 'QuEx and QuDefi', year: 2025, href: `${B}220735869/Graphics-for-QuEx-and-QuDefi`, appreciations: 173, views: 1952 },
  { id: 'udevhouse', title: 'uDevHouse Logo Design & Branding Guidelines', discipline: 'Brand identity', tags: ['brand', 'guidelines'], client: 'uDevHouse', year: 2024, href: `${B}209757771/uDevHouse-Logo-Design-and-Branding-Guidelines`, appreciations: 120, views: 2009 },
  { id: 'altctrl', title: 'AltCTRL Social Media Post and Infographics Design', discipline: 'Content & infographics', tags: ['content', 'infographics'], client: 'AltCTRL', year: 2024, href: `${B}204040727/AltCTRL-Social-Media-Post-and-Infographics-Design`, appreciations: 113, views: 1812 },
  { id: 'baker-industries', title: 'Baker Industries Limited Social Media Posts', discipline: 'Content & campaigns', tags: ['content'], client: 'Baker Industries Limited', year: 2024, href: `${B}204050899/Baker-Industries-Limited-Social-Media-Posts-Design`, appreciations: 108, views: 1539 },
  { id: 'social-media-oct-nov-2025', title: 'Social Media Designs, Oct to Nov 2025', discipline: 'Content & campaigns', tags: ['content'], year: 2025, href: `${B}238538331/Social-Media-Designs-Oct-Nov-2025`, appreciations: 6, views: 212 },
  { id: 'persici', title: 'Persici Agency Brand Guidelines', discipline: 'Guidelines', tags: ['guidelines'], client: 'Persici Agency', year: 2025, href: `${B}242484123/Persici-Agency-Brand-Guidelines`, appreciations: 5, views: 141 },
  { id: 'orbix', title: 'Orbix Brand Identity', discipline: 'Brand identity', tags: ['brand'], client: 'Orbix', year: 2025, href: `${B}237043295/Orbix-Brand-Identity`, appreciations: 4, views: 112 },
  { id: 'u3-tech', title: 'U3 Tech Brand Guidelines', discipline: 'Guidelines', tags: ['guidelines'], client: 'U3 Tech', year: 2025, href: `${B}230433111/U3-Tech-Brand-Guidelines`, appreciations: 3, views: 100 },
  { id: 'ideolux', title: 'Ideolux Brand Guidelines', discipline: 'Guidelines', tags: ['guidelines'], client: 'Ideolux Lighting', year: 2026, href: `${B}254744649/Ideolux-Brand-Guidelines`, appreciations: 2, views: 35 },
  { id: 'email-designs', title: 'Email Designs', discipline: 'Content & campaigns', tags: ['content'], year: 2026, href: `${B}243438047/Email-Designs`, appreciations: 2, views: 115 },
  { id: 'social-media-designs', title: 'Social Media Designs', discipline: 'Content & campaigns', tags: ['content'], year: 2025, href: `${B}230430879/Social-Media-Designs`, appreciations: 2, views: 109 },
  { id: 'youtube-thumbnails', title: 'YouTube Thumbnail Designs', discipline: 'Content & campaigns', tags: ['content'], year: 2026, href: `${B}242938689/YouTube-Thumbnail-Designs`, appreciations: 2, views: 59 },
  { id: 'dbay', title: 'DBay Pitch Deck Presentation Design', discipline: 'Presentation', tags: ['presentation'], client: 'DBay', year: 2026, href: `${B}254737971/DBay-Pitch-Deck-Presentation-Design`, appreciations: 1, views: 122 },
  { id: 'cypher', title: 'Cypher Brand Guidelines', discipline: 'Guidelines', tags: ['guidelines'], client: 'Cypher', year: 2023, href: `${B}179362757/Cypher-Brand-Guidelines`, appreciations: 9, views: 418 },
  { id: 'verox', title: 'VeroX Social Media Banners', discipline: 'Content & campaigns', tags: ['content'], client: 'VeroX', year: 2025, href: `${B}233437347/VeroX-Social-Media-Banners`, appreciations: 4, views: 131 },
  { id: 'eyetech', title: 'EyeTech Social Media Banners', discipline: 'Content & campaigns', tags: ['content'], client: 'EyeTech', year: 2025, href: `${B}236040209/EyeTech-Social-Media-Banners`, appreciations: 3, views: 90 },
  { id: 'vudy', title: 'Vudy Landing Page Design', discipline: 'UI & web', tags: ['ui'], client: 'Vudy', year: 2025, href: `${B}236309965/Vudy-Landing-Page-Design`, appreciations: 4, views: 87 },
  { id: 'myst', title: 'Myst Roadmap Infographic', discipline: 'Infographics', tags: ['infographics'], client: 'Myst', year: 2025, href: `${B}236781261/Myst-Roadmap-Infographic`, appreciations: 1, views: 90 },
  { id: 'go-brewing', title: 'Go Brewing: Brand, Marketing & Creative Design', discipline: 'Brand & marketing', tags: ['brand', 'content'], client: 'Go Brewing', year: 2026, href: `${B}256358851/Go-Brewing-Brand-Marketing-Creative-Design`, appreciations: 0, views: 22 },
  { id: 'design-collection-vol-1', title: 'Design Collection Vol 1', discipline: 'Collection', tags: [], year: 2026, href: `${B}257665523/Design-Collection-Vol-1`, appreciations: 0, views: 6 },
];

/** Most appreciated first, views break ties. */
/** Behance gallery ids are issued in sequence, so a higher id was published later. */
const galleryId = (p: Project) => Number(p.href.match(/gallery\/(\d+)/)![1]);

/** Newest first, by publish date on Behance. */
export const projects: Project[] = [...projectData].sort((a, b) => galleryId(b) - galleryId(a));

export const projectById = (id: string) => projects.find((p) => p.id === id);

export const cover = (id: string) => ({
  src: asset(`work/${id}-808.webp`),
  srcSet: `${asset(`work/${id}-480.webp`)} 480w, ${asset(`work/${id}-808.webp`)} 808w`,
  width: 808,
  height: 632,
});

export const work = {
  title: '22 projects, newest first.',
  intro: 'In the order they were published on Behance. Every project opens in full on Behance.',
};

export type Role = {
  title: string;
  company: string;
  type: string;
  start: string;
  end: string;
  descriptor?: string;
  points: string[];
};

export const experience = {
  title: 'Four roles, all remote.',
  roles: [
    {
      title: 'Brand & Marketing Designer',
      company: 'Go Brewing',
      type: 'Full-time, remote',
      start: 'Feb 2026',
      end: 'Aug 2026',
      descriptor: 'US non-alcoholic beer company',
      points: [
        'Designed print and digital marketing collateral, including sales sheets, banners, posters, social media carousels and YouTube thumbnails, keeping brand communication consistent across channels.',
        'Developed production-ready packaging artwork and product dielines, preparing accurate print-ready files that met technical specifications and brand standards.',
        'Built business presentations, pitch decks and proposal slides that present products, campaigns and business opportunities clearly and professionally.',
      ],
    },
    {
      title: 'Freelance Graphic & Visual Communication Designer',
      company: 'Independent',
      type: 'Remote',
      start: 'Oct 2024',
      end: 'Present',
      descriptor: '20+ clients across Croatia, the UK, US, UAE, Canada, Egypt, Nigeria, Georgia and other markets',
      points: [
        'Translate client briefs into social media graphics, presentations and pitch decks, marketing collateral, infographics and print-ready artwork, adapting to each client’s brand identity and industry.',
        'Designed social media content and promotional graphics for campaigns and product launches, supporting increases in followers and engagement on client channels.',
        'Created social media graphics, promotional visuals and web graphics (banners, icons, UI visuals) for AltCTRL, a crypto/Web3 client, applying brand identity with clear visual hierarchy.',
        'Work independently with international clients, interpreting briefs, handling feedback and revisions, and delivering to agreed deadlines across multiple concurrent assignments.',
      ],
    },
    {
      title: 'Graphic Designer',
      company: 'Ideolux Lighting',
      type: 'Contract, remote',
      start: 'Apr 2026',
      end: 'May 2026',
      points: [
        'Designed and produced a 100+ page corporate brochure, managing layout, typography, imagery and print-ready document preparation.',
        'Developed brand guidelines defining the company’s visual identity, covering typography, colour palette, layout principles and brand usage standards.',
        'Created internal communication templates for announcements, employee birthdays, team welcomes and other recurring content, keeping the visual identity consistent internally.',
      ],
    },
    {
      title: 'Graphic Designer',
      company: 'Baker Industries Limited',
      type: 'Full-time, remote',
      start: 'Mar 2022',
      end: 'Sep 2024',
      points: [
        'Created digital and print materials for marketing campaigns, including social media graphics, brochures and presentations that boosted engagement.',
        'Collaborated with the marketing team to develop brand-consistent visuals across campaign channels.',
        'Managed multiple design projects simultaneously, delivering to tight deadlines.',
      ],
    },
  ] as Role[],
  educationTitle: 'Education and certification',
  education: [
    { when: '2018 to 2023', what: 'B.Sc. Computer Science', where: 'University of Nigeria, Nsukka' },
    { when: 'Certification', what: 'Figma Certified', where: 'Interface design and design systems' },
  ],
};

export const rates = {
  title: 'Freelance rates, stated up front.',
  items: [
    { service: 'Brand identity', detail: 'Logo, colour, typography and the visual system that holds them together.', price: 'From US$1,000' },
    { service: 'Brand guidelines', detail: 'A documented system that keeps every touchpoint consistent.', price: 'From US$1,000' },
    { service: 'Landing page design', detail: 'A single landing page designed in Figma, ready to build.', price: 'From US$1,000' },
    { service: 'Content and decks', detail: 'Social templates, infographics, email and pitch decks.', price: 'From US$20' },
  ],
  note: 'Salaried roles are a separate conversation.',
};

export const contact = {
  title: 'Write to Edwin.',
  lede: 'Every message gets a reply within 24 hours.',
  topics: ['Full-time role', 'Contract or part-time role', 'Freelance project', 'Something else'],
  success: 'Message sent. Edwin will reply within 24 hours.',
  failure: 'That didn’t send. Email edwinigwebuike7@gmail.com directly and it’ll get through.',
};

export const seo = {
  title: 'Edwin Igwebuike, Brand & Marketing Designer',
  description:
    'Edwin Igwebuike is a Figma-certified Brand & Marketing Designer working remotely from Nigeria: brand identity, guidelines, campaigns, decks and print.',
  url: 'https://edwinigwebuike.netlify.app/',
};
