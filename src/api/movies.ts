import apiClient from './interceptor'

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() })
}

export interface Movie {
  id: number
  name: string
  title?: string // For backward compatibility
  genre?: string
  poster?: string
  posterUrl?: string
  ageRating: number
  duration?: string
  year?: string
  status: 'PLAYING' | 'UPCOMING' | 'ENDED'
}

export interface MoviesResponse {
  status: number
  message: string
  data: {
    items: Array<{
      id: number
      name: string
      releaseDate: string
      status: string
      poster?: string
      posterUrl?: string
      country: {
        id: number
        name: string
      }
      language: {
        id: number
        name: string
      }
      genre: Array<{
        id: number
        name: string
      }>
      ageRating: number
      isFeatured: boolean
    }>
    totalItems: number
    totalPages: number
    pageNo: number
    pageSize: number
  }
}

export interface MovieFilters {
  search?: string
  genre?: string
  genreId?: number
  pageNo?: number
  pageSize?: number
}

export interface UserSearchMovieRequest {
  name?: string
  genreId?: number
  status: 'PLAYING' | 'UPCOMING' | 'ENDED'
  pageNo: number
  pageSize: number
}

export interface PaginatedMoviesResult {
  movies: Movie[]
  pagination: {
    totalItems: number
    totalPages: number
    currentPage: number
    pageSize: number
    hasMore: boolean
  }
}

/**
 * Lấy danh sách phim đang chiếu với bộ lọc và pagination
 */
export const getNowShowingMoviesPaginated = async (filters?: MovieFilters): Promise<PaginatedMoviesResult> => {
  try {
    const requestBody: UserSearchMovieRequest = {
      name: filters?.search || undefined,
      genreId: filters?.genreId || undefined,
      status: 'PLAYING',
      pageNo: filters?.pageNo || 1,
      pageSize: filters?.pageSize || 8
    }
    
    const cacheKey = `now-showing-${JSON.stringify(requestBody)}`
    
    // Check cache first
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log('Using cached data for now showing movies:', {
        pageSize: requestBody.pageSize,
        cachedMoviesCount: cachedData.movies.length
      })
      return cachedData
    }
    
    console.log('Fetching now showing movies with request body:', requestBody)
    
    const response = await apiClient.post<MoviesResponse>('/movies/search', requestBody)
    
    if (response.data.status === 200 && response.data.data?.items) {
      const movies = response.data.data.items.map(movie => ({
        id: movie.id || 0,
        name: movie.name || 'Unknown Movie',
        title: movie.name || 'Unknown Movie',
        genre: movie.genre?.map(g => g.name).join(', ') || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster || '/placeholder.svg',
        ageRating: movie.ageRating || 13,
        duration: '120 phút',
        year: new Date(movie.releaseDate).getFullYear().toString(),
        status: movie.status as 'PLAYING' | 'UPCOMING' | 'ENDED'
      }))
      
      const result = {
        movies,
        pagination: {
          totalItems: response.data.data.totalItems,
          totalPages: response.data.data.totalPages,
          currentPage: response.data.data.pageNo,
          pageSize: response.data.data.pageSize,
          hasMore: response.data.data.pageNo < response.data.data.totalPages
        }
      }
      
      // Cache the result
      setCachedData(cacheKey, result)
      return result
    }
    
    throw new Error('Failed to fetch now showing movies')
  } catch (error) {
    console.error('Error fetching now showing movies:', error)
    return {
      movies: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 8,
        hasMore: false
      }
    }
  }
}

/**
 * Lấy danh sách phim đang chiếu với bộ lọc (backward compatibility)
 */
