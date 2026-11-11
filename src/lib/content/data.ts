/* Ported verbatim from the career-quest prototype (js/data.js). Phase 3 moves this into the database. */
/* ============================================================
   data.js
   All quiz content and career reference data lives here.
   Nothing in this file touches the DOM — it's pure data, so it's
   the safe place to add/edit questions, streams, or career info
   without risking the app logic in app.js.
   ============================================================ */

const orientationQuestions = [
  { text:"A group project just started. You naturally...", options:[
    {label:"Take charge of the plan and the deadline", cat:"admin"},
    {label:"Pitch the wildest idea in the room", cat:"creative"},
    {label:"Go research what's actually been tried before", cat:"info"},
    {label:"Check in and make sure everyone feels heard", cat:"people"}
  ]},
  { text:"Something at home breaks. What's your first move?", options:[
    {label:"Look up how it works and what went wrong", cat:"info"},
    {label:"Call someone who might know how to fix it", cat:"people"},
    {label:"Make a checklist and fix it step by step", cat:"admin"},
    {label:"Try an unconventional fix nobody's suggested", cat:"creative"}
  ]},
  { text:"Your ideal weekend project would be...", options:[
    {label:"Organising and decluttering a whole space", cat:"admin"},
    {label:"Designing or building something from scratch", cat:"creative"},
    {label:"Volunteering or helping a friend through something", cat:"people"},
    {label:"Falling down a research rabbit hole on a topic", cat:"info"}
  ]},
  { text:"In class discussions, you're usually the one who...", options:[
    {label:"Keeps the group on track and on time", cat:"admin"},
    {label:"Brings up the data or source nobody else read", cat:"info"},
    {label:"Suggests a totally different angle", cat:"creative"},
    {label:"Makes sure quieter classmates get to speak", cat:"people"}
  ]},
  { text:"A teacher offers you a leadership role for an event. You'd want to run...", options:[
    {label:"Logistics — schedules, budgets, sign-ups", cat:"admin"},
    {label:"The theme, look and creative concept", cat:"creative"},
    {label:"Outreach — talking to people, getting buy-in", cat:"people"},
    {label:"Research on what similar events did well", cat:"info"}
  ]},
  { text:"Which compliment would mean the most to you?", options:[
    {label:"\"You always know what people need.\"", cat:"people"},
    {label:"\"You always have the numbers to back it up.\"", cat:"info"},
    {label:"\"You never miss a deadline.\"", cat:"admin"},
    {label:"\"I'd never have thought of that.\"", cat:"creative"}
  ]}
];

const orientationOrder = ["admin", "info", "creative", "people"];

const orientationMeta = {
  admin:{
    label:"Administration",
    color:"var(--gold)",
    desc:"Planning, deadlines, responsibility, organising tasks, managing resources and bringing structure to a goal."
  },
  info:{
    label:"Information",
    color:"var(--teal)",
    desc:"Researching, analysing, comparing facts, solving problems with evidence and learning how systems work."
  },
  creative:{
    label:"Creative",
    color:"var(--coral)",
    desc:"Generating original ideas, designing, experimenting, storytelling and finding fresh ways to express or build."
  },
  people:{
    label:"People",
    color:"var(--violet)",
    desc:"Understanding needs, listening, helping, persuading, supporting groups and working through relationships."
  }
};

const streams = [
  { id:"law", label:"Law & Justice", icon:"⚖️", orient:"people", arch:"strategist" },
  { id:"management", label:"Management & Business", icon:"📊", orient:"admin", arch:"strategist" },
  { id:"sales", label:"Sales & Marketing", icon:"📣", orient:"people", arch:"connector" },
  { id:"architecture", label:"Architecture & Design", icon:"🏛️", orient:"creative", arch:"builder" },
  { id:"entrepreneurship", label:"Entrepreneurship", icon:"🚀", orient:"creative", arch:"creator" },
  { id:"engineering", label:"Engineering", icon:"⚙️", orient:"info", arch:"builder" },
  { id:"finance", label:"Banking & Finance", icon:"💰", orient:"admin", arch:"strategist" },
  { id:"cs", label:"Computer Science & IT", icon:"💻", orient:"info", arch:"builder" },
  { id:"medicine", label:"Medicine & Health Sciences", icon:"🩺", orient:"people", arch:"connector" },
  { id:"media", label:"Media & Communication", icon:"🎬", orient:"creative", arch:"creator" },
  { id:"education", label:"Education & Training", icon:"📚", orient:"people", arch:"connector" },
  { id:"humanities", label:"Arts & Humanities", icon:"🎭", orient:"info", arch:"creator" }
];

const riasecMeta = {
  realistic:{ code:"R", label:"Realistic", color:"var(--gold)", desc:"Hands-on building, fixing, tools, machines, fieldwork and practical systems." },
  investigative:{ code:"I", label:"Investigative", color:"var(--teal)", desc:"Research, science, analysis, diagnosis, data and deep problem-solving." },
  artistic:{ code:"A", label:"Artistic", color:"var(--coral)", desc:"Design, writing, performance, imagination, visual thinking and original expression." },
  social:{ code:"S", label:"Social", color:"var(--violet)", desc:"Helping, teaching, caring, counselling, training and working closely with people." },
  enterprising:{ code:"E", label:"Enterprising", color:"var(--gold)", desc:"Leading, persuading, selling, debating, organising people and building ventures." },
  conventional:{ code:"C", label:"Conventional", color:"var(--teal)", desc:"Organising information, accounts, processes, records, schedules and rules." }
};

const riasecQuestions = [
  {type:"realistic", text:"Build, repair or test a physical product."},
  {type:"realistic", text:"Work with tools, machines, equipment or outdoor systems."},
  {type:"realistic", text:"Make a practical prototype instead of only writing about it."},
  {type:"investigative", text:"Research why something happens and prove it with evidence."},
  {type:"investigative", text:"Analyse data, symptoms, experiments or patterns."},
  {type:"investigative", text:"Solve a complex technical or scientific problem."},
  {type:"artistic", text:"Create a design, story, performance, video or visual concept."},
  {type:"artistic", text:"Use imagination to communicate an idea in a fresh way."},
  {type:"artistic", text:"Work on a portfolio, showreel, artwork or creative campaign."},
  {type:"social", text:"Teach, guide, counsel or support another person."},
  {type:"social", text:"Listen carefully and help people solve personal or learning problems."},
  {type:"social", text:"Work in healthcare, education, community or service settings."},
  {type:"enterprising", text:"Lead a team, pitch an idea or persuade an audience."},
  {type:"enterprising", text:"Start a project, campaign, business or public initiative."},
  {type:"enterprising", text:"Negotiate, debate, sell or make decisions under uncertainty."},
  {type:"conventional", text:"Organise records, money, schedules, forms or processes accurately."},
  {type:"conventional", text:"Follow rules and check details so nothing important is missed."},
  {type:"conventional", text:"Create a clear plan, checklist, budget or dashboard."}
];

const streamRiasecProfiles = {
  law:["enterprising","social","investigative"],
  management:["enterprising","conventional","social"],
  sales:["enterprising","social","artistic"],
  architecture:["artistic","realistic","investigative"],
  entrepreneurship:["enterprising","artistic","investigative"],
  engineering:["realistic","investigative","conventional"],
  finance:["conventional","enterprising","investigative"],
  cs:["investigative","realistic","conventional"],
  medicine:["social","investigative","realistic"],
  media:["artistic","enterprising","social"],
  education:["social","artistic","conventional"],
  humanities:["artistic","social","investigative"]
};

const personalityQuestions = [
  { text:"Pick the task you'd volunteer for first:", options:[
    {label:"Build the plan everyone else will follow", arch:"strategist"},
    {label:"Rally the group and keep spirits up", arch:"connector"},
    {label:"Actually build or fix the thing", arch:"builder"},
    {label:"Come up with the idea in the first place", arch:"creator"}
  ]},
  { text:"When you're stressed, you tend to...", options:[
    {label:"Make a list and work through it methodically", arch:"strategist"},
    {label:"Talk it out with someone you trust", arch:"connector"},
    {label:"Go do something with your hands", arch:"builder"},
    {label:"Zone out into a creative project", arch:"creator"}
  ]},
  { text:"Your friends would describe you as...", options:[
    {label:"Dependable and rule-driven", arch:"strategist"},
    {label:"Warm and easy to talk to", arch:"connector"},
    {label:"Practical and hands-on", arch:"builder"},
    {label:"Original and a little unpredictable", arch:"creator"}
  ]},
  { text:"You'd rather win an award for...", options:[
    {label:"Best strategy or business plan", arch:"strategist"},
    {label:"Most helpful classmate", arch:"connector"},
    {label:"Best-built project or prototype", arch:"builder"},
    {label:"Most original idea", arch:"creator"}
  ]},
  { text:"In a video game, you gravitate toward the...", options:[
    {label:"Resource management / city-builder genre", arch:"strategist"},
    {label:"Co-op games you play with friends", arch:"connector"},
    {label:"Engineering / crafting-heavy games", arch:"builder"},
    {label:"Open-world sandbox where you make your own story", arch:"creator"}
  ]},
  { text:"What frustrates you most in a group project?", options:[
    {label:"No one has a clear plan", arch:"strategist"},
    {label:"People not listening to each other", arch:"connector"},
    {label:"Ideas that never actually get built", arch:"builder"},
    {label:"Everyone playing it too safe", arch:"creator"}
  ]},
  { text:"You just found free time this weekend. You'll probably...", options:[
    {label:"Plan out your next few weeks", arch:"strategist"},
    {label:"Meet up with people", arch:"connector"},
    {label:"Tinker with or fix something", arch:"builder"},
    {label:"Start a new creative project", arch:"creator"}
  ]},
  { text:"Pick a motto:", options:[
    {label:"\"Plan the work, work the plan.\"", arch:"strategist"},
    {label:"\"We're better together.\"", arch:"connector"},
    {label:"\"If it's broken, fix it.\"", arch:"builder"},
    {label:"\"Why not try something new?\"", arch:"creator"}
  ]}
];

const archetypes = {
  strategist:{ name:"The Strategist", icon:"♟️", desc:"You think in plans, structures and outcomes. You're the one who turns a vague goal into a workable roadmap — and you like being the person others come to for a decision.", tags:["Leadership","Planning","Analysis","Decision-making"] },
  connector:{ name:"The Connector", icon:"🤝", desc:"You read people well and build trust fast. Teams run smoother with you in them, because you notice what others miss — how people are actually feeling.", tags:["Empathy","Communication","Persuasion","Teamwork"] },
  builder:{ name:"The Builder", icon:"🛠️", desc:"You'd rather make something real than talk about it. Systems, structures and problems that need hands-on solving are where you're most alive.", tags:["Hands-on","Systematic","Problem-solving","Precision"] },
  creator:{ name:"The Creator", icon:"🎨", desc:"You're pulled toward the new and the unproven. Convention bores you — you're happiest imagining what doesn't exist yet and chasing it.", tags:["Imagination","Curiosity","Originality","Risk-taking"] }
};

