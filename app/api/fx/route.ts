import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET(){
  try{
    const raw = await readFile(path.join(process.cwd(),'public','fx','fixings.json'),'utf8');
    const data = JSON.parse(raw);
    const fixings = Array.isArray(data.fixings) ? data.fixings : [];
    const latest = fixings.length ? fixings[fixings.length-1] : null;
    return Response.json({
      ok:true,
      pair:data.pair ?? 'USD/CUP',
      latest,
      editions:fixings.length,
      methodology:data.methodology ?? null,
      disclaimer:data.disclaimer ?? null,
    });
  }catch{
    return Response.json({ ok:false, error:'fixings unavailable' },{ status:503 });
  }
}
