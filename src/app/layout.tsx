import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "AgentLens — Discover BNB AI Agents", description: "Discover, compare, and verify AI agents on BNB Smart Chain." };
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('.theme-toggle'):null;if(!b)return;var d=document.documentElement,dark=d.getAttribute('data-theme')==='dark';if(dark){d.removeAttribute('data-theme');try{localStorage.setItem('theme','light')}catch(_){}}else{d.setAttribute('data-theme','dark');try{localStorage.setItem('theme','dark')}catch(_){}}});})();`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (<html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{ __html: themeInit }} /><button className="theme-toggle" type="button" aria-label="Toggle dark mode" />{children}</body></html>);
}
