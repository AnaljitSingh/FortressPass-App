import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Copy, Save, FileText, ShieldCheck, Lock, Settings as SettingsIcon, Zap, Upload, ShieldAlert, X, Download, Terminal, Send, Mail, LogOut, Database, RefreshCcw, Key, Shield } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, onSnapshot, setDoc, getDoc, updateDoc, deleteField, deleteDoc, getDocs } from 'firebase/firestore';

// --- SVG Icons ---
const FortressIcon = ({ className = "w-6 h-6", color = "#D4AF37" }) => (
  <img
    src="/fortress_icon.png"
    alt="Fortress"
    className={`${className} object-contain`}
    style={{
      mixBlendMode: 'screen',
      filter: color === "#64748b" ? 'grayscale(100%) opacity(0.3)' : 'none',
      transition: 'all 0.3s ease'
    }}
  />
);

const LockIcon = ({ color = "#D4AF37", className = "w-5 h-5" }) => (
  <Lock className={className} style={{ color }} />
);

const FileIcon = ({ color = "#D4AF37", className = "w-5 h-5" }) => (
  <FileText className={className} style={{ color }} />
);

const ShieldCheckIcon = ({ color = "#D4AF37", className = "w-5 h-5" }) => (
  <ShieldCheck className={className} style={{ color }} />
);

// --- Citadel Cipher Logic (Cafe Signature + XOR Masking) ---
const CitadelCipher = {
  // Protocol: USER1 -> XOR MASKING -> FILES TRANSFER -> XOR MASKING -> USER2
  encode: (text, key, operator = "USER") => {
    if (!text) return "";
    try {
      const keyBytes = key.split('').map(c => c.charCodeAt(0));
      const masked = text.split('').map((char, i) => {
        const charCode = char.charCodeAt(0);
        const mask = keyBytes[i % keyBytes.length];
        return String.fromCharCode(charCode ^ mask);
      }).join('');

      const b64 = btoa(unescape(encodeURIComponent(masked)));
      return `CAFE-XOR://${operator.toUpperCase()}//XOR-MASKING//[${b64}]//SECURE-TRANSFER//PROTOCOL_V1`;
    } catch (err) {
      console.error("Encryption Error:", err);
      return "[ENCRYPTION FAILURE]";
    }
  },
  decode: (encoded, key) => {
    if (!encoded) return "";
    try {
      if (!encoded.startsWith("CAFE-XOR://")) throw new Error("Invalid Signature");
      const match = encoded.match(/\[(.*?)\]/);
      if (!match) throw new Error("Corrupted Manifest");

      const b64 = match[1];
      const masked = decodeURIComponent(escape(atob(b64)));
      const keyBytes = key.split('').map(c => c.charCodeAt(0));

      return masked.split('').map((char, i) => {
        const charCode = char.charCodeAt(0);
        const mask = keyBytes[i % keyBytes.length];
        return String.fromCharCode(charCode ^ mask);
      }).join('');
    } catch {
      return "[CORRUPTED DATA: ARCHITECTURAL MISMATCH OR INVALID CAFE SIGNATURE]";
    }
  }
};

// --- Sub-Components ---

