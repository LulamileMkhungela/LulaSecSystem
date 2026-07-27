/* =========================================================
   LulaSecSystem — Data Layer
   In-memory mock database for the demo
   ========================================================= */

window.LulaDB = (function () {
  'use strict';

  // ---------- USERS / ROLES ----------
  const users = [
    {
      id: 'u1', email: 'admin@lulasecsystem.com', password: 'Demo1234!',
      name: 'Sarah Adeyemi', role: 'admin', avatar: 'SA',
      title: 'Chief Security Officer', site: 'All Sites',
      phone: '+27 11 555 0100', color: 'linear-gradient(135deg, #ef4444, #f59e0b)'
    },
    {
      id: 'u2', email: 'officer@lulasecsystem.com', password: 'Demo1234!',
      name: 'James Molefe', role: 'officer', avatar: 'JM',
      title: 'Security Operations Manager', site: 'Sandton HQ',
      phone: '+27 11 555 0101', color: 'linear-gradient(135deg, #0ea5e9, #6366f1)'
    },
    {
      id: 'u3', email: 'guard@lulasecsystem.com', password: 'Demo1234!',
      name: 'Thabo Ndlovu', role: 'guard', avatar: 'TN',
      title: 'Senior Security Guard', site: 'Sandton HQ — Night Shift',
      phone: '+27 11 555 0102', color: 'linear-gradient(135deg, #22c55e, #10b981)'
    },
    {
      id: 'u4', email: 'resident@lulasecsystem.com', password: 'Demo1234!',
      name: 'Lerato Khumalo', role: 'resident', avatar: 'LK',
      title: 'Resident — Unit 1204', site: 'Sandton Heights Estate',
      phone: '+27 11 555 0103', color: 'linear-gradient(135deg, #f59e0b, #ec4899)'
    },
    {
      id: 'u5', email: 'visitor@lulasecsystem.com', password: 'Demo1234!',
      name: 'Michael Chen', role: 'visitor', avatar: 'MC',
      title: 'Visitor — Pre-registered', site: 'Sandton HQ',
      phone: '+27 11 555 0104', color: 'linear-gradient(135deg, #8b5cf6, #6366f1)'
    }
  ];

  // ---------- ROLE DEFINITIONS ----------
  const roles = {
    admin: {
      label: 'Administrator',
      description: 'Full system access — manage users, sites, policies & analytics',
      color: 'linear-gradient(135deg, #ef4444, #f59e0b)',
      nav: [
        { section: 'OVERVIEW' },
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'live-map', label: 'Live Map', icon: '🗺️' },
        { section: 'OPERATIONS' },
        { id: 'incidents', label: 'Incidents', icon: '🚨', badge: 3 },
        { id: 'guards', label: 'Guards & Patrols', icon: '👮' },
        { id: 'visitors', label: 'Visitors', icon: '🪪' },
        { id: 'cameras', label: 'Cameras', icon: '📹' },
        { section: 'SYSTEM' },
        { id: 'access', label: 'Access Control', icon: '🔐' },
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'users', label: 'User Management', icon: '👥' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
      ]
    },
    officer: {
      label: 'Security Officer',
      description: 'Operational command — incidents, dispatch, oversight',
      color: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
      nav: [
        { section: 'OPERATIONS' },
        { id: 'dashboard', label: 'Command Center', icon: '🎯' },
        { id: 'live-map', label: 'Live Map', icon: '🗺️' },
        { id: 'incidents', label: 'Incidents', icon: '🚨', badge: 3 },
        { id: 'guards', label: 'Guard Force', icon: '👮' },
        { id: 'visitors', label: 'Visitors', icon: '🪪' },
        { id: 'cameras', label: 'Cameras', icon: '📹' },
        { section: 'INTEL' },
        { id: 'analytics', label: 'Reports', icon: '📈' },
        { id: 'dispatch', label: 'Dispatch', icon: '📡' }
      ]
    },
    guard: {
      label: 'Security Guard',
      description: 'Field operations — patrols, reports, panic',
      color: 'linear-gradient(135deg, #22c55e, #10b981)',
      nav: [
        { section: 'MY SHIFT' },
        { id: 'dashboard', label: 'My Dashboard', icon: '🏠' },
        { id: 'patrol', label: 'My Patrol', icon: '🚶' },
        { id: 'incidents', label: 'Report Incident', icon: '🚨' },
        { id: 'visitors', label: 'Visitor Check-in', icon: '🪪' },
        { section: 'TOOLS' },
        { id: 'communications', label: 'Communications', icon: '📞' },
        { id: 'training', label: 'Training', icon: '🎓' }
      ]
    },
    resident: {
      label: 'Resident',
      description: 'Community member — report, request access, stay informed',
      color: 'linear-gradient(135deg, #f59e0b, #ec4899)',
      nav: [
        { section: 'HOME' },
        { id: 'dashboard', label: 'My Home', icon: '🏠' },
        { id: 'visitors', label: 'Pre-Register Guest', icon: '🪪' },
        { id: 'incidents', label: 'Report Issue', icon: '🚨' },
        { section: 'COMMUNITY' },
        { id: 'community', label: 'Community Watch', icon: '👥' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'profile', label: 'My Profile', icon: '👤' }
      ]
    },
    visitor: {
      label: 'Visitor',
      description: 'Pre-registered guest with limited access',
      color: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      nav: [
        { section: 'VISIT' },
        { id: 'dashboard', label: 'My Visit', icon: '🎫' },
        { id: 'profile', label: 'My Pass', icon: '🪪' }
      ]
    }
  };

  // ---------- SITES ----------
  const sites = [
    { id: 's1', name: 'Sandton HQ', code: 'HQ', guards: 12, cameras: 48, status: 'secure' },
    { id: 's2', name: 'Cape Town Office', code: 'CT', guards: 8, cameras: 32, status: 'secure' },
    { id: 's3', name: 'Durban Warehouse', code: 'DBN', guards: 6, cameras: 24, status: 'alert' },
    { id: 's4', name: 'Sandton Heights Estate', code: 'SH', guards: 10, cameras: 64, status: 'secure' },
    { id: 's5', name: 'Pretoria Logistics Hub', code: 'PTA', guards: 5, cameras: 18, status: 'secure' }
  ];

  // ---------- INCIDENTS ----------
  const incidents = [
    {
      id: 'INC-2401', title: 'Unauthorized access attempt — Server Room B',
      type: 'Access Violation', severity: 'high', status: 'in-progress',
      site: 'Sandton HQ', zone: 'Floor 4 — Server Room B',
      reportedBy: 'Camera AI (CAM-04B)', assignedTo: 'Guard T. Ndlovu',
      reportedAt: '2026-07-25T08:42:00', updatedAt: '2026-07-25T08:58:00',
      description: 'AI motion detection flagged an individual attempting to bypass card reader at 08:42. Individual wore a hoodie, attempted to use multiple cards. Local guard dispatched.',
      threatScore: 87, evidence: ['cam-clip-04B-0842.mp4', 'card-log-attempt.txt']
    },
    {
      id: 'INC-2402', title: 'Suspicious package left in lobby',
      type: 'Suspicious Activity', severity: 'medium', status: 'open',
      site: 'Sandton HQ', zone: 'Main Lobby',
      reportedBy: 'Visitor M. Patel', assignedTo: 'Officer J. Molefe',
      reportedAt: '2026-07-25T09:15:00', updatedAt: '2026-07-25T09:15:00',
      description: 'Unattended backpack left near reception for over 30 minutes. Owner has been identified, K9 unit requested as precaution.',
      threatScore: 62, evidence: ['lobby-cam-0915.jpg']
    },
    {
      id: 'INC-2403', title: 'Slip and fall — Parking Level 2',
      type: 'Medical / Safety', severity: 'medium', status: 'open',
      site: 'Sandton HQ', zone: 'Parking P2',
      reportedBy: 'Camera AI (CAM-12)', assignedTo: 'Unassigned',
      reportedAt: '2026-07-25T09:32:00', updatedAt: '2026-07-25T09:32:00',
      description: 'AI detected person on ground for >60s without movement. Medical assistance dispatched.',
      threatScore: 34, evidence: ['cam-clip-12-0932.mp4']
    },
    {
      id: 'INC-2404', title: 'Perimeter fence breach — North side',
      type: 'Perimeter Breach', severity: 'high', status: 'in-progress',
      site: 'Durban Warehouse', zone: 'North Perimeter',
      reportedBy: 'Fence Sensor F-N12', assignedTo: 'Guard S. Dlamini',
      reportedAt: '2026-07-25T07:58:00', updatedAt: '2026-07-25T08:30:00',
      description: 'Vibration sensor triggered. Drone deployed for visual confirmation. Possible animal crossing or intrusion.',
      threatScore: 78, evidence: ['drone-footage-0801.mp4']
    },
    {
      id: 'INC-2405', title: 'Verbal dispute in cafeteria',
      type: 'Dispute', severity: 'low', status: 'resolved',
      site: 'Sandton HQ', zone: 'Cafeteria',
      reportedBy: 'Guard P. van der Merwe', assignedTo: 'Guard P. van der Merwe',
      reportedAt: '2026-07-25T07:15:00', updatedAt: '2026-07-25T07:45:00',
      description: 'Two employees in heated verbal argument. De-escalated, both parties counseled. No physical contact.',
      threatScore: 22, evidence: ['cafeteria-cam-0715.mp4']
    },
    {
      id: 'INC-2406', title: 'Power outage — Backup activated',
      type: 'Infrastructure', severity: 'medium', status: 'resolved',
      site: 'Cape Town Office', zone: 'Building-wide',
      reportedBy: 'System Alert', assignedTo: 'Facilities',
      reportedAt: '2026-07-25T06:30:00', updatedAt: '2026-07-25T06:55:00',
      description: 'Main power lost for 25 minutes. UPS and generator took over. All security systems remained operational.',
      threatScore: 18, evidence: ['power-log-0630.txt']
    },
    {
      id: 'INC-2407', title: 'Tailgating at Main Entrance',
      type: 'Access Violation', severity: 'low', status: 'closed',
      site: 'Sandton HQ', zone: 'Main Entrance',
      reportedBy: 'AI Access Control', assignedTo: 'Reception',
      reportedAt: '2026-07-25T07:45:00', updatedAt: '2026-07-25T08:10:00',
      description: 'Two individuals entered on a single badge scan. Reception notified, both verified as employees.',
      threatScore: 28, evidence: ['entry-cam-0745.jpg']
    },
    {
      id: 'INC-2408', title: 'Vehicle parked in no-parking zone',
      type: 'Parking Violation', severity: 'low', status: 'open',
      site: 'Sandton HQ', zone: 'Loading Bay',
      reportedBy: 'Guard T. Ndlovu', assignedTo: 'Unassigned',
      reportedAt: '2026-07-25T10:05:00', updatedAt: '2026-07-25T10:05:00',
      description: 'White sedan (GP 123-456) parked in emergency lane. Owner being traced via ANPR.',
      threatScore: 15, evidence: ['plate-capture-1005.jpg']
    }
  ];

  // ---------- GUARDS ----------
  const guards = [
    { id: 'g1', name: 'Thabo Ndlovu', badge: 'GRD-001', site: 'Sandton HQ', shift: 'Night (20:00-06:00)', status: 'on-duty', lastCheckIn: '2026-07-25T08:00:00', location: 'Floor 4', phone: '+27 11 555 0102', rating: 4.9, patrol: 92 },
    { id: 'g2', name: 'Sarah van der Merwe', badge: 'GRD-002', site: 'Sandton HQ', shift: 'Day (06:00-14:00)', status: 'on-duty', lastCheckIn: '2026-07-25T06:00:00', location: 'Main Lobby', phone: '+27 11 555 0105', rating: 4.7, patrol: 88 },
    { id: 'g3', name: 'Sipho Dlamini', badge: 'GRD-003', site: 'Durban Warehouse', shift: 'Night (20:00-06:00)', status: 'on-duty', lastCheckIn: '2026-07-25T08:00:00', location: 'North Perimeter', phone: '+27 31 555 0106', rating: 4.8, patrol: 95 },
    { id: 'g4', name: 'Patricia Molefe', badge: 'GRD-004', site: 'Sandton HQ', shift: 'Day (06:00-14:00)', status: 'on-break', lastCheckIn: '2026-07-25T06:00:00', location: 'Break Room', phone: '+27 11 555 0107', rating: 4.6, patrol: 81 },
    { id: 'g5', name: 'Jason Pillay', badge: 'GRD-005', site: 'Cape Town Office', shift: 'Evening (14:00-22:00)', status: 'on-duty', lastCheckIn: '2026-07-25T14:00:00', location: 'Patrol Route C', phone: '+27 21 555 0108', rating: 4.5, patrol: 79 },
    { id: 'g6', name: 'Naledi Khumalo', badge: 'GRD-006', site: 'Sandton Heights', shift: 'Day (06:00-14:00)', status: 'on-duty', lastCheckIn: '2026-07-25T06:00:00', location: 'Gate 2', phone: '+27 11 555 0109', rating: 4.9, patrol: 96 },
    { id: 'g7', name: 'Andre Botha', badge: 'GRD-007', site: 'Sandton HQ', shift: 'Evening (14:00-22:00)', status: 'off-duty', lastCheckIn: '2026-07-24T22:00:00', location: '—', phone: '+27 11 555 0110', rating: 4.4, patrol: 75 },
    { id: 'g8', name: 'Zanele Mthembu', badge: 'GRD-008', site: 'Pretoria Hub', shift: 'Night (20:00-06:00)', status: 'on-duty', lastCheckIn: '2026-07-25T08:00:00', location: 'Loading Bay', phone: '+27 12 555 0111', rating: 4.7, patrol: 89 }
  ];

  // ---------- VISITORS ----------
  const visitors = [
    { id: 'v1', name: 'Michael Chen', company: 'Acme Corp', host: 'Sarah Adeyemi', site: 'Sandton HQ', purpose: 'Business Meeting', checkIn: '2026-07-25T09:00:00', checkOut: null, status: 'checked-in', passCode: 'VST-A4821', idType: 'SA ID', idNumber: '9001015000088', vehicle: 'GP 234-567' },
    { id: 'v2', name: 'Priya Patel', company: 'TechFlow Ltd', host: 'James Molefe', site: 'Sandton HQ', purpose: 'Vendor Demo', checkIn: '2026-07-25T08:30:00', checkOut: null, status: 'checked-in', passCode: 'VST-A4822', idType: 'Passport', idNumber: 'P12345678', vehicle: '—' },
    { id: 'v3', name: 'David O\'Connor', company: 'Legal Associates', host: 'Lerato Khumalo', site: 'Sandton Heights', purpose: 'Personal Visit', checkIn: '2026-07-25T10:15:00', checkOut: null, status: 'pre-registered', passCode: 'VST-A4823', idType: 'SA ID', idNumber: '8505125000089', vehicle: 'GP 456-789' },
    { id: 'v4', name: 'Linda Naidoo', company: '—', host: 'Resident Patel (Unit 805)', site: 'Sandton Heights', purpose: 'Family Visit', checkIn: '2026-07-25T07:30:00', checkOut: '2026-07-25T11:45:00', status: 'checked-out', passCode: 'VST-A4820', idType: 'SA ID', idNumber: '9206225000090', vehicle: 'GP 789-012' },
    { id: 'v5', name: 'Brian Williams', company: 'FedEx', host: 'Reception', site: 'Sandton HQ', purpose: 'Delivery', checkIn: '2026-07-25T08:00:00', checkOut: '2026-07-25T08:25:00', status: 'checked-out', passCode: 'VST-A4818', idType: 'Driver License', idNumber: 'DL-4567890', vehicle: 'TRUCK-001' },
    { id: 'v6', name: 'Anika van Wyk', company: 'Media House', host: 'PR Department', site: 'Sandton HQ', purpose: 'Press Tour', checkIn: '2026-07-25T11:00:00', checkOut: null, status: 'pre-registered', passCode: 'VST-A4824', idType: 'SA ID', idNumber: '8803155000091', vehicle: '—' }
  ];

  // ---------- CAMERAS ----------
  const cameras = [
    { id: 'cam1', name: 'Main Entrance', site: 'Sandton HQ', zone: 'Ground Floor', status: 'online', ai: true, recording: true, alerts: 0 },
    { id: 'cam2', name: 'Lobby Reception', site: 'Sandton HQ', zone: 'Ground Floor', status: 'online', ai: true, recording: true, alerts: 1 },
    { id: 'cam3', name: 'Server Room A', site: 'Sandton HQ', zone: 'Floor 4', status: 'online', ai: true, recording: true, alerts: 0 },
    { id: 'cam4', name: 'Server Room B', site: 'Sandton HQ', zone: 'Floor 4', status: 'online', ai: true, recording: true, alerts: 2 },
    { id: 'cam5', name: 'Parking P1', site: 'Sandton HQ', zone: 'Basement', status: 'online', ai: true, recording: true, alerts: 0 },
    { id: 'cam6', name: 'Parking P2', site: 'Sandton HQ', zone: 'Basement', status: 'online', ai: true, recording: true, alerts: 1 },
    { id: 'cam7', name: 'Cafeteria', site: 'Sandton HQ', zone: 'Floor 2', status: 'online', ai: true, recording: true, alerts: 0 },
    { id: 'cam8', name: 'North Perimeter', site: 'Durban Warehouse', zone: 'Perimeter', status: 'online', ai: true, recording: true, alerts: 1 },
    { id: 'cam9', name: 'Loading Bay', site: 'Durban Warehouse', zone: 'Exterior', status: 'online', ai: true, recording: true, alerts: 0 },
    { id: 'cam10', name: 'Main Gate', site: 'Sandton Heights', zone: 'Entry', status: 'online', ai: true, recording: true, alerts: 0 },
    { id: 'cam11', name: 'Pool Area', site: 'Sandton Heights', zone: 'Amenity', status: 'offline', ai: false, recording: false, alerts: 0 },
    { id: 'cam12', name: 'Gym', site: 'Sandton Heights', zone: 'Amenity', status: 'online', ai: true, recording: true, alerts: 0 }
  ];

  // ---------- ACCESS CONTROL ----------
  const accessPoints = [
    { id: 'a1', name: 'Main Entrance', type: 'Door', site: 'Sandton HQ', status: 'unlocked', lastAccess: '2026-07-25T10:14:00', users: 145, mode: 'Card + Biometric' },
    { id: 'a2', name: 'Server Room A', type: 'Door', site: 'Sandton HQ', status: 'locked', lastAccess: '2026-07-25T07:30:00', users: 8, mode: 'Card + Biometric + PIN' },
    { id: 'a3', name: 'Server Room B', type: 'Door', site: 'Sandton HQ', status: 'locked', lastAccess: '2026-07-25T08:42:00', users: 8, mode: 'Card + Biometric + PIN' },
    { id: 'a4', name: 'Executive Floor', type: 'Door', site: 'Sandton HQ', status: 'locked', lastAccess: '2026-07-25T09:15:00', users: 24, mode: 'Card + Biometric' },
    { id: 'a5', name: 'Parking Gate', type: 'Vehicle Gate', site: 'Sandton HQ', status: 'unlocked', lastAccess: '2026-07-25T10:13:00', users: 200, mode: 'ANPR + Card' },
    { id: 'a6', name: 'Main Gate (Estate)', type: 'Vehicle Gate', site: 'Sandton Heights', status: 'unlocked', lastAccess: '2026-07-25T10:14:00', users: 320, mode: 'ANPR + Intercom' },
    { id: 'a7', name: 'Pool Area', type: 'Door', site: 'Sandton Heights', status: 'locked', lastAccess: '2026-07-25T08:00:00', users: 120, mode: 'Card' },
    { id: 'a8', name: 'Loading Bay', type: 'Vehicle Gate', site: 'Durban Warehouse', status: 'unlocked', lastAccess: '2026-07-25T09:45:00', users: 24, mode: 'ANPR' }
  ];

  // ---------- NOTIFICATIONS ----------
  const notifications = [
    { id: 'n1', type: 'danger',  title: 'High-severity incident', text: 'INC-2404: Perimeter breach detected at Durban Warehouse', time: '2 min ago', unread: true, icon: '🚨' },
    { id: 'n2', type: 'warning', title: 'AI alert', text: 'CAM-04B flagged unauthorized access attempt', time: '8 min ago', unread: true, icon: '🤖' },
    { id: 'n3', type: 'info',    title: 'New visitor', text: 'Michael Chen checked in at Main Entrance', time: '15 min ago', unread: true, icon: '🪪' },
    { id: 'n4', type: 'success', title: 'Patrol complete', text: 'Guard T. Ndlovu completed route Bravo (12 checkpoints)', time: '32 min ago', unread: false, icon: '✅' },
    { id: 'n5', type: 'warning', title: 'Camera offline', text: 'CAM-11 (Pool Area) lost connection', time: '1 hr ago', unread: false, icon: '📹' },
    { id: 'n6', type: 'info',    title: 'Shift change', text: 'Night shift taking over at Sandton HQ in 30 minutes', time: '2 hrs ago', unread: false, icon: '🔄' }
  ];

  // ---------- ANALYTICS DATA ----------
  const analytics = {
    incidentTrend: [
      { day: 'Mon', value: 12 }, { day: 'Tue', value: 8 }, { day: 'Wed', value: 15 },
      { day: 'Thu', value: 11 }, { day: 'Fri', value: 18 }, { day: 'Sat', value: 6 }, { day: 'Sun', value: 4 }
    ],
    byType: [
      { type: 'Access Violation', count: 24, color: '#ef4444' },
      { type: 'Suspicious Activity', count: 18, color: '#f59e0b' },
      { type: 'Perimeter Breach', count: 8, color: '#dc2626' },
      { type: 'Medical / Safety', count: 12, color: '#0ea5e9' },
      { type: 'Dispute', count: 15, color: '#8b5cf6' },
      { type: 'Infrastructure', count: 6, color: '#22c55e' }
    ],
    responseTimes: [
      { month: 'Jan', value: 42 }, { month: 'Feb', value: 38 }, { month: 'Mar', value: 35 },
      { month: 'Apr', value: 31 }, { month: 'May', value: 28 }, { month: 'Jun', value: 25 }, { month: 'Jul', value: 22 }
    ]
  };

  // ---------- COMMUNITY WATCH (residents) ----------
  const communityPosts = [
    { id: 'cw1', author: 'Naledi K.', unit: '1208', time: '2 hrs ago', text: 'Heads up — saw a suspicious vehicle circling the estate last night around 3 AM. Grey sedan, no plates visible. Reporting to security.', likes: 12, comments: 4, type: 'warning' },
    { id: 'cw2', author: 'Ahmed M.', unit: '305', time: '5 hrs ago', text: 'New package delivery protocol seems to be working well. Driver was verified at the gate within 2 minutes 👍', likes: 8, comments: 2, type: 'positive' },
    { id: 'cw3', author: 'Priya S.', unit: '2104', time: '1 day ago', text: 'Reminder: Estate meeting this Saturday at 10 AM in the clubhouse. Snacks provided!', likes: 24, comments: 11, type: 'info' },
    { id: 'cw4', author: 'Security Team', unit: '—', time: '1 day ago', text: 'Drill scheduled: Fire evacuation practice on Wednesday 30th at 2 PM. Please review emergency exit routes.', likes: 45, comments: 8, type: 'info' }
  ];

  // ---------- PUBLIC API ----------
  return {
    users, roles, sites, incidents, guards, visitors, cameras,
    accessPoints, notifications, analytics, communityPosts,

    // Helpers
    getUserByEmail(email) {
      return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    getRole(roleId) {
      return roles[roleId];
    },
    getOpenIncidents() {
      return incidents.filter(i => i.status === 'open' || i.status === 'in-progress');
    },
    getOnDutyGuards() {
      return guards.filter(g => g.status === 'on-duty' || g.status === 'on-break');
    },
    getActiveVisitors() {
      return visitors.filter(v => v.status === 'checked-in' || v.status === 'pre-registered');
    },
    getOnlineCameras() {
      return cameras.filter(c => c.status === 'online');
    },
    // Add / update operations
    addIncident(incident) {
      const id = 'INC-' + (2400 + incidents.length + 1);
      const newInc = { id, status: 'open', reportedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...incident };
      incidents.unshift(newInc);
      return newInc;
    },
    updateIncident(id, updates) {
      const inc = incidents.find(i => i.id === id);
      if (inc) Object.assign(inc, { ...updates, updatedAt: new Date().toISOString() });
      return inc;
    },
    addVisitor(visitor) {
      const id = 'v' + (visitors.length + 1);
      const passCode = 'VST-A' + (4825 + visitors.length);
      const newV = { id, status: 'pre-registered', checkIn: null, checkOut: null, passCode, ...visitor };
      visitors.unshift(newV);
      return newV;
    },
    addNotification(notif) {
      const n = { id: 'n' + (notifications.length + 1), unread: true, time: 'Just now', type: 'info', ...notif };
      notifications.unshift(n);
      return n;
    }
  };
})();
