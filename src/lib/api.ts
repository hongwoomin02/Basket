import axios, { AxiosInstance, AxiosResponse } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// JWT 자동 첨부
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 시 토큰 제거
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

function unwrap<T>(res: AxiosResponse<{ data: T }>): T {
  return res.data.data;
}

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ data: { access_token: string; refresh_token: string; token_type: string } }>(
      "/auth/login",
      { email, password }
    ).then(unwrap),

  signup: (email: string, password: string, display_name: string, phone?: string) =>
    client.post<{ data: { access_token: string; refresh_token: string } }>(
      "/auth/signup",
      { email, password, display_name, phone }
    ).then(unwrap),

  me: () =>
    client.get<{ data: { id: string; email: string; role: string; display_name: string } }>(
      "/auth/me"
    ).then(unwrap),
};

// ── Places ────────────────────────────────────────────
export const placesApi = {
  list: (params?: {
    district?: string;
    placeType?: string;
    reservableOnly?: boolean;
    discountableOnly?: boolean;
    q?: string;
    limit?: number;
    offset?: number;
  }) => client.get<{ data: PlaceItem[] }>("/places", { params }).then(unwrap),

  homeMapSummary: () =>
    client.get<{ data: HomeMapSummary }>("/places/home-map-summary").then(unwrap),
};

// ── Gyms ──────────────────────────────────────────────
export const gymsApi = {
  detail: (gymId: string) =>
    client.get<{ data: GymDetail }>(`/gyms/${gymId}`).then(unwrap),

  gallery: (gymId: string) =>
    client.get<{ data: { gallery: { id: string; url: string }[] } }>(`/gyms/${gymId}/gallery`).then(unwrap),

  pricingPolicy: (gymId: string) =>
    client.get<{ data: PricingPolicy }>(`/gyms/${gymId}/pricing-policy`).then(unwrap),

  calendar: (gymId: string, month: string, selectedDate?: string) =>
    client.get<{ data: CalendarData }>(`/gyms/${gymId}/calendar`, {
      params: { month, selectedDate },
    }).then(unwrap),

  paymentMethods: (gymId: string) =>
    client.get<{ data: PaymentMethods }>(`/gyms/${gymId}/payment-methods`).then(unwrap),

  updatePaymentMethods: (gymId: string, body: Partial<PaymentMethods>) =>
    client.put<{ data: PaymentMethods }>(`/gyms/${gymId}/payment-methods`, body).then(unwrap),

  updatePricingPolicy: (gymId: string, body: Partial<PricingPolicy>) =>
    client.put<{ data: PricingPolicy }>(`/gyms/${gymId}/pricing-policy`, body).then(unwrap),

  repeatRules: (gymId: string) =>
    client.get<{ data: { repeatRules: RepeatRule[] } }>(`/gyms/${gymId}/repeat-rules`).then(unwrap),

  exceptionRules: (gymId: string) =>
    client.get<{ data: { exceptionRules: ExceptionRule[] } }>(`/gyms/${gymId}/exception-rules`).then(unwrap),

  patchSlot: (gymId: string, date: string, startTime: string, body: { status: string; price?: number }) =>
    client.patch(`/gyms/${gymId}/slots/${date}/${startTime}`, body).then(unwrap),
};

// ── Outdoors ──────────────────────────────────────────
export const outdoorsApi = {
  detail: (placeId: string) =>
    client.get<{ data: OutdoorDetail }>(`/outdoors/${placeId}`).then(unwrap),

  gallery: (placeId: string) =>
    client.get<{ data: { gallery: { id: string; url: string }[] } }>(`/outdoors/${placeId}/gallery`).then(unwrap),

  reviewSummary: (placeId: string) =>
    client.get<{ data: ReviewSummary }>(`/outdoors/${placeId}/review-summary`).then(unwrap),

  reviews: (placeId: string, params?: { sort?: string }) =>
    client.get<{ data: { reviews: Review[] } }>(`/outdoors/${placeId}/reviews`, { params }).then(unwrap),

  reviewFormMeta: (placeId: string) =>
    client.get<{ data: { availableTags: string[]; photoLimit: number } }>(
      `/outdoors/${placeId}/review-form-metadata`
    ).then(unwrap),

  createReview: (placeId: string, body: { rating: number; tags: string[]; text?: string; visitedAt?: string }) =>
    client.post(`/outdoors/${placeId}/reviews`, body).then(unwrap),
};