/* Course / university / eligibility / scholarship reference data.
   NOTE: eligibility rules, entrance exams and scholarship schemes
   change year to year. This content is written to be broadly
   accurate for the Indian system as a starting reference, not a
   live feed. The quiz is an interest screener for counselling,
   not a clinical or formally validated psychometric instrument. */
const careerData = {
  law:{ accent:"var(--coral)", courses:["BA LLB / BBA LLB (5-yr integrated)","LLB (3-yr, after any bachelor's)","Diploma in Cyber Law / IPR"],
    unis:["National Law Universities (NLUs) — e.g. NLSIU Bengaluru, NALSAR Hyderabad","State law colleges & Government Law Colleges","Private law schools (Symbiosis, Jindal Global Law School)"],
    eligibility:"10+2 in any stream. Entry mainly via CLAT for NLUs or AILET for NLU Delhi; many state/private colleges also accept CUET or their own entrance test. Confirm current percentage and reservation rules before applying.",
    scholarships:["NLU merit & need-based fee waivers","State government post-matric scholarships (SC/ST/OBC/minority)","Bar Council of India / state legal aid scholarships"] },
  management:{ accent:"var(--gold)", courses:["BBA / BMS (UG)","Integrated MBA (5-yr, IPM)","MBA / PGDM (after any bachelor's)"],
    unis:["IIMs (via CAT/IPMAT) & top private B-schools","Central & state university management schools (via CUET)","Autonomous institutes (SIBM, XLRI, NMIMS)"],
    eligibility:"UG: 10+2 any stream, usually via CUET or institute-specific test. PG (MBA): bachelor's degree + CAT / XAT / CMAT / MAT / SNAP.",
    scholarships:["Corporate-sponsored MBA scholarships (e.g. Tata, Aditya Birla Group)","Need-cum-merit scholarships at most B-schools","National Scholarship Portal (NSP) central schemes"] },
  sales:{ accent:"var(--teal)", courses:["BBA (Marketing) / B.Com (Marketing)","Diploma in Digital Marketing","PG Diploma in Sales & Marketing Management"],
    unis:["Commerce & management colleges (state universities)","Institutes with dedicated marketing electives (NMIMS, Christ University)","Skill-based diploma providers (NIS, MICA short courses)"],
    eligibility:"10+2 in any stream (commerce preferred by some colleges). Entry via CUET or institute admission test; portfolio/interview for some diploma programmes.",
    scholarships:["Merit scholarships at commerce colleges","NSP means-based scholarships","Company-sponsored earn-while-you-learn sales trainee programmes"] },
  architecture:{ accent:"var(--violet)", courses:["B.Arch (5-yr)","B.Des (Product / Interior / Communication Design)","Diploma in Architectural Assistantship"],
    unis:["IITs / NITs / SPA (School of Planning & Architecture)","State architecture colleges (Anna University-affiliated in Tamil Nadu, etc.)","Design institutes — NID, CEPT, Pearl Academy"],
    eligibility:"B.Arch: 10+2 with Mathematics as required by Council of Architecture routes, via NATA and/or JEE Main Paper 2. B.Des: 10+2 any stream, via UCEED / NID DAT / institute test.",
    scholarships:["COA / state government architecture scholarships","Institute merit-cum-means aid (NID, CEPT)","Central Sector Scheme scholarships via NSP"] },
  entrepreneurship:{ accent:"var(--coral)", courses:["BBA (Entrepreneurship)","B.Com + college incubation-cell programmes","Certificate/PG programmes in Startup Management"],
    unis:["University entrepreneurship cells & incubators (E-Cells, AIC-backed centres)","Management colleges with dedicated entrepreneurship majors","State Startup & Innovation Mission-linked institutions"],
    eligibility:"10+2 any stream; admission via CUET / institute test. No dedicated national entrance exam — strength of portfolio/ideas often matters alongside academics.",
    scholarships:["State Startup Mission seed grants & fellowships (e.g. Tamil Nadu Startup and Innovation Mission)","College incubator seed funding (non-tuition, project-based)","NSP merit scholarships for the underlying degree programme"] },
  engineering:{ accent:"var(--gold)", courses:["B.Tech / B.E. (CSE, Mechanical, Civil, EEE, etc.)","Integrated M.Tech","Diploma in Engineering (polytechnic route)"],
    unis:["IITs / NITs / IIITs (via JEE Main & Advanced)","State engineering colleges via state CETs (e.g. TNEA in Tamil Nadu)","BITS Pilani (via BITSAT), private technical universities"],
    eligibility:"10+2 with Physics and Mathematics, plus Chemistry / Biotechnology / Biology / Technical Vocational subject as accepted by the current exam or counselling route. Entry via JEE Main/Advanced, state counselling such as TNEA, BITSAT or institute tests.",
    scholarships:["AICTE Pragati Scholarship (for girl students)","State government merit scholarships for engineering","Institution & corporate CSR scholarships (need or merit-based)"] },
  finance:{ accent:"var(--teal)", courses:["B.Com (Honours) / BBA (Finance)","Integrated CA / CMA / CFA-track programmes","B.Sc Economics or Statistics"],
    unis:["Central universities & DU commerce colleges (via CUET)","State commerce colleges","Institutes offering integrated CA/CFA prep alongside a degree"],
    eligibility:"10+2 any stream (commerce/maths preferred). Entry mainly via CUET or institute test; professional routes (CA/CFA) have their own entrance/foundation exams.",
    scholarships:["Bank-sponsored scholarships (e.g. SBI Foundation, ICICI Foundation)","NSP means-based scholarships","Merit-cum-means aid at commerce colleges"] },
  cs:{ accent:"var(--violet)", courses:["B.Tech / B.E. Computer Science / IT","BCA (Bachelor of Computer Applications)","B.Sc Computer Science"],
    unis:["IITs / NITs / IIITs (via JEE Main & Advanced)","State engineering colleges via state CETs","Universities offering BCA/B.Sc CS via CUET or direct admission"],
    eligibility:"B.Tech: 10+2 with Physics and Mathematics plus an accepted third subject, via JEE/state counselling. BCA / B.Sc CS: 10+2 any stream in many colleges, but Mathematics or Computer Science is often required.",
    scholarships:["AICTE Pragati / Saksham Scholarships","State merit scholarships for engineering & IT","Tech-industry scholarship programmes for underrepresented groups"] },
  medicine:{ accent:"var(--coral)", courses:["MBBS","BDS (Dental)","B.Sc Nursing / Allied Health Sciences (Physiotherapy, Radiology, etc.)"],
    unis:["Government medical colleges & AIIMS institutes","Private medical colleges (via NEET counselling)","Allied health science colleges attached to major hospitals"],
    eligibility:"10+2 with Physics, Chemistry and Biology/Biotechnology. NEET-UG is mandatory for MBBS, BDS, AYUSH and veterinary counselling routes; allied health and nursing rules vary by state and institution.",
    scholarships:["Central Sector Scheme scholarships (NSP)","State government medical education scholarships","Minority & means-based fee concessions at government colleges"] },
  media:{ accent:"var(--gold)", courses:["BA Journalism & Mass Communication","B.A./B.Sc in Film, TV or Digital Media Production","PG Diploma in Journalism (IIMC and similar)"],
    unis:["Indian Institute of Mass Communication (IIMC)","Symbiosis Institute of Media & Communication (via SET)","University mass communication departments (via CUET)"],
    eligibility:"10+2 any stream. Entry via university-specific entrance tests, CUET, or portfolio/interview for production-heavy programmes.",
    scholarships:["Institutional merit scholarships in media schools","Journalism trusts & foundation fellowships","NSP means-based scholarships"] },
  education:{ accent:"var(--teal)", courses:["B.Ed (after a bachelor's degree)","B.El.Ed / Integrated B.A.-B.Ed","Montessori / early-childhood teacher training diplomas"],
    unis:["NCTE-recognised teacher education colleges","University education departments (via CUET / state entrance)","Regional Institutes of Education (NCERT)"],
    eligibility:"B.Ed: bachelor's degree + state or university entrance test. Integrated B.A-B.Ed: 10+2 any stream, via CUET.",
    scholarships:["State education department teacher-training scholarships","NSP central & state schemes","Merit scholarships at teacher-training colleges"] },
  humanities:{ accent:"var(--violet)", courses:["BA (History, Political Science, Psychology, Sociology, English)","BA Liberal Arts (multi-disciplinary)","BFA (Fine Arts) / Performing Arts diplomas"],
    unis:["Central universities (DU, JNU, BHU) via CUET","Liberal arts universities (Ashoka, FLAME, Christ University)","State arts colleges"],
    eligibility:"10+2 any stream (Humanities background helpful but not mandatory). Entry via CUET or institute-specific test/portfolio for fine/performing arts.",
    scholarships:["NSP central & state merit-cum-means scholarships","ICSSR fellowships (postgraduate research level)","University-specific need-based financial aid (e.g. at liberal arts universities)"] }
};

const streamLibraryMap = {
  law:"law",
  management:"management",
  sales:"sales",
  architecture:"architecture",
  entrepreneurship:"entrepreneurship",
  engineering:"engineering",
  finance:"banking-finance",
  cs:"computer-science-it",
  medicine:"medical-science",
  media:"media-communication",
  education:"education-training",
  humanities:"humanities-liberal-arts"
};

const careerResearchSources = [
  {
    title:"National Career Service",
    url:"https://www.ncs.gov.in/content-repository/Pages/Main.aspx",
    note:"role descriptions, job listings, career information and counselling links"
  },
  {
    title:"Skill India Digital Hub",
    url:"https://www.skillindiadigital.gov.in/home",
    note:"skill courses, job roles, apprenticeships and training discovery"
  },
  {
    title:"Official exam / counselling portals",
    url:"https://www.nta.ac.in/",
    note:"current exam eligibility, syllabus, admission notifications and counselling rules"
  }
];