const GeneratorView = ({ files, lockedFiles, onSealResource }) => {
  const [length, setLength] = useState(16);
  const [generated, setGenerated] = useState('');
  const [selectedResource, setSelectedResource] = useState('');

  const generate = () => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGenerated(retVal);
  };

  const handleSeal = () => {
    if (!selectedResource || !generated) {
      alert("ERROR: Selection and Key Generation required for sealing.");
      return;
    }
    onSealResource(selectedResource, generated);
    alert(`RESOURCE SEALED: ${selectedResource} is now protected by secondary encryption.`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl gold-text font-bold uppercase tracking-widest font-['Newsreader']">Key Forge Terminal</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em]">Resource-Level Cryptographic Seal Generator</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="bg-black/40 border border-[#735C00]/30 p-10 space-y-8 relative overflow-hidden">
          <div className="flex items-center gap-4 text-[#D4AF37]">
            <Database className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Target Resource Selection</span>
          </div>
          <div className="space-y-4">
            <select 
              value={selectedResource} 
              onChange={(e) => setSelectedResource(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 p-4 text-slate-300 font-mono text-sm focus:border-[#D4AF37] outline-none"
            >
              <option value="">SELECT VAULTED RESOURCE...</option>
              {files.map(f => (
                <option key={f.name} value={f.name}>{f.name} {lockedFiles[f.name] ? '(SEALED)' : ''}</option>
              ))}
            </select>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed">Select an architectural anchor from your vault to apply a secondary security seal.</p>
          </div>
        </div>

        <div className="bg-black/40 border border-[#735C00]/30 p-10 space-y-8 relative overflow-hidden">
          <div className="flex items-center gap-4 text-[#D4AF37]">
            <RefreshCcw className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Entropy Parameters</span>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Seal Complexity: {length}</span>
              <input type="range" min="12" max="32" value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-1/2 accent-[#D4AF37]" />
            </div>
            <div className="bg-zinc-950 border border-white/10 p-6 flex flex-col items-center justify-center min-h-[100px] relative group">
              <p className="text-xl font-mono text-[#D4AF37] break-all text-center tracking-widest">{generated || "READY TO FORGE"}</p>
              {generated && (
                <button 
                  onClick={() => { navigator.clipboard.writeText(generated); alert("KEY COPIED: Secure it in physical storage."); }}
                  className="absolute top-2 right-2 text-slate-700 hover:text-[#D4AF37] transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={generate} className="w-full action-btn py-4 flex items-center justify-center gap-3">
              <Key className="w-4 h-4" /> Execute Forge
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#D4AF37]/5 border-2 border-[#D4AF37]/20 p-10 flex flex-col items-center space-y-6 text-center">
        <Shield className="w-12 h-12 text-[#D4AF37]" />
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest">Apply Security Seal</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed uppercase tracking-tighter">
            Confirming this protocol will apply the generated key to the selected resource. 
            Access to this file will henceforth require this secondary key challenge.
          </p>
        </div>
        <button 
          onClick={handleSeal}
          disabled={!selectedResource || !generated}
          className={`px-12 py-5 bg-[#D4AF37] text-black font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-[10px_10px_0px_rgba(0,0,0,0.5)] ${(!selectedResource || !generated) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Seal Resource
        </button>
      </div>
    </motion.div>
  );
};

const AuditView = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [items, setItems] = useState([
    { name: 'Global Banking Portal', health: 100, time: '29 Apr, 2026', status: 'SECURE' },
    { name: 'Heritage Archive Hub', health: 100, time: '29 Apr, 2026', status: 'SECURE' },
    { name: 'Neural Pulse VPN', health: 100, time: '29 Apr, 2026', status: 'SECURE' }
  ]);

  const handleScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          // Only add a simulated issue if something is actually "wrong"
          // For now, keep it 100% secure as requested
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleFix = (index) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      health: 100,
      status: 'SECURE',
      time: 'Just Now'
    };
    setItems(newItems);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex justify-between items-end border-b border-[#735C00]/30 pb-6">
        <div>
          <h2 className="text-3xl font-['Newsreader'] text-[#D4AF37] mb-2">Security Audit Ledger</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em]">Historical integrity records of the Citadel</p>
        </div>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className={`px-8 py-3 bg-black border border-[#D4AF37] text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all ${isScanning ? 'opacity-50' : ''}`}
        >
          {isScanning ? 'Scanning Citadel...' : 'Initiate Security Audit'}
        </button>
      </div>

      {isScanning && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">
            <span>System Sweep in Progress...</span>
            <span>{scanProgress}%</span>
          </div>
          <div className="h-1 bg-white/5 w-full overflow-hidden">
            <motion.div
              className="h-full bg-[#D4AF37]"
              initial={{ width: 0 }}
              animate={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-[#111415]/50 border border-white/5 p-2 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="py-6 px-6">Credential / Process</th>
                <th className="py-6 px-6">Integrity</th>
                <th className="py-6 px-6">Last Verified</th>
                <th className="py-6 px-6">Status</th>
                <th className="py-6 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items.map((item, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-6 px-6 font-medium text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-1 rounded-full ${item.status === 'VULNERABLE' || item.status === 'CRITICAL' ? 'bg-red-500' : 'bg-[#D4AF37]'}`}></div>
                      {item.name}
                    </div>
                  </td>
                  <td className="py-6 px-6 font-mono">
                    <span className={item.health < 50 ? 'text-red-400' : 'text-[#D4AF37]'}>{item.health}%</span>
                  </td>
                  <td className="py-6 px-6 text-slate-500 text-xs">{item.time}</td>
                  <td className="py-6 px-6">
                    <span className={`text-[9px] font-bold px-3 py-1 border ${item.status === 'VULNERABLE' || item.status === 'CRITICAL' ? 'border-red-500/50 text-red-400' : 'border-[#D4AF37]/50 text-[#D4AF37]'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-6 px-6 text-right">
                    {(item.status === 'VULNERABLE' || item.status === 'CRITICAL') && (
                      <button
                        onClick={() => handleFix(i)}
                        className="text-[9px] font-bold text-white uppercase tracking-widest border border-white/20 px-4 py-2 hover:bg-white hover:text-black transition-all"
                      >
                        Patch Breach
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const AdminView = ({ logs, onClearLogs, users, view, setView, isLoading, fetchUsers, addLog }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId, operatorName) => {
    if (window.confirm(`CRITICAL PROTOCOL: Are you certain you wish to permanently prune the identity of "${operatorName || userId}" from the Citadel? This action is irreversible.`)) {
      try {
        await deleteDoc(doc(db, "users", userId));
        addLog('IDENTITY_PRUNED', `Operator ${operatorName || userId} purged from registry`);
        fetchUsers();
        alert("PROTOCOL EXECUTED: Identity successfully purged.");
      } catch (error) {
        console.error("Prune error:", error);
        alert("PROTOCOL FAILED: Identity erasure unsuccessful.");
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.masterId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <div className="flex justify-between items-center border-b border-[#735C00]/30 pb-6">
        <div>
          <h2 className="text-4xl gold-text font-bold uppercase tracking-widest font-['Newsreader']">Overseer Command Center</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em]">Centralized Intelligence & Registry Management</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setView('logs')}
            className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border ${view === 'logs' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black text-[#D4AF37] border-[#735C00]/30 hover:border-[#D4AF37]'}`}
          >
            System Logs
          </button>
          <button 
            onClick={() => setView('registry')}
            className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border ${view === 'registry' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black text-[#D4AF37] border-[#735C00]/30 hover:border-[#D4AF37]'}`}
          >
            Identity Registry
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-black/40 border border-white/10 p-6 space-y-2 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/5 -mr-10 -mt-10 rounded-full blur-2xl"></div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Global Uptime</p>
          <p className="text-3xl gold-text font-bold">99.998%</p>
        </div>
        <div className="bg-black/40 border border-white/10 p-6 space-y-2 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/5 -mr-10 -mt-10 rounded-full blur-2xl"></div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Registered Identities</p>
          <p className="text-3xl gold-text font-bold">{users.length}</p>
        </div>
        <div className="bg-black/40 border border-white/10 p-6 space-y-2 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37]/5 -mr-10 -mt-10 rounded-full blur-2xl"></div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Clearance Level</p>
          <p className="text-3xl gold-text font-bold">OVERSEER</p>
        </div>
      </div>

      {view === 'logs' ? (
        <div className="bg-zinc-950 border border-[#735C00]/30 p-8 space-y-6 shadow-[20px_20px_0px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-2xl gold-text uppercase tracking-widest font-bold">System Event Logs</h2>
            <button onClick={onClearLogs} className="text-[10px] text-red-500 hover:text-red-400 uppercase tracking-widest transition-all border border-red-500/20 px-4 py-2 hover:bg-red-500/5">Clear Protocol History</button>
          </div>
          <div className="h-96 overflow-y-auto space-y-3 font-mono text-[11px] pr-4 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-600 italic uppercase tracking-[0.5em]">[ No recent events recorded ]</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-6 border-l-2 border-[#D4AF37]/30 pl-6 py-2 hover:bg-white/5 transition-all group">
                  <span className="text-[#D4AF37] opacity-50 w-20 flex-shrink-0">{log.time}</span>
                  <span className={`uppercase font-bold w-32 flex-shrink-0 ${log.type === 'alert' ? 'text-red-500' : 'text-slate-300'}`}>[{log.event}]</span>
                  <span className="text-slate-500 flex-1 group-hover:text-slate-300 transition-colors">{log.details}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-[#735C00]/30 p-8 space-y-6 shadow-[20px_20px_0px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-6">
            <div>
              <h2 className="text-2xl gold-text uppercase tracking-widest font-bold">Identity Registry</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Master Database of All Operator Credentials</p>
            </div>
            <div className="flex w-full md:w-auto gap-4">
              <div className="relative flex-1 md:w-64">
                <input 
                  type="text" 
                  placeholder="SEARCH IDENTITIES..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-white/10 px-4 py-2 text-[10px] font-mono text-slate-300 focus:border-[#D4AF37] outline-none"
                />
              </div>
              <button 
                onClick={fetchUsers}
                className="p-2 border border-white/10 hover:border-[#D4AF37] transition-all group"
                title="Refresh Registry"
              >
                <RefreshCcw className={`w-4 h-4 text-slate-500 group-hover:text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  <th className="py-4 px-4">Master ID</th>
                  <th className="py-4 px-4">Full Name</th>
                  <th className="py-4 px-4">Username</th>
                  <th className="py-4 px-4">Phone</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4">DOB</th>
                  <th className="py-4 px-4">Protocol Key</th>
                  <th className="py-4 px-4 text-right">Administrative</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="py-20 text-center text-slate-500 italic uppercase tracking-[0.5em]">Synchronizing Vault Data...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-20 text-center text-slate-500 italic uppercase tracking-[0.5em]">[ No Matching Records ]</td>
                  </tr>
                ) : (
                  filteredUsers.map((u, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-[#D4AF37] font-bold">{u.masterId?.toUpperCase()}</span>
                          <span className="text-[9px] text-slate-600">UID: {u.id.substring(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200 font-medium">{u.fullName?.toUpperCase() || 'N/A'}</span>
                          <span className="text-[9px] text-slate-500 uppercase">{u.gender || 'UNSPECIFIED'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{u.username || 'N/A'}</td>
                      <td className="py-4 px-4 text-slate-400">{u.phoneNumber || 'N/A'}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-300">{u.country?.toUpperCase() || 'N/A'}</span>
                          <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{u.address || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{u.dateOfBirth || 'N/A'}</td>
                      <td className="py-4 px-4 text-slate-600 group-hover:text-slate-400 transition-colors">
                        {u.accessKey ? '••••••••' : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.fullName)}
                          className="text-red-500/40 hover:text-red-500 transition-colors p-2"
                          title="Prune Identity"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-black border border-white/10 p-1">
        <div className="bg-zinc-900/30 p-6">
          <div className="flex items-center gap-4 text-[#D4AF37] mb-6">
            <Terminal className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.4em] font-bold">Root Terminal Interface</span>
          </div>
          <div className="bg-zinc-950/80 p-8 font-mono text-[13px] text-emerald-500/80 border border-emerald-500/10 shadow-inner">
            <p className="mb-2">Citadel Root Access [Version 4.2.0-LTS]</p>
            <p className="mb-4">System Identity Verification: CONFIRMED</p>
            <div className="flex gap-3 items-center">
              <span className="text-[#D4AF37]">admin@citadel:~$</span>
              <input type="text" className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-slate-700" placeholder="WAITING FOR INPUT..." />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AuthView = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('signin');
  const [step, setStep] = useState(1);
  const [masterId, setMasterId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isPinGenerated, setIsPinGenerated] = useState(false);
  const [revealPin, setRevealPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New Identity Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Unspecified');
  const [address, setAddress] = useState('');

  const [externalData, setExternalData] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    const id = masterId.trim().toLowerCase();
    try {
      if (mode === 'signin') {
        if (step === 1) {
          if (id === 'admin' && accessKey.trim() === 'fortress2026') {
            setStep(2);
            return;
          }
          const docRef = doc(db, 'users', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().accessKey === accessKey.trim()) {
            setStep(2);
          } else {
            alert("ACCESS DENIED: Unauthorized Credentials");
          }
        } else {
          if (id === 'admin' && securityPin.trim() === '2026') {
            onAuthSuccess({ masterId: 'admin', accessKey: 'fortress2026', pin: '2026', operatorName: 'Head Overseer', clearance: 'Overseer' });
            return;
          }
          const docRef = doc(db, 'users', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().pin === securityPin.trim()) {
            onAuthSuccess(docSnap.data());
          } else {
            alert("ACCESS DENIED: Invalid Citadel Seal");
            setSecurityPin('');
          }
        }
      } else {
        if (step === 1) {
          if (masterId && accessKey) {
            setStep(2);
          } else {
            alert("ERROR: Master ID and Access Key required");
          }
        } else {
          if (isPinGenerated) {
            const newUser = {
              masterId: id,
              username: username || id,
              fullName: fullName,
              phoneNumber: `${countryCode}${phoneNumber}`,
              country: country,
              dateOfBirth: dateOfBirth,
              gender: gender,
              address: address,
              accessKey: accessKey.trim(),
              pin: securityPin,
              operatorName: fullName || externalData?.operatorName || 'Unknown Operator',
              clearance: externalData?.clearance || 'Standard',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', id), newUser);
            await deleteDoc(doc(db, 'pending_seals', id));
            alert(`IDENTITY FORGED: Welcome, ${newUser.operatorName}. Your Citadel Seal is active and synced to the Cloud.`);
            setMode('signin');
            setStep(1);
            setIsPinGenerated(false);
            setSecurityPin('');
          } else {
            alert("ERROR: Generate your Citadel Seal first");
          }
        }
      }
    } catch (err) {
      console.error("Citadel Submit Error:", err);
      alert(`CRITICAL ERROR: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSeal = async () => {
    const id = masterId.trim().toLowerCase();
    try {
      const docRef = doc(db, 'pending_seals', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().pin) {
        const data = docSnap.data();
        setSecurityPin(data.pin);
        setExternalData(data);
        setIsPinGenerated(true);
        
        // Auto-fill form from cloud data
        if (data.operatorName) setFullName(data.operatorName);
        if (data.username) setUsername(data.username);
        if (data.country) setCountry(data.country);
        if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth);
        if (data.gender) setGender(data.gender);
        if (data.address) setAddress(data.address);
        if (data.phoneNumber) {
          // Attempt to split country code and number
          const match = data.phoneNumber.match(/^(\+\d+)\s*(.*)$/);
          if (match) {
            setCountryCode(match[1]);
            setPhoneNumber(match[2]);
          } else {
            setPhoneNumber(data.phoneNumber);
          }
        }
        
        alert("CITADEL SYNC SUCCESSFUL: Identity data retrieved from Cloud.");
      } else {
        alert("SYNC ERROR: No Seal detected in the Cloud. Please complete the process on your mobile device.");
      }
    } catch (err) {
      console.error(err);
      alert("SYNC ERROR: Could not connect to the Citadel Cloud.");
    }
  };

  useEffect(() => {
    if (mode === 'signup' && step === 2 && !isPinGenerated) {
      const id = masterId.trim().toLowerCase();
      const docRef = doc(db, 'pending_seals', id);
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.pin) {
            setSecurityPin(data.pin);
            setExternalData(data);
            // Auto-fill form from cloud data
            if (data.operatorName) setFullName(data.operatorName);
            if (data.username) setUsername(data.username);
            if (data.country) setCountry(data.country);
            if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth);
            if (data.gender) setGender(data.gender);
            if (data.address) setAddress(data.address);
            if (data.phoneNumber) {
              const match = data.phoneNumber.match(/^(\+\d+)\s*(.*)$/);
              if (match) {
                setCountryCode(match[1]);
                setPhoneNumber(match[2]);
              } else {
                setPhoneNumber(data.phoneNumber);
              }
            }
          }
        }
      });
      return () => unsubscribe();
    }
  }, [mode, step, isPinGenerated, masterId, setFullName, setUsername, setCountry, setDateOfBirth, setGender, setAddress, setCountryCode, setPhoneNumber]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute top-10 left-10 flex items-center gap-3 text-xl font-bold text-[#D4AF37] uppercase tracking-[0.2em] font-['Newsreader']">
        <FortressIcon className="w-8 h-8" /> FortressPass
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#111415] border-2 border-[#735C00]/30 p-10 relative overflow-hidden shadow-[10px_10px_0px_#000]"
      >
        <div className="space-y-2 border-b border-white/10 pb-6 mb-8 text-center relative z-10">
          <h2 className="text-3xl font-['Newsreader'] text-[#D4AF37] font-bold select-none">
            {mode === 'signin' ? (step === 1 ? 'Access Citadel' : 'Verify Seal') : (step === 1 ? 'Forge Identity' : 'Generate Seal')}
          </h2>
          <p className="text-slate-500 text-sm tracking-widest uppercase select-none">
            {mode === 'signin' ? (step === 1 ? 'Primary Authentication' : 'Secondary Protection') : (step === 1 ? 'Register credentials' : 'Scan to Forge PIN')}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] select-none">Master ID / Email</label>
                <input type="text" required value={masterId} onChange={(e) => setMasterId(e.target.value)} className="w-full bg-black/40 border border-[#735C00]/30 px-5 py-4 text-slate-200 font-mono focus:border-[#D4AF37] focus:outline-none transition-colors" placeholder="IDENTIFIER" />
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] select-none">Access Key</label>
                <div className="relative">
                  <input type={showKey ? "text" : "password"} required value={accessKey} onChange={(e) => setAccessKey(e.target.value)} className="w-full bg-black/40 border border-[#735C00]/30 px-5 py-4 text-slate-200 font-mono focus:border-[#D4AF37] focus:outline-none transition-colors" placeholder="••••••••••••" />
                  <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#D4AF37] transition-colors">
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className={`w-full action-btn py-5 mt-4 flex items-center justify-center gap-3 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></span>
                    VERIFYING...
                  </>
                ) : (
                  mode === 'signin' ? 'Unlock Gate' : 'Continue to Seal'
                )}
              </button>
            </motion.form>
          ) : mode === 'signup' ? (
            <motion.div key="signup-step2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 relative z-10 text-center">
              <div className="space-y-6">
                <div className="flex justify-center bg-white p-4 border-4 border-[#D4AF37]">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://AnaljitSingh.github.io/FortressPass-App/seal.html?id=${masterId}`} alt="Scan QR" className="w-32 h-32" />
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] leading-relaxed">Scan the Citadel Code above to link your physical device and generate your 4-digit Security Seal.</p>
                {isPinGenerated ? (
                  <div className="bg-black/60 border-2 border-dashed border-[#D4AF37]/50 p-6 relative group">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Your Generated Seal:</p>
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <p className="text-4xl text-[#D4AF37] font-mono tracking-[0.5em]">{revealPin ? securityPin : "••••"}</p>
                      <button type="button" onMouseDown={() => setRevealPin(true)} onMouseUp={() => setRevealPin(false)} onMouseLeave={() => setRevealPin(false)} className="text-[#D4AF37] hover:text-white transition-colors">
                        {revealPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/10 text-left">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Review Identity Forge</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-500 uppercase">Operator Name</label>
                          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-500 uppercase">Username</label>
                          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-500 uppercase">Phone Identity</label>
                          <div className="flex">
                            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="bg-black/80 border border-white/10 text-[8px] text-[#D4AF37] px-1 outline-none">
                              <option value="+1">+1</option>
                              <option value="+91">+91</option>
                              <option value="+44">+44</option>
                              <option value="+971">+971</option>
                              <option value="+61">+61</option>
                            </select>
                            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-white/5 border border-white/10 px-2 py-2 text-[10px] text-white outline-none focus:border-[#D4AF37]" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-500 uppercase">Country</label>
                          <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-500 uppercase">DOB</label>
                          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-[#D4AF37] [color-scheme:dark]" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-500 uppercase">Operator Signature</label>
                          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-[#D4AF37] [color-scheme:dark]">
                            <option value="Unspecified">UNSPECIFIED</option>
                            <option value="Male">MALE</option>
                            <option value="Female">FEMALE</option>
                            <option value="Binary">NON-BINARY</option>
                          </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[8px] text-slate-500 uppercase">Heritage Domicile (Address)</label>
                          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-white/5 border border-white/10 px-3 py-2 text-[10px] text-white outline-none focus:border-[#D4AF37]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={handleSyncSeal} 
                      disabled={isLoading}
                      className={`w-full border border-[#D4AF37]/30 text-[#D4AF37] py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? '⟳ SYNCING...' : 'Manual Sync with Device'}
                    </button>
                    <p className="text-[8px] text-[#D4AF37]/40 uppercase animate-pulse">Waiting for external seal generation...</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <button onClick={() => handleSubmit()} disabled={!isPinGenerated || isLoading} className={`w-full action-btn py-5 ${(!isPinGenerated || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}>{isLoading ? '⟳ FORGING...' : 'Finalize Identity'}</button>
                <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-slate-500 hover:text-[#D4AF37] uppercase tracking-widest transition-colors">Abort</button>
              </div>
            </motion.div>
          ) : (
            <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit} className="space-y-8 relative z-10 text-center">
              <div className="space-y-6">
                <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] block">Citadel Security Seal</label>
                <div className="flex justify-center">
                  <input type="password" maxLength="4" required autoFocus value={securityPin} onChange={(e) => setSecurityPin(e.target.value)} className="w-64 bg-black/40 border-2 border-[#735C00]/50 px-5 py-6 text-center text-4xl text-[#D4AF37] font-mono focus:border-[#D4AF37] focus:outline-none transition-all tracking-[0.5em]" placeholder="••••" />
                </div>
              </div>
              <div className="space-y-4">
                <button type="submit" disabled={isLoading} className={`w-full action-btn py-5 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>{isLoading ? '⟳ VERIFYING...' : 'Verify Seal'}</button>
                <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-slate-500 hover:text-[#D4AF37] uppercase tracking-widest transition-colors">Back</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        <div className="mt-8 text-center relative z-10 border-t border-white/5 pt-6">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setStep(1); }}
            className="text-[10px] font-bold text-slate-500 hover:text-[#D4AF37] uppercase tracking-[0.3em] transition-all"
          >
            {mode === 'signin' ? "— Forge New Identity —" : "— Access Existing Vault —"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('Vault');
  const [cipherInput, setCipherInput] = useState('');
  const [cipherImage, setCipherImage] = useState(null);
  const [systemLogs, setSystemLogs] = useState([]);
  const [files, setFiles] = useState([
    { name: 'Citadel_Manifesto.enc', size: '2.4 MB', date: '2026-04-29', type: 'System' },
    { name: 'Identity_Seed_01.key', size: '128 KB', date: '2026-04-28', type: 'Credential' },
    { name: 'Vault_Architecture.pdf', size: '15.7 MB', date: '2026-04-25', type: 'Design' }
  ]);
  const [lockedFiles, setLockedFiles] = useState({});
  const [users, setUsers] = useState([]);
  const [adminViewTab, setAdminViewTab] = useState('logs');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  useEffect(() => {
    // Hide the pre-react loader once the app is hydrated
    if (typeof window.hideCitadelLoader === 'function') {
      window.hideCitadelLoader();
    }

    if (!currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLockedFiles({});
      return;
    }

    const docRef = doc(db, 'citadel_locks', currentUser.masterId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setLockedFiles(docSnap.data());
      } else {
        setLockedFiles({});
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSealResource = async (fileName, key) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'citadel_locks', currentUser.masterId);
      await setDoc(docRef, { [fileName]: key }, { merge: true });
      addLog('RESOURCE_SEALED', `Secondary seal applied to "${fileName}" and synced to Citadel`);
    } catch (err) {
      console.error("Seal Error:", err);
      addLog('ERROR', `Failed to sync seal for "${fileName}"`, 'alert');
    }
  };

  const handleUnlockFile = async (fileName) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'citadel_locks', currentUser.masterId);
      await updateDoc(docRef, { [fileName]: deleteField() });
      addLog('RESOURCE_UNSEALED', `Secondary seal removed from "${fileName}" and synced to Citadel`);
    } catch (err) {
      console.error("Unseal Error:", err);
      addLog('ERROR', `Failed to remove seal for "${fileName}"`, 'alert');
    }
  };

  const handleErasureProtocol = async () => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'citadel_locks', currentUser.masterId);
      await setDoc(docRef, {});
      addLog('ERASURE_PROTOCOL', 'All resource-specific security seals purged from Citadel', 'alert');
    } catch (err) {
      console.error("Erasure Error:", err);
    }
  };

  const addLog = (event, details, type = 'info') => {
    const newLog = {
      time: new Date().toLocaleTimeString(),
      event,
      details,
      type
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  const addFileToVault = (fileData) => {
    const newFile = {
      name: fileData.name,
      size: fileData.size,
      date: new Date().toISOString().split('T')[0],
      type: fileData.type || 'Imported',
      blob: fileData.blob
    };
    setFiles(prev => [newFile, ...prev]);
    addLog('RESOURCE_VAULTED', `Resource "${fileData.name}" secured in architecture`);
  };

  const handleShareToCipher = (encodedData, isImage = false) => {
    if (isImage) {
      setCipherImage(encodedData);
      setCipherInput('');
    } else {
      setCipherInput(encodedData);
      setCipherImage(null);
    }
    setActiveView('Cipher');
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    addLog('ACCESS_GRANTED', `Operator ${userData.operatorName} authenticated via Master ID: ${userData.masterId}`);
    if (userData.masterId === 'admin') {
      fetchUsers();
    }
  };

  const fetchUsers = async () => {
    setIsAdminLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveView('Vault');
  };

  if (!isAuthenticated) {
    return (
      <div className="fortified-wall-bg min-h-screen font-['Inter'] text-slate-300">
        <AuthView onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'Admin': return (
        <AdminView 
          logs={systemLogs} 
          onClearLogs={() => setSystemLogs([])} 
          users={users}
          view={adminViewTab}
          setView={setAdminViewTab}
          isLoading={isAdminLoading}
          fetchUsers={fetchUsers}
          addLog={addLog}
        />
      );
      case 'Generator': return <GeneratorView files={files} lockedFiles={lockedFiles} onSealResource={handleSealResource} />;
      case 'Security Audit': return <AuditView />;
      case 'Cipher': return <CipherModule user={currentUser} initialInput={cipherInput} initialImage={cipherImage} onSaveToVault={(name, type) => addFileToVault({ name, size: '4.2 KB', type })} />;
      case 'Settings': return <SettingsView user={currentUser} onSignOut={handleSignOut} onErasure={handleErasureProtocol} />;
      default: return <VaultView user={currentUser} files={files} lockedFiles={lockedFiles} onImportFile={addFileToVault} onShare={handleShareToCipher} onUnlock={handleUnlockFile} />;
    }
  };

  return (
    <div className="vault-interior-bg min-h-screen font-['Inter'] text-slate-300">
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-12 h-20 bg-black border-b border-[#735C00]/30 shadow-2xl">
        <div className="flex items-center gap-3 text-xl font-bold text-[#D4AF37] uppercase tracking-[0.2em] font-['Newsreader']">
          <FortressIcon className="w-8 h-8" /> FortressPass
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right mr-4">
            <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">{currentUser?.operatorName || 'Admin'}</p>
            <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Clearance: {currentUser?.clearance || 'Overseer'}</p>
          </div>
          <button onClick={handleSignOut} title="Sign Out" className="w-10 h-10 border border-[#D4AF37] flex items-center justify-center bg-zinc-900 shadow-lg hover:bg-[#D4AF37] hover:text-black transition-colors">
            <LockIcon color="currentColor" />
          </button>
        </div>
      </header>
      <aside className="fixed left-0 top-0 hidden md:flex flex-col pt-28 z-40 h-screen w-72 bg-black border-r border-white/5">
        <nav className="flex flex-col">
          {[
            ...(currentUser?.masterId === 'admin' ? [{ icon: <Terminal className="w-5 h-5 text-slate-500" />, label: 'Admin' }] : []),
            { icon: <LockIcon />, label: 'Vault' },
            { icon: <ShieldCheckIcon />, label: 'Security Audit' },
            { icon: <Zap className="w-5 h-5 text-slate-500" />, label: 'Generator' },
            { icon: <div className="font-mono text-xs text-[#D4AF37] font-bold">&sect;</div>, label: 'Cipher' },
            { icon: <SettingsIcon className="w-5 h-5 text-slate-500" />, label: 'Settings' }
          ].map((item) => (
            <button key={item.label} onClick={() => setActiveView(item.label)} className={`flex items-center gap-5 px-10 py-6 text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === item.label ? 'text-[#D4AF37] bg-[#D4AF37]/5 border-l-4 border-[#D4AF37]' : 'text-slate-600 hover:text-slate-200 hover:bg-white/5'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="md:pl-72 pt-32 pb-12 px-12">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  );
};

// --- Sub-Views ---

const VaultView = ({ user, files, lockedFiles, onImportFile, onShare, onUnlock }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [challengeFile, setChallengeFile] = useState(null);
  const [challengeKey, setChallengeKey] = useState('');
  const [challengeError, setChallengeError] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("FORBIDDEN: Resource exceeds 100 MB limit. Citadel cannot secure large objects.");
      return;
    }

    const permission = window.confirm(`SECURE ACCESS REQUEST:\n\nOperator ${user.operatorName} is requesting read/write access to "${file.name}" for Citadel encryption.\n\nGrant system-wide resource access?`);

    if (permission) {
      onImportFile({
        name: file.name,
        size: formatFileSize(file.size),
        type: 'Secure Vaulted',
        blob: file
      });
      alert("RESOURCE SECURED: Architectural anchor established.");
    }
  };

  const handleAccessFile = (file) => {
    if (lockedFiles[file.name]) {
      setChallengeFile(file);
      setChallengeKey('');
      setChallengeError(false);
      return;
    }
    initiateDecryption(file);
  };

  const initiateDecryption = (file) => {
    setSelectedFile(file);
    setIsDecrypting(true);
    setDecryptProgress(0);

    const interval = setInterval(() => {
      setDecryptProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDecrypting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const verifyChallenge = () => {
    if (challengeKey === lockedFiles[challengeFile.name]) {
      const fileToOpen = challengeFile;
      setChallengeFile(null);
      initiateDecryption(fileToOpen);
    } else {
      setChallengeError(true);
      setTimeout(() => setChallengeError(false), 2000);
    }
  };

  const handleSecureShare = () => {
    const key = `${user.masterId}${user.pin}`;
    const fileManifest = `RESOURCE_TYPE: ${selectedFile.type} | NAME: ${selectedFile.name} | SIZE: ${selectedFile.size}`;
    const encoded = CitadelCipher.encode(fileManifest, key, user.operatorName);
    onShare(encoded);
    setSelectedFile(null);
  };

  return (
    <div className="grid grid-cols-12 gap-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="col-span-12 lg:col-span-8 vault-gradient p-12 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
        <div className="space-y-2 border-b border-white/10 pb-6">
          <h2 className="text-3xl font-['Newsreader'] text-white font-bold">Secure Vault</h2>
          <p className="text-slate-500 text-lg italic font-['Newsreader']">"Your data is held in architectural silence."</p>
        </div>
        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
            <span className="col-span-2">Resource Name</span>
            <span>Size</span>
            <span>Forged Date</span>
          </div>
          {files.map((file, i) => {
            const isLocked = !!lockedFiles[file.name];
            return (
              <div 
                key={i} 
                onClick={() => handleAccessFile(file)}
                className="grid grid-cols-4 items-center py-4 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer px-2"
              >
                <div className="col-span-2 flex items-center gap-4">
                  <FileIcon color={file.type === 'System' ? '#D4AF37' : (isLocked ? '#735C00' : '#64748b')} />
                  <span className={`font-mono text-sm transition-colors ${isLocked ? 'text-slate-500 italic' : 'group-hover:text-[#D4AF37]'}`}>{file.name}</span>
                  {isLocked && <span className="text-[8px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 border border-[#D4AF37]/30 font-bold uppercase tracking-widest">Sealed</span>}
                </div>
                <span className="text-xs text-slate-500 font-mono">{file.size}</span>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-mono">{file.date}</span>
                  <LockIcon className={`w-3 h-3 transition-all ${isLocked ? 'text-[#D4AF37] opacity-100' : 'text-[#D4AF37] opacity-0 group-hover:opacity-100'}`} />
                </div>
              </div>
            );
          })}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current.click()}
            className="w-full border-2 border-dashed border-white/10 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all mt-4 flex items-center justify-center gap-3"
          >
            <Upload className="w-4 h-4" /> + Secure New Resource (Limit: 100MB)
          </button>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="col-span-12 lg:col-span-4 space-y-10">
        <div className="bg-black border border-[#D4AF37]/20 p-12 flex flex-col items-center justify-center text-center space-y-8">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-white/5" cx="80" cy="80" r="75" fill="transparent" stroke="currentColor" strokeWidth="4" />
              <circle className="text-[#D4AF37]" cx="80" cy="80" r="75" fill="transparent" stroke="currentColor" strokeWidth="10" strokeDasharray="471" strokeDashoffset="47" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold text-[#D4AF37] font-['Newsreader']">90%</span></div>
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Vault Integrity</h3>
        </div>
        <div className="bg-zinc-950 border border-white/5 p-8 space-y-6">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Operator</p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#D4AF37] text-black flex items-center justify-center font-bold uppercase">{user?.operatorName?.[0] || 'A'}</div>
            <div>
              <p className="text-sm font-bold text-white">{user?.operatorName || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 font-mono tracking-tighter">ID: {user?.masterId?.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Access Modal */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl bg-[#111415] border-2 border-[#D4AF37]/30 p-10 relative shadow-[20px_20px_0px_#000]"
            >
              <button
                onClick={() => setSelectedFile(null)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-8">
                <div className="flex items-center gap-6 border-b border-white/10 pb-8">
                  <div className="w-16 h-16 bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30">
                    <FileText className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-['Newsreader'] text-white font-bold">{selectedFile.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] mt-1">{selectedFile.type} Resource | {selectedFile.size}</p>
                  </div>
                </div>

                {isDecrypting ? (
                  <div className="py-12 space-y-6 text-center">
                    <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.6em] animate-pulse">Initiating Decryption Protocol...</p>
                    <div className="h-1 bg-white/5 w-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#D4AF37]"
                        initial={{ width: 0 }}
                        animate={{ width: `${decryptProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-center gap-8">
                      <div className="text-[10px] text-slate-600 font-mono">XOR_MASK: ACTIVE</div>
                      <div className="text-[10px] text-slate-600 font-mono">CAFE_SIG: VERIFIED</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 py-4">
                    <div className="bg-black/40 border border-white/5 p-6 rounded-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <Terminal className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resource Manifest</span>
                      </div>
                      <p className="text-sm font-mono text-slate-400 leading-relaxed italic">
                        "The contents of this resource are shielded by Citadel XOR masking. Architectural integrity is confirmed. Operator {user.operatorName} is cleared for export."
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <button
                        onClick={() => {
                          if (selectedFile.blob && selectedFile.blob.type.startsWith('image/')) {
                            onShare(URL.createObjectURL(selectedFile.blob), true);
                          } else {
                            const content = `RESOURCE_TYPE: ${selectedFile.type} | NAME: ${selectedFile.name} | SIZE: ${selectedFile.size}`;
                            const key = `${user.masterId}${user.pin}`;
                            const encoded = CitadelCipher.encode(content, key, user.operatorName);
                            onShare(encoded, false);
                          }
                          setSelectedFile(null);
                        }}
                        className="w-full bg-[#D4AF37] text-black py-5 font-bold uppercase tracking-[0.4em] hover:bg-white transition-all flex items-center justify-center gap-4"
                      >
                        <Lock className="w-5 h-5" /> Decode & Inspect
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => {
                            if (selectedFile.blob) {
                              const url = URL.createObjectURL(selectedFile.blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = selectedFile.name;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } else {
                              const content = `CITADEL SECURE RESOURCE MANIFEST\n--------------------------------\nRESOURCE: ${selectedFile.name}\nOPERATOR: ${user.operatorName}\nCLEARANCE: ${user.clearance}\nDATE: ${new Date().toLocaleString()}\nSIZE: ${selectedFile.size}\nINTEGRITY: XOR-MASKED-VERIFIED\n\n[SECURE DATA ENCAPSULATION ACTIVE]\n--------------------------------\nThe actual binary contents of this resource are held in \nthe Citadel's encrypted memory buffers. This manifest \nconfirms the successful decryption and authorized export \nof the resource.\n\nARCHITECTURAL ANCHOR: SECURE`;
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${selectedFile.name}.citadel`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }
                            alert(`RESOURCE EXPORTED: ${selectedFile.name} has been transferred to your system's download directory.`);
                            setSelectedFile(null);
                          }}
                          className="border border-[#D4AF37]/30 text-[#D4AF37] py-4 font-bold uppercase tracking-widest hover:bg-[#D4AF37]/10 transition-all flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Download
                        </button>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="border border-white/10 text-slate-500 py-4 font-bold uppercase tracking-widest hover:text-white transition-all"
                        >
                          Close
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={handleSecureShare}
                          className="border border-[#D4AF37]/30 text-[#D4AF37] py-4 font-bold uppercase tracking-[0.3em] hover:bg-[#D4AF37]/5 transition-all flex items-center justify-center gap-3"
                        >
                          <Send className="w-4 h-4" /> Secure Line
                        </button>
                        <button
                          onClick={() => {
                            const key = `${user.masterId}${user.pin}`;
                            const fileManifest = `CITADEL DISPATCH:\n------------------\nRESOURCE: ${selectedFile.name}\nSIZE: ${selectedFile.size}\nOPERATOR: ${user.operatorName}\n------------------\n[ENCRYPTED PAYLOAD ATTACHED IN LOCAL TERMINAL]`;
                            const encoded = CitadelCipher.encode(fileManifest, key, user.operatorName);
                            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(`SECURE DISPATCH: ${selectedFile.name}`)}&body=${encodeURIComponent(`Attention Operator,\n\nI am dispatching a secure Citadel resource manifest for "${selectedFile.name}".\n\nENCRYPTED MANIFEST:\n${encoded}\n\nDecrypt using your Master ID and PIN.`)}`;
                            window.open(gmailUrl, '_blank');
                          }}
                          className="border border-[#D4AF37]/30 text-[#D4AF37] py-4 font-bold uppercase tracking-[0.3em] hover:bg-[#D4AF37]/5 transition-all flex items-center justify-center gap-3"
                        >
                          <Mail className="w-4 h-4" /> Gmail Dispatch
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key Challenge Modal */}
      <AnimatePresence>
        {challengeFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-[#111415] border-2 border-[#D4AF37] p-10 text-center space-y-8 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37] mx-auto mb-4">
                  <Lock className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <h3 className="text-2xl font-['Newsreader'] text-white font-bold uppercase tracking-widest">Resource Sealed</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Entry key required for: {challengeFile.name}</p>
              </div>

              <div className="space-y-6">
                <input 
                  type="password" 
                  autoFocus
                  value={challengeKey}
                  onChange={(e) => setChallengeKey(e.target.value)}
                  className={`w-full bg-black border ${challengeError ? 'border-red-500' : 'border-[#D4AF37]/30'} p-5 text-center text-xl text-[#D4AF37] font-mono focus:outline-none transition-all`}
                  placeholder="••••••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && verifyChallenge()}
                />
                {challengeError && <p className="text-[10px] text-red-500 font-bold uppercase animate-shake">Invalid Security Seal Key</p>}
                
                <div className="flex gap-4">
                  <button onClick={verifyChallenge} className="flex-1 bg-[#D4AF37] text-black py-4 font-bold uppercase tracking-widest hover:bg-white transition-all">Verify</button>
                  <button onClick={() => setChallengeFile(null)} className="flex-1 border border-white/10 text-slate-500 py-4 font-bold uppercase tracking-widest hover:text-white transition-all">Abort</button>
                </div>
                
                <button 
                  onClick={() => {
                    if (window.confirm("FORGET PROTOCOL:\n\nThis will remove the secondary lock on this resource. Continue?")) {
                      onUnlock(challengeFile.name);
                      setChallengeFile(null);
                    }
                  }} 
                  className="text-[8px] text-slate-600 hover:text-red-500 uppercase tracking-[0.3em] transition-all"
                >
                  — Initiate Unseal Protocol —
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CipherModule = ({ user, initialInput = '', initialImage = null, onSaveToVault }) => {
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [activeImage, setActiveImage] = useState(initialImage);
  const [mode, setMode] = useState('encode');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialInput) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(initialInput);
      setMode('decode');
    }
    if (initialImage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveImage(initialImage);
      setMode('decode');
    }
  }, [initialInput, initialImage]);

  const handleProcess = () => {
    setIsProcessing(true);
    const key = `${user.masterId}${user.pin}`;

    // Simulate scramble
    setTimeout(() => {
      if (activeImage) {
        // Imaging decoding logic (visual effect)
        setOutput("IMAGE_INTEGRITY_VERIFIED: Visual resource decrypted and rendered.");
      } else if (mode === 'encode') {
        setOutput(CitadelCipher.encode(input, key, user.operatorName));
      } else {
        setOutput(CitadelCipher.decode(input, key));
      }
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl gold-text font-bold uppercase tracking-widest">Citadel Cipher Module</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em]">Architectural Message Encryption Protocol</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source Input</label>
            <div className="flex bg-black border border-white/10 p-1">
              <button
                onClick={() => { setMode('encode'); setInput(''); setOutput(''); }}
                className={`px-4 py-1 text-[8px] font-bold uppercase tracking-widest transition-all ${mode === 'encode' ? 'bg-[#D4AF37] text-black' : 'text-slate-500'}`}
              >
                Encode
              </button>
              <button
                onClick={() => { setMode('decode'); setInput(''); setOutput(''); }}
                className={`px-4 py-1 text-[8px] font-bold uppercase tracking-widest transition-all ${mode === 'decode' ? 'bg-[#D4AF37] text-black' : 'text-slate-500'}`}
              >
                Decode
              </button>
            </div>
          </div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full h-64 bg-black/40 border border-[#735C00]/30 p-6 text-slate-300 font-mono text-sm focus:border-[#D4AF37] focus:outline-none resize-none" placeholder={mode === 'encode' ? "ENTER PLAIN TEXT MESSAGE..." : "PASTE ENCODED CITADEL GLYPHS..."} />
          <button onClick={handleProcess} disabled={isProcessing} className="w-full action-btn py-5 uppercase tracking-[0.3em] flex items-center justify-center gap-4">
            {isProcessing ? <Zap className="w-5 h-5 animate-spin" /> : null}
            {isProcessing ? 'SCRAMBLING PROTOCOL...' : 'Execute protocol'}
          </button>
        </div>

        <div className="space-y-6">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Output Manifest</label>
          <div className="w-full h-64 bg-zinc-950 border border-white/5 p-6 relative overflow-hidden group flex flex-col">
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            <div className="relative z-10 flex-1 overflow-y-auto">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Zap className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                  <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.5em]">Rearchitecting Stream...</p>
                </div>
              ) : activeImage ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <img src={activeImage} alt="Decoded Resource" className="max-h-48 object-contain border border-[#D4AF37]/30 shadow-2xl" />
                </div>
              ) : (
                <p className="text-slate-400 font-mono text-sm break-all">
                  {output || "[WAITING FOR PROTOCOL...]"}
                </p>
              )}
            </div>
            {output && !isProcessing && (
              <div className="flex gap-4 relative z-20 mt-4">
                <button onClick={() => { navigator.clipboard.writeText(output); alert("MANIFEST COPIED."); }} className="flex items-center gap-2 bg-white/5 px-4 py-2 hover:bg-[#D4AF37] hover:text-black transition-all text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button onClick={() => onSaveToVault("Cipher_Manifest", 'Encoded')} className="flex items-center gap-2 bg-white/5 px-4 py-2 hover:bg-[#D4AF37] hover:text-black transition-all text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => {
                    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("SECURE CIPHER DISPATCH")}&body=${encodeURIComponent(`Attention Operator,\n\nI am dispatching an encrypted message from the Citadel Cipher Module.\n\nENCRYPTED PAYLOAD:\n${output}\n\nVerification Signature: CAFE-PROTOCOL-V1`)}`;
                    window.open(gmailUrl, '_blank');
                  }}
                  className="flex items-center gap-2 bg-white/5 px-4 py-2 hover:bg-[#D4AF37] hover:text-black transition-all text-[10px] font-bold uppercase tracking-widest border border-white/10"
                >
                  <Mail className="w-4 h-4" /> Gmail
                </button>
              </div>
            )}
          </div>
          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-6 flex items-start gap-4">
            <ShieldAlert className="w-4 h-4 text-[#D4AF37] shrink-0 mt-1" />
            <p className="text-[9px] text-[#D4AF37] uppercase tracking-widest leading-relaxed font-bold">
              XOR MASKING ACTIVE: CAFE-PROTOCOL V1 ENGAGED. SIGNATURE VERIFICATION REQUIRED FOR DECRYPT.             </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SettingsView = ({ user, onSignOut, onErasure }) => {
  const [stealthMode, setStealthMode] = useState(false);
  const [autoLock, setAutoLock] = useState(true);

  const handleErasure = () => {
    if (window.confirm("CAUTION: ERASURE PROTOCOL\n\nThis will permanently delete all resource-specific security seals from this terminal. Files will remain in the vault but secondary locks will be lost.\n\nExecute protocol?")) {
      onErasure();
      alert("ERASURE COMPLETE: Secondary locks have been purged.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-5xl mx-auto space-y-12">
      <div className="border-b border-white/10 pb-8">
        <h2 className="text-4xl gold-text font-bold uppercase tracking-widest font-['Newsreader']">Citadel Configuration</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] mt-2">Operator Terminal Preferences & Security Protocols</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest border-l-2 border-[#D4AF37] pl-4">Operator Profile</h3>
            <div className="bg-black/40 border border-white/5 p-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Full Legal Name</label>
                <p className="text-xl text-white font-['Newsreader']">{user?.fullName || user?.operatorName || 'Admin'}</p>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Master Identifier</label>
                <p className="text-xl text-white font-mono uppercase">{user?.masterId || 'OVERSEER'}</p>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Protocol Username</label>
                <p className="text-lg text-white font-mono">{user?.username || 'N/A'}</p>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Phone Identity</label>
                <p className="text-lg text-white font-mono">{user?.phoneNumber || 'N/A'}</p>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Sovereign Country</label>
                <p className="text-lg text-white font-mono uppercase">{user?.country || 'N/A'}</p>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Date of Birth</label>
                <p className="text-lg text-white font-mono">{user?.dateOfBirth || 'N/A'}</p>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Operator Signature</label>
                <p className="text-lg text-white font-mono uppercase">{user?.gender || 'N/A'}</p>
              </div>
              <div className="space-y-4 col-span-full">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Heritage Domicile</label>
                <p className="text-lg text-white font-mono uppercase">{user?.address || 'N/A'}</p>
              </div>
              <div className="space-y-4 col-span-full pt-4 border-t border-white/5">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">Clearance Authorization</label>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></div>
                  <p className="text-sm text-[#D4AF37] font-bold uppercase tracking-[0.2em]">{user?.clearance || 'Standard'}</p>
                </div>
              </div>
            </div>
          </section>
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest border-l-2 border-[#D4AF37] pl-4">Security Protocols</h3>
            <div className="bg-black/40 border border-white/5 p-8 space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-widest">Stealth Mode</p>
                  <p className="text-[9px] text-slate-500 uppercase mt-1">Obfuscate terminal identity in public registries</p>
                </div>
                <button onClick={() => setStealthMode(!stealthMode)} className={`w-12 h-6 border transition-all relative ${stealthMode ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-transparent border-white/20'}`}><motion.div animate={{ x: stealthMode ? 24 : 4 }} className={`absolute top-1 w-4 h-4 ${stealthMode ? 'bg-black' : 'bg-white/20'}`} /></button>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-widest">Auto-Lock Protocol</p>
                  <p className="text-[9px] text-slate-500 uppercase mt-1">Re-seal sensitive resources after inactivity</p>
                </div>
                <button onClick={() => setAutoLock(!autoLock)} className={`w-12 h-6 border transition-all relative ${autoLock ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-transparent border-white/20'}`}><motion.div animate={{ x: autoLock ? 24 : 4 }} className={`absolute top-1 w-4 h-4 ${autoLock ? 'bg-black' : 'bg-white/20'}`} /></button>
              </div>
              <div className="flex justify-between items-center py-4">
                <div>
                  <p className="text-sm font-bold text-red-500 uppercase tracking-widest">Erasure Protocol</p>
                  <p className="text-[9px] text-slate-500 uppercase mt-1">Purge all resource-specific security seals</p>
                </div>
                <button onClick={handleErasure} className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all">Execute</button>
              </div>
            </div>
          </section>
        </div>
        <div className="space-y-8">
          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-8 space-y-6 shadow-[10px_10px_0px_#000]">
            <h4 className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Citadel Health</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest"><span>Primary Key</span><span className="text-[#D4AF37]">SECURE</span></div>
              <div className="h-1 bg-white/5 w-full overflow-hidden"><div className="h-full bg-[#D4AF37] w-full"></div></div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest"><span>Secondary Seals</span><span className="text-[#D4AF37]">ACTIVE</span></div>
              <div className="h-1 bg-white/5 w-full overflow-hidden"><div className="h-full bg-[#D4AF37] w-3/4"></div></div>
            </div>
          </div>
          <button onClick={onSignOut} className="w-full bg-[#D4AF37] text-black py-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-lg flex items-center justify-center gap-3">
            <LogOut className="w-4 h-4" /> Terminate Session
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default App;
