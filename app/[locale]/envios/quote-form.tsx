'use client';

// SAHJONY Envíos quote intake form.
// Posts to /api/envios/quote, which generates the ENV-2026-XXXXXX
// reference server-side and persists the lead in the logistics-only
// envios_quote_intakes table. The app creates only the quote REQUEST:
// the real quote comes from Juan's team within 24–48h.
import { FormEvent, useState } from 'react';
import { Locale } from '@/lib/i18n';
import { whatsappUrl } from '@/lib/communications';

export type CargoType = 'CARRO' | 'CONTENEDOR_FCL' | 'PALLET_CONSOLIDADO';

const PROVINCES = [
  'La Habana','Artemisa','Mayabeque','Pinar del Río','Matanzas','Villa Clara','Cienfuegos',
  'Sancti Spíritus','Ciego de Ávila','Camagüey','Las Tunas','Holguín','Granma','Santiago de Cuba',
  'Guantánamo','Isla de la Juventud',
] as const;

const bigInput = { width: '100%', padding: '14px 12px', marginTop: 6, minHeight: 44, fontSize: 16 } as const;
const bigButton = { minHeight: 48, padding: '12px 18px', fontSize: 17, width: '100%' } as const;

export default function EnviosQuoteForm({ defaultCargo, locale, whatsappE164, whatsappDisplay }: {
  defaultCargo: CargoType; locale: Locale; whatsappE164: string; whatsappDisplay: string;
}) {
  const es = locale === 'es';
  const [cargoType, setCargoType] = useState<CargoType>(defaultCargo);
  const [originMode, setOriginMode] = useState<'PICKUP_HOUSTON' | 'DROP_OFF'>('PICKUP_HOUSTON');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [running, setRunning] = useState<'SI' | 'NO' | ''>('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(''); setReference('');
    const form = new FormData(event.currentTarget);
    const get = (k: string) => String(form.get(k) ?? '').trim();

    const cargoDetails: Record<string, string> = {};
    if (cargoType === 'CARRO') {
      cargoDetails.year = get('year'); cargoDetails.make = get('make'); cargoDetails.model = get('model');
      cargoDetails.vin = get('vin'); cargoDetails.running = running;
    } else if (cargoType === 'CONTENEDOR_FCL') {
      cargoDetails.containerSize = get('containerSize'); cargoDetails.goodsDescription = get('goodsDescription');
    } else {
      cargoDetails.pieces = get('pieces'); cargoDetails.weight = get('weight');
      cargoDetails.dimensions = get('dimensions'); cargoDetails.goodsDescription = get('goodsDescription');
    }

    const payload = {
      customerName: get('customerName'),
      customerWhatsapp: get('customerWhatsapp'),
      cargoType, originMode,
      originDetail: get('originDetail') || null,
      destinationProvince: get('destinationProvince'),
      destinationCity: get('destinationCity'),
      cargoDetails, notes: get('notes') || null, locale,
    };

    const res = await fetch('/api/envios/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.reference) {
      setMessage(es ? 'No pudimos guardar tu solicitud. Revisa los campos e inténtalo de nuevo.' : 'We could not save your request. Check the fields and try again.');
      setBusy(false);
      return;
    }
    setReference(data.reference as string);
    setMessage(es
      ? 'Solicitud recibida. El equipo de Juan te contactará con la cotización real en 24–48h. Guarda tu referencia.'
      : 'Request received. Juan\u2019s team will reach out with your real quote within 24–48h. Save your reference.');
    setBusy(false);
  }

  const cargoTabs: { key: CargoType; es: string; en: string }[] = [
    { key: 'CARRO', es: '🚗 Carro', en: '🚗 Car' },
    { key: 'CONTENEDOR_FCL', es: '📦 Contenedor FCL', en: '📦 FCL Container' },
    { key: 'PALLET_CONSOLIDADO', es: '📋 Pallet / carga', en: '📋 Pallet / cargo' },
  ];

  if (reference) {
    const waMsg = es
      ? `Hola Sofia, solicité una cotización de SAHJONY Envíos. Mi referencia es ${reference}.`
      : `Hi Sofia, I requested a SAHJONY Envíos quote. My reference is ${reference}.`;
    return (
      <article className="feature premiumCard" style={{ display: 'grid', gap: 14 }} id="cotizar">
        <span className="eyebrow">{es ? 'SOLICITUD RECIBIDA' : 'REQUEST RECEIVED'}</span>
        <div>
          <p className="sectionCopy">{es ? 'Tu número de referencia:' : 'Your reference number:'}</p>
          <h2 style={{ fontSize: 32, letterSpacing: 1 }}>{reference}</h2>
        </div>
        <p role="status">{message}</p>
        <p className="sectionCopy">{es
          ? 'Esto crea solo la solicitud de cotización. No incluye precios, fechas de salida ni reservas: la cotización real la prepara el equipo de Juan como corredor logístico, nunca automáticamente desde la app.'
          : 'This creates only the quote request. No prices, sailing dates or bookings: the real quote is prepared by Juan\u2019s team as a logistics broker, never automatically by the app.'}</p>
        <div className="actions">
          <a className="cta premiumCta" style={{ minHeight: 48 }} href={whatsappUrl(whatsappE164, waMsg)} target="_blank" rel="noreferrer">
            {es ? `Continuar por WhatsApp (${whatsappDisplay})` : `Continue on WhatsApp (${whatsappDisplay})`}
          </a>
        </div>
      </article>
    );
  }

  return (
    <form onSubmit={submit} className="feature premiumCard" style={{ display: 'grid', gap: 16 }} id="cotizar">
      <span className="eyebrow">{es ? 'SOLICITA TU COTIZACIÓN REAL' : 'REQUEST YOUR REAL QUOTE'}</span>
      <h2>{es ? 'Cotización en 24–48h' : 'Quote within 24–48h'}</h2>
      <p className="sectionCopy">{es
        ? 'Completa los datos y el equipo de Juan prepara tu cotización real como corredor logístico: cotizaciones, documentación y cadena de custodia con transportistas autorizados. La app no genera precios.'
        : 'Fill in the details and Juan\u2019s team will prepare your real quote as a logistics broker: quotes, documentation and chain of custody with authorized carriers. The app does not generate prices.'}</p>

      <div className="actions" role="tablist" aria-label={es ? 'Tipo de carga' : 'Cargo type'}>
        {cargoTabs.map(t => (
          <button key={t.key} type="button" role="tab" aria-selected={cargoType === t.key}
            onClick={() => setCargoType(t.key)}
            className={cargoType === t.key ? 'cta premiumCta' : 'glassCta'}
            style={{ minHeight: 48, flex: '1 1 140px' }}>{es ? t.es : t.en}</button>
        ))}
      </div>

      <div className="featureGrid">
        <label>{es ? 'Tu nombre completo' : 'Your full name'}
          <input name="customerName" required minLength={2} autoComplete="name" style={bigInput} /></label>
        <label>{es ? 'Tu WhatsApp' : 'Your WhatsApp'}
          <input name="customerWhatsapp" required minLength={7} inputMode="tel" autoComplete="tel" placeholder="+1 …" style={bigInput} /></label>
      </div>

      <div className="featureGrid">
        <label>{es ? 'Origen en Houston' : 'Houston origin'}
          <select name="originMode" value={originMode} onChange={e => setOriginMode(e.target.value as 'PICKUP_HOUSTON' | 'DROP_OFF')} style={bigInput}>
            <option value="PICKUP_HOUSTON">{es ? 'Recogida en mi dirección (Houston)' : 'Pick up at my address (Houston)'}</option>
            <option value="DROP_OFF">{es ? 'Entrego en punto de recepción' : 'I drop off at a reception point'}</option>
          </select></label>
        <label>{es ? 'Dirección de recogida o detalle' : 'Pickup address or detail'}
          <input name="originDetail" placeholder={es ? 'Ej. dirección en Houston' : 'e.g. address in Houston'} style={bigInput} /></label>
      </div>

      <div className="featureGrid">
        <label>{es ? 'Provincia de destino (Cuba)' : 'Destination province (Cuba)'}
          <select name="destinationProvince" required defaultValue="" style={bigInput}>
            <option value="" disabled>{es ? 'Elige la provincia' : 'Choose the province'}</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select></label>
        <label>{es ? 'Ciudad / municipio' : 'City / municipality'}
          <input name="destinationCity" required placeholder={es ? 'Ej. Vedado, Santiago…' : 'e.g. Vedado, Santiago…'} style={bigInput} /></label>
      </div>

      {cargoType === 'CARRO' && (
        <div className="feature" style={{ display: 'grid', gap: 12 }}>
          <span className="eyebrow">{es ? 'DATOS DEL CARRO' : 'CAR DETAILS'}</span>
          <div className="featureGrid">
            <label>{es ? 'Año' : 'Year'}<input name="year" required inputMode="numeric" pattern="[0-9]{4}" placeholder="2021" style={bigInput} /></label>
            <label>{es ? 'Marca' : 'Make'}<input name="make" required placeholder={es ? 'Ej. Toyota' : 'e.g. Toyota'} style={bigInput} /></label>
            <label>{es ? 'Modelo' : 'Model'}<input name="model" required placeholder={es ? 'Ej. Corolla' : 'e.g. Corolla'} style={bigInput} /></label>
          </div>
          <div className="featureGrid">
            <label>VIN <span className="sectionCopy">{es ? '(opcional)' : '(optional)'}</span>
              <input name="vin" placeholder={es ? 'Si lo tienes' : 'If you have it'} style={bigInput} /></label>
            <label>{es ? '¿Funciona (enciende y anda)?' : 'Does it run (starts and drives)?'}
              <select value={running} onChange={e => setRunning(e.target.value as 'SI' | 'NO' | '')} required style={bigInput}>
                <option value="" disabled>{es ? 'Elige una opción' : 'Choose one'}</option>
                <option value="SI">{es ? 'Sí' : 'Yes'}</option>
                <option value="NO">No</option>
              </select></label>
          </div>
          <p className="sectionCopy">{es
            ? 'También podemos cotizar un carro de nuestro inventario como corredor, o el tuyo propio.'
            : 'We can also quote a car from our brokered inventory, or your own.'}</p>
        </div>
      )}

      {cargoType === 'CONTENEDOR_FCL' && (
        <div className="feature" style={{ display: 'grid', gap: 12 }}>
          <span className="eyebrow">{es ? 'DATOS DEL CONTENEDOR' : 'CONTAINER DETAILS'}</span>
          <div className="featureGrid">
            <label>{es ? 'Tamaño' : 'Size'}
              <select name="containerSize" required defaultValue="" style={bigInput}>
                <option value="" disabled>{es ? 'Elige el tamaño' : 'Choose the size'}</option>
                <option value="20">20'</option>
                <option value="40">40'</option>
              </select></label>
            <label>{es ? 'Descripción de la mercancía' : 'Goods description'}
              <input name="goodsDescription" required placeholder={es ? 'Ej. alimentos, equipos…' : 'e.g. food, equipment…'} style={bigInput} /></label>
          </div>
        </div>
      )}

      {cargoType === 'PALLET_CONSOLIDADO' && (
        <div className="feature" style={{ display: 'grid', gap: 12 }}>
          <span className="eyebrow">{es ? 'DATOS DE LA CARGA' : 'CARGO DETAILS'}</span>
          <div className="featureGrid">
            <label>{es ? 'Bultos / piezas' : 'Pieces'}<input name="pieces" required inputMode="numeric" pattern="[0-9]+" placeholder="10" style={bigInput} /></label>
            <label>{es ? 'Peso aproximado (lb)' : 'Approx. weight (lb)'}<input name="weight" placeholder="500" style={bigInput} /></label>
            <label>{es ? 'Dimensiones (LxAxA)' : 'Dimensions (LxWxH)'}<input name="dimensions" placeholder={es ? 'Ej. 48x40x60 in' : 'e.g. 48x40x60 in'} style={bigInput} /></label>
          </div>
          <label>{es ? 'Descripción de la mercancía' : 'Goods description'}
            <input name="goodsDescription" required placeholder={es ? 'Ej. ropa, medicinas…' : 'e.g. clothing, medicine…'} style={bigInput} /></label>
        </div>
      )}

      <label>{es ? 'Notas adicionales' : 'Additional notes'}
        <textarea name="notes" rows={3} maxLength={2000} placeholder={es ? 'Algo que debamos saber…' : 'Anything we should know…'} style={{ ...bigInput, minHeight: 88 }} /></label>

      <button type="submit" className="cta premiumCta" style={bigButton} disabled={busy}>
        {busy ? (es ? 'Enviando solicitud…' : 'Sending request…') : (es ? 'Solicitar cotización real' : 'Request a real quote')}
      </button>
      {message && !reference && <p role="status">{message}</p>}
      <p className="sectionCopy">{es
        ? 'Al enviar, creas solo la solicitud de cotización. Recibes un número de referencia (ENV-2026-XXXXXX) y el equipo de Juan te contacta con la cotización real en 24–48h.'
        : 'Submitting creates only the quote request. You receive a reference number (ENV-2026-XXXXXX) and Juan\u2019s team contacts you with the real quote within 24–48h.'}</p>
    </form>
  );
}
