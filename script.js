const APP_SIGN_IN_URL =
  typeof MEDULLAHR_CONFIG !== "undefined" && MEDULLAHR_CONFIG.signInUrl
    ? MEDULLAHR_CONFIG.signInUrl
    : "https://app.medullahr.com";

const CONTACT_EMAIL =
  typeof MEDULLAHR_CONFIG !== "undefined" && MEDULLAHR_CONFIG.contactEmail
    ? MEDULLAHR_CONFIG.contactEmail
    : "hello@medullahr.com";

// The full size widget is 300px wide, which will not fit in the demo
// dialog on a small phone. This runs before the Turnstile script is
// fetched, so the attribute is in place by the time the widget is drawn.
(function sizeChallengeForScreen() {
  const widget = document.getElementById("mh-demo-turnstile");
  if (widget && window.innerWidth < 400) {
    widget.setAttribute("data-size", "compact");
  }
})();

// Turnstile calls this by name when the widget cannot run: a bad site key,
// a domain it does not cover, or a network it cannot reach. Treat it the
// same as the script never loading and let the visitor email us instead.
window.mhChallengeUnavailable = function mhChallengeUnavailable() {
  window.MEDULLAHR_CHALLENGE_BROKEN = true;
};

(function initMedullaHR() {
  const reducedMotionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  const prefersReducedMotion = () =>
    Boolean(reducedMotionQuery && reducedMotionQuery.matches);

  // 1. Bind all Sign-In links to the single configured URL
  document.querySelectorAll("[data-signin-link]").forEach((link) => {
    link.setAttribute("href", APP_SIGN_IN_URL);
  });

  // 2. Header scroll state & Mobile navigation drawer
  const header = document.querySelector(".mh-header");
  const burger = document.querySelector(".mh-burger");
  const drawerLinks = document.querySelectorAll(".mh-drawer a, .mh-drawer button");

  const updateHeaderScroll = () => {
    if (!header) return;
    header.dataset.scrolled = window.scrollY > 16 ? "true" : "false";
  };
  updateHeaderScroll();
  window.addEventListener("scroll", updateHeaderScroll, { passive: true });

  if (burger && header) {
    const setDrawer = (open) => {
      header.dataset.open = open ? "true" : "false";
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    };

    burger.addEventListener("click", () => {
      const isOpen = header.dataset.open === "true";
      setDrawer(!isOpen);
    });

    drawerLinks.forEach((el) => {
      el.addEventListener("click", () => setDrawer(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.dataset.open === "true") {
        setDrawer(false);
        burger.focus();
      }
    });

    document.addEventListener("pointerdown", (e) => {
      if (header.dataset.open === "true" && !header.contains(e.target)) {
        setDrawer(false);
      }
    });
  }

  // 3. Scroll-reveal observer (.mh-rv)
  const revealElements = document.querySelectorAll(".mh-rv");
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    revealElements.forEach((el) => {
      el.dataset.rv = "1";
    });
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.dataset.rv = "1";
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px" }
    );

    revealElements.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.96) {
        el.dataset.rv = "1";
      } else {
        el.dataset.rv = "0";
        revealObserver.observe(el);
      }
    });
  }

  // 4. Serene Daylight Long-Exposure Ribbon Canvas (Hero & CTA)
  function attachDaylightCanvas(canvas, seedOffset) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = false;
    let rafId = 0;
    let time = seedOffset * 4.2;
    let lastTick = performance.now();
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame();
    };

    const drawFrame = () => {
      if (width < 2 || height < 2) return;
      ctx.clearRect(0, 0, width, height);

      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, "#E4F1EA");
      baseGrad.addColorStop(0.55, "#D6EAE0");
      baseGrad.addColorStop(1, "#C3E0D2");
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      const glowX = width * (0.52 + ptr.x * 0.14);
      const glowY = height * (0.45 + ptr.y * 0.14);
      const radGrad = ctx.createRadialGradient(
        glowX,
        glowY,
        10,
        glowX,
        glowY,
        Math.max(width, height) * 0.65
      );
      radGrad.addColorStop(0, "rgba(255, 255, 255, 0.72)");
      radGrad.addColorStop(0.5, "rgba(228, 241, 234, 0.35)");
      radGrad.addColorStop(1, "rgba(47, 102, 82, 0.0)");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const baseY = height * (0.26 + i * 0.17);
        const amp = 18 + i * 7;
        const freq = 0.0032 + i * 0.0007;
        const speed = time * (0.35 + i * 0.08) + i * 1.6;

        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 24) {
          const wave1 = Math.sin(x * freq + speed + ptr.x * 0.8) * amp;
          const wave2 =
            Math.cos(x * (freq * 1.7) - speed * 0.7 + i) * (amp * 0.45);
          const y = baseY + wave1 + wave2 + ptr.y * 12;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const alpha = 0.055 + i * 0.022;
        ctx.fillStyle = `rgba(47, 102, 82, ${alpha})`;
        ctx.fill();
      }
    };

    const tick = (now) => {
      rafId = 0;
      if (!visible) return;
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;

      ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 4);
      ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 4);

      if (!prefersReducedMotion()) {
        time += dt;
        drawFrame();
        rafId = requestAnimationFrame(tick);
      } else {
        drawFrame();
      }
    };

    const startLoop = () => {
      if (!rafId && visible) {
        lastTick = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) startLoop();
        },
        { rootMargin: "100px" }
      );
      io.observe(parent);
    } else {
      visible = true;
      startLoop();
    }

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(resize);
      ro.observe(parent);
    } else {
      window.addEventListener("resize", resize);
    }

    parent.addEventListener("pointermove", (e) => {
      const r = parent.getBoundingClientRect();
      ptr.tx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      ptr.ty = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
      startLoop();
    });

    parent.addEventListener("pointerleave", () => {
      ptr.tx = 0;
      ptr.ty = 0;
    });

    resize();
  }

  attachDaylightCanvas(document.getElementById("mh-hero-canvas"), 1);
  attachDaylightCanvas(document.getElementById("mh-cta-canvas"), 3);

  // 5. Interactive Hero Mini-Chips
  document.querySelectorAll(".mh-mini-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const isOn = chip.dataset.active === "true";
      chip.dataset.active = isOn ? "false" : "true";
      chip.setAttribute("aria-pressed", isOn ? "false" : "true");
    });
  });

  // 6. Modules list, shown on request
  // Both panels start closed on every visit. Nothing is remembered between
  // visits on purpose, so the page always opens at its shortest.
  const moduleCards = Array.from(document.querySelectorAll(".mh-module-card"));
  const modulePanel = document.getElementById("mh-modules-panel");
  const moduleToggles = Array.from(
    document.querySelectorAll("[data-module-view]")
  );

  // Core starter set: Org Chart (0), Employee Onboarding (2), Attendance &
  // Leave (3), Payroll & Benefits (4), HR Admin & Documents (9), HR
  // Compliance Reminders (10)
  const coreIndices = [0, 2, 3, 4, 9, 10];
  let openModuleView = "";

  const showModuleView = (view) => {
    openModuleView = view;
    moduleToggles.forEach((btn) => {
      const isOpen = Boolean(view) && btn.dataset.moduleView === view;
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    if (!modulePanel) return;

    if (!view) {
      modulePanel.hidden = true;
      return;
    }

    moduleCards.forEach((card, index) => {
      card.hidden = view === "core" && !coreIndices.includes(index);
    });
    modulePanel.hidden = false;
  };

  moduleToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.moduleView;
      showModuleView(openModuleView === view ? "" : view);
    });
  });

  moduleCards.forEach((card) => {
    card.addEventListener("click", () => {
      const current = card.getAttribute("aria-pressed") === "true";
      card.setAttribute("aria-pressed", current ? "false" : "true");
      const statusText = card.querySelector(".mh-module-state-text");
      if (statusText) {
        statusText.textContent = current ? "Switch on" : "Switched on";
      }
    });
  });

  showModuleView("");

  // 7. Interactive 3-Step Process ("How it works")
  const stepData = [
    {
      num: "Step 01",
      title: "We set up your company",
      lead: "We configure your UAE company profile, working week, leave policies, and the exact HR modules you want switched on.",
      desc: "No complex setup screens or blank templates to figure out on your own. Your account arrives structured around how your business actually operates.",
      checks: [
        "Company structure & departments",
        "UAE leave & public holiday rules",
        "Only the modules you need switched on"
      ],
      visualTitle: "Company Configuration",
      visualBadge: "Ready",
      rows: [
        ["Working week & leave policy", "Configured"],
        ["Active HR modules", "Switched on"],
        ["Document expiry alerts", "Enabled"]
      ]
    },
    {
      num: "Step 02",
      title: "You add your staff",
      lead: "Bring your people in from your existing spreadsheet or add them directly into one clean employee directory.",
      desc: "Names, roles, reporting lines, visa and Emirates ID expiry dates, and salary details finally live in one organised record instead of scattered files.",
      checks: [
        "Import from your existing sheet",
        "Org chart built automatically",
        "Visa & contract dates tracked"
      ],
      visualTitle: "Staff Directory Sync",
      visualBadge: "Organised",
      rows: [
        ["Employee profiles & roles", "Imported"],
        ["Reporting lines & Org Chart", "Mapped"],
        ["Passport, Visa & Emirates ID dates", "Tracked"]
      ]
    },
    {
      num: "Step 03",
      title: "Your staff sign in",
      lead: "Every employee gets their own clean login to request leave, check balances, view payslips, and access documents.",
      desc: "No more chat messages asking how many leave days are left or emails chasing salary certificates. Managers approve requests in one click.",
      checks: [
        "Self-service staff portal",
        "One-click manager approvals",
        "Instant access on mobile or desktop"
      ],
      visualTitle: "Employee Portal Access",
      visualBadge: "Live",
      rows: [
        ["Staff self-service sign-in", "Active"],
        ["Leave requests & approvals", "Online"],
        ["Payslips & HR documents", "Self-serve"]
      ]
    }
  ];

  const stepButtons = Array.from(document.querySelectorAll(".mh-step"));
  const procNum = document.getElementById("mh-proc-num");
  const procLead = document.getElementById("mh-proc-lead");
  const procDesc = document.getElementById("mh-proc-desc");
  const procChecks = document.getElementById("mh-proc-checks");
  const procVisTitle = document.getElementById("mh-proc-vis-title");
  const procVisBadge = document.getElementById("mh-proc-vis-badge");
  const procVisRows = document.getElementById("mh-proc-vis-rows");
  const procSection = document.getElementById("how-it-works");

  let activeStep = 0;
  let autoCycleSteps = true;
  let stepSectionVisible = false;
  let stepInterval = 0;

  const renderStep = (index) => {
    activeStep = index;
    const data = stepData[index];
    if (!data) return;

    stepButtons.forEach((btn, idx) => {
      const isCurrent = idx === index;
      btn.dataset.on = isCurrent ? "true" : "false";
      btn.setAttribute("aria-pressed", isCurrent ? "true" : "false");
      const barFill = btn.querySelector(".mh-step-bar i");
      if (barFill) {
        const shouldAnimate =
          isCurrent && autoCycleSteps && stepSectionVisible && !prefersReducedMotion();
        barFill.dataset.run = "false";
        if (shouldAnimate) {
          void barFill.offsetWidth;
          barFill.dataset.run = "true";
        }
      }
    });

    if (procNum) procNum.textContent = `${data.num} — ${data.title}`;
    if (procLead) procLead.textContent = data.lead;
    if (procDesc) procDesc.textContent = data.desc;

    if (procChecks) {
      procChecks.innerHTML = data.checks
        .map(
          (item) =>
            `<li><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7"/></svg>${item}</li>`
        )
        .join("");
    }

    if (procVisTitle) procVisTitle.textContent = data.visualTitle;
    if (procVisBadge) procVisBadge.textContent = data.visualBadge;
    if (procVisRows) {
      procVisRows.innerHTML = data.rows
        .map(
          ([label, status]) =>
            `<div class="mh-proc-row"><span>${label}</span><span>${status}</span></div>`
        )
        .join("");
    }
  };

  const resetStepTimer = () => {
    if (stepInterval) window.clearInterval(stepInterval);
    if (!autoCycleSteps || !stepSectionVisible || prefersReducedMotion()) return;
    stepInterval = window.setInterval(() => {
      renderStep((activeStep + 1) % stepData.length);
    }, 5200);
  };

  stepButtons.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      autoCycleSteps = false;
      if (stepInterval) window.clearInterval(stepInterval);
      renderStep(idx);
    });
  });

  if (procSection && typeof IntersectionObserver !== "undefined") {
    const procObserver = new IntersectionObserver(
      ([entry]) => {
        stepSectionVisible = entry.isIntersecting;
        renderStep(activeStep);
        resetStepTimer();
      },
      { threshold: 0.25 }
    );
    procObserver.observe(procSection);
  }

  renderStep(0);

  // 8. Interactive "For staff" Split Panel
  const staffData = [
    {
      title: "Ask for leave",
      badge: "Attendance and Leave",
      cardTitle: "New Leave Request",
      cardStatus: "Instant balance check",
      fields: [
        ["Leave type", "Annual Leave"],
        ["Available balance", "Remaining days shown live"],
        ["Dates selected", "Mon 12 Nov – Fri 16 Nov"],
        ["Approval routing", "Sent directly to line manager"]
      ],
      points: [
        "Staff see their exact leave balance before submitting a request",
        "Managers get a clean notification and approve with one click",
        "Approved dates update the team calendar automatically"
      ]
    },
    {
      title: "See payslips",
      badge: "Payroll and Benefits",
      cardTitle: "Monthly Payslip Statement",
      cardStatus: "Ready to view & download",
      fields: [
        ["Pay period", "Current & past monthly statements"],
        ["Breakdown", "Basic salary, housing & allowances"],
        ["Adjustments", "Approved expenses & deductions"],
        ["Format", "View online or download clean PDF"]
      ],
      points: [
        "Every monthly payslip is stored securely in the employee's account",
        "Clear breakdown of basic pay, housing, transport, and allowances",
        "No more emailing individual PDFs or answering payroll queries in chat"
      ]
    },
    {
      title: "View documents",
      badge: "HR Admin and Documents",
      cardTitle: "Personal HR Document Vault",
      cardStatus: "Always up to date",
      fields: [
        ["Employment records", "Offer letter & employment contract"],
        ["UAE ID & Visa", "Passport, Residency Visa & Emirates ID copies"],
        ["Company policies", "Employee handbook & leave policy"],
        ["Expiry reminders", "Automatic alerts before renewal dates"]
      ],
      points: [
        "Staff can access their contract, visa copy, and company policies anytime",
        "Expiry dates for passports, visas, and Emirates IDs are tracked in one place",
        "HR and staff receive timely reminders well before a document expires"
      ]
    }
  ];

  const staffTabs = Array.from(document.querySelectorAll(".mh-staff-tab"));
  const staffTabList = document.querySelector(".mh-staff-tabs");
  const staffPanel = document.getElementById("mh-staff-panel");
  const staffStageCard = document.getElementById("mh-staff-card-container");
  const staffPointsList = document.getElementById("mh-staff-points");

  let activeStaffTab = 0;

  const renderStaffTab = (index, focusTab = false) => {
    activeStaffTab = index;
    const item = staffData[index];
    if (!item) return;

    staffTabs.forEach((tab, idx) => {
      const selected = idx === index;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.setAttribute("tabindex", selected ? "0" : "-1");
      if (selected && focusTab) tab.focus();
    });

    if (staffPanel) {
      staffPanel.setAttribute("aria-label", item.title);
    }

    if (staffStageCard) {
      staffStageCard.innerHTML = `
        <div class="mh-staff-card">
          <div class="mh-staff-card-head">
            <div>
              <span class="mh-pill" style="height:24px;padding:0 10px;font-size:12px;margin-bottom:6px;">${item.badge}</span>
              <strong>${item.cardTitle}</strong>
            </div>
            <span class="mh-status-pill">${item.cardStatus}</span>
          </div>
          <div class="mh-staff-card-rows">
            ${item.fields
              .map(
                ([k, v]) => `
              <div class="mh-staff-kv">
                <span>${k}</span>
                <b>${v}</b>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    if (staffPointsList) {
      staffPointsList.innerHTML = item.points
        .map(
          (pt) => `
          <li>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <circle cx="8" cy="2.6" r="1.5"></circle>
              <circle cx="13.4" cy="8" r="1.5"></circle>
              <circle cx="8" cy="13.4" r="1.5"></circle>
              <circle cx="2.6" cy="8" r="1.5"></circle>
              <circle cx="8" cy="8" r="1.2"></circle>
            </svg>
            <span>${pt}</span>
          </li>
        `
        )
        .join("");
    }
  };

  staffTabs.forEach((tab, idx) => {
    tab.addEventListener("click", () => renderStaffTab(idx, false));
  });

  if (staffTabList) {
    staffTabList.addEventListener("keydown", (e) => {
      const dir =
        e.key === "ArrowDown" || e.key === "ArrowRight"
          ? 1
          : e.key === "ArrowUp" || e.key === "ArrowLeft"
            ? -1
            : 0;
      if (!dir) return;
      e.preventDefault();
      const next = (activeStaffTab + dir + staffData.length) % staffData.length;
      renderStaffTab(next, true);
    });
  }

  renderStaffTab(0, false);

  // 9. Native <dialog> Demo Modal with Light-Dismiss Fallback
  const demoDialog = document.getElementById("mh-demo-dialog");
  const demoTriggers = document.querySelectorAll("[data-open-demo]");
  const demoForm = document.getElementById("mh-demo-form");
  const demoFormView = document.getElementById("mh-demo-form-view");
  const demoDoneView = document.getElementById("mh-demo-done-view");
  const demoDoneText = document.getElementById("mh-demo-done-text");
  const demoDoneClose = document.getElementById("mh-demo-done-close");

  if (demoDialog) {
    demoTriggers.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (demoFormView && demoDoneView) {
          demoFormView.hidden = false;
          demoDoneView.hidden = true;
          // The inline style keeps the panel down even for a visitor
          // holding an old copy of the stylesheet.
          demoDoneView.style.display = "none";
        }
        const reopenMailto = document.getElementById("mh-demo-mailto-fallback");
        if (reopenMailto) {
          reopenMailto.hidden = false;
        }
        const reopenChallengeErr = document.getElementById("mh-err-turnstile");
        if (reopenChallengeErr) {
          reopenChallengeErr.textContent = "";
        }
        demoDialog.showModal();
      });
    });

    // Mandatory fallback for browsers without native <dialog closedby="any"> support
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      demoDialog.addEventListener("click", (event) => {
        if (event.target !== demoDialog) return;
        const rect = demoDialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        demoDialog.close();
      });
    }

    demoDialog.addEventListener("close", () => {
      demoDialog.returnValue = "";
    });

    if (demoDoneClose) {
      demoDoneClose.addEventListener("click", () => {
        demoDialog.close();
      });
    }

    // The free text box only appears once somebody asks for it. Both the
    // hidden attribute and the inline style come off together, so the
    // field stays down even with an old stylesheet.
    const otherToggle = document.getElementById("mh-demo-task-other");
    const otherWrap = document.getElementById("mh-demo-other-wrap");
    const otherInput = document.getElementById("mh-demo-other");

    if (otherToggle && otherWrap) {
      otherToggle.addEventListener("change", () => {
        const wanted = otherToggle.checked;
        otherToggle.setAttribute("aria-expanded", wanted ? "true" : "false");
        otherWrap.hidden = !wanted;
        otherWrap.style.display = wanted ? "" : "none";
        if (wanted && otherInput) {
          otherInput.focus();
        }
        if (!wanted && otherInput) {
          otherInput.value = "";
        }
      });
    }

    if (demoForm) {
      demoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("mh-demo-name");
        const emailInput = document.getElementById("mh-demo-email");
        const companyInput = document.getElementById("mh-demo-company");
        const sizeInput = document.getElementById("mh-demo-size");
        const trapInput = document.getElementById("mh-demo-website");

        const nameErr = document.getElementById("mh-err-name");
        const emailErr = document.getElementById("mh-err-email");

        const nameVal = nameInput ? nameInput.value.trim() : "";
        const emailVal = emailInput ? emailInput.value.trim() : "";
        const companyVal = companyInput ? companyInput.value.trim() : "";
        const sizeVal = sizeInput ? sizeInput.value : "";
        // "Other" is the flag for the free text box, not a task in itself,
        // so it is left out of the list that gets sent.
        const taskBoxes = [
          ...demoForm.querySelectorAll('input[name="tasks"]')
        ].filter((box) => box.checked && box.value !== "Other");
        // The official module name travels to the server; the wording the
        // visitor actually read goes into the email app fallback.
        const taskVals = taskBoxes.map((box) => box.value);
        const taskLabels = taskBoxes.map((box) => {
          const text = box.parentElement
            ? box.parentElement.querySelector("span")
            : null;
          const wording = text ? text.textContent.trim() : "";
          return wording && wording !== box.value
            ? `${wording} (${box.value})`
            : box.value;
        });
        const otherVal =
          otherToggle && otherToggle.checked && otherInput
            ? otherInput.value.trim()
            : "";

        let hasError = false;
        if (!nameVal) {
          hasError = true;
          if (nameInput) nameInput.setAttribute("aria-invalid", "true");
          if (nameErr) nameErr.textContent = "Please enter your name.";
        } else {
          if (nameInput) nameInput.setAttribute("aria-invalid", "false");
          if (nameErr) nameErr.textContent = "";
        }

        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal);
        if (!emailValid) {
          hasError = true;
          if (emailInput) emailInput.setAttribute("aria-invalid", "true");
          if (emailErr) emailErr.textContent = "Please enter a valid work email.";
        } else {
          if (emailInput) emailInput.setAttribute("aria-invalid", "false");
          if (emailErr) emailErr.textContent = "";
        }

        if (hasError) return;

        const subject = encodeURIComponent(
          `MedullaHR Demo Request${companyVal ? " — " + companyVal : ""}`
        );
        const bodyLines = [
          `Name: ${nameVal}`,
          `Work email: ${emailVal}`,
          companyVal ? `Company: ${companyVal}` : null,
          sizeVal ? `Team size: ${sizeVal}` : null,
          taskLabels.length
            ? `\nLooking to simplify:\n${taskLabels.map((t) => `- ${t}`).join("\n")}`
            : null,
          otherVal
            ? `${taskLabels.length ? "" : "\n"}- Something else: ${otherVal}`
            : null
        ]
          .filter(Boolean)
          .join("\n");

        const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;
        const mailtoLink = document.getElementById("mh-demo-mailto-fallback");
        if (mailtoLink) {
          mailtoLink.setAttribute("href", mailtoHref);
        }

        const submitBtn = demoForm.querySelector('button[type="submit"]');
        const submitLabel = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending…";
        }

        // Show the done view either way; the mailto button is only offered
        // when the request did not reach us.
        const doneHeading = demoDoneView
          ? demoDoneView.querySelector("h2")
          : null;

        const showDone = (sent) => {
          if (doneHeading) {
            doneHeading.textContent = sent
              ? "Request sent"
              : "Demo request ready";
          }
          if (demoDoneText) {
            demoDoneText.textContent = sent
              ? `Thank you, ${nameVal}. Your request is with our team and we will reply to ${emailVal} shortly.`
              : `Thank you, ${nameVal}. Your demo request details are ready for ${CONTACT_EMAIL}.`;
          }
          if (mailtoLink) {
            mailtoLink.hidden = sent;
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
          }
          if (demoFormView && demoDoneView) {
            demoFormView.hidden = true;
            demoDoneView.hidden = false;
            demoDoneView.style.display = "";
          }
        };

        const resetChallenge = () => {
          if (window.turnstile) {
            try {
              window.turnstile.reset("#mh-demo-turnstile");
            } catch (err) {
              /* the widget was never rendered */
            }
          }
        };

        const tokenField = demoForm.querySelector(
          'input[name="cf-turnstile-response"]'
        );
        const token = tokenField ? tokenField.value : "";
        const challengeErr = document.getElementById("mh-err-turnstile");

        // An ad blocker, a blocked network or a widget that refuses to run
        // can stop the check working. That is not the visitor's fault, so
        // hand them the email route rather than a dead end.
        if (
          !window.turnstile ||
          !tokenField ||
          window.MEDULLAHR_CHALLENGE_BROKEN
        ) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
          }
          showDone(false);
          return;
        }

        if (!token) {
          if (challengeErr) {
            challengeErr.textContent =
              "Please complete the check below to confirm you are human.";
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
          }
          return;
        }

        if (challengeErr) {
          challengeErr.textContent = "";
        }

        fetch("/api/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameVal,
            email: emailVal,
            company: companyVal,
            size: sizeVal,
            tasks: taskVals,
            other: otherVal,
            contact_preference_note: trapInput ? trapInput.value : "",
            turnstileToken: token
          })
        })
          .then((res) =>
            res
              .json()
              .catch(() => ({}))
              .then((body) => {
                resetChallenge();

                // A rejected check is worth a second try rather than a dead
                // end. Any other refusal falls back to the email route.
                if (!res.ok && body.reason === "human_check_failed") {
                  if (challengeErr) {
                    challengeErr.textContent =
                      "That check did not pass. Please try once more.";
                  }
                  if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitLabel;
                  }
                  return;
                }

                showDone(res.ok);
              })
          )
          .catch(() => {
            resetChallenge();
            showDone(false);
          });
      });
    }
  }
})();

