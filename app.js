// Wait for DOM content to load
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Initialize Particles Background
    initParticles();

    // 2. Render System Cards from data.js
    renderSystemCards();

    // 3. Initialize Interactive IDE Sandbox
    initIDESandbox();

    // 4. Initialize SVG Circuit Wire
    setTimeout(updateCircuitPath, 100); // Small timeout to ensure document layout is rendered
    window.addEventListener("resize", updateCircuitPath);
    window.addEventListener("scroll", animateWire);

    // 5. Setup Section Highlighting and Intersection Observers
    initIntersectionObservers();

    // 6. Setup Terminal Contact Form
    initContactForm();

    // 7. Redraw wire smoothly when navigating between sections to update positions in real-time
    document.querySelectorAll(".nav-link, .btn-inspect, .btn-run-inspect").forEach(link => {
        link.addEventListener("click", () => {
            let timer = 0;
            const interval = setInterval(() => {
                updateCircuitPath();
                timer += 50;
                if (timer >= 800) clearInterval(interval);
            }, 50);
        });
    });
});

/* ==========================================================================
   PARTICLE CANVAS BACKGROUND
   ========================================================================== */
function initParticles() {
    const canvas = document.getElementById("particle-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let particles = [];
    const particleCount = 45;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height + canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedY = -(Math.random() * 0.6 + 0.2);
            this.speedX = (Math.random() * 0.4 - 0.2);
            this.color = Math.random() > 0.5 ? "rgba(0, 242, 254, 0.3)" : "rgba(127, 0, 255, 0.3)";
        }
        
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            
            // Re-spawn at bottom if particle goes off screen
            if (this.y < 0 || this.x < 0 || this.x > canvas.width) {
                this.reset();
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.fill();
        }
    }
    
    // Create initial particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
        // Stagger positions initially so they aren't all rising from bottom
        particles[i].y = Math.random() * canvas.height;
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Disable shadow effects for performance on particle updates
        ctx.shadowBlur = 0;
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        requestAnimationFrame(animate);
    }
    animate();
}

/* ==========================================================================
   DYNAMIC SVG CIRCUIT WIRE
   ========================================================================== */
function getAbsoluteY(selector) {
    const el = document.querySelector(selector);
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return rect.top + window.scrollY;
}

