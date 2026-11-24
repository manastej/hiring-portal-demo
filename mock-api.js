// mock-api.js - Global Network Interceptor & Client-side API Simulation for Portfolio Demo
(function () {
  const STORAGE_KEY = 'MANASTEJ_PORTFOLIO_STORE_V1';

  function getStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed reading demo store, re-seeding.', e);
    }
    const fresh = JSON.parse(JSON.stringify(window.MOCK_SEED_DATA || {}));
    saveStore(fresh);
    return fresh;
  }

  function saveStore(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed saving demo store.', e);
    }
  }

  window.resetDemoData = function () {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('manastej_employee');
    localStorage.removeItem('ms_shift_state');
    location.reload();
  };

  window.switchDemoRole = function (role) {
    const store = getStore();
    store.currentRole = role;
    if (role === 'intern') {
      store.currentUser = {
        employee_id: 'EMP-005',
        full_name: 'Aakash Patel',
        role: 'AI & ML Engineer Intern',
        portal_role: 'intern',
        portal_role_label: 'Intern',
        department: 'Engineering',
        email: 'aakash.patel@manastej.com',
        joining_date: '2026-11-01',
        status: 'Active',
        can_view_pipeline: false,
        permissions: ['attendance.own', 'employees.directory', 'leave.apply', 'tasks.view_own', 'tasks.update_own']
      };
    } else if (role === 'hr_manager') {
      store.currentUser = {
        employee_id: 'EMP-003',
        full_name: 'Disha Sen',
        role: 'HR Operations Lead',
        portal_role: 'hr_manager',
        portal_role_label: 'HR Manager',
        department: 'Human Resources',
        email: 'disha.sen@manastej.com',
        joining_date: '2026-09-01',
        status: 'Active',
        can_view_pipeline: true,
        permissions: [
          'applicants.view_full', 'applicants.view_summary', 'applicants.decide', 'pipeline.operate',
          'employees.directory', 'employees.manage', 'tasks.view_own', 'tasks.view_all',
          'attendance.own', 'attendance.view_all', 'leave.apply', 'leave.review'
        ]
      };
    } else {
      store.currentUser = JSON.parse(JSON.stringify(window.MOCK_SEED_DATA.currentUser));
      store.currentRole = 'tech_lead';
    }
    saveStore(store);
    try {
      localStorage.setItem('manastej_employee', JSON.stringify(store.currentUser));
    } catch (e) {}
    location.reload();
  };

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function textResponse(text, contentType = 'text/html', status = 200) {
    return new Response(text, {
      status: status,
      headers: { 'Content-Type': contentType }
    });
  }

  // Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (resource, init = {}) {
    const urlStr = typeof resource === 'string' ? resource : (resource ? resource.url : '');
    if (!urlStr || (!urlStr.startsWith('/api/') && !urlStr.includes('/api/'))) {
      return originalFetch.apply(this, arguments);
    }

    const url = new URL(urlStr, window.location.origin);
    const path = url.pathname;
    const query = Object.fromEntries(url.searchParams.entries());
    let body = {};
    if (init && init.body && typeof init.body === 'string') {
      try { body = JSON.parse(init.body); } catch (e) {}
    }

    const store = getStore();

    // 1. Session & Auth
    if (path === '/api/auth/session' || path === '/api/auth/me') {
      return jsonResponse({
        success: true,
        employee: store.currentUser,
        role: store.currentUser.portal_role,
        permissions: store.currentUser.permissions || [],
        auth: { method: 'mock_demo_session' }
      });
    }

    // 2. Main Database Ingestion
    if (path === '/api/data') {
      return jsonResponse({
        psych: store.psych,
        tech: store.tech,
        marketing: store.marketing,
        hr: store.hr,
        employees: store.employees,
        workforce_overview: store.employees,
        workforce_summary: {
          total_staff: store.employees.length,
          working_now: 2,
          on_leave: 1,
          open_shifts: 4
        },
        tasks: store.tasks
      });
    }

    // 3. Candidates endpoint
    if (path === '/api/candidates') {
      const pipeline = (query.pipeline || 'tech').toLowerCase();
      let list = store.tech;
      if (pipeline.includes('mkt') || pipeline.includes('marketing')) list = store.marketing;
      else if (pipeline.includes('hr')) list = store.hr;
      else if (pipeline.includes('psych')) list = store.psych;

      if (query.status && query.status !== 'All') {
        list = list.filter(c => (c.Status || '').toLowerCase() === query.status.toLowerCase());
      }
      return jsonResponse({
        success: true,
        count: list.length,
        candidates: list
      });
    }

    // 4. Candidate Summary
    if (path === '/api/candidate/summary') {
      const name = query.name || 'Candidate';
      return jsonResponse({
        success: true,
        summary: `AI Evaluation for ${name}: Strong technical competencies observed. Scored high on architectural understanding and rapid problem resolution. Recommended for team onboarding.`,
        strengths: ['Modern JavaScript / Python Frameworks', 'System Architecture & Clean Coding', 'Responsive UI & API Design'],
        gaps: ['Requires familiarity with company internal production toolchains']
      });
    }

    // 5. Update Status
    if (path === '/api/update_status' || path === '/api/update_candidate' || path === '/api/update_candidate_stage') {
      const name = body.name || query.name;
      const newStatus = body.status || query.status || 'Under Review';
      ['tech', 'marketing', 'hr', 'psych'].forEach(pipe => {
        store[pipe].forEach(cand => {
          if (cand['Full Name'] === name) {
            cand.Status = newStatus;
          }
        });
      });
      saveStore(store);
      return jsonResponse({ success: true, message: `Status updated to "${newStatus}" for ${name}.` });
    }

    // 6. Employee My Desk (Shift Station, Tasks, Logs)
    if (path === '/api/employee/my_desk') {
      return jsonResponse({
        success: true,
        employee: store.currentUser,
        shift_active: store.recent_logs[0]?.Status === 'Working Remote',
        shift: {
          active: store.recent_logs[0]?.Status === 'Working Remote',
          started_at: store.recent_logs[0]?.['Clock In'] || '10:00:15 AM',
          mode: store.recent_logs[0]?.Mode || 'Remote / WFH',
          focus: store.recent_logs[0]?.Focus || 'Portfolio ATS engineering'
        },
        tasks: store.tasks.filter(t => t['Employee ID'] === store.currentUser.employee_id),
        recent_logs: store.recent_logs,
        recent_leaves: store.recent_leaves,
        summary: {
          total_shifts: store.recent_logs.length + 3,
          approved_leaves: store.recent_leaves.filter(l => l.Status === 'Approved').length
        }
      });
    }

    // 7. Clock In
    if (path === '/api/employee/clock_in') {
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog = {
        Date: new Date().toISOString().split('T')[0],
        Mode: body.mode || 'Remote / WFH',
        "Clock In": nowStr,
        "Clock Out": "--:--:--",
        Duration: "Active (In Progress)",
        Status: "Working Remote",
        Focus: body.notes || 'Development & Sprint Tasks'
      };
      store.recent_logs.unshift(newLog);
      saveStore(store);
      return jsonResponse({
        success: true,
        message: 'Shift started successfully.',
        shift: newLog
      });
    }

    // 8. Clock Out
    if (path === '/api/employee/clock_out') {
      if (store.recent_logs.length && store.recent_logs[0].Status === 'Working Remote') {
        store.recent_logs[0]["Clock Out"] = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        store.recent_logs[0].Status = 'Completed';
        store.recent_logs[0].Duration = '8h 15m';
      }
      saveStore(store);
      return jsonResponse({ success: true, message: 'Shift ended successfully.' });
    }

    // 9. Leave Requests
    if (path === '/api/employee/apply_leave' || path === '/api/employee/leave/apply') {
      const newLeave = {
        "Leave ID": "LV-" + Math.floor(100 + Math.random() * 900),
        "Employee ID": store.currentUser.employee_id,
        "Full Name": store.currentUser.full_name,
        Type: body.type || 'Casual Leave',
        "Start Date": body.start_date || new Date().toISOString().split('T')[0],
        "End Date": body.end_date || new Date().toISOString().split('T')[0],
        Days: 1,
        Reason: body.reason || 'Personal leave request',
        Status: 'Pending Review',
        "Reviewed By": 'HR Operations'
      };
      store.recent_leaves.unshift(newLeave);
      saveStore(store);
      return jsonResponse({ success: true, message: 'Leave application submitted.' });
    }

    // 10. Admin Counts
    if (path === '/api/admin/attendance_summary' || path === '/api/attendance/summary_counts') {
      return jsonResponse({
        success: true,
        active_shifts: 2,
        today_completed: 6,
        pending_leaves: store.recent_leaves.filter(l => l.Status.includes('Pending')).length
      });
    }

    if (path === '/api/signed_offers/count' || path === '/api/list_signed_offers') {
      return jsonResponse({ success: true, count: 5, offers: ['Arjun_Sharma_offerletter.pdf', 'Priya_Nair_offerletter.pdf'] });
    }

    if (path === '/api/signed_ndas/count' || path === '/api/signed_ndas') {
      return jsonResponse({ success: true, count: 4, ndas: ['Arjun_Sharma_NDA.pdf'] });
    }

    // 11. Standalone Offer Letter & NDA Generation / Dispatch
    if (path === '/api/generate_standalone_offer_letter' || path === '/api/extend_offer') {
      const candName = body.full_name || body.name || 'Candidate';
      const candEmail = body.email || 'candidate@example.com';
      const role = body.position || body.role || 'Full Stack Developer Intern';
      const docType = body.doc_type || 'both';

      // Record in tech roster if not already there
      const existing = store.tech.find(c => c['Full Name'].toLowerCase() === candName.toLowerCase());
      if (existing) {
        existing.Status = 'Offer Extended';
        existing['Email Status'] = 'Sent';
      } else {
        store.tech.unshift({
          "Rank": store.tech.length + 1,
          "Full Name": candName,
          "Email": candEmail,
          "Phone Number": body.phone || "+91 98000 00000",
          "Position": role,
          "Fit Score": 92,
          "Years of Experience": 1.0,
          "Top Skills": role.includes('AI') ? "Python, PyTorch, LangChain, FastAPI" : "React, TypeScript, Node.js, Next.js",
          "Evaluation Summary": "Directly added via Standalone Document Generator.",
          "Status": "Offer Extended",
          "Email Status": "Sent",
          "Score": 92.0
        });
      }
      saveStore(store);

      const safeBase = candName.replace(/\s+/g, '_');
      return jsonResponse({
        success: true,
        doc_type: docType,
        message: `Official document(s) generated and mock email dispatched to ${candEmail}!`,
        filename: `${safeBase}_offerletter.pdf`,
        pdf_filename: `${safeBase}_offerletter.pdf`,
        nda_filename: `${safeBase}_NDA.pdf`
      });
    }

    // 12. Preview Offer Letter
    if (path === '/api/preview_offer_letter') {
      const candName = query.name || 'Arjun Sharma';
      const position = query.position || 'Full Stack Developer Intern';
      const duration = query.duration || '4 months';
      const stipend = query.stipend || 'Performance-based';
      const date = query.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const equity = query.equity || '';

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Official Offer Letter - ${candName}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
  .sheet { max-width: 800px; margin: 0 auto 30px auto; background: white; padding: 40px 50px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #064e3b; padding-bottom: 15px; margin-bottom: 25px; }
  .brand h1 { font-size: 24px; color: #064e3b; margin: 0; }
  .brand p { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }
  .meta { text-align: right; font-size: 12px; color: #475569; }
  .title { text-align: center; font-size: 18px; font-weight: 700; color: #0f172a; margin: 25px 0; text-transform: uppercase; letter-spacing: 0.05em; }
  .section { margin-bottom: 20px; font-size: 13.5px; line-height: 1.6; }
  .terms-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
  .terms-table td { padding: 8px 12px; border: 1px solid #e2e8f0; }
  .terms-table td:first-child { font-weight: 700; width: 35%; background: #f8fafc; color: #334155; }
  .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; }
  .sig-block { width: 45%; }
  .sig-line { border-top: 1px solid #94a3b8; margin-top: 50px; padding-top: 8px; font-size: 12px; font-weight: 600; color: #334155; }
  .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-bottom: 10px; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <h1>MANASTEJ</h1>
        <p>Mental Health & Psychological Wellbeing Platform</p>
      </div>
      <div class="meta">
        <strong>Official Offer of Employment</strong><br>
        Date: ${date}<br>
        Ref: MNSTJ/OFFER/${new Date().getFullYear()}/042
      </div>
    </div>

    <div class="title">Letter of Appointment</div>

    <div class="section">
      Dear <strong>${candName}</strong>,<br><br>
      On behalf of <strong>Manastej</strong>, we are pleased to extend this formal offer of employment for the position of <strong>${position}</strong>. We were thoroughly impressed by your credentials, technical problem-solving acumen, and alignment with our mission.
    </div>

    <table class="terms-table">
      <tr><td>Position / Role</td><td><strong>${position}</strong></td></tr>
      <tr><td>Tenure / Duration</td><td>${duration}</td></tr>
      <tr><td>Stipend / Compensation</td><td>${stipend}</td></tr>
      ${equity ? `<tr><td>Equity Allocation</td><td>${equity}</td></tr>` : ''}
      <tr><td>Probation Period</td><td>2 Months</td></tr>
      <tr><td>Notice Period</td><td>15 Days</td></tr>
      <tr><td>Working Schedule</td><td>7:00 PM onwards with flexible project accountability</td></tr>
      <tr><td>Work Mode</td><td>Remote / Work From Home</td></tr>
    </table>

    <div class="section">
      This offer is subject to execution of the Mutual Confidentiality & Non-Disclosure Agreement (NDA). Please sign and return a copy within 3 business days.
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div style="font-size: 13px; font-weight: 700; color: #064e3b; margin-bottom: 5px;">MANASTEJ PRIVATE LIMITED</div>
        <img src="/assets/offer_letter/founder_signature_cropped.png" style="height: 40px;" alt="Signature" onerror="this.style.display='none'">
        <div class="sig-line">Daliya Chakraborty<br><span style="font-weight:400; color:#64748b;">Founder & CEO</span></div>
      </div>
      <div class="sig-block">
        <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 5px;">CANDIDATE ACCEPTANCE</div>
        <div class="sig-line">${candName}<br><span style="font-weight:400; color:#64748b;">Signature & Date</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;
      return textResponse(html);
    }

    // 13. Preview NDA
    if (path === '/api/preview_nda' || path === '/api/preview_nda_agreement') {
      const candName = query.name || 'Candidate';
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Mutual Non-Disclosure Agreement</title>
<style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;line-height:1.6;color:#1e293b;}</style>
</head>
<body>
  <h2 style="color:#064e3b;border-bottom:2px solid #064e3b;padding-bottom:10px;">MUTUAL CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT</h2>
  <p>This Non-Disclosure Agreement ("Agreement") is entered into by and between <strong>Manastej</strong> and <strong>${candName}</strong> ("Recipient").</p>
  <h3>1. Confidential Information</h3>
  <p>Includes all technical data, proprietary AI algorithms, patient interaction records, software codebases, and intellectual property.</p>
  <h3>2. Obligations</h3>
  <p>The recipient agrees to hold all confidential information in strict confidence and not disclose it to any third party.</p>
  <h3>3. Term</h3>
  <p>This agreement shall remain effective for a period of 2 years from the date of disclosure.</p>
  <div style="margin-top:60px;display:flex;justify-content:space-between;">
    <div><strong>For Manastej:</strong><br><br>Authorized Signatory</div>
    <div><strong>For Recipient (${candName}):</strong><br><br>Accepted & Agreed</div>
  </div>
</body>
</html>`;
      return textResponse(html);
    }

    // 14. Document Download (Mock Offer Letter PDF)
    if (path === '/api/download_offer') {
      const filename = query.filename || 'Offer_Letter.html';
      const mockDoc = `<html><body><h2>Manastej Official Document: ${filename}</h2><p>This document was generated in portfolio interactive mode.</p></body></html>`;
      return new Response(mockDoc, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // Fallback for any other /api/* calls
    return jsonResponse({ success: true, message: 'Mock response from demo engine.' });
  };

  console.log('✨ [Portfolio Mode] Manastej Mock API Layer Initialized.');
})();
