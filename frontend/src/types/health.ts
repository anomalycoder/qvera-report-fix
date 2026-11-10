export interface DataFilesStatus {
  questions_json: boolean
  reports_json: boolean
  taxonomy_json: boolean
  data_dir_path: string
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  service: string
  version: string
  environment: string
  database: string
  data_files: DataFilesStatus
  timestamp: string
}