const career2030Sources = [
  {
    title:"World Economic Forum Future of Jobs 2025",
    url:"https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/",
    note:"2025-2030 global outlook for job growth, decline and skills transformation."
  },
  {
    title:"MSDE Year End Review 2025",
    url:"https://www.pib.gov.in/newsite/erelcontent.aspx?lang=2&reg=48&relid=282673",
    note:"India future-skill roles, new-age courses and skilling focus areas."
  },
  {
    title:"National Career Service",
    url:"https://dge.gov.in/ncs",
    note:"Indian career information, counselling, training and job-role reference."
  },
  {
    title:"FutureSkills Prime",
    url:"https://www.futureskillsprime.in/about-us/",
    note:"India digital-skilling pathways for emerging technologies and employability."
  }
];

const career2030Outlook = {
  "engineering":{
    summary:"Strong 2030 signals come from renewable energy, electric mobility, robotics, semiconductors, infrastructure, water and climate adaptation.",
    roles:["Renewable energy engineer","EV and battery systems engineer","Robotics / automation engineer","Semiconductor or embedded-systems engineer","Green infrastructure / water systems engineer"],
    skills:["CAD and simulation","Python or MATLAB basics","IoT and sensors","sustainability thinking","technical documentation"]
  },
  "computer-science-it":{
    summary:"Digital access, AI adoption and cyber risk make technology roles one of the clearest 2030 opportunity clusters.",
    roles:["AI / machine learning engineer","Data engineer or analyst","Cybersecurity analyst","Cloud / DevOps engineer","Software and applications developer"],
    skills:["Python","SQL","cloud basics","cyber hygiene","product problem solving"]
  },
  "architecture":{
    summary:"Cities, climate adaptation and infrastructure upgrades point toward greener, data-supported built-environment work.",
    roles:["Sustainable architect","BIM modeller","Urban design / planning assistant","Green building consultant","Interior and spatial experience designer"],
    skills:["BIM tools","climate-responsive design","materials knowledge","3D modelling","building-code literacy"]
  },
  "medical-science":{
    summary:"Healthcare demand is supported by demographics, preventive care, telemedicine and AI-assisted diagnostics.",
    roles:["Doctor / clinical specialist","Telemedicine clinician","Public-health programme officer","Medical AI research associate","Healthcare quality and safety coordinator"],
    skills:["clinical reasoning","patient communication","biology depth","digital health literacy","evidence-based decision making"]
  },
  "allied-medicine":{
    summary:"Care, diagnostics and rehabilitation roles are expected to remain important as healthcare systems expand and age-related care grows.",
    roles:["Nursing professional","Physiotherapist / rehab specialist","Diagnostic imaging technologist","Medical lab technologist","Hospital operations coordinator"],
    skills:["patient care","medical equipment handling","records accuracy","infection control","communication"]
  },
  "science":{
    summary:"Science routes connect to climate, biotech, materials, food systems, health research and lab automation by 2030.",
    roles:["Environmental scientist","Biotech research assistant","Materials research associate","Climate data analyst","Lab automation technician"],
    skills:["experimental method","data analysis","lab safety","scientific writing","field observation"]
  },
  "mathematics-statistics":{
    summary:"Data-heavy decisions across finance, health, climate, sports and government keep quantitative skills highly transferable.",
    roles:["Statistician","Data scientist","Actuarial analyst","Operations research analyst","Quantitative risk analyst"],
    skills:["probability","statistics software","Python or R","model interpretation","clear explanation"]
  },
  "humanities-liberal-arts":{
    summary:"Human-centred work grows where organisations need behaviour insight, communication, policy, ethics and cultural understanding.",
    roles:["UX researcher","Policy research analyst","Counselling / psychology assistant","Content and localisation specialist","Social-impact programme associate"],
    skills:["research interviews","writing","critical reading","ethics","data interpretation"]
  },
  "defence-services":{
    summary:"Security needs are expanding from physical defence into cyber, drones, logistics, aerospace systems and disaster-response planning.",
    roles:["Defence officer","Cyber defence analyst","Drone systems operator","Defence logistics coordinator","Aerospace maintenance engineer"],
    skills:["discipline","fitness","systems thinking","cyber awareness","leadership"]
  },
  "banking-finance":{
    summary:"Finance opportunities are shifting toward fintech, risk, compliance, digital lending, analytics and sustainable finance.",
    roles:["Fintech analyst","Credit risk analyst","Compliance / AML associate","Investment research analyst","ESG finance analyst"],
    skills:["financial modelling","data analysis","regulation basics","Excel","ethical judgement"]
  },
  "advertising-marketing":{
    summary:"Marketing is becoming more data-led and creator-led, with AI tools changing production while strategy and insight remain valuable.",
    roles:["Growth marketer","Marketing analytics associate","Brand strategist","CRM / lifecycle marketer","Creator-economy campaign manager"],
    skills:["consumer insight","analytics","copywriting","AI tool use","campaign testing"]
  },
  "economics-commerce":{
    summary:"Commerce careers remain useful when combined with data, taxation, trade, sustainability reporting and business analytics.",
    roles:["Business analyst","Economics research associate","Tax / GST associate","Trade analyst","Sustainability reporting associate"],
    skills:["accounting","economics reasoning","spreadsheets","data visualisation","business writing"]
  },
  "food-agriculture":{
    summary:"Food security, climate-smart farming, agri-tech and food processing are important 2030 themes, especially for India.",
    roles:["Agri-tech field officer","Precision farming analyst","Food safety and quality officer","Climate-smart agriculture associate","Food processing technologist"],
    skills:["crop science","quality control","supply-chain basics","sensor data","field communication"]
  },
  "law":{
    summary:"Legal work is expanding into technology, data, climate, intellectual property and compliance, alongside traditional litigation.",
    roles:["Cyber law associate","Data privacy and compliance analyst","IP rights associate","Environmental law researcher","Mediation / dispute-resolution associate"],
    skills:["legal research","drafting","technology awareness","argumentation","ethics"]
  },
  "aviation-merchant-navy":{
    summary:"Travel, logistics, drones, ports, safety systems and marine technology create future-facing paths in aviation and maritime work.",
    roles:["Commercial pilot","Drone operations specialist","Airport operations coordinator","Marine engineer","Shipping and logistics analyst"],
    skills:["safety procedures","navigation basics","English communication","mechanical systems","operations discipline"]
  },
  "education-training":{
    summary:"Growing working-age populations, digital learning and skill gaps point to demand for teachers, mentors and trainers.",
    roles:["School teacher","Vocational skills trainer","Learning experience designer","Special educator","Career counsellor"],
    skills:["teaching practice","assessment design","digital classroom tools","mentoring","subject mastery"]
  },
  "arts-design":{
    summary:"Design careers are moving toward user experience, service design, accessibility, sustainable products and AI-assisted workflows.",
    roles:["UX / UI designer","Service designer","Product designer","Accessibility design associate","Design researcher"],
    skills:["portfolio building","user research","prototyping","visual systems","AI-assisted ideation"]
  },
  "animation-vfx":{
    summary:"Streaming, gaming, virtual production and immersive media create opportunities, while AI makes portfolio quality more important.",
    roles:["3D asset artist","VFX compositor","Game artist","Motion graphics designer","Virtual production assistant"],
    skills:["showreel","3D tools","storytelling","lighting and composition","pipeline discipline"]
  },
  "media-communication":{
    summary:"Media work is becoming platform-native, data-aware and verification-heavy as AI changes content creation and trust.",
    roles:["Digital journalist","Fact-checker / verification researcher","Video or podcast producer","Communication strategist","AI-assisted content editor"],
    skills:["reporting","fact-checking","video editing","audience analytics","clear writing"]
  },
  "performing-arts":{
    summary:"Performers can build blended careers across live shows, digital platforms, teaching, production and cultural entrepreneurship.",
    roles:["Performer","Digital creator / producer","Arts manager","Performance coach","Live-events coordinator"],
    skills:["practice discipline","portfolio reels","stagecraft","audience building","collaboration"]
  },
  "nutrition-fitness":{
    summary:"Preventive health, sports performance, ageing populations and wellness services support nutrition and fitness pathways.",
    roles:["Dietitian","Sports nutrition associate","Fitness and wellness coach","Rehab fitness trainer","Public-health nutrition worker"],
    skills:["human biology","coaching","meal planning","exercise safety","behaviour change"]
  },
  "sports":{
    summary:"Sports careers are widening beyond playing into analytics, coaching, operations, wellness, media and performance science.",
    roles:["Sports coach","Sports analyst","Sports event manager","Strength and conditioning assistant","Esports / gaming tournament coordinator"],
    skills:["performance analysis","training planning","statistics basics","communication","discipline"]
  },
  "fashion":{
    summary:"Fashion opportunities are shifting toward sustainability, e-commerce, technical textiles, digital design and supply-chain transparency.",
    roles:["Sustainable fashion designer","Fashion merchandiser","Textile innovation associate","Fashion e-commerce stylist","Technical textiles coordinator"],
    skills:["trend research","textiles","digital design tools","sourcing basics","brand storytelling"]
  },
  "sales":{
    summary:"Sales remains important where products become more complex, with growth in consultative selling, customer success and revenue operations.",
    roles:["B2B sales executive","Customer success associate","Sales operations analyst","Technical sales specialist","CRM / revenue operations coordinator"],
    skills:["listening","CRM tools","presentation","follow-up discipline","product knowledge"]
  },
  "government":{
    summary:"Public-service careers increasingly need digital governance, climate resilience, data use and citizen-centred service delivery.",
    roles:["Civil services officer","Public policy analyst","Digital governance associate","Climate-resilience programme officer","Data-for-government analyst"],
    skills:["current affairs","policy writing","data literacy","ethics","public communication"]
  },
  "management":{
    summary:"As organisations change quickly, 2030 management opportunities centre on product, projects, operations, people and sustainability.",
    roles:["Product manager","Project manager","Operations manager","Supply-chain analyst","Sustainability / ESG manager"],
    skills:["planning","stakeholder communication","analytics","resource management","leadership"]
  },
  "hospitality-tourism":{
    summary:"Tourism and hospitality are becoming more experience-led, tech-enabled and sustainability-conscious.",
    roles:["Hotel operations manager","Travel experience designer","Sustainable tourism coordinator","Culinary entrepreneur","Hospitality revenue analyst"],
    skills:["service quality","languages","operations","digital booking tools","guest empathy"]
  },
  "entrepreneurship":{
    summary:"Entrepreneurial opportunities by 2030 are likely around climate, local services, AI-enabled products, education, health and creator businesses.",
    roles:["Startup founder","Social enterprise builder","Climate-tech entrepreneur","AI-enabled product operator","Local-service business owner"],
    skills:["problem discovery","selling","financial basics","rapid testing","resilience"]
  },
  default:{
    summary:"This path can be researched through job postings, internships, professional interviews and official career portals.",
    roles:["Entry-level associate","Project assistant","Research intern","Operations trainee"],
    skills:["communication","digital literacy","portfolio projects","learning agility","workplace discipline"]
  }
};

