import {ImageResponse} from 'next/og';

export const alt='MY CUBA CASH — Familias, negocios y marketplace';
export const size={width:1200,height:630};
export const contentType='image/png';

export default function Image(){
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',position:'relative',overflow:'hidden',background:'#050607',color:'#f5f5f7',padding:'64px 72px',flexDirection:'column',justifyContent:'space-between'}}>
      <div style={{position:'absolute',width:620,height:620,borderRadius:620,top:-320,right:-90,background:'radial-gradient(circle, rgba(80,235,191,.42) 0%, rgba(80,235,191,.08) 48%, transparent 72%)'}}/>
      <div style={{position:'absolute',width:520,height:520,borderRadius:520,bottom:-330,left:-120,background:'radial-gradient(circle, rgba(37,111,145,.44) 0%, rgba(37,111,145,.08) 52%, transparent 72%)'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',position:'relative'}}>
        <div style={{fontSize:30,fontWeight:800,letterSpacing:'-0.04em'}}>MY CUBA CASH</div>
        <div style={{display:'flex',padding:'12px 20px',border:'1px solid rgba(255,255,255,.2)',borderRadius:999,fontSize:18,color:'#b8ffe9'}}>mycubacash.com</div>
      </div>
      <div style={{display:'flex',position:'relative',flexDirection:'column',maxWidth:960}}>
        <div style={{fontSize:18,fontWeight:700,letterSpacing:4,color:'#72f0ce',marginBottom:22}}>FAMILIAS · NEGOCIOS · MARKETPLACE</div>
        <div style={{fontSize:76,fontWeight:800,letterSpacing:'-0.055em',lineHeight:1.02}}>Mejores opciones locales. Más claridad. Más confianza.</div>
        <div style={{fontSize:25,lineHeight:1.45,color:'#b8bec5',marginTop:26}}>Sofia coordina. La red compite. Tú eliges.</div>
      </div>
      <div style={{display:'flex',position:'relative',gap:14}}>
        {['Remesas familiares','Servicios locales','Comercio privado'].map(label=><div key={label} style={{display:'flex',padding:'12px 18px',borderRadius:999,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.11)',fontSize:16,color:'#d9dde1'}}>{label}</div>)}
      </div>
    </div>,
    size
  );
}
