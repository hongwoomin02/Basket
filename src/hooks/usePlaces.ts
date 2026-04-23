import { useEffect, useState } from "react";
import { placesApi, PlaceItem } from "../lib/api";

export interface PlaceCardData {
  id: string;
  routeType: "gym" | "outdoor";
  name: string;
  district: string;
  address: string;
  lat: number | null;
  lng: number | null;
  placeType: "실내 체육관" | "야외 농구장";
  reservable: boolean;
  discountable: boolean;
  shortDescription: string;
  rating: number | null;
  badges: string[];
  to: string;
  searchBlob: string;
}

function toCardData(p: PlaceItem): PlaceCardData {
  const isGym = p.type === "GYM";
  const badges: string[] = [];
  return {
    id: p.id,
    routeType: isGym ? "gym" : "outdoor",
    name: p.name,
    district: p.district,
    address: p.address ?? "",
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    placeType: isGym ? "실내 체육관" : "야외 농구장",
    reservable: false,
    discountable: false,
    shortDescription: p.shortDescription ?? "",
    rating: null,
    badges,
    to: isGym ? `/gyms/${p.id}` : `/place/outdoor/${p.id}`,
    searchBlob: `${p.name} ${p.district} ${p.shortDescription ?? ""}`,
  };
}

export function usePlaces(params?: {
  district?: string;
  placeType?: string;
  reservableOnly?: boolean;
  discountableOnly?: boolean;
  q?: string;
}) {
  const [places, setPlaces] = useState<PlaceCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const apiParams: Record<string, unknown> = {};
    if (params?.district) apiParams.district = params.district;
    if (params?.placeType) {
      apiParams.placeType = params.placeType === "실내 체육관" ? "GYM" : "OUTDOOR";
    }
    if (params?.reservableOnly) apiParams.reservableOnly = true;
    if (params?.discountableOnly) apiParams.discountableOnly = true;
    if (params?.q) apiParams.q = params.q;

    placesApi
      .list(apiParams)
      .then((data) => setPlaces(data.map(toCardData)))
      .catch(() => setError("장소 목록을 불러오는데 실패했습니다."))
      .finally(() => setIsLoading(false));
  }, [
    params?.district,
    params?.placeType,
    params?.reservableOnly,
    params?.discountableOnly,
    params?.q,
  ]);

  return { places, isLoading, error };
}