const contentFreshness = {
  lastReviewed:"22 Aug 2026",
  updateCadence:"Review scholarship, exam and 2030 opportunity links at least monthly during admission season.",
  methodology:[
    {
      title:"O*NET Interest Profiler / RIASEC model",
      url:"https://www.onetcenter.org/IP.html",
      note:"Used as a public, well-known career-interest framework. This app uses original school-friendly prompts and does not claim formal validation."
    }
  ],
  futureJobSources:career2030Sources,
  scholarshipSources:[
    {title:"National Scholarship Portal", url:"https://scholarships.gov.in/All-Scholarships", note:"Central scholarship open/close dates and scheme rules."},
    {title:"PM Vidyalaxmi", url:"https://pmvidyalaxmi.co.in/", note:"Education loan and interest-subvention application route."},
    {title:"Tamil Nadu schemes", url:"https://tils.tn.gov.in/schemes", note:"Pudhumai Penn, Tamil Pudhalvan and state support references."},
    {title:"Tamil Nadu BC Welfare", url:"https://www.bcw.tn.gov.in/sub_page/8", note:"BC/MBC/DNC scholarship rules and income checks."},
    {title:"Tamil Nadu ADW scholarship", url:"https://www.tnadwscholarship.in/", note:"SC/ST/SCC post-matric scholarship portal."},
    {title:"Foundation for Excellence", url:"https://ffe.org/scholarships/", note:"Professional-degree foundation scholarship eligibility."},
    {title:"HDFC Bank Parivartan", url:"https://v.hdfc.bank.in/csr/initiatives/education.html", note:"ECSS scholarship details and current link."},
    {title:"Legrand Empowering Scholarship", url:"https://legrandscholarship.co.in/", note:"Current Legrand scholarship eligibility and benefits."}
  ],
  examSources:[
    {title:"NTA Engineering / JEE Main", url:"https://www.nta.ac.in/Engineeringexam", note:"B.E./B.Tech and B.Arch subject-combination rules."},
    {title:"NTA NEET", url:"https://neet.nta.nic.in/", note:"Medical entrance information and notices."},
    {title:"CLAT Consortium", url:"https://consortiumofnlus.ac.in/", note:"NLU law entrance notices and eligibility."},
    {title:"Council of Architecture / NATA", url:"https://www.nata.in/", note:"Architecture aptitude test and admission rules."},
    {title:"CUET UG", url:"https://cuet.nta.nic.in/", note:"Central university undergraduate entrance updates."}
  ]
};