export const getNowShowingMovies = async (filters?: MovieFilters): Promise<Movie[]> => {
  try {
    const requestBody: UserSearchMovieRequest = {
      name: filters?.search || undefined,
      genreId: filters?.genreId || undefined,
      status: 'PLAYING',
      pageNo: 1,
      pageSize: 8 // Get more movies
    }
    
    console.log('Fetching now showing movies with request body:', requestBody)
    
    const response = await apiClient.post<MoviesResponse>('/movies/search', requestBody)
    
    if (response.data.status === 200 && response.data.data?.items) {
      const movies = response.data.data.items.map(movie => ({
        id: movie.id || 0,
        name: movie.name || 'Unknown Movie',
        title: movie.name || 'Unknown Movie',
        genre: movie.genre?.map(g => g.name).join(', ') || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster || '/placeholder.svg',
        ageRating: movie.ageRating || 13,
        duration: '120 phút',
        year: new Date(movie.releaseDate).getFullYear().toString(),
        status: movie.status as 'PLAYING' | 'UPCOMING' | 'ENDED'
      }))
      
      return movies
    }
    
    throw new Error('Failed to fetch now showing movies')
  } catch (error) {
    console.error('Error fetching now showing movies:', error)
    return []
  }
}

/**
 * Lấy danh sách phim sắp chiếu với pagination
 */
export const getComingSoonMoviesPaginated = async (filters?: MovieFilters): Promise<PaginatedMoviesResult> => {
  try {
    const requestBody: UserSearchMovieRequest = {
      name: filters?.search || undefined,
      genreId: filters?.genreId || undefined,
      status: 'UPCOMING',
      pageNo: filters?.pageNo || 1,
      pageSize: filters?.pageSize || 8
    }
    
    const cacheKey = `coming-soon-${JSON.stringify(requestBody)}`
    
    // Check cache first
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log('Using cached data for coming soon movies')
      return cachedData
    }
    
    console.log('Fetching coming soon movies with request body:', requestBody)
    
    const response = await apiClient.post<MoviesResponse>('/movies/search', requestBody)
    
    if (response.data.status === 200 && response.data.data?.items) {
      const movies = response.data.data.items.map(movie => ({
        id: movie.id || 0,
        name: movie.name || 'Unknown Movie',
        title: movie.name || 'Unknown Movie',
        genre: movie.genre?.map(g => g.name).join(', ') || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster || '/placeholder.svg',
        ageRating: movie.ageRating || 13,
        duration: '120 phút',
        year: new Date(movie.releaseDate).getFullYear().toString(),
        status: 'UPCOMING' as const
      }))
      
      const result = {
        movies,
        pagination: {
          totalItems: response.data.data.totalItems,
          totalPages: response.data.data.totalPages,
          currentPage: response.data.data.pageNo,
          pageSize: response.data.data.pageSize,
          hasMore: response.data.data.pageNo < response.data.data.totalPages
        }
      }
      
      // Cache the result
      setCachedData(cacheKey, result)
      return result
    }
    
    throw new Error('Failed to fetch coming soon movies')
  } catch (error) {
    console.error('Error fetching coming soon movies:', error)
    return {
      movies: [],
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 8,
        hasMore: false
      }
    }
  }
}

/**
 * Lấy danh sách phim sắp chiếu (backward compatibility)
 */
export const getComingSoonMovies = async (filters?: MovieFilters): Promise<Movie[]> => {
  try {
    const requestBody: UserSearchMovieRequest = {
      name: filters?.search || undefined,
      genreId: filters?.genreId || undefined,
      status: 'UPCOMING',
      pageNo: 1,
      pageSize: 100 // Get more movies
    }
    
    console.log('Fetching coming soon movies with request body:', requestBody)
    
    const response = await apiClient.post<MoviesResponse>('/movies/search', requestBody)
    
    if (response.data.status === 200 && response.data.data?.items) {
      const movies = response.data.data.items.map(movie => ({
        id: movie.id || 0,
        name: movie.name || 'Unknown Movie',
        title: movie.name || 'Unknown Movie',
        genre: movie.genre?.map(g => g.name).join(', ') || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster || '/placeholder.svg',
        ageRating: movie.ageRating || 13,
        duration: '120 phút',
        year: new Date(movie.releaseDate).getFullYear().toString(),
        status: 'UPCOMING' as const
      }))
      
      return movies
    }
    
    throw new Error('Failed to fetch coming soon movies')
  } catch (error) {
    console.error('Error fetching coming soon movies:', error)
    return []
  }
}