function updateCircuitPath() {
    const path = document.getElementById("circuit-wire");
    if (!path) return;
    
    const docHeight = document.documentElement.scrollHeight;
    const width = window.innerWidth;
    const isMobile = width < 768;
    
    // We will build a path dynamically winding across the screen, avoiding content cards
    let d = `M ${width * (isMobile ? 0.05 : 0.15)} 0`;
    
    // Checkpoints where the line flows wiggling across the screen, routing around contents
    const checkpoints = isMobile ? [
        { y: getAbsoluteY("#hero"), offset: 0.05 },
        { y: getAbsoluteY("#systems") - 50, offset: 0.04 },
        { y: getAbsoluteY("#systems") + 250, offset: 0.06 },
        { y: getAbsoluteY("#systems") + 550, offset: 0.04 },
        { y: getAbsoluteY("#systems") + 850, offset: 0.06 },
        { y: getAbsoluteY("#playground") - 200, offset: 0.04 },
        { y: getAbsoluteY("#playground") - 50, offset: 0.05 },
        { y: getAbsoluteY("#playground") + 550, offset: 0.04 },
        { y: getAbsoluteY("#tech") - 100, offset: 0.05 },
        { y: getAbsoluteY("#tech") + 300, offset: 0.04 },
        { y: getAbsoluteY("#contact") - 80, offset: 0.06 },
        { y: docHeight, offset: 0.05 }
    ] : [
        { y: getAbsoluteY("#hero"), offset: 0.15 },
        
        // Systems section left margin motherboard trace wiggles
        { y: getAbsoluteY("#systems") - 50, offset: 0.08 },
        { y: getAbsoluteY("#systems") + 250, offset: 0.05 },
        { y: getAbsoluteY("#systems") + 550, offset: 0.08 },
        { y: getAbsoluteY("#systems") + 850, offset: 0.05 },
        { y: getAbsoluteY("#playground") - 200, offset: 0.08 },
        
        // Cross to right margin in the gap before Sandbox IDE
        { y: getAbsoluteY("#playground") - 50, offset: 0.92 },
        { y: getAbsoluteY("#playground") + 150, offset: 0.95 },
        { y: getAbsoluteY("#playground") + 350, offset: 0.91 },
        { y: getAbsoluteY("#playground") + 550, offset: 0.92 },
        
        // Cross back to left margin in the gap before Tech
        { y: getAbsoluteY("#tech") - 100, offset: 0.08 },
        { y: getAbsoluteY("#tech") + 150, offset: 0.05 },
        { y: getAbsoluteY("#tech") + 300, offset: 0.08 },
        
        // Cross to right margin in the gap before Contact
        { y: getAbsoluteY("#contact") - 80, offset: 0.85 },
        { y: docHeight, offset: 0.50 }
    ];
    
    // Sort checkpoints chronologically down the page
    checkpoints.sort((a, b) => a.y - b.y);
    
    let currentX = width * (isMobile ? 0.05 : 0.15);
    let currentY = 0;
    
    for (let i = 0; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        const targetY = cp.y;
        const targetX = width * cp.offset;
        
        // Generate dynamic, smooth S-curves using Cubic Bezier control points
        const dy = targetY - currentY;
        const cy1 = currentY + dy * 0.45;
        const cy2 = currentY + dy * 0.55;
        
        d += ` C ${currentX} ${cy1}, ${targetX} ${cy2}, ${targetX} ${targetY}`;
        
        currentX = targetX;
        currentY = targetY;
    }
    
    path.setAttribute("d", d);
    
    // Update path drawing boundary settings
    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength} ${pathLength}`;
    path.style.strokeDashoffset = pathLength;
    
    // Immediately calculate drawing state based on current scroll position
    animateWire();
}

let currentPct = 0;
let targetPct = 0;

function animateWire() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    targetPct = Math.min(Math.max(scrollTop / docHeight, 0), 1);
}

function smoothDrawLoop() {
    // Easing interpolation (LERP) for 60fps smooth scrolling wire effect
    // Increase catch-up speed dynamically (faster on mobile for direct response, smooth on desktop)
    const isMobile = window.innerWidth < 768;
    const lerpSpeed = isMobile ? 0.24 : 0.12;
    currentPct += (targetPct - currentPct) * lerpSpeed;
    
    const path = document.getElementById("circuit-wire");
    if (path) {
        const pathLength = path.getTotalLength();
        path.style.strokeDashoffset = pathLength - (pathLength * currentPct);
    }
    
    requestAnimationFrame(smoothDrawLoop);
}

// Initialize smooth loop
smoothDrawLoop();

/* ==========================================================================
   RENDER SYSTEM CARDS
   ========================================================================== */
function renderSystemCards() {
    const container = document.getElementById("systems-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    PORTFOLIO_DATA.forEach((sys, index) => {
        const indexStr = String(index + 1).padStart(2, "0");
        const card = document.createElement("div");
        card.className = "system-card";
        card.setAttribute("data-category", sys.category);
        
        // Fallback checks for images vs videos (use lazy data-src to prevent choking mobile bandwidth)
        const isVideo = sys.video;
        const mediaTag = isVideo 
            ? `<video class="card-video" data-src="${sys.video}" muted loop playsinline preload="none" poster="${sys.image || './Asessts/chassis/image.png'}"></video>` 
            : `<img class="card-img" src="${sys.image || './Asessts/chassis/image.png'}" alt="${sys.title}">`;
            
        const descHtml = sys.description ? `<p class="card-desc">${sys.description}</p>` : "";
        card.innerHTML = `
            <div class="card-node"></div>
            <div class="card-sys-tag">[SYS_${indexStr}]</div>
            <div>
                <span class="card-category">${sys.category}</span>
                <h3 class="card-title">${sys.title}</h3>
            </div>
            ${descHtml}
            <div class="card-media">
                ${mediaTag}
            </div>
            <div class="card-actions">
                <a href="#playground" class="btn btn-secondary btn-card btn-inspect" data-id="${sys.id}">
                    <i class="fa-solid fa-code"></i> Inspect Source
                </a>
                <a href="#playground" class="btn btn-primary btn-card btn-run-inspect" data-id="${sys.id}">
                    <i class="fa-solid fa-play"></i> Run Code
                </a>
            </div>
        `;
        
        container.appendChild(card);
        
        // Lazy load video stream on demand (hover on desktop, click/tap on mobile)
        if (isVideo) {
            const videoEl = card.querySelector(".card-video");
            const mediaContainer = card.querySelector(".card-media");
            
            const startVideo = () => {
                if (!videoEl.getAttribute("src")) {
                    videoEl.src = videoEl.getAttribute("data-src");
                }
                videoEl.play().catch(() => {});
                mediaContainer.classList.add("playing");
            };
            
            const stopVideo = () => {
                videoEl.pause();
                mediaContainer.classList.remove("playing");
            };
            
            // Desktop hover play
            card.addEventListener("mouseenter", startVideo);
            card.addEventListener("mouseleave", stopVideo);
            
            // Mobile tap-to-play toggle on the ENTIRE CARD (swipes/scrolls do not trigger clicks, preventing network choke)
            card.addEventListener("click", (e) => {
                // Ignore clicks on action buttons
                if (e.target.closest(".card-actions")) return;
                
                e.stopPropagation();
                if (!videoEl.getAttribute("src")) {
                    videoEl.src = videoEl.getAttribute("data-src");
                }
                if (videoEl.paused) {
                    videoEl.play().catch(() => {});
                    mediaContainer.classList.add("playing");
                } else {
                    videoEl.pause();
                    mediaContainer.classList.remove("playing");
                }
            });
        }
    });

    // Setup filter button listeners
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const filterValue = btn.getAttribute("data-filter");
            const cards = document.querySelectorAll(".system-card");
            
            cards.forEach(card => {
                const category = card.getAttribute("data-category");
                if (filterValue === "all" || category === filterValue) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
            
            // Smoothly recalculate circuit wire path during grid height transition
            let timer = 0;
            const interval = setInterval(() => {
                updateCircuitPath();
                timer += 40;
                if (timer >= 600) clearInterval(interval);
            }, 40);
        });
    });
}

/* ==========================================================================
   INTERACTIVE IDE / TERMINAL SANDBOX
   ========================================================================== */
let activeProject = null;
let terminalInterval = null;
let isCompiling = false;

function initIDESandbox() {
    const fileList = document.getElementById("ide-file-list");
    const tabsBar = document.getElementById("editor-tabs");
    const codeDisplay = document.getElementById("code-display");
    const lineNumbers = document.getElementById("line-numbers");
    const btnRunCode = document.getElementById("btn-run-code");
    const btnClearTerminal = document.getElementById("btn-clear-terminal");
    const terminalOutput = document.getElementById("terminal-output");
    
    if (!fileList || !PORTFOLIO_DATA.length) return;
    
    // Render sidebar file explorer list
    fileList.innerHTML = "";
    PORTFOLIO_DATA.forEach((sys) => {
        const li = document.createElement("li");
        li.className = "file-item";
        li.setAttribute("data-id", sys.id);
        li.innerHTML = `<i class="fa-solid fa-file-code" style="color: #61afef;"></i> ${sys.file}`;
        fileList.appendChild(li);
        
        li.addEventListener("click", () => {
            loadProjectToIDE(sys.id);
        });
    });

    // Inspect buttons binding inside project cards
    document.querySelectorAll(".btn-inspect").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            loadProjectToIDE(id);
        });
    });
    
    document.querySelectorAll(".btn-run-inspect").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            loadProjectToIDE(id);
            // Wait slightly for scroll transition, then run
            setTimeout(() => {
                executeSystemCode();
            }, 600);
        });
    });

    // Execute Sandbox Action
    btnRunCode.addEventListener("click", executeSystemCode);
    
    // Clear console output
    btnClearTerminal.addEventListener("click", () => {
        terminalOutput.innerHTML = `<div class="terminal-line system">[System] Console cleared.</div>`;
    });

    // Load initial system (Portal 2) as default
    loadProjectToIDE(PORTFOLIO_DATA[0].id);
}

function loadProjectToIDE(projectId) {
    const sys = PORTFOLIO_DATA.find(p => p.id === projectId);
    if (!sys) return;
    
    activeProject = sys;
    
    // Highlight sidebar item
    document.querySelectorAll(".file-item").forEach(item => {
        if (item.getAttribute("data-id") === projectId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Update opened tabs
    const tabsBar = document.getElementById("editor-tabs");
    tabsBar.innerHTML = `
        <div class="editor-tab active">
            <i class="fa-solid fa-file-code" style="color: #61afef;"></i> ${sys.file}
        </div>
    `;

    // Set Active Title
    document.getElementById("ide-active-tab-title").innerText = sys.file;

    // Load Code and Highlights
    const codeDisplay = document.getElementById("code-display");
    codeDisplay.innerHTML = highlightLua(sys.code);

    // Set Line Numbers
    const lines = sys.code.split("\n");
    const numContainer = document.getElementById("line-numbers");
    numContainer.innerHTML = "";
    for (let i = 1; i <= lines.length; i++) {
        numContainer.innerHTML += `<div>${i}</div>`;
    }

    // Set Telemetry Feed Video / Image
    const feedVideo = document.getElementById("feed-video");
    const feedImg = document.getElementById("feed-image");
    const feedFallback = document.getElementById("feed-fallback");
    
    // Reset compile state if they switch modules mid-compile
    if (terminalInterval) {
        clearInterval(terminalInterval);
        isCompiling = false;
    }
    
    // Pause any existing videos
    feedVideo.pause();
    feedVideo.src = "";
    feedImg.src = "";
    
    if (sys.video) {
        feedVideo.src = sys.video;
        feedVideo.style.display = "block";
        feedImg.style.display = "none";
        feedFallback.style.display = "none";
        feedVideo.play().catch(() => {});
    } else if (sys.image) {
        feedImg.src = sys.image;
        feedImg.style.display = "block";
        feedVideo.style.display = "none";
        feedFallback.style.display = "none";
    } else {
        feedVideo.style.display = "none";
        feedImg.style.display = "none";
        feedFallback.style.display = "flex";
    }

    // Log load telemetry to console
    appendTerminalLine(`[System] Loaded module "${sys.file}" into viewport. Ready to compile.`, "system");
}

function executeSystemCode() {
    if (!activeProject) return;
    
    // Enforce rate limit / double-click protection
    if (isCompiling) {
        appendTerminalLine("[System] WARNING: Compilation queue locked. Awaiting completion of current execution...", "error");
        return;
    }
    
    isCompiling = true;
    const btnRunCode = document.getElementById("btn-run-code");
    if (btnRunCode) {
        btnRunCode.style.opacity = "0.5";
        btnRunCode.style.pointerEvents = "none";
    }
    
    const consoleBox = document.getElementById("terminal-output");
    
    // Prevent overlapping execution timeouts
    if (terminalInterval) clearInterval(terminalInterval);
    
    appendTerminalLine(`[System] Compiling ${activeProject.file}...`, "system");
    appendTerminalLine(`[System] Initializing Luau VM stack...`, "system");
    
    let step = 0;
    const outputs = activeProject.terminalOutput;
    
    terminalInterval = setInterval(() => {
        if (step < outputs.length) {
            let type = "output";
            if (outputs[step].includes("Success") || outputs[step].includes("verified") || outputs[step].includes("PASSED")) {
                type = "success";
            } else if (outputs[step].includes("rejected") || outputs[step].includes("conflict")) {
                type = "error";
            }
            appendTerminalLine(outputs[step], type);
            step++;
        } else {
            clearInterval(terminalInterval);
            isCompiling = false;
            if (btnRunCode) {
                btnRunCode.style.opacity = "1";
                btnRunCode.style.pointerEvents = "auto";
            }
            appendTerminalLine(`[Success] Execution of ${activeProject.file} terminated cleanly. Status: ONLINE.`, "success");
            
            // Add a pulse glow to the telemetry viewport to indicate it is running
            const viewport = document.querySelector(".feed-viewport");
            viewport.style.boxShadow = "inset 0 0 30px rgba(57, 255, 20, 0.4)";
            setTimeout(() => {
                viewport.style.boxShadow = "none";
            }, 1000);
        }
    }, 450);
}

function appendTerminalLine(text, type = "output") {
    const consoleBox = document.getElementById("terminal-output");
    if (!consoleBox) return;
    
    const line = document.createElement("div");
    line.className = `terminal-line ${type}`;
    line.innerText = text;
    
    consoleBox.appendChild(line);
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

/* Custom Regex Syntax Highlighter for Luau */
function highlightLua(code) {
    const tokenRules = [
        { type: 'comment', regex: /^(--[^\n]*)/ },
        { type: 'string', regex: /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\[\[[\s\S]*?\]\])/ },
        { type: 'number', regex: /^(0x[0-9a-fA-F]+|\d*\.?\d+(?:[eE][+-]?\d+)?)/ },
        { type: 'keyword', regex: /^(local|function|return|end|if|then|else|elseif|for|in|do|while|and|or|not|repeat|until|nil|true|false)\b/ },
        { type: 'builtin', regex: /^(game|workspace|script|Instance|Vector3|CFrame|TweenInfo|Enum|pcall|error|warn|print|pairs|ipairs|tostring|tonumber|math|table|string|task|delay|wait|Spawn|spawn|destroy|Destroy)\b/ },
        { type: 'self', regex: /^(self)\b/ },
        { type: 'func', regex: /^([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/ },
        { type: 'operator', regex: /^([+\-*/%^#=<>~:]+)/ },
        { type: 'word', regex: /^([a-zA-Z_][a-zA-Z0-9_]*)/ },
        { type: 'whitespace', regex: /^(\s+)/ },
        { type: 'other', regex: /^([\s\S])/ }
    ];

    let html = '';
    let remaining = code;

    while (remaining.length > 0) {
        let matched = false;
        for (const rule of tokenRules) {
            const match = remaining.match(rule.regex);
            if (match) {
                const text = match[0];
                remaining = remaining.substring(text.length);
                
                const escapedText = text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                    
                if (rule.type === 'whitespace' || rule.type === 'word' || rule.type === 'other') {
                    html += escapedText;
                } else {
                    html += `<span class="tok-${rule.type}">${escapedText}</span>`;
                }
                matched = true;
                break;
            }
        }
        if (!matched) {
            const char = remaining.charAt(0);
            html += char.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            remaining = remaining.substring(1);
        }
    }
    return html;
}

/* ==========================================================================
   INTERSECTION OBSERVERS FOR HIGH-AESTHETIC ACTIVATIONS
   ========================================================================== */
function initIntersectionObservers() {
    // 1. Section Header / Navigation highlighting
    const sections = document.querySelectorAll(".section");
    const navLinks = document.querySelectorAll(".nav-link");
    
    const observerOptions = {
        root: null,
        rootMargin: "-25% 0px -55% 0px", // Detect middle-upper viewport intersections
        threshold: 0
    };
    
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                
                navLinks.forEach(link => {
                    if (link.getAttribute("href") === `#${id}`) {
                        link.classList.add("active");
                    } else {
                        link.classList.remove("active");
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(sec => navObserver.observe(sec));

    // 2. Card reveal triggers
    const cards = document.querySelectorAll(".system-card, .tech-card");
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { rootMargin: "0px 0px -10% 0px" });

    cards.forEach(card => {
        card.style.opacity = 0;
        card.style.transform = "translateY(30px)";
        card.style.transition = "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.6s ease";
        cardObserver.observe(card);
    });
}