const libraryCategories = [
  {
    id:"engineering", label:"Engineering", icon:"⚙️", count:30, accent:"var(--gold)",
    summary:"Designs, builds and improves machines, infrastructure, products, energy systems and technical processes.",
    subjects:["Physics","Mathematics","Design thinking","Problem solving"],
    routes:["B.E. / B.Tech after Physics + Mathematics with accepted subject combination","Polytechnic diploma route","Integrated M.Tech for research-oriented students"],
    exams:["JEE Main / Advanced","State counselling such as TNEA","BITSAT and university entrance tests"],
    careers:[
      {title:"Mechanical Engineering", desc:"Creates machines, vehicles, manufacturing tools and thermal systems.", skills:["CAD","Mechanics","Prototyping"], path:"Physics + Mathematics route → B.E./B.Tech Mechanical Engineering"},
      {title:"Civil Engineering", desc:"Plans and supervises buildings, bridges, roads, water systems and public infrastructure.", skills:["Structures","Site planning","Estimation"], path:"Physics + Mathematics route → B.E./B.Tech Civil Engineering"},
      {title:"Electrical & Electronics Engineering", desc:"Works on power systems, motors, electrical machines and industrial control.", skills:["Circuits","Power systems","Safety"], path:"Physics + Mathematics route → B.E./B.Tech EEE"},
      {title:"Electronics & Communication Engineering", desc:"Builds communication systems, embedded devices, sensors and electronic products.", skills:["Circuits","Signals","Embedded systems"], path:"Physics + Mathematics route → B.E./B.Tech ECE"},
      {title:"Computer Science Engineering", desc:"Designs software systems, algorithms, platforms and computing products.", skills:["Programming","Algorithms","Systems thinking"], path:"Physics + Mathematics route → B.E./B.Tech CSE"},
      {title:"Information Technology", desc:"Applies computing, networks and databases to business and public-service systems.", skills:["Databases","Networks","Web systems"], path:"Physics + Mathematics route → B.E./B.Tech IT"},
      {title:"Artificial Intelligence & Data Science", desc:"Builds intelligent systems that learn from data and support prediction or automation.", skills:["Python","Statistics","Machine learning"], path:"Physics + Mathematics route → B.Tech AI & Data Science"},
      {title:"Artificial Intelligence & Machine Learning", desc:"Focuses on model building, automation, computer vision, language systems and decision engines.", skills:["ML models","Data pipelines","Model evaluation"], path:"Physics + Mathematics route → B.Tech AI & ML"},
      {title:"Cybersecurity Engineering", desc:"Protects systems, networks and data from attacks, misuse and digital risk.", skills:["Networks","Threat analysis","Security testing"], path:"Physics + Mathematics route → B.Tech Cybersecurity / CSE specialization"},
      {title:"Robotics & Automation", desc:"Combines mechanical design, electronics and programming to create automated systems.", skills:["Sensors","Control systems","Programming"], path:"Physics + Mathematics route → B.Tech Robotics / Mechatronics"},
      {title:"Mechatronics Engineering", desc:"Integrates mechanical systems, electronics, control and software for smart machines.", skills:["Automation","Mechanisms","Embedded control"], path:"Physics + Mathematics route → B.E./B.Tech Mechatronics"},
      {title:"Automobile Engineering", desc:"Designs and improves vehicles, engines, electric mobility systems and automotive manufacturing.", skills:["Vehicle systems","Manufacturing","Diagnostics"], path:"Physics + Mathematics route → B.E./B.Tech Automobile Engineering"},
      {title:"Aerospace Engineering", desc:"Works on aircraft, spacecraft, propulsion, aerodynamics and flight structures.", skills:["Aerodynamics","Structures","Simulation"], path:"Physics + Mathematics route → B.Tech Aerospace / Aeronautical Engineering"},
      {title:"Aeronautical Engineering", desc:"Specialises in aircraft design, maintenance, propulsion and aviation technology.", skills:["Aircraft systems","Fluid mechanics","Safety"], path:"Physics + Mathematics route → B.E./B.Tech Aeronautical Engineering"},
      {title:"Marine Engineering", desc:"Maintains and designs ship machinery, propulsion systems and marine power plants.", skills:["Thermodynamics","Marine systems","Maintenance"], path:"Physics + Mathematics route → B.Tech Marine Engineering"},
      {title:"Chemical Engineering", desc:"Designs processes for chemicals, fuels, materials, food, pharma and industrial production.", skills:["Process design","Chemistry","Plant safety"], path:"Physics + Mathematics route → B.E./B.Tech Chemical Engineering"},
      {title:"Biotechnology Engineering", desc:"Uses biology, chemistry and engineering to build health, agriculture and industrial biotech solutions.", skills:["Bioprocessing","Genetics","Lab methods"], path:"Accepted science subject combination → B.Tech Biotechnology"},
      {title:"Biomedical Engineering", desc:"Creates medical devices, diagnostic equipment, prosthetics and healthcare technologies.", skills:["Human biology","Instrumentation","Design"], path:"Accepted science subject combination → B.Tech Biomedical Engineering"},
      {title:"Food Technology", desc:"Develops safe, scalable food products and manufacturing processes.", skills:["Food chemistry","Quality control","Processing"], path:"Accepted science subject combination → B.Tech Food Technology"},
      {title:"Agricultural Engineering", desc:"Builds farm machinery, irrigation systems, storage, processing and precision agriculture tools.", skills:["Farm systems","Hydraulics","Sustainability"], path:"Physics + Mathematics route → B.Tech Agricultural Engineering"},
      {title:"Environmental Engineering", desc:"Solves pollution, water, waste and sustainability problems using engineering design.", skills:["Water systems","Environmental science","Regulation"], path:"Physics + Mathematics route → B.E./B.Tech Environmental Engineering"},
      {title:"Mining Engineering", desc:"Plans safe extraction of minerals and manages mining operations, equipment and environmental controls.", skills:["Geology basics","Safety","Operations"], path:"Physics + Mathematics route → B.Tech Mining Engineering"},
      {title:"Metallurgical Engineering", desc:"Studies metals, alloys, heat treatment and materials used in manufacturing and infrastructure.", skills:["Materials science","Testing","Process control"], path:"Physics + Mathematics route → B.Tech Metallurgical Engineering"},
      {title:"Materials Science Engineering", desc:"Develops advanced materials for electronics, energy, aerospace, medicine and manufacturing.", skills:["Material testing","Chemistry","Research"], path:"Physics + Mathematics route → B.Tech Materials Science"},
      {title:"Textile Technology", desc:"Works on fibres, fabrics, technical textiles, apparel manufacturing and quality systems.", skills:["Textile processes","Quality","Production"], path:"Physics + Mathematics route → B.Tech Textile Technology"},
      {title:"Petroleum Engineering", desc:"Works on exploration, drilling, reservoir engineering and energy production systems.", skills:["Geology","Fluid flow","Field operations"], path:"Physics + Mathematics route → B.Tech Petroleum Engineering"},
      {title:"Production Engineering", desc:"Improves manufacturing methods, factory layouts, tooling, quality and productivity.", skills:["Manufacturing","Lean systems","Quality"], path:"Physics + Mathematics route → B.E./B.Tech Production Engineering"},
      {title:"Industrial Engineering", desc:"Optimises people, machines, materials and processes across factories and service systems.", skills:["Operations research","Process improvement","Data"], path:"Physics + Mathematics route → B.Tech Industrial Engineering"},
      {title:"Instrumentation & Control Engineering", desc:"Designs measurement, automation and control systems used in plants, labs and smart devices.", skills:["Sensors","Control loops","Calibration"], path:"Physics + Mathematics route → B.E./B.Tech Instrumentation"},
      {title:"Energy Engineering", desc:"Develops renewable energy, power efficiency, storage and sustainable energy systems.", skills:["Power systems","Renewables","Energy audit"], path:"Physics + Mathematics route → B.Tech Energy / Renewable Energy Engineering"}
    ]
  },
  {
    id:"computer-science-it", label:"Computer Science & IT", icon:"💻", count:16, accent:"var(--violet)",
    summary:"Uses software, data, networks and AI to build digital products and solve information problems.",
    subjects:["Mathematics","Computer science","Logic","Statistics"],
    routes:["B.Tech CSE / IT","BCA or B.Sc Computer Science","Online portfolios and internships alongside degree study"],
    exams:["JEE / state engineering counselling","CUET for some BCA/B.Sc routes","Institute-specific aptitude tests"],
    careers:[
      {title:"Software Developer", desc:"Builds apps, websites, systems and tools used by people or businesses.", skills:["Programming","Debugging","Product sense"], path:"PCM or relevant 10+2 → B.Tech CSE / BCA / B.Sc CS"},
      {title:"Data Analyst", desc:"Turns raw data into dashboards, insights and decisions.", skills:["Spreadsheets","SQL","Statistics"], path:"Any stream with maths comfort → analytics-focused degree or certificate"},
      {title:"Cybersecurity Analyst", desc:"Protects systems from attacks and investigates security risks.", skills:["Networks","Threat analysis","Documentation"], path:"CS/IT degree → security labs, certifications and internships"}
    ]
  },
  {
    id:"architecture", label:"Architecture", icon:"🏛️", count:4, accent:"var(--violet)",
    summary:"Combines space, structure, materials and human needs to design buildings and built environments.",
    subjects:["Mathematics","Drawing","Physics","Spatial reasoning"],
    routes:["B.Arch","B.Des in interior or spatial design","Diploma in architectural assistantship"],
    exams:["NATA","JEE Main Paper 2","Design school entrance tests"],
    careers:[
      {title:"Architect", desc:"Designs buildings from concept through drawings, models and site coordination.", skills:["Sketching","Design software","Building rules"], path:"10+2 with Mathematics → B.Arch"},
      {title:"Interior Designer", desc:"Plans functional and aesthetic interior spaces for homes, offices and public places.", skills:["Materials","Space planning","Client communication"], path:"10+2 → B.Des / diploma in interior design"}
    ]
  },
  {
    id:"medical-science", label:"Medical Science", icon:"🩺", count:8, accent:"var(--coral)",
    summary:"Diagnoses, treats and prevents illness through clinical practice, hospital care and medical research.",
    subjects:["Biology","Chemistry","Physics","Patient care"],
    routes:["MBBS","BDS","AYUSH and medical research routes"],
    exams:["NEET-UG","State and all-India counselling","Institution-specific allied requirements"],
    careers:[
      {title:"Doctor", desc:"Diagnoses disease, treats patients and coordinates long-term care.", skills:["Clinical reasoning","Empathy","Decision-making"], path:"PCB → NEET-UG → MBBS"},
      {title:"Dentist", desc:"Treats oral health, dental disease, surgery and preventive care.", skills:["Precision","Anatomy","Patient communication"], path:"PCB → NEET-UG → BDS"}
    ]
  },
  {
    id:"allied-medicine", label:"Allied Medicine", icon:"🏥", count:11, accent:"var(--teal)",
    summary:"Supports diagnosis, rehabilitation and patient recovery through specialised health services.",
    subjects:["Biology","Chemistry","Human anatomy","Care routines"],
    routes:["B.Sc Nursing","Physiotherapy","Radiology, lab technology and other allied health degrees"],
    exams:["NEET or state counselling for many programmes","University admission tests","Hospital-linked institute admissions"],
    careers:[
      {title:"Physiotherapist", desc:"Helps people recover movement, strength and function after injury or illness.", skills:["Anatomy","Exercise planning","Patient motivation"], path:"PCB → BPT"},
      {title:"Medical Lab Technologist", desc:"Runs diagnostic tests that support doctors in treatment decisions.", skills:["Lab safety","Accuracy","Instrumentation"], path:"PCB → B.Sc MLT"}
    ]
  },
  {
    id:"science", label:"Science", icon:"🔬", count:27, accent:"var(--teal)",
    summary:"Explores natural systems through experiments, fieldwork, analysis and research.",
    subjects:["Physics","Chemistry","Biology","Mathematics"],
    routes:["B.Sc / BS degrees","Integrated MSc","Research internships and lab projects"],
    exams:["CUET","IISER Aptitude Test","University entrance tests"],
    careers:[
      {title:"Research Scientist", desc:"Investigates scientific questions and develops new knowledge or technologies.", skills:["Experiment design","Data analysis","Writing"], path:"Science stream → B.Sc/BS → MSc/PhD"},
      {title:"Environmental Scientist", desc:"Studies pollution, climate, ecosystems and sustainability solutions.", skills:["Field sampling","GIS basics","Policy awareness"], path:"Science stream → environmental science degree"}
    ]
  },
  {
    id:"mathematics-statistics", label:"Mathematics & Statistics", icon:"📐", count:4, accent:"var(--gold)",
    summary:"Uses models, probability and quantitative reasoning to solve complex real-world problems.",
    subjects:["Mathematics","Statistics","Computer science","Economics"],
    routes:["B.Sc Mathematics / Statistics","Data science degrees","Actuarial and analytics certifications"],
    exams:["CUET","ISI Admission Test","CMI entrance"],
    careers:[
      {title:"Statistician", desc:"Designs studies and interprets data for business, science, policy and research.", skills:["Probability","R/Python","Clear explanation"], path:"Maths stream → B.Sc Statistics"},
      {title:"Actuarial Analyst", desc:"Models financial risk for insurance, pensions and investment products.", skills:["Risk modelling","Excel","Financial maths"], path:"Maths stream → actuarial exams plus degree"}
    ]
  },
  {
    id:"humanities-liberal-arts", label:"Humanities, Liberal Arts & Social Sciences", icon:"🎭", count:17, accent:"var(--violet)",
    summary:"Studies people, culture, society, history, language, politics and behaviour.",
    subjects:["History","Psychology","Political science","Languages"],
    routes:["BA / BA Honours","Liberal arts degree","Research, policy, writing and civil-services preparation"],
    exams:["CUET","University interviews","Portfolio for writing or arts-heavy programmes"],
    careers:[
      {title:"Psychologist", desc:"Studies behaviour and supports mental health, learning or workplace wellbeing.", skills:["Listening","Research","Ethics"], path:"10+2 any stream → BA/B.Sc Psychology → Master's"},
      {title:"Policy Researcher", desc:"Studies social problems and prepares evidence for public decisions.", skills:["Reading","Data interpretation","Writing"], path:"BA social sciences → policy internships / Master's"}
    ]
  },
  {
    id:"defence-services", label:"Defence Services", icon:"🛡️", count:5, accent:"var(--gold)",
    summary:"Serves in the armed forces and related national-security roles across land, air and sea.",
    subjects:["Physical fitness","Mathematics","General knowledge","Leadership"],
    routes:["NDA after 10+2","CDS after graduation","Technical entry routes for engineers"],
    exams:["NDA","CDS","AFCAT and service-selection processes"],
    careers:[
      {title:"Armed Forces Officer", desc:"Leads teams in defence operations, training and national service.", skills:["Discipline","Leadership","Fitness"], path:"10+2 → NDA or graduation → CDS"},
      {title:"Defence Engineer", desc:"Works on military technology, maintenance and systems support.", skills:["Engineering basics","Safety","Systems thinking"], path:"PCM → engineering → technical entry routes"}
    ]
  },
  {
    id:"banking-finance", label:"Banking & Finance", icon:"💰", count:15, accent:"var(--teal)",
    summary:"Manages money, investments, financial records, risk and business growth.",
    subjects:["Commerce","Mathematics","Economics","Accounting"],
    routes:["B.Com / BBA Finance","CA / CMA / CFA tracks","Economics, statistics or fintech programmes"],
    exams:["CUET","CA Foundation","Banking exams after graduation"],
    careers:[
      {title:"Chartered Accountant", desc:"Handles audit, taxation, financial reporting and business advisory.", skills:["Accounting","Tax basics","Attention to detail"], path:"10+2 → CA Foundation + degree"},
      {title:"Investment Analyst", desc:"Studies companies, markets and financial data to support investment decisions.", skills:["Research","Modelling","Presentation"], path:"Commerce/maths → finance/economics degree"}
    ]
  },
  {
    id:"advertising-marketing", label:"Advertising & Marketing", icon:"📣", count:3, accent:"var(--coral)",
    summary:"Connects brands with audiences through campaigns, content, research and digital channels.",
    subjects:["Business studies","Communication","Psychology","Design basics"],
    routes:["BBA / B.Com Marketing","Mass communication","Digital marketing certifications with projects"],
    exams:["CUET","SET and private university tests","Portfolio or interview for some programmes"],
    careers:[
      {title:"Digital Marketer", desc:"Runs campaigns across search, social, email and content platforms.", skills:["Analytics","Copywriting","Experimentation"], path:"Any stream → marketing degree or certificate"},
      {title:"Brand Strategist", desc:"Shapes how a product should be positioned, named, priced and communicated.", skills:["Research","Storytelling","Consumer insight"], path:"BBA/Media/Liberal arts → marketing internships"}
    ]
  },
  {
    id:"economics-commerce", label:"Economics & Commerce", icon:"📈", count:3, accent:"var(--gold)",
    summary:"Studies trade, markets, business decisions, accounting systems and economic behaviour.",
    subjects:["Economics","Accountancy","Mathematics","Business studies"],
    routes:["B.Com","BA/B.Sc Economics","Integrated professional courses"],
    exams:["CUET","University entrance tests","Professional foundation exams"],
    careers:[
      {title:"Economist", desc:"Analyses markets, policy and data to explain economic trends.", skills:["Statistics","Reading policy","Writing"], path:"Commerce/Maths → economics degree → Master's"},
      {title:"Commerce Analyst", desc:"Supports business planning through accounts, sales data and market analysis.", skills:["Spreadsheets","Accounting","Communication"], path:"Commerce → B.Com / BBA"}
    ]
  },
  {
    id:"food-agriculture", label:"Food & Agriculture", icon:"🌾", count:9, accent:"var(--teal)",
    summary:"Works on food production, farming systems, nutrition, agri-business and sustainability.",
    subjects:["Biology","Chemistry","Geography","Business basics"],
    routes:["B.Sc Agriculture","Food technology","Agri-business management"],
    exams:["ICAR AIEEA","CUET","State agriculture university tests"],
    careers:[
      {title:"Agricultural Scientist", desc:"Improves crop productivity, soil health and sustainable farming practices.", skills:["Fieldwork","Biology","Data recording"], path:"Science stream → B.Sc Agriculture"},
      {title:"Food Technologist", desc:"Develops safe, nutritious and scalable food products.", skills:["Chemistry","Quality control","Process design"], path:"Science stream → food technology degree"}
    ]
  },
  {
    id:"law", label:"Law", icon:"⚖️", count:11, accent:"var(--coral)",
    summary:"Uses legal reasoning, advocacy and policy knowledge to solve disputes and protect rights.",
    subjects:["English","Political science","Logic","Current affairs"],
    routes:["BA LLB / BBA LLB","LLB after graduation","Specialised diplomas in cyber law, IPR or mediation"],
    exams:["CLAT","AILET","CUET and state law entrance tests"],
    careers:[
      {title:"Lawyer", desc:"Advises clients, drafts legal documents and argues matters before courts or tribunals.", skills:["Reading","Argumentation","Research"], path:"10+2 any stream → 5-year integrated law degree"},
      {title:"Corporate Legal Associate", desc:"Supports companies on contracts, compliance, transactions and risk.", skills:["Contracts","Business awareness","Precision"], path:"Law degree → internships → corporate practice"}
    ]
  },
  {
    id:"aviation-merchant-navy", label:"Aviation & Merchant Navy", icon:"✈️", count:4, accent:"var(--violet)",
    summary:"Covers aircraft operations, airport systems, shipping, marine logistics and navigation.",
    subjects:["Physics","Mathematics","English","Physical fitness"],
    routes:["Pilot training","B.Sc Aviation / airport management","Marine engineering and nautical science"],
    exams:["DGCA pathway requirements","IMU CET","Institute medical and aptitude checks"],
    careers:[
      {title:"Commercial Pilot", desc:"Flies aircraft after rigorous training, medical clearance and licensing.", skills:["Focus","Weather awareness","Procedures"], path:"10+2 with PCM → flying school + DGCA licences"},
      {title:"Merchant Navy Officer", desc:"Works on ships that move goods globally across sea routes.", skills:["Navigation","Discipline","Safety"], path:"PCM → nautical science / marine engineering"}
    ]
  },
  {
    id:"education-training", label:"Education & Training", icon:"📚", count:9, accent:"var(--teal)",
    summary:"Helps learners build knowledge, confidence and skills across schools, colleges and training spaces.",
    subjects:["Any strong teaching subject","Communication","Psychology","Assessment"],
    routes:["Integrated B.A.-B.Ed / B.Sc-B.Ed","B.Ed after graduation","Special education or early-childhood diplomas"],
    exams:["CUET","State B.Ed entrance tests","CTET / TET for school teaching"],
    careers:[
      {title:"School Teacher", desc:"Plans lessons, supports students and assesses learning in a chosen subject.", skills:["Explanation","Patience","Classroom planning"], path:"Degree + B.Ed / integrated teacher education"},
      {title:"Learning Designer", desc:"Creates courses, worksheets, videos and digital learning experiences.", skills:["Curriculum design","Writing","Ed-tech tools"], path:"Any degree → education, content or instructional design experience"}
    ]
  },
  {
    id:"arts-design", label:"Arts & Design", icon:"🎨", count:9, accent:"var(--coral)",
    summary:"Creates visual, physical and digital experiences through craft, aesthetics and user understanding.",
    subjects:["Art","Design thinking","Computer basics","Culture studies"],
    routes:["B.Des","BFA","Diplomas in product, visual, interior or communication design"],
    exams:["UCEED","NID DAT","NIFT and institute portfolio reviews"],
    careers:[
      {title:"Product Designer", desc:"Designs useful, usable and attractive digital or physical products.", skills:["User research","Sketching","Prototyping"], path:"10+2 any stream → B.Des / design portfolio"},
      {title:"Graphic Designer", desc:"Creates visual identities, posters, layouts and communication assets.", skills:["Typography","Layout","Software"], path:"10+2 any stream → design degree or portfolio-led route"}
    ]
  },
  {
    id:"animation-vfx", label:"Animation, Graphics & VFX", icon:"🧩", count:8, accent:"var(--violet)",
    summary:"Builds animated characters, motion graphics, game assets and visual effects for screens.",
    subjects:["Art","Computer graphics","Storytelling","Physics basics"],
    routes:["B.Sc Animation / VFX","B.Des animation","Studio-oriented diploma programmes"],
    exams:["Design aptitude tests","Portfolio review","Institute-specific entrance tests"],
    careers:[
      {title:"Animator", desc:"Creates movement and performance for characters, objects or explainers.", skills:["Timing","Drawing","Animation tools"], path:"10+2 any stream → animation degree/diploma + showreel"},
      {title:"VFX Artist", desc:"Builds visual effects, compositing and digital environments for film and media.", skills:["Compositing","3D basics","Observation"], path:"10+2 any stream → VFX diploma/degree + portfolio"}
    ]
  },
  {
    id:"media-communication", label:"Media & Communication", icon:"🎬", count:15, accent:"var(--gold)",
    summary:"Tells stories, reports information and shapes public conversation through media channels.",
    subjects:["English","Current affairs","Sociology","Digital media"],
    routes:["BA Journalism & Mass Communication","Film and media production degrees","IIMC-style PG diplomas after graduation"],
    exams:["CUET","IIMC entrance for PG routes","University media tests and interviews"],
    careers:[
      {title:"Journalist", desc:"Finds, verifies and presents news across print, video, audio or digital platforms.", skills:["Reporting","Fact-checking","Writing"], path:"10+2 any stream → journalism/media degree"},
      {title:"Content Producer", desc:"Plans and produces videos, podcasts, social stories or branded media.", skills:["Scripting","Editing","Coordination"], path:"Any stream → media degree + portfolio"}
    ]
  },
  {
    id:"performing-arts", label:"Performing Arts", icon:"🎤", count:8, accent:"var(--coral)",
    summary:"Builds careers around music, dance, theatre, performance, direction and stagecraft.",
    subjects:["Music / dance / drama","Languages","History of arts","Practice discipline"],
    routes:["BA Performing Arts","Music or dance diplomas","Conservatory and guru-led training routes"],
    exams:["Auditions","Portfolio / performance tests","University entrance tests"],
    careers:[
      {title:"Performer", desc:"Works as an actor, dancer, musician or stage artist across live and recorded formats.", skills:["Practice","Expression","Resilience"], path:"Training + auditions + performance portfolio"},
      {title:"Theatre Director", desc:"Shapes performances by guiding actors, scripts, stage movement and design.", skills:["Interpretation","Leadership","Collaboration"], path:"Arts training → theatre practice and productions"}
    ]
  },
  {
    id:"nutrition-fitness", label:"Nutrition & Fitness", icon:"🥗", count:7, accent:"var(--teal)",
    summary:"Supports healthier bodies through food, exercise, coaching, sports science and lifestyle change.",
    subjects:["Biology","Chemistry","Physical education","Psychology"],
    routes:["B.Sc Nutrition / Dietetics","Sports science","Fitness certifications with supervised practice"],
    exams:["CUET","University entrance tests","Certification assessments"],
    careers:[
      {title:"Dietitian", desc:"Plans nutrition support for wellness, clinical care or sports performance.", skills:["Biochemistry","Counselling","Meal planning"], path:"PCB preferred → nutrition/dietetics degree"},
      {title:"Fitness Coach", desc:"Designs safe training plans and helps people build strength and habits.", skills:["Exercise science","Motivation","Safety"], path:"10+2 → fitness certifications / sports science degree"}
    ]
  },
  {
    id:"sports", label:"Sports", icon:"🏅", count:9, accent:"var(--gold)",
    summary:"Covers athletic performance, coaching, sports management, analysis and sports medicine support.",
    subjects:["Physical education","Biology","Statistics","Communication"],
    routes:["Sports science degrees","Physical education programmes","Performance academies and coaching certifications"],
    exams:["University entrance tests","Fitness trials","Sport-specific selection processes"],
    careers:[
      {title:"Sports Coach", desc:"Develops athletes through training plans, technique correction and match preparation.", skills:["Technique","Motivation","Planning"], path:"Sports experience → coaching certification / B.P.Ed"},
      {title:"Sports Analyst", desc:"Uses video and data to improve team strategy and player performance.", skills:["Observation","Statistics","Presentation"], path:"Maths/PE interest → analytics tools + sport portfolio"}
    ]
  },
  {
    id:"fashion", label:"Fashion", icon:"🧵", count:3, accent:"var(--violet)",
    summary:"Designs clothing, textiles, styling and fashion businesses for changing markets and identities.",
    subjects:["Art","Textiles","Business studies","Culture"],
    routes:["B.Des Fashion Design","Fashion communication","Textile design programmes"],
    exams:["NIFT","NID DAT","Portfolio reviews"],
    careers:[
      {title:"Fashion Designer", desc:"Creates apparel concepts, patterns, collections and brand stories.", skills:["Sketching","Textiles","Trend research"], path:"10+2 any stream → fashion design degree"},
      {title:"Fashion Stylist", desc:"Builds looks for people, shoots, brands, events or media.", skills:["Visual taste","Coordination","Communication"], path:"Portfolio + fashion communication/styling training"}
    ]
  },
  {
    id:"sales", label:"Sales", icon:"🤝", count:1, accent:"var(--teal)",
    summary:"Helps customers understand products and guides businesses toward revenue growth.",
    subjects:["Business studies","Communication","Psychology","Data basics"],
    routes:["BBA / B.Com","Marketing diplomas","On-the-job trainee programmes"],
    exams:["CUET","Institute entrance tests","Company assessments after graduation"],
    careers:[
      {title:"Sales Manager", desc:"Builds customer relationships, manages targets and helps teams close deals.", skills:["Persuasion","Listening","Follow-up"], path:"Any stream → business/commerce degree + internships"}
    ]
  },
  {
    id:"government", label:"Government", icon:"🏛️", count:5, accent:"var(--coral)",
    summary:"Works in public administration, public service, regulation, development and civic systems.",
    subjects:["Current affairs","History","Polity","Quantitative aptitude"],
    routes:["Any bachelor's degree for many exams","Public policy / administration degrees","Specialised technical government roles"],
    exams:["UPSC CSE","SSC / banking / railway exams","State public service exams"],
    careers:[
      {title:"Civil Services Officer", desc:"Works on administration, policy delivery and public problem solving.", skills:["Reading","Decision-making","Ethics"], path:"Any degree → UPSC or state PSC preparation"},
      {title:"Government Analyst", desc:"Supports departments with data, schemes, budgeting or field reports.", skills:["Policy awareness","Data","Writing"], path:"Relevant degree → government exams or fellowships"}
    ]
  },
  {
    id:"management", label:"Management", icon:"📊", count:13, accent:"var(--gold)",
    summary:"Plans, coordinates and improves teams, operations, products and organisations.",
    subjects:["Business studies","Economics","Mathematics","Communication"],
    routes:["BBA / BMS","Integrated MBA","MBA / PGDM after any bachelor's degree"],
    exams:["CUET","IPMAT","CAT/XAT/CMAT/SNAP for PG routes"],
    careers:[
      {title:"Business Manager", desc:"Coordinates people, budgets and processes to hit organisational goals.", skills:["Planning","Communication","Decision-making"], path:"Any stream → BBA/BMS → MBA or work experience"},
      {title:"Product Manager", desc:"Defines what a product should become by balancing user needs and business goals.", skills:["Prioritisation","Research","Coordination"], path:"Any degree + projects/internships → product roles"}
    ]
  },
  {
    id:"hospitality-tourism", label:"Hospitality & Tourism", icon:"🧳", count:7, accent:"var(--teal)",
    summary:"Creates guest, travel, food, hotel and event experiences through service and operations.",
    subjects:["English","Business studies","Geography","Service mindset"],
    routes:["Hotel management degree","Travel and tourism degree","Culinary arts programmes"],
    exams:["NCHM JEE","CUET","Institute interviews and aptitude tests"],
    careers:[
      {title:"Hotel Manager", desc:"Runs guest services, rooms, events, staff and hospitality operations.", skills:["Service quality","Operations","People management"], path:"10+2 any stream → hotel management degree"},
      {title:"Travel Planner", desc:"Designs itineraries, bookings and destination experiences for customers.", skills:["Geography","Coordination","Customer care"], path:"10+2 any stream → tourism degree/diploma"}
    ]
  },
  {
    id:"entrepreneurship", label:"Entrepreneurship", icon:"🚀", count:1, accent:"var(--coral)",
    summary:"Turns problems into ventures through experimentation, selling, product building and risk-taking.",
    subjects:["Business studies","Technology basics","Communication","Finance basics"],
    routes:["BBA Entrepreneurship","Any degree plus incubation-cell projects","Startup fellowships and maker programmes"],
    exams:["CUET or institute tests for degrees","Pitch competitions","Incubator selection processes"],
    careers:[
      {title:"Founder", desc:"Builds a product, service or organisation from idea to customers.", skills:["Problem finding","Sales","Iteration"], path:"Any stream → projects, mentors, incubators and business learning"}
    ]
  }
];

