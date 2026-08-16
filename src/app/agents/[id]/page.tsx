"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

type Service={name:string;protocol:string;endpoint:string;health?:{status:string;latencyMs?:number;httpCode?:number;error?:string}};
type Agent={chainId:number;agentId:string;owner:string;agentUri:string;metadata:{name?:string;description?:string;active?:boolean;x402Support?:boolean;supportedTrust?:string[];services?:Service[]}|null;capabilities?:string[];domains?:string[];protocols?:string[]};
type Health={checkedAt:string;summary:{overallStatus:string;healthScore:number;liveCount:number;timeoutCount:number;deadCount:number;probeCount:number;totalServices:number};services:Service[]};
const initials=(n?:string)=>((n||"Agent").split(/\s+/).slice(0,2).map(x=>x[0]).join("")).toUpperCase();
const tone=(s?:string)=>s==="LIVE"?"#087443":s==="DEAD"?"#c62828":s==="TIMEOUT"?"#a15c00":"#667085";
const short=(v:string)=>v.length>18?`${v.slice(0,9)}…${v.slice(-7)}`:v;

export default function AgentDetail({params}:{params:Promise<{id:string}>}){
 const [agent,setAgent]=useState<Agent|null>(null),[health,setHealth]=useState<Health|null>(null),[error,setError]=useState(""),[checking,setChecking]=useState(false);
 useEffect(()=>{params.then(async({id})=>{try{const [a,h]=await Promise.all([fetch(`/api/agents/${id}`),fetch(`/api/agents/${id}/health`)]);const ad=await a.json(),hd=await h.json();if(!a.ok)throw Error(ad.error||"Agent not found");setAgent(ad);if(h.ok)setHealth(hd)}catch(e){setError(e instanceof Error?e.message:"Failed to load agent")}})},[params]);
 async function check(){if(!agent)return;setChecking(true);try{const r=await fetch(`/api/agents/${agent.agentId}/health`);if(r.ok)setHealth(await r.json())}finally{setChecking(false)}}
 if(error)return <main className="container" style={{padding:"60px 0"}}>{error}</main>;
 if(!agent)return <main className="container" style={{padding:"60px 0",color:"#667085"}}>Loading agent evidence…</main>;
 const m=agent.metadata,services=health?.services||m?.services||[];
 return <div className="shell">
  <nav className="nav"><div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Link href="/" className="brand"><span className="brand-mark">A</span>AgentLens</Link><span className="nav-note">Evidence-first agent marketplace</span></div></nav>
  <main className="container">
   <section className="detail-hero"><Link href="/" className="crumb">← Back to agents</Link></section>
   <div className="detail-grid">
    <div>
     <section className="panel detail-panel"><div className="detail-head"><div className="detail-avatar">{initials(m?.name)}</div><div><div className="eyebrow">BNB Smart Chain · ERC-8004</div><h1>{m?.name||`Agent #${agent.agentId}`}</h1><p>{m?.description||"This agent has no description in its ERC-8004 registration."}</p>{((agent.capabilities?.length||0)+(agent.domains?.length||0)+(agent.protocols?.length||0))>0&&<div className="tag-list">{agent.capabilities?.map(c=><span key={`cap-${c}`} className="tag">{c}</span>)}{agent.domains?.map(d=><span key={`dom-${d}`} className="tag tag-domain">{d}</span>)}{agent.protocols?.map(p=><span key={`proto-${p}`} className="tag tag-protocol">{p}</span>)}</div>}</div></div></section>
     <section className="panel detail-section"><div style={{padding:"22px 22px 0"}}><h2>Verification evidence</h2><p>What AgentLens can verify right now. Claims stay separate from observed signals.</p></div><div>{services.length?services.map((s,i)=><div className="service" key={`${s.name}-${i}`}><div className="service-head"><div><span className="service-name">{s.name||"Unnamed service"}</span><span className="service-protocol">{s.protocol}</span></div><strong style={{fontSize:11,color:tone(s.health?.status)}}>{s.health?.status||"DECLARED"}</strong></div><div className="service-url">{s.endpoint}</div>{s.health&&<div className="service-meta">{s.health.httpCode?`HTTP ${s.health.httpCode}`:""}{s.health.latencyMs?` · ${s.health.latencyMs}ms`:""}{s.health.error?` · ${s.health.error}`:""}</div>}</div>):<div style={{padding:20,color:"#667085"}}>No declared services found.</div>}</div></section>
     <section className="panel detail-section" style={{padding:22}}><h2>Trust signals</h2><p>AgentLens does not invent a reputation score. We show what is verifiable.</p><div className="note"><strong>Supported trust:</strong> {m?.supportedTrust?.join(", ")||"Not declared"}<br/><br/>Reputation and transaction history will be added as evidence sources mature.</div></section>
    </div>
    <aside>
     {health&&<div className="score-panel"><div className="score-label">AgentLens health score</div><div className="score">{health.summary.healthScore}</div><div className="score-status" style={{color:health.summary.overallStatus==="LIVE"?"#6ee7a4":"#f3ba2f"}}>{health.summary.overallStatus}</div><div className="metrics"><div className="metric"><span>Live services</span><strong>{health.summary.liveCount}/{health.summary.probeCount}</strong></div><div className="metric"><span>Services</span><strong>{health.summary.totalServices}</strong></div></div></div>}
     <div className="panel side" style={{marginTop:14}}><h3>Agent identity</h3><div className="kv"><span>ERC-8004 ID</span><strong>{short(agent.agentId)}</strong></div><div className="kv"><span>Owner</span><strong>{short(agent.owner)}</strong></div><div className="kv"><span>Active claim</span><strong>{m?.active?"Yes":"Not declared"}</strong></div><div className="kv"><span>x402 support</span><strong>{m?.x402Support?"Supported":"Not declared"}</strong></div><button className="action" onClick={check} disabled={checking}>{checking?"Checking…":"Verify again"}</button></div>
    </aside>
   </div>
  </main>
  <footer className="footer"><div className="container footer-inner"><span><strong>AgentLens</strong> — evidence before hiring.</span><span>BNB Smart Chain · ERC-8004</span></div></footer>
 </div>;
}