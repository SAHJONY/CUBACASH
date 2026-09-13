import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest {
  return {
    name:'MY CUBA CASH',
    short_name:'MY CUBA CASH',
    description:'Remesas familiares, pagos comerciales y marketplace privado con seguimiento seguro.',
    start_url:'/es',
    display:'standalone',
    background_color:'#08080a',
    theme_color:'#08080a',
    lang:'es'
  };
}
