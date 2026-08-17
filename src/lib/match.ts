import { CAPABILITIES, INTENTS } from "@/lib/discovery";

export type MatchInput = {
  name?: string | null;
  description?: string | null;
  metadata?: unknown;
  health_status?: string | null;
  // Real evidence extracted during ingestion (see src/lib/metadata.ts).
  // Empty arrays mean "not yet resolved / declared nothing" — never
  // treated as a negative signal, just absence of positive evidence.
  capabilities?: string[] | null;
  domains?: string[] | null;
  protocols?: string[] | null;
};

const EXP: Record<string,string[]> = {
  defi:["defi","decentralized finance","liquidity","yield","staking","swap","dex","lending","borrowing","wallet","position"],
  trading:["trade","trading","swap","dex","market","arbitrage","strategy","execution","orders","portfolio"],
  monitor:["monitor","monitoring","watch","alert","track","position","wallet","health factor","liquidation","risk"],
  research:["research","analysis","analytics","news","intelligence","data","market intelligence","insights"]
};
const STOP=new Set(["the","and","for","with","from","that","this","need","want","find","agent","an","a","to","my","me","of","on","in"]);
function flat(v:unknown,o:string[]=[]):string[]{if(typeof v==="string")o.push(v);else if(Array.isArray(v))v.forEach(x=>flat(x,o));else if(v&&typeof v==="object")Object.values(v as Record<string,unknown>).forEach(x=>flat(x,o));return o;}
function norm(s:string){return s.toLowerCase().replace(/[^a-z0-9\s-]/g," ").replace(/\s+/g," ").trim()}
function terms(q:string){const n=norm(q);const words=n.split(" ").filter(w=>w.length>2&&!STOP.has(w));const expanded=Object.values(EXP).flatMap(xs=>xs.filter(x=>n.includes(x)));return [...new Set([...words,...expanded])]}

export function rankAgents(query:string,agents:MatchInput[]){
  const q=norm(query),ts=terms(query);
  return agents.map(agent=>{
    const name=norm(agent.name??""),desc=norm(agent.description??""),meta=norm(flat(agent.metadata).join(" "));
    const capabilities=(agent.capabilities??[]).map(norm);
    const domains=(agent.domains??[]).map(norm);
    const protocols=agent.protocols??[];
    const text=`${name} ${desc} ${meta} ${capabilities.join(" ")} ${domains.join(" ")}`;
    let score=0;
    // Each reason carries a rank so the strongest evidence (observed
    // liveness, declared skills) always surfaces first, regardless of the
    // order it happened to be discovered in. Scoring is unchanged.
    const reasons:{text:string;rank:number}[]=[];
    const why=(text:string,rank:number)=>{reasons.push({text,rank})};

    if(q&&name===q){score+=60;why("Exact name match",100)}
    else if(q&&name.includes(q)){score+=35;why("Name matches your search",82)}

    for(const t of ts){
      if(text.includes(t)){
        // Structured evidence (declared capability/domain) counts for
        // more than a keyword happening to appear in free text.
        const inCapability=capabilities.some(c=>c.includes(t));
        const inDomain=domains.some(d=>d.includes(t));
        if(inCapability){score+=18;why(`Declared skill: ${t}`,90)}
        else if(inDomain){score+=18;why(`Works in domain: ${t}`,88)}
        else if(name.includes(t)){score+=14;why(`Name mentions "${t}"`,60)}
        else if(meta.includes(t)){score+=10;why(`Registration mentions "${t}"`,42)}
        else{score+=7;why(`Description mentions "${t}"`,32)}
      }
    }

    // Bonus for inferred CAPABILITIES coverage (keyword-based fallback list).
    score+=Math.min(CAPABILITIES.filter(c=>c.terms.some(t=>text.includes(t))).length*2,10);

    if(protocols.length){
      score+=Math.min(protocols.length*1.5,6);
    }

    if(agent.health_status==="LIVE"){score+=8;why("Live now — passed a health check",95)}
    else if(agent.health_status==="TIMEOUT"){score+=2;why("Endpoint responds slowly",22)}

    const matchReasons=[...new Set(reasons.sort((a,b)=>b.rank-a.rank).map(r=>r.text))].slice(0,4);
    return{agent,matchScore:Math.min(100,Math.round(score)),matchReasons};
  }).sort((a,b)=>b.matchScore-a.matchScore);
}

export function intentLabel(query:string){const q=norm(query);const hit=INTENTS.find(i=>q.includes(i.query)||EXP[i.id]?.some(t=>q.includes(t)));return hit?.label??null}