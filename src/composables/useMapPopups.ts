// filepath: src/composables/useMapPopups.ts
//
// Composable encapsulating MapLibre popup logic for the three address modes:
//   1. City mode  (grouped by street)  → link "Voir la rue"
//   2. Street mode (individual numbers) → link "Voir ce numéro"
//   3. Number mode (single property)   → link "Ouvrir la fiche"
//
// All DOM event wiring uses a single delegated listener to avoid leaks.

import maplibregl from 'maplibre-gl';
import { useDashboardStore } from '@/stores/dashboard';
import type { IAddressDetail, IAddressGrouped } from '@/types/address';

export type MapAddress = IAddressDetail | IAddressGrouped | Record<string, any>;

interface UseMapPopupsOptions {
  /** Getter for the current addresses list */
  getAddresses: () => MapAddress[];
  /** Called when the user clicks "Ouvrir la fiche" on a single-property popup */
  onEditProperty: (property: MapAddress) => void;
  /** Fly the map to given coordinates */
  flyTo: (lon: number | string, lat: number | string, zoom: number) => void;
}

/**
 * Creates the popup manager.
 * Call `setup(map)` once the map `load` event fires.
 * Call `close()` to dismiss the active popup (e.g. on watcher changes).
 */
export function useMapPopups(options: UseMapPopupsOptions) {
  const dashboard = useDashboardStore();
  let currentPopup: maplibregl.Popup | null = null;

  /* ---- helpers ---- */

  function show(coords: [number, number], html: string, map: maplibregl.Map) {
    close();
    currentPopup = new maplibregl.Popup()
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

  /* ---- popup HTML builders ---- */

  function cityPopupHtml(p: Record<string, any>) {
    return `
      <b>${p.nom_voie}</b><br>
      ${p.code_postal} ${p.nom_commune}<br>
      <i>${p.total_adresses} adresses</i><br><br>
      <a href="#" data-map-action="view-street">Voir la rue</a>
    `;
  }

  function streetPopupHtml(p: Record<string, any>) {
    const fullNum = p.rep ? `${p.numero} ${p.rep}` : p.numero;
    return `
      <b>${fullNum}</b> ${p.nom_voie}<br>
      ${p.code_postal} ${p.nom_commune}<br><br>
      <a href="#" data-map-action="view-num">Voir ce numéro</a>
    `;
  }

  function numberPopupHtml(p: Record<string, any>) {
    return `
      <b>${p.numero || ''} ${p.rep || ''} ${p.nom_voie}</b><br>
      ${p.code_postal} ${p.nom_commune}<br><br>
      <a href="#" data-map-action="open-property">Ouvrir la fiche</a>
    `;
  }

  /* ---- popup action handler (event delegation) ---- */

  function handlePopupAction(
    action: string,
    p: Record<string, any>,
    coords: [number, number]
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

      case 'open-property':
        options.onEditProperty(options.getAddresses()[0]);
        break;
    }
  }

  /* ---- setup: wire click on dvf-dotslaer ---- */

  function setup(map: maplibregl.Map) {
    // Delegated click listener on popup anchors
    document.addEventListener('click', ev => {
      const target = ev.target as HTMLElement;
      const action = target.getAttribute('data-map-action');
      if (!action || !currentPopup) return;

      ev.preventDefault();

      // Retrieve the stored properties from the popup's dataset
      const propsJson = (currentPopup as any)._popupProps;
      const coords = (currentPopup as any)._popupCoords;
      if (propsJson && coords) {
        handlePopupAction(action, propsJson, coords);
      }
    });

    map.on('click', 'dvf-dots', e => {
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties as Record<string, any>;
      const geom = f.geometry as {
        type: 'Point';
        coordinates: [number, number];
      };
      const coords = geom.coordinates;

      let html: string;

      // 1. City mode (grouped by street)
      if (p.total_adresses) {
        html = cityPopupHtml(p);
      }
      // 2. Street mode (individual numbers)
      else if (
        p.numero &&
        dashboard.selectedStreet &&
        !dashboard.selectedNumeroFull
      ) {
        html = streetPopupHtml(p);
      }
      // 3. Number mode (single property)
      else if (options.getAddresses().length === 1) {
        html = numberPopupHtml(p);
      } else {
        return;
      }

      show(coords, html, map);

      // Store props/coords on the popup so the delegated handler can use them
      if (currentPopup) {
        (currentPopup as any)._popupProps = p;
        (currentPopup as any)._popupCoords = coords;
      }
    });
  }

  return { setup, close };
}
