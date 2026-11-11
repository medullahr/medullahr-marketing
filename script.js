const APP_SIGN_IN_URL =
  typeof MEDULLAHR_CONFIG !== "undefined" && MEDULLAHR_CONFIG.signInUrl
    ? MEDULLAHR_CONFIG.signInUrl
    : "https://app.medullahr.com";

const CONTACT_EMAIL =
  typeof MEDULLAHR_CONFIG !== "undefined" && MEDULLAHR_CONFIG.contactEmail
    ? MEDULLAHR_CONFIG.contactEmail
    : "hello@medullahr.com";

// The full size widget is 300px wide, which will not fit in the contact
// form card on a small phone. This runs before the Turnstile script is
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
    const drawer = header.querySelector(".mh-drawer");

    // While the drawer is open it is the only thing worth reaching, so
    // focus moves into it, stays inside it, and comes back to the button
    // that opened it.
    const focusables = () =>
      drawer
        ? Array.from(drawer.querySelectorAll("a[href], button:not([disabled])"))
        : [];

    const setDrawer = (open, returnFocus) => {
      header.dataset.open = open ? "true" : "false";
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        const first = focusables()[0];
        if (first) first.focus();
      } else if (returnFocus) {
        burger.focus();
      }
    };

    burger.addEventListener("click", () => {
      const isOpen = header.dataset.open === "true";
      setDrawer(!isOpen, isOpen);
    });

    drawerLinks.forEach((el) => {
      el.addEventListener("click", () => setDrawer(false, false));
    });

    document.addEventListener("keydown", (e) => {
      if (header.dataset.open !== "true") return;

      if (e.key === "Escape") {
        setDrawer(false, true);
        return;
      }

      if (e.key !== "Tab") return;

      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !drawer.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("pointerdown", (e) => {
      if (header.dataset.open === "true" && !header.contains(e.target)) {
        setDrawer(false, false);
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

  // 4. Modules list, shown on request
  // Both panels start closed on every visit. Nothing is remembered between
  // visits on purpose, so the page always opens at its shortest.
  const moduleCards = Array.from(document.querySelectorAll(".mh-module-card"));
  const modulePanel = document.getElementById("mh-modules-panel");
  const moduleToggles = Array.from(
    document.querySelectorAll("[data-module-view]")
  );

  // Core starter set: Org Chart (0), Employee Onboarding (2), Attendance &
  // Leave (3), Payroll & Benefits (4), HR Files and Docs (9), HR
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

  // The label says whether a module is part of the core set, so it stays put
  // while the switch itself moves.
  moduleCards.forEach((card) => {
    card.addEventListener("click", () => {
      const current = card.getAttribute("aria-pressed") === "true";
      card.setAttribute("aria-pressed", current ? "false" : "true");
    });
  });

  showModuleView("");

  // 6b. "Read more" on the problem cards
  // Every card starts closed on each visit. Nothing is remembered.
  Array.from(document.querySelectorAll(".mh-readmore")).forEach((btn) => {
    const target = document.getElementById(btn.getAttribute("aria-controls"));
    const label = btn.querySelector(".mh-readmore-label");
    if (!target) return;

    target.hidden = true;
    btn.setAttribute("aria-expanded", "false");

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      target.hidden = isOpen;
      if (label) label.textContent = isOpen ? "Read more" : "Show less";
    });
  });

  // 5. Interactive 3-Step Process ("How it works")
  const stepData = [
    {
      num: "Step 01",
      title: "We set up your company",
      lead: "We configure your company profile, working week, leave policies, and the exact HR modules you want switched on.",
      desc: "Nothing to figure out on your own. Your account arrives ready to use.",
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
      lead: "Bring your people in from your existing spreadsheet or add them one by one.",
      desc: "Names, roles, reporting lines and visa dates end up in one organised record.",
      visualTitle: "Staff Directory Sync",
      visualBadge: "Organised",
      rows: [
        ["Org Chart & Reporting lines", "Mapped"],
        ["Employee profiles & roles", "Imported"],
        ["Passport, Visa & Emirates ID dates", "Tracked"]
      ]
    },
    {
      num: "Step 03",
      title: "Your staff sign in",
      lead: "Each employee gets their own login to request leave, check balances, view payslips and find documents.",
      desc: "Managers and HR approve in one click, on mobile or desktop.",
      visualTitle: "Employee Portal Access",
      visualBadge: "Live",
      rows: [
        ["Staff sign-in", "Active"],
        ["Leave requests & approvals", "Online"],
        ["Payslips & HR documents", "Available anytime"]
      ]
    }
  ];

  const stepButtons = Array.from(document.querySelectorAll(".mh-step"));
  const procNum = document.getElementById("mh-proc-num");
  const procLead = document.getElementById("mh-proc-lead");
  const procDesc = document.getElementById("mh-proc-desc");
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

    if (procNum) procNum.textContent = `${data.num}. ${data.title}`;
    if (procLead) procLead.textContent = data.lead;
    if (procDesc) procDesc.textContent = data.desc;

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

  // 6. Interactive "For staff" Split Panel
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
      badge: "HR Files and Docs",
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

  // 7. Demo request form
  // The form lives on the About page now, so every page without it skips
  // this block.
  const demoForm = document.getElementById("mh-demo-form");
  const demoFormView = document.getElementById("mh-demo-form-view");
  const demoDoneView = document.getElementById("mh-demo-done-view");
  const demoDoneText = document.getElementById("mh-demo-done-text");

  // How many digits each dialling code expects, without the country code
  // and without the trunk zero. The same table runs on the server.
  const MOBILE_RULES = {
    "+971": { digits: 9, startsWith: "5" },
    "+966": { digits: 9 },
    "+968": { digits: 8 },
    "+973": { digits: 8 },
    "+974": { digits: 8 },
    "+965": { digits: 8 },
    "+20": { digits: 10 },
    "+91": { digits: 10 },
    "+92": { digits: 10 },
    "+63": { digits: 10 },
    "+234": { digits: 10 },
    "+44": { digits: 10 },
    "+1": { digits: 10 }
  };

  const MOBILE_ERROR = "Enter a valid mobile number for the selected country.";

  const dialInput = document.getElementById("mh-demo-dial");
  const mobileInput = document.getElementById("mh-demo-mobile");
  const mobileErr = document.getElementById("mh-err-mobile");

  // Spaces, dashes, brackets and a leading trunk zero are all things people
  // type or paste out of a contact card. Take them off rather than refuse
  // the number.
  const tidyMobile = (value, rule) => {
    let digits = String(value || "").replace(/\D+/g, "");
    while (digits.charAt(0) === "0") {
      digits = digits.slice(1);
    }
    if (rule && digits.length > rule.digits) {
      digits = digits.slice(0, rule.digits);
    }
    return digits;
  };

  const mobileRuleFor = (code) => MOBILE_RULES[code] || null;

  const mobileIsValid = (code, digits) => {
    const rule = mobileRuleFor(code);
    if (!rule) return false;
    if (digits.length !== rule.digits) return false;
    if (rule.startsWith && digits.charAt(0) !== rule.startsWith) return false;
    return true;
  };

  const markMobile = (ok) => {
    if (mobileInput) {
      mobileInput.setAttribute("aria-invalid", ok ? "false" : "true");
    }
    if (mobileErr) {
      mobileErr.textContent = ok ? "" : MOBILE_ERROR;
    }
  };

  if (dialInput && mobileInput) {
    const applyRule = () => {
      const rule = mobileRuleFor(dialInput.value);
      if (rule) {
        mobileInput.setAttribute("maxlength", String(rule.digits));
      }
      mobileInput.value = tidyMobile(mobileInput.value, rule);
    };

    applyRule();

    // Typing and pasting both land here, so one handler covers the lot.
    mobileInput.addEventListener("input", () => {
      const rule = mobileRuleFor(dialInput.value);
      const tidied = tidyMobile(mobileInput.value, rule);
      if (tidied !== mobileInput.value) {
        const atEnd = mobileInput.selectionStart === mobileInput.value.length;
        mobileInput.value = tidied;
        if (atEnd) {
          mobileInput.setSelectionRange(tidied.length, tidied.length);
        }
      }
      // Clear a standing error as soon as the number becomes usable.
      if (mobileErr && mobileErr.textContent) {
        if (mobileIsValid(dialInput.value, tidied)) {
          markMobile(true);
        }
      }
    });

    // A new country means a new length, so the number is checked again.
    dialInput.addEventListener("change", () => {
      applyRule();
      if (mobileErr && mobileErr.textContent) {
        markMobile(mobileIsValid(dialInput.value, mobileInput.value));
      }
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

      const dialVal = dialInput ? dialInput.value : "";
      const mobileVal = mobileInput
        ? tidyMobile(mobileInput.value, mobileRuleFor(dialVal))
        : "";
      if (mobileInput) {
        mobileInput.value = mobileVal;
      }
      const mobileOk = mobileIsValid(dialVal, mobileVal);
      markMobile(mobileOk);
      if (!mobileOk) {
        hasError = true;
      }

      if (hasError) return;

      const subject = encodeURIComponent(
        `MedullaHR Demo Request${companyVal ? " for " + companyVal : ""}`
      );
      const bodyLines = [
        `Name: ${nameVal}`,
        `Work email: ${emailVal}`,
        `Mobile number: ${dialVal} ${mobileVal}`,
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
          dial: dialVal,
          mobile: mobileVal,
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
})();

