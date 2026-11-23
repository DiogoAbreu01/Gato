import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Gato ☾ | Seu universo de ideias',description:'Workspace lunar da Atlética: páginas, processos, planilhas, fluxogramas e gestão institucional.',icons:{icon:'/gato-lunar.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR" data-theme="dark"><body>{children}</body></html>}
