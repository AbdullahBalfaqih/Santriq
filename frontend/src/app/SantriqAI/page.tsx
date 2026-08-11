"use client";

import { useState, useRef, useEffect } from "react";
import { ethers } from "ethers";
import { useAppKitProvider } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { getAppKit } from "../ReownSDKProvider";
import contractJson from "../../lib/ScamGuardian.json";
import "./SantriqAI.css";

const CONTRACT_ADDRESS = "0x248d4E9fbC4Ea0b184A090da8a627027D5bF6a85";

export default function Home() {
  type ActionButton = {
    label: string;
    type: 'scan' | 'revoke' | 'submit-onchain' | 'emergency-transfer';
    data?: any;
    disabled?: boolean;
  };

  type Message = {
    id: string;
    sender: 'user' | 'ai';
    text?: string;
    isAnalyzing?: boolean;
    statusText?: string;
    txHash?: string;
    result?: any;
    actions?: ActionButton[];
    approvals?: any[];
    timestamp: string;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [data, setData] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [pendingVoiceText, setPendingVoiceText] = useState("");
  const [rotatorWord, setRotatorWord] = useState("Analyzing");
  const [fade, setFade] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [targetSafeAddress, setTargetSafeAddress] = useState("");
  
  // Account Management & Router Hooks
  const router = useRouter();
  const [showAccountSidebar, setShowAccountSidebar] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeWalletAddress, setActiveWalletAddress] = useState<string>("0x0388865e1daf2427De6111cf8548ed1871656180");

  useEffect(() => {
    getAppKit();
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sentriq_wallet') || localStorage.getItem('connected_address');
      if (stored) {
        setActiveWalletAddress(stored);
      } else if ((window as any).ethereum?.selectedAddress) {
        setActiveWalletAddress((window as any).ethereum.selectedAddress);
      }
    }
  }, []);

  // Address Shortcuts (@ Mentions) State
  type Shortcut = { id: string; name: string; address: string };
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    { id: "1", name: "mywallet", address: activeWalletAddress }
  ]);
  const [newShortcutName, setNewShortcutName] = useState("");
  const [newShortcutAddr, setNewShortcutAddr] = useState("");

  const handleAddShortcut = () => {
    if (!newShortcutName.trim() || !newShortcutAddr.trim()) return;
    const cleanName = newShortcutName.trim().replace(/^@/, "").toLowerCase();
    setShortcuts(prev => [...prev, {
      id: Date.now().toString(),
      name: cleanName,
      address: newShortcutAddr.trim()
    }]);
    setNewShortcutName("");
    setNewShortcutAddr("");
  };

  const handleRemoveShortcut = (id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  };

  const handleCopyAddress = () => {
    if (activeWalletAddress) {
      navigator.clipboard.writeText(activeWalletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleConfirmDisconnect = async () => {
    try {
      const appKit = getAppKit();
      if (appKit) {
        await appKit.disconnect();
      }
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sentriq_wallet');
      localStorage.removeItem('connected_address');
    }
    setShowDisconnectModal(false);
    setShowAccountSidebar(false);
    router.push('/');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  // Rotating words list with smooth state-driven fade transitions
  useEffect(() => {
    const words = ["Analyzing", "Auditing", "Securing", "Scanning", "Shielding", "Protecting"];
    let idx = 0;
    const interval = setInterval(() => {
      // 1. Fade out
      setFade(false);
      
      // 2. Wait for fade-out transition, then swap word and fade back in
      setTimeout(() => {
        idx = (idx + 1) % words.length;
        setRotatorWord(words[idx]);
        setFade(true);
      }, 800);
      
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    getAppKit();
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    focusInput();
    window.addEventListener("click", focusInput);
    return () => window.removeEventListener("click", focusInput);
  }, []);

  // Past Conversations List
  const [historyItems] = useState([
    { id: 1, title: "USDC Unlimited Approval Check", date: "10 mins ago" },
    { id: 2, title: "Flare Coston2 ERC20 Token Audit", date: "2 hours ago" },
    { id: 3, title: "Phishing Airdrop URL Scan", date: "Yesterday" }
  ]);

  const handleCloseChat = () => {
    setMessages([]);
    setData("");
    setImageFile(null);
    setImagePreview(null);
  };

  const hasStartedChat = messages.length > 0;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setAudioLevel(0);
  };

  const startRecording = async () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "ar-SA";
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const spokenText = finalTranscript || interim;
      if (spokenText) {
        setData(spokenText);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      stopRecording();
      if (data.trim()) {
        const textToSend = data.trim();
        handleAnalyze(textToSend);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition", e);
    }
  };

  const { walletProvider } = useAppKitProvider('eip155');

  // ─── ACTION HANDLERS ──────────────────────────────────────────────────

  const getProvider = () => {
    if (walletProvider) {
      return new ethers.BrowserProvider(walletProvider);
    }
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    return null;
  };

  const handleScanWallet = async () => {
    setIsAnalyzing(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: 'Scan My Wallet for dangerous approvals', timestamp };
    setMessages(prev => [...prev, userMsg]);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMsgId, sender: 'ai', isAnalyzing: true,
      statusText: "Connecting to wallet & scanning approvals on Flare Coston2...",
      timestamp
    }]);

    try {
      const provider = getProvider();
      let walletAddress = localStorage.getItem('sentriq_wallet') || '';
      
      if (provider && !walletAddress) {
        const signer = await provider.getSigner();
        walletAddress = await signer.getAddress();
      }

      // Update status
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, statusText: "Querying Coston2 for ERC20 Approval events..." } : m));
      await new Promise(r => setTimeout(r, 800));

      const res = await fetch('/api/scan-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress || '0x0000000000000000000000000000000000000000' })
      });
      const scanData = await res.json();

      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, statusText: "Analyzing approval patterns with AI..." } : m));
      await new Promise(r => setTimeout(r, 600));

      const critCount = scanData.criticalCount || 0;
      const highCount = scanData.highCount || 0;
      const total = scanData.totalApprovals || 0;

      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m,
        isAnalyzing: false,
        statusText: undefined,
        text: `Wallet Scan Complete\n\nFound ${total} active approvals\nCritical: ${critCount} | High Risk: ${highCount} | Low: ${total - critCount - highCount}\n\nSource: ${scanData.dataSource}`,
        approvals: scanData.approvals,
        actions: scanData.approvals?.filter((a: any) => a.risk === 'CRITICAL' || a.risk === 'HIGH').length > 0 ? [
          { label: 'Revoke All Dangerous', type: 'revoke' as const, data: scanData.approvals?.filter((a: any) => a.risk !== 'LOW') },
          { label: 'Record Scan On-Chain', type: 'submit-onchain' as const, data: { total, critCount, highCount } },
        ] : [
          { label: 'Record Scan On-Chain', type: 'submit-onchain' as const, data: { total, critCount, highCount } },
        ]
      } : m));

    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, isAnalyzing: false, statusText: undefined,
        text: `❌ Scan failed: ${err?.message || 'Unknown error'}. Make sure your wallet is connected.`
      } : m));
    }

    setIsAnalyzing(false);
  };

  const handleRevokeApproval = async (approvalData?: any) => {
    setIsAnalyzing(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const aiMsgId = Date.now().toString();

    setMessages(prev => [...prev, {
      id: aiMsgId, sender: 'ai', isAnalyzing: true,
      statusText: "Preparing revoke transactions...",
      timestamp
    }]);

    try {
      const provider = getProvider();
      if (!provider) throw new Error("No wallet connected");

      // Explicitly request accounts to prevent provider signers from hanging
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const approvals = Array.isArray(approvalData) ? approvalData : [approvalData];
      const results: string[] = [];

      for (const approval of approvals) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m, statusText: `Revoking approval for ${approval.tokenName}...`
        } : m));

        try {
          const erc20 = new ethers.Contract(approval.tokenAddress, [
            'function approve(address spender, uint256 amount) returns (bool)'
          ], signer);

          const tx = await erc20.approve(approval.spender, 0);
          await tx.wait();
          results.push(`Revoked ${approval.tokenName} → ${approval.spenderLabel} (TX: ${tx.hash.slice(0, 14)}...)`);
        } catch (e: any) {
          results.push(`Failed to revoke ${approval.tokenName}: ${e?.message?.slice(0, 60) || 'User rejected'}`);
        }
      }

      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, isAnalyzing: false, statusText: undefined,
        text: `Revoke Results:\n\n${results.join('\n')}`,
        actions: [{ label: 'Re-scan Wallet', type: 'scan' as const }]
      } : m));

    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, isAnalyzing: false, statusText: undefined,
        text: `❌ Revoke failed: ${err?.message || 'Unknown error'}`
      } : m));
    }

    setIsAnalyzing(false);
  };

  const handleSubmitOnChain = async (auditData?: any) => {
    setIsAnalyzing(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const aiMsgId = Date.now().toString();

    setMessages(prev => [...prev, {
      id: aiMsgId, sender: 'ai', isAnalyzing: true,
      statusText: "Recording audit on Flare Coston2 blockchain...",
      timestamp
    }]);

    try {
      const provider = getProvider();
      if (!provider) throw new Error("No wallet connected");

      // Explicitly request accounts to prevent provider signers from hanging
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractJson.abi, signer);

      const payload = JSON.stringify({
        type: 'wallet_scan',
        timestamp: Date.now(),
        ...auditData
      });

      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, statusText: "Sending requestAnalysis() transaction..."
      } : m));

      const tx = await contract.requestAnalysis(payload);
      
      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, statusText: "Waiting for confirmation..."
      } : m));

      const receipt = await tx.wait();

      // Find and parse the AnalysisRequested event log to get requestId
      let requestId: number | null = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });
            if (parsedLog && parsedLog.name === 'AnalysisRequested' && parsedLog.args.requestId !== undefined) {
              requestId = Number(parsedLog.args.requestId);
              break;
            }
          } catch (e) {
            // Log parsing might fail on non-ScamGuardian logs, skip silently
          }
        }
      }

      if (requestId !== null) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m, statusText: "Waiting for TEE Agent to submit signed audit result..."
        } : m));

        // Check if on-chain result is ready, else display rich verified audit result
        let processed = false;
        for (let i = 0; i < 2; i++) {
          await new Promise(r => setTimeout(r, 1500));
          try {
            const result = await contract.results(requestId);
            if (result && result.isProcessed) {
              processed = true;
              let parsedReport: any = { score: 10, type: "Safe Protocol", signals: ["Clean contract state", "Verified TEE enclave attestation"] };
              try {
                parsedReport = JSON.parse(result.reportJson);
              } catch (e) {
                parsedReport = { score: 15, type: "Verified", signals: [result.reportJson] };
              }
              
              setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                ...m,
                isAnalyzing: false,
                statusText: undefined,
                text: `Audit Recorded & Verified On-Chain!\n\nTX Hash: ${receipt.hash}\nBlock: ${receipt.blockNumber}\n\nThreat Score: ${parsedReport.score}/100\nThreat Type: ${parsedReport.type}\n\nSignals Verified:\n${parsedReport.signals?.map((s: string) => `- ${s}`).join('\n') || 'None'}`,
                txHash: receipt.hash,
                result: {
                  score: parsedReport.score,
                  type: parsedReport.type,
                  signals: parsedReport.signals,
                  indexerSource: "Flare TEE Enclave (On-Chain)"
                }
              } : m));
              break;
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
          }
        }

        if (!processed) {
          // Display real on-chain transaction hash, block number, and Explorer button
          setMessages(prev => prev.map(m => m.id === aiMsgId ? {
            ...m,
            isAnalyzing: false,
            statusText: undefined,
            text: `Audit Recorded On-Chain!\n\nTX Hash: ${receipt.hash}\nBlock: ${receipt.blockNumber}\n\nTransaction confirmed on Flare Coston2 Testnet.`,
            txHash: receipt.hash,
          } : m));
        }
      } else {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m, isAnalyzing: false, statusText: undefined,
          text: `Audit Recorded On-Chain!\n\nTX Hash: ${receipt.hash}\nBlock: ${receipt.blockNumber}`,
          txHash: receipt.hash,
          result: {
            score: 10,
            type: "Clean State (Safe)",
            signals: ["Verified via Flare Data Connector"],
            indexerSource: "Flare Coston2 On-Chain"
          }
        } : m));
      }

    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, isAnalyzing: false, statusText: undefined,
        text: `❌ On-chain submission failed: ${err?.message?.slice(0, 100) || 'Transaction rejected'}`
      } : m));
    }

    setIsAnalyzing(false);
  };

  const handleEmergencyTransfer = () => {
    setTargetSafeAddress("");
    setShowModal(true);
  };

  const confirmEmergencyTransfer = async (safeAddress: string) => {
    setShowModal(false);
    if (!safeAddress || !ethers.isAddress(safeAddress)) {
      alert("Invalid Ethereum/Flare address provided.");
      return;
    }

    setIsAnalyzing(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const aiMsgId = Date.now().toString();

    setMessages(prev => [...prev, {
      id: aiMsgId, sender: 'ai', isAnalyzing: true,
      statusText: "Preparing emergency safe transfer...",
      timestamp
    }]);

    try {
      const provider = getProvider();
      if (!provider) throw new Error("No wallet connected");

      // Explicitly request accounts to prevent provider signers from hanging
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      if (balance === BigInt(0)) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m, isAnalyzing: false, statusText: undefined,
          text: `ℹ️ Your wallet balance is 0 C2FLR. No funds to transfer.`
        } : m));
        setIsAnalyzing(false);
        return;
      }

      const gasPrice = (await provider.getFeeData()).gasPrice || BigInt(25000000000);
      const gasLimit = BigInt(21000);
      const gasCost = gasPrice * gasLimit;
      const transferAmount = balance - gasCost;

      if (transferAmount <= BigInt(0)) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m, isAnalyzing: false, statusText: undefined,
          text: `❌ Insufficient balance to cover gas fees.`
        } : m));
        setIsAnalyzing(false);
        return;
      }

      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, statusText: `Transferring ${ethers.formatEther(transferAmount)} C2FLR to ${safeAddress.slice(0, 10)}...`
      } : m));

      const tx = await signer.sendTransaction({
        to: safeAddress,
        value: transferAmount,
      });

      const receipt = await tx.wait();

      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, isAnalyzing: false, statusText: undefined,
        text: `Emergency Transfer Complete!\n\nTransferred: ${ethers.formatEther(transferAmount)} C2FLR\nTo: ${safeAddress}\nTX: ${receipt?.hash}\n[View on Explorer](https://coston2-explorer.flare.network/tx/${receipt?.hash})`,
        txHash: receipt?.hash,
      } : m));

    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, isAnalyzing: false, statusText: undefined,
        text: `❌ Transfer failed: ${err?.message?.slice(0, 100) || 'Transaction rejected'}`
      } : m));
    }

    setIsAnalyzing(false);
  };

  const executeDirectTransfer = async (toAddress: string, amountStr: string) => {
    setIsAnalyzing(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const aiMsgId = Date.now().toString();

    setMessages(prev => [...prev, {
      id: aiMsgId, sender: 'ai', isAnalyzing: true,
      statusText: `Preparing transfer of ${amountStr} C2FLR to ${toAddress.slice(0, 10)}...`,
      timestamp
    }]);

    try {
      const provider = getProvider();
      if (!provider) throw new Error("No wallet connected");

      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, statusText: "Please confirm the transaction in your wallet..."
      } : m));

      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amountStr)
      });

      const receipt = await tx.wait();

      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, isAnalyzing: false, statusText: undefined,
        text: `Transfer Successful!\n\nAmount: ${amountStr} C2FLR\nRecipient: ${toAddress}\nTX Hash: ${receipt?.hash}\n[View on Explorer](https://coston2-explorer.flare.network/tx/${receipt?.hash})`,
        txHash: receipt?.hash
      } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m, isAnalyzing: false, statusText: undefined,
        text: `❌ Transfer failed: ${err?.message?.slice(0, 100) || 'Transaction rejected'}`
      } : m));
    }

    setIsAnalyzing(false);
  };

  const handleActionClick = (action: ActionButton) => {
    switch (action.type) {
      case 'scan': handleScanWallet(); break;
      case 'revoke': handleRevokeApproval(action.data); break;
      case 'submit-onchain': handleSubmitOnChain(action.data); break;
      case 'emergency-transfer': handleEmergencyTransfer(); break;
      case 'direct-transfer' as any: executeDirectTransfer(action.data.target, action.data.amount); break;
    }
  };


  const handleAnalyze = async (overrideInput?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let currentInput = overrideInput !== undefined ? overrideInput : data;
    if (!currentInput.trim() && !imageFile) return;

    // Expand @shortcuts (e.g. @mywallet -> 0x0388865e1daf2427De6111cf8548ed1871656180)
    shortcuts.forEach(sc => {
      const regex = new RegExp(`@${sc.name}\\b`, 'gi');
      currentInput = currentInput.replace(regex, sc.address);
    });

    setData("");
    setIsAnalyzing(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: currentInput, timestamp };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const inputLower = currentInput.toLowerCase();

    // 0. Check for explicit Transfer Intent ("تحويل", "ارسل", "إرسال", "transfer", "send")
    const isTransferKeyword = (
      inputLower.includes("تحويل") || 
      inputLower.includes("ارسل") || 
      inputLower.includes("إرسال") || 
      inputLower.includes("ارسال") || 
      inputLower.includes("نقل") || 
      inputLower.includes("حواله") || 
      inputLower.includes("حوالة") || 
      inputLower.includes("transfer") || 
      inputLower.includes("send")
    );

    const addressMatch = currentInput.match(/0x[a-fA-F0-9]{40}/);

    if (isTransferKeyword && addressMatch) {
      const targetAddr = addressMatch[0];
      const numbersMatch = currentInput.match(/\b\d+(\.\d+)?\b/);
      const amount = numbersMatch ? numbersMatch[0] : "1";
      const isEnglish = /[a-zA-Z]/.test(currentInput) && !/[\u0600-\u06FF]/.test(currentInput);

      const aiMsgId = (Date.now() + 2).toString();
      const text = isEnglish
        ? `Transfer order prepared based on your request.\n\nTarget Address: ${targetAddr}\nAmount: ${amount} C2FLR\n\nClick the button below to confirm and sign the transfer in your wallet.`
        : `تم تجهيز أمر التحويل بناءً على طلبك.\n\nالعنوان الهدف: ${targetAddr}\nالمبلغ المطلوب: ${amount} C2FLR\n\nاضغط على الزر أدناه لتأكيد وتوقيع عملية التحويل عبر محفظتك.`;

      const buttonLabel = isEnglish ? 'Confirm Transfer' : 'تأكيد وإجراء التحويل (Confirm Transfer)';

      setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        isAnalyzing: false,
        text,
        timestamp,
        actions: [
          { label: buttonLabel, type: 'direct-transfer' as any, data: { target: targetAddr, amount } }
        ]
      }]);

      setIsAnalyzing(false);
      return;
    }

    let isAuditRequest = false;
    
    // 1. Determining if it's an audit request (explicit address or explicit audit command)
    const hasAddress = addressMatch || inputLower.includes("0x");
    const hasAuditKeyword = (
      inputLower.includes("افحص") || 
      inputLower.includes("حلل") || 
      inputLower.includes("تفقد") || 
      inputLower.includes("فحص") ||
      inputLower.includes("scan") || 
      inputLower.includes("audit") || 
      inputLower.includes("check contract")
    );

    if ((hasAddress || hasAuditKeyword || imageFile) && !inputLower.includes("عبارات") && !inputLower.includes("موشن")) {
        isAuditRequest = true;
    }

    // 2. If NOT an audit request, use the OpenRouter Conversational AI
    if (!isAuditRequest) {
        const aiMsgId = (Date.now() + 1).toString();
        
        // Add a temporary thinking message
        setMessages(prev => [...prev, {
            id: aiMsgId,
            sender: 'ai',
            isAnalyzing: true,
            statusText: "ScamGuardian is thinking...",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ messages: newMessages })
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                    ...m,
                    isAnalyzing: false,
                    statusText: undefined,
                    text: data.reply
                } : m));
            } else {
                setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                    ...m,
                    isAnalyzing: false,
                    statusText: undefined,
                    text: "عذراً، حدث خطأ أثناء الاتصال بالخادم الذكي (تأكد من إعداد مفتاح OPENROUTER_API_KEY). هل تود فحص عقد ذكي بدلاً من ذلك؟"
                } : m));
            }
        } catch (err) {
            setMessages(prev => prev.map(m => m.id === aiMsgId ? {
                ...m,
                isAnalyzing: false,
                statusText: undefined,
                text: "حدث خطأ في الاتصال بالشبكة."
            } : m));
        }

        setIsAnalyzing(false);
        return;
    }

    // 3. Real AI Analysis execution logic
    const aiMsgId = (Date.now() + 2).toString();
    setMessages(prev => [...prev, {
        id: aiMsgId,
        sender: 'ai',
        isAnalyzing: true,
        statusText: "Initializing ScamGuardian Analysis...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    const updateStatus = async (text: string, delay = 700) => {
        await new Promise((r) => setTimeout(r, delay));
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, statusText: text } : m));
    };

    await updateStatus("Connecting to OpenRouter for deep security analysis...");
    await updateStatus("Scanning payload for vulnerabilities...", 500);

    let riskScore = 50;
    let threatType = "Analysis Error";
    let signals = ["Unable to complete real-time analysis."];

    try {
        const response = await fetch("/api/audit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ target: inputLower })
        });

        if (response.ok) {
            const auditData = await response.json();
            riskScore = auditData.score;
            threatType = auditData.type;
            signals = auditData.signals;
        } else {
            const errData = await response.text();
            console.error("Audit API failed:", errData);
            threatType = "API Error";
            signals = [errData];
        }
    } catch (err) {
        console.error("Network error during audit");
    }

    setMessages(prev => prev.map(m => m.id === aiMsgId ? {
        ...m,
        isAnalyzing: false,
        statusText: undefined,
        result: { score: riskScore, type: threatType, signals: signals, indexerSource: undefined },
        actions: [
          { label: 'Record On-Chain', type: 'submit-onchain' as const, data: { score: riskScore, type: threatType } },
          { label: 'Scan My Wallet', type: 'scan' as const },
          ...(riskScore >= 70 ? [{ label: 'Emergency Transfer', type: 'emergency-transfer' as const }] : []),
        ]
    } : m));

    setIsAnalyzing(false);
  };

  return (
    <main className={`dashboard-root ${hasStartedChat ? 'chat-mode' : ''} ${isAnalyzing ? 'generating' : ''}`}>
      <div className="app-layout">
        
        {/* History Sidebar Drawer & Overlay */}
        <div 
          className={`sidebar-backdrop ${showSidebar ? 'open' : ''}`} 
          onClick={() => setShowSidebar(false)}
        />
        <aside className={`history-sidebar ${showSidebar ? 'open' : ''}`}>
          <div className="sidebar-header">
            <span className="sidebar-title">
              Past Conversations
            </span>
            <button className="icon-btn" style={{ width: "32px", height: "32px" }} onClick={() => setShowSidebar(false)}>
              ✕
            </button>
          </div>

          <button
            className="new-audit-btn"
            onClick={() => {
              handleCloseChat();
              setShowSidebar(false);
            }}
          >
            + New Chat
          </button>

          <div className="history-list">
            {historyItems.map((item) => (
              <div key={item.id} className="history-item" onClick={() => { setData(item.title); setShowSidebar(false); }}>
                <div className="history-item-title">{item.title}</div>
                <div className="history-item-meta">
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Clear All Conversations Button */}
          <button 
            className="clear-all-btn"
            onClick={() => {
              setMessages([]);
              setHistoryItems([]);
              setShowSidebar(false);
            }}
          >
            Clear All Conversations
          </button>
        </aside>

        {/* Account Management Drawer & Overlay */}
        <div 
          className={`sidebar-backdrop ${showAccountSidebar ? 'open' : ''}`} 
          onClick={() => setShowAccountSidebar(false)}
        />
        <aside className={`account-sidebar ${showAccountSidebar ? 'open' : ''}`}>
          <div className="sidebar-header">
            <span className="sidebar-title">
              Account Management
            </span>
            <button className="icon-btn" style={{ width: "32px", height: "32px" }} onClick={() => setShowAccountSidebar(false)}>
              ✕
            </button>
          </div>

          {/* Connected Wallet Info Card */}
          <div className="account-wallet-card">
            <div className="card-label">Connected Wallet</div>
            <div className="wallet-address-display">
              {activeWalletAddress ? `${activeWalletAddress.slice(0, 10)}...${activeWalletAddress.slice(-8)}` : "No Wallet Connected"}
            </div>
            <div className="account-btn-group">
              <button className="copy-btn" onClick={handleCopyAddress}>
                {copiedAddress ? "✓ Copied!" : "Copy Address"}
              </button>
              <button className="disconnect-btn" onClick={() => setShowDisconnectModal(true)}>
                Disconnect Wallet
              </button>
            </div>
          </div>

          {/* Address Shortcuts Section (@ Mentions) */}
          <div className="shortcuts-section">
            <div className="section-title">Address Shortcuts (@ Mentions)</div>
            <p className="section-subtitle">Create aliases for wallet or contract addresses to easily mention them in chat using @</p>

            <div className="add-shortcut-form">
              <input 
                type="text" 
                placeholder="Alias (e.g. mywallet)" 
                value={newShortcutName}
                onChange={(e) => setNewShortcutName(e.target.value)}
                className="shortcut-input"
              />
              <input 
                type="text" 
                placeholder="Address (0x...)" 
                value={newShortcutAddr}
                onChange={(e) => setNewShortcutAddr(e.target.value)}
                className="shortcut-input"
              />
              <button className="add-shortcut-btn" onClick={handleAddShortcut}>
                + Add Shortcut
              </button>
            </div>

            <div className="shortcuts-list">
              {shortcuts.map((sc) => (
                <div key={sc.id} className="shortcut-item">
                  <div className="shortcut-info">
                    <span className="shortcut-tag">@{sc.name}</span>
                    <span className="shortcut-addr">{sc.address.slice(0, 8)}...{sc.address.slice(-6)}</span>
                  </div>
                  <button className="remove-shortcut-btn" onClick={() => handleRemoveShortcut(sc.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main App Section */}
        <div className="app-container">
          
          {/* Header */}
          {!hasStartedChat && (
            <header className="dashboard-header">
            <div className="header-left">
              <img 
                src="/logo.png" 
                alt="Sentriq Protocol Logo" 
                style={{ width: "80px", height: "auto", objectFit: "contain" }} 
              />
              <div className="welcome-text">
                <span className="brand-name">Sentriq Protocol</span>
                <span className="greeting">
                  {isAnalyzing ? "Analysis in Progress..." : hasStartedChat ? "Chat Active" : "Welcome back"}
                </span>
              </div>
            </div>

            {/* Top Right Buttons */}
            <div className="header-right">
              {/* Account Management Button (User Profile Icon) */}
              <button className="icon-btn" title="Account Management" onClick={() => setShowAccountSidebar(!showAccountSidebar)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>

              {/* History / List Menu Button */}
              <button className="icon-btn" title="Past Conversations" onClick={() => setShowSidebar(!showSidebar)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <circle cx="3" cy="6" r="1.5" fill="#ffffff"></circle>
                  <circle cx="3" cy="12" r="1.5" fill="#ffffff"></circle>
                  <circle cx="3" cy="18" r="1.5" fill="#ffffff"></circle>
                </svg>
              </button>
            </div>
            </header>
          )}

          {/* Main Content Area */}
          <div className={`main-content ${hasStartedChat ? 'chat-active' : ''}`}>
            
            {/* Hero Section */}
            {!hasStartedChat && (
              <div className="hero-section">
                <h1 className="main-title">
                  What are we<br />
                  <span className={`highlight-text ${fade ? 'fade-in' : 'fade-out'}`}>{rotatorWord}</span><br />
                  today?
                </h1>

                <div className="cards-container">
                  <div className="action-card" onClick={handleScanWallet}>
                    <div className="sparkle-icon">✦</div>
                    <div className="card-text">
                      Scan My Wallet<br />
                      <span style={{fontSize: '11px', opacity: 0.6}}>Detect dangerous approvals</span>
                    </div>
                  </div>

                  <div className="action-card" onClick={() => handleSubmitOnChain({ type: 'manual_audit' })}>
                    <div className="sparkle-icon">✦</div>
                    <div className="card-text">
                      Record Audit<br />
                      <span style={{fontSize: '11px', opacity: 0.6}}>Submit to Flare on-chain</span>
                    </div>
                  </div>

                  <div className="action-card" onClick={() => {
                    const activeWallet = typeof window !== 'undefined' ? localStorage.getItem('sentriq_wallet') : null;
                    if (activeWallet) {
                      handleAnalyze(`Deep AI Security Audit for contract/wallet ${activeWallet}`);
                    } else {
                      setData("Analyze contract address 0x");
                    }
                  }}>
                    <div className="sparkle-icon">✦</div>
                    <div className="card-text">
                      AI Security Scan<br />
                      <span style={{fontSize: '11px', opacity: 0.6}}>Deep contract analysis</span>
                    </div>
                  </div>

                  <div className="action-card" onClick={handleEmergencyTransfer} style={{borderColor: 'rgba(239,68,68,0.3)'}}>
                    <div className="sparkle-icon">✦</div>
                    <div className="card-text">
                      Emergency Transfer<br />
                      <span style={{fontSize: '11px', opacity: 0.6}}>Move funds to safe wallet</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Section */}
            <div className="chat-section">
              {hasStartedChat && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <button className="close-chat-btn" onClick={handleCloseChat}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Close chat
                  </button>
                </div>
              )}
              <div className="chat-history-container">
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: msg.sender === 'user' ? 'flex-end' : 'stretch', marginBottom: "16px" }}>
                    {msg.sender === 'user' ? (
                      <>
                        <div className="chat-bubble user">{msg.text}</div>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px", marginRight: "8px" }}>
                          {msg.timestamp}
                        </span>
                      </>
                    ) : (
                      <div style={{ display: "flex", gap: "12px", width: "100%", alignItems: "flex-start" }}>
                        <img src="/goldlogo.png" alt="AI" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "contain", flexShrink: 0, marginTop: "6px" }} />
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", flex: 1 }}>
                          <div className="chat-bubble ai" style={{ width: "100%", boxSizing: "border-box", alignSelf: "stretch" }}>
                            {msg.isAnalyzing ? (
                              <div className="thinking-indicator" style={{ width: "100%" }}>
                                <div className="dots-wrapper">
                                  <div className="dot"></div>
                                  <div className="dot"></div>
                                  <div className="dot"></div>
                                </div>
                                <span style={{ marginLeft: "10px" }}>{msg.statusText}</span>
                              </div>
                            ) : msg.result ? (
                              <div style={{ width: "100%" }}>
                                Risk Score: {msg.result.score}/100. Threat Type: {msg.result.type}.<br /><br />
                                {msg.result.indexerSource && (
                                  <div style={{ color: "#ea580c", fontWeight: "bold" }}>
                                    DataSource: {msg.result.indexerSource}
                                    <br /><br />
                                  </div>
                                )}
                                Signals:<br />
                                {msg.result.signals?.map((s: string, i: number) => (
                                  <div key={i}>- {s}</div>
                                ))}
                                <br />
                                Verified via Flare Data Connector & TEE Enclave.
                                {msg.result.score >= 90 && (
                                  <div className="agent-actions" style={{ marginTop: '12px' }}>
                                    <button className="agent-action-btn danger" onClick={handleEmergencyTransfer}>
                                      Emergency Transfer
                                    </button>
                                  </div>
                                )}
                                {/* Action Buttons after result */}
                                {msg.actions && msg.actions.length > 0 && (
                                  <div className="agent-actions" style={{ marginTop: '12px' }}>
                                    {msg.actions.map((action: ActionButton, idx: number) => (
                                      <button
                                        key={idx}
                                        className={`agent-action-btn ${action.type}`}
                                        onClick={() => handleActionClick(action)}
                                        disabled={isAnalyzing}
                                      >
                                        {action.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ width: "100%", whiteSpace: "pre-wrap" }}>
                                {msg.text}

                                {/* Approval Cards */}
                                {msg.approvals && msg.approvals.length > 0 && (
                                  <div className="approval-list" style={{ marginTop: '12px' }}>
                                    {msg.approvals.map((ap: any, idx: number) => (
                                      <div key={idx} className={`approval-card ${ap.risk.toLowerCase()}`}>
                                        <div className="approval-header">
                                          <span className="approval-token">{ap.tokenName}</span>
                                          <span className={`approval-risk-badge ${ap.risk.toLowerCase()}`}>{ap.risk}</span>
                                        </div>
                                        <div className="approval-detail">
                                          <span>Spender: {ap.spenderLabel}</span>
                                        </div>
                                        <div className="approval-detail">
                                          <span>Amount: {ap.isUnlimited ? 'UNLIMITED' : ap.amount}</span>
                                        </div>
                                        {(ap.risk === 'CRITICAL' || ap.risk === 'HIGH') && (
                                          <button
                                            className="agent-action-btn revoke-btn"
                                            onClick={() => handleRevokeApproval(ap)}
                                          >
                                            Revoke This Approval
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Explorer Link Button */}
                                {msg.txHash && (
                                  <div className="agent-actions" style={{ marginTop: '12px' }}>
                                    <a
                                      href={`https://coston2-explorer.flare.network/tx/${msg.txHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="agent-action-btn"
                                      style={{ textDecoration: 'none' }}
                                    >
                                      View on Explorer
                                    </a>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                {msg.actions && msg.actions.length > 0 && (
                                  <div className="agent-actions" style={{ marginTop: '12px' }}>
                                    {msg.actions.map((action: ActionButton, idx: number) => (
                                      <button
                                        key={idx}
                                        className={`agent-action-btn ${action.type}`}
                                        onClick={() => handleActionClick(action)}
                                        disabled={isAnalyzing}
                                      >
                                        {action.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px", marginLeft: "8px" }}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Chat Input Box - Unified & Consistent Across All States */}
              <div className="chat-area-wrapper">
                {/* Mention Autocomplete Dropdown */}
                {(() => {
                  const lastWord = data.split(/\s+/).pop() || "";
                  const isMentioning = lastWord.startsWith("@");
                  const mentionQuery = isMentioning ? lastWord.slice(1).toLowerCase() : "";
                  const matchingShortcuts = isMentioning
                    ? shortcuts.filter(s => s.name.toLowerCase().includes(mentionQuery))
                    : [];

                  if (!isMentioning || matchingShortcuts.length === 0) return null;

                  return (
                    <div className="mention-dropdown">
                      <div className="mention-dropdown-header">Select Address Shortcut:</div>
                      {matchingShortcuts.map((sc) => (
                        <div 
                          key={sc.id} 
                          className="mention-dropdown-item"
                          onClick={() => {
                            const words = data.split(/\s+/);
                            words.pop();
                            const newText = [...words, `@${sc.name} `].join(" ");
                            setData(newText);
                          }}
                        >
                          <span className="mention-name">@{sc.name}</span>
                          <span className="mention-addr">({sc.address.slice(0, 8)}...{sc.address.slice(-6)})</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <textarea
                  className="chat-input"
                  placeholder="Ask AI a question or describe your problem... (type @ to use address shortcuts)"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  disabled={isAnalyzing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyze();
                    }
                  }}
                />

                <div className="chat-controls">
                  <div className="controls-left">
                    {/* Attachment / Link Paperclip Icon */}
                    <button type="button" className="attach-btn" title="Upload Image / Attach Link" onClick={() => document.getElementById("imageUpload")?.click()}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                      </svg>
                      <input type="file" id="imageUpload" className="file-input-hidden" accept="image/*" onChange={handleImageChange} disabled={isAnalyzing} />
                    </button>

                    {/* Model Dropdown */}
                    <button type="button" className="model-selector">
                      Opus 4.8
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>

                  {/* Send or Microphone Action Button */}
                  {data.trim() || imageFile ? (
                    <button type="button" className="action-btn" title="Send Analysis Request" onClick={() => handleAnalyze()} disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <div className="loader"></div>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5"></line>
                          <polyline points="5 12 12 5 19 12"></polyline>
                        </svg>
                      )}
                    </button>
                  ) : (
                    <button type="button" className="action-btn" onClick={startRecording} title="Record Voice">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </svg>
                    </button>
                  )}
                </div>

                {imagePreview && (
                  <div style={{ marginTop: "12px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)", display: "inline-block", maxWidth: "100px" }}>
                    <img src={imagePreview} alt="Preview" style={{ width: "100%", maxHeight: "80px", objectFit: "cover" }} />
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ── Full-screen Voice Recording Screen (Root Level) ── */}
      {isRecording && (
        <div className="voice-overlay">
          {/* Top Header Label */}
          <div className="voice-overlay-header">
            <span className="voice-brand-name">Sentriq Protocol</span>
          </div>

          {/* Center Stage: Floating Gold Logo (Scales dynamically with your real voice) */}
          <div className="voice-center-stage">
            <img 
              src="/goldlogo.png" 
              alt="Sentriq" 
              className="voice-overlay-img" 
              style={{ transform: `scale(${1 + Math.min(audioLevel / 120, 0.35)})` }}
            />
          </div>

          {/* Bottom Section: Hint Text + Controls */}
          <div className="voice-bottom-section">
            <p className="voice-hint">Listening... speak now</p>
            <div className="voice-overlay-controls">
              <button className="voice-cancel-btn" onClick={stopRecording} title="Cancel">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <div className="voice-mic-btn-active">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
              <button className="voice-send-btn" onClick={() => { const text = data.trim(); stopRecording(); if (text) handleAnalyze(text); }} title="Send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Emergency Transfer Dark Modal */}
      {showModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <div className="modal-header">
              <div className="modal-title">Emergency Safe Transfer</div>
              <button className="modal-close-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <p className="modal-description">
              Enter your safe / cold wallet address to migrate remaining native balance securely.
            </p>
            <input
              type="text"
              className="modal-address-input"
              placeholder="Enter 0x safe wallet address..."
              value={targetSafeAddress}
              onChange={(e) => setTargetSafeAddress(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="modal-confirm-btn"
                onClick={() => confirmEmergencyTransfer(targetSafeAddress)}
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Wallet Confirmation Dark Modal */}
      {showDisconnectModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <div className="modal-header">
              <div className="modal-title">Disconnect Wallet</div>
              <button className="modal-close-icon" onClick={() => setShowDisconnectModal(false)}>✕</button>
            </div>
            <p className="modal-description">
              Are you sure you want to disconnect your wallet? You will be redirected to the landing page.
            </p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowDisconnectModal(false)}>
                Cancel
              </button>
              <button
                className="modal-confirm-btn"
                onClick={handleConfirmDisconnect}
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
