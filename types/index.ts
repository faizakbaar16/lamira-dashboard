// ─── Common ─────────────────────────────────────────────────────────────────

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  meta?: { total: number; page: number; limit: number }
}

export type PaymentStatus = "pending" | "paid" | "overdue"
export type SyncStatus = "idle" | "syncing" | "success" | "error"

// ─── Employee ────────────────────────────────────────────────────────────────

export type EmployeeType = "harian" | "mingguan" | "bulanan"

export type Employee = {
  id: string
  name: string
  role: string
  type: EmployeeType
  base_rate: number
  active: boolean
  created_at: string
  updated_at: string
}

// ─── Customer ────────────────────────────────────────────────────────────────

export type PaymentTerms = "cash" | "net7" | "net14" | "net30"

export type Customer = {
  id: string
  name: string
  contact: string | null
  price_per_egg: number
  payment_terms: PaymentTerms
  active: boolean
  created_at: string
  updated_at: string
}

// ─── Bebek & Telur ───────────────────────────────────────────────────────────

export type DuckBatch = {
  id: string
  code: string
  name: string
  population: number
  feed_kg_per_day: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DuckDaily = {
  id: string
  date: string
  batch_id: string | null
  batch?: DuckBatch
  feed_type_id: string | null
  feed_type?: FeedType
  eggs_total: number
  eggs_reject: number
  feed_consumed_kg: number
  feed_cost: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type HealthRecordType = "obat" | "vitamin" | "vaksin" | "lainnya"

export type DuckHealthRecord = {
  id: string
  date: string
  batch_id: string | null
  batch?: DuckBatch
  record_type: HealthRecordType
  product_name: string
  dosage: string | null
  total_cost: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type SaltingCost = {
  id: string
  salting_log_id: string
  item_name: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  created_at: string
}

export type SaltingStatus = "in_process" | "ready" | "sold"

export type SaltingLog = {
  id: string
  date_salted: string
  quantity: number
  worker_names: string[]
  storage_location: string | null
  expected_ready_date: string
  status: SaltingStatus
  date_sold: string | null
  created_at: string
  updated_at: string
}

export type ProductType = "fresh" | "salted"

export type SalesTransaction = {
  id: string
  date: string
  customer_id: string
  customer?: Customer
  product_type: ProductType
  quantity: number
  unit_price: number
  total: number
  payment_status: PaymentStatus
  due_date: string | null
  created_at: string
  updated_at: string
}

export type HppConfig = {
  id: string
  value: number
  effective_date: string
  created_at: string
}

// ─── Tanaman ─────────────────────────────────────────────────────────────────

export type PlantBlock = "A" | "B" | "C" | "D" | "E" | "F" | "G"
export type PlantStatus = "dormant" | "active" | "producing" | "new_planting"

export type Plant = {
  id: string
  species: string
  variety: string | null
  block: PlantBlock
  quantity: number
  planting_year: number | null
  status: PlantStatus
  created_at: string
  updated_at: string
}

export type WorkType =
  | "pemupukan"
  | "penyemprotan"
  | "pemangkasan"
  | "penyiraman"
  | "panen"
  | "penanaman_baru"
  | "inspeksi"
  | "lainnya"

export type WorkLog = {
  id: string
  date: string
  plant_id: string
  plant?: Plant
  work_type: WorkType | string
  worker_names: string[]
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export type ScheduleStatus = "upcoming" | "due_today" | "overdue" | "completed"

export type CareSchedule = {
  id: string
  plant_id: string
  plant?: Plant
  work_type: WorkType | string
  frequency_days: number
  last_done: string | null
  next_due: string
  status: ScheduleStatus
  created_at: string
  updated_at: string
}

// ─── Pembangunan ─────────────────────────────────────────────────────────────

export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed"
export type MilestoneStatus = "pending" | "in_progress" | "completed"

export type Project = {
  id: string
  name: string
  description: string | null
  location: string | null
  start_date: string
  target_date: string
  budget: number
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export type Milestone = {
  id: string
  project_id: string
  name: string
  target_date: string
  completion_date: string | null
  status: MilestoneStatus
  created_at: string
  updated_at: string
}

export type ConstructionLog = {
  id: string
  date: string
  project_id: string
  project?: Project
  description: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type ConstructionMaterial = {
  id: string
  log_id: string
  item_name: string
  quantity: number
  unit: string
  unit_price: number
  total: number
}

export type ConstructionWorker = {
  id: string
  log_id: string
  employee_id: string
  employee?: Employee
  role: string
  day_rate: number
  days_worked: number
}

// ─── Penggajian ──────────────────────────────────────────────────────────────

export type Attendance = {
  id: string
  date: string
  employee_id: string
  employee?: Employee
  module: string | null
  hours_or_days: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type PayrollRecord = {
  id: string
  employee_id: string
  employee?: Employee
  period_month: number
  period_year: number
  gross: number
  deductions: number
  net: number
  paid_at: string | null
  created_at: string
  updated_at: string
}

// ─── Stok Pakan ──────────────────────────────────────────────────────────────

export type FeedType = {
  id: string
  name: string
  supplier: string | null
  price_per_kg: number
  min_stock_threshold: number
  current_stock_kg: number
  created_at: string
  updated_at: string
}

export type FeedPurchase = {
  id: string
  feed_type_id: string
  feed_type?: FeedType
  date: string
  quantity_kg: number
  price_per_kg: number
  supplier: string | null
  total_cost: number
  created_at: string
  updated_at: string
}

export type FeedDailyUsage = {
  id: string
  date: string
  feed_type_id: string
  feed_type?: FeedType
  quantity_kg: number
  linked_duck_daily_id: string | null
  created_at: string
  updated_at: string
}

// ─── Sync ────────────────────────────────────────────────────────────────────

export type SyncModule =
  | "bebek_harian"
  | "pengasinan"
  | "penjualan"
  | "pelanggan"
  | "tanaman_inventaris"
  | "log_pekerjaan"
  | "pembangunan"
  | "penggajian"
  | "stok_pakan"

export type SyncDirection = "push" | "pull"

export type SyncLog = {
  id: string
  module: string
  synced_at: string
  status: "success" | "error"
  records_synced: number | null
  error_message: string | null
}