/**
 * Lấy phim nổi bật cho trang chủ (đang chiếu)
 */
export const getHomepageMovies = async (): Promise<Movie[]> => {
  try {
    const cacheKey = 'homepage-movies-playing'
    
    // Check cache first
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log('Using cached data for homepage movies')
      return cachedData
    }
    
    const response = await apiClient.get<{
      status: number
      message: string
      data: Array<{
        id: number
        name: string
        title?: string
        genre?: string
        poster?: string
        posterUrl?: string
        ageRating?: number | string
        duration?: string
        year?: string
      }>
    }>('/movies/top/4?movieStatus=PLAYING')
    
    if (response.data.status === 200 && response.data.data) {
      const movies = response.data.data.map(movie => ({
        id: movie.id || 0,
        name: movie.name || movie.title || 'Unknown Movie',
        title: movie.title || movie.name || 'Unknown Movie',
        genre: movie.genre || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster,
        ageRating: typeof movie.ageRating === 'string' ? parseInt(movie.ageRating) : movie.ageRating || 13,
        duration: movie.duration || '120 phút',
        year: movie.year || new Date().getFullYear().toString(),
        status: 'PLAYING' as const
      }))
      
      // Cache the result
      setCachedData(cacheKey, movies)
      return movies
    }
    
    throw new Error('Failed to fetch homepage movies')
  } catch (error) {
    console.error('Error fetching homepage movies:', error)
    return []
  }
}

/**
 * Lấy phim sắp chiếu cho trang chủ
 */
export const getHomepageComingSoon = async (): Promise<Movie[]> => {
  try {
    const cacheKey = 'homepage-movies-upcoming'
    
    // Check cache first
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      console.log('Using cached data for homepage coming soon movies')
      return cachedData
    }
    
    const response = await apiClient.get<{
      status: number
      message: string
      data: Array<{
        id: number
        name: string
        title?: string
        genre?: string
        poster?: string
        posterUrl?: string
        ageRating?: number | string
        duration?: string
        year?: string
      }>
    }>('/movies/top/4?movieStatus=UPCOMING')
    
    if (response.data.status === 200 && response.data.data) {
      const movies = response.data.data.map(movie => ({
        id: movie.id || 0,
        name: movie.name || movie.title || 'Unknown Movie',
        title: movie.title || movie.name || 'Unknown Movie',
        genre: movie.genre || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster,
        ageRating: typeof movie.ageRating === 'string' ? parseInt(movie.ageRating) : movie.ageRating || 13,
        duration: movie.duration || '120 phút',
        year: movie.year || new Date().getFullYear().toString(),
        status: 'UPCOMING' as const
      }))
      
      // Cache the result
      setCachedData(cacheKey, movies)
      return movies
    }
    
    throw new Error('Failed to fetch homepage coming soon movies')
  } catch (error) {
    console.error('Error fetching homepage coming soon movies:', error)
    return []
  }
}

/**
 * Lấy chi tiết phim theo ID
 */
export const getMovieById = async (id: number): Promise<Movie | null> => {
  try {
    const response = await apiClient.get<{
      status: number
      message: string
      data: {
        id: number
        name: string
        releaseDate: string
        status: string
        poster?: string
        posterUrl?: string
        country: {
          id: number
          name: string
        }
        language: {
          id: number
          name: string
        }
        genre: Array<{
          id: number
          name: string
        }>
        ageRating: number
        isFeatured: boolean
      }
    }>(`/movies/${id}`)
    
    if (response.data.status === 200 && response.data.data) {
      const movie = response.data.data
      return {
        id: movie.id,
        name: movie.name,
        title: movie.name,
        genre: movie.genre?.map(g => g.name).join(', ') || 'Unknown',
        poster: movie.poster || '/placeholder.svg',
        posterUrl: movie.posterUrl || movie.poster || '/placeholder.svg',
        ageRating: movie.ageRating,
        duration: '120 phút',
        year: new Date(movie.releaseDate).getFullYear().toString(),
        status: movie.status as 'PLAYING' | 'UPCOMING' | 'ENDED'
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching movie by ID:', error)
    return null
  }
}
