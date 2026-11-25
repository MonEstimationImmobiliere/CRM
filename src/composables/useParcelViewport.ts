import { isAxiosError } from 'axios';
import { ref, shallowRef } from 'vue';

export interface ParcelBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export const PARCEL_MIN_ZOOM = 16;
const CACHE_SIZE = 4;
const REQUEST_DELAY_MS = 120;

type Entry = { bounds: ParcelBounds; data: GeoJSON.FeatureCollection };
type Pending = { bounds: ParcelBounds; controller: AbortController; timer?: ReturnType<typeof setTimeout> };

export function normalizeParcelBounds(bounds: ParcelBounds): ParcelBounds | null {
  const { west, south, east, north } = bounds;
  const offset = 360 * Math.floor(((west + east) / 2 + 180) / 360);
  const normalized = { west: west - offset, south, east: east - offset, north };
  if (!Object.values(normalized).every(Number.isFinite) || normalized.west < -180 ||
      normalized.east > 180 || normalized.east <= normalized.west || south < -90 ||
      north > 90 || north <= south) return null;
  return normalized;
}

function bufferedBounds(bounds: ParcelBounds): ParcelBounds {
  const dx = (bounds.east - bounds.west) / 8;
  const dy = (bounds.north - bounds.south) / 8;
  return {
    west: Math.max(-180, bounds.west - dx),
    south: Math.max(-90, bounds.south - dy),
    east: Math.min(180, bounds.east + dx),
    north: Math.min(90, bounds.north + dy),
  };
}

function covers(outer: ParcelBounds, inner: ParcelBounds) {
  return outer.west <= inner.west && outer.south <= inner.south &&
    outer.east >= inner.east && outer.north >= inner.north;
}

export function useParcelViewport(
  readBounds: () => ParcelBounds | null,
  fetchParcels: (bounds: ParcelBounds, signal: AbortSignal) => Promise<GeoJSON.FeatureCollection>,
) {
  const collection = shallowRef<GeoJSON.FeatureCollection | null>(null);
  const error = ref<string | null>(null);
  const cache: Entry[] = [];
  let pending: Pending | null = null;

  function cancel() {
    if (!pending) return;
    clearTimeout(pending.timer);
    pending.controller.abort();
    pending = null;
  }

  async function load(request: Pending) {
    const isCurrent = () => {
      const visible = readBounds();
      return pending === request && !request.controller.signal.aborted &&
        !!visible && covers(request.bounds, visible);
    };

    try {
      if (!isCurrent()) return;
      const data = await fetchParcels(request.bounds, request.controller.signal);
      if (!isCurrent()) return;
      cache.unshift({ bounds: request.bounds, data });
      if (cache.length > CACHE_SIZE) cache.pop();
      collection.value = data;
    } catch (cause) {
      if (!isCurrent()) return;
      const code = isAxiosError(cause) ? cause.response?.data?.code : undefined;
      error.value = code === 'viewport_too_dense' || code === 'invalid_viewport'
        ? 'Zoomez davantage pour afficher les parcelles de cette zone.'
        : 'Impossible de charger les parcelles de cette zone.';
    } finally {
      if (pending === request) pending = null;
    }
  }

  function refresh() {
    const visible = readBounds();
    if (!visible) {
      cancel();
      error.value = null;
      return;
    }
    const index = cache.findIndex(entry => covers(entry.bounds, visible));
    if (index !== -1) {
      cancel();
      const [entry] = cache.splice(index, 1);
      cache.unshift(entry);
      collection.value = entry.data;
      error.value = null;
      return;
    }
    if (pending && covers(pending.bounds, visible)) return;

    cancel();
    error.value = null;
    collection.value = null;
    const request: Pending = { bounds: bufferedBounds(visible), controller: new AbortController() };
    pending = request;
    request.timer = setTimeout(() => { void load(request); }, REQUEST_DELAY_MS);
  }

  return { collection, error, refresh, cancel };
}
