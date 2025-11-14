import { apiClient } from "@/src/api/interceptor"

export interface DashboardMetrics {
  totalUsers: number
  newUsers: number
  totalLogins: number
  activeSessions: number
}

export interface ActivityPoint {
  date: string
  newUsers: number
  logins: number
  activeSessions: number
}

export interface RecentActivity {
  id?: string | number
  timestamp: string
  user: string
  action: string
  detail?: string
  status?: string
}

export interface DashboardResponse {
  metrics: DashboardMetrics
  activity: ActivityPoint[]
  recentActivities: RecentActivity[]
}

export interface AccountSummary {
  id?: string | number
  email: string
  fullName?: string
  role?: string
  status?: string
  createdAt?: string
  lastLogin?: string
}

export interface AccountListResponse {
  accounts: AccountSummary[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface DashboardQueryParams {
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

const normalizeMetrics = (data: any): DashboardMetrics => {
  if (!data) {
    return {
      totalUsers: 0,
      newUsers: 0,
      totalLogins: 0,
      activeSessions: 0,
    }
  }

  const metrics = data.metrics ?? data;

  return {
    totalUsers: Number(metrics.totalUsers ?? metrics.total ?? 0),
    newUsers: Number(metrics.newUsers ?? metrics.new ?? 0),
    totalLogins: Number(metrics.totalLogins ?? metrics.logins ?? 0),
    activeSessions: Number(metrics.activeSessions ?? metrics.active ?? 0),
  }
}

const normalizeActivity = (data: any): ActivityPoint[] => {
  if (!data) return []

  const series = Array.isArray(data)
    ? data
    : data.activity ?? data.userActivity ?? data.chart ?? []

  return series.map((item: any) => ({
    date: String(item.date ?? item.day ?? item.label ?? ""),
    newUsers: Number(item.newUsers ?? item.registrations ?? item.new ?? 0),
    logins: Number(item.logins ?? item.loginCount ?? item.value ?? 0),
    activeSessions: Number(item.activeSessions ?? item.active ?? 0),
  }))
}

const normalizeActivities = (data: any): RecentActivity[] => {
  const list = Array.isArray(data)
    ? data
    : data?.recentActivities ?? data?.activities ?? []

  return list.map((item: any, index: number) => ({
    id: item.id ?? item.activityId ?? index,
    timestamp: item.time ?? item.timestamp ?? item.createdAt ?? "",
    user: item.user ?? item.email ?? item.actor ?? "",
    action: item.action ?? item.event ?? item.type ?? "",
    detail: item.detail ?? item.description ?? item.message,
    status: item.status ?? item.state,
  }))
}

const normalizeAccounts = (data: any): AccountListResponse => {
  const payload = data?.data ?? data

  const list =
    payload?.accounts ??
    payload?.items ??
    payload?.content ??
    payload?.results ??
    []

  const totalElements = Number(
    payload?.totalElements ?? payload?.total ?? payload?.count ?? list.length ?? 0
  )

  const size = Number(payload?.size ?? payload?.pageSize ?? payload?.limit ?? list.length ?? 10)

  const page = Number(payload?.page ?? payload?.pageNumber ?? payload?.currentPage ?? 0)

  const totalPages = Number(
    payload?.totalPages ?? payload?.pages ?? Math.ceil(totalElements / (size || 1))
  )

  const accounts: AccountSummary[] = list.map((item: any, index: number) => {
    // Try multiple field names for full name
    const fullName = 
      item.fullName ?? 
      item.name ?? 
      item.username ?? 
      item.customerName ??
      item.userName ??
      (item.firstName && item.lastName ? `${item.firstName} ${item.lastName}`.trim() : null) ??
      item.firstName ??
      item.lastName ??
      undefined

    return {
      id: item.id ?? item.accountId ?? item.userId ?? index,
      email: item.email ?? "",
      fullName: fullName,
      role: item.role ?? item.roleName ?? item.authority,
      status: item.status ?? item.state ?? item.activeStatus,
      createdAt: item.createdAt ?? item.joinedAt ?? item.createdDate,
      lastLogin: item.lastLogin ?? item.lastLoginAt ?? item.updatedAt,
    }
  })

  return {
    accounts,
    totalElements,
    totalPages,
    page,
    size,
  }
}

export async function fetchAdminDashboard(params: DashboardQueryParams = {}): Promise<DashboardResponse> {
  const { data } = await apiClient.get("/api/dashboard/admin", {
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page,
      size: params.size,
    },
  })

  const payload = data?.data ?? data

  return {
    metrics: normalizeMetrics(payload.metrics ?? payload),
    activity: normalizeActivity(payload.activity ?? payload.userActivity ?? payload.activityChart),
    recentActivities: normalizeActivities(payload.recentActivities ?? payload.activities),
  }
}

export async function fetchAdminAccounts(params: DashboardQueryParams = {}): Promise<AccountListResponse> {
  const { data } = await apiClient.get("/api/dashboard/accounts", {
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page,
      size: params.size,
    },
  })

  return normalizeAccounts(data)
}
