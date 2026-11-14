// ---------------------------------------------------------------------------
// All editable portfolio content lives here.
// Items marked `// TODO` are placeholders — replace them with your real details.
// ---------------------------------------------------------------------------

export const profile = {
  name: "Naumaan Kalyani",
  initials: "nk",
  role: "Full-stack Developer",
  city: "[YOUR CITY]", // TODO
  email: "[YOUR EMAIL]", // TODO
  site: "naumaan.dev", // TODO: your domain (shown in the laptop intro's address bar)
  available: true,
  tagline:
    "I build fast, animated and accessible web experiences — from pixel-perfect interfaces in React to robust back-ends in Laravel.",
};

export const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/" }, // TODO
  { label: "GitHub", href: "https://github.com/" }, // TODO
  { label: "Dribbble", href: "https://dribbble.com/" }, // TODO
];

export const navItems = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#experience", label: "Journey" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

// Segments: `hl: true` words get highlighted during the scroll reveal.
export const aboutText = [
  { text: "I'm a " },
  { text: "full-stack developer", hl: true },
  { text: " who loves turning ideas into " },
  { text: "interactive", hl: true },
  { text: " products. I care about " },
  { text: "performance", hl: true },
  { text: ", clean code and the small " },
  { text: "details", hl: true },
  { text: " that make an interface feel alive — motion, rhythm and " },
  { text: "craft.", hl: true },
];

export const aboutImages = [
  { src: "./Images/flat-creativity-concept-illustration.webp", alt: "Creative concept illustration" },
  { src: "./Images/image2.webp", alt: "Workspace snapshot" },
  { src: "./Images/image3.webp", alt: "Design exploration" },
  { src: "./Images/image4.webp", alt: "Project detail" },
];

export const stats = [
  { value: 3, suffix: "+", label: "Years building for the web" }, // TODO
  { value: 25, suffix: "+", label: "Projects shipped" }, // TODO
  { value: 11, suffix: "", label: "Tools in my daily stack" },
  { value: 100, suffix: "%", label: "Responsive by default" },
];

export const marqueeItems = ["React", "Laravel", "Three.js", "GSAP", "PHP", "MySQL", "Docker", "Figma"];

// Rotating line under the hero title.
export const heroRoles = ["immersive web apps", "Laravel back-ends", "3D web experiences", "design systems", "fast, accessible UIs"];

// Kinetic intro strip: words, with an image "pill" after each one (except the last).
export const processWords = [
  { word: "Think.", image: "./Images/image3.webp" },
  { word: "Design.", image: "./Images/image4.webp" },
  { word: "Build.", image: "./Images/image5.webp" },
  { word: "Ship." },
];

export const services = [
  {
    title: "Front-end Development",
    text: "Responsive, accessible interfaces in React with smooth, performant motion powered by GSAP and WebGL.",
    tags: ["React", "GSAP", "Three.js", "Accessibility"],
    image: "./Images/image2.webp",
  },
  {
    title: "Back-end & APIs",
    text: "Secure, scalable Laravel & PHP back-ends, REST APIs and well-modelled MySQL databases.",
    tags: ["Laravel", "PHP", "MySQL", "REST"],
    image: "./Images/image3.webp",
  },
  {
    title: "UI Engineering",
    text: "Turning Figma designs into pixel-perfect, reusable component systems that are easy to maintain.",
    tags: ["Figma", "Design systems", "Storybook", "CSS"],
    image: "./Images/image4.webp",
  },
  {
    title: "Performance & DevOps",
    text: "Lighthouse-friendly builds, Dockerised environments and Git workflows that keep teams shipping.",
    tags: ["Docker", "CI/CD", "Vite", "Git"],
    image: "./Images/image5.webp",
  },
];

// TODO: every project below is a placeholder — replace with your real work.
export const projects = [
  {
    slug: "commerce-platform",
    title: "Commerce Platform",
    category: "Full-stack · Laravel + React",
    year: "2025",
    image: "./Images/image2.webp",
    tags: ["Laravel", "React", "MySQL"],
    role: "Lead full-stack developer",
    description:
      "A headless commerce platform with a React storefront and a Laravel API — built for speed, conversion and an admin experience the client's team actually enjoys using.",
    highlights: ["Sub-second page loads on mid-range phones", "Stripe checkout and order workflows", "Role-based admin dashboard"],
    live: "#",
    repo: "#",
  },
  {
    slug: "analytics-dashboard",
    title: "Analytics Dashboard",
    category: "Front-end · Data viz",
    year: "2024",
    image: "./Images/image4.webp",
    tags: ["React", "GSAP", "REST"],
    role: "Front-end developer",
    description:
      "A real-time analytics dashboard turning millions of events into clear, animated insights — with filters, drill-downs and exportable reports.",
    highlights: ["Virtualised tables for 100k+ rows", "Animated, accessible charts", "Shareable saved views"],
    live: "#",
    repo: "#",
  },
  {
    slug: "immersive-landing",
    title: "Immersive Landing",
    category: "Creative dev · WebGL",
    year: "2024",
    image: "./Images/image5.webp",
    tags: ["Three.js", "GSAP", "Vite"],
    role: "Creative developer",
    description:
      "A scroll-driven product launch page mixing WebGL particles, choreographed typography and buttery 60fps motion — on desktop and mobile.",
    highlights: ["Custom GLSL particle shaders", "Scroll-synced storytelling", "Lighthouse performance 95+"],
    live: "#",
    repo: "#",
  },
  {
    slug: "booking-system",
    title: "Booking System",
    category: "Back-end · API",
    year: "2023",
    image: "./Images/image3.webp",
    tags: ["PHP", "Docker", "MySQL"],
    role: "Back-end developer",
    description:
      "A multi-tenant booking engine with availability rules, payments and notifications — containerised and deployed with zero-downtime releases.",
    highlights: ["Conflict-free scheduling engine", "Email & SMS notifications", "Dockerised CI/CD pipeline"],
    live: "#",
    repo: "#",
  },
];

