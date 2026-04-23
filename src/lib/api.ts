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
export interface AuthUserDto {
  id: string;
  email: string;
  role: "USER" | "OWNER" | "ADMIN" | "ORGANIZER" | "OPS";
  display_name: string;
  phone: string | null;
  notification_enabled: boolean;
}

export interface TokenPairDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ data: TokenPairDto }>("/auth/login", { email, password }).then(unwrap),

  // 백엔드는 UserOut(회원 정보)만 반환하며 토큰은 주지 않는다.
  // 가입 직후 자동 로그인이 필요하면 호출부에서 authApi.login을 이어 호출할 것.
  // role 은 "USER" 또는 "OWNER" 만 허용 (백엔드 Literal 타입과 동일).
  signup: (args: {
    email: string;
    password: string;
    display_name: string;
    phone?: string;
    role?: "USER" | "OWNER";
  }) =>
    client.post<{ data: AuthUserDto }>("/auth/signup", args).then(unwrap),

  me: () => client.get<{ data: AuthUserDto }>("/auth/me").then(unwrap),
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

  createRepeatRule: (gymId: string, body: { type: string; label: string; rruleSpec: string; enabled?: boolean }) =>
    client.post<{ data: { id: string; label: string; type: string } }>(`/gyms/${gymId}/repeat-rules`, body).then(unwrap),

  patchRepeatRule: (gymId: string, ruleId: string, body: Partial<{ label: string; rruleSpec: string; enabled: boolean }>) =>
    client.patch<{ data: { id: string; enabled: boolean } }>(`/gyms/${gymId}/repeat-rules/${ruleId}`, body).then(unwrap),

  deleteRepeatRule: (gymId: string, ruleId: string) =>
    client.delete(`/gyms/${gymId}/repeat-rules/${ruleId}`).then(unwrap),

  exceptionRules: (gymId: string) =>
    client.get<{ data: { exceptionRules: ExceptionRule[] } }>(`/gyms/${gymId}/exception-rules`).then(unwrap),

  createExceptionRule: (gymId: string, body: { label: string; exceptionDate: string; enabled?: boolean }) =>
    client.post<{ data: { id: string; label: string } }>(`/gyms/${gymId}/exception-rules`, body).then(unwrap),

  patchExceptionRule: (gymId: string, ruleId: string, body: Partial<{ label: string; enabled: boolean }>) =>
    client.patch<{ data: { id: string; enabled: boolean } }>(`/gyms/${gymId}/exception-rules/${ruleId}`, body).then(unwrap),

  deleteExceptionRule: (gymId: string, ruleId: string) =>
    client.delete(`/gyms/${gymId}/exception-rules/${ruleId}`).then(unwrap),

  patchSlot: (gymId: string, date: string, startTime: string, body: { status: string; price?: number | null }) =>
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
  dashboard: (params?: { gym_id?: string }) =>
    client.get<{ data: OwnerDashboard }>("/owners/me/dashboard", { params }).then(unwrap),

  reservations: (params?: { status?: string; gym_id?: string }) =>
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

  reviewPhotos: (reviewId: string) =>
    client.get<{ data: { photos: { id: string; url: string }[] } }>(`/admin/reviews/${reviewId}/photos`).then(unwrap),

  hideReview: (reviewId: string) =>
    client.post(`/admin/reviews/${reviewId}/hide`).then(unwrap),

  restoreReview: (reviewId: string) =>
    client.post(`/admin/reviews/${reviewId}/restore`).then(unwrap),

  pendingOwners: () =>
    client.get<{ data: { pendingOwners: PendingOwnerRow[] } }>("/admin/pending-owners").then(unwrap),

  approveOwner: (userId: string) =>
    client.post<{ data: { id: string; role: string } }>(`/admin/users/${userId}/approve-owner`).then(unwrap),

  rejectOwner: (userId: string) =>
    client.post<{ data: { id: string; role: string } }>(`/admin/users/${userId}/reject-owner`).then(unwrap),
};

export interface PendingOwnerRow {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  createdAt: string;
}

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

export interface CalendarSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  time: string; // "09:00 ~ 10:00" (표시용)
  status: "AVAILABLE" | "CLASS" | "REGULAR" | "CLOSED" | string;
  price: number | null;
}

export interface CalendarData {
  monthLabel: string;
  selectedDate?: string;
  legend: { status: string; label: string }[];
  slots: CalendarSlot[];
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
  gymPlaceId: string;
  gymName: string;
  date: string;
  time: string;
  status: string;
  finalPrice: number;
}

export interface OwnedGymBrief {
  gymPlaceId: string;
  name: string;
  district: string;
}

export interface OwnerDashboard {
  ownerGymProfile: { gymPlaceId: string; name: string; district: string };
  ownedGyms?: OwnedGymBrief[];
  kpis: { label: string; value: number }[];
  recentReservations: { id: string; bookerName: string; time: string; status: string }[];
}

export interface OwnerReservationRow {
  id: string;
  gymPlaceId: string;
  gymName: string;
  bookerName: string;
  teamName: string;
  phone: string;
  date: string;
  time: string;
  headcount: number;
  finalPrice: number;
  discountApplied: boolean;
  status: string;
  requestedAt: string | null;
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
