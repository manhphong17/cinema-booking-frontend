import { type NextRequest, NextResponse } from "next/server"

// Mock database - replace with real database in production
const moviesDB = [
  {
    id: "1",
    poster: "/spider-man-poster.jpg",
    title: "Spider-Man: No Way Home",
    genre: "Action",
    language: "English",
    duration: 148,
    releaseDate: "2025-01-15",
    status: "upcoming" as const,
    description:
      "Peter Parker's identity is revealed, bringing his superhero responsibilities into conflict with his normal life.",
    director: "Jon Watts",
    actors: "Tom Holland, Zendaya, Benedict Cumberbatch",
    ageRating: "T13",
    year: 2025,
    country: "USA",
  },
  {
    id: "2",
    poster: "/top-gun-poster.jpg",
    title: "Top Gun: Maverick",
    genre: "Action",
    language: "English",
    duration: 131,
    releaseDate: "2025-01-20",
    status: "upcoming" as const,
    description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator.",
    director: "Joseph Kosinski",
    actors: "Tom Cruise, Miles Teller, Jennifer Connelly",
    ageRating: "T13",
    year: 2025,
    country: "USA",
  },
  {
    id: "3",
    poster: "/parasite-poster.jpg",
    title: "Parasite",
    genre: "Thriller",
    language: "Korean",
    duration: 132,
    releaseDate: "2024-11-10",
    status: "ended" as const,
    description: "A poor family schemes to become employed by a wealthy family and infiltrate their household.",
    director: "Bong Joon-ho",
    actors: "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong",
    ageRating: "T16",
    year: 2024,
    country: "Korea",
  },
]

// GET /api/movies - Fetch movies with filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const page = Number.parseInt(searchParams.get("page") || "1")
  const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
  const sortField = searchParams.get("sortField") || "releaseDate"
  const sortDirection = searchParams.get("sortDirection") || "asc"
  const search = searchParams.get("search") || ""
  const genre = searchParams.get("genre")
  const language = searchParams.get("language")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const statusParam = searchParams.get("status") || ""

  // Filter movies
  const filtered = moviesDB.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase())
    const matchesGenre = !genre || genre === "all" || movie.genre === genre
    const matchesLanguage = !language || language === "all" || movie.language === language

    const movieDate = new Date(movie.releaseDate)
    const matchesDateFrom = !dateFrom || movieDate >= new Date(dateFrom)
    const matchesDateTo = !dateTo || movieDate <= new Date(dateTo)

    const statuses = statusParam.split(",").filter(Boolean)
    const matchesStatus = statuses.length === 0 || statuses.includes(movie.status)

    return matchesSearch && matchesGenre && matchesLanguage && matchesDateFrom && matchesDateTo && matchesStatus
  })

  // Sort movies
  filtered.sort((a, b) => {
    let comparison = 0
    if (sortField === "title") {
      comparison = a.title.localeCompare(b.title)
    } else if (sortField === "releaseDate") {
      comparison = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  // Paginate
  const total = filtered.length
  const startIndex = (page - 1) * pageSize
  const paginatedMovies = filtered.slice(startIndex, startIndex + pageSize)

  return NextResponse.json({
    movies: paginatedMovies,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

// POST /api/movies - Create new movie
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Handle file upload
    const posterFile = formData.get("posterFile") as File | null
    let posterPath = formData.get("poster") as string

    if (posterFile) {
      // In production, upload to storage service (S3, Cloudinary, etc.)
      // For now, we'll use a placeholder path
      posterPath = `/uploads/${Date.now()}-${posterFile.name}`
      // TODO: Implement actual file upload logic
    }

    const newMovie = {
      id: Date.now().toString(),
      poster: posterPath || "/movie-poster.jpg",
      title: formData.get("title") as string,
      genre: formData.get("genre") as string,
      language: formData.get("language") as string,
      duration: Number.parseInt(formData.get("duration") as string),
      releaseDate: formData.get("releaseDate") as string,
      status: formData.get("status") as "upcoming" | "now-showing" | "ended",
      description: formData.get("description") as string,
      director: formData.get("director") as string,
      actors: formData.get("actors") as string,
      ageRating: formData.get("ageRating") as string,
      year: Number.parseInt(formData.get("year") as string),
      country: formData.get("country") as string,
    }

    moviesDB.push(newMovie)

    return NextResponse.json({ success: true, movie: newMovie }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create movie" }, { status: 500 })
  }
}