export const experience = [
  // TODO: replace with your real milestones
  { year: "2018", title: "Wrote my first line of code", place: "Self-taught", text: "Started with HTML & CSS, building small pages and falling in love with the web." },
  { year: "2020", title: "Computer Science studies", place: "University", text: "Deepened fundamentals — algorithms, databases and software design." },
  { year: "2023", title: "Junior Developer", place: "Company name", text: "Shipped production features with PHP, Laravel and MySQL in an agile team." },
  { year: "2024", title: "Full-stack Developer", place: "Company name", text: "Owned features end-to-end — React front-ends, APIs, Docker deployments." },
  { year: "2025", title: "Creative Development", place: "Freelance", text: "Building immersive, animated experiences with GSAP and Three.js." },
];

// Skills render as a periodic table: each group is a column, each tool an
// "element" with a two-letter symbol.
// TODO: `since` (year you started using it) and `level` are estimates taken
// from the journey timeline above — adjust them to match reality.
//   level: 3 = daily driver · 2 = confident · 1 = exploring
//   tag:   project tag to match when it differs from the name ("Used in")
//   everywhere: true → shown as used across every project
export const skillLevels = {
  3: "Daily driver",
  2: "Confident",
  1: "Exploring",
};

export const skillGroups = [
  {
    id: "frontend",
    title: "Front-end",
    rgb: "99 102 241",
    text: "Semantic, accessible and animated interfaces.",
    items: [
      { symbol: "Ht", name: "HTML", since: 2018, level: 3, everywhere: true, note: "Semantic, accessible markup — the foundation every interface stands on." },
      { symbol: "Cs", name: "CSS", since: 2018, level: 3, everywhere: true, note: "Fluid layouts, custom properties and motion — responsive by default." },
      { symbol: "Js", name: "JavaScript", since: 2019, level: 3, everywhere: true, note: "Modern, performance-minded JavaScript that works with or without a framework." },
      { symbol: "Re", name: "React", since: 2024, level: 3, note: "Component architecture and hooks — this very portfolio is built with it." },
      { symbol: "Gs", name: "GSAP", since: 2025, level: 3, note: "Scroll-driven timelines, pinning and playful micro-interactions." },
      { symbol: "Tj", name: "Three.js", since: 2025, level: 2, note: "WebGL scenes and custom GLSL shaders — like the particle field up top." },
    ],
  },
  {
    id: "backend",
    title: "Back-end",
    rgb: "6 182 212",
    text: "Reliable APIs and data layers that scale.",
    items: [
      { symbol: "Ph", name: "PHP", since: 2023, level: 3, note: "Clean, modern PHP that is easy to read, test and maintain." },
      { symbol: "Lv", name: "Laravel", since: 2023, level: 3, note: "Eloquent models, queues, auth and APIs shipped to production." },
      { symbol: "My", name: "MySQL", since: 2020, level: 2, note: "Well-modelled schemas and indexed queries that stay fast as data grows." },
      { symbol: "Ap", name: "REST APIs", tag: "REST", since: 2023, level: 3, note: "Predictable, well-documented endpoints that front-ends enjoy consuming." },
    ],
  },
  {
    id: "tooling",
    title: "Tooling",
    rgb: "139 92 246",
    text: "Workflows that keep code shipping smoothly.",
    items: [
      { symbol: "Gt", name: "Git", since: 2020, level: 3, everywhere: true, note: "Branching workflows, clean history and painless code review." },
      { symbol: "Dk", name: "Docker", since: 2024, level: 2, note: "Reproducible environments and containerised deployments." },
      { symbol: "Vi", name: "Vite", since: 2024, level: 3, note: "Instant dev servers and lean, code-split production builds." },
      { symbol: "Ji", name: "Jira", since: 2023, level: 2, note: "Sprint planning and agile delivery alongside product teams." },
    ],
  },
  {
    id: "design",
    title: "Design",
    rgb: "236 72 153",
    text: "Bridging design and engineering.",
    items: [
      { symbol: "Fg", name: "Figma", since: 2022, level: 2, note: "Turning design files into faithful, pixel-perfect builds." },
      { symbol: "Pt", name: "Prototyping", since: 2022, level: 2, note: "Clickable flows that validate ideas before production code." },
      { symbol: "Ds", name: "Design systems", since: 2024, level: 2, note: "Tokens and reusable components that keep big UIs consistent." },
      { symbol: "Mo", name: "Motion", since: 2025, level: 3, note: "Easing, rhythm and choreography that make interfaces feel alive." },
    ],
  },
];

// Second marquee tape: every skill that isn't already on the first one.
export const marqueeItemsAlt = skillGroups
  .flatMap((group) => group.items.map((item) => item.name))
  .filter((name) => !marqueeItems.includes(name));
