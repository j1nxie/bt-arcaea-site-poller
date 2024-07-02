type ArcaeaResponse<T> = ArcaeaSuccessResponse<T> | ArcaeaFailureResponse;

interface ArcaeaSuccessResponse<T> {
    success: true;
    value: T;
}

interface ArcaeaFailureResponse {
    success: false;
    error_code: number;
}

interface ProfileData {
    banners: Banner[];
    arcaea_online_expire_ts: number;
    recent_score: RecentScore[];
}

interface RatedScores {
    best_rated_scores: RatedScore[];
    recent_rated_scores: RatedScore[];
}

interface Banner {
    resource: string;
    id: string;
}

type Difficulty = 0 | 1 | 2 | 3 | 4;
type ClearType = 0 | 1 | 2 | 3 | 4 | 5;

interface RecentScore {
    song_id: string;
    difficulty: Difficulty;
    score: number;
    shiny_perfect_count: number;
    perfect_count: number;
    near_count: number;
    miss_count: number;
    clear_type: ClearType;
    best_clear_type: ClearType;
    health: number;
    time_played: number;
    modifier: number;
}

interface RatedScore {
    song_id: string;
    rating: number;
    title: Record<string, string>;
    artist: string;
    bg: string;
    difficulty: Difficulty;
    score: number;
    shiny_perfect_count: number;
    perfect_count: number;
    near_count: number;
    miss_count: number;
    clear_type: ClearType;
    time_played: number;
    modifier: number;
}

interface BatchManualImport {
    meta: {
        game: "arcaea";
        playtype: "Touch";
        service: string;
    };
    scores: BatchManualScore[];
}

interface BatchManualScore {
    identifier: string;
    matchType: "inGameStrID";
    difficulty: "Past" | "Present" | "Future" | "Beyond" | "Eternal";
    score: number;
    lamp: "LOST" | "EASY CLEAR" | "CLEAR" | "HARD CLEAR" | "FULL RECALL" | "PURE MEMORY";
    judgements?: {
        pure: number;
        far: number;
        lost: number;
    };
    timeAchieved?: number;
    optional?: {
        fast?: number;
        slow?: number;
        maxCombo?: number;
        shinyPure?: number;
        gauge?: number;
    }
}
