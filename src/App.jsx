import { useState, useEffect, useRef } from 'react';
import { Conversation } from '@11labs/client';

// --- CONFIGURATION ---
// 1. Log into ElevenLabs > Agents to get your ID
const AGENT_ID = import.meta.env.VITE_AGENT_ID; 
// 2. Your n8n Webhook URL (Keep this variable even if using mock data for now)
const N8N_QUEUE_URL = import.meta.env.VITE_N8N_QUEUE_URL;
// 3. ElevenLabs API Key for outbound calls
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
// 4. Your Twilio phone number ID imported to ElevenLabs
const PHONE_NUMBER_ID = import.meta.env.VITE_ELEVENLABS_PHONE_NUMBER_ID; 

function App() {
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState("SYSTEM_IDLE");
  const [activeLeadId, setActiveLeadId] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, connected, ended
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [outboundCallStatus, setOutboundCallStatus] = useState('idle'); // idle, calling, active, ended, error
  const [outboundCallId, setOutboundCallId] = useState(null);
  const [outboundConversationId, setOutboundConversationId] = useState(null);
  const conversationRef = useRef(null);

  // --- 1. Start Call with ElevenLabs SDK ---
  const startCall = async () => {
    const targetLead = leads.find(l => l.lead_id === activeLeadId);
    if (!targetLead) {
      console.error("No lead selected");
      return;
    }

    setCallStatus('connecting');

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        dynamicVariables: {
          lead_id: targetLead.lead_id,
          supplier_name: targetLead.supplier_name,
          poc_name: targetLead.poc_name,
          original_due_date: targetLead.original_due_date,
          item_1: targetLead.item_1_name,
          qty_1: targetLead.item_1_qty,
          item_2: targetLead.item_2_name || 'null',
          qty_2: targetLead.item_2_qty || 'null',
          item_3: targetLead.item_3_name || 'null',
          qty_3: targetLead.item_3_qty || 'null'
        },
        onConnect: () => {
          console.log('Connected to ElevenLabs');
          setCallStatus('connected');
        },
        onDisconnect: () => {
          console.log('Disconnected from ElevenLabs');
          setCallStatus('ended');
          setTimeout(() => setCallStatus('idle'), 2000);
        },
        onError: (error) => {
          console.error('ElevenLabs Error:', error);
          setCallStatus('idle');
        }
      });

      conversationRef.current = conversation;
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus('idle');
    }
  };

  // --- 2. End Call ---
  const endCall = async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setCallStatus('idle');
    // Refetch data after call ends, but keep the same supplier selected
    fetchQueue(true);
  };

  // --- 3. Start Outbound Phone Call via ElevenLabs + Twilio ---
  const startOutboundCall = async () => {
    const targetLead = leads.find(l => l.lead_id === activeLeadId);
    if (!targetLead || !phoneNumber) {
      console.error("No lead selected or phone number missing");
      return;
    }

    // Validate phone number (just digits, 10 digits for India)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanNumber}`;
    setOutboundCallStatus('calling');

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          agent_id: AGENT_ID,
          agent_phone_number_id: PHONE_NUMBER_ID,
          to_number: fullPhoneNumber,
          conversation_initiation_client_data: {
            dynamic_variables: {
              lead_id: targetLead.lead_id,
              supplier_name: targetLead.supplier_name,
              poc_name: targetLead.poc_name,
              original_due_date: targetLead.original_due_date,
              item_1: targetLead.item_1_name,
              qty_1: targetLead.item_1_qty,
              item_2: targetLead.item_2_name || 'null',
              qty_2: targetLead.item_2_qty || 'null',
              item_3: targetLead.item_3_name || 'null',
              qty_3: targetLead.item_3_qty || 'null'
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to initiate call');
      }

      const data = await response.json();
      console.log('Outbound call initiated:', data);
      setOutboundCallId(data.callSid || null);
      setOutboundConversationId(data.conversation_id || null);
      setOutboundCallStatus('active');

    } catch (error) {
      console.error('Failed to start outbound call:', error);
      setOutboundCallStatus('error');
      setTimeout(() => setOutboundCallStatus('idle'), 3000);
    }
  };

  // --- 4. Data Fetching Logic ---
  const fetchQueue = async (preserveSelection = false) => {
    const currentLeadId = activeLeadId;
    setStatus("SYNCING_DB...");
    
    // START MOCK DATA BLOCK (Use this for the Demo)
    const mockData = [
      { 
        lead_id: '101', 
        supplier_name: 'Sharma Building Materials', 
        poc_name: 'Rajesh Sharma',
        status: 'Pending', 
        risk_level: 'LOW',
        item_1_name: 'AAC Blocks', item_1_qty: '1000 Pcs',
        item_2_name: 'Cement (ACC)', item_2_qty: '150 Bags',
        item_3_name: 'Binding Wire', item_3_qty: '25 Kg',
        original_due_date: '2025-12-18',
        delivery_date: '', delay_reason: '', call_summary: ''
      },
      { 
        lead_id: '102', 
        supplier_name: 'Gupta Hardware Store', 
        poc_name: 'Anita Gupta',
        status: 'Pending', 
        risk_level: 'LOW',
        item_1_name: 'PVC Pipes (4 inch)', item_1_qty: '200 Pcs',
        item_2_name: 'Gate Valves', item_2_qty: '50 Pcs',
        item_3_name: 'Pipe Fittings', item_3_qty: '100 Pcs',
        original_due_date: '2025-12-22',
        delivery_date: '', delay_reason: '', call_summary: ''
      },
      { 
        lead_id: '103', 
        supplier_name: 'Krishna Tiles & Sanitary', 
        poc_name: 'Mohan Patel',
        status: 'Pending', 
        risk_level: 'CRITICAL',
        item_1_name: 'Vitrified Tiles (2x2)', item_1_qty: '800 Sq ft',
        item_2_name: 'Bathroom Fittings', item_2_qty: '10 Sets',
        item_3_name: '', item_3_qty: '',
        original_due_date: '2025-12-14',
        delivery_date: '', delay_reason: '', call_summary: ''
      },
    ];

    // setTimeout(() => {
    //   setLeads(mockData);
    //   const firstPending = mockData.find(l => l.status === 'Pending');
    //   if (firstPending) setActiveLeadId(firstPending.lead_id);
    //   setStatus("ONLINE // READY");
    // }, 800);
    // END MOCK DATA BLOCK

    // --- REAL N8N CONNECTION ---
    
    try {
      const res = await fetch(N8N_QUEUE_URL);
      const data = await res.json();
      setLeads(data);
      // Only auto-select first pending if not preserving selection
      if (!preserveSelection || !currentLeadId) {
        const firstPending = data.find(l => l.status === 'Pending');
        if (firstPending) setActiveLeadId(firstPending.lead_id);
      }
      setStatus("ONLINE // READY");
    } catch (err) {
      console.error("n8n Connection Failed:", err);
      setStatus("CONNECTION_ERR");
    }
    
  };

  // Initial Load
  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-oil-black">
      
      {/* Background Layers */}
      <div className="bg-grid" />
      <div className="crt-scanline" />

      {/* Main Chassis */}
      <div className="w-full max-w-6xl h-[700px] bg-panel-bg border border-[#333] border-t-4 border-t-safety-orange shadow-2xl grid grid-cols-12 grid-rows-[60px_1fr_40px] relative z-10">
        
        {/* HEADER */}
        <header className="col-span-12 bg-[#1a1a1e] border-b border-[#333] flex items-center justify-between px-6 select-none">
          <div className="text-xl font-bold tracking-tighter">
            PROCURE<span className="text-safety-orange">-OS</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-500 font-mono">
            <span>SYS.VER: 4.0.2</span>
            <span className={`font-bold ${status === 'CONNECTION_ERR' ? 'text-red-500' : 'text-safety-orange animate-pulse'}`}>
              [{status}]
            </span>
          </div>
        </header>

        {/* SIDEBAR (QUEUE) */}
        <aside className="col-span-4 border-r border-[#333] bg-[#0c0c0e] flex flex-col">
          <div className="p-4 border-b border-[#333]">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-4 font-mono">Supplier Queue</h2>
            <button 
              onClick={fetchQueue}
              className="w-full border border-[#333] text-gray-400 hover:border-safety-orange hover:text-safety-orange text-xs py-2 px-4 transition-all duration-300 font-mono uppercase"
            >
              Refresh Orders...
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {leads.map((lead) => (
              <div 
                key={lead.lead_id}
                onClick={() => setActiveLeadId(lead.lead_id)}
                className={`p-3 border-l-2 transition-all cursor-pointer group ${
                  lead.lead_id === activeLeadId 
                    ? 'border-safety-orange bg-safety-orange/10' 
                    : 'border-[#333] bg-[#1a1a1e] opacity-60 hover:opacity-100 hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-gray-200 group-hover:text-white">{lead.supplier_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    lead.risk_level === 'CRITICAL' 
                      ? 'bg-red-900/50 text-red-200 border border-red-900' 
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-light font-mono">
                  ID: {lead.lead_id} // POC: {lead.poc_name}
                </div>
                <div className="text-[10px] text-gray-600 mt-1 font-mono">
                  Due: {lead.original_due_date}
                </div>
                
                {lead.lead_id === activeLeadId && (
                   <div className="mt-2 text-[10px] text-safety-orange font-bold animate-pulse tracking-wide font-mono">
                     &gt;&gt; SELECTED FOR NEGOTIATION
                   </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="col-span-8 bg-oil-black relative flex flex-col items-start justify-start p-6 overflow-hidden">
          {/* Decorative Crosshairs */}
          <div className="absolute top-4 left-4 w-3 h-3 border-l border-t border-gray-700" />
          <div className="absolute top-4 right-4 w-3 h-3 border-r border-t border-gray-700" />
          <div className="absolute bottom-4 left-4 w-3 h-3 border-l border-b border-gray-700" />
          <div className="absolute bottom-4 right-4 w-3 h-3 border-r border-b border-gray-700" />

          {/* Radial Glow Center */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,69,0,0.05),transparent_70%)] pointer-events-none" />

          {/* Selected Lead Details */}
          {activeLeadId && leads.find(l => l.lead_id === activeLeadId) && (
            <div className="relative z-10 w-full mb-4">
              {(() => {
                const activeLead = leads.find(l => l.lead_id === activeLeadId);
                return (
                  <div className="space-y-4">
                    {/* Supplier Header */}
                    <div className="border-b border-[#333] pb-3">
                      <h3 className="text-lg font-bold text-white">{activeLead.supplier_name}</h3>
                      <p className="text-xs text-gray-500 font-mono">Contact: {activeLead.poc_name} | Due: {activeLead.original_due_date}</p>
                    </div>
                    
                    {/* Items List */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono">Order Items</h4>
                      <div className="grid gap-2 text-xs font-mono">
                        {activeLead.item_1_name && (
                          <div className="flex justify-between bg-[#1a1a1e] p-2 border-l-2 border-safety-orange">
                            <span className="text-gray-300">{activeLead.item_1_name}</span>
                            <span className="text-safety-orange">{activeLead.item_1_qty}</span>
                          </div>
                        )}
                        {activeLead.item_2_name && (
                          <div className="flex justify-between bg-[#1a1a1e] p-2 border-l-2 border-gray-600">
                            <span className="text-gray-300">{activeLead.item_2_name}</span>
                            <span className="text-gray-400">{activeLead.item_2_qty}</span>
                          </div>
                        )}
                        {activeLead.item_3_name && (
                          <div className="flex justify-between bg-[#1a1a1e] p-2 border-l-2 border-gray-600">
                            <span className="text-gray-300">{activeLead.item_3_name}</span>
                            <span className="text-gray-400">{activeLead.item_3_qty}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Agent Updated Fields */}
                    <div className="space-y-2 border-t border-[#333] pt-3">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono">Agent Updates</h4>
                      <div className="grid gap-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Delivery Date:</span>
                          <span className={activeLead.delivery_date ? 'text-green-400' : 'text-gray-600'}>
                            {activeLead.delivery_date || '— Pending —'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Delay Reason:</span>
                          <span className={activeLead.delay_reason ? 'text-yellow-400' : 'text-gray-600'}>
                            {activeLead.delay_reason || '— None —'}
                          </span>
                        </div>
                        {activeLead.call_summary && (
                          <div className="mt-2 p-2 bg-[#1a1a1e] border border-[#333] text-gray-400 text-[11px] leading-relaxed">
                            <span className="text-gray-500 block mb-1">Call Summary:</span>
                            {activeLead.call_summary}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Voice Widget Section */}
          <div className="relative z-10 text-center w-full mt-auto border-t border-[#333] pt-4">
            <div className="text-xs text-gray-600 mb-4 tracking-[0.3em] font-mono">AI PROCUREMENT ASSISTANT</div>
            
            {/* Two Call Options Container */}
            <div className="flex gap-6 justify-center items-start">
              
              {/* Option 1: Browser Voice Call */}
              <div className="flex-1 max-w-[200px]">
                <div className="text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-wider">Browser Call</div>
                
                {callStatus === 'idle' && (
                  <button
                    onClick={startCall}
                    disabled={!activeLeadId || outboundCallStatus !== 'idle'}
                    className={`w-full px-4 py-3 rounded font-mono text-xs uppercase tracking-wider transition-all duration-300 ${
                      activeLeadId && outboundCallStatus === 'idle'
                        ? 'bg-safety-orange text-black hover:bg-orange-400 cursor-pointer' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    VOICE CALL
                  </button>
                )}

                {callStatus === 'connecting' && (
                  <div className="px-4 py-3 bg-yellow-900/50 border border-yellow-600 rounded">
                    <span className="text-yellow-400 font-mono text-xs animate-pulse">CONNECTING...</span>
                  </div>
                )}

                {callStatus === 'connected' && (
                  <div className="space-y-2">
                    <div className="px-4 py-3 bg-green-900/50 border border-green-600 rounded">
                      <span className="text-green-400 font-mono text-xs flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        IN PROGRESS
                      </span>
                    </div>
                    <button
                      onClick={endCall}
                      className="w-full px-4 py-2 bg-red-900/50 border border-red-600 text-red-400 rounded font-mono text-xs hover:bg-red-900 transition-all"
                    >
                      End Call
                    </button>
                  </div>
                )}

                {callStatus === 'ended' && (
                  <div className="px-4 py-3 bg-gray-800 border border-gray-600 rounded">
                    <span className="text-gray-400 font-mono text-xs">CALL ENDED</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex flex-col items-center justify-center h-24">
                <div className="w-px h-full bg-[#333]"></div>
                <span className="text-[10px] text-gray-600 font-mono py-1">OR</span>
                <div className="w-px h-full bg-[#333]"></div>
              </div>

              {/* Option 2: Outbound Phone Call */}
              <div className="flex-1 max-w-[280px]">
                <div className="text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-wider">Phone Call (Twilio)</div>
                
                {outboundCallStatus === 'idle' && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        disabled={callStatus !== 'idle'}
                        className="w-20 px-2 py-2 bg-[#1a1a1e] border border-[#333] text-gray-200 text-xs font-mono rounded focus:border-safety-orange focus:outline-none disabled:opacity-50"
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+971">+971</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        disabled={callStatus !== 'idle'}
                        className="flex-1 px-3 py-2 bg-[#1a1a1e] border border-[#333] text-gray-200 text-xs font-mono rounded focus:border-safety-orange focus:outline-none disabled:opacity-50 placeholder:text-gray-600"
                      />
                    </div>
                    <button
                      onClick={startOutboundCall}
                      disabled={!activeLeadId || !phoneNumber || callStatus !== 'idle'}
                      className={`w-full px-4 py-3 rounded font-mono text-xs uppercase tracking-wider transition-all duration-300 ${
                        activeLeadId && phoneNumber && callStatus === 'idle'
                          ? 'bg-safety-orange text-black hover:bg-orange-400 cursor-pointer' 
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      PHONE CALL
                    </button>
                  </div>
                )}

                {outboundCallStatus === 'calling' && (
                  <div className="px-4 py-3 bg-yellow-900/50 border border-yellow-600 rounded">
                    <span className="text-yellow-400 font-mono text-xs animate-pulse">DIALING {countryCode}{phoneNumber}...</span>
                  </div>
                )}

                {outboundCallStatus === 'active' && (
                  <div className="space-y-2">
                    <div className="px-4 py-3 bg-green-900/50 border border-green-600 rounded">
                      <span className="text-green-400 font-mono text-xs flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        CALL ACTIVE
                      </span>
                    </div>
                    {outboundCallId && (
                      <div className="text-[10px] text-gray-500 font-mono truncate">
                        SID: {outboundCallId}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setOutboundCallStatus('idle');
                        setOutboundCallId(null);
                        setOutboundConversationId(null);
                        fetchQueue(true);
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-gray-400 rounded font-mono text-xs hover:bg-gray-700 transition-all"
                    >
                      MARK COMPLETE
                    </button>
                  </div>
                )}

                {outboundCallStatus === 'ended' && (
                  <div className="px-4 py-3 bg-gray-800 border border-gray-600 rounded">
                    <span className="text-gray-400 font-mono text-xs">CALL ENDED</span>
                  </div>
                )}

                {outboundCallStatus === 'error' && (
                  <div className="px-4 py-3 bg-red-900/50 border border-red-600 rounded">
                    <span className="text-red-400 font-mono text-xs">CALL FAILED</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="mt-4 text-xs text-gray-500/80 max-w-md mx-auto leading-relaxed font-mono">
              {activeLeadId 
                ? `Ready to contact ${leads.find(l => l.lead_id === activeLeadId)?.poc_name || 'supplier'} via browser or phone`
                : 'Select a supplier from the queue to begin'
              }
            </p>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="col-span-12 bg-oil-black border-t border-[#333] flex items-center justify-between px-6 text-[10px] text-gray-600 font-mono uppercase">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-900 animate-pulse"></span>
              SECURE CONNECTION
            </span>
            <span>REGION: INDIA</span>
          </div>
          <div>GST VERIFIED | MSME REGISTERED</div>
        </footer>

      </div>
    </div>
  );
}

export default App;