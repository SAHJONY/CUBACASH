export const APP_COMMUNICATIONS = {
  whatsappPrimary: {
    label: 'WhatsApp Business',
    display: process.env.NEXT_PUBLIC_WHATSAPP_PRIMARY_DISPLAY ?? '+1 281-662-8581',
    e164: process.env.NEXT_PUBLIC_WHATSAPP_PRIMARY_E164 ?? '12816628581'
  },
  whatsappSecondary: {
    label: 'WhatsApp / Phone',
    display: process.env.NEXT_PUBLIC_WHATSAPP_SECONDARY_DISPLAY ?? '+1 678-346-6284',
    e164: process.env.NEXT_PUBLIC_WHATSAPP_SECONDARY_E164 ?? '16783466284'
  },
  phone: {
    label: 'Phone',
    display: process.env.NEXT_PUBLIC_PHONE_DISPLAY ?? '+1 281-662-8581',
    e164: process.env.NEXT_PUBLIC_PHONE_E164 ?? '+12816628581'
  },
  telegram: {
    label: 'Telegram',
    handle: process.env.NEXT_PUBLIC_TELEGRAM_HANDLE ?? '@SahjonyGlobalTradeBot'
  }
} as const;

export function whatsappUrl(e164:string){
  return `https://wa.me/${e164.replace(/\D/g,'')}`;
}

export function telegramUrl(handle:string){
  return `https://t.me/${handle.replace(/^@/,'')}`;
}
