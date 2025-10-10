# Class Diagram - Delete Movie Logic Only

## Mermaid Class Diagram

```mermaid
classDiagram
    %% Controller Layer
    class MovieController {
        -MovieService movieService
        +deleteMovie(id: long) ResponseData
    }

    %% Service Layer
    class MovieService {
        <<interface>>
        +delete(id: long) void
    }

    class MovieServiceImpl {
        -MovieRepository movieRepository
        +delete(id: long) void
        -findById(id: Long) Movie
    }

    %% Repository Layer
    class MovieRepository {
        <<interface>>
        +findById(id: Long) Optional~Movie~
        +save(entity: Movie) Movie
    }

    %% Model Layer
    class Movie {
        -Long id
        -Boolean isDeleted
        +setIsDeleted(isDeleted: Boolean) void
        +getId() Long
    }

    %% Exception Layer
    class AppException {
        -ErrorCode errorCode
        -String message
    }

    class ErrorCode {
        <<enumeration>>
        MOVIE_NOT_FOUND
    }

    %% Response Layer
    class ResponseData {
        -int status
        -String message
        -Object data
    }

    %% Relationships
    MovieController --> MovieService : uses
    MovieService <|.. MovieServiceImpl : implements
    MovieServiceImpl --> MovieRepository : uses
    MovieServiceImpl --> AppException : throws
    MovieRepository --> Movie : manages
    AppException --> ErrorCode : uses
    MovieController --> ResponseData : returns

    %% Notes
    note for MovieController "REST Controller\n@PutMapping(\"/delete/{id}\")\nHandles HTTP requests"
    note for MovieServiceImpl "Service Implementation\n@Transactional\nSoft delete by setting isDeleted = true"
    note for Movie "Entity Model\nSoft delete pattern\nisDeleted flag for logical deletion"
    note for AppException "Custom Exception\nThrown when movie not found"
```

## Sequence Diagram - Delete Movie Flow

```mermaid
sequenceDiagram
    participant Client
    participant MovieController
    participant MovieServiceImpl
    participant MovieRepository
    participant Database

    Client->>MovieController: PUT /movies/delete/{id}
    MovieController->>MovieServiceImpl: delete(id)
    MovieServiceImpl->>MovieRepository: findById(id)
    MovieRepository->>Database: SELECT * FROM movies WHERE id = ?
    Database-->>MovieRepository: Movie entity
    MovieRepository-->>MovieServiceImpl: Optional<Movie>

    alt Movie found
        MovieServiceImpl->>Movie: setIsDeleted(true)
        MovieServiceImpl->>MovieRepository: save(movie)
        MovieRepository->>Database: UPDATE movies SET is_deleted = true WHERE id = ?
        Database-->>MovieRepository: Updated movie
        MovieRepository-->>MovieServiceImpl: Saved movie
        MovieServiceImpl-->>MovieController: void
        MovieController-->>Client: ResponseData(200, "Movie deleted successfully")
    else Movie not found
        MovieServiceImpl->>MovieServiceImpl: throw AppException(ErrorCode.MOVIE_NOT_FOUND)
        MovieServiceImpl-->>MovieController: AppException
        MovieController-->>Client: Error Response
    end
```

## Core Delete Logic

### 1. **Soft Delete Pattern**

- Sets `isDeleted = true` instead of physical deletion
- Preserves data integrity and audit trail
- Allows for potential recovery

### 2. **Transaction Management**

- `@Transactional` annotation ensures data consistency
- Rollback on any error during the process

### 3. **Error Handling**

- Throws `AppException` with `MOVIE_NOT_FOUND` error code
- Clean error propagation through layers

## API Endpoint

```
PUT /api/movies/delete/{id}
```

**Request:**

- Path Parameter: `id` (Long) - Movie ID to delete

**Response:**

```json
{
  "status": 200,
  "message": "Movie deleted successfully",
  "data": null
}
```

**Error Response:**

```json
{
  "status": 404,
  "message": "Movie not found",
  "data": null
}
```
