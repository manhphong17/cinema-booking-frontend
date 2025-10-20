export interface Genre {
  id: number
  name: string
}

export interface Language {
  id: number
  name: string
}

export interface Country {
  id: number
  name: string
}

export interface Movie {
  id: number
  name: string
  description: string
  posterUrl: string
  bannerUrl: string
  duration: number // in minutes
  releaseDate: string
  trailerUrl: string
  status: 'PLAYING' | 'UPCOMING' | 'ENDED'
  country: Country
  language: Language
  genre: Genre[]
  ageRating: number
  actor: string
  director: string
}

export interface Showtime {
  id: string
  time: string
  hall: string
  price: number
  date: string
  movieId: string
}

export interface MovieDetailResponse {
  success: boolean
  data: Movie
  error?: string
}

export interface MovieListResponse {
  success: boolean
  data: {
    movies: Movie[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  error?: string
}
