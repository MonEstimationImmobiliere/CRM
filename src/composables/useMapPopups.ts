// filepath: src/composables/useMapPopups.ts

import maplibregl from 'maplibre-gl';
import { useDashboardStore } from '@/stores/dashboard';
import type { IAddressDetail, IAddressGrouped } from '@/types/address';

export type MapAddress = IAddressDetail | IAddressGrouped | Record<string, any>;

interface UseMapPopupsOptions {
  getAddresses: () => MapAddress[];
  onEditProperty: (property: MapAddress) => void;
  flyTo: (lon: number | string, lat: number | string, zoom: number) => void;
}

export function useMapPopups(options: UseMapPopupsOptions) {
  const dashboard = useDashboardStore();
  let currentPopup: maplibregl.Popup | null = null;
  let popupClickHandlerRegistered = false;

  /* -------------------------------------
     HELPERS
  ------------------------------------- */

  function formatPrice(value: any) {
    const n = Number(value);
    if (!n || Number.isNaN(n)) return '';
    return `${n.toLocaleString('fr-FR')} €`;
  }

  function normalize(v: any) {
    return String(v ?? '').trim();
  }

  function sameNumberGroup(a: Record<string, any>, b: Record<string, any>) {
    return (
      normalize(a.id_fantoir) === normalize(b.id_fantoir) &&
      normalize(a.numero) === normalize(b.numero) &&
      normalize(a.rep) === normalize(b.rep)
    );
  }

  function getGroupedItemsForPoint(p: Record<string, any>) {
    return options.getAddresses().filter((item: any) => sameNumberGroup(item, p));
  }

  function show(coords: [number, number], html: string, map: maplibregl.Map) {
    close();
    currentPopup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 14,
    })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
  }

  function close() {
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
  }

  /* -------------------------------------
     POPUP HTML
  ------------------------------------- */

  function cityPopupHtml(p: Record<string, any>) {
    return `
      <div style="
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        min-width:220px;
        line-height:1.4;
      ">
        <div style="
          display:flex;
          align-items:center;
          gap:6px;
          margin-bottom:8px;
          flex-wrap:wrap;
        ">
          <span style="
            background:#2563eb;
            color:white;
            font-size:11px;
            font-weight:600;
            padding:3px 8px;
            border-radius:999px;
          ">
            Rue
          </span>
        </div>

        <div style="
          font-weight:600;
          font-size:14px;
          color:#111827;
          margin-bottom:4px;
        ">
          ${p.nom_voie || ''}
        </div>

        <div style="
          font-size:12px;
          color:#6b7280;
          margin-bottom:6px;
        ">
          ${p.code_postal || ''} ${p.nom_commune || ''}
        </div>

        <div style="
          font-size:12px;
          color:#374151;
          margin-bottom:10px;
        ">
          ${p.total_adresses || 0} adresses
        </div>

        <a href="#" data-map-action="view-street" style="
          color:#2563eb;
          font-size:12px;
          font-weight:600;
          text-decoration:none;
        ">
          Voir la rue
        </a>
      </div>
    `;
  }

  function streetPopupHtml(p: Record<string, any>) {
    const fullNum = p.rep ? `${p.numero} ${p.rep}` : p.numero;

    return `
      <div style="
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        min-width:220px;
        line-height:1.4;
      ">
        <div style="
          display:flex;
          align-items:center;
          gap:6px;
          margin-bottom:8px;
          flex-wrap:wrap;
        ">
          <span style="
            background:#0f766e;
            color:white;
            font-size:11px;
            font-weight:600;
            padding:3px 8px;
            border-radius:999px;
          ">
            Numéro
          </span>
        </div>

        <div style="
          font-weight:600;
          font-size:14px;
          color:#111827;
          margin-bottom:4px;
        ">
          ${fullNum || ''} ${p.nom_voie || ''}
        </div>

        <div style="
          font-size:12px;
          color:#6b7280;
          margin-bottom:10px;
        ">
          ${p.code_postal || ''} ${p.nom_commune || ''}
        </div>

        <div style="
          display:flex;
          gap:12px;
          flex-wrap:wrap;
        ">
          <a href="#" data-map-action="view-num" style="
            color:#2563eb;
            font-size:12px;
            font-weight:600;
            text-decoration:none;
          ">
            Voir ce numéro
          </a>

          <a href="#" data-map-action="open-first-property" style="
            color:#2563eb;
            font-size:12px;
            font-weight:600;
            text-decoration:none;
          ">
            Ouvrir la fiche
          </a>
        </div>
      </div>
    `;
  }

  function groupedNumberPopupHtml(
    p: Record<string, any>,
    groupedItems: MapAddress[]
  ) {
    const adresse = [p.numero || '', p.rep || '', p.nom_voie || '']
      .filter(Boolean)
      .join(' ');
    const ville = [p.code_postal || '', p.nom_commune || '']
      .filter(Boolean)
      .join(' ');

    const itemsHtml = groupedItems
      .map((item: any, index: number) => {
        const typeLabel = item.label || item.type_bien || 'Bien';
        const unitLabel =
          item.unit_label ||
          item.apart_number ||
          (Number(item.unit_id) > 0 ? `Lot ${item.unit_id}` : '');

        const surface = item.surface ? `${item.surface} m²` : '';
        const bedrooms = item.bedrooms ? `${item.bedrooms} ch` : '';
        const price = formatPrice(item.price);

        const favoriteBadge =
          Number(item.favorite) === 1 || item.favorite === true
            ? `<span style="
                background:#f97316;
                color:white;
                font-size:10px;
                font-weight:600;
                padding:2px 6px;
                border-radius:999px;
              ">Favori</span>`
            : '';

        return `
          <div style="
            padding:10px 0;
            border-top:${index === 0 ? 'none' : '1px solid #e5e7eb'};
          ">
            <div style="
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:10px;
              margin-bottom:4px;
            ">
              <div style="
                display:flex;
                align-items:center;
                gap:6px;
                flex-wrap:wrap;
              ">
                <span style="
                  background:#2563eb;
                  color:white;
                  font-size:10px;
                  font-weight:600;
                  padding:2px 6px;
                  border-radius:999px;
                ">
                  ${typeLabel}
                </span>

                ${favoriteBadge}
              </div>

              <a href="#"
                 data-map-action="open-group-item"
                 data-map-index="${index}"
                 style="
                   color:#2563eb;
                   font-size:12px;
                   font-weight:600;
                   text-decoration:none;
                   white-space:nowrap;
                 ">
                Ouvrir
              </a>
            </div>

            ${
              unitLabel
                ? `<div style="
                    font-size:12px;
                    color:#374151;
                    margin-bottom:4px;
                  ">
                    ${unitLabel}
                  </div>`
                : ''
            }

            <div style="
              font-size:12px;
              color:#6b7280;
              margin-bottom:4px;
            ">
              ${[surface, bedrooms].filter(Boolean).join(' • ')}
            </div>

            <div style="
              font-size:12px;
              font-weight:600;
              color:#111827;
            ">
              ${price}
            </div>
          </div>
        `;
      })
      .join('');

    return `
      <div style="
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        min-width:260px;
        max-width:320px;
        line-height:1.4;
      ">
        <div style="
          font-weight:600;
          font-size:14px;
          color:#111827;
          margin-bottom:4px;
        ">
          ${adresse || 'Adresse inconnue'}
        </div>

        <div style="
          font-size:12px;
          color:#6b7280;
          margin-bottom:10px;
        ">
          ${ville}
        </div>

        <div style="
          font-size:12px;
          color:#374151;
          margin-bottom:8px;
          font-weight:600;
        ">
          ${groupedItems.length} bien${groupedItems.length > 1 ? 's' : ''} disponible${groupedItems.length > 1 ? 's' : ''}
        </div>

        ${itemsHtml}
      </div>
    `;
  }

  function numberPopupHtml(p: Record<string, any>) {
    const typeLabel = p.label || p.type_bien || 'Bien';
    const adresse = [p.numero || '', p.rep || '', p.nom_voie || '']
      .filter(Boolean)
      .join(' ');
    const ville = [p.code_postal || '', p.nom_commune || '']
      .filter(Boolean)
      .join(' ');

    const price = formatPrice(p.price);
    const surface = p.surface ? `${p.surface} m²` : '';
    const bedrooms = p.bedrooms ? `${p.bedrooms} ch` : '';

    const favoriteBadge =
      Number(p.favorite) === 1 || p.favorite === true
        ? `<span style="
            background:#f97316;
            color:white;
            font-size:11px;
            font-weight:600;
            padding:3px 8px;
            border-radius:999px;
          ">Favori</span>`
        : '';

    const rappelBadge =
      p.date_rappel
        ? `<span style="
            background:#06b6d4;
            color:white;
            font-size:11px;
            font-weight:600;
            padding:3px 8px;
            border-radius:999px;
          ">Rappel</span>`
        : '';

    const estimationBadge =
      p.dernier_prix_estime
        ? `<span style="
            background:#9333ea;
            color:white;
            font-size:11px;
            font-weight:600;
            padding:3px 8px;
            border-radius:999px;
          ">Estimation</span>`
        : '';

    return `
      <div style="
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        min-width:240px;
        line-height:1.4;
      ">
        <div style="
          display:flex;
          align-items:center;
          gap:6px;
          margin-bottom:8px;
          flex-wrap:wrap;
        ">
          <span style="
            background:#2563eb;
            color:white;
            font-size:11px;
            font-weight:600;
            padding:3px 8px;
            border-radius:999px;
          ">
            ${typeLabel}
          </span>

          ${favoriteBadge}
          ${rappelBadge}
          ${estimationBadge}
        </div>

        <div style="
          font-weight:600;
          font-size:14px;
          color:#111827;
          margin-bottom:4px;
        ">
          ${adresse || 'Adresse inconnue'}
        </div>

        <div style="
          font-size:12px;
          color:#6b7280;
          margin-bottom:6px;
        ">
          ${ville}
        </div>

        <div style="
          font-size:12px;
          color:#374151;
          margin-bottom:6px;
        ">
          ${[surface, bedrooms].filter(Boolean).join(' • ')}
        </div>

        <div style="
          font-size:13px;
          font-weight:600;
          color:#111827;
          margin-bottom:10px;
        ">
          ${price}
        </div>

        <a href="#" data-map-action="open-property" style="
          color:#2563eb;
          font-size:12px;
          font-weight:600;
          text-decoration:none;
        ">
          Ouvrir la fiche
        </a>
      </div>
    `;
  }

  /* -------------------------------------
     ACTIONS
  ------------------------------------- */

  function handlePopupAction(
    action: string,
    p: Record<string, any>,
    coords: [number, number],
    extraData?: any
  ) {
    switch (action) {
      case 'view-street':
        dashboard.selectedStreet = {
          value: p.nom_voie,
          idFantoir: p.id_fantoir,
        };
        dashboard.selectedCodeIdFantoir = p.id_fantoir;
        dashboard.selectedNumero = '';
        dashboard.selectedRep = '';
        dashboard.selectedNumeroFull = null;
        dashboard.querySearchAddress();
        options.flyTo(coords[0], coords[1], 16);
        break;

      case 'view-num':
        dashboard.selectedNumeroFull = {
          numero: p.numero,
          rep: p.rep || '',
          value: p.rep ? `${p.numero} ${p.rep}` : `${p.numero}`,
        };
        dashboard.selectedNumero = p.numero;
        dashboard.selectedRep = p.rep || '';
        dashboard.querySearchAddress();
        options.flyTo(coords[0], coords[1], 19);
        break;

      case 'open-first-property': {
        const currentAddresses = options.getAddresses();
        const grouped = currentAddresses.filter((a: any) => sameNumberGroup(a, p));
        const first = grouped.find((a: any) => Number(a.id) > 0) || grouped[0];
        if (first) {
          options.onEditProperty(first);
        }
        break;
      }

      case 'open-property': {
        const currentAddresses = options.getAddresses();

        if (currentAddresses.length === 1) {
          options.onEditProperty(currentAddresses[0]);
          return;
        }

        const match = currentAddresses.find((a: any) => {
          if (p.unit_id && Number(p.unit_id) > 0) {
            return Number(a.unit_id) === Number(p.unit_id);
          }

          return (
            a.id_fantoir_long &&
            p.id_fantoir_long &&
            a.id_fantoir_long === p.id_fantoir_long
          );
        });

        if (match) {
          options.onEditProperty(match);
        }
        break;
      }

      case 'open-group-item': {
        const index = Number(extraData?.index);
        const groupedItems = (currentPopup as any)?._popupGroupedItems || [];
        if (!Number.isNaN(index) && groupedItems[index]) {
          options.onEditProperty(groupedItems[index]);
        }
        break;
      }
    }
  }

  /* -------------------------------------
     SETUP
  ------------------------------------- */

  function setup(map: maplibregl.Map) {
    if (!popupClickHandlerRegistered) {
      document.addEventListener('click', ev => {
        const target = ev.target as HTMLElement;
        const action = target.getAttribute('data-map-action');
        if (!action || !currentPopup) return;

        ev.preventDefault();

        const propsJson = (currentPopup as any)._popupProps;
        const coords = (currentPopup as any)._popupCoords;
        const groupedItems = (currentPopup as any)._popupGroupedItems || [];

        const indexAttr = target.getAttribute('data-map-index');

        if (propsJson && coords) {
          handlePopupAction(action, propsJson, coords, {
            index: indexAttr,
            groupedItems,
          });
        }
      });

      popupClickHandlerRegistered = true;
    }

    map.on('mouseenter', 'address-dots', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'address-dots', () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('click', 'address-dots', e => {
      const f = e.features?.[0];
      if (!f) return;

      const p = f.properties as Record<string, any>;
      const geom = f.geometry as {
        type: 'Point';
        coordinates: [number, number];
      };
      const coords = geom.coordinates;

      let html: string;
      let groupedItems: MapAddress[] = [];

      // 1. Ville -> rues groupées
      if (p.total_adresses) {
        html = cityPopupHtml(p);
      }
      // 2. Rue -> numéro
      else if (
        p.numero &&
        dashboard.selectedStreet &&
        !dashboard.selectedNumeroFull
      ) {
        html = streetPopupHtml(p);
      }
      // 3. Numéro -> popup groupé des biens/units
      else if (dashboard.selectedNumeroFull) {
        groupedItems = getGroupedItemsForPoint(p);

        if (groupedItems.length > 1) {
          html = groupedNumberPopupHtml(p, groupedItems);
        } else if (groupedItems.length === 1) {
          html = numberPopupHtml(groupedItems[0] as Record<string, any>);
        } else {
          html = numberPopupHtml(p);
        }
      }
      // fallback si une seule ligne
      else if (options.getAddresses().length === 1) {
        html = numberPopupHtml(p);
      } else {
        return;
      }

      show(coords, html, map);

      if (currentPopup) {
        (currentPopup as any)._popupProps = p;
        (currentPopup as any)._popupCoords = coords;
        (currentPopup as any)._popupGroupedItems = groupedItems;
      }
    });
  }

  return { setup, close };
}