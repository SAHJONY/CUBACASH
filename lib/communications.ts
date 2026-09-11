function envValue(name:string,fallback:string){
  const value=process.env[name]?.trim();
  return value || fallback;
}

export const APP_COMMUNICATIONS = {
  whatsappPrimary: {
    label: 'WhatsApp Business',
    display: envValue('NEXT_PUBLIC_WHATSAPP_PRIMARY_DISPLAY','+1 281-662-8581'),
    e164: envValue('NEXT_PUBLIC_WHATSAPP_PRIMARY_E164','12816628581'),
    enabled: true
  },
  whatsappSecondary: {
    label: 'WhatsApp Business (Secondary)',
    display: envValue('NEXT_PUBLIC_WHATSAPP_SECONDARY_DISPLAY','+1 678-346-6284'),
    e164: envValue('NEXT_PUBLIC_WHATSAPP_SECONDARY_E164','16783466284'),
    enabled: true
  },
  phone: {
    label: 'Phone',
    display: envValue('NEXT_PUBLIC_PHONE_DISPLAY','+1 281-662-8581'),
    e164: envValue('NEXT_PUBLIC_PHONE_E164','+12816628581'),
    enabled: process.env.NEXT_PUBLIC_SOFIA_PHONE_ENABLED?.trim().toLowerCase()==='true'
  }
} as const;

export function whatsappUrl(e164:string){
  return `https://wa.me/${e164.replace(/\D/g,'')}`;
}
