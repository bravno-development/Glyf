we need to implement a proper progress tracker for each user.

consider the following example;

using Tairafone.API.Enums;

namespace Tairafone.API.Models;

/// <summary> /// Tracks learning progress for a specific word for a specific
user using Leitner SRS /// </summary> public class WordProgress : BaseRecord {
public Guid UserId { get; set; } public User User { get; set; }

    /// <summary>
    /// Language code (e.g., 'es', 'fr')
    /// </summary>
    public required LanguageCodeEnum Language { get; set; }

    /// <summary>
    /// Unique identifier for the word (e.g., "es:g-coser-cocer:coser")
    /// </summary>
    public required string WordUid { get; set; }

    /// <summary>
    /// Current Leitner box level (0 = new, 1-5 = increasing intervals)
    /// </summary>
    public int LeitnerLevel { get; set; } = 0;

    /// <summary>
    /// When this word is next due for review
    /// </summary>
    public DateTimeOffset NextReviewAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Total number of times this word has been attempted
    /// </summary>
    public int TotalAttempts { get; set; } = 0;

    /// <summary>
    /// Total number of correct attempts
    /// </summary>
    public int CorrectAttempts { get; set; } = 0;

    /// <summary>
    /// Number of consecutive correct answers (resets on any incorrect answer)
    /// </summary>
    public int ConsecutiveCorrect { get; set; } = 0;

    /// <summary>
    /// Last time this word was attempted
    /// </summary>
    public DateTimeOffset? LastAttemptedAt { get; set; }

    /// <summary>
    /// Current accuracy rate (0.0 - 1.0)
    /// </summary>
    public double AccuracyRate => TotalAttempts > 0 ? (double)CorrectAttempts / TotalAttempts : 0.0;

}

namespace Tairafone.API.Models;

public class UsersToLanguages : BaseRecord { public Guid UserId { get; set; }
public User User { get; set; } public Guid LanguageId { get; set; } public
Language Language { get; set; } public int Level { get; set; } = 1; public int
Group { get; set; } = 1; public int WordsStudiedToday { get; set; } = 0; public
DateTimeOffset? LastStudyDate { get; set; } }

using Tairafone.API.Enums;

namespace Tairafone.API.Models;

public class CourseContentManifestVersion : BaseRecord { public int Version {
get; set; } = 1; public LanguageCodeEnum Language { get; set; } public string
Data { get; set; } }

using Tairafone.API.Enums;

namespace Tairafone.API.Models;

/// <summary> /// Records an individual attempt at a word during a study session
/// </summary> public class AttemptRecord : BaseRecord { public Guid UserId {
get; set; } public User User { get; set; }

    /// <summary>
    /// Language code (e.g., 'es', 'fr')
    /// </summary>
    public required LanguageCodeEnum Language { get; set; }

    /// <summary>
    /// Unique identifier for the word (e.g., "es:g-coser-cocer:coser")
    /// </summary>
    public required string WordUid { get; set; }

    /// <summary>
    /// Type of study step (meaningMcq, lightning, etc.)
    /// </summary>
    public required StepTypeEnum StepType { get; set; }

    /// <summary>
    /// Whether the attempt was correct
    /// </summary>
    public bool Correct { get; set; }

    /// <summary>
    /// Response time in milliseconds
    /// </summary>
    public int ResponseTimeMs { get; set; }

    /// <summary>
    /// When this attempt was made
    /// </summary>
    public DateTimeOffset AttemptedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optional: what the user selected (for error analysis)
    /// </summary>
    public string? UserResponse { get; set; }

    /// <summary>
    /// Optional: what the correct answer was
    /// </summary>
    public string? CorrectAnswer { get; set; }

    /// <summary>
    /// Session identifier to group attempts from the same study session
    /// </summary>
    public string SessionId { get; set; }

    /// <summary>
    /// Client-generated UUID for idempotent submission (prevents duplicates)
    /// </summary>
    public required Guid UuidLocal { get; set; }

}

being able to track each attempt, one user can study many languages, language
manifest version to be able to track updating course material, word progress
track each glyph and how its going needs to be adapted from leitner srs to sm-2
srs
