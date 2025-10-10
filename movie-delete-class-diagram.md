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

## Key Design Patterns

### 1. **Soft Delete Pattern**

- Instead of physically removing the record from database
- Sets `isDeleted = true` flag
- Preserves data integrity and audit trail
- Allows for potential recovery

### 2. **Repository Pattern**

- Abstracts data access logic
- Provides clean interface for data operations
- Makes testing easier with mock implementations

### 3. **Service Layer Pattern**

- Encapsulates business logic
- Coordinates between controller and repository
- Handles transactions and error management

### 4. **Exception Handling Pattern**

- Custom exceptions for different error scenarios
- Centralized error codes and messages
- Clean error propagation through layers

## Database Schema Impact

```sql
-- The movies table structure
CREATE TABLE movies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    duration INT NOT NULL,
    release_date DATE NOT NULL,
    poster_url VARCHAR(255),
    trailer_url VARCHAR(255),
    age_rating INT DEFAULT 0,
    director VARCHAR(255),
    actor VARCHAR(255),
    status VARCHAR(50),
    language_id BIGINT NOT NULL,
    country_id BIGINT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (language_id) REFERENCES languages(id),
    FOREIGN KEY (country_id) REFERENCES countries(id)
);
```

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