/* ==========================================================================
   CONTACT FORM CLI TERMINAL ACTION
   ========================================================================== */
function initContactForm() {
    const form = document.getElementById("contact-form");
    const logBox = document.getElementById("contact-form-logs");
    
    if (!form || !logBox) return;
    
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Rate Limit Check (60 seconds cooldown)
        const lastSubmit = localStorage.getItem("portfolio_contact_rate_limit");
        const cooldown = 60; // seconds
        if (lastSubmit) {
            const timePassed = Math.floor((Date.now() - parseInt(lastSubmit)) / 1000);
            if (timePassed < cooldown) {
                logBox.innerHTML = "";
                const limitLine = document.createElement("div");
                limitLine.className = "contact-log-line error";
                limitLine.innerText = `> ERROR: Rate limit active. Cooldown remaining: ${cooldown - timePassed}s. Please wait before transmitting another data packet.`;
                logBox.appendChild(limitLine);
                return;
            }
        }
        
        const name = document.getElementById("form-name").value;
        const email = document.getElementById("form-email").value;
        const msg = document.getElementById("form-message").value;
        
        logBox.innerHTML = "";
        form.style.pointerEvents = "none";
        form.style.opacity = 0.5;
        
        const steps = [
            `> Initializing mail exchange socket... [OK]`,
            `> Performing verification handshake... [OK]`,
            `> Encrypting and compressing payload packet... [OK]`,
            `> Forwarding telemetry packet to osamakhassawneh23@gmail.com... [PENDING]`
        ];
        
        let i = 0;
        const printInterval = setInterval(() => {
            if (i < steps.length) {
                const line = document.createElement("div");
                line.className = "contact-log-line";
                line.innerText = steps[i];
                logBox.appendChild(line);
                i++;
            } else {
                clearInterval(printInterval);
                
                // Perform real POST transmission to FormSubmit AJAX
                fetch("https://formsubmit.co/ajax/osamakhassawneh23@gmail.com", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        Name: name,
                        Email: email,
                        Message: msg
                    })
                })
                .then(response => {
                    if (response.ok) {
                        // Initialize rate limit timestamp
                        localStorage.setItem("portfolio_contact_rate_limit", Date.now().toString());
                        
                        const successLine = document.createElement("div");
                        successLine.className = "contact-log-line success";
                        successLine.innerText = `> SUCCESS: SMTP payload delivered. Telemetry packet logged in inbox.`;
                        logBox.appendChild(successLine);
                        form.reset();
                    } else {
                        throw new Error(`Server returned code: ${response.status}`);
                    }
                })
                .catch(error => {
                    const errLine = document.createElement("div");
                    errLine.className = "contact-log-line error";
                    errLine.innerText = `> ERROR: Transmission failed. ${error.message}. Try again.`;
                    logBox.appendChild(errLine);
                })
                .finally(() => {
                    form.style.pointerEvents = "auto";
                    form.style.opacity = 1;
                });
            }
        }, 300);
    });
}
