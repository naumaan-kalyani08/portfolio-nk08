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

export const services = [
  {
    title: "Front-end Development",
    text: "Responsive, accessible interfaces in React with smooth, performant motion powered by GSAP and WebGL.",
  },
  {
    title: "Back-end & APIs",
    text: "Secure, scalable Laravel & PHP back-ends, REST APIs and well-modelled MySQL databases.",
  },
  {
    title: "UI Engineering",
    text: "Turning Figma designs into pixel-perfect, reusable component systems that are easy to maintain.",
  },
  {
    title: "Performance & DevOps",
    text: "Lighthouse-friendly builds, Dockerised environments and Git workflows that keep teams shipping.",
  },
];

export const projects = [
  {
    // TODO: replace with a real project
    title: "Commerce Platform",
    category: "Full-stack · Laravel + React",
    year: "2025",
    image: "./Images/image2.webp",
    tags: ["Laravel", "React", "MySQL"],
    href: "#",
  },
  {
    title: "Analytics Dashboard", // TODO
    category: "Front-end · Data viz",
    year: "2024",
    image: "./Images/image4.webp",
    tags: ["React", "GSAP", "REST"],
    href: "#",
  },
  {
    title: "Immersive Landing", // TODO
    category: "Creative dev · WebGL",
    year: "2024",
    image: "./Images/image5.webp",
    tags: ["Three.js", "GSAP", "Vite"],
    href: "#",
  },
  {
    title: "Booking System", // TODO
    category: "Back-end · API",
    year: "2023",
    image: "./Images/image3.webp",
    tags: ["PHP", "Docker", "MySQL"],
    href: "#",
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

export const skillGroups = [
  {
    title: "Front-end",
    color: "#6366f1",
    text: "Semantic, accessible and animated interfaces.",
    items: ["HTML", "CSS", "JavaScript", "React", "GSAP", "Three.js"],
  },
  {
    title: "Back-end",
    color: "#0e7490",
    text: "Reliable APIs and data layers that scale.",
    items: ["PHP", "Laravel", "MySQL", "REST APIs"],
  },
  {
    title: "Tooling",
    color: "#7c3aed",
    text: "Workflows that keep code shipping smoothly.",
    items: ["Git", "Docker", "Vite", "Jira"],
  },
  {
    title: "Design",
    color: "#be185d",
    text: "Bridging design and engineering.",
    items: ["Figma", "Prototyping", "Design systems", "Motion"],
  },
];
