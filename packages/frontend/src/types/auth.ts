export interface User {
  id: string
  username: string
  name: string
  phone?: string
  email?: string
  department?: string
  position?: string
  avatar?: string
  role: string
  status?: string
  superiorId?: string
  subordinateIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
