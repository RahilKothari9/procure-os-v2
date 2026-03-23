import { Conversation } from '@11labs/client';
import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

/* ─── Config ─── */
const AGENT_ID = import.meta.env.VITE_AGENT_ID;
const QUEUE_URL = import.meta.env.VITE_N8N_QUEUE_URL;
const IMPORT_URL = import.meta.env.VITE_N8N_IMPORT_URL;
const SAVE_URL = import.meta.env.VITE_N8N_SAVE_URL;
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const PHONE_NUMBER_ID = import.meta.env.VITE_ELEVENLABS_PHONE_NUMBER_ID;
const DEFAULT_EMAILS = import.meta.env.VITE_MAHINDRA_EMAIL_TO || 'mahindra-demo@procure-os.local';
const OUTBOUND_URL = 'https://api.elevenlabs.io/v1/convai/twilio/outbound-call';

/* ─── Data constants ─── */
const DEMO_ROWS = [
  { leadId: 'MHD-001', serialNo: '1', supplierName: 'Rane Brake Lining', pocName: 'Prakash Iyer', phone: '+919845632100', email: 'prakash.iyer@rfrictionmaterials.co.in', partNo: 'RBL-4412-CA', partDescription: 'Front calliper assy – XUV700', addValue: '300', currentCoverageDays: '2', qtyRequired: '800', qtyRequiredDate: '25-03-2026', qtyRequiredTime: '4:00 PM', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
  { leadId: 'MHD-002', serialNo: '2', supplierName: 'Sundaram Fasteners', pocName: 'Nitin Batra', phone: '+919811245678', email: 'nitin.batra@sundaramfasteners.co.in', partNo: 'SF-8821-MB', partDescription: 'Engine mount bracket – Thar', addValue: '120', currentCoverageDays: '4', qtyRequired: '450', qtyRequiredDate: '25-03-2026', qtyRequiredTime: '6:30 PM', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
  { leadId: 'MHD-003', serialNo: '3', supplierName: 'Brakes India Pvt Ltd', pocName: 'Arjun Menon', phone: '+918888551234', email: 'arjun.menon@brakesindia.co.in', partNo: 'BI-5510-DPK', partDescription: 'Disc pad kit – Scorpio N', addValue: '', currentCoverageDays: '5', qtyRequired: '1200', qtyRequiredDate: '26-03-2026', qtyRequiredTime: '', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
  { leadId: 'MHD-004', serialNo: '4', supplierName: 'Bharat Forge Ltd', pocName: 'Raghav Deshmukh', phone: '+919922003456', email: 'raghav.deshmukh@bharatforge.com', partNo: 'BF-7201-FAB', partDescription: 'Front axle beam forging – Bolero', addValue: '540', currentCoverageDays: '5', qtyRequired: '600', qtyRequiredDate: '24-03-2026', qtyRequiredTime: '2:00 PM', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
  { leadId: 'MHD-005', serialNo: '5', supplierName: 'Minda Industries', pocName: 'Kavitha Nair', phone: '+919876012345', email: 'kavitha.nair@maborominda.com', partNo: 'MI-3305-CSW', partDescription: 'Combination switch assy – XUV3XO', addValue: '85', currentCoverageDays: '8', qtyRequired: '2000', qtyRequiredDate: '27-03-2026', qtyRequiredTime: '', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
  { leadId: 'MHD-006', serialNo: '6', supplierName: 'Valeo India Pvt Ltd', pocName: 'Deepak Srinivasan', phone: '+919840056789', email: 'deepak.s@valeo.com', partNo: 'VA-6620-CLA', partDescription: 'Clutch assy 240mm – Marazzo', addValue: '210', currentCoverageDays: '3', qtyRequired: '500', qtyRequiredDate: '26-03-2026', qtyRequiredTime: '10:00 AM', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
  { leadId: 'MHD-007', serialNo: '7', supplierName: 'Bosch Ltd', pocName: 'Manish Kulkarni', phone: '+919880034567', email: 'manish.kulkarni@bosch.co.in', partNo: 'BO-1140-CRI', partDescription: 'Common rail injector – XUV700 diesel', addValue: '780', currentCoverageDays: '7', qtyRequired: '350', qtyRequiredDate: '25-03-2026', qtyRequiredTime: '12:00 PM', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
  { leadId: 'MHD-008', serialNo: '8', supplierName: 'Lumax Industries', pocName: 'Ankit Sharma', phone: '+919810078901', email: 'ankit.sharma@lumaxind.com', partNo: 'LX-2250-HLA', partDescription: 'Headlamp assy LED – Thar Roxx', addValue: '430', currentCoverageDays: '1', qtyRequired: '900', qtyRequiredDate: '24-03-2026', qtyRequiredTime: '3:00 PM', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
  { leadId: 'MHD-009', serialNo: '9', supplierName: 'Sona BLW Precision', pocName: 'Priya Venkatesh', phone: '+919900123456', email: 'priya.v@sonablw.com', partNo: 'SB-9010-DFG', partDescription: 'Differential gear set – Scorpio N 4WD', addValue: '620', currentCoverageDays: '6', qtyRequired: '400', qtyRequiredDate: '28-03-2026', qtyRequiredTime: '', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
  { leadId: 'MHD-010', serialNo: '10', supplierName: 'ZF Commercial Vehicles', pocName: 'Siddharth Rao', phone: '+919741098765', email: 'siddharth.rao@zf.com', partNo: 'ZF-4480-SGA', partDescription: 'Power steering gear assy – Bolero Neo', addValue: '390', currentCoverageDays: '4', qtyRequired: '550', qtyRequiredDate: '25-03-2026', qtyRequiredTime: '5:00 PM', qtyConfirmed: '', dateConfirmed: '', status: 'Untracked', reasonForDelay: '', vehicleDetails: '', driverDetails: '', emailRecipients: DEFAULT_EMAILS, lastUpdatedAt: '' },
];
const ALIASES = { serialNo: ['s no', 'serial no', 's. no'], leadId: ['lead id', 'lead_id', 'id'], supplierName: ['supplier', 'supplier name', 'vendor name'], pocName: ['poc', 'poc name', 'contact person'], phone: ['phone', 'phone number', 'mobile'], email: ['email', 'email id'], partNo: ['part no', 'part number', 'part no.'], partDescription: ['part description', 'description'], addValue: ['add', 'add optional'], currentCoverageDays: ['current coverage in days', 'coverage days', 'coverage'], qtyRequired: ['qty required', 'required qty'], qtyRequiredDate: ['qty required date', 'required date'], qtyRequiredTime: ['qty required time', 'required time'], qtyConfirmed: ['qty confirmed', 'confirmed qty'], dateConfirmed: ['date confirmed', 'confirmed date'], status: ['status'], reasonForDelay: ['reason for delay', 'delay reason'], vehicleDetails: ['vehicle details', 'vehicle'], driverDetails: ['driver details', 'driver'], emailRecipients: ['email recipients', 'notify emails'] };
const ALL_STATUSES = ['Untracked', 'Pending', 'Dispatched', 'Delayed'];
const FORM_STATUSES = ['Pending', 'Dispatched', 'Delayed'];
const statusClass = (s) => s === 'Delayed' ? 'pill-delayed' : s === 'Dispatched' ? 'pill-dispatched' : s === 'Untracked' ? 'pill-untracked' : 'pill-pending';

/* ─── Utilities ─── */
const clean = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const read = (row, keys) => Object.entries(row || {}).find(([key]) => keys.includes(clean(key)))?.[1]?.toString().trim() || '';
const stamp = () => new Date().toISOString();
const num = (v) => { const s = String(v || '').replace(/,/g, '').trim(); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; };
const parseDate = (v) => { const s = String(v || '').trim().replace(/\./g, '-').replace(/\//g, '-'); if (!s) return null; const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/); if (m) { const [, d, mo, y] = m; const dt = new Date(`${y.length === 2 ? `20${y}` : y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`); return Number.isNaN(dt.getTime()) ? null : dt; } const dt = new Date(s); return Number.isNaN(dt.getTime()) ? null : dt; };
const fmt = (v) => { if (!v) return 'Not synced'; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d); };
const risk = (row) => { const coverage = num(row.currentCoverageDays); const req = num(row.qtyRequired); const conf = num(row.qtyConfirmed); const reqDate = parseDate(row.qtyRequiredDate); const confDate = parseDate(row.dateConfirmed); if (String(row.status || '').toLowerCase() === 'delayed') return 'CRITICAL'; if (coverage !== null && coverage <= 2) return 'CRITICAL'; if (req !== null && conf !== null && conf < req) return 'CRITICAL'; if (reqDate && confDate && confDate > reqDate) return 'CRITICAL'; return 'LOW'; };
const normalize = (row, i) => { const data = { leadId: row.leadId || read(row, ALIASES.leadId) || row.lead_id || `MHD-${String(i + 1).padStart(3, '0')}`, serialNo: row.serialNo || read(row, ALIASES.serialNo) || String(i + 1), supplierName: row.supplierName || read(row, ALIASES.supplierName) || row.supplier_name || 'Mahindra Supplier', pocName: row.pocName || read(row, ALIASES.pocName) || row.poc_name || 'Supplier POC', phone: row.phone || read(row, ALIASES.phone) || '', email: row.email || read(row, ALIASES.email) || '', partNo: row.partNo || read(row, ALIASES.partNo) || row.part_no || '', partDescription: row.partDescription || read(row, ALIASES.partDescription) || row.part_description || row.item_1_name || '', addValue: row.addValue || read(row, ALIASES.addValue) || row.add || '', currentCoverageDays: row.currentCoverageDays || read(row, ALIASES.currentCoverageDays) || row.current_coverage_days || '', qtyRequired: row.qtyRequired || read(row, ALIASES.qtyRequired) || row.qty_required || row.item_1_qty || '', qtyRequiredDate: row.qtyRequiredDate || read(row, ALIASES.qtyRequiredDate) || row.qty_required_date || row.original_due_date || '', qtyRequiredTime: row.qtyRequiredTime || read(row, ALIASES.qtyRequiredTime) || row.qty_required_time || '', qtyConfirmed: row.qtyConfirmed || read(row, ALIASES.qtyConfirmed) || row.qty_confirmed || '', dateConfirmed: row.dateConfirmed || read(row, ALIASES.dateConfirmed) || row.date_confirmed || row.delivery_date || '', status: row.status || read(row, ALIASES.status) || '', reasonForDelay: row.reasonForDelay || read(row, ALIASES.reasonForDelay) || row.reason_for_delay || row.delay_reason || '', vehicleDetails: row.vehicleDetails || read(row, ALIASES.vehicleDetails) || row.vehicle_details || '', driverDetails: row.driverDetails || read(row, ALIASES.driverDetails) || row.driver_details || '', emailRecipients: row.emailRecipients || read(row, ALIASES.emailRecipients) || row.email_recipients || DEFAULT_EMAILS, lastUpdatedAt: row.lastUpdatedAt || row.last_updated_at || '' }; data.status = ALL_STATUSES.find((item) => item.toLowerCase() === String(data.status).toLowerCase()) || 'Untracked'; data.riskLevel = risk(data); return data; };
const formFor = (row) => ({ qtyConfirmed: row?.qtyConfirmed || '', dateConfirmed: row?.dateConfirmed || row?.qtyRequiredDate || '', status: row?.status && row.status !== 'Untracked' ? row.status : 'Pending', reasonForDelay: row?.reasonForDelay || '', vehicleDetails: row?.vehicleDetails || '', driverDetails: row?.driverDetails || '', emailRecipients: row?.emailRecipients || DEFAULT_EMAILS });
const varsFor = (row) => ({ lead_id: row.leadId, supplier_name: row.supplierName, poc_name: row.pocName, supplier_email: row.email || '', supplier_phone: row.phone || '', serial_no: row.serialNo, part_no: row.partNo, part_description: row.partDescription, add_value: row.addValue || 'Not provided', current_coverage_days: row.currentCoverageDays || 'Not provided', qty_required: row.qtyRequired, qty_required_date: row.qtyRequiredDate, qty_required_time: row.qtyRequiredTime || 'Not provided', qty_confirmed: row.qtyConfirmed || 'Pending confirmation', date_confirmed: row.dateConfirmed || 'Pending confirmation', status: row.status, reason_for_delay: row.reasonForDelay || 'None', vehicle_details: row.vehicleDetails || 'Pending confirmation', driver_details: row.driverDetails || 'Pending confirmation', email_recipients: row.emailRecipients || DEFAULT_EMAILS, risk_level: row.riskLevel || 'LOW' });
const phoneParts = (v) => { const text = String(v || '').trim(); const digits = text.replace(/\D/g, ''); if (!text) return { countryCode: '+91', local: '' }; if (text.startsWith('+') && digits.length > 10) return { countryCode: `+${digits.slice(0, digits.length - 10)}`, local: digits.slice(-10) }; return { countryCode: '+91', local: digits.slice(-10) }; };

/* ─── Icons ─── */
const ChevronDown = ({ open }) => (
  <svg className={`collapse-chevron${open ? ' open' : ''}`} viewBox="0 0 16 16" fill="none">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M8 1v10M8 1L4 5m4-4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1 11v3h14v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 7a6 6 0 1 1 1.05 3.36" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M1 10.5V7h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5.2 2.33l-.93-.93A1 1 0 0 0 3.1 1H2a1 1 0 0 0-1 1v1.5A9.5 9.5 0 0 0 10.5 13H12a1 1 0 0 0 1-1v-1.1a1 1 0 0 0-.4-.8l-1.76-1.32a1 1 0 0 0-1.15-.04l-.94.62a1 1 0 0 1-1.1-.04L5.2 7.35a1 1 0 0 1-.04-1.1l.62-.94a1 1 0 0 0-.04-1.15L5.2 2.33z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="4.5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2 7a5 5 0 0 0 10 0M7 12v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/* ─── App ─── */
function App() {
  const [rows, setRows] = useState(QUEUE_URL ? [] : DEMO_ROWS);
  const [status, setStatus] = useState(QUEUE_URL ? 'SYNCING_QUEUE' : 'DEMO_READY');
  const [activeId, setActiveId] = useState(QUEUE_URL ? null : DEMO_ROWS[0].leadId);
  const [search, setSearch] = useState('');
  const slowSearch = useDeferredValue(search);
  const [uploadName, setUploadName] = useState(QUEUE_URL ? 'n8n queue' : 'Demo data');
  const [uploadMeta, setUploadMeta] = useState(QUEUE_URL ? { rowCount: 0, source: 'Loading...', uploadedAt: '' } : { rowCount: DEMO_ROWS.length, source: 'Seeded demo', uploadedAt: stamp() });
  const [form, setForm] = useState(formFor(DEMO_ROWS[0]));
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [outboundStatus, setOutboundStatus] = useState('idle');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [openSections, setOpenSections] = useState({ details: true, call: false, followup: false, audit: false });
  const uploadRef = useRef(null);
  const conversationRef = useRef(null);
  const pollingRef = useRef(null);

  const toggle = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const filtered = rows.filter((row) => !slowSearch.trim() || [row.leadId, row.serialNo, row.partNo, row.partDescription, row.supplierName, row.status, row.riskLevel].join(' ').toLowerCase().includes(slowSearch.trim().toLowerCase()));
  const active = rows.find((row) => row.leadId === activeId) || filtered[0] || rows[0] || null;
  const untracked = rows.filter((row) => row.status === 'Untracked').length;
  const critical = rows.filter((row) => row.riskLevel === 'CRITICAL').length;
  const delayed = rows.filter((row) => row.status === 'Delayed').length;
  const dispatched = rows.filter((row) => row.status === 'Dispatched').length;
  const recentActivity = rows.filter((r) => r.lastUpdatedAt && r.status !== 'Untracked').sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt)).slice(0, 5);

  useEffect(() => { if (!active && filtered[0]) setActiveId(filtered[0].leadId); }, [active, filtered]);
  useEffect(() => { if (!active) return; setForm(formFor(active)); const parts = phoneParts(active.phone); setCountryCode(parts.countryCode); setPhoneNumber(parts.local); }, [active]);
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const fetchQueue = async (keep = false) => {
    if (!QUEUE_URL) { setStatus('LOCAL_QUEUE_ACTIVE'); return; }
    const prev = activeId; setStatus('SYNCING_QUEUE');
    try {
      const res = await fetch(QUEUE_URL); const json = await res.json(); const list = (Array.isArray(json) ? json : json.rows || []).map(normalize).filter((row) => row.partNo || row.partDescription);
      if (!list.length) { setStatus('QUEUE_EMPTY'); return; }
      startTransition(() => { setRows(list); setActiveId(keep && list.some((row) => row.leadId === prev) ? prev : list[0].leadId); });
      setUploadMeta({ rowCount: list.length, source: 'n8n queue', uploadedAt: stamp() }); setStatus('QUEUE_SYNCED');
    } catch (error) { console.error(error); setStatus('QUEUE_SYNC_FAILED'); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchQueue(); }, []);

  const pushImport = async (list, filename) => {
    if (!IMPORT_URL) { setStatus('LOCAL_IMPORT_READY'); return; }
    try {
      const res = await fetch(IMPORT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: 'mahindra', filename, uploaded_at: stamp(), rows: list }) });
      if (!res.ok) throw new Error('import failed'); setStatus('SHEET_PUSHED_TO_N8N');
    } catch (error) { console.error(error); setStatus('LOCAL_IMPORT_ONLY'); }
  };

  const onUpload = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setIsUploading(true); setStatus('PARSING_SPREADSHEET');
    try {
      const book = XLSX.read(await file.arrayBuffer(), { type: 'array' }); const name = book.SheetNames[0];
      const raw = XLSX.utils.sheet_to_json(book.Sheets[name], { defval: '', raw: false });
      const list = raw.map((row, i) => normalize(row, i)).filter((row) => row.partNo || row.partDescription);
      if (!list.length) throw new Error('No usable rows found.');
      startTransition(() => { setRows(list); setActiveId(list[0].leadId); });
      setUploadName(file.name); setUploadMeta({ rowCount: list.length, source: `Sheet: ${name}`, uploadedAt: stamp() }); await pushImport(list, file.name);
    } catch (error) { console.error(error); setStatus('UPLOAD_FAILED'); window.alert(error.message || 'Failed to parse spreadsheet.'); }
    finally { setIsUploading(false); event.target.value = ''; }
  };

  const merged = (row) => {
    const next = { ...row, ...form, lastUpdatedAt: stamp() };
    if (next.status !== 'Delayed') next.reasonForDelay = '';
    if (next.status !== 'Dispatched') { next.vehicleDetails = ''; next.driverDetails = ''; }
    next.riskLevel = risk(next); return next;
  };

  const save = async () => {
    if (!active) return;
    setIsSaving(true); const next = merged(active);
    startTransition(() => setRows((current) => current.map((row) => row.leadId === next.leadId ? next : row)));
    setStatus('FOLLOW_UP_CAPTURED');
    if (!SAVE_URL) { setIsSaving(false); return; }
    try {
      const res = await fetch(SAVE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: 'mahindra', notify: true, ...next }) });
      if (!res.ok) throw new Error('save failed'); setStatus('FOLLOW_UP_EMAILED');
    } catch (error) { console.error(error); setStatus('FOLLOW_UP_LOCAL_ONLY'); }
    finally { setIsSaving(false); }
  };

  const startBrowserCall = async () => {
    if (!active) return; if (!AGENT_ID) { window.alert('Set VITE_AGENT_ID to start the ElevenLabs browser call.'); return; }
    setCallStatus('connecting');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversationRef.current = await Conversation.startSession({ agentId: AGENT_ID, dynamicVariables: varsFor(active), onConnect: () => setCallStatus('connected'), onDisconnect: () => { setCallStatus('ended'); conversationRef.current = null; setTimeout(() => { setCallStatus('idle'); fetchQueue(true); }, 4000); }, onError: (error) => { console.error(error); setCallStatus('idle'); } });
    } catch (error) { console.error(error); setCallStatus('idle'); }
  };

  const endBrowserCall = async () => { if (conversationRef.current) { await conversationRef.current.endSession(); conversationRef.current = null; } setCallStatus('idle'); };

  const pollConversation = (id) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const poll = async () => {
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${id}`, { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }); if (!res.ok) return;
        const json = await res.json();
        if (json.status === 'done' || json.status === 'failed') { setOutboundStatus(json.status === 'done' ? 'ended' : 'error'); clearInterval(pollingRef.current); pollingRef.current = null; setTimeout(() => { setOutboundStatus('idle'); setConversationId(null); fetchQueue(true); }, 4000); }
        else if (json.status === 'in-progress') setOutboundStatus('active');
      } catch (error) { console.error(error); }
    };
    poll(); pollingRef.current = setInterval(poll, 3000);
  };

  const startOutboundCall = async () => {
    if (!active) return;
    if (!AGENT_ID || !ELEVENLABS_API_KEY || !PHONE_NUMBER_ID) { window.alert('Set VITE_AGENT_ID, VITE_ELEVENLABS_API_KEY and VITE_ELEVENLABS_PHONE_NUMBER_ID for outbound calling.'); return; }
    const local = phoneNumber.replace(/\D/g, ''); if (local.length < 10) { window.alert('Enter a valid 10-digit phone number.'); return; }
    setOutboundStatus('calling');
    try {
      const res = await fetch(OUTBOUND_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY }, body: JSON.stringify({ agent_id: AGENT_ID, agent_phone_number_id: PHONE_NUMBER_ID, to_number: `${countryCode}${local}`, conversation_initiation_client_data: { dynamic_variables: varsFor({ ...active, phone: `${countryCode}${local}` }) } }) });
      if (!res.ok) throw new Error('call failed');
      const json = await res.json(); setConversationId(json.conversation_id || null); setOutboundStatus('active'); if (json.conversation_id) pollConversation(json.conversation_id);
    } catch (error) { console.error(error); setOutboundStatus('error'); setTimeout(() => setOutboundStatus('idle'), 2000); }
  };

  /* ─── Render ─── */
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-50)' }}>
      {/* Red accent bar */}
      <div style={{ height: 3, background: 'var(--mahindra)' }} />

      {/* ─── Header ─── */}
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--surface-200)' }}>
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div style={{ width: 30, height: 30, background: 'var(--mahindra)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>M</span>
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-900)', lineHeight: 1.15 }}>Supplier Follow-up</h1>
              <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mahindra PoC</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden items-center gap-2 md:flex">
            <div className="stat"><span className="stat-label">Untracked</span><span className="stat-num" style={{ color: 'var(--text-400)' }}>{untracked}</span></div>
            <div className="stat"><span className="stat-label">Critical</span><span className="stat-num" style={{ color: 'var(--red)' }}>{critical}</span></div>
            <div className="stat"><span className="stat-label">Dispatched</span><span className="stat-num" style={{ color: 'var(--green)' }}>{dispatched}</span></div>
            <div className="stat"><span className="stat-label">Delayed</span><span className="stat-num" style={{ color: 'var(--amber)' }}>{delayed}</span></div>
          </div>

          {/* Upload */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs sm:block" style={{ color: 'var(--text-400)' }}>{uploadName}</span>
            <button type="button" onClick={() => uploadRef.current?.click()} className="btn-primary" disabled={isUploading}>
              <UploadIcon />
              {isUploading ? 'Parsing...' : 'Upload'}
            </button>
            <input ref={uploadRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUpload} />
          </div>
        </div>
      </header>

      {/* Status strip */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--surface-100)' }}>
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-1.5 sm:px-6 lg:px-8" style={{ fontSize: '0.6875rem', color: 'var(--text-400)' }}>
          <span>{status.replaceAll('_', ' ')}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--surface-300)', display: 'inline-block' }} />
          <span>Last sync: {fmt(uploadMeta.uploadedAt)}</span>
        </div>
      </div>

      {/* ─── Main ─── */}
      <main className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-4 xl:grid-cols-[1fr_370px]">

          {/* ─── Table ─── */}
          <div className="card flex flex-col overflow-hidden" style={{ minHeight: 'calc(100vh - 180px)' }}>
            <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--surface-100)' }}>
              <h2 className="font-display" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-900)' }}>Follow-up Queue</h2>
              <div className="flex gap-2">
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input" style={{ maxWidth: 200 }} />
                <button type="button" onClick={() => fetchQueue(true)} className="btn-secondary"><RefreshIcon /> Refresh</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Part No</th>
                    <th>Supplier</th>
                    <th style={{ textAlign: 'right' }}>Qty Req.</th>
                    <th style={{ textAlign: 'right' }}>Qty Conf.</th>
                    <th>Date Req.</th>
                    <th>Status</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.leadId} onClick={() => setActiveId(row.leadId)} className={row.leadId === active?.leadId ? 'row-active' : ''}>
                      <td style={{ color: 'var(--text-400)' }}>{row.serialNo}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-900)' }}>{row.partNo}</td>
                      <td>{row.supplierName}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.qtyRequired}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.qtyConfirmed || '\u2014'}</td>
                      <td>{row.qtyRequiredDate || '\u2014'}</td>
                      <td><span className={`pill ${statusClass(row.status)}`}>{row.status}</span></td>
                      <td><span className={`pill ${row.riskLevel === 'CRITICAL' ? 'pill-critical' : 'pill-low'}`}>{row.riskLevel}</span></td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-400)' }}>No matching rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Detail Panel ─── */}
          <aside className="xl:sticky xl:top-4 xl:self-start" style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            {active ? (
              <div className="card animate-in overflow-hidden">

                {/* ═══ CALL SUPPLIER — hero section, always visible ═══ */}
                <div style={{ background: 'var(--mahindra)', padding: '1.125rem 1rem 1rem' }}>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Call Supplier</p>
                  <div className="flex items-start justify-between gap-3">
                    <div style={{ minWidth: 0 }}>
                      <h3 className="font-display" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{active.pocName}</h3>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{active.supplierName}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: active.riskLevel === 'CRITICAL' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)', color: active.riskLevel === 'CRITICAL' ? 'var(--mahindra)' : '#fff' }}>{active.riskLevel}</span>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{active.status}</span>
                    </div>
                  </div>

                  {/* Part context line */}
                  <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(255,255,255,0.12)', borderRadius: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                    <strong>{active.partNo}</strong> &mdash; {active.partDescription} &middot; {active.qtyRequired} pcs by {active.qtyRequiredDate}
                  </div>

                  {/* Call buttons */}
                  <div className="mt-3 grid gap-2">
                    {callStatus === 'connected' ? (
                      <button type="button" onClick={endBrowserCall} className="w-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.625rem', borderRadius: 8, border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 150ms' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor"/></svg>
                        End Call
                      </button>
                    ) : (
                      <button type="button" onClick={startBrowserCall} disabled={outboundStatus !== 'idle'} className="w-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.625rem', borderRadius: 8, border: 'none', background: '#fff', color: 'var(--mahindra)', fontWeight: 700, fontSize: '0.875rem', cursor: callStatus === 'connecting' || outboundStatus !== 'idle' ? 'not-allowed' : 'pointer', opacity: outboundStatus !== 'idle' ? 0.5 : 1, transition: 'transform 120ms, box-shadow 120ms', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        <MicIcon />{callStatus === 'connecting' ? 'Connecting...' : 'Start Browser Call'}
                      </button>
                    )}
                    <div className="grid grid-cols-[72px_1fr_auto] gap-1.5">
                      <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ padding: '0.5rem 0.25rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8125rem', textAlign: 'center', outline: 'none' }}>
                        <option value="+91" style={{ color: '#000' }}>+91</option><option value="+1" style={{ color: '#000' }}>+1</option><option value="+44" style={{ color: '#000' }}>+44</option><option value="+971" style={{ color: '#000' }}>+971</option>
                      </select>
                      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Phone number" style={{ padding: '0.5rem 0.625rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8125rem', outline: 'none' }} />
                      <button type="button" onClick={startOutboundCall} disabled={callStatus !== 'idle' || outboundStatus === 'calling'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.5rem 0.875rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600, fontSize: '0.8125rem', cursor: callStatus !== 'idle' || outboundStatus === 'calling' ? 'not-allowed' : 'pointer', opacity: callStatus !== 'idle' || outboundStatus === 'calling' ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                        <PhoneIcon />{outboundStatus === 'calling' ? 'Dialing...' : outboundStatus === 'active' ? 'Active' : 'Dial'}
                      </button>
                    </div>
                  </div>
                  {conversationId && <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)', marginTop: 6, wordBreak: 'break-all' }}>ID: {conversationId}</p>}
                </div>

                {/* ═══ Collapsible sections below ═══ */}

                {/* Section: Details */}
                <div>
                  <button type="button" className="collapse-trigger" onClick={() => toggle('details')}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-900)' }}>Part & Supplier Details</span>
                    <ChevronDown open={openSections.details} />
                  </button>
                  <div className={`collapse-body${openSections.details ? ' open' : ''}`}>
                    <div className="collapse-inner">
                      <div className="px-4 py-2.5">
                        <div className="detail-row"><span className="detail-label">Lead ID</span><span className="detail-value">{active.leadId}</span></div>
                        <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{active.phone || '\u2014'}</span></div>
                        <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value" style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.email || '\u2014'}</span></div>
                        <div className="detail-row"><span className="detail-label">ADD</span><span className="detail-value">{active.addValue || '\u2014'}</span></div>
                        <div className="detail-row"><span className="detail-label">Coverage</span><span className="detail-value">{active.currentCoverageDays ? `${active.currentCoverageDays} days` : '\u2014'}</span></div>
                        <div className="detail-row"><span className="detail-label">Required</span><span className="detail-value">{active.qtyRequired} by {active.qtyRequiredDate}{active.qtyRequiredTime ? `, ${active.qtyRequiredTime}` : ''}</span></div>
                        <div className="detail-row"><span className="detail-label">Confirmed</span><span className="detail-value">{active.qtyConfirmed || '\u2014'}{active.dateConfirmed ? ` on ${active.dateConfirmed}` : ''}</span></div>
                        {active.reasonForDelay && <div className="detail-row"><span className="detail-label">Delay reason</span><span className="detail-value">{active.reasonForDelay}</span></div>}
                        {active.vehicleDetails && <div className="detail-row"><span className="detail-label">Vehicle</span><span className="detail-value">{active.vehicleDetails}</span></div>}
                        {active.driverDetails && <div className="detail-row"><span className="detail-label">Driver</span><span className="detail-value">{active.driverDetails}</span></div>}
                        <div className="detail-row"><span className="detail-label">Updated</span><span className="detail-value">{fmt(active.lastUpdatedAt)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Follow-up Form */}
                <div>
                  <button type="button" className="collapse-trigger" onClick={() => toggle('followup')}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-900)' }}>Follow-up</span>
                    <ChevronDown open={openSections.followup} />
                  </button>
                  <div className={`collapse-body${openSections.followup ? ' open' : ''}`}>
                    <div className="collapse-inner">
                      <div className="grid gap-2.5 px-4 py-3">
                        <div className="grid grid-cols-2 gap-2">
                          <label className="form-group"><span className="form-label">Qty confirmed</span><input value={form.qtyConfirmed} onChange={(e) => setForm((c) => ({ ...c, qtyConfirmed: e.target.value }))} className="input" /></label>
                          <label className="form-group"><span className="form-label">Date confirmed</span><input value={form.dateConfirmed} onChange={(e) => setForm((c) => ({ ...c, dateConfirmed: e.target.value }))} className="input" placeholder="DD-MM-YYYY" /></label>
                        </div>
                        <label className="form-group"><span className="form-label">Status</span>
                          <select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))} className="input">{FORM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                        </label>
                        {form.status === 'Delayed' && (
                          <label className="form-group"><span className="form-label">Delay reason</span><textarea rows={2} value={form.reasonForDelay} onChange={(e) => setForm((c) => ({ ...c, reasonForDelay: e.target.value }))} className="input" style={{ resize: 'none', minHeight: 56 }} /></label>
                        )}
                        {form.status === 'Dispatched' && (<>
                          <label className="form-group"><span className="form-label">Vehicle</span><input value={form.vehicleDetails} onChange={(e) => setForm((c) => ({ ...c, vehicleDetails: e.target.value }))} className="input" /></label>
                          <label className="form-group"><span className="form-label">Driver</span><input value={form.driverDetails} onChange={(e) => setForm((c) => ({ ...c, driverDetails: e.target.value }))} className="input" /></label>
                        </>)}
                        <label className="form-group"><span className="form-label">Email to</span><input value={form.emailRecipients} onChange={(e) => setForm((c) => ({ ...c, emailRecipients: e.target.value }))} className="input" /></label>
                        <button type="button" onClick={save} className="btn-primary w-full" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save & Email'}</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Recent Activity */}
                <div>
                  <button type="button" className="collapse-trigger" onClick={() => toggle('audit')}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-900)' }}>Recent Activity</span>
                      {recentActivity.length > 0 && <span className="pill pill-pending">{recentActivity.length}</span>}
                    </div>
                    <ChevronDown open={openSections.audit} />
                  </button>
                  <div className={`collapse-body${openSections.audit ? ' open' : ''}`}>
                    <div className="collapse-inner">
                      <div className="grid gap-2 px-4 py-3">
                        {recentActivity.length ? recentActivity.map((r) => (
                          <div key={r.leadId} style={{ padding: '0.5rem 0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-100)', fontSize: '0.8125rem' }}>
                            <div className="flex items-center justify-between">
                              <strong style={{ color: 'var(--text-900)' }}>{r.leadId} &middot; {r.partNo}</strong>
                              <span className={`pill ${r.riskLevel === 'CRITICAL' ? 'pill-critical' : 'pill-low'}`}>{r.riskLevel}</span>
                            </div>
                            <p style={{ color: 'var(--text-500)', marginTop: 3 }}><span className={`pill ${statusClass(r.status)}`} style={{ marginRight: 6 }}>{r.status}</span>{r.qtyConfirmed ? `${r.qtyConfirmed} pcs confirmed` : 'Awaiting confirmation'}</p>
                            <p style={{ color: 'var(--text-400)', fontSize: '0.6875rem', marginTop: 2 }}>{fmt(r.lastUpdatedAt)}</p>
                          </div>
                        )) : <p style={{ fontSize: '0.8125rem', color: 'var(--text-400)' }}>No follow-ups recorded yet.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card flex items-center justify-center" style={{ minHeight: 180, color: 'var(--text-400)', fontSize: '0.8125rem' }}>
                Select a row to view details
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
