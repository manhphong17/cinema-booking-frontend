"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, ChevronDown } from "lucide-react"
import apiClient from "../../src/api/interceptor"

interface Genre {
  id: number
  name: string
}

interface MovieFilterProps {
  onFilterChange: (filters: FilterState) => void
  onClearFilters: () => void
}

export interface FilterState {
  search: string
  genre: string
}

export function MovieFilter({ onFilterChange, onClearFilters }: MovieFilterProps) {
  const [genres, setGenres] = useState<Genre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    genre: ""
  })

  // Fetch genres from API
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.get('/movies/movie-genres')
        setGenres(response.data.data || [])
      } catch (error) {
        console.error("Failed to fetch genres:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGenres()
  }, [])

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  // Handle genre selection
  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenre(genre)
    handleFilterChange("genre", genre.name)
    setShowGenreDropdown(false)
  }

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: "",
      genre: ""
    })
    setSelectedGenre(null)
    onClearFilters()
  }

  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.genre

  return (
    <div className="w-full mb-8 max-w-7xl mx-auto px-4">
      <Card className="w-full border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Filter className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Bộ lọc phim
            </h3>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="ml-auto border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200 rounded-xl"
              >
                <X className="h-4 w-4 mr-1" />
                Xóa bộ lọc
              </Button>
            )}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Search Input */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              Tìm kiếm phim
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Nhập tên phim..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-12 h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg"
              />
            </div>
          </div>

          {/* Genre Filter */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Filter className="h-4 w-4 text-purple-600" />
              Thể loại
            </label>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                className="w-full justify-between h-12 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:ring-2 hover:ring-purple-200 transition-all duration-200 text-lg"
              >
                {selectedGenre ? selectedGenre.name : "Chọn thể loại"}
                <ChevronDown className="h-5 w-5" />
              </Button>
              
              {showGenreDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto backdrop-blur-sm">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">Đang tải...</div>
                  ) : (
                    <>
                      <div
                        className="p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer text-gray-600 font-medium transition-all duration-200 border-b border-gray-100"
                        onClick={() => {
                          setSelectedGenre(null)
                          handleFilterChange("genre", "")
                          setShowGenreDropdown(false)
                        }}
                      >
                        Tất cả thể loại
                      </div>
                      {genres.map((genre) => (
                        <div
                          key={genre.id}
                          className="p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer font-medium transition-all duration-200 border-b border-gray-100 last:border-b-0"
                          onClick={() => handleGenreSelect(genre)}
                        >
                          {genre.name}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-6 pt-6 border-t-2 border-gradient-to-r from-blue-200 to-purple-200">
            <div className="flex flex-wrap gap-3">
              {filters.search && (
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                  Tìm kiếm: "{filters.search}"
                  <button
                    onClick={() => handleFilterChange("search", "")}
                    className="ml-2 hover:text-blue-200 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              )}
              {filters.genre && (
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                  {filters.genre}
                  <button
                    onClick={() => {
                      setSelectedGenre(null)
                      handleFilterChange("genre", "")
                    }}
                    className="ml-2 hover:text-purple-200 transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  )
}
