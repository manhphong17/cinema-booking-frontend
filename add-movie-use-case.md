# Use Case: Add Movie

## Primary Actors

**Operation Manager**

## Secondary Actors

**AWS S3**

## Description

This use case allows the Operation Manager to add a new Movie into the system. The manager enters details such as name, description, duration, release date, director, actors, age rating, trailer URL, genres, language, country, and poster image.

## Preconditions

- The user is logged in with the Operation Manager role.
- The Movie Management module is active.
- All required fields (name, description, duration, release date, director, actor, genreIds, languageId, countryId, poster) are filled with valid data.
- The release date must be in the future.
- The poster image file is in valid format (JPEG, PNG).

## Postconditions

- A new movie record is created in the database with status "UPCOMING".
- The poster image is uploaded to AWS S3 and the URL is stored.
- The movie is associated with selected genres, language, and country.
- The movie appears in the movie list with all entered details.

## Normal Sequence/Flow

1. The user opens the Add Movie form.
2. The system displays input fields: Name, Description, Duration, Release Date, Director, Actor, Age Rating, Trailer URL, Genres, Language, Country, and Poster Image.
3. The user fills in the required fields and selects multiple genres, language, and country from dropdowns.
4. The user uploads a poster image file or provides an image URL.
5. The user clicks the Add button.
6. The system validates all inputs (e.g., non-empty name, duration > 0, future release date, valid file format).
7. If validation succeeds, the system uploads the poster image to AWS S3.
8. The system creates a new movie record with status "UPCOMING" and saves it to the database.
9. The system associates the movie with selected genres, language, and country.
10. The system confirms creation and refreshes the movie list.
11. The user sees the new movie in the movie management screen.

## Alternative Sequences/Flows

**A1 – Missing required fields:** The system displays validation messages such as "Name is required", "Duration must be greater than 0", or "Release date must be in the future".

**A2 – Invalid file format:** If the poster image file is not in JPEG or PNG format, the system displays an error message "Invalid file format. Please upload JPEG or PNG files only".

**A3 – Image upload failure:** If the image file cannot be uploaded to AWS S3, the system displays an error message "Failed to upload image. Please try again" and does not create the movie record.

**A4 – Genre/Language/Country not found:** If any selected genre, language, or country ID is invalid, the system displays an error message "Invalid selection. Please refresh the page and try again".

**A5 – Future date validation:** If the release date is not in the future, the system displays "Release date must be in the future" and prevents form submission.

## UI Layout – Add Movie Screen

This screen allows the Operation Manager to create a new movie by entering movie details such as name, description, duration, release date, director, actors, age rating, trailer URL, genres, language, country, and poster image.

The form supports both manual file upload and pasting an image URL from the Internet. Once the "Add" button is clicked, the system validates all input data, uploads the poster image to AWS S3, and stores the movie record in the database. The system returns a confirmation message and refreshes the movie list on the main management screen.

### Field Specifications

| Field Name                     | Description                                                                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product Name**               | Text input.<br/>Data type: String (2–200 characters).<br/>Required.<br/>Used to specify the name of the movie.                                                                               |
| **Description**                | Multi-line text area.<br/>Data type: String (10–2000 characters).<br/>Required.<br/>Detailed description of the movie plot and content.                                                      |
| **Duration (minutes)**         | Numeric input.<br/>Data type: Integer (> 0).<br/>Required.<br/>Movie duration in minutes.                                                                                                    |
| **Release Date**               | Date picker.<br/>Data type: LocalDate (future date).<br/>Required.<br/>Theatrical release date of the movie.                                                                                 |
| **Director**                   | Text input.<br/>Data type: String (1–100 characters).<br/>Required.<br/>Name of the movie director.                                                                                          |
| **Actor**                      | Text input.<br/>Data type: String (1–500 characters).<br/>Required.<br/>Names of main actors in the movie.                                                                                   |
| **Age Rating**                 | Numeric input.<br/>Data type: Integer (0–18).<br/>Optional. Default: 0.<br/>Age restriction for the movie (0 = All ages).                                                                    |
| **Trailer URL**                | Text input.<br/>Data type: String (URL).<br/>Optional.<br/>YouTube or other video platform URL for movie trailer.                                                                            |
| **Genres**                     | Multi-select dropdown.<br/>Data type: List<Long> (minimum 1 selection).<br/>Required.<br/>Movie genres (Action, Comedy, Drama, Horror, etc.).                                                |
| **Language**                   | Dropdown (select).<br/>Data type: Long.<br/>Required.<br/>Primary language of the movie.                                                                                                     |
| **Country**                    | Dropdown (select).<br/>Data type: Long.<br/>Required.<br/>Country of origin for the movie.                                                                                                   |
| **Poster Image – File Upload** | File input.<br/>Data type: MultipartFile.<br/>Required.<br/>Allows the user to choose an image file from the local computer.<br/>Accepted formats: .jpg, .png, .jpeg.<br/>Maximum size: 5MB. |
| **Poster Image – Image URL**   | Text input.<br/>Data type: String (URL).<br/>Optional.<br/>Alternative to file upload - paste an image link from the Internet.                                                               |

### Button Specifications

| Button Name       | Description                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Add Button**    | Primary button.<br/>Action: Submits the form data to the backend API POST /movies/add.<br/>Validation: All required fields must be valid before submission.<br/>Result: Creates a new movie record, uploads poster to S3, and returns success message. |
| **Cancel Button** | Secondary button.<br/>Action: Closes the form without saving changes.<br/>No API call is made.<br/>Clears all form data.                                                                                                                               |
| **Reset Button**  | Secondary button.<br/>Action: Clears all form fields to default values.<br/>No API call is made.                                                                                                                                                       |

## Technical Implementation Notes

- The movie status is automatically set to "UPCOMING" upon creation.
- Poster images are uploaded to AWS S3 with unique filenames to prevent conflicts.
- The system validates that all selected genres, language, and country exist in the database.
- Form validation occurs both on the frontend (immediate feedback) and backend (data integrity).
- The movie ID is returned upon successful creation for further operations.

## Error Handling

- **Validation Errors**: Displayed inline with the respective form fields.
- **Network Errors**: Show generic error message with retry option.
- **File Upload Errors**: Display specific error message with file format requirements.
- **Server Errors**: Show user-friendly error message with contact information for support.

## Success Criteria

- Movie record is successfully created in the database.
- Poster image is uploaded to AWS S3 and URL is stored.
- All relationships (genres, language, country) are properly established.
- User receives confirmation message.
- Movie appears in the movie management list.
- Form is reset for next entry.
