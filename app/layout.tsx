import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'DWTS S35 · Pick\'em', description: 'Dancing with the Stars Season 35 Pick\'em Challenge' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{margin:0,padding:0,background:'#060D18',color:'#E4ECF5',fontFamily:'system-ui,sans-serif',minHeight:'100vh'}}>{children}</body></html>
}