const scholarshipResources = [
  {
    id:"vidya-lakshmi-loan",
    title:"PM Vidyalaxmi / Vidya Lakshmi Education Loan",
    type:"Government education loan",
    source:"Official PM Vidyalaxmi / Vidya Lakshmi portals + PMC Handbook 2024 p.108",
    audience:"Students with admission to higher education who need bank loan support or interest-subvention checks.",
    details:[
      "Vidya Lakshmi now points applicants to PM Vidyalaxmi for the simplified loan and interest-subvention process.",
      "PM Vidyalaxmi supports collateral-free, guarantor-free loans for students admitted to listed quality higher education institutions; income affects interest-subvention benefits.",
      "Use after receiving an admission letter, institution details and fee structure. Never pay agents or unofficial websites."
    ],
    documents:["Last six months' bank passbook statements","PAN card and Aadhaar card","10th, 12th and degree marksheets","Admission letter with fee details"],
    url:"https://pmvidyalaxmi.co.in/",
    tags:["PM Vidyalaxmi","loan","bank","all streams","admission letter","interest subvention"],
    relatedCategories:["all"]
  },
  {
    id:"national-scholarship-portal",
    title:"National Scholarship Portal",
    type:"Central portal",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"Students checking central government scholarship schemes in one place.",
    details:[
      "Use this as the first official gateway for central scholarship applications.",
      "Relevant schemes include disability, minority, SC, OBC/EBC/DNT and college/university scholarship categories."
    ],
    url:"https://scholarships.gov.in",
    tags:["central government","NSP","official portal","all streams"],
    relatedCategories:["all"]
  },
  {
    id:"myscheme-gateway",
    title:"MyScheme and Services India",
    type:"Government scheme finder",
    source:"PMC Handbook 2024, Online Resources p.110",
    audience:"Students and families searching for government benefits by eligibility.",
    details:[
      "Use MyScheme to discover schemes based on state, category, gender, income and education level.",
      "Services India can help locate official government service pages."
    ],
    url:"https://www.myscheme.gov.in",
    tags:["scheme finder","government services","eligibility","all streams"],
    relatedCategories:["all"]
  },
  {
    id:"jansamarth",
    title:"Jan Samarth",
    type:"Loan and scheme gateway",
    source:"PMC Handbook 2024, Online Resources p.110",
    audience:"Students comparing credit-linked government schemes and loan support.",
    details:[
      "Listed in the handbook as a useful student website for scheme and support discovery.",
      "Best used alongside the official scheme or bank portal before applying."
    ],
    url:"https://www.jansamarth.in/home",
    tags:["loan","government schemes","gateway","all streams"],
    relatedCategories:["all"]
  },
  {
    id:"aicte-tuition-waiver",
    title:"AICTE Tuition Fee Waiver Scheme",
    type:"College / technical education",
    source:"PMC Handbook 2024, Loan & Scholarships p.108",
    audience:"Students entering AICTE-approved technical programmes through state-level processes.",
    details:[
      "AICTE's Approval Process Handbook applies this to approved technical institutions and lists parent annual income up to INR 8 lakh.",
      "The waiver is for tuition fee only; other fees may still be payable.",
      "Seats are handled through the state or UT admission authority, so students must check the counselling brochure."
    ],
    url:"https://www.aicte-india.org",
    tags:["AICTE","tuition waiver","technical","state committee"],
    relatedCategories:["engineering","computer-science-it","architecture","mathematics-statistics","science","management"]
  },
  {
    id:"first-graduate-tn",
    title:"First Graduate Scholarship",
    type:"Tamil Nadu state support",
    source:"PMC Handbook 2024, Loan & Scholarships p.108",
    audience:"Tamil Nadu students who may qualify as first-generation graduates.",
    details:[
      "The handbook lists this as a state scholarship route through TN e-Sevai.",
      "Students should verify community, income, course and first-graduate certificate requirements before applying."
    ],
    url:"https://www.tnesevai.tn.gov.in",
    tags:["Tamil Nadu","first graduate","state scholarship","all streams"],
    relatedCategories:["all"]
  },
  {
    id:"pudhumai-penn",
    title:"Penkalvi / Pudhumai Penn",
    type:"Tamil Nadu state support",
    source:"PMC Handbook 2024, Loan & Scholarships p.108",
    audience:"Girl students in Tamil Nadu checking state higher-education support.",
    details:[
      "Tamil Nadu higher-education assistance of INR 1,000 per month for eligible girl students.",
      "Typically for girl students who studied classes VI to XII in Tamil Nadu government schools and joined UG, diploma, ITI or equivalent higher education.",
      "Verify school background, institution, course and bank-account requirements on the official portal after admission."
    ],
    url:"https://www.pudhumaipenn.tn.gov.in",
    tags:["Tamil Nadu","girl students","Pudhumai Penn","state scholarship"],
    relatedCategories:["all"]
  },
  {
    id:"tamil-pudhalvan",
    title:"Tamil Pudhalvan",
    type:"Tamil Nadu state support",
    source:"Tamil Nadu Government schemes page, checked Aug 2026",
    audience:"Eligible male students from Tamil Nadu government-school routes entering higher education.",
    details:[
      "Tamil Nadu higher-education assistance of INR 1,000 per month for eligible male students.",
      "Generally for male students who studied classes VI to XII in Tamil Nadu government schools and joined degree, diploma, ITI or equivalent higher education.",
      "Students should apply through the official college/scheme process after admission and verify bank, Aadhaar and school-study certificate requirements."
    ],
    documents:["School study certificate","Aadhaar card","Student bank passbook","Admission proof or bonafide certificate"],
    url:"https://tils.tn.gov.in/schemes",
    tags:["Tamil Nadu","male students","Tamil Pudhalvan","state scholarship","government school"],
    relatedCategories:["all"]
  },
  {
    id:"tn-bc-mbc-dnc-post-matric",
    title:"Tamil Nadu BC/MBC/DNC Post-Matric and Free-Education Support",
    type:"Tamil Nadu state support",
    source:"Tamil Nadu Backward Classes Welfare scholarship page, checked Aug 2026",
    audience:"Tamil Nadu BC, MBC and DNC students in college, diploma, ITI, professional or postgraduate routes.",
    details:[
      "Official Tamil Nadu pages list post-matric scholarship support for BC/MBC/DNC students in higher education.",
      "Income ceiling and first-graduate conditions depend on the course type; professional and diploma support often uses INR 2.5 lakh family-income checks.",
      "Applications are commonly routed through the institution and the Tamil Nadu scholarship/UMIS process."
    ],
    documents:["Community certificate","Income certificate where required","Aadhaar-linked bank account","UMIS ID","College bonafide / fee details"],
    url:"https://www.bcw.tn.gov.in/sub_page/8",
    tags:["Tamil Nadu","BC","MBC","DNC","post-matric","first graduate"],
    relatedCategories:["all"]
  },
  {
    id:"tn-sc-st-post-matric",
    title:"Tamil Nadu SC/ST Post-Matric Scholarship",
    type:"Tamil Nadu state support",
    source:"Tamil Nadu Adi Dravidar and Tribal Welfare scholarship portal, checked Aug 2026",
    audience:"Tamil Nadu SC/ST/SCC students pursuing post-matric education.",
    details:[
      "Official Tamil Nadu portals list post-matric scholarship services for SC, ST and SCC students.",
      "Students should check the current academic-year opening status, institution verification workflow and required certificates.",
      "Apply only through official Tamil Nadu scholarship portals or the college's scholarship office."
    ],
    documents:["Community certificate","Income certificate where required","Aadhaar-linked bank account","Marksheets","College bonafide / fee details"],
    url:"https://www.tnadwscholarship.in/",
    tags:["Tamil Nadu","SC/ST","post-matric","Adi Dravidar","Tribal Welfare"],
    relatedCategories:["all"]
  },
  {
    id:"aicte-pragati-saksham-swanath",
    title:"AICTE Pragati, Saksham and Swanath",
    type:"UGC / AICTE",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"Technical-course students, especially girl students, specially abled students and orphan students.",
    details:[
      "Pragati Scholarship Scheme is listed for girl students.",
      "Saksham Scholarship Scheme is listed for specially abled students.",
      "AICTE Swanath Scholarship Scheme is listed for orphan students."
    ],
    url:"https://www.aicte-india.org",
    tags:["AICTE","Pragati","Saksham","Swanath","technical"],
    relatedCategories:["engineering","computer-science-it","architecture","science","mathematics-statistics"]
  },
  {
    id:"central-disability-scholarships",
    title:"Disability Education Scholarships",
    type:"Central schemes",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"Students with disabilities seeking post-matric or top-class education support.",
    details:[
      "Post-Matric Scholarship for Students with Disabilities.",
      "Scholarships for Top Class Education for Students with Disabilities."
    ],
    url:"https://scholarships.gov.in",
    tags:["disability","post-matric","top class education","central"],
    relatedCategories:["all"]
  },
  {
    id:"central-community-scholarships",
    title:"Minority, SC, OBC, EBC and DNT Schemes",
    type:"Central schemes",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"Students checking community-linked central scholarships for higher education.",
    details:[
      "Post Matric Scholarships Scheme for Minorities.",
      "Merit-cum-Means Scholarship for Professional and Technical Courses.",
      "Top Class Education Scheme for SC Students.",
      "PM Yasasvi Central Sector Scheme for OBC, EBC and DNT students."
    ],
    url:"https://scholarships.gov.in",
    tags:["minority","SC","OBC","EBC","DNT","professional courses"],
    relatedCategories:["all"]
  },
  {
    id:"central-sector-college",
    title:"Central Sector Scheme for College and University Students",
    type:"Central schemes",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"College and university students checking central merit-linked support.",
    details:[
      "Listed in the handbook under central schemes.",
      "Students should verify board percentile, income and renewal rules on the official portal."
    ],
    url:"https://scholarships.gov.in",
    tags:["central sector","college","university","merit"],
    relatedCategories:["all"]
  },
  {
    id:"worker-wards-post-matric",
    title:"Wards of Beedi, Cine, IOMC and LSDM Workers",
    type:"Central schemes",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"Eligible children of listed worker categories seeking post-matric support.",
    details:[
      "The handbook lists financial assistance for education of wards of Beedi, Cine, IOMC and LSDM workers.",
      "Check parent occupation documents and current post-matric eligibility before applying."
    ],
    url:"https://scholarships.gov.in",
    tags:["worker wards","post-matric","central","financial assistance"],
    relatedCategories:["all"]
  },
  {
    id:"aisee",
    title:"AISEE Scholarship",
    type:"Private exam-based",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"Students exploring exam-based scholarship support.",
    details:[
      "Listed in the handbook, but current evidence should be treated as a private exam-based scholarship route rather than a confirmed central government scheme.",
      "Verify exam cycle, eligible courses, fee, refund rules and provider credibility before registering.",
      "Prefer official government portals first when the student needs assured public scholarship support."
    ],
    url:"https://www.aisee.co.in",
    tags:["AISEE","exam-based","private","verify before paying"],
    relatedCategories:["all"]
  },
  {
    id:"foundation-ngo-scholarships",
    title:"Foundation and NGO Scholarships",
    type:"Foundation / NGO",
    source:"PMC Handbook 2024, Loan & Scholarships p.108",
    audience:"Students looking for non-government scholarships and mentoring support.",
    details:[
      "LMES Foundation KALVIKARAM Scholarship.",
      "Maatram Foundation, Anandham Youth Foundation, Mugavari Foundation, SEEEDS and Team Everest.",
      "Vidyadhan Scholarship for students who need long-term academic support."
    ],
    url:"https://www.vidyadhan.org",
    tags:["NGO","foundation","Vidyadhan","Maatram","Team Everest","SEEEDS"],
    relatedCategories:["all"]
  },
  {
    id:"ffe-stem-scholarships",
    title:"Foundation for Excellence, GSK and Amazon Future Engineer",
    type:"Foundation / STEM",
    source:"PMC Handbook 2024, Loan & Scholarships p.108",
    audience:"Students pursuing high-cost professional or STEM-linked education.",
    details:[
      "Foundation for Excellence scholarships.",
      "GSK Scholars Programme.",
      "Amazon Future Engineer Scholarship."
    ],
    url:"https://ffe.org/scholarships",
    tags:["FFE","GSK","Amazon Future Engineer","STEM","engineering","medicine"],
    relatedCategories:["engineering","computer-science-it","medical-science","allied-medicine","science","mathematics-statistics"]
  },
  {
    id:"hdfc-parivartan-ecss",
    title:"HDFC Bank Parivartan ECSS",
    type:"Verified CSR scholarship",
    source:"HDFC Bank CSR education page, checked Aug 2026",
    audience:"School, diploma, ITI, polytechnic, UG and PG students facing personal or family financial crisis.",
    details:[
      "HDFC Bank describes ECSS as support for meritorious and needy students at risk of dropping out.",
      "The official CSR page says support can cover Class 1-12, diploma, ITI, polytechnic, UG and PG routes with assistance up to INR 75,000 depending on category.",
      "Students should verify the current cycle on the official ECSS page before applying."
    ],
    url:"https://v.hdfc.bank.in/csr/initiatives/education.html",
    tags:["HDFC","Parivartan","ECSS","financial crisis","all streams"],
    relatedCategories:["all"]
  },
  {
    id:"kotak-kanya",
    title:"Kotak Kanya Scholarship",
    type:"Verified CSR scholarship",
    source:"Kotak Education Foundation / Buddy4Study current listing, checked Aug 2026",
    audience:"Meritorious girl students entering recognised professional undergraduate courses.",
    details:[
      "Current public listing describes Kotak Kanya as support for girls admitted to first-year professional graduation programmes.",
      "Typical checks include Class 12 marks, recognised professional course admission and family-income ceiling.",
      "Apply only through the current official/partner application page and confirm the deadline for the academic year."
    ],
    url:"https://www.buddy4study.com/article/kotak-kanya-scholarship",
    tags:["Kotak","girl students","professional degree","CSR","need-cum-merit"],
    relatedCategories:["engineering","computer-science-it","medical-science","allied-medicine","law","architecture","arts-design","science","management"]
  },
  {
    id:"legrand-empowering",
    title:"Legrand Empowering Scholarship",
    type:"Verified CSR scholarship",
    source:"Legrand Empowering Scholarship official page, checked Aug 2026",
    audience:"Meritorious girl students and special-category students entering eligible UG courses.",
    details:[
      "The 2026-27 page lists support for B.Tech, B.E., B.Arch., BBA, B.Com. and B.Sc. courses in India.",
      "General category is for girl students; special category includes disability, orphan/single-parent and diversity-linked cases.",
      "The official page lists income and marks requirements that students must verify before applying."
    ],
    url:"https://legrandscholarship.co.in/",
    tags:["Legrand","girl students","disability","LGBTQ+","engineering","architecture","science"],
    relatedCategories:["engineering","computer-science-it","architecture","science","mathematics-statistics","management","banking-finance"]
  },
  {
    id:"rolls-royce-unnati",
    title:"Rolls-Royce Unnati Scholarship for Women Engineering Students",
    type:"Verified CSR scholarship",
    source:"Rolls-Royce India scholarship page, checked Aug 2026",
    audience:"Women students pursuing undergraduate engineering programmes.",
    details:[
      "Rolls-Royce describes Unnati as financial support and mentoring for women engineering students in India.",
      "Students should verify whether the current application cycle is open and whether the programme still uses the same implementation partner.",
      "Best matched for students already admitted to engineering or related technical programmes."
    ],
    url:"https://www.rolls-royce.com/media/our-stories/discover/2020/unnati-scholarship-programme-for-women-engineering-students.aspx",
    tags:["Rolls-Royce","Unnati","women","engineering","CSR"],
    relatedCategories:["engineering","computer-science-it"]
  },
  {
    id:"company-scholarships",
    title:"Corporate Scholarship Tracker",
    type:"Aggregator / CSR discovery",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"Students checking CSR-backed scholarships from companies and corporate foundations.",
    details:[
      "Use this only as a discovery list; apply through each provider's official page or verified implementation partner.",
      "The app now also lists high-confidence individual CSR scholarships separately where current source pages were found.",
      "Deadlines, amounts and eligibility can change every year, so verify before submission."
    ],
    url:"https://www.buddy4study.com",
    tags:["corporate","CSR","tracker","verify source","all streams"],
    relatedCategories:["engineering","computer-science-it","science","mathematics-statistics","management","medical-science"]
  },
  {
    id:"bank-scholarships",
    title:"Bank-linked Scholarship Tracker",
    type:"Aggregator / bank CSR",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"Students checking scholarship support listed under bank programmes.",
    details:[
      "Use this as a reminder to check current HDFC, Kotak and similar bank CSR scholarship cycles.",
      "The app lists HDFC Parivartan and Kotak Kanya separately where current source pages were found.",
      "Always verify current application dates, income ceiling and provider terms before applying."
    ],
    url:"https://www.buddy4study.com",
    tags:["HDFC","Kotak","bank","CSR","tracker"],
    relatedCategories:["all"]
  },
  {
    id:"buddy4study",
    title:"Buddy4Study Gateway",
    type:"Scholarship discovery",
    source:"PMC Handbook 2024, Loan & Scholarships p.109",
    audience:"Students who want one searchable place for Indian scholarship updates.",
    details:[
      "The handbook lists Buddy4Study as a gateway to scholarships in India.",
      "Use it for discovery, then confirm rules on the official scholarship provider page."
    ],
    url:"https://www.buddy4study.com",
    tags:["scholarship search","gateway","updates","all streams"],
    relatedCategories:["all"]
  },
  {
    id:"tahdco",
    title:"TAHDCO Scholarship, Education Loan and Training Support",
    type:"Tamil Nadu SC/ST support",
    source:"PMC Handbook 2024, TAHDCO p.111",
    audience:"Tamil Nadu SC/ST students in school, UG, PG, technical degree, ITI or polytechnic routes.",
    details:[
      "TAHDCO is listed for skill-based training, employment opportunities, scholarship and education-loan support.",
      "The handbook notes training areas such as medical coding, HCL Tech Bee, IBPS bank exam training, GST account assistant, aviation customer service, agricultural drone training, merchant navy training, CAT training, SSC exam training, IITM BS data science and hotel management.",
      "The handbook states the entire fee for listed training will be provided by TAHDCO."
    ],
    url:"https://tahdco.com",
    tags:["Tamil Nadu","SC/ST","TAHDCO","training","education loan"],
    relatedCategories:["all"]
  }
];

export { orientationQuestions,orientationOrder,orientationMeta,streams,riasecMeta,riasecQuestions,streamRiasecProfiles,personalityQuestions,archetypes,careerData,streamLibraryMap,careerResearchSources,career2030Sources,career2030Outlook,contentFreshness,libraryCategories,scholarshipResources };