// ── Reservations ──────────────────────────────────────
export const reservationsApi = {
  create: (body: {
    gymId: string;
    slotId?: string;
    date?: string;
    timeLabel?: string;
    teamName: string;
    bookerName: string;
    phone: string;
    peopleCount: number;
    memo?: string;
    idempotencyKey?: string;
  }) => client.post<{ data: { reservationId: string; status: string; pricingSnapshot: PricingSnapshot } }>(
    "/reservations",
    body
  ).then(unwrap),

  get: (reservationId: string) =>
    client.get<{ data: ReservationDetail }>(`/reservations/${reservationId}`).then(unwrap),

  timeline: (reservationId: string) =>
    client.get<{ data: { statusTimeline: TimelineItem[] } }>(`/reservations/${reservationId}/timeline`).then(unwrap),

  transferDone: (reservationId: string, body: { payerName: string; submittedAt?: string }) =>
    client.post(`/reservations/${reservationId}/transfer-done`, body).then(unwrap),

  myList: () =>
    client.get<{ data: { reservations: ReservationSummary[] } }>("/reservations/my/list").then(unwrap),
};

// ── Owner ─────────────────────────────────────────────
export const ownerApi = {
  dashboard: () =>
    client.get<{ data: OwnerDashboard }>("/owners/me/dashboard").then(unwrap),

  reservations: (params?: { status?: string }) =>
    client.get<{ data: { rows: OwnerReservationRow[] } }>("/owners/me/reservations", { params }).then(unwrap),

  markChecked: (reservationId: string) =>
    client.post(`/owners/reservations/${reservationId}/mark-checked`).then(unwrap),

  markConfirmed: (reservationId: string) =>
    client.post(`/owners/reservations/${reservationId}/mark-confirmed`).then(unwrap),

  markCancelled: (reservationId: string) =>
    client.post(`/owners/reservations/${reservationId}/mark-cancelled`).then(unwrap),
};

// ── Admin ─────────────────────────────────────────────
export const adminApi = {
  reviews: (params?: { status?: string }) =>
    client.get<{ data: { reviewRows: AdminReviewRow[] } }>("/admin/reviews", { params }).then(unwrap),

  hideReview: (reviewId: string) =>
    client.post(`/admin/reviews/${reviewId}/hide`).then(unwrap),

  restoreReview: (reviewId: string) =>
    client.post(`/admin/reviews/${reviewId}/restore`).then(unwrap),
};

// ── Types ─────────────────────────────────────────────
export interface PlaceItem {
  id: string;
  type: "GYM" | "OUTDOOR";
  name: string;
  district: string;
  address?: string;
  shortDescription?: string;
  lat?: number;
  lng?: number;
}

export interface HomeMapSummary {
  centerLabel: string;
  markerCount: number;
  legend: { type: string; label: string }[];
  pins: { placeId: string; kind: string; lat: number; lng: number; name: string }[];
}

export interface GymDetail {
  place: { id: string; name: string; address: string; district: string };
  gymProfile: {
    courtCount: number;
    hours: string;
    parking: boolean;
    amenities: string[];
    description: string;
  };
}

export interface PricingPolicy {
  baseHourlyPrice: number;
  weekendHourlyPrice: number;
  discountPersonThreshold?: number;
  discountRatePercent?: number;
  discountFixedAmount?: number;
  sameDayOnly?: boolean;
}

export interface CalendarData {
  monthLabel: string;
  selectedDate?: string;
  legend: { status: string; label: string }[];
  slots: { id: string; time: string; status: string; price: number | null }[];
}

export interface PaymentMethods {
  kakaoPayLink?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  visibleMethods: string[];
}

export interface RepeatRule {
  id: string;
  label: string;
  type: string;
  rruleSpec: string;
  enabled: boolean;
}

export interface ExceptionRule {
  id: string;
  label: string;
  exceptionDate?: string;
  enabled: boolean;
}

export interface OutdoorDetail {
  place: {
    id: string;
    name: string;
    address: string;
    district: string;
    feeType: string;
    floorStatus: string;
    lightStatus: string;
    rimStatus: string;
    cleanliness: string;
    crowdLevel: string;
    description: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
  tagSummary: { tag: string; count: number }[];
}

export interface Review {
  id: string;
  nickname: string;
  rating: number;
  tags: string[];
  content: string;
  photos: string[];
  visitedAt?: string;
}

export interface PricingSnapshot {
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  discountApplied: boolean;
}

export interface ReservationDetail {
  reservationId: string;
  gymName: string;
  date: string;
  time: string;
  peopleCount: number;
  finalPrice: number;
  status: string;
}

export interface TimelineItem {
  key: string;
  label: string;
  doneAt: string | null;
}

export interface ReservationSummary {
  id: string;
  gymName: string;
  date: string;
  time: string;
  status: string;
  finalPrice: number;
}

export interface OwnerDashboard {
  ownerGymProfile: { gymPlaceId: string; name: string; district: string };
  kpis: { label: string; value: number }[];
  recentReservations: { id: string; bookerName: string; time: string; status: string }[];
}

export interface OwnerReservationRow {
  id: string;
  bookerName: string;
  teamName: string;
  date: string;
  time: string;
  headcount: number;
  finalPrice: number;
  discountApplied: boolean;
  status: string;
}

export interface AdminReviewRow {
  id: string;
  placeName: string;
  nickname: string;
  rating: number;
  tags: string[];
  content: string;
  hasPhoto: boolean;
  status: string;
  createdAt: string;
}

export default client;
